import { test, expect } from '@playwright/test';
import { apiSignIn, authed } from '../helpers/api.js';
import { accounts, ids, apiBaseUrl } from '../fixtures/accounts.js';

// A player's phone and contact email are private: they must never appear on the
// public roster, and only the player's family, their own coach and admins may
// read or change them. SAT/ACT scores live on the recruiting profile. All data
// here is on the dummy QA players and is cleared afterwards.

let admin;
let coach;
let parent;

test.beforeEach(async ({ request }) => {
  admin = authed(request, await apiSignIn(request, accounts.admin.email, accounts.admin.password));
  coach = authed(request, await apiSignIn(request, accounts.coach.email, accounts.coach.password));
  parent = authed(request, await apiSignIn(request, accounts.parent.email, accounts.parent.password));
});

test.afterEach(async () => {
  await admin.patch(`/api/players/${ids.playerId}`, { phone: '', contactEmail: '' });
  await admin.put(`/api/recruiting-profiles/${ids.playerId}`, { satScore: null, actScore: null });
});

// ---------- phone ----------

test('a family member can save a phone number and it is stored in one format', async () => {
  const res = await parent.patch(`/api/players/${ids.playerId}`, { phone: '201.555.0123' });
  expect(res.status()).toBe(200);
  // The update response itself doesn't echo private fields.
  expect((await res.json()).phone).toBeUndefined();

  const contact = await (await parent.get(`/api/players/${ids.playerId}/contact`)).json();
  expect(contact.phone).toBe('(201) 555-0123');

  // A leading country code is accepted; clearing works.
  await parent.patch(`/api/players/${ids.playerId}`, { phone: '+1 (201) 555-0199' });
  expect((await (await parent.get(`/api/players/${ids.playerId}/contact`)).json()).phone).toBe('(201) 555-0199');
  await parent.patch(`/api/players/${ids.playerId}`, { phone: '' });
  expect((await (await parent.get(`/api/players/${ids.playerId}/contact`)).json()).phone).toBe('');
});

test('a phone number that is not 10 digits is rejected and nothing is saved', async () => {
  await parent.patch(`/api/players/${ids.playerId}`, { phone: '2015550123' });
  for (const bad of ['12345', 'call me', '201555012', '20155501234']) {
    const res = await parent.patch(`/api/players/${ids.playerId}`, { phone: bad });
    expect(res.status()).toBe(400);
  }
  expect((await (await parent.get(`/api/players/${ids.playerId}/contact`)).json()).phone).toBe('(201) 555-0123');
});

test('the public roster never includes phone or contact email', async ({ request }) => {
  await admin.patch(`/api/players/${ids.playerId}`, { phone: '2015550123', contactEmail: 'qa-private@example.com' });

  // No Authorization header at all: this is what any visitor gets.
  const res = await request.get(`${apiBaseUrl}/api/players/team/${ids.teamId}`);
  expect(res.status()).toBe(200);
  const players = await res.json();
  const qaPlayer = players.find((p) => p._id === ids.playerId);
  expect(qaPlayer).toBeTruthy();
  expect(qaPlayer.phone).toBeUndefined();
  expect(qaPlayer.contactEmail).toBeUndefined();
  expect(JSON.stringify(players)).not.toContain('555-0123');
  expect(JSON.stringify(players)).not.toContain('qa-private@example.com');
});

test('only the family, their own coach and admins can read private contact details', async ({ request }) => {
  await admin.patch(`/api/players/${ids.playerId}`, { phone: '2015550123', contactEmail: 'qa-private@example.com' });

  for (const who of [admin, coach, parent]) {
    const res = await who.get(`/api/players/${ids.playerId}/contact`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.phone).toBe('(201) 555-0123');
    expect(body.contactEmail).toBe('qa-private@example.com');
  }

  // The QA coach and parent are not on the other team.
  expect((await coach.get(`/api/players/${ids.otherPlayerId}/contact`)).status()).toBe(403);
  expect((await parent.get(`/api/players/${ids.otherPlayerId}/contact`)).status()).toBe(403);

  const anon = await request.get(`${apiBaseUrl}/api/players/${ids.playerId}/contact`);
  expect(anon.status()).toBe(401);
});

test('a family cannot set a phone number on someone else\'s player', async () => {
  expect((await parent.patch(`/api/players/${ids.otherPlayerId}`, { phone: '2015550123' })).status()).toBe(403);
  expect((await coach.patch(`/api/players/${ids.otherPlayerId}`, { phone: '2015550123' })).status()).toBe(403);
});

// ---------- SAT / ACT ----------

test('a parent can save SAT and ACT scores, and updating one keeps the other', async () => {
  const res = await parent.put(`/api/recruiting-profiles/${ids.playerId}`, { satScore: 1200, actScore: 27 });
  expect(res.status()).toBe(200);
  const visibleBefore = (await res.json()).visible;

  const partial = await parent.put(`/api/recruiting-profiles/${ids.playerId}`, { satScore: 1250 });
  expect(partial.status()).toBe(200);
  const profile = await (await parent.get(`/api/recruiting-profiles/${ids.playerId}`)).json();
  expect(profile.satScore).toBe(1250);
  expect(profile.actScore).toBe(27);

  // Saving scores must never change whether college coaches can see the profile.
  expect(profile.visible).toBe(visibleBefore);
});

test('scores outside the real SAT and ACT ranges are rejected', async () => {
  expect((await parent.put(`/api/recruiting-profiles/${ids.playerId}`, { satScore: 1700 })).status()).toBe(400);
  expect((await parent.put(`/api/recruiting-profiles/${ids.playerId}`, { satScore: 200 })).status()).toBe(400);
  expect((await parent.put(`/api/recruiting-profiles/${ids.playerId}`, { actScore: 40 })).status()).toBe(400);
  expect((await parent.put(`/api/recruiting-profiles/${ids.playerId}`, { actScore: 0 })).status()).toBe(400);
});

test('a coach can read a player\'s scores but not change them; other families cannot see them', async () => {
  await parent.put(`/api/recruiting-profiles/${ids.playerId}`, { satScore: 1200, actScore: 27 });

  const read = await coach.get(`/api/recruiting-profiles/${ids.playerId}`);
  expect(read.status()).toBe(200);
  expect((await read.json()).satScore).toBe(1200);

  expect((await coach.put(`/api/recruiting-profiles/${ids.playerId}`, { satScore: 1500 })).status()).toBe(403);
  // The parent has no access to the other team's player.
  expect((await parent.put(`/api/recruiting-profiles/${ids.otherPlayerId}`, { satScore: 1500 })).status()).toBe(403);
});
