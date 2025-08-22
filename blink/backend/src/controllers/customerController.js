import { supabaseAdmin } from '../config/supabaseClient.js';
import { nanoid } from 'nanoid';

export async function getMe(req, res) {
  if (!req.session?.user) return res.status(401).json({ error: 'Login required' });
  const userId = req.session.user.id;
  const { data, error } = await supabaseAdmin
    .from('customers')
    .select('*')
    .eq('auth_user_id', userId)
    .single();
  if (error) return res.status(404).json({ error: 'Customer record not found' });
  // If avatar_url stores an object path (no http), generate a signed URL on the fly
  try {
    const bucket = process.env.PRODUCT_IMAGES_BUCKET;
    if (data?.avatar_url && !data.avatar_url.startsWith('http') && bucket) {
      const { data: signed } = await supabaseAdmin.storage.from(bucket).createSignedUrl(data.avatar_url, 60 * 60);
      data.avatar_url = signed?.signedUrl || null;
    }
  } catch (e) {
    // non-fatal: return the record without signed url
  }
  res.json(data);
}

export async function updateMe(req, res) {
  if (!req.session?.user) return res.status(401).json({ error: 'Login required' });
  const userId = req.session.user.id;
  const patch = req.body || {};
  // prevent changing auth_user_id or email via this endpoint
  delete patch.auth_user_id;
  delete patch.email;

  const { data, error } = await supabaseAdmin
    .from('customers')
    .update(patch)
    .eq('auth_user_id', userId)
    .select('*')
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

export async function uploadAvatar(req, res) {
  if (!req.session?.user) return res.status(401).json({ error: 'Login required' });
  const userId = req.session.user.id;
  if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'No file uploaded' });
  const file = req.files[0];
  const ext = (file.originalname.split('.').pop() || 'png').toLowerCase();
  const filename = `${userId}/${nanoid(8)}.${ext}`;
  const bucket = process.env.PRODUCT_IMAGES_BUCKET;
  const { error: uErr } = await supabaseAdmin.storage
    .from(bucket)
    .upload(filename, file.buffer, { contentType: file.mimetype, upsert: false });
  if (uErr) return res.status(400).json({ error: uErr.message });

  // store the object path in the DB (so we can generate signed urls on demand)
  await supabaseAdmin.from('customers').update({ avatar_url: filename }).eq('auth_user_id', userId);

  // return a signed URL for immediate use
  const { data: signed } = await supabaseAdmin.storage.from(bucket).createSignedUrl(filename, 60 * 60);
  const avatarUrl = signed?.signedUrl || null;
  res.json({ avatar_url: avatarUrl, path: filename });
}

export async function deleteMe(req, res) {
  if (!req.session?.user) return res.status(401).json({ error: 'Login required' });
  const userId = req.session.user.id;
  // soft-delete: set deleted_at and anonymize email/full_name
  const anonEmail = `deleted+${userId}@example.invalid`;
  // optionally remove avatar object from storage if we stored a path
  try {
    const { data: customer } = await supabaseAdmin.from('customers').select('avatar_url').eq('auth_user_id', userId).single();
    const bucket = process.env.PRODUCT_IMAGES_BUCKET;
    if (customer?.avatar_url && bucket && !customer.avatar_url.startsWith('http')) {
      await supabaseAdmin.storage.from(bucket).remove([customer.avatar_url]);
    }
  } catch (e) {
    // ignore cleanup errors
  }

  const { data, error } = await supabaseAdmin
    .from('customers')
    .update({ deleted_at: new Date().toISOString(), email: anonEmail, full_name: null, phone: null, bio: null, marketing_opt_in: false, avatar_url: null })
    .eq('auth_user_id', userId)
    .select('*')
    .single();
  if (error) return res.status(400).json({ error: error.message });
  // clear session
  req.session.destroy(() => {});
  res.json({ deleted: true });
}
