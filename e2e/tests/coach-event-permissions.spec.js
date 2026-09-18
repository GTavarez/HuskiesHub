import { test, expect } from '@playwright/test';
import { loginAs } from '../helpers/ui.js';
import { apiSignIn, authed } from '../helpers/api.js';
import { accounts, ids } from '../fixtures/accounts.js';

// Covers the exact class of bug that's hit this project repeatedly: a coach
// getting too much or too little access to the schedule. A coach should be
// able to create/edit/cancel anything on their OWN team (not just events
// they personally created) and be flatly blocked on any other team.

let createdEventId;

test.afterEach(async ({ request }) => {
  if (!createdEventId) return;
  const adminToken = await apiSignIn(request, accounts.admin.email, accounts.admin.password);
  await authed(request, adminToken).delete(`/api/events/${createdEventId}`);
  createdEventId = null;
});

test('coach can create an event on their own team from the Coach Portal', async ({ page, request }) => {
  await loginAs(page, accounts.coach);
  await page.goto('/coach');
  await page.getByPlaceholder('e.g. Batting cages session').fill('QA E2E practice');
  await page.locator('#practice-starts').fill('2027-01-15T17:00');
  await page.locator('#practice-ends').fill('2027-01-15T19:00');
  await page.getByLabel('Email the team about this').uncheck();
  await page.getByRole('button', { name: 'Save Practice Plan' }).click();
  await expect(page.getByText('Practice plan saved.')).toBeVisible();
  await expect(page.getByText('QA E2E practice')).toBeVisible();

  // Find what was just created through the real UI so afterEach can clean
  // it up — this test doesn't get the id back directly since it goes
  // through the form, not the API.
  const adminToken = await apiSignIn(request, accounts.admin.email, accounts.admin.password);
  const listRes = await authed(request, adminToken).get(`/api/events?teamId=${ids.teamId}`);
  const events = await listRes.json();
  const created = events.find((e) => e.title === 'QA E2E practice');
  createdEventId = created?._id;
});

test('coach can edit an event on their own team even if they did not create it', async ({ request }) => {
  const adminToken = await apiSignIn(request, accounts.admin.email, accounts.admin.password);
  const adminApi = authed(request, adminToken);
  const createRes = await adminApi.post('/api/events', {
    type: 'practice',
    teamId: ids.teamId,
    title: 'QA E2E admin-created event',
    startsAt: '2027-01-16T17:00:00.000Z',
    endsAt: '2027-01-16T19:00:00.000Z',
    notifyTeam: false,
  });
  expect(createRes.ok()).toBeTruthy();
  const event = await createRes.json();
  createdEventId = event._id;

  const coachToken = await apiSignIn(request, accounts.coach.email, accounts.coach.password);
  const coachApi = authed(request, coachToken);
  const editRes = await coachApi.patch(`/api/events/${createdEventId}`, {
    title: 'QA E2E edited by coach',
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    location: 'Edited location',
  });
  expect(editRes.status()).toBe(200);
  const edited = await editRes.json();
  expect(edited.title).toBe('QA E2E edited by coach');
});

test('coach is blocked from creating an event on a different team', async ({ request }) => {
  const coachToken = await apiSignIn(request, accounts.coach.email, accounts.coach.password);
  const coachApi = authed(request, coachToken);
  const res = await coachApi.post('/api/events', {
    type: 'practice',
    teamId: ids.foreignTeamId,
    title: 'should never be created',
    startsAt: '2027-01-17T17:00:00.000Z',
    endsAt: '2027-01-17T19:00:00.000Z',
  });
  expect(res.status()).toBe(403);
});

test('coach is blocked from editing or cancelling an event on a different team', async ({ request }) => {
  const adminToken = await apiSignIn(request, accounts.admin.email, accounts.admin.password);
  const adminApi = authed(request, adminToken);
  // Read-only against the foreign team — just need any real event id there.
  const listRes = await adminApi.get(`/api/events?teamId=${ids.foreignTeamId}`);
  const events = await listRes.json();
  expect(events.length).toBeGreaterThan(0);
  const foreignEventId = events[0]._id;
  const originalTitle = events[0].title;

  const coachToken = await apiSignIn(request, accounts.coach.email, accounts.coach.password);
  const coachApi = authed(request, coachToken);

  const editRes = await coachApi.patch(`/api/events/${foreignEventId}`, {
    title: 'SHOULD NOT APPLY',
    startsAt: events[0].startsAt,
    endsAt: events[0].endsAt,
  });
  expect(editRes.status()).toBe(403);

  const cancelRes = await coachApi.patch(`/api/events/${foreignEventId}/cancel`, {});
  expect(cancelRes.status()).toBe(403);

  // Confirm nothing actually changed on the foreign team's event.
  const verifyRes = await adminApi.get(`/api/events/${foreignEventId}`);
  const verified = await verifyRes.json();
  expect(verified.title).toBe(originalTitle);
  expect(verified.status).not.toBe('cancelled');
});

test('coach is blocked from hard-deleting an event, even on their own team', async ({ request }) => {
  const adminToken = await apiSignIn(request, accounts.admin.email, accounts.admin.password);
  const adminApi = authed(request, adminToken);
  const createRes = await adminApi.post('/api/events', {
    type: 'practice',
    teamId: ids.teamId,
    title: 'QA E2E delete-protection check',
    startsAt: '2027-01-18T17:00:00.000Z',
    endsAt: '2027-01-18T19:00:00.000Z',
    notifyTeam: false,
  });
  const event = await createRes.json();
  createdEventId = event._id;

  const coachToken = await apiSignIn(request, accounts.coach.email, accounts.coach.password);
  const coachApi = authed(request, coachToken);
  const deleteRes = await coachApi.delete(`/api/events/${createdEventId}`);
  expect(deleteRes.status()).toBe(403);
});
