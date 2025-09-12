import assert from 'assert';
import { login } from '../src/controllers/authController.js';

// Arrange env to match the backend .env values used for admin
process.env.AUTH_U = process.env.AUTH_U || 'admin';
process.env.AUTH_P = process.env.AUTH_P || 'admin123';
process.env.ADMIN_ID = process.env.ADMIN_ID || '00000000-0000-0000-0000-000000000000';
process.env.ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';

(async () => {
  try {
    // Mock request/response
    const req = { body: { email: process.env.AUTH_U, password: process.env.AUTH_P }, session: {} };
    let sent = null;
    const res = {
      status(code) { this._status = code; return this; },
      json(payload) { sent = payload; }
    };

    await login(req, res);

    assert(sent, 'No response sent');
    assert.strictEqual(sent.admin, true, 'Expected admin=true in response');
    assert.strictEqual(sent.message, 'Admin logged in');
    assert(req.session && req.session.user && req.session.user.isAdmin === true, 'Session not marked as admin');

    console.log('PASS authController admin login test');
    process.exit(0);
  } catch (err) {
    console.error('FAIL authController admin login test');
    console.error(err);
    process.exit(1);
  }
})();
