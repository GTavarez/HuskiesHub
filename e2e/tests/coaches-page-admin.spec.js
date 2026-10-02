import { test, expect } from '@playwright/test';
import { apiSignIn, authed } from '../helpers/api.js';
import { accounts, ids, apiBaseUrl } from '../fixtures/accounts.js';

// Who shows on the public Coaching Staff page is an admin decision. The happy
// path is exercised with the QA coach but only on the title, never by turning
// the "show" switch on: that would put a fake coach on the real public page.

let admin;
let coach;
let parent;

test.beforeEach(async ({ request }) => {
  admin = authed(request, await apiSignIn(request, accounts.admin.email, accounts.admin.password));
  coach = authed(request, await apiSignIn(request, accounts.coach.email, accounts.coach.password));
  parent = authed(request, await apiSignIn(request, accounts.parent.email, accounts.parent.password));
});

test.afterEach(async () => {
  await admin.patch(`/admin/users/${ids.coachId}/coaches-page`, { coachTitle: '' });
});

test('only an admin can list or change the coaches page', async () => {
  expect((await coach.get('/admin/coaches-page')).status()).toBe(403);
  expect((await parent.get('/admin/coaches-page')).status()).toBe(403);
  expect((await coach.patch(`/admin/users/${ids.coachId}/coaches-page`, { show: true })).status()).toBe(403);
  expect((await parent.patch(`/admin/users/${ids.coachId}/coaches-page`, { show: true })).status()).toBe(403);
});

test('the admin list shows real coaches and never the QA accounts', async () => {
  const res = await admin.get('/admin/coaches-page');
  expect(res.status()).toBe(200);
  const list = await res.json();
  expect(list.length).toBeGreaterThan(0);
  expect(list.every((a) => ['coach', 'admin'].includes(a.role))).toBeTruthy();
  expect(list.some((a) => a.email.startsWith('qa-'))).toBeFalsy();
  expect(typeof list[0].showOnCoachesPage).toBe('boolean');
});

test('bad input is rejected', async () => {
  const path = `/admin/users/${ids.coachId}/coaches-page`;
  expect((await admin.patch(path, {})).status()).toBe(400);
  expect((await admin.patch(path, { show: 'yes' })).status()).toBe(400);
  expect((await admin.patch(path, { coachTitle: 'x'.repeat(81) })).status()).toBe(400);
  expect((await admin.patch('/admin/users/not-an-id/coaches-page', { show: false })).status()).toBe(400);
  expect((await admin.patch('/admin/users/000000000000000000000000/coaches-page', { show: false })).status()).toBe(404);
  // A parent can't be put on the coaches page.
  expect((await admin.patch(`/admin/users/${ids.parentId}/coaches-page`, { show: true })).status()).toBe(400);
});

test('an admin can set a title, and the QA coach stays off the public page', async ({ request }) => {
  const res = await admin.patch(`/admin/users/${ids.coachId}/coaches-page`, { coachTitle: '  QA Title  ' });
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.coachTitle).toBe('QA Title');
  expect(body.showOnCoachesPage).toBe(false);

  const publicList = await (await request.get(`${apiBaseUrl}/coaches`)).json();
  expect(publicList.some((c) => c._id === ids.coachId)).toBeFalsy();
});
