// Temporary debug route to check environment variables in production
module.exports = (req, res) => {
  // Only allow in development/debugging
  const debugInfo = {
    FRONTEND_URL: process.env.FRONTEND_URL || 'NOT_SET',
    ALLOW_NETLIFY_PREVIEWS: process.env.ALLOW_NETLIFY_PREVIEWS || 'NOT_SET',
    SESSION_SECRET: process.env.SESSION_SECRET ? 'SET' : 'NOT_SET',
    NODE_ENV: process.env.NODE_ENV || 'NOT_SET',
    VERCEL: process.env.VERCEL || 'NOT_SET',
    timestamp: new Date().toISOString()
  };

  res.json(debugInfo);
};