import { supabaseAdmin } from '../config/supabaseClient.js';
import { ensureCustomer } from '../models/userModel.js';

export async function sessionFromToken(req, res) {
  try {
    const { access_token } = req.body;
    if (!access_token) return res.status(400).json({ error: 'access_token required' });

    const { data, error } = await supabaseAdmin.auth.getUser(access_token);
    if (error) return res.status(400).json({ error: error.message });
    const user = data?.user;
    if (!user) return res.status(400).json({ error: 'invalid token' });

    // If the token belongs to admin email or admin id, create server session
    const adminId = process.env.ADMIN_ID;
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail && user.email && user.email.toLowerCase() === adminEmail.toLowerCase()) {
      req.session.user = { id: adminId || user.id, email: user.email, isAdmin: true };
      try { await ensureCustomer({ id: req.session.user.id, email: user.email }); } catch (e) { /* ignore */ }
      return res.json({ message: 'Admin session created', user: req.session.user });
    }

    return res.status(403).json({ error: 'Not an admin' });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

export async function sessionFromEmail(req, res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'email required' });
    const adminId = process.env.ADMIN_ID;
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail && email && email.toLowerCase() === adminEmail.toLowerCase()) {
      req.session.user = { id: adminId || 'admin', email: adminEmail, isAdmin: true };
      try { await ensureCustomer({ id: req.session.user.id, email: adminEmail }); } catch (e) { /* ignore */ }
      return res.json({ message: 'Admin session created', user: req.session.user });
    }
    return res.status(403).json({ error: 'Not an admin' });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
