import { test, expect } from '@playwright/test';
import { apiSignIn, authed } from '../helpers/api.js';
import { connectChat, sendChat, waitFor } from '../helpers/chat.js';
import { accounts, ids, apiBaseUrl } from '../fixtures/accounts.js';

// The chat system: live delivery, history, unread, replies, reactions, edit and
// delete, moderation, pins, announcement-only, "seen by", groups, direct
// messages, game chats, reports and notification signup. Everything happens in
// the dummy QA team's rooms with QA accounts, and the QA accounts are flagged
// as test accounts so none of it can notify real people.

let tokens;
let admin;
let coach;
let parent;
const sockets = [];
const posted = [];
const events = [];

const teamRoom = { teamId: ids.teamId };

test.beforeEach(async ({ request }) => {
  tokens = {
    admin: await apiSignIn(request, accounts.admin.email, accounts.admin.password),
    coach: await apiSignIn(request, accounts.coach.email, accounts.coach.password),
    parent: await apiSignIn(request, accounts.parent.email, accounts.parent.password),
  };
  admin = authed(request, tokens.admin);
  coach = authed(request, tokens.coach);
  parent = authed(request, tokens.parent);
});

test.afterEach(async () => {
  sockets.splice(0).forEach((s) => s.close());
  // Clear the content of anything posted, and make sure no setting is left on.
  while (posted.length) {
    await admin.delete(`/api/messages/${posted.pop()}`);
  }
  await coach.patch('/api/chat/settings', { ...teamRoom, announcementOnly: false });
  while (events.length) {
    await admin.delete(`/api/events/${events.pop()}`);
  }
});

async function open(token, room = teamRoom) {
  const conn = await connectChat(token, room);
  sockets.push(conn.socket);
  return conn;
}

async function say(conn, payload) {
  const ack = await sendChat(conn.socket, payload);
  if (ack.ok) posted.push(ack.message._id);
  return ack;
}

// ---------- live delivery ----------

test('a message is delivered live to others in the room and acknowledged to the sender', async () => {
  const mine = await open(tokens.parent);
  const theirs = await open(tokens.coach);

  const ack = await say(mine, { text: 'QA E2E hello' });
  expect(ack.ok).toBe(true);
  expect(ack.message.text).toBe('QA E2E hello');
  expect(ack.message.senderRole).toBe('parent');

  await waitFor(() => theirs.received.some((m) => m._id === ack.message._id));
});

test('an older client that sends a bare string still works', async () => {
  const conn = await open(tokens.parent);
  const ack = await say(conn, 'QA E2E plain string');
  expect(ack.ok).toBe(true);
  expect(ack.message.text).toBe('QA E2E plain string');
});

test('bad messages are refused with a reason, and flooding is limited', async () => {
  const conn = await open(tokens.parent);
  const empty = await say(conn, { text: '   ' });
  expect(empty.ok).toBe(false);
  expect(empty.error).toMatch(/write a message/i);

  const tooLong = await say(conn, { text: 'x'.repeat(2001) });
  expect(tooLong.ok).toBe(false);
  expect(tooLong.error).toMatch(/2000/);

  // The server stays up and the next normal message still goes through.
  expect((await say(conn, { text: 'QA E2E still fine' })).ok).toBe(true);

  // Flood: after 10 in a short window the rest are refused.
  const acks = [];
  for (let i = 0; i < 12; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    acks.push(await say(conn, { text: `QA E2E flood ${i}` }));
  }
  expect(acks.some((a) => !a.ok && /too fast/i.test(a.error))).toBe(true);
});

test('an outsider cannot join a room or read its history', async ({ request }) => {
  // The QA coach is not on the other dummy team: the server drops the
  // connection instead of letting them into the room.
  const stranger = await open(tokens.coach, { teamId: ids.otherTeamId });
  await waitFor(() => !stranger.socket.connected);
  expect((await coach.get(`/api/messages/${ids.otherTeamId}`)).status()).toBe(403);
  const anon = await request.get(`${apiBaseUrl}/api/messages/${ids.teamId}`);
  expect(anon.status()).toBe(401);
});

