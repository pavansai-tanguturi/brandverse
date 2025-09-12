import { supabaseAdmin } from './src/config/supabaseClient.js';

console.log('Running address migration...');

const runAddressMigration = async () => {
  try {
    console.log('Running address migration...');
    
    // Create addresses table
    console.log('1. Creating addresses table...');
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.addresses (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
        type text NOT NULL CHECK (type IN ('shipping', 'billing', 'both')),
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
    
    const { error: tableError } = await supabaseAdmin.rpc('exec_sql', { sql_query: createTableSQL });
    
    if (tableError) {
      console.error('Error creating addresses table:', tableError);
    } else {
      console.log('✓ Addresses table created successfully');
    }
    
    // Create indexes
    console.log('2. Creating indexes...');
    const indexSQL = `
      CREATE INDEX IF NOT EXISTS idx_addresses_customer_id ON public.addresses(customer_id);
      CREATE INDEX IF NOT EXISTS idx_addresses_type ON public.addresses(type);
      CREATE INDEX IF NOT EXISTS idx_addresses_is_default ON public.addresses(is_default);
    `;
    
    const { error: indexError } = await supabaseAdmin.rpc('exec_sql', { sql_query: indexSQL });
    
    if (indexError) {
      console.error('Error creating indexes:', indexError);
    } else {
      console.log('✓ Indexes created successfully');
    }
    
    // Create unique constraint for default addresses
    console.log('3. Creating unique constraint for default addresses...');
    const constraintSQL = `
      CREATE UNIQUE INDEX IF NOT EXISTS idx_addresses_unique_default 
        ON public.addresses(customer_id, type) 
        WHERE is_default = true;
    `;
    
    const { error: constraintError } = await supabaseAdmin.rpc('exec_sql', { sql_query: constraintSQL });
    
    if (constraintError) {
      console.error('Error creating unique constraint:', constraintError);
    } else {
      console.log('✓ Unique constraint created successfully');
    }
    
    // Create trigger function for updated_at
    console.log('4. Creating trigger function...');
    const triggerFunctionSQL = `
      CREATE OR REPLACE FUNCTION update_addresses_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = now();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `;
    
    const { error: functionError } = await supabaseAdmin.rpc('exec_sql', { sql_query: triggerFunctionSQL });
    
    if (functionError) {
      console.error('Error creating trigger function:', functionError);
    } else {
      console.log('✓ Trigger function created successfully');
    }
    
    // Create trigger
    console.log('5. Creating trigger...');
    const triggerSQL = `
      DROP TRIGGER IF EXISTS update_addresses_updated_at ON public.addresses;
      CREATE TRIGGER update_addresses_updated_at
        BEFORE UPDATE ON public.addresses
        FOR EACH ROW
        EXECUTE FUNCTION update_addresses_updated_at();
    `;
    
    const { error: triggerError } = await supabaseAdmin.rpc('exec_sql', { sql_query: triggerSQL });
    
    if (triggerError) {
      console.error('Error creating trigger:', triggerError);
    } else {
      console.log('✓ Trigger created successfully');
    }
    
    // Update orders table to reference addresses
    console.log('6. Adding address references to orders table...');
    const ordersUpdateSQL = `
      ALTER TABLE IF EXISTS public.orders
        ADD COLUMN IF NOT EXISTS shipping_address_id uuid REFERENCES public.addresses(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS billing_address_id uuid REFERENCES public.addresses(id) ON DELETE SET NULL;
    `;
    
    const { error: ordersError } = await supabaseAdmin.rpc('exec_sql', { sql_query: ordersUpdateSQL });
    
    if (ordersError) {
      console.error('Error updating orders table:', ordersError);
    } else {
      console.log('✓ Orders table updated successfully');
    }
    
    // Create indexes for order address references
    console.log('7. Creating indexes for order address references...');
    const orderIndexSQL = `
      CREATE INDEX IF NOT EXISTS idx_orders_shipping_address ON public.orders(shipping_address_id);
      CREATE INDEX IF NOT EXISTS idx_orders_billing_address ON public.orders(billing_address_id);
    `;
    
    const { error: orderIndexError } = await supabaseAdmin.rpc('exec_sql', { sql_query: orderIndexSQL });
    
    if (orderIndexError) {
      console.error('Error creating order indexes:', orderIndexError);
    } else {
      console.log('✓ Order indexes created successfully');
    }
    
    console.log('Address migration completed successfully!');
    console.log('');
    console.log('Address table structure:');
    console.log('- id: UUID primary key');
    console.log('- customer_id: References customers table');
    console.log('- type: shipping, billing, or both');
    console.log('- is_default: boolean for default address per type');
    console.log('- Address fields: full_name, phone, address_line_1, address_line_2, city, state, postal_code, country, landmark');
    console.log('- Timestamps: created_at, updated_at');
    console.log('');
    console.log('API Endpoints created:');
    console.log('GET /api/addresses/customer/:customer_id - Get all addresses for customer');
    console.log('GET /api/addresses/:id - Get specific address');
    console.log('POST /api/addresses/customer/:customer_id - Create new address');
    console.log('PUT /api/addresses/:id - Update address');
    console.log('DELETE /api/addresses/:id - Delete address');
    console.log('PATCH /api/addresses/:id/default - Set as default address');
    
  } catch (error) {
    console.error('Error running migration:', error);
    process.exit(1);
  }
};

runAddressMigration().then(() => {
  console.log('\n🎉 Address migration completed successfully!');
  console.log('\n📋 Address table structure created:');
  console.log('- id: UUID primary key');
  console.log('- customer_id: References customers table');
  console.log('- type: shipping, billing, or both');
  console.log('- is_default: boolean for default address per type');
  console.log('- Address fields: full_name, phone, address lines, city, state, postal_code, country, landmark');
  console.log('- Timestamps: created_at, updated_at');
  console.log('\n🚀 API Endpoints available:');
  console.log('GET /api/addresses/customer/:customer_id - Get all addresses for customer');
  console.log('GET /api/addresses/:id - Get specific address');
  console.log('POST /api/addresses/customer/:customer_id - Create new address');
  console.log('PUT /api/addresses/:id - Update address');
  console.log('DELETE /api/addresses/:id - Delete address');
  console.log('PATCH /api/addresses/:id/default - Set as default address');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});
