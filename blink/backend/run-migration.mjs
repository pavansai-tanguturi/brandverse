import { supabaseAdmin } from './src/config/supabaseClient.js';

console.log('Applying discount field migration...');

try {
  // Add discount_percent column
  const { data: alterResult, error: alterError } = await supabaseAdmin
    .rpc('exec_sql', { 
      sql_query: `ALTER TABLE IF EXISTS public.products 
                  ADD COLUMN IF NOT EXISTS discount_percent NUMERIC(5,2) DEFAULT 0 
                  CHECK (discount_percent >= 0 AND discount_percent <= 100)` 
    });
  
  if (alterError && !alterError.message?.includes('already exists')) {
    console.error('Error adding discount column:', alterError);
  } else {
    console.log('Discount column added/verified successfully');
  }
  
  // Insert default categories
  const { data: insertResult, error: insertError } = await supabaseAdmin
    .from('categories')
    .upsert([
      { name: 'Electronics', slug: 'electronics' },
      { name: 'Clothing', slug: 'clothing' },
      { name: 'Books', slug: 'books' },
      { name: 'Home & Garden', slug: 'home-garden' },
      { name: 'Sports', slug: 'sports' },
      { name: 'Beauty', slug: 'beauty' },
      { name: 'Food & Beverage', slug: 'food-beverage' },
      { name: 'Toys & Games', slug: 'toys-games' }
    ], { 
      onConflict: 'slug',
      ignoreDuplicates: true 
    });
  
  if (insertError) {
    console.error('Error inserting categories:', insertError);
  } else {
    console.log('Categories inserted/verified successfully');
  }
  
  console.log('Migration completed!');
  
} catch (e) {
  console.error('Migration failed:', e.message);
}