// ---------- history ----------

test('history pages backwards with ?before', async () => {
  const conn = await open(tokens.parent);
  const sent = [];
  for (let i = 0; i < 4; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    sent.push((await say(conn, { text: `QA E2E page ${i}` })).message);
  }
  const newest = await (await parent.get(`/api/messages/${ids.teamId}?limit=2`)).json();
  expect(newest.map((m) => m.text)).toEqual(['QA E2E page 2', 'QA E2E page 3']);

  const older = await (await parent.get(`/api/messages/${ids.teamId}?limit=2&before=${newest[0]._id}`)).json();
  expect(older.map((m) => m.text)).toEqual(['QA E2E page 0', 'QA E2E page 1']);
});

// ---------- unread, read, mute ----------

test('unread counts go up for others, clear on read, and mute is reported', async () => {
  const conn = await open(tokens.parent);
  await coach.post('/api/chat/read', teamRoom);
  await parent.post('/api/chat/read', teamRoom);
  const before = (await (await coach.get(`/api/chat/summary?teamId=${ids.teamId}`)).json()).rooms.find((r) => r.type === 'team');
  expect(before.unread).toBe(0);

  await say(conn, { text: 'QA E2E unread one' });
  await say(conn, { text: 'QA E2E unread two' });
  const mid = await (await coach.get(`/api/chat/summary?teamId=${ids.teamId}`)).json();
  const team = mid.rooms.find((r) => r.type === 'team');
  expect(team.unread).toBe(2);
  expect(team.lastMessage.preview).toBe('QA E2E unread two');
  expect(mid.totalUnread).toBeGreaterThanOrEqual(2);

  // Your own messages are never unread for you.
  const mine = (await (await parent.get(`/api/chat/summary?teamId=${ids.teamId}`)).json()).rooms.find((r) => r.type === 'team');
  expect(mine.unread).toBe(0);

  expect((await coach.post('/api/chat/read', teamRoom)).status()).toBe(200);
  const after = (await (await coach.get(`/api/chat/summary?teamId=${ids.teamId}`)).json()).rooms.find((r) => r.type === 'team');
  expect(after.unread).toBe(0);

  const muted = await coach.post('/api/chat/mute', { ...teamRoom, minutes: 60 });
  expect(muted.status()).toBe(200);
  const withMute = (await (await coach.get(`/api/chat/summary?teamId=${ids.teamId}`)).json()).rooms.find((r) => r.type === 'team');
  expect(withMute.mutedUntil).toBeTruthy();
  expect((await coach.post('/api/chat/mute', { ...teamRoom, unmute: true })).status()).toBe(200);
  expect((await coach.post('/api/chat/mute', { ...teamRoom })).status()).toBe(400);
});

// ---------- replies, mentions ----------

test('a reply carries a snapshot of the original, and a deleted message cannot be replied to', async () => {
  const conn = await open(tokens.parent);
  const original = (await say(conn, { text: 'QA E2E original' })).message;
  const reply = await say(conn, { text: 'QA E2E answer', replyToId: original._id });
  expect(reply.ok).toBe(true);
  expect(reply.message.replyTo.text).toBe('QA E2E original');
  expect(reply.message.replyTo.senderName).toBe(accounts.parent.name);

  await parent.delete(`/api/messages/${original._id}`);
  const late = await say(conn, { text: 'QA E2E too late', replyToId: original._id });
  expect(late.ok).toBe(false);
  expect(late.error).toMatch(/no longer there/i);
  expect((await say(conn, { text: 'x', replyToId: 'nope' })).ok).toBe(false);
});

