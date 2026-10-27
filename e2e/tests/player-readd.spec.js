import { test, expect } from '@playwright/test';
import { apiSignIn, authed } from '../helpers/api.js';
import { accounts, ids } from '../fixtures/accounts.js';

// Adding a player who was taken off the roster earlier should bring her record
// back, not fail on the "same name and jersey" rule. Uses one fixed QA player
// on the QA team and leaves her removed at the end, so reruns are safe.

let admin;
let parent;
const player = { name: 'QA E2E Readd Player', jersey: 97 };

test.beforeEach(async ({ request }) => {
  admin = authed(request, await apiSignIn(request, accounts.admin.email, accounts.admin.password));
  parent = authed(request, await apiSignIn(request, accounts.parent.email, accounts.parent.password));
});

const rosterNames = async () => {
  const res = await admin.get(`/api/players/team/${ids.teamId}`);
  return (await res.json()).map((p) => p.name);
};

test('adding a removed player again restores her record', async () => {
  // First run creates her; later runs restore the record left over from before.
  const first = await admin.post('/api/players', { ...player, teamId: ids.teamId });
  expect([200, 201]).toContain(first.status());
  const created = await first.json();
  expect(await rosterNames()).toContain(player.name);

  // Take her off the roster.
  expect((await admin.delete(`/api/players/${created._id}`)).status()).toBe(200);
  expect(await rosterNames()).not.toContain(player.name);

  // Add her again: the same record comes back, not a duplicate.
  const again = await admin.post('/api/players', { ...player, teamId: ids.teamId });
  expect(again.status()).toBe(200);
  const restored = await again.json();
  expect(restored.restored).toBe(true);
  expect(String(restored._id)).toBe(String(created._id));
  expect(await rosterNames()).toContain(player.name);

  // Leave her removed.
  expect((await admin.delete(`/api/players/${created._id}`)).status()).toBe(200);
});

test('a parent cannot add or restore players', async () => {
  const res = await parent.post('/api/players', { ...player, teamId: ids.teamId });
  expect(res.status()).toBe(403);
});
