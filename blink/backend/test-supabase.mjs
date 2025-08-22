import { supabaseAdmin } from './src/config/supabaseClient.js';

console.log('Testing Supabase connection...');

try {
  // Test if we can query the customers table
  const { data, error, count } = await supabaseAdmin
    .from('customers')
    .select('*', { count: 'exact' })
    .limit(1);
    
  if (error) {
    console.error('Customers table error:', error);
  } else {
    console.log('Customers table accessible. Count:', count, 'Sample:', data);
  }

  // Test products table
  const { data: products, error: pError } = await supabaseAdmin
    .from('products')
    .select('*')
    .limit(1);
    
  if (pError) {
    console.error('Products table error:', pError);
  } else {
    console.log('Products table accessible. Sample:', products);
  }
} catch (e) {
  console.error('Connection failed:', e.message);
}