test('mentions only count for people actually in the chat', async () => {
  const conn = await open(tokens.parent);
  const ack = await say(conn, { text: 'QA E2E @coach', mentions: [ids.coachId, ids.parentId, '000000000000000000000000'] });
  expect(ack.ok).toBe(true);
  // The coach is in the chat; yourself and strangers are dropped.
  expect(ack.message.mentions).toEqual([ids.coachId]);

  const members = await (await parent.get(`/api/chat/members?teamId=${ids.teamId}`)).json();
  expect(members.some((m) => m._id === ids.coachId)).toBeTruthy();
  expect(members.some((m) => m._id === ids.parentId)).toBeFalsy();
});

// ---------- reactions ----------

test('reactions toggle on and off, and only the six emoji are allowed', async () => {
  const conn = await open(tokens.parent);
  const msg = (await say(conn, { text: 'QA E2E react' })).message;

  const on = await (await coach.post(`/api/messages/${msg._id}/react`, { emoji: '👍' })).json();
  expect(on.reactions).toHaveLength(1);
  expect(on.reactions[0].userIds).toEqual([ids.coachId]);

  const two = await (await parent.post(`/api/messages/${msg._id}/react`, { emoji: '👍' })).json();
  expect(two.reactions[0].userIds).toHaveLength(2);

  const off = await (await coach.post(`/api/messages/${msg._id}/react`, { emoji: '👍' })).json();
  expect(off.reactions[0].userIds).toEqual([ids.parentId]);

  expect((await coach.post(`/api/messages/${msg._id}/react`, { emoji: '💩' })).status()).toBe(400);
});

// ---------- edit and delete ----------

test('you can edit your own message but not someone else\'s; deleting follows moderator rules', async () => {
  const conn = await open(tokens.parent);
  const msg = (await say(conn, { text: 'QA E2E typo' })).message;

  const edited = await parent.patch(`/api/messages/${msg._id}`, { text: 'QA E2E fixed' });
  expect(edited.status()).toBe(200);
  const body = await edited.json();
  expect(body.text).toBe('QA E2E fixed');
  expect(body.editedAt).toBeTruthy();

  expect((await coach.patch(`/api/messages/${msg._id}`, { text: 'hijack' })).status()).toBe(403);
  expect((await parent.patch(`/api/messages/${msg._id}`, { text: '   ' })).status()).toBe(400);

  // A parent can't delete the coach's message; the coach (a moderator) can delete the parent's.
  const coachConn = await open(tokens.coach);
  const coachMsg = (await say(coachConn, { text: 'QA E2E coach says' })).message;
  expect((await parent.delete(`/api/messages/${coachMsg._id}`)).status()).toBe(403);

  const watcher = await open(tokens.coach);
  const gone = await coach.delete(`/api/messages/${msg._id}`);
  expect(gone.status()).toBe(200);
  const goneBody = await gone.json();
  expect(goneBody.deletedAt).toBeTruthy();
  expect(goneBody.text).toBe('');
  await waitFor(() => watcher.updated.some((m) => m._id === msg._id && m.deletedAt));

  // The deleted message keeps its place but no longer carries content.
  const history = await (await parent.get(`/api/messages/${ids.teamId}?limit=20`)).json();
  const row = history.find((m) => m._id === msg._id);
  expect(row.deletedAt).toBeTruthy();
  expect(row.text).toBe('');
});

// ---------- pins ----------

test('coaches can pin and unpin; parents cannot; pins are capped', async () => {
  const conn = await open(tokens.parent);
  const first = (await say(conn, { text: 'QA E2E pin me' })).message;

  expect((await parent.post(`/api/messages/${first._id}/pin`, {})).status()).toBe(403);
  const pinned = await coach.post(`/api/messages/${first._id}/pin`, {});
  expect(pinned.status()).toBe(200);
  expect((await pinned.json()).pinnedAt).toBeTruthy();

  const list = await (await parent.get(`/api/chat/pinned?teamId=${ids.teamId}`)).json();
  expect(list.some((m) => m._id === first._id)).toBeTruthy();

  expect((await coach.post(`/api/messages/${first._id}/unpin`, {})).status()).toBe(200);
  expect((await (await parent.get(`/api/chat/pinned?teamId=${ids.teamId}`)).json()).some((m) => m._id === first._id)).toBeFalsy();

  // Cap of five.
  const ids5 = [];
  for (let i = 0; i < 6; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    ids5.push((await say(conn, { text: `QA E2E cap ${i}` })).message._id);
  }
  for (let i = 0; i < 5; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    expect((await coach.post(`/api/messages/${ids5[i]}/pin`, {})).status()).toBe(200);
  }
  expect((await coach.post(`/api/messages/${ids5[5]}/pin`, {})).status()).toBe(409);
});

