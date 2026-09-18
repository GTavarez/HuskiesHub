// Logs in through the real header UI, exactly as a person would — catches
// breakage in the login modal itself, not just the API underneath it.
async function loginAs(page, account) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.locator('#login-email').fill(account.email);
  await page.locator('#login-password').fill(account.password);
  await page.getByRole('button', { name: 'Log in' }).click();
  await page.getByText(account.name).first().waitFor({ state: 'visible', timeout: 10000 });
}

export { loginAs };
