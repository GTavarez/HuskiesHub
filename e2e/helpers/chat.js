import { io } from 'socket.io-client';
import { apiBaseUrl } from '../fixtures/accounts.js';

// A real socket.io connection into one chat room, the way the app does it, for
// tests that need live delivery or the send acknowledgement.
function connectChat(token, room) {
  return new Promise((resolve, reject) => {
    const socket = io(apiBaseUrl, { auth: { token, ...room }, transports: ['websocket'], reconnection: false });
    const received = [];
    const updated = [];
    socket.on('new-message', (m) => received.push(m));
    socket.on('message-updated', (m) => updated.push(m));
    const timer = setTimeout(() => {
      socket.close();
      reject(new Error('socket did not connect'));
    }, 8000);
    socket.on('connect', () => {
      clearTimeout(timer);
      // The server joins the room just after the connection is accepted; give
      // it a moment so a message sent right away is not missed.
      setTimeout(() => resolve({ socket, received, updated }), 250);
    });
    socket.on('connect_error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

// Sends and waits for the server's ack: { ok, message } or { ok:false, error }.
function sendChat(socket, payload) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('no ack from server')), 8000);
    socket.emit('send-message', payload, (ack) => {
      clearTimeout(timer);
      resolve(ack);
    });
  });
}

// Resolves once `check()` is true, or throws after a timeout.
async function waitFor(check, ms = 5000) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    if (check()) return;
    // eslint-disable-next-line no-await-in-loop
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error('timed out waiting for condition');
}

export { connectChat, sendChat, waitFor };
