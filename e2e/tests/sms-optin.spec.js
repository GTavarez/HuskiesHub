import { test, expect } from '@playwright/test';
import { apiSignIn, authed } from '../helpers/api.js';
import { accounts } from '../fixtures/accounts.js';

// Parents choose to get texts about schedule changes, cancellations and urgent
// messages. These tests cover the choice itself. No real text is ever sent: the
// QA parent is a test account, which never receives real notifications.

let parent;
let before;

const me = async () => (await parent.get('/me')).json();
const save = async (fields) => parent.patch('/me', { name: before.name, avatar: before.avatar, ...fields });

test.beforeEach(async ({ request }) => {
  parent = authed(request, await apiSignIn(request, accounts.parent.email, accounts.parent.password));
  before = await me();
});

test.afterEach(async () => {
  // Put the QA parent back the way it was.
  await save({ phone: before.phone || '', smsOptIn: false });
});

test('a parent can opt in to texts once a mobile number is saved, and opt out again', async () => {
  const on = await save({ phone: '(555) 010-0199', smsOptIn: true });
  expect(on.status()).toBe(200);
  expect((await on.json()).user.smsOptIn).toBe(true);
  expect((await me()).smsOptIn).toBe(true);

  const off = await save({ smsOptIn: false });
  expect(off.status()).toBe(200);
  expect((await me()).smsOptIn).toBe(false);
});

test('opting in without a usable number is refused', async () => {
  await save({ phone: '', smsOptIn: false });
  const refused = await save({ smsOptIn: true });
  expect(refused.status()).toBe(400);
  expect((await refused.json()).message).toMatch(/mobile number/i);
  expect((await me()).smsOptIn).toBe(false);

  const short = await save({ phone: '12345', smsOptIn: true });
  expect(short.status()).toBe(400);
});

test('clearing the number turns texts off', async () => {
  await save({ phone: '555-010-0199', smsOptIn: true });
  expect((await me()).smsOptIn).toBe(true);
  await save({ phone: '' });
  expect((await me()).smsOptIn).toBe(false);
});

test('saving the profile without mentioning texts leaves the choice alone', async () => {
  await save({ phone: '555-010-0199', smsOptIn: true });
  await save({ phone: '555-010-0188' });
  expect((await me()).smsOptIn).toBe(true);
});
