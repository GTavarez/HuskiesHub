import { test, expect } from '@playwright/test';
import { apiSignIn, authed } from '../helpers/api.js';
import { accounts, ids } from '../fixtures/accounts.js';

// The coach payroll ledger records what coaches are owed and whether it was
// paid; no money moves through it. Every record here is for the QA coach and
// is deleted afterwards.

let admin;
let coach;
let parent;
const created = [];

const period = { payPeriodStart: '2031-01-01', payPeriodEnd: '2031-01-14' };

test.beforeEach(async ({ request }) => {
  admin = authed(request, await apiSignIn(request, accounts.admin.email, accounts.admin.password));
  coach = authed(request, await apiSignIn(request, accounts.coach.email, accounts.coach.password));
  parent = authed(request, await apiSignIn(request, accounts.parent.email, accounts.parent.password));
});

test.afterEach(async () => {
  while (created.length) {
    const id = created.pop();
    // A paid record must be undone before it can be deleted.
    await admin.patch(`/api/payroll/${id}`, { status: 'unpaid' });
    await admin.delete(`/api/payroll/${id}`);
  }
});

async function addRecord(overrides = {}) {
  const res = await admin.post('/api/payroll', {
    coachUserId: ids.coachId,
    ...period,
    amountCents: 12345,
    note: 'QA E2E payroll',
    ...overrides,
  });
  if (res.status() === 201) created.push((await res.json())._id);
  return res;
}

test('admin can record a payment and sees it listed with the coach name', async () => {
  const res = await addRecord();
  expect(res.status()).toBe(201);
  const record = await res.json();

  const list = await (await admin.get('/api/payroll')).json();
  const row = list.find((p) => p._id === record._id);
  expect(row).toBeTruthy();
  expect(row.coachName).toBe(accounts.coach.name);
  expect(row.amountCents).toBe(12345);
  expect(row.status).toBe('unpaid');
});

test('the same coach and pay period cannot be entered twice by accident', async () => {
  expect((await addRecord()).status()).toBe(201);
  const dup = await addRecord();
  expect(dup.status()).toBe(409);
  expect((await dup.json()).duplicate).toBe(true);
});

test('bad input is rejected', async () => {
  expect((await addRecord({ amountCents: 0 })).status()).toBe(400);
  expect((await addRecord({ amountCents: -500 })).status()).toBe(400);
  expect((await addRecord({ amountCents: 12.5 })).status()).toBe(400);
  expect((await addRecord({ payPeriodStart: '2031-02-10', payPeriodEnd: '2031-02-01' })).status()).toBe(400);
  // A parent is not a coach, so nothing can be recorded against them.
  expect((await addRecord({ coachUserId: ids.parentId })).status()).toBe(400);
  expect((await addRecord({ coachUserId: 'nope' })).status()).toBe(400);
});

test('marking paid records the method and reference, and can be undone', async () => {
  const record = await (await addRecord()).json();

  const bad = await admin.patch(`/api/payroll/${record._id}`, { status: 'paid', method: 'bitcoin' });
  expect(bad.status()).toBe(400);

  const paidRes = await admin.patch(`/api/payroll/${record._id}`, {
    status: 'paid',
    method: 'zelle',
    reference: 'QA-REF-1',
  });
  expect(paidRes.status()).toBe(200);
  const paid = await paidRes.json();
  expect(paid.status).toBe('paid');
  expect(paid.method).toBe('zelle');
  expect(paid.reference).toBe('QA-REF-1');
  expect(paid.paidAt).toBeTruthy();
  expect(paid.paidBy).toBe(ids.adminId);

  // A record that says someone was paid can't just be deleted.
  expect((await admin.delete(`/api/payroll/${record._id}`)).status()).toBe(409);

  const undone = await (await admin.patch(`/api/payroll/${record._id}`, { status: 'unpaid' })).json();
  expect(undone.status).toBe('unpaid');
  expect(undone.paidAt).toBeNull();
  expect(undone.method).toBe('');
  expect(undone.reference).toBe('');
});

test('an unpaid record can be deleted', async () => {
  const record = await (await addRecord()).json();
  expect((await admin.delete(`/api/payroll/${record._id}`)).status()).toBe(204);
  created.pop();
  const list = await (await admin.get('/api/payroll')).json();
  expect(list.some((p) => p._id === record._id)).toBeFalsy();
});

test('a coach sees only their own pay history and cannot change anything', async () => {
  const record = await (await addRecord()).json();

  const mine = await (await coach.get('/api/payroll')).json();
  expect(mine.some((p) => p._id === record._id)).toBeTruthy();
  expect(mine.every((p) => p.coachUserId === ids.coachId)).toBeTruthy();

  expect((await coach.post('/api/payroll', { coachUserId: ids.coachId, ...period, amountCents: 100 })).status()).toBe(403);
  expect((await coach.patch(`/api/payroll/${record._id}`, { status: 'paid' })).status()).toBe(403);
  expect((await coach.delete(`/api/payroll/${record._id}`)).status()).toBe(403);
  expect((await coach.get('/api/payroll/payees')).status()).toBe(403);
});

test('a parent cannot see coach pay', async () => {
  const record = await (await addRecord()).json();

  const theirs = await (await parent.get('/api/payroll')).json();
  expect(theirs.some((p) => p._id === record._id)).toBeFalsy();
  expect((await parent.get(`/api/payroll?coachUserId=${ids.coachId}`)).status()).toBe(403);
  expect((await parent.post('/api/payroll', { coachUserId: ids.coachId, ...period, amountCents: 100 })).status()).toBe(403);
});

// ---------- Stripe Connect payouts ----------
// Read-only or refusal checks only: nothing here creates a Stripe account or
// sends money. The QA coach has no Stripe account, so a payout must be refused.

test('admin can see which Stripe account payouts come from', async () => {
  const res = await admin.get('/api/payroll/connect/platform');
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.accountId).toMatch(/^acct_/);
  expect(typeof body.connectEnabled).toBe('boolean');
});

test('a coach can read their own payout setup status', async () => {
  const res = await coach.get('/api/payroll/connect/me');
  expect(res.status()).toBe(200);
  expect(['not_started', 'incomplete', 'ready']).toContain((await res.json()).status);
});

test('a payout is refused for a coach who has not set up Stripe', async () => {
  const record = await (await addRecord()).json();
  const res = await admin.post(`/api/payroll/${record._id}/stripe-payout`, {});
  expect(res.status()).toBe(400);
  expect((await res.json()).message).toMatch(/hasn't set up Stripe payouts/);
  const after = (await (await admin.get('/api/payroll')).json()).find((p) => p._id === record._id);
  expect(after.status).toBe('unpaid');
});

test('Stripe payout endpoints are limited to the right roles', async () => {
  const record = await (await addRecord()).json();

  expect((await coach.post(`/api/payroll/${record._id}/stripe-payout`, {})).status()).toBe(403);
  expect((await parent.post(`/api/payroll/${record._id}/stripe-payout`, {})).status()).toBe(403);
  expect((await coach.get('/api/payroll/connect/platform')).status()).toBe(403);
  expect((await coach.get('/api/payroll/connect/coaches')).status()).toBe(403);
  expect((await parent.get('/api/payroll/connect/me')).status()).toBe(403);
  expect((await parent.post('/api/payroll/connect/onboard', {})).status()).toBe(403);
  expect((await admin.post('/api/payroll/connect/onboard', {})).status()).toBe(403);
});
