import { test, expect } from '@playwright/test';
import { apiSignIn, authed } from '../helpers/api.js';
import { accounts, ids, apiBaseUrl } from '../fixtures/accounts.js';

// Photos in team chat and group chats. The photo bytes sit behind the same
// room-access check as the messages themselves, so the important assertions
// here are the negative ones: someone outside a room can neither post into it
// nor fetch a photo out of it. Everything is posted to the dummy QA teams, and
// QA accounts are flagged isTestAccount so the chat digest never emails anyone.

// Smallest valid PNG (1x1 pixel).
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

let tokens;
let admin;
let coach;
let parent;

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

function postPhoto(request, token, fields, file = { name: 'qa.png', mimeType: 'image/png', buffer: PNG }) {
  return request.post(`${apiBaseUrl}/api/messages/photo`, {
    headers: { Authorization: `Bearer ${token}` },
    multipart: { ...fields, photo: file },
  });
}

function getPhoto(request, token, messageId) {
  return request.get(`${apiBaseUrl}/api/messages/photo/${messageId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

test('a team member can post a photo to the team chat and teammates can view it', async ({ request }) => {
  const res = await postPhoto(request, tokens.coach, { teamId: ids.teamId, text: 'QA E2E photo caption' });
  expect(res.status()).toBe(201);
  const message = await res.json();
  expect(message.imageId).toBeTruthy();
  expect(message.text).toBe('QA E2E photo caption');

  // Shows up in the room's history with the image flag set.
  const history = await (await parent.get(`/api/messages/${ids.teamId}`)).json();
  expect(history.some((m) => m._id === message._id && m.imageId)).toBeTruthy();

  const photoRes = await getPhoto(request, tokens.parent, message._id);
  expect(photoRes.status()).toBe(200);
  expect(photoRes.headers()['content-type']).toBe('image/png');
  expect(photoRes.headers()['x-content-type-options']).toBe('nosniff');
  expect((await photoRes.body()).equals(PNG)).toBeTruthy();
});

test('a photo needs no caption', async ({ request }) => {
  const res = await postPhoto(request, tokens.coach, { teamId: ids.teamId });
  expect(res.status()).toBe(201);
});

test('photo in a group chat is visible to members only', async ({ request }) => {
  const groupRes = await coach.post('/api/conversations', {
    teamId: ids.teamId,
    name: 'QA E2E photo group',
    memberIds: [ids.coachId],
  });
  expect(groupRes.status()).toBe(201);
  const group = await groupRes.json();

  const res = await postPhoto(request, tokens.coach, { conversationId: group._id });
  expect(res.status()).toBe(201);
  const message = await res.json();

  expect((await getPhoto(request, tokens.coach, message._id)).status()).toBe(200);
  // The parent is on the team but not in this group.
  expect((await getPhoto(request, tokens.parent, message._id)).status()).toBe(403);
  expect((await postPhoto(request, tokens.parent, { conversationId: group._id })).status()).toBe(403);
});

test('outsiders cannot post into or read from another team\'s chat', async ({ request }) => {
  // Coach and parent belong to the QA team, not the dummy other team or Premier.
  expect((await postPhoto(request, tokens.coach, { teamId: ids.otherTeamId })).status()).toBe(403);
  expect((await postPhoto(request, tokens.parent, { teamId: ids.otherTeamId })).status()).toBe(403);
  expect((await postPhoto(request, tokens.coach, { teamId: ids.foreignTeamId })).status()).toBe(403);

  // Admin can post anywhere; only that team's people may then read the photo.
  const res = await postPhoto(request, tokens.admin, { teamId: ids.otherTeamId });
  expect(res.status()).toBe(201);
  const message = await res.json();
  expect((await getPhoto(request, tokens.coach, message._id)).status()).toBe(403);
  expect((await getPhoto(request, tokens.parent, message._id)).status()).toBe(403);
  expect((await getPhoto(request, tokens.admin, message._id)).status()).toBe(200);
});

test('unauthenticated requests are refused', async ({ request }) => {
  const res = await request.get(`${apiBaseUrl}/api/messages/photo/${ids.teamId}`);
  expect([401, 403]).toContain(res.status());
});

test('only real photos are accepted', async ({ request }) => {
  const svg = await postPhoto(
    request,
    tokens.coach,
    { teamId: ids.teamId },
    { name: 'x.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>') }
  );
  expect(svg.status()).toBeGreaterThanOrEqual(400);
  expect(svg.status()).toBeLessThan(500);

  const pdf = await postPhoto(
    request,
    tokens.coach,
    { teamId: ids.teamId },
    { name: 'x.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4') }
  );
  expect(pdf.status()).toBeGreaterThanOrEqual(400);
  expect(pdf.status()).toBeLessThan(500);
});

test('an oversized photo is rejected with a clear message', async ({ request }) => {
  const res = await postPhoto(
    request,
    tokens.coach,
    { teamId: ids.teamId },
    { name: 'big.png', mimeType: 'image/png', buffer: Buffer.alloc(16 * 1024 * 1024) }
  );
  expect(res.status()).toBe(400);
  expect((await res.json()).message).toMatch(/too large/i);
});

test('a missing photo or an overlong caption is a 400', async ({ request }) => {
  const none = await request.post(`${apiBaseUrl}/api/messages/photo`, {
    headers: { Authorization: `Bearer ${tokens.coach}` },
    multipart: { teamId: ids.teamId },
  });
  expect(none.status()).toBe(400);

  const long = await postPhoto(request, tokens.coach, { teamId: ids.teamId, text: 'x'.repeat(1001) });
  expect(long.status()).toBe(400);
});