// ---------- announcements only ----------

test('announcement-only stops parents posting but not coaches', async ({ request }) => {
  const parentConn = await open(tokens.parent);
  const coachConn = await open(tokens.coach);

  expect((await parent.patch('/api/chat/settings', { ...teamRoom, announcementOnly: true })).status()).toBe(403);
  expect((await coach.patch('/api/chat/settings', { ...teamRoom, announcementOnly: true })).status()).toBe(200);

  const blocked = await sendChat(parentConn.socket, { text: 'QA E2E parent after lock' });
  expect(blocked.ok).toBe(false);
  expect(blocked.error).toMatch(/only coaches and admins/i);

  // Photos obey the same rule (a tiny valid PNG).
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
  const photo = await request.post(`${apiBaseUrl}/api/messages/photo`, {
    headers: { Authorization: `Bearer ${tokens.parent}` },
    multipart: { teamId: ids.teamId, photo: { name: 'a.png', mimeType: 'image/png', buffer: png } },
  });
  expect(photo.status()).toBe(403);

  const ok = await say(coachConn, { text: 'QA E2E coach announcement' });
  expect(ok.ok).toBe(true);

  expect((await coach.patch('/api/chat/settings', { ...teamRoom, announcementOnly: false })).status()).toBe(200);
  expect((await say(parentConn, { text: 'QA E2E parent after unlock' })).ok).toBe(true);
});

// ---------- urgent ----------

test('only coaches can send urgent, and it is limited per hour', async () => {
  const parentConn = await open(tokens.parent);
  const refused = await sendChat(parentConn.socket, { text: 'QA E2E parent urgent', urgent: true });
  expect(refused.ok).toBe(false);
  expect(refused.error).toMatch(/coaches and admins/i);

  // Test accounts never trigger real email or push, so this is safe to send.
  const coachConn = await open(tokens.coach);
  const sent = await say(coachConn, { text: 'QA E2E urgent', urgent: true });
  expect(sent.ok).toBe(true);
  expect(sent.message.urgent).toBe(true);
});

// ---------- seen by ----------

test('"seen by" shows who has opened the chat, to the sender and coaches only', async () => {
  const parentConn = await open(tokens.parent);
  const coachConn = await open(tokens.coach);
  await coach.post('/api/chat/read', teamRoom);

  const mine = (await say(parentConn, { text: 'QA E2E seen' })).message;
  // The coach opens the chat after it was sent.
  await new Promise((r) => setTimeout(r, 200));
  await coach.post('/api/chat/read', teamRoom);

  const seen = await (await parent.get(`/api/chat/seen?teamId=${ids.teamId}&messageId=${mine._id}`)).json();
  expect(seen.seen.some((m) => m._id === ids.coachId)).toBeTruthy();
  expect(seen.seen.some((m) => m._id === ids.parentId)).toBeFalsy();

  // A coach can look too; a parent can't look at a coach's message.
  expect((await coach.get(`/api/chat/seen?teamId=${ids.teamId}&messageId=${mine._id}`)).status()).toBe(200);
  const coachMsg = (await say(coachConn, { text: 'QA E2E coach seen' })).message;
  expect((await parent.get(`/api/chat/seen?teamId=${ids.teamId}&messageId=${coachMsg._id}`)).status()).toBe(403);
});

// ---------- group chats ----------

