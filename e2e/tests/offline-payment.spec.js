import { test, expect } from '@playwright/test';
import { apiSignIn, authed } from '../helpers/api.js';
import { accounts } from '../fixtures/accounts.js';

// Recording a payment made outside the site changes a family's balance, so only
// an admin may do it and the input is checked hard. These tests only send bad
// requests (no payment is ever recorded), so no QA data is left behind.

let admin;
let parent;
let coach;

test.beforeEach(async ({ request }) => {
  admin = authed(request, await apiSignIn(request, accounts.admin.email, accounts.admin.password));
  parent = authed(request, await apiSignIn(request, accounts.parent.email, accounts.parent.password));
  coach = authed(request, await apiSignIn(request, accounts.coach.email, accounts.coach.password));
});

const validBody = { registrationId: '000000000000000000000000', amountCents: 100, note: 'test' };

test('only an admin can record an offline payment', async () => {
  expect((await parent.post('/api/payments/offline', validBody)).status()).toBe(403);
  expect((await coach.post('/api/payments/offline', validBody)).status()).toBe(403);
});

test('bad input is rejected before anything is recorded', async () => {
  const bad = async (body) => (await admin.post('/api/payments/offline', body)).status();

  expect(await bad({ ...validBody, registrationId: 'nope' })).toBe(400);
  expect(await bad({ ...validBody, amountCents: 0 })).toBe(400);
  expect(await bad({ ...validBody, amountCents: -500 })).toBe(400);
  expect(await bad({ ...validBody, amountCents: 12.5 })).toBe(400);
  expect(await bad({ ...validBody, note: '' })).toBe(400);
  expect(await bad({ ...validBody, note: '   ' })).toBe(400);
  expect(await bad({ ...validBody, note: 'x'.repeat(201) })).toBe(400);
  // A registration that does not exist (never a real family's).
  expect(await bad(validBody)).toBe(404);
});
