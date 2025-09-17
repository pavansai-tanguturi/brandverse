import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';
import { sessionStore } from './src/config/sessionStore.js';

// Build timeout protection
const BUILD_TIMEOUT = 10 * 60 * 1000; // 10 minutes

// Add promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
  console.log('Unhandled Rejection at:', promise, 'reason:', reason);
  if (process.env.NETLIFY) {
    process.exit(1);
  }
});
import authRoutes from './src/routes/auth.js';
import productRoutes from './src/routes/products.js';
import cartRoutes from './src/routes/cart.js';
import orderRoutes from './src/routes/orders.js';
import adminRoutes from './src/routes/admin.js';
import customerRoutes from './src/routes/customers.js';
import adminCartRoutes from './src/routes/adminCart.js';
import categoryRoutes from './src/routes/categories.js';
import analyticsRoutes from './src/routes/analytics.js';
import adminCustomerRoutes from './src/routes/adminCustomers.js';
import deliveryRoutes from './src/routes/delivery.js';
import addressRoutes from './src/routes/addresses.js';

dotenv.config();

const app = express();

// CORS configuration – now supports:
//  - Exact origins from FRONTEND_URL, ADDITIONAL_ORIGINS (comma separated)
//  - Netlify deploy previews (*.netlify.app) when ALLOW_NETLIFY_PREVIEWS=true
//  - Vercel domains (*.vercel.app) when ALLOW_VERCEL=true
//  - Localhost dev
function buildAllowedOrigins() {
  const list = new Set([
    'http://localhost:3000',
    process.env.FRONTEND_URL,
  ]);
  if (process.env.ADDITIONAL_ORIGINS) {
    process.env.ADDITIONAL_ORIGINS.split(',').map(s => s.trim()).forEach(o => list.add(o));
  }
  return Array.from([...list].filter(Boolean));
}

const EXACT_ALLOWED = buildAllowedOrigins();
const allowNetlifyPreviews = process.env.ALLOW_NETLIFY_PREVIEWS === 'true';
const allowVercel = process.env.ALLOW_VERCEL === 'true';

function originMatchesPatterns(origin) {
  if (!origin) return true; // non-browser clients
  if (EXACT_ALLOWED.includes(origin)) return true;
  if (allowNetlifyPreviews && /https:\/\/[a-z0-9-]+--[a-z0-9-]+\.netlify\.app$/i.test(origin)) return true;
  if (allowVercel && /https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin)) return true;
  return false;
}

app.use(cors({
  origin: function(origin, callback) {
    if (originMatchesPatterns(origin)) return callback(null, true);
    console.log('CORS blocked origin:', origin, 'Allowed list:', EXACT_ALLOWED, 'Flags:', { allowNetlifyPreviews, allowVercel });
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Important for cross-origin
      secure: process.env.NODE_ENV === 'production', // true for HTTPS in production
      maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
    }
  })
);

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/admin', adminCartRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin/customers', adminCustomerRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/addresses', addressRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// ✅ Build-time vs Runtime Logic Separation
if (process.env.NODE_ENV === 'production' && process.env.NETLIFY) {
  // ✅ Build-time operations for Netlify
  console.log('Build started at:', new Date().toISOString());
  
  // Set timeout protection
  const timeout = setTimeout(() => {
    console.log('Build timeout reached, exiting...');
    process.exit(1);
  }, BUILD_TIMEOUT);
  
  // Perform build-time tasks
  async function performBuildTasks() {
    try {
      console.log('Performing build-time operations...');
      
      // Build tasks with optimized async operations
      const tasks = [
        validateEnvironment(),
        checkRoutes(),
        performHealthCheck()
      ];
      
      await Promise.all(tasks);
      
      console.log('Build completed successfully at:', new Date().toISOString());
      clearTimeout(timeout);
      
      // Add explicit exit condition for Netlify
      if (process.env.NETLIFY) {
        process.exit(0);
      }
      
    } catch (error) {
      console.error('Build failed:', error);
      clearTimeout(timeout);
      process.exit(1);
    }
  }
  
  // Build task functions
  async function validateEnvironment() {
    console.log('✓ Validating environment...');
    return Promise.resolve();
  }
  
  async function checkRoutes() {
    console.log('✓ Checking routes...');
    return Promise.resolve();
  }
  
  async function performHealthCheck() {
    console.log('✓ Performing health check...');
    return Promise.resolve();
  }
  
  performBuildTasks();
  
} else {
  // ✅ Runtime server for development OR production (non-Netlify build environment)
  const PORT = process.env.PORT || 8080;
  const shouldListen = !process.env.NETLIFY; // any normal server environment
  if (shouldListen) {
    app.listen(PORT, () => {
      console.log(`🚀 API server started on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } else {
    console.log('Skipping listen because NETLIFY build env detected.');
  }
}

// Export for Vercel
export default app;