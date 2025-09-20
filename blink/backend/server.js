import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';
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


// --- CORS configuration for cross-origin cookies (Netlify + Render) ---
const allowedOrigins = [
  'http://localhost:3000',
  process.env.FRONTEND_URL, // Netlify frontend
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // 🔑 allows cookies to be sent
}));

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// --- Session configuration for cross-origin cookies (Netlify + Render) ---
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your-session-secret-key',
    resave: false,
    store: new session.MemoryStore(),
    saveUninitialized: false,
    name: 'brandverse.sid',
    cookie: {
      httpOnly: true, // prevents JavaScript access
      secure: process.env.NODE_ENV === 'production',   // 🔑 only require HTTPS in production
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 🔑 allows cross-site cookie sending in production
      maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
    }
  })
);

// Session debugging middleware
app.use((req, res, next) => {
  if (req.path.includes('/admin/analytics')) {
    console.log(`[Session Debug] ${req.method} ${req.path}`, {
      sessionId: req.sessionID,
      sessionExists: !!req.session,
      user: req.session?.user,
      cookies: req.headers.cookie
    });
  }
  next();
});

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/admin', adminCartRoutes);
app.use('/api/admin/analytics', analyticsRoutes);
app.use('/api/admin/customers', adminCustomerRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/addresses', addressRoutes);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));