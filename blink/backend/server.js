import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';
import RedisStore from 'connect-redis';
import { createClient } from 'redis';
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

// --- Redis Setup for Session Storage ---
let redisClient;
let sessionStore = new session.MemoryStore(); // Default fallback

// Initialize Redis asynchronously
const initializeRedis = async () => {
  try {
    if (process.env.NODE_ENV === 'production' && (process.env.UPSTASH_REDIS_URL || process.env.REDIS_URL)) {
      // Production: Use Upstash Redis
      const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_URL;
      console.log('🔄 Attempting to connect to Redis:', redisUrl.replace(/\/\/.*@/, '//***@')); // Hide credentials in logs
      
      redisClient = createClient({
        url: redisUrl,
        socket: {
          tls: true,
          rejectUnauthorized: false
        }
      });

      redisClient.on('error', (err) => {
        console.error('❌ Redis Client Error:', err.message);
      });

      redisClient.on('connect', () => {
        console.log('✅ Redis connected successfully');
      });

      redisClient.on('ready', () => {
        console.log('✅ Redis ready for operations');
      });

      await redisClient.connect();
      
      // Test the connection
      await redisClient.ping();
      console.log('✅ Redis ping successful');
      
      sessionStore = new RedisStore({ client: redisClient });
      console.log('✅ Redis session store configured');
    } else {
      // Development: Use memory store
      console.log('⚠️  Using memory store for sessions (development only)');
      console.log('   NODE_ENV:', process.env.NODE_ENV);
      console.log('   REDIS_URL available:', !!process.env.REDIS_URL);
      console.log('   UPSTASH_REDIS_URL available:', !!process.env.UPSTASH_REDIS_URL);
    }
  } catch (error) {
    console.error('❌ Redis connection failed, falling back to memory store:', error.message);
    sessionStore = new session.MemoryStore();
  }
};

// Initialize Redis connection
initializeRedis();


// --- CORS configuration for cross-origin cookies (Netlify + Render) ---
const allowedOrigins = [
  'http://localhost:3000',
  'https://heartfelt-lily-3bb33d.netlify.app', // Your Netlify frontend
  process.env.FRONTEND_URL, // Additional frontend URL if set
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


// Trust proxy for correct secure cookie handling behind Render/Netlify
app.set('trust proxy', 1);

// --- Session configuration for cross-origin cookies (Netlify + Render) ---
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your-session-secret-key',
    resave: false,
    store: sessionStore, // Use Redis store in production, memory store in development
    saveUninitialized: false,
    name: 'brandverse.sid',
    cookie: {
      httpOnly: true, // prevents JavaScript access
      secure: process.env.NODE_ENV === 'production',   // 🔑 only require HTTPS in production
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 🔑 allows cross-site cookie sending in production
      maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
      // domain intentionally omitted for cross-origin
    }
  })
);

// Session debugging middleware
app.use((req, res, next) => {
  if (req.path.includes('/admin') || req.path.includes('/auth')) {
    console.log(`[Session Debug] ${req.method} ${req.path}`, {
      sessionId: req.sessionID,
      sessionExists: !!req.session,
      user: req.session?.user,
      rawCookies: req.headers.cookie,
      hasBrandverseCookie: req.headers.cookie?.includes('brandverse.sid'),
      cookieCount: req.headers.cookie?.split(';').length || 0,
      origin: req.headers.origin,
      userAgent: req.headers['user-agent']?.substring(0, 50) + '...',
      method: req.method,
      path: req.path
    });
    
    // Intercept response to log set-cookie headers
    const originalSend = res.send;
    res.send = function(data) {
      if (req.path.includes('/verify-otp')) {
        console.log(`[Cookie Debug] Response headers for ${req.path}:`, {
          setCookie: res.getHeaders()['set-cookie'],
          allHeaders: Object.keys(res.getHeaders())
        });
      }
      return originalSend.call(this, data);
    };
  }
  next();
});

app.get('/health', (_req, res) => {
  const isRedisConnected = redisClient && redisClient.isReady;
  res.json({ 
    ok: true, 
    redis: isRedisConnected ? 'connected' : 'not connected',
    sessionStore: sessionStore instanceof RedisStore ? 'redis' : 'memory',
    nodeEnv: process.env.NODE_ENV
  });
});

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