import { copyFileSync, readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';
import { apiSignIn, authed } from '../helpers/api.js';
import { accounts, ids, apiBaseUrl } from '../fixtures/accounts.js';

// The showcase profile sheet is a tournament roster in a fixed column order
// (#, name, grad year, throws/hits, positions, committed, SAT/ACT, GPA,
// city/state, phone, email). It carries private data, so only admins and that
// team's coach can build it. All data is on the dummy QA player and is cleared
// afterwards.

let admin;
let coach;
let parent;

test.beforeEach(async ({ request }) => {
  admin = authed(request, await apiSignIn(request, accounts.admin.email, accounts.admin.password));
  coach = authed(request, await apiSignIn(request, accounts.coach.email, accounts.coach.password));
  parent = authed(request, await apiSignIn(request, accounts.parent.email, accounts.parent.password));
});

test.afterEach(async () => {
  await admin.patch(`/api/players/${ids.playerId}`, {
    phone: '',
    city: '',
    contactEmail: '',
    state: '',
    position: '',
    battingThrowing: '',
  });
  await admin.put(`/api/recruiting-profiles/${ids.playerId}`, { satScore: null, actScore: null });
});

async function fillQaPlayer() {
  const res = await admin.patch(`/api/players/${ids.playerId}`, {
    phone: '2015550142',
    city: 'Testville',
    state: 'NJ',
    contactEmail: 'qa-sheet@example.com',
    position: 'OF/2B',
    battingThrowing: 'L/R',
  });
  expect(res.status()).toBe(200);
  await admin.put(`/api/recruiting-profiles/${ids.playerId}`, { satScore: 1310, actScore: 29 });
}

test('a team\'s coach and admins can fetch the showcase details; nobody else can', async ({ request }) => {
  await fillQaPlayer();

  for (const who of [admin, coach]) {
    const res = await who.get(`/api/players/team/${ids.teamId}/showcase-details`);
    expect(res.status()).toBe(200);
    const row = (await res.json()).find((d) => d.playerId === ids.playerId);
    expect(row).toMatchObject({
      phone: '(201) 555-0142',
      city: 'Testville',
      contactEmail: 'qa-sheet@example.com',
      satScore: 1310,
      actScore: 29,
    });
  }

  // A family isn't allowed, and neither is a coach looking at another team.
  expect((await parent.get(`/api/players/team/${ids.teamId}/showcase-details`)).status()).toBe(403);
  expect((await coach.get(`/api/players/team/${ids.otherTeamId}/showcase-details`)).status()).toBe(403);
  const anon = await request.get(`${apiBaseUrl}/api/players/team/${ids.teamId}/showcase-details`);
  expect(anon.status()).toBe(401);
});

test('a player\'s city is private, like phone and email', async ({ request }) => {
  await fillQaPlayer();

  const publicRoster = await (await request.get(`${apiBaseUrl}/api/players/team/${ids.teamId}`)).json();
  const qaPlayer = publicRoster.find((p) => p._id === ids.playerId);
  expect(qaPlayer.city).toBeUndefined();
  expect(qaPlayer.phone).toBeUndefined();
  expect(JSON.stringify(publicRoster)).not.toContain('Testville');

  const contact = await (await parent.get(`/api/players/${ids.playerId}/contact`)).json();
  expect(contact.city).toBe('Testville');
});

test('an admin can download the sheet, in the right column order, with the private details', async ({ page, request }) => {
  await fillQaPlayer();
  const token = await apiSignIn(request, accounts.admin.email, accounts.admin.password);
  await page.addInitScript((jwt) => localStorage.setItem('jwt', jwt), token);

  await page.goto(`/teams/${ids.teamId}`);
  await page.getByRole('button', { name: /^download team roster pdf$/i }).click();

  await page.getByLabel(/showcase or tournament name/i).fill('Jersey Outlaws');
  await page.getByLabel(/^manager name/i).fill('Pat Manager');
  await page.getByLabel(/^manager phone/i).fill('(201) 555-0199');
  await page.getByLabel(/^manager email/i).fill('pat@example.com');

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /download pdf/i }).click();
  const download = await downloadPromise;
  const path = await download.path();
  const pdf = readFileSync(path, 'latin1');
  if (process.env.SAVE_SHEET_PDF) copyFileSync(path, process.env.SAVE_SHEET_PDF);

  expect(download.suggestedFilename()).toMatch(/showcase-profile-sheet\.pdf$/);
  expect(pdf.startsWith('%PDF')).toBe(true);
  for (const expected of [
    'Jersey Outlaws Showcase Profile Sheet',
    'Pat Manager',
    'pat@example.com',
    'QA Test Player',
    'Player Email',
    'SAT 1310',
    'ACT 29',
    // PDFs escape parentheses, so match the number without the "(201)".
    ') 555-0142',
    'qa-sheet@example.com',
    'Testville, NJ',
    'OF/2B',
  ]) {
    expect(pdf, `PDF should contain "${expected}"`).toContain(expected);
  }
  // "Bats/Throws L/R" is printed as Throws/Hits, so the letters swap.
  expect(pdf).toContain('R/L');

  // Column headings appear left to right in the required order.
  const order = ['Player Name', 'Grad', 'Throws/Hits', 'Positions', 'Committed', 'SAT/ACT', 'GPA', 'City/State', 'Player Phone', 'Player Email'];
  const positions = order.map((label) => pdf.indexOf(label));
  expect(positions.every((p) => p > -1)).toBe(true);
  expect([...positions].sort((a, b) => a - b)).toEqual(positions);
});

test('a parent does not get the roster sheet button', async ({ page, request }) => {
  const token = await apiSignIn(request, accounts.parent.email, accounts.parent.password);
  await page.addInitScript((jwt) => localStorage.setItem('jwt', jwt), token);
  await page.goto(`/teams/${ids.teamId}`);
  await expect(page.locator('.players__header-actions')).toBeVisible();
  await expect(page.getByRole('button', { name: /roster pdf/i })).toHaveCount(0);
});
