import { test, expect } from '@playwright/test';
import { apiSignIn, authed } from '../helpers/api.js';
import { accounts, ids, apiBaseUrl } from '../fixtures/accounts.js';

// The public Tryouts form emails the coaches (and the parent) for every saved
// registration, and this suite runs against production every night, so it never
// saves one. It covers what can be checked without that: the form's rejections,
// that a bot's submission is dropped, and that only admins can see or manage
// registrations. The move-to-team step is checked by hand after a change.

const NO_SUCH_ID = '000000000000000000000000';

const validForm = {
  playerName: 'QA Tryout Player',
  ageGroup: '14U',
  position: 'Shortstop',
  parentName: 'QA Parent',
  parentEmail: 'qa-parent@example.com',
  parentPhone: '201-555-0123',
};

let admin;
let coach;
let parent;

test.beforeEach(async ({ request }) => {
  admin = authed(request, await apiSignIn(request, accounts.admin.email, accounts.admin.password));
  coach = authed(request, await apiSignIn(request, accounts.coach.email, accounts.coach.password));
  parent = authed(request, await apiSignIn(request, accounts.parent.email, accounts.parent.password));
});

test('the public form rejects an incomplete or mistyped registration', async ({ request }) => {
  const post = (data) => request.post(`${apiBaseUrl}/api/tryouts`, { data });

  const empty = await post({});
  expect(empty.status()).toBe(400);
  expect((await empty.json()).message).toMatch(/player's name/);

  const badAge = await post({ ...validForm, ageGroup: '10U' });
  expect(badAge.status()).toBe(400);
  expect((await badAge.json()).message).toMatch(/age group/);

  const badEmail = await post({ ...validForm, parentEmail: 'not-an-email' });
  expect(badEmail.status()).toBe(400);
  expect((await badEmail.json()).message).toMatch(/email/);

  const badPhone = await post({ ...validForm, parentPhone: '555-0123' });
  expect(badPhone.status()).toBe(400);
  expect((await badPhone.json()).message).toMatch(/10 digit/);
});

test('a bot that fills the hidden field is thanked but nothing is saved', async ({ request }) => {
  const name = `QA Bot ${Date.now()}`;
  const res = await request.post(`${apiBaseUrl}/api/tryouts`, {
    data: { ...validForm, playerName: name, website: 'spam.example' },
  });
  expect(res.status()).toBe(201);

  const list = await (await admin.get('/api/tryouts')).json();
  expect(list.some((t) => t.playerName === name)).toBe(false);
});

test('only an admin can see or manage tryout registrations', async ({ request }) => {
  expect((await request.get(`${apiBaseUrl}/api/tryouts`)).status()).toBe(401);

  for (const who of [coach, parent]) {
    expect((await who.get('/api/tryouts')).status()).toBe(403);
    expect((await who.patch(`/api/tryouts/${NO_SUCH_ID}/status`, { status: 'scheduled' })).status()).toBe(403);
    expect((await who.post(`/api/tryouts/${NO_SUCH_ID}/move-to-team`, { teamId: ids.teamId })).status()).toBe(403);
    expect((await who.delete(`/api/tryouts/${NO_SUCH_ID}`)).status()).toBe(403);
  }

  const list = await admin.get('/api/tryouts');
  expect(list.status()).toBe(200);
  expect(Array.isArray(await list.json())).toBe(true);
});

test('the admin actions refuse bad input and unknown registrations', async () => {
  expect((await admin.get('/api/tryouts?status=maybe')).status()).toBe(400);
  expect((await admin.patch(`/api/tryouts/${NO_SUCH_ID}/status`, { status: 'joined' })).status()).toBe(400);
  expect((await admin.patch(`/api/tryouts/${NO_SUCH_ID}/status`, { status: 'scheduled' })).status()).toBe(404);
  expect((await admin.post(`/api/tryouts/${NO_SUCH_ID}/move-to-team`, {})).status()).toBe(400);
  expect((await admin.post(`/api/tryouts/${NO_SUCH_ID}/move-to-team`, { teamId: ids.teamId })).status()).toBe(409);
  expect((await admin.delete(`/api/tryouts/${NO_SUCH_ID}`)).status()).toBe(404);
});
