import { test, expect } from '@playwright/test';
import { apiSignIn, authed } from '../helpers/api.js';
import { accounts, ids } from '../fixtures/accounts.js';

// Promoting an account to admin (and reversing it) is deliberately narrow and
// admin-only — see adminRoleController.js. The QA coach account is shared by
// every other spec in this suite, so it is promoted and demoted back to coach
// within the same test, with an afterEach safety net in case an assertion
// throws in between.

let admin;
let coach;
let parent;

test.beforeEach(async ({ request }) => {
  admin = authed(request, await apiSignIn(request, accounts.admin.email, accounts.admin.password));
  coach = authed(request, await apiSignIn(request, accounts.coach.email, accounts.coach.password));
  parent = authed(request, await apiSignIn(request, accounts.parent.email, accounts.parent.password));
});

test.afterEach(async () => {
  // Defensive: if a prior assertion threw before the test's own demote ran,
  // this puts the shared QA coach fixture back the way every other spec
  // expects it, so one failure here can't cascade into unrelated failures.
  const me = await (await coach.get('/me')).json().catch(() => null);
  if (me?.role === 'admin') {
    await admin.post(`/admin/users/${ids.coachId}/demote-admin`, {});
  }
});

test('only an admin can promote or demote, and not themselves', async () => {
  expect((await coach.post(`/admin/users/${ids.parentId}/promote-to-admin`, {})).status()).toBe(403);
  expect((await parent.post(`/admin/users/${ids.coachId}/promote-to-admin`, {})).status()).toBe(403);
  expect((await coach.post(`/admin/users/${ids.parentId}/demote-admin`, {})).status()).toBe(403);

  const meRes = await admin.get('/me');
  const selfId = (await meRes.json())._id;
  expect((await admin.post(`/admin/users/${selfId}/promote-to-admin`, {})).status()).toBe(400);
});

test('bad input is rejected', async () => {
  expect((await admin.post('/admin/users/not-an-id/promote-to-admin', {})).status()).toBe(400);
  expect((await admin.post('/admin/users/000000000000000000000000/promote-to-admin', {})).status()).toBe(404);
});

test('promotes a coach to admin and demotion restores the exact role they had', async () => {
  const before = await (await coach.get('/me')).json();
  expect(before.role).toBe('coach');

  const promoted = await admin.post(`/admin/users/${ids.coachId}/promote-to-admin`, {});
  expect(promoted.status()).toBe(200);
  expect((await promoted.json()).role).toBe('admin');

  // Promoting an already-admin account is refused, not silently repeated.
  expect((await admin.post(`/admin/users/${ids.coachId}/promote-to-admin`, {})).status()).toBe(409);

  const demoted = await admin.post(`/admin/users/${ids.coachId}/demote-admin`, {});
  expect(demoted.status()).toBe(200);
  expect((await demoted.json()).role).toBe('coach');

  // Demoting a non-admin, or an admin with nothing on record to restore, is refused.
  expect((await admin.post(`/admin/users/${ids.coachId}/demote-admin`, {})).status()).toBe(409);
  const meRes = await admin.get('/me');
  const selfId = (await meRes.json())._id;
  const selfDemote = await admin.post(`/admin/users/${selfId}/demote-admin`, {});
  expect(selfDemote.status()).toBe(400);
});
