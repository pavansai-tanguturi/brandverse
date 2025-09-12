import assert from 'assert';
import { logout } from '../src/controllers/authController.js';

(async () => {
  try {
    const req = { session: { destroy(cb){ cb(); } } };
    let sent = null;
    const res = { json(payload) { sent = payload; } };

    await logout(req, res);

    assert(sent, 'No response sent');
    assert.strictEqual(sent.message, 'Logged out');

    console.log('PASS authController logout test');
    process.exit(0);
  } catch (err) {
    console.error('FAIL authController logout test');
    console.error(err);
    process.exit(1);
  }
})();
