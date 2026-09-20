# QA E2E suite

Automated tests that run against the live production app (there's no separate
staging environment for this project). They exist to catch the class of bug
that's actually broken this app before — a coach getting too much or too
little access, an announcement leaking across teams — before a real user
finds it.

## Running

First copy `qa.env.example` to `qa.env` and set `QA_PASSWORD` (ask whoever owns the QA accounts; it is never committed). In the nightly cloud routine, set `QA_PASSWORD` as an environment variable on the cloud environment instead.

```bash
npm run test:e2e          # headless, terminal output
npm run test:e2e:ui       # Playwright's interactive UI mode
npx playwright test coach-event-permissions   # just one file
```

## How it stays safe to run against production

- Every test uses the dedicated QA accounts in `e2e/fixtures/accounts.js`
  (`qa-admin@example.com`, `qa-coach@example.com`, `qa-parent@example.com`; password from `QA_PASSWORD`) on
  a dedicated `QA Test Team` — never a real coach, parent, or team.
- Anything a test creates (an event, an announcement) is deleted in an
  `afterEach` hook, via the admin QA account. If a test fails before cleanup
  runs, search for `QA E2E` by title/body in the `events` and `announcements`
  collections and remove it by hand.
- Negative-permission tests (asserting a 403) are allowed to target a real
  team's id (`ids.foreignTeamId`, currently Premier) — but only to prove the
  request gets rejected. Never assert success against it, and never call a
  mutating endpoint there without a same-test check that it was actually
  rejected first.
- **Payments are intentionally out of scope.** Stripe is running in live
  mode (`cs_live_...` session ids), so there's no safe way to exercise a real
  checkout without moving real money. Don't add a test that completes a
  Stripe session — at most, assert that a checkout-session request is
  accepted (started), never that it succeeds through to payment.

## Extending it

Each `*.spec.js` file in `e2e/tests/` is one area. The pattern so far:
1. Sign in via the API (`apiSignIn`) to set up/tear down fixtures fast.
2. Drive at least one flow through the real UI (`loginAs` + Playwright page
   actions) so a broken button or silently-blocked popup gets caught too —
   not just the API underneath it.
3. Assert both the happy path (own team, correct role) and the boundary
   (wrong team, wrong role) for every permission rule you're covering.

Next candidates, roughly in priority order given what's broken so far:
registration/payment role-gating (read-only checks, e.g. a coach getting 403
on `/api/registrations`), RSVP + attendee-name resolution, and the
notification email pipeline (can be asserted via the backend's mailer being
called, without actually needing a real inbox).
