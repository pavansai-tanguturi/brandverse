export function requireAuth(req, res, next) {
  if (req.session?.user) {
    console.log(`[Auth] User authenticated:`, {
      userId: req.session.user.id,
      email: req.session.user.email
    });
    return next();
  }
  return res.status(401).json({ error: 'Unauthorized' });
}

export function requireAdmin(req, res, next) {
  if (!req.session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  if (req.session.user.id !== process.env.ADMIN_ID) {
    return res.status(403).json({ error: 'Admin only' });
  }
  
  return next();
}