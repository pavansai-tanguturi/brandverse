import { supabaseAdmin } from './src/config/supabaseClient.js';

console.log('Creating addresses table...');

try {
  // Create addresses table directly with SQL commands
  console.log('Step 1: Creating addresses table...');
  
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS public.addresses (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      customer_id uuid NOT NULL,
      type text NOT NULL DEFAULT 'home' CHECK (type IN ('home', 'work', 'shipping', 'billing', 'both')),
      is_default boolean NOT NULL DEFAULT false,
      
      -- Address fields
      full_name text NOT NULL,
      phone text,
      address_line_1 text NOT NULL,
      address_line_2 text,
      city text NOT NULL,
      state text NOT NULL,
      postal_code text NOT NULL,
      country text NOT NULL DEFAULT 'India',
      landmark text,
      
      -- Metadata
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
  `;
  
  // Use raw SQL query through Supabase client
  const { data: tableResult, error: tableError } = await supabaseAdmin
    .from('addresses')
    .select('id')
    .limit(1);
  
  if (tableError && tableError.code === 'PGRST116') {
    console.log('Table does not exist, creating it...');
    
    // Since we can't execute DDL directly, let's try using the REST API
    // First, let's check if we can create a simple test record to see table structure
    const { data: testData, error: testError } = await supabaseAdmin
      .from('addresses')
      .insert([{
        customer_id: '00000000-0000-0000-0000-000000000000',
        full_name: 'Test',
        address_line_1: 'Test Address',
        city: 'Test City',
        state: 'Test State',
        postal_code: '12345'
      }])
      .select();
      
    if (testError) {
      console.error('Table creation needed. Please run this SQL in your Supabase dashboard:');
      console.log(createTableQuery);
      console.error('Test error:', testError);
    } else {
      console.log('Table exists and working!');
      // Clean up test data
      await supabaseAdmin
        .from('addresses')
        .delete()
        .eq('customer_id', '00000000-0000-0000-0000-000000000000');
    }
  } else if (tableError) {
    console.error('Error checking table:', tableError);
  } else {
    console.log('Addresses table already exists!');
  }

} catch (err) {
  console.error('Error:', err.message);
}

process.exit(0);
