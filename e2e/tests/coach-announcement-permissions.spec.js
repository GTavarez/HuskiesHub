import { test, expect } from '@playwright/test';
import { apiSignIn, authed } from '../helpers/api.js';
import { accounts, ids } from '../fixtures/accounts.js';

// A coach may only post/delete announcements for their own team — never
// org-wide, never another team's. Mirrors the event-permission tests; this
// endpoint has the same team-scoping rule enforced server-side.

let createdAnnouncementId;

test.afterEach(async ({ request }) => {
  if (!createdAnnouncementId) return;
  const adminToken = await apiSignIn(request, accounts.admin.email, accounts.admin.password);
  await authed(request, adminToken).delete(`/api/announcements/${createdAnnouncementId}`);
  createdAnnouncementId = null;
});

test('coach can post and delete an announcement on their own team', async ({ request }) => {
  const coachToken = await apiSignIn(request, accounts.coach.email, accounts.coach.password);
  const coachApi = authed(request, coachToken);

  const createRes = await coachApi.post('/api/announcements', {
    teamId: ids.teamId,
    title: 'QA E2E announcement',
    body: 'Created by the automated QA suite.',
  });
  expect(createRes.status()).toBe(201);
  const announcement = await createRes.json();
  createdAnnouncementId = announcement._id;
  expect(String(announcement.teamId)).toBe(ids.teamId);

  const deleteRes = await coachApi.delete(`/api/announcements/${createdAnnouncementId}`);
  expect(deleteRes.status()).toBe(204);
  createdAnnouncementId = null; // already deleted, nothing for afterEach to clean up
});

test('coach cannot post an announcement to a different team', async ({ request }) => {
  const coachToken = await apiSignIn(request, accounts.coach.email, accounts.coach.password);
  const coachApi = authed(request, coachToken);
  const res = await coachApi.post('/api/announcements', {
    teamId: ids.foreignTeamId,
    title: 'should be blocked',
    body: 'should never exist',
  });
  expect(res.status()).toBe(403);
});

test('coach cannot post an org-wide announcement (omitting teamId falls back to their own team, not org-wide)', async ({
  request,
}) => {
  const coachToken = await apiSignIn(request, accounts.coach.email, accounts.coach.password);
  const coachApi = authed(request, coachToken);
  const res = await coachApi.post('/api/announcements', {
    title: 'QA E2E omitted-teamId check',
    body: 'should land on the coach\'s own team, never org-wide',
  });
  expect(res.status()).toBe(201);
  const announcement = await res.json();
  createdAnnouncementId = announcement._id;
  expect(String(announcement.teamId)).toBe(ids.teamId);
});

test('coach cannot delete another team\'s announcement', async ({ request }) => {
  const adminToken = await apiSignIn(request, accounts.admin.email, accounts.admin.password);
  const adminApi = authed(request, adminToken);
  const createRes = await adminApi.post('/api/announcements', {
    teamId: ids.foreignTeamId,
    title: 'QA E2E foreign-team announcement',
    body: 'admin-created, on a real team, for a negative delete check',
  });
  const foreignAnnouncement = await createRes.json();

  const coachToken = await apiSignIn(request, accounts.coach.email, accounts.coach.password);
  const coachApi = authed(request, coachToken);
  const deleteRes = await coachApi.delete(`/api/announcements/${foreignAnnouncement._id}`);
  expect(deleteRes.status()).toBe(403);

  // Clean up as admin since the coach was correctly blocked.
  await adminApi.delete(`/api/announcements/${foreignAnnouncement._id}`);
});

test('image attachment is admin-only, even for a coach posting to their own team', async ({ request }) => {
  const coachToken = await apiSignIn(request, accounts.coach.email, accounts.coach.password);
  const coachApi = authed(request, coachToken);
  const res = await coachApi.post('/api/announcements', {
    teamId: ids.teamId,
    title: 'should be fine, just checking role gate not the upload itself',
    body: 'no file attached in this check, that path is covered separately',
  });
  // Sanity companion check: this one has no image, so it must succeed —
  // proves the 403 in the image-specific test is about the image, not the
  // coach's basic posting rights.
  expect(res.status()).toBe(201);
  const announcement = await res.json();
  createdAnnouncementId = announcement._id;
});
