import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';
import { sessionStore } from './src/config/sessionStore.js';
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

// CORS configuration for production and development
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://brandverse-46he.vercel.app',
        'https://brandverse-ebon.vercel.app',
        'https://brandverse.vercel.app',
        'https://brandverse-pavansais-projects.vercel.app', // Add your actual domain
        process.env.FRONTEND_URL
      ].filter(Boolean)
    : [
        'http://localhost:3000',
        'http://localhost:3001',
        'https://brandverse-pavansais-projects.vercel.app' // Allow your Vercel domain in dev mode too
      ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

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

app.get('/health', (_req, res) => res.json({ ok: true }));

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

// For local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
}

// Export for Vercel
export default app;