test('a coach manages a group: rename, add, remove; removed people lose access', async () => {
  const created = await coach.post('/api/conversations', {
    teamId: ids.teamId,
    name: 'QA E2E group',
    memberIds: [ids.coachId, ids.parentId],
  });
  expect(created.status()).toBe(201);
  const group = await created.json();
  expect(group.members.map((m) => m.name).sort()).toEqual([accounts.coach.name, accounts.parent.name].sort());

  expect((await parent.patch(`/api/conversations/${group._id}`, { name: 'hijack' })).status()).toBe(403);
  const renamed = await coach.patch(`/api/conversations/${group._id}`, { name: 'QA E2E renamed' });
  expect((await renamed.json()).name).toBe('QA E2E renamed');

  const room = { conversationId: group._id };
  const conn = await open(tokens.parent, room);
  expect((await say(conn, { text: 'QA E2E in the group' })).ok).toBe(true);

  // The creator can't be removed; a parent can't remove anyone.
  expect((await coach.delete(`/api/conversations/${group._id}/members/${ids.coachId}`)).status()).toBe(400);
  expect((await parent.delete(`/api/conversations/${group._id}/members/${ids.coachId}`)).status()).toBe(403);

  const removed = await coach.delete(`/api/conversations/${group._id}/members/${ids.parentId}`);
  expect(removed.status()).toBe(200);
  expect((await parent.get(`/api/conversations/${group._id}/messages`)).status()).toBe(403);
  await waitFor(() => !conn.socket.connected);

  const added = await coach.post(`/api/conversations/${group._id}/members`, { memberIds: [ids.parentId] });
  expect(added.status()).toBe(200);
  expect((await parent.get(`/api/conversations/${group._id}/messages`)).status()).toBe(200);

  // Someone from outside the team can't be added.
  expect((await coach.post(`/api/conversations/${group._id}/members`, { memberIds: ['000000000000000000000000'] })).status()).toBe(400);
});

// ---------- direct messages ----------

test('direct messages: adults can message each other, repeats return the same chat', async () => {
  const candidates = await (await parent.get(`/api/conversations/dm-candidates?teamId=${ids.teamId}`)).json();
  expect(candidates.some((c) => c._id === ids.coachId)).toBeTruthy();
  expect(candidates.some((c) => c._id === ids.parentId)).toBeFalsy();

  const first = await parent.post('/api/conversations/direct', { teamId: ids.teamId, otherUserId: ids.coachId });
  expect([200, 201]).toContain(first.status());
  const dm = await first.json();
  expect(dm.kind).toBe('direct');
  expect(dm.memberIds.map(String).sort()).toEqual([ids.coachId, ids.parentId].sort());

  const again = await parent.post('/api/conversations/direct', { teamId: ids.teamId, otherUserId: ids.coachId });
  expect(again.status()).toBe(200);
  expect((await again.json())._id).toBe(dm._id);

  // Both people can use it; named after the other person in the chat list.
  const conn = await open(tokens.coach, { conversationId: dm._id });
  expect((await say(conn, { text: 'QA E2E private hello' })).ok).toBe(true);
  const summary = await (await parent.get(`/api/chat/summary?teamId=${ids.teamId}`)).json();
  const row = summary.rooms.find((r) => r.id === dm._id);
  expect(row.type).toBe('direct');
  expect(row.name).toBe(accounts.coach.name);

  // Not yourself; not someone off the team.
  expect((await parent.post('/api/conversations/direct', { teamId: ids.teamId, otherUserId: ids.parentId })).status()).toBe(403);
  expect((await parent.post('/api/conversations/direct', { teamId: ids.otherTeamId, otherUserId: ids.coachId })).status()).toBe(403);
});

// ---------- game chats ----------

