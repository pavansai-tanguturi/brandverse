import assert from 'assert';
import { me } from '../src/controllers/authController.js';

(async () => {
  try {
    const req = { session: { user: { id: '00000000-0000-0000-0000-000000000000', email: 'admin@example.com', isAdmin: true } } };
    let sent = null;
    const res = { json(payload) { sent = payload; } };

    await me(req, res);

    assert(sent, 'No response sent');
    assert(sent.user, 'User missing');
    assert.strictEqual(sent.admin, true, 'Expected admin=true');

    console.log('PASS authController me test');
    process.exit(0);
  } catch (err) {
    console.error('FAIL authController me test');
    console.error(err);
    process.exit(1);
  }
})();
