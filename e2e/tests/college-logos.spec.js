import { test, expect } from '@playwright/test';
import { apiSignIn, authed } from '../helpers/api.js';
import { accounts, ids, apiBaseUrl } from '../fixtures/accounts.js';

// School logos are stored once per college and shared by every committed player
// there. Admins and coaches can add or replace any logo; a family can only add
// one for their own player's school, and only when none exists yet.
//
// The QA player is marked committed to a made-up school only for the length of
// each test, and is always restored, so it can't linger on the public page.

const COLLEGE = 'QA Test University';
const KEY = 'qatestuniversity';

// Smallest valid PNG (1x1 pixel).
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

let tokens;
let admin;

test.beforeEach(async ({ request }) => {
  tokens = {
    admin: await apiSignIn(request, accounts.admin.email, accounts.admin.password),
    coach: await apiSignIn(request, accounts.coach.email, accounts.coach.password),
    parent: await apiSignIn(request, accounts.parent.email, accounts.parent.password),
  };
  admin = authed(request, tokens.admin);
  // Start every test from a clean slate.
  await admin.delete(`/api/college-logos/${KEY}`);
});

test.afterEach(async () => {
  await admin.delete(`/api/college-logos/${KEY}`);
  await admin.patch(`/api/players/${ids.playerId}`, { isCommitted: false, committedCollege: '' });
});

function postLogo(request, token, fields, file = { name: 'logo.png', mimeType: 'image/png', buffer: PNG }) {
  return request.post(`${apiBaseUrl}/api/college-logos`, {
    headers: { Authorization: `Bearer ${token}` },
    multipart: { ...fields, logo: file },
  });
}

async function commitQaPlayer() {
  const res = await admin.patch(`/api/players/${ids.playerId}`, { isCommitted: true, committedCollege: COLLEGE });
  expect(res.status()).toBe(200);
}

test('an admin can add a logo and anyone can see it, with no login', async ({ request }) => {
  const res = await postLogo(request, tokens.admin, { college: COLLEGE });
  expect(res.status()).toBe(201);
  expect((await res.json()).key).toBe(KEY);

  const list = await (await request.get(`${apiBaseUrl}/api/college-logos`)).json();
  expect(list.some((l) => l.key === KEY)).toBeTruthy();

  const img = await request.get(`${apiBaseUrl}/api/college-logos/${KEY}/image`);
  expect(img.status()).toBe(200);
  expect(img.headers()['content-type']).toBe('image/png');
  expect(img.headers()['x-content-type-options']).toBe('nosniff');
  expect((await img.body()).equals(PNG)).toBeTruthy();
});

test('the same school in different spelling shares one logo', async ({ request }) => {
  await postLogo(request, tokens.admin, { college: COLLEGE });
  const again = await postLogo(request, tokens.coach, { college: '  qa TEST university ' });
  // Same key, so this replaced the existing logo instead of adding a second.
  expect(again.status()).toBe(200);
  const list = await (await request.get(`${apiBaseUrl}/api/college-logos`)).json();
  expect(list.filter((l) => l.key === KEY)).toHaveLength(1);
});

test('a family can add the logo for their own player\'s school, once', async ({ request }) => {
  await commitQaPlayer();

  const first = await postLogo(request, tokens.parent, { college: COLLEGE, playerId: ids.playerId });
  expect(first.status()).toBe(201);

  const second = await postLogo(request, tokens.parent, { college: COLLEGE, playerId: ids.playerId });
  expect(second.status()).toBe(409);

  // A coach can still replace it.
  const replaced = await postLogo(request, tokens.coach, { college: COLLEGE });
  expect(replaced.status()).toBe(200);
});

test('a family cannot add a logo for a school their player did not commit to', async ({ request }) => {
  await commitQaPlayer();

  const wrongSchool = await postLogo(request, tokens.parent, { college: 'Some Other College', playerId: ids.playerId });
  expect(wrongSchool.status()).toBe(403);

  const noPlayer = await postLogo(request, tokens.parent, { college: COLLEGE });
  expect(noPlayer.status()).toBe(403);

  const notTheirPlayer = await postLogo(request, tokens.parent, { college: COLLEGE, playerId: ids.otherPlayerId });
  expect(notTheirPlayer.status()).toBe(403);
});

test('a family cannot add a logo when their player is not committed', async ({ request }) => {
  const res = await postLogo(request, tokens.parent, { college: COLLEGE, playerId: ids.playerId });
  expect(res.status()).toBe(403);
});

test('only admins can delete a logo', async ({ request }) => {
  await postLogo(request, tokens.admin, { college: COLLEGE });
  expect(
    (await request.delete(`${apiBaseUrl}/api/college-logos/${KEY}`, { headers: { Authorization: `Bearer ${tokens.coach}` } })).status()
  ).toBe(403);
  expect(
    (await request.delete(`${apiBaseUrl}/api/college-logos/${KEY}`, { headers: { Authorization: `Bearer ${tokens.parent}` } })).status()
  ).toBe(403);
  expect((await admin.delete(`/api/college-logos/${KEY}`)).status()).toBe(204);
  expect((await request.get(`${apiBaseUrl}/api/college-logos/${KEY}/image`)).status()).toBe(404);
});

test('logos must be real images of a reasonable size, and uploads need a login', async ({ request }) => {
  const svg = await postLogo(
    request,
    tokens.admin,
    { college: COLLEGE },
    { name: 'x.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>') }
  );
  expect(svg.status()).toBe(400);

  const big = await postLogo(
    request,
    tokens.admin,
    { college: COLLEGE },
    { name: 'big.png', mimeType: 'image/png', buffer: Buffer.alloc(4 * 1024 * 1024) }
  );
  expect(big.status()).toBe(400);
  expect((await big.json()).message).toMatch(/too large/i);

  const noName = await postLogo(request, tokens.admin, { college: '   ' });
  expect(noName.status()).toBe(400);

  const anon = await request.post(`${apiBaseUrl}/api/college-logos`, {
    multipart: { college: COLLEGE, logo: { name: 'logo.png', mimeType: 'image/png', buffer: PNG } },
  });
  expect(anon.status()).toBe(401);
});

test('the public committed list only carries what the commitments page shows', async ({ request }) => {
  await commitQaPlayer();
  const res = await request.get(`${apiBaseUrl}/api/players/committed`);
  expect(res.status()).toBe(200);
  const player = (await res.json()).find((p) => p._id === ids.playerId);
  expect(player.committedCollege).toBe(COLLEGE);
  for (const field of ['phone', 'contactEmail', 'GPA', 'bio']) {
    expect(player[field]).toBeUndefined();
  }
});
