import { supabaseAdmin } from './src/config/supabaseClient.js';

async function createDeliveryLocationsTable() {
  try {
    console.log('Creating delivery_locations table...');
    
    // Create the table using raw SQL
    const { data, error } = await supabaseAdmin.rpc('exec_sql', {
      sql_query: `
        -- Create delivery locations table
        create table if not exists public.delivery_locations (
          id uuid primary key default gen_random_uuid(),
          country text not null,
          region text default null,
          city text default null,
          is_active boolean default true,
          created_at timestamptz default now(),
          updated_at timestamptz default now()
        );

        -- Create unique constraint to prevent duplicate locations
        create unique index if not exists idx_delivery_locations_unique 
        on public.delivery_locations(lower(country), lower(coalesce(region, '')), lower(coalesce(city, '')));

        -- Create index for fast lookups
        create index if not exists idx_delivery_locations_active 
        on public.delivery_locations(is_active, country);

        -- Insert some default allowed delivery locations
        insert into public.delivery_locations (country, region, city) values 
          ('India', null, null),
          ('Canada', null, null),
          ('United Kingdom', null, null),
          ('Australia', null, null)
        on conflict do nothing;
      `
    });

    if (error) {
      console.error('Error creating table:', error);
      
      // Try alternative approach - direct table creation
      console.log('Trying direct table creation...');
      
      const { error: createError } = await supabaseAdmin
        .from('delivery_locations')
        .select('*')
        .limit(1);
        
      if (createError && createError.code === 'PGRST106') {
        console.log('Table does not exist. Let\'s create it manually...');
        
        // Insert some sample data to create the table structure
        const { data: insertData, error: insertError } = await supabaseAdmin
          .from('delivery_locations')
          .insert([
            { country: 'India', is_active: true },
            { country: 'Canada', is_active: true },
            { country: 'United Kingdom', is_active: true },
            { country: 'Australia', is_active: true }
          ]);
          
        if (insertError) {
          console.error('Insert error:', insertError);
        } else {
          console.log('Sample data inserted:', insertData);
        }
      }
    } else {
      console.log('Table created successfully:', data);
    }

  } catch (err) {
    console.error('Script error:', err);
  }
}

createDeliveryLocationsTable();
