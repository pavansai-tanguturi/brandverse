// Basic Express server setup
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

// Log unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});

const app = express();
// Log all incoming requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// Supabase client initialization
const supabaseUrl = 'https://ucwqxjnjgjomdstdinag.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjd3F4am5qZ2pvbWRzdGRpbmFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MTM1MzQsImV4cCI6MjA3MDQ4OTUzNH0.TwvYS088sAGMIW-_iFcVhm1GRwcOupG1FQIee0V_y00';
const supabase = createClient(supabaseUrl, supabaseKey);

app.get('/', (req, res) => {
  res.send('Backend is running');
});

// GET route for login (for browser testing)
app.get('/login', (req, res) => {
  res.send('Login endpoint is working. Use POST request with email/mobile and OTP to login.');
});

// Unified Login/Signup route with magic link
// Helper function to validate email format
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Signup endpoint - for new users
app.post('/signup', async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email || !name) {
      return res.status(400).json({ error: 'Email and name are required' });
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    console.log('Attempting signup for email:', email);

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing user:', checkError);
      return res.status(500).json({ error: 'Database error' });
    }

    if (existingUser) {
      return res.status(400).json({ 
        error: 'User already exists. Please login instead.',
        userExists: true 
      });
    }

    console.log('Sending magic link for signup to:', email);

    // Send magic link for signup
    const { error: magicLinkError } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        emailRedirectTo: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/callback`
      }
    });

    if (magicLinkError) {
      console.error('Magic link error:', magicLinkError);
      return res.status(400).json({ error: `Magic link failed: ${magicLinkError.message}` });
    }

    console.log('Magic link sent successfully, storing user data...');

    // Store user info (will be activated when they click magic link)
    const { error: insertError } = await supabase
      .from('users')
      .insert([{ email, name, created_at: new Date().toISOString() }]);

    if (insertError) {
      console.error('Error storing user data:', insertError);
      return res.status(500).json({ error: 'Failed to create user account' });
    }

    console.log('User data stored successfully');

    res.json({ 
      message: 'Signup successful! Check your email for the magic link.',
      action: 'signup'
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login endpoint - for existing users only (magic link)
app.post('/login', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    console.log('Attempting login for email:', email);

    // Check if user exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing user:', checkError);
      return res.status(500).json({ error: 'Database error' });
    }

    if (!existingUser) {
      return res.status(400).json({ 
        error: 'User not found. Please signup first.',
        userExists: false 
      });
    }

    console.log('User found, sending magic link for login to:', email);

    // Send magic link for login
    const { error: magicLinkError } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        emailRedirectTo: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/callback`
      }
    });

    if (magicLinkError) {
      console.error('Magic link error:', magicLinkError);
      return res.status(400).json({ error: `Magic link failed: ${magicLinkError.message}` });
    }

    console.log('Magic link sent successfully for login');

    res.json({ 
      message: 'Magic link sent! Check your email to login.',
      action: 'login'
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Handle magic link callback and store user data
app.post('/auth/callback', async (req, res) => {
  const { access_token, refresh_token } = req.body;
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(access_token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    // Store/update user in database
    const { error: upsertError } = await supabase
      .from('users')
      .upsert({
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || '',
        last_login: new Date().toISOString(),
        created_at: user.created_at || new Date().toISOString()
      }, {
        onConflict: 'id'
      });
    
    if (upsertError) {
      console.error('Error storing user:', upsertError);
      // Don't fail the request, just log the error
    }
    
    return res.json({ 
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || ''
      },
      access_token,
      refresh_token
    });
  } catch (err) {
    console.error('Callback error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove old separate signup route - not needed anymore

// Send Magic Link route (renamed for clarity)
app.post('/send-magic-link', async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email required' });
  }
  
  try {
    // First, check if user exists in auth.users
    const { data: authData, error: authError } = await supabase.auth.signInWithOtp({ 
      email,
      options: {
        shouldCreateUser: false // Don't create new users, only login existing ones
      }
    });
    
    if (authError) {
      // If user doesn't exist, create them first
      const { data: signupData, error: signupError } = await supabase.auth.signUp({
        email,
        password: 'temp-password',
      });
      
      if (signupError) {
        return res.status(400).json({ error: signupError.message });
      }
      
      return res.json({ 
        message: 'Account created! Please check your email to confirm your account first.',
        type: 'signup_confirmation'
      });
    }
    
    return res.json({ 
      message: 'Magic link sent to your email. Please check your inbox and click the link to login.',
      type: 'magic_link'
    });
  } catch (err) {
    console.error('Send magic link error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Check user session
app.get('/check-session', async (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.json({ user: null });
  }
  
  const token = authHeader.substring(7);
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.json({ user: null });
    }
    
    // Store/update user in database
    const { error: upsertError } = await supabase
      .from('users')
      .upsert({
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || '',
        last_login: new Date().toISOString(),
        created_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      });
    
    if (upsertError) {
      console.error('Error storing user:', upsertError);
    }
    
    return res.json({ 
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || ''
      }
    });
  } catch (err) {
    console.error('Session check error:', err);
    return res.json({ user: null });
  }
});

// Logout route
app.post('/logout', async (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    
    try {
      await supabase.auth.signOut(token);
    } catch (err) {
      console.error('Logout error:', err);
    }
  }
  
  return res.json({ message: 'Logged out successfully' });
});

// Send OTP route (keeping for backward compatibility)
app.post('/send-otp', async (req, res) => {
  const { email, phone } = req.body;
  
  if (!email && !phone) {
    return res.status(400).json({ error: 'Email or phone number required' });
  }
  
  try {
    let result;
    if (email) {
      // Send OTP via email with shouldCreateUser: false to prevent auto-signup
      result = await supabase.auth.signInWithOtp({ 
        email,
        options: {
          shouldCreateUser: false
        }
      });
    } else {
      // Send OTP via SMS
      result = await supabase.auth.signInWithOtp({ phone });
    }
    
    const { error } = result;
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    return res.json({ 
      message: email ? 'Magic link sent to email. Please check your inbox and click the link to login.' : 'OTP sent to phone',
      sent: true,
      type: email ? 'magic_link' : 'otp'
    });
  } catch (err) {
    console.error('Send OTP error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify OTP and login
app.post('/verify-otp', async (req, res) => {
  const { email, phone, token } = req.body;
  
  if (!token) {
    return res.status(400).json({ error: 'OTP token required' });
  }
  
  if (!email && !phone) {
    return res.status(400).json({ error: 'Email or phone number required' });
  }
  
  try {
    let result;
    if (email) {
      result = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email'
      });
    } else {
      result = await supabase.auth.verifyOtp({
        phone,
        token,
        type: 'sms'
      });
    }
    
    const { data, error } = result;
    if (error) {
      return res.status(401).json({ error: error.message });
    }
    
    return res.json({ 
      user: data.user, 
      session: data.session,
      message: 'Login successful'
    });
  } catch (err) {
    console.error('Verify OTP error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Legacy login route (keeping for backward compatibility)
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return res.status(401).json({ error: error.message });
    }
    return res.json({ user: data.user, session: data.session });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Error logging middleware (after all routes)
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