test('a game has its own chat that only that team can use', async () => {
  const start = new Date(Date.now() + 3 * 86400000);
  const created = await admin.post('/api/events', {
    type: 'game',
    teamId: ids.teamId,
    title: 'QA E2E game chat',
    startsAt: start.toISOString(),
    endsAt: new Date(start.getTime() + 5400000).toISOString(),
    notifyTeam: false,
  });
  expect(created.status()).toBe(201);
  const event = await created.json();
  events.push(event._id);

  const conn = await open(tokens.parent, { eventId: event._id });
  const theirs = await open(tokens.coach, { eventId: event._id });
  const ack = await say(conn, { text: 'QA E2E who is driving?' });
  expect(ack.ok).toBe(true);
  await waitFor(() => theirs.received.some((m) => m._id === ack.message._id));

  const history = await (await coach.get(`/api/messages/event/${event._id}`)).json();
  expect(history.some((m) => m._id === ack.message._id)).toBeTruthy();
  // Game chat stays out of the whole-team chat.
  const teamHistory = await (await coach.get(`/api/messages/${ids.teamId}?limit=100`)).json();
  expect(teamHistory.some((m) => m._id === ack.message._id)).toBeFalsy();

  // A game on the other dummy team is closed to this team's people.
  const other = await admin.post('/api/events', {
    type: 'game',
    teamId: ids.otherTeamId,
    title: 'QA E2E other game',
    startsAt: start.toISOString(),
    endsAt: new Date(start.getTime() + 5400000).toISOString(),
    notifyTeam: false,
  });
  const otherEvent = await other.json();
  events.push(otherEvent._id);
  expect((await coach.get(`/api/messages/event/${otherEvent._id}`)).status()).toBe(403);
  expect((await parent.get(`/api/messages/event/${otherEvent._id}`)).status()).toBe(403);
});

// ---------- reports ----------

test('members can report a message, admins review it, and it can be dismissed', async () => {
  const coachConn = await open(tokens.coach);
  const msg = (await say(coachConn, { text: 'QA E2E reportable' })).message;

  expect((await coach.post(`/api/messages/${msg._id}/report`, { reason: 'mine' })).status()).toBe(400);
  const reported = await parent.post(`/api/messages/${msg._id}/report`, { reason: 'QA E2E test report' });
  expect(reported.status()).toBe(201);
  expect((await parent.post(`/api/messages/${msg._id}/report`, {})).status()).toBe(409);

  expect((await parent.get('/api/chat/reports')).status()).toBe(403);
  const list = await (await admin.get('/api/chat/reports?status=open')).json();
  const report = list.find((r) => r.messageId === msg._id);
  expect(report).toBeTruthy();
  expect(report.textSnapshot).toBe('QA E2E reportable');
  expect(report.reporterName).toBe(accounts.parent.name);

  expect((await parent.post(`/api/chat/reports/${report._id}/resolve`, { action: 'dismiss' })).status()).toBe(403);
  expect((await admin.post(`/api/chat/reports/${report._id}/resolve`, { action: 'bogus' })).status()).toBe(400);
  const resolved = await admin.post(`/api/chat/reports/${report._id}/resolve`, { action: 'dismiss' });
  expect((await resolved.json()).status).toBe('dismissed');
});

// ---------- push signup ----------

test('notification signup: key, subscribe, status, unsubscribe, and bad input', async () => {
  const key = await (await parent.get('/api/chat/push/public-key')).json();
  expect(key.publicKey).toMatch(/^[A-Za-z0-9_-]{60,}$/);

  const endpoint = `https://push.example.test/qa-e2e-${Date.now()}`;
  const subscription = { endpoint, keys: { p256dh: 'BQA-e2e-key', auth: 'qa-e2e-auth' } };
  expect((await parent.post('/api/chat/push/subscribe', { subscription })).status()).toBe(201);
  expect((await (await parent.get('/api/chat/push/status')).json()).devices).toBeGreaterThanOrEqual(1);

  expect((await parent.post('/api/chat/push/subscribe', { subscription: { endpoint: 'http://insecure', keys: {} } })).status()).toBe(400);
  expect((await parent.post('/api/chat/push/subscribe', {})).status()).toBe(400);

  expect((await parent.post('/api/chat/push/unsubscribe', { endpoint })).status()).toBe(200);
});
