import { test, expect } from '@playwright/test';
import { apiSignIn } from '../helpers/api.js';
import { accounts, ids } from '../fixtures/accounts.js';

// Drives the real chat screen: attach a photo, add a caption, send, and see it
// rendered (through the authenticated fetch) in the message list.

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

test('a parent can attach and send a photo in the team chat', async ({ page, request }) => {
  const token = await apiSignIn(request, accounts.parent.email, accounts.parent.password);
  await page.addInitScript((jwt) => localStorage.setItem('jwt', jwt), token);

  await page.goto(`/teams/${ids.teamId}`);
  await page.getByRole('button', { name: /team chat/i }).click();

  await page.getByTestId('chat-photo-input').setInputFiles({
    name: 'qa-ui.png',
    mimeType: 'image/png',
    buffer: PNG,
  });
  await expect(page.getByAltText('Photo to send')).toBeVisible();

  const caption = `QA E2E UI photo ${Date.now()}`;
  await page.getByPlaceholder(/caption/i).fill(caption);
  await page.getByRole('button', { name: /^send$/i }).click();

  const bubble = page.locator('.team-chat__message', { hasText: caption });
  await expect(bubble).toBeVisible();
  const img = bubble.getByAltText('Shared in chat');
  await expect(img).toBeVisible();
  await expect
    .poll(() => img.evaluate((el) => el.naturalWidth))
    .toBeGreaterThan(0);

  // The picker resets once the photo is sent.
  await expect(page.getByAltText('Photo to send')).toHaveCount(0);
});
