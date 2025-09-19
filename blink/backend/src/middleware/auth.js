export function requireAuth(req, res, next) {
  console.log(`[Auth] Session debug:`, {
    sessionExists: !!req.session,
    sessionId: req.sessionID,
    user: req.session?.user,
    cookies: req.headers.cookie
  });
  
  if (req.session?.user) {
    console.log(`[Auth] User authenticated:`, {
      userId: req.session.user.id,
      email: req.session.user.email
    });
    return next();
  }
  
  console.log('[Auth] Authentication failed - no session or user');
  return res.status(401).json({ error: 'Unauthorized' });
}

export function requireAdmin(req, res, next) {
  console.log(`[Admin] Session debug:`, {
    sessionExists: !!req.session,
    sessionId: req.sessionID,
    user: req.session?.user,
    adminEmail: process.env.ADMIN_EMAIL,
    adminId: process.env.ADMIN_ID
  });
  
  if (!req.session?.user) {
    console.log('[Admin] No session or user found');
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const adminEmail = process.env.ADMIN_EMAIL || process.env.AUTH_U;
  const isAdmin = req.session.user.email === adminEmail || req.session.user.isAdmin === true;
  
  if (!isAdmin) {
    console.log('[Admin] User is not admin:', {
      userEmail: req.session.user.email,
      expectedAdminEmail: adminEmail,
      userIsAdmin: req.session.user.isAdmin
    });
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  console.log('[Admin] Admin access granted');
  return next();
}