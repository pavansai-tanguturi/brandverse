// Stage 1 Backend - Clean & Modular OTP Authentication
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();

// Log all incoming requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// ✅ Session setup (memory store for dev, use Redis for production)
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'super-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: process.env.NODE_ENV === 'production', // HTTPS in production
      httpOnly: true, 
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    },
  })
);

// ✅ Supabase client initialization
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function to validate email format
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Brandverse Backend - Stage 1 OTP Authentication',
    status: 'running',
    endpoints: [
      'POST /signup - Create account with email confirmation',
      'POST /login - Send OTP to email', 
      'POST /verify-otp - Verify OTP and login',
      'POST /resend-otp - Resend OTP code',
      'GET /me - Get current user data',
      'POST /logout - Logout user'
    ]
  });
});

// 1️⃣ SIGN UP - Creates user account with email confirmation
app.post('/signup', async (req, res) => {
  try {
    const { email, name, password } = req.body;

    if (!email || !name) {
      return res.status(400).json({ error: 'Email and name are required' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    console.log('Creating account for:', email);

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .single();

    if (existingUser) {
      console.log('User already exists:', email);
      return res.status(400).json({ 
        error: 'User already exists. Please login instead.',
        userExists: true 
      });
    }

    // If error is not "no rows found", it's a real error
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Database check error:', checkError);
      return res.status(500).json({ error: 'Database error occurred' });
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password: password || `temp-${Date.now()}`, // Temp password for OTP flow
      options: {
        data: {
          name: name // Store name in user metadata
        }
      }
    });

    if (error) {
      console.error('Signup error:', error);
      if (error.message.includes('already registered')) {
        return res.status(400).json({ 
          error: 'User already exists. Please login instead.',
          userExists: true 
        });
      }
      return res.status(400).json({ error: error.message });
    }

    // Store user info in our database
    if (data.user) {
      const { error: insertError } = await supabase
        .from('users')
        .insert([{ 
          id: data.user.id,
          email: email, 
          name: name, 
          created_at: new Date().toISOString() 
        }]);

      if (insertError) {
        console.error('Error storing user data:', insertError);
      }
    }

    console.log('✅ Account created, confirmation email sent');
    res.json({ 
      message: 'Account created! Please check your email for the verification code.',
      action: 'signup'
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 2️⃣ LOGIN - Send OTP to email
app.post('/login', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    console.log('Sending OTP to:', email);

    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false }
    });

    if (error) {
      console.error('Login OTP error:', error);
      if (error.message.includes('User not found')) {
        return res.status(400).json({ 
          error: 'No account found with this email address',
          userExists: false
        });
      }
      return res.status(400).json({ error: error.message });
    }

    console.log('✅ OTP sent successfully');
    res.json({ message: 'OTP sent to your email. Check your inbox!' });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 3️⃣ VERIFY OTP - Verify code and create session
app.post('/verify-otp', async (req, res) => {
  try {
    const { email, token } = req.body;

    if (!email || !token) {
      return res.status(400).json({ error: 'Email and OTP code are required' });
    }

    console.log('Verifying OTP for:', email);

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email' // Use 'email' type for OTP verification
    });

    if (error) {
      console.error('OTP verification error:', error);
      return res.status(400).json({ error: 'Invalid or expired OTP code' });
    }

    if (!data.user || !data.session) {
      return res.status(400).json({ error: 'OTP verification failed' });
    }

    // ✅ Save session in Express (this persists across requests)
    req.session.user = {
      id: data.user.id,
      email: data.user.email,
      name: data.user.user_metadata?.name || ''
    };

    // Update user's last login in database
    await supabase
      .from('users')
      .upsert({
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name || '',
        last_login: new Date().toISOString(),
        created_at: data.user.created_at || new Date().toISOString()
      }, {
        onConflict: 'id'
      });

    console.log('✅ Login successful for:', data.user.email);
    res.json({ 
      message: 'Login successful!', 
      user: req.session.user 
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 🔄 RESEND OTP - Resend OTP code to email
app.post('/resend-otp', async (req, res) => {
  try {
    const { email, type } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    console.log('Resending OTP to:', email, 'type:', type || 'signup');

    // For login flow, use signInWithOtp instead of resend
    if (type === 'login') {
      const { data, error } = await supabase.auth.signInWithOtp({
        email: email,
        options: { shouldCreateUser: false }
      });

      if (error) {
        console.error('Login OTP resend error:', error);
        return res.status(400).json({ error: error.message });
      }

      console.log('✅ Login OTP resent successfully');
      return res.json({ 
        message: 'Login code resent! Check your email for the new code.',
        action: 'resend'
      });
    }

    // For signup flow, use the resend method
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email: email
    });

    if (error) {
      console.error('Signup resend error:', error);
      console.error('Full error details:', JSON.stringify(error, null, 2));
      
      // Handle specific error types with user-friendly messages
      if (error.message.includes('rate limit') || error.message.includes('45 seconds')) {
        return res.status(429).json({ 
          error: 'Please wait 45 seconds before requesting another code. This is a security measure.',
          retryAfter: 45
        });
      }
      
      if (error.message.includes('security purposes')) {
        return res.status(429).json({ 
          error: 'Rate limit exceeded. Please wait a moment before trying again.',
          retryAfter: 45
        });
      }
      
      if (error.message.includes('not found') || error.message.includes('no user')) {
        return res.status(400).json({ error: 'No signup in progress for this email. Please start signup process first.' });
      }
      
      return res.status(400).json({ error: error.message });
    }

    console.log('✅ Signup OTP resent successfully');
    console.log('Resend response:', data);
    
    res.json({ 
      message: 'Verification code resent! Check your email (including spam folder) for the new code.',
      action: 'resend'
    });

  } catch (error) {
    console.error('Resend error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 4️⃣ GET USER - Check session and return user data
app.get('/me', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not logged in' });
  }

  console.log('✅ User session active:', req.session.user.email);
  res.json({ user: req.session.user });
});

// 5️⃣ LOGOUT - Clear session
app.post('/logout', async (req, res) => {
  try {
    if (req.session.user) {
      console.log('Logging out user:', req.session.user.email);
    }
    
    // Clear Express session
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destroy error:', err);
        return res.status(500).json({ error: 'Logout failed' });
      }
      
      console.log('✅ User logged out successfully');
      res.json({ message: 'Logged out successfully' });
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 6️⃣ RESEND OTP - Resend verification code
app.post('/resend-otp', async (req, res) => {
  try {
    const { email, type } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    console.log('Resending OTP to:', email, 'type:', type || 'signup');

    const { data, error } = await supabase.auth.resend({
      type: type || 'signup',
      email: email
    });

    if (error) {
      console.error('Resend OTP error:', error);
      return res.status(400).json({ error: `Failed to resend OTP: ${error.message}` });
    }

    console.log('✅ OTP resent successfully');
    res.json({ 
      message: 'Verification code resent! Check your email.',
      action: 'resend'
    });

  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
