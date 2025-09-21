import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

console.log('Loading Supabase configuration...');

// Check environment variables
const requiredEnvVars = {
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY
};

const missingVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  console.error('Missing required environment variables:', missingVars.join(', '));
  throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
}

if (!process.env.PRODUCT_IMAGES_BUCKET) {
  console.warn('Warning: PRODUCT_IMAGES_BUCKET not set, using default "product-images"');
  process.env.PRODUCT_IMAGES_BUCKET = 'product-images';
}

console.log('Creating Supabase clients...');

let supabaseAdmin;
try {
  supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { 
      auth: { persistSession: false },
      db: {
        schema: 'public'
      }
    }
  );
  console.log('Supabase admin client created successfully');
} catch (error) {
  console.error('Error creating Supabase admin client:', error);
  throw error;
}

let supabaseAnon;
try {
  supabaseAnon = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    { 
      auth: { persistSession: false },
      db: {
        schema: 'public'
      }
    }
  );
  console.log('Supabase anon client created successfully');
} catch (error) {
  console.error('Error creating Supabase anon client:', error);
  throw error;
}

// Test the connection
async function testConnection() {
  try {
    const { data, error } = await supabaseAdmin.from('products').select('count').limit(1);
    if (error) throw error;
    console.log('Supabase connection test successful');
  } catch (error) {
    console.error('Supabase connection test failed:', error);
    throw error;
  }
}

// Run the test but don't block exports
testConnection().catch(console.error);

export { supabaseAdmin, supabaseAnon };