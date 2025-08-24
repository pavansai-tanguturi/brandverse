import { supabaseAdmin } from './src/config/supabaseClient.js';
import fs from 'fs';

console.log('Applying migration: 002_add_discount_and_categories.sql');

try {
  // Read the migration file
  const migration = fs.readFileSync('./sql/002_add_discount_and_categories.sql', 'utf8');
  
  // Split into individual SQL statements (removing empty ones)
  const statements = migration
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
  
  console.log(`Found ${statements.length} SQL statements to execute`);
  
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    console.log(`\nExecuting statement ${i + 1}:`);
    console.log(stmt.substring(0, 100) + (stmt.length > 100 ? '...' : ''));
    
    const { data, error } = await supabaseAdmin.rpc('exec_sql', { sql_query: stmt });
    
    if (error) {
      console.error(`Error in statement ${i + 1}:`, error);
      // For some errors, we might want to continue (like if column already exists)
      if (error.message?.includes('already exists')) {
        console.log('Column/constraint already exists, continuing...');
      } else {
        throw error;
      }
    } else {
      console.log(`Statement ${i + 1} executed successfully`);
    }
  }
  
  console.log('\nMigration completed successfully!');
  
  // Test the new features
  console.log('\nTesting new features...');
  
  // Check if discount_percent column exists
  const { data: products, error: pError } = await supabaseAdmin
    .from('products')
    .select('id, title, discount_percent')
    .limit(1);
    
  if (pError) {
    console.error('Error testing products with discount:', pError);
  } else {
    console.log('Products with discount field:', products);
  }
  
  // Check categories
  const { data: categories, error: cError } = await supabaseAdmin
    .from('categories')
    .select('*')
    .limit(5);
    
  if (cError) {
    console.error('Error testing categories:', cError);
  } else {
    console.log('Sample categories:', categories);
  }
  
} catch (e) {
  console.error('Migration failed:', e.message);
  process.exit(1);
}
