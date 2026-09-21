import { test, expect } from '@playwright/test';
import { apiSignIn, authed } from '../helpers/api.js';
import { accounts, ids } from '../fixtures/accounts.js';

// Drives the real profile screen as the QA parent: edit the private phone and
// the SAT/ACT scores, and confirm a logged-out visitor sees none of it.

let admin;

test.beforeEach(async ({ request }) => {
  admin = authed(request, await apiSignIn(request, accounts.admin.email, accounts.admin.password));
});

test.afterEach(async () => {
  await admin.patch(`/api/players/${ids.playerId}`, { phone: '', contactEmail: '' });
  await admin.put(`/api/recruiting-profiles/${ids.playerId}`, { satScore: null, actScore: null });
});

test('a parent can add a phone number and test scores on their child\'s profile', async ({ page, request }) => {
  const token = await apiSignIn(request, accounts.parent.email, accounts.parent.password);
  await page.addInitScript((jwt) => localStorage.setItem('jwt', jwt), token);

  await page.goto(`/teams/${ids.teamId}`);
  await page.getByRole('button', { name: /view profile/i }).first().click();
  await page.getByRole('button', { name: /edit profile/i }).click();

  await page.getByLabel(/phone \(private\)/i).fill('201 555 0142');
  await page.getByLabel(/sat score/i).fill('1310');
  await page.getByLabel(/act score/i).fill('29');
  await page.getByRole('button', { name: /save changes/i }).click();

  const details = page.locator('.profile__section', { hasText: 'Private Details' });
  await expect(details).toBeVisible();
  await expect(details.getByRole('link', { name: '(201) 555-0142' })).toBeVisible();
  await expect(details).toContainText('SAT: 1310');
  await expect(details).toContainText('ACT: 29');
});

test('out-of-range scores are stopped before saving', async ({ page, request }) => {
  const token = await apiSignIn(request, accounts.parent.email, accounts.parent.password);
  await page.addInitScript((jwt) => localStorage.setItem('jwt', jwt), token);

  await page.goto(`/teams/${ids.teamId}`);
  await page.getByRole('button', { name: /view profile/i }).first().click();
  await page.getByRole('button', { name: /edit profile/i }).click();

  await page.getByLabel(/sat score/i).fill('1700');
  await page.getByRole('button', { name: /save changes/i }).click();

  // The browser's own range check stops the save, so the form stays open.
  const sat = page.getByLabel(/sat score/i);
  expect(await sat.evaluate((el) => el.validity.rangeOverflow)).toBe(true);
  await expect(page.getByRole('button', { name: /save changes/i })).toBeVisible();
});

test('a logged-out visitor sees no private details on a player profile', async ({ page }) => {
  await admin.patch(`/api/players/${ids.playerId}`, { phone: '2015550142' });
  await admin.put(`/api/recruiting-profiles/${ids.playerId}`, { satScore: 1310, actScore: 29 });

  await page.goto(`/teams/${ids.teamId}`);
  await page.getByRole('button', { name: /view profile/i }).first().click();
  // Logged out, the full profile isn't shown at all, only a sign-in prompt.
  await expect(page.getByText(/sign in to view full player profile/i)).toBeVisible();

  await expect(page.getByText('Private Details')).toHaveCount(0);
  await expect(page.getByText('555-0142')).toHaveCount(0);
  await expect(page.getByText(/SAT:/)).toHaveCount(0);
  await expect(page.getByRole('button', { name: /edit profile/i })).toHaveCount(0);
});

// Uses a made-up school; the QA player is marked committed only for this test
// and is always restored, and the logo is removed afterwards.
test('a parent can add a school logo for their committed player, and it shows on the profile', async ({ page, request }) => {
  const PNG = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64'
  );
  await admin.delete('/api/college-logos/qatestuniversity');
  try {
    await admin.patch(`/api/players/${ids.playerId}`, { isCommitted: true, committedCollege: 'QA Test University' });

    const token = await apiSignIn(request, accounts.parent.email, accounts.parent.password);
    await page.addInitScript((jwt) => localStorage.setItem('jwt', jwt), token);
    await page.goto(`/teams/${ids.teamId}`);
    await page.getByRole('button', { name: /view profile/i }).first().click();

    await expect(page.locator('.profile__commit')).toContainText('Committed to QA Test University');
    await page.getByTestId('college-logo-input').setInputFiles({ name: 'logo.png', mimeType: 'image/png', buffer: PNG });

    const logo = page.locator('.profile__commit img[alt="QA Test University logo"]');
    await expect(logo).toBeVisible();
    await expect.poll(() => logo.evaluate((el) => el.naturalWidth)).toBeGreaterThan(0);
    // Once a logo exists, a family no longer sees the upload button.
    await expect(page.getByRole('button', { name: /add school logo/i })).toHaveCount(0);
  } finally {
    await admin.delete('/api/college-logos/qatestuniversity');
    await admin.patch(`/api/players/${ids.playerId}`, { isCommitted: false, committedCollege: '' });
  }
});
