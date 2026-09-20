import { test, expect } from '@playwright/test';
import { apiSignIn, authed } from '../helpers/api.js';
import { accounts, ids } from '../fixtures/accounts.js';

// A coach may only touch data for players on THEIR OWN team. Before this was
// enforced, any coach could read/write notes, performance data, profiles and
// recruiting profiles for any player on any team. Every write here targets the
// dummy "QA Other Player", never a real player.

let admin;
let coach;
let parent;
const noteIdsToDelete = [];

test.beforeEach(async ({ request }) => {
  admin = authed(request, await apiSignIn(request, accounts.admin.email, accounts.admin.password));
  coach = authed(request, await apiSignIn(request, accounts.coach.email, accounts.coach.password));
  parent = authed(request, await apiSignIn(request, accounts.parent.email, accounts.parent.password));
});

test.afterEach(async () => {
  while (noteIdsToDelete.length) {
    await admin.delete(`/api/player-notes/${noteIdsToDelete.pop()}`);
  }
});

async function adminNote(playerId, body, visibleToParent = false) {
  const res = await admin.post('/api/player-notes', { playerId, type: 'general', body, visibleToParent });
  expect(res.status()).toBe(201);
  const note = await res.json();
  noteIdsToDelete.push(note._id);
  return note;
}

// ---------- player notes ----------

test('coach can add, read, and delete notes on their own team\'s player', async () => {
  const createRes = await coach.post('/api/player-notes', {
    playerId: ids.playerId,
    type: 'general',
    body: 'QA E2E own-team note',
    visibleToParent: false,
  });
  expect(createRes.status()).toBe(201);
  const note = await createRes.json();
  noteIdsToDelete.push(note._id);

  const listRes = await coach.get(`/api/player-notes?playerId=${ids.playerId}`);
  expect(listRes.status()).toBe(200);
  expect((await listRes.json()).some((n) => n._id === note._id)).toBeTruthy();

  const delRes = await coach.delete(`/api/player-notes/${note._id}`);
  expect(delRes.status()).toBe(204);
});

test('coach cannot read private notes on another team\'s player', async () => {
  await adminNote(ids.otherPlayerId, 'QA E2E private note on other team', false);
  const res = await coach.get(`/api/player-notes?playerId=${ids.otherPlayerId}`);
  expect(res.status()).toBe(403);
});

test('coach cannot add a note to another team\'s player', async () => {
  const res = await coach.post('/api/player-notes', {
    playerId: ids.otherPlayerId,
    type: 'general',
    body: 'QA E2E should never be created',
  });
  expect(res.status()).toBe(403);
  const listRes = await admin.get(`/api/player-notes?playerId=${ids.otherPlayerId}`);
  const notes = await listRes.json();
  expect(notes.some((n) => n.body === 'QA E2E should never be created')).toBeFalsy();
});

test('coach cannot delete a note on another team\'s player', async () => {
  const note = await adminNote(ids.otherPlayerId, 'QA E2E note the coach must not delete');
  const res = await coach.delete(`/api/player-notes/${note._id}`);
  expect(res.status()).toBe(403);
  const listRes = await admin.get(`/api/player-notes?playerId=${ids.otherPlayerId}`);
  expect((await listRes.json()).some((n) => n._id === note._id)).toBeTruthy();
});

test('parent can read visible notes on their own child but not on someone else\'s child', async () => {
  await adminNote(ids.playerId, 'QA E2E visible note', true);
  const own = await parent.get(`/api/player-notes?playerId=${ids.playerId}`);
  expect(own.status()).toBe(200);

  await adminNote(ids.otherPlayerId, 'QA E2E visible note on a stranger\'s child', true);
  const other = await parent.get(`/api/player-notes?playerId=${ids.otherPlayerId}`);
  expect(other.status()).toBe(403);
});

// ---------- performance ----------

test('coach can add and read performance data for their own team\'s player', async () => {
  const createRes = await coach.post('/api/performance/entries', {
    playerId: ids.playerId,
    metricType: 'speed',
    value: 1,
    unit: 'seconds',
    notes: 'QA E2E entry',
  });
  expect(createRes.status()).toBe(201);
  const readRes = await coach.get(`/api/performance/entries/${ids.playerId}`);
  expect(readRes.status()).toBe(200);
});

test('coach cannot add, read, or set goals on another team\'s player performance', async () => {
  const entryRes = await coach.post('/api/performance/entries', {
    playerId: ids.otherPlayerId,
    metricType: 'speed',
    value: 1,
    unit: 'seconds',
    notes: 'QA E2E should never be created',
  });
  expect(entryRes.status()).toBe(403);

  const goalRes = await coach.post('/api/performance/goals', {
    playerId: ids.otherPlayerId,
    metricType: 'speed',
    targetValue: 1,
    targetUnit: 'seconds',
  });
  expect(goalRes.status()).toBe(403);

  expect((await coach.get(`/api/performance/entries/${ids.otherPlayerId}`)).status()).toBe(403);
  expect((await coach.get(`/api/performance/goals/${ids.otherPlayerId}`)).status()).toBe(403);

  const adminView = await admin.get(`/api/performance/entries/${ids.otherPlayerId}`);
  const entries = await adminView.json();
  expect(entries.some((e) => e.notes === 'QA E2E should never be created')).toBeFalsy();
});

test('coach cannot change a goal on another team\'s player', async () => {
  const goalRes = await admin.post('/api/performance/goals', {
    playerId: ids.otherPlayerId,
    metricType: 'jump',
    targetValue: 9999,
    targetUnit: 'inches',
  });
  expect(goalRes.status()).toBe(201);
  const goal = await goalRes.json();

  const res = await coach.patch(`/api/performance/goals/${goal._id}`, { achieved: true });
  expect(res.status()).toBe(403);

  const goals = await (await admin.get(`/api/performance/goals/${ids.otherPlayerId}`)).json();
  expect(goals.find((g) => g._id === goal._id).achieved).toBe(false);
});

// ---------- player profile ----------

test('coach can edit their own team\'s player profile but not another team\'s', async () => {
  const own = await coach.patch(`/api/players/${ids.playerId}`, { bio: 'QA E2E own-team bio' });
  expect(own.status()).toBe(200);
  await admin.patch(`/api/players/${ids.playerId}`, { bio: '' });

  const other = await coach.patch(`/api/players/${ids.otherPlayerId}`, { bio: 'QA E2E should not apply' });
  expect(other.status()).toBe(403);

  const players = await (await admin.get(`/api/players/team/${ids.otherTeamId}`)).json();
  expect(players.find((p) => p._id === ids.otherPlayerId).bio || '').not.toBe('QA E2E should not apply');
});

// ---------- recruiting profile ----------

test('coach can read their own team\'s recruiting profile but not another team\'s', async () => {
  expect((await admin.put(`/api/recruiting-profiles/${ids.playerId}`, { visible: true })).status()).toBe(200);
  expect((await admin.put(`/api/recruiting-profiles/${ids.otherPlayerId}`, { visible: true })).status()).toBe(200);

  expect((await coach.get(`/api/recruiting-profiles/${ids.playerId}`)).status()).toBe(200);
  expect((await coach.get(`/api/recruiting-profiles/${ids.otherPlayerId}`)).status()).toBe(403);
});

// ---------- waivers ----------

test('coach cannot sign a waiver on behalf of another team\'s player', async () => {
  const res = await coach.post('/api/waiver-signatures', {
    playerId: ids.otherPlayerId,
    waiverId: '000000000000000000000000',
    signedName: 'QA E2E should be blocked',
    agreedToTerms: true,
  });
  expect(res.status()).toBe(403);
});
