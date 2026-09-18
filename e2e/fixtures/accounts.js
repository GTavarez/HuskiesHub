// Dedicated QA-only accounts and IDs — created once via a one-off DB script,
// never real staff or family data. See scratch_setup_qa_fixtures.js in the
// backend repo for how these were created (team/player/admin/coach/parent).
// FOREIGN_TEAM_ID is a real team used only as a negative-permission target —
// tests must only ever assert a 403 against it, never write to it.

const QA_PASSWORD = 'QaTest#2026Secure';

export const accounts = {
  admin: { email: 'qa-admin@example.com', password: QA_PASSWORD, name: 'QA Admin' },
  coach: { email: 'qa-coach@example.com', password: QA_PASSWORD, name: 'QA Coach' },
  parent: { email: 'qa-parent@example.com', password: QA_PASSWORD, name: 'QA Parent' },
};

export const ids = {
  teamId: '6aad64e1ed3bd0957b8fcf2c',
  playerId: '6aad64e2ed3bd0957b8fcf2f',
  adminId: '6aad64e2ed3bd0957b8fcf33',
  coachId: '6aad64e2ed3bd0957b8fcf36',
  parentId: '6aad64e2ed3bd0957b8fcf39',
  // Premier — a real team, used ONLY to assert a coach gets a 403 trying to
  // touch it. Never written to.
  foreignTeamId: '695d3b42510e717bb7cca3e1',
};

export const apiBaseUrl = process.env.QA_API_URL || 'https://huskieshub-backend-891073803869.us-central1.run.app';
