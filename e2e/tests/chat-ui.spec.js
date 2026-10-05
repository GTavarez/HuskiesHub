import { test, expect } from '@playwright/test';
import { apiSignIn, authed } from '../helpers/api.js';
import { connectChat, sendChat } from '../helpers/chat.js';
import { accounts, ids } from '../fixtures/accounts.js';

// Drives the real chat screen in a browser: sending, replying, reactions,
// editing, deleting, the @mention picker, pins, unread, and starting a private
// message. Runs in the dummy QA team's chat with QA accounts only.

let admin;
let parent;
let coach;
let tokens;

test.beforeEach(async ({ request }) => {
  tokens = {
    admin: await apiSignIn(request, accounts.admin.email, accounts.admin.password),
    parent: await apiSignIn(request, accounts.parent.email, accounts.parent.password),
    coach: await apiSignIn(request, accounts.coach.email, accounts.coach.password),
  };
  admin = authed(request, tokens.admin);
  parent = authed(request, tokens.parent);
  coach = authed(request, tokens.coach);
});

test.afterEach(async () => {
  // Clear what the test posted: team chat via the admin (a moderator), and the
  // private chat through its own members.
  const team = await (await admin.get(`/api/messages/${ids.teamId}?limit=100`)).json();
  await Promise.all(team.filter((m) => /^QA E2E UI/.test(m.text)).map((m) => admin.delete(`/api/messages/${m._id}`)));
  const dms = await (await parent.get(`/api/conversations?teamId=${ids.teamId}`)).json();
  await Promise.all(
    dms
      .filter((c) => c.kind === 'direct')
      .map(async (c) => {
        const msgs = await (await parent.get(`/api/conversations/${c._id}/messages`)).json();
        await Promise.all(
          msgs
            .filter((m) => /^QA E2E UI/.test(m.text))
            .map((m) => (m.senderId === ids.parentId ? parent : coach).delete(`/api/messages/${m._id}`))
        );
      })
  );
  await coach.patch('/api/chat/settings', { teamId: ids.teamId, announcementOnly: false });
});

async function openTeamChat(page, token) {
  await page.addInitScript((jwt) => localStorage.setItem('jwt', jwt), token);
  await page.goto(`/teams/${ids.teamId}`);
  await page.getByRole('button', { name: /team chat/i }).first().click();
  await expect(page.getByLabel('Message', { exact: true })).toBeVisible();
}

// Matches on the message's own text, not a quote of it inside a reply.
const bubble = (page, text) =>
  page.locator('.team-chat__message').filter({ has: page.locator('.chat-msg__text', { hasText: text }) });

async function send(page, text) {
  await page.getByLabel('Message', { exact: true }).fill(text);
  await page.getByRole('button', { name: /^send$/i }).click();
  await expect(bubble(page, text)).toBeVisible();
}

async function option(page, text, name) {
  const b = bubble(page, text);
  await b.hover();
  await b.getByRole('button', { name: 'Message options' }).click();
  await page.getByRole('menuitem', { name }).click();
}

test('send, reply, react, edit and delete @browser', async ({ page }) => {
  page.on('dialog', (dialog) => dialog.accept());
  await openTeamChat(page, tokens.parent);

  const first = `QA E2E UI first ${Date.now()}`;
  await send(page, first);
  await expect(bubble(page, first)).toHaveClass(/mine/);
  await expect(page.locator('.team-chat__day', { hasText: 'Today' }).first()).toBeVisible();

  // Reply: the new message quotes the original.
  await option(page, first, 'Reply');
  await expect(page.getByText(/replying to/i)).toBeVisible();
  const second = `QA E2E UI reply ${Date.now()}`;
  await send(page, second);
  await expect(bubble(page, second).locator('.chat-msg__quote')).toContainText(first);

  // React: tap an emoji in the menu and a chip with a count appears.
  const b = bubble(page, first);
  await b.hover();
  await b.getByRole('button', { name: 'Message options' }).click();
  await page.getByRole('button', { name: 'React 👍' }).click();
  await expect(b.getByRole('button', { name: '👍 1' })).toBeVisible();

  // Edit: the text changes and is marked edited.
  await option(page, first, 'Edit');
  const edited = `QA E2E UI edited ${Date.now()}`;
  // While editing, the text is an input box rather than text, so find it directly.
  await page.locator('.chat-msg__edit-input').fill(edited);
  await page.locator('.chat-msg__edit').getByRole('button', { name: 'Save' }).click();
  await expect(bubble(page, edited)).toContainText('edited');

  // Delete: the message stays in place but its content is gone.
  await option(page, edited, 'Delete');
  await expect(page.getByText('This message was deleted.').first()).toBeVisible();
  await expect(page.getByText(edited)).toHaveCount(0);
});

