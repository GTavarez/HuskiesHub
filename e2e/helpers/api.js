import { apiBaseUrl } from '../fixtures/accounts.js';

// Direct API access for test setup/teardown and for assertions that don't
// need a browser — signing in for real (through the same /signin endpoint
// the UI hits) rather than minting a JWT by hand, so a change to that flow
// would be caught here too.
async function apiSignIn(request, email, password) {
  const res = await request.post(`${apiBaseUrl}/signin`, {
    data: { email, password },
  });
  if (!res.ok()) {
    throw new Error(`Sign-in failed for ${email}: ${res.status()} ${await res.text()}`);
  }
  const body = await res.json();
  return body.token;
}

function authed(request, token) {
  return {
    get: (path) => request.get(`${apiBaseUrl}${path}`, { headers: { Authorization: `Bearer ${token}` } }),
    post: (path, data) =>
      request.post(`${apiBaseUrl}${path}`, { headers: { Authorization: `Bearer ${token}` }, data }),
    put: (path, data) =>
      request.put(`${apiBaseUrl}${path}`, { headers: { Authorization: `Bearer ${token}` }, data }),
    patch: (path, data) =>
      request.patch(`${apiBaseUrl}${path}`, { headers: { Authorization: `Bearer ${token}` }, data }),
    delete: (path) => request.delete(`${apiBaseUrl}${path}`, { headers: { Authorization: `Bearer ${token}` } }),
  };
}

export { apiSignIn, authed };
