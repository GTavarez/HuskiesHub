// Dedicated QA-only accounts and IDs, never real staff or family data.
// FOREIGN_TEAM_ID is a real team used only as a negative-permission target:
// tests must only ever assert a 403 against it, never write to it.
//
// The QA admin account has the admin role on production, so its password
// must NEVER be committed. It is read from the QA_PASSWORD environment
// variable (locally: a gitignored qa.env file, see qa.env.example; in the
// nightly cloud routine: an environment variable on the cloud environment).

const QA_PASSWORD = process.env.QA_PASSWORD;

if (!QA_PASSWORD) {
  throw new Error(
    'QA_PASSWORD is not set. Locally, copy qa.env.example to qa.env and fill it in. ' +
      'In the cloud routine, set QA_PASSWORD as an environment variable on the environment.'
  );
}

export const accounts = {
  admin: { email: 'qa-admin@example.com', password: QA_PASSWORD, name: 'QA Admin' },
  coach: { email: 'qa-coach@example.com', password: QA_PASSWORD, name: 'QA Coach' },
  parent: { email: 'qa-parent@example.com', password: QA_PASSWORD, name: 'QA Parent' },
};

export const ids = {
  teamId: '6aad64e1ed3bd0957b8fcf2c',
  playerId: '6aad64e2ed3bd0957b8fcf2f',
  adminId: '6ab00c3fff9f4e446fe0e3eb',
  coachId: '6ab00c3fff9f4e446fe0e3ee',
  parentId: '6ab00c3fff9f4e446fe0e3f0',
  // Premier: a real team, used ONLY to assert a coach gets a 403 trying to
  // touch it. Never written to.
  foreignTeamId: '695d3b42510e717bb7cca3e1',
};

export const apiBaseUrl = process.env.QA_API_URL || 'https://huskieshub-backend-891073803869.us-central1.run.app';
