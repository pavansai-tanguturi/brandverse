import { supabaseAdmin } from './src/config/supabaseClient.js';

console.log('Creating sample data...');

try {
  // Create a sample product
  const { data: product, error: pError } = await supabaseAdmin
    .from('products')
    .insert({
      title: 'Sample Product',
      slug: 'sample-product',
      description: 'A test product for development',
      price_cents: 1999,
      currency: 'USD',
      stock_quantity: 10,
      is_active: true
    })
    .select()
    .single();

  if (pError) {
    console.error('Failed to create product:', pError);
  } else {
    console.log('Created product:', product);
  }

  // Create a sample customer for admin user (so cart/orders work)
  const { data: customer, error: cError } = await supabaseAdmin
    .from('customers')
    .insert({
      auth_user_id: '00000000-0000-0000-0000-000000000000', // admin ID
      email: 'admin@example.com',
      full_name: 'Admin User'
    })
    .select()
    .single();

  if (cError) {
    console.error('Failed to create customer:', cError);
  } else {
    console.log('Created customer:', customer);
  }

} catch (e) {
  console.error('Failed:', e.message);
}
