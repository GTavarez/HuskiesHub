import { existsSync } from 'node:fs';
import { defineConfig } from '@playwright/test';

// Local runs pick up QA_PASSWORD from a gitignored qa.env file. In the cloud
// routine it comes from the environment instead, so the file won't exist.
if (existsSync('qa.env')) {
  process.loadEnvFile('qa.env');
}

// The nightly cloud routine sends HTTPS through a proxy that re-signs traffic
// with its own certificate authority. Node trusts it (NODE_EXTRA_CA_CERTS), but
// the browser Playwright launches does not, so every page.goto fails with
// ERR_CERT_AUTHORITY_INVALID. When that variable is present we are behind such
// a proxy, so the browser is told to accept it. On a normal machine it is not
// set and certificate checking stays fully on. QA_IGNORE_HTTPS_ERRORS=1 forces
// it on by hand.
const behindTlsProxy = Boolean(process.env.NODE_EXTRA_CA_CERTS);
const ignoreHTTPSErrors = behindTlsProxy || process.env.QA_IGNORE_HTTPS_ERRORS === '1';

// Behind that proxy the browser also has to be told where the proxy is and how
// to sign in to it, because Chromium ignores credentials in the proxy variables
// that Node's own requests use. Without this the pages never finish loading.
function proxyFromEnv() {
  if (!behindTlsProxy) return undefined;
  const raw =
    process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy;
  if (!raw) return undefined;
  try {
    const url = new URL(raw);
    return {
      server: `${url.protocol}//${url.host}`,
      username: url.username ? decodeURIComponent(url.username) : undefined,
      password: url.password ? decodeURIComponent(url.password) : undefined,
      bypass: process.env.NO_PROXY || process.env.no_proxy || undefined,
    };
  } catch {
    return undefined;
  }
}

// Tests that drive a real browser are tagged @browser. Set QA_SKIP_BROWSER=1 to
// run everything else (the API tests), for environments where a browser can't
// reach the site.
const skipBrowserTests = process.env.QA_SKIP_BROWSER === '1';

// Runs against the live production frontend/backend: there's no separate
// staging environment for this project. Every test that creates data uses
// the dedicated QA fixtures (see e2e/fixtures/accounts.js) and cleans up
// after itself, so it never touches a real family's or coach's data.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: 0,
  workers: 1,
  grepInvert: skipBrowserTests ? /@browser/ : undefined,
  reporter: [['list']],
  use: {
    ignoreHTTPSErrors,
    proxy: proxyFromEnv(),
    baseURL: process.env.QA_BASE_URL || 'https://huskieshub-frontend-891073803869.us-central1.run.app',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
});