test('typing @ offers the people in the chat and inserts the one you pick @browser', async ({ page }) => {
  await openTeamChat(page, tokens.parent);
  const box = page.getByLabel('Message', { exact: true });
  await box.fill('Hi @QA C');
  const picker = page.getByRole('listbox', { name: /people to mention/i });
  await expect(picker).toBeVisible();
  await picker.getByRole('button', { name: /QA Coach/ }).click();
  await expect(box).toHaveValue('Hi @QA Coach ');
});

test('a message from someone else arrives live, and a coach can pin it @browser', async ({ page, browser }) => {
  page.on('dialog', (dialog) => dialog.accept());
  await openTeamChat(page, tokens.parent);

  const coachPage = await browser.newPage();
  await openTeamChat(coachPage, tokens.coach);
  const text = `QA E2E UI from the parent ${Date.now()}`;
  await send(page, text);

  // The coach sees it without refreshing.
  await expect(bubble(coachPage, text)).toBeVisible();
  await expect(bubble(coachPage, text)).toHaveClass(/theirs/);

  // Pinning is a coach tool: the parent's own menu has no pin option.
  await bubble(page, text).hover();
  await bubble(page, text).getByRole('button', { name: 'Message options' }).click();
  await expect(page.getByRole('menuitem', { name: /pin/i })).toHaveCount(0);
  await page.keyboard.press('Escape');

  await option(coachPage, text, 'Pin to top');
  await expect(coachPage.locator('.pinned-bar')).toContainText(text);
  // And it shows for the parent too, live.
  await expect(page.locator('.pinned-bar')).toContainText(text);
  await coachPage.close();
});

test('announcements-only locks the box for parents @browser', async ({ page }) => {
  await openTeamChat(page, tokens.parent);
  await coach.patch('/api/chat/settings', { teamId: ids.teamId, announcementOnly: true });
  await expect(page.getByText('Only coaches and admins can post in this chat.')).toBeVisible();
  await expect(page.getByLabel('Message', { exact: true })).toHaveCount(0);
  await coach.patch('/api/chat/settings', { teamId: ids.teamId, announcementOnly: false });
  await expect(page.getByLabel('Message', { exact: true })).toBeVisible();
});

test('a parent can start a private message with the coach @browser', async ({ page }) => {
  await openTeamChat(page, tokens.parent);
  await page.getByRole('button', { name: 'New message' }).click();
  await page.locator('.chat-hub__picker').getByRole('button', { name: /QA Coach/ }).click();

  // The chat opens, named after the coach, and is listed in the sidebar.
  await expect(page.locator('.team-chat__title-text')).toHaveText(accounts.coach.name);
  const text = `QA E2E UI private ${Date.now()}`;
  await send(page, text);
  await expect(page.locator('.chat-hub__item-name', { hasText: accounts.coach.name }).first()).toBeVisible();
});

test('unread messages show a count on the chat list until they are read @browser', async ({ page }) => {
  await parent.post('/api/chat/read', { teamId: ids.teamId });
  await openTeamChat(page, tokens.parent);

  // Move the parent to a private chat so the team chat is not the open one.
  await page.getByRole('button', { name: 'New message' }).click();
  await page.locator('.chat-hub__picker').getByRole('button', { name: /QA Coach/ }).click();
  await expect(page.locator('.team-chat__title-text')).toHaveText(accounts.coach.name);

  // The coach posts in the team chat through a real connection.
  const text = `QA E2E UI unread ${Date.now()}`;
  const conn = await connectChat(tokens.coach, { teamId: ids.teamId });
  try {
    expect((await sendChat(conn.socket, { text })).ok).toBe(true);
  } finally {
    conn.socket.close();
  }

  // The list refreshes on its own; the team chat shows a count.
  const teamItem = page.locator('.chat-hub__item', { hasText: 'Team Chat' });
  await expect(teamItem.locator('.chat-hub__badge')).toHaveText('1', { timeout: 30000 });

  // Opening it reads it, and the count goes away.
  await teamItem.click();
  await expect(bubble(page, text)).toBeVisible();
  await expect(teamItem.locator('.chat-hub__badge')).toHaveCount(0, { timeout: 15000 });
});
