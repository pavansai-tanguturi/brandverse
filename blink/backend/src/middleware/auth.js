export function requireAuth(req, res, next) {
  if (req.session?.user) {
    return next();
  }
  console.log('[auth] Unauthorized request - no session or user');
  return res.status(401).json({ error: 'Unauthorized' });
}

export function requireAdmin(req, res, next) {
  if (!req.session?.user) {
    console.log('[auth] Admin access denied - no session or user');
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const adminId = process.env.ADMIN_ID || 'admin';
  const isAdmin = req.session.user.isAdmin === true || req.session.user.id === adminId;
  
  if (!isAdmin) {
    console.log('[auth] Admin access denied - not admin user');
    return res.status(403).json({ error: 'Admin only' });
  }
  
  return next();
}