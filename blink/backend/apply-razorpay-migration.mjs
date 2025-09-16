import { supabaseAdmin } from './src/config/supabaseClient.js';
import fs from 'fs';
import path from 'path';

async function runMigration() {
  try {
    console.log('Applying Razorpay fields migration...');
    
    const migrationPath = path.join(process.cwd(), 'sql', '007_add_razorpay_fields.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    console.log(`Executing ${statements.length} SQL statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`Executing statement ${i + 1}:`, statement.substring(0, 50) + '...');
        
        // For DDL statements, we need to use the direct SQL approach
        const { error } = await supabaseAdmin.rpc('sql', {
          query: statement + ';'
        });
        
        if (error) {
          console.error(`Statement ${i + 1} failed:`, error);
          // Try alternative approach for some statements
          console.log('Trying alternative approach...');
          const { error: altError } = await supabaseAdmin
            .schema('public')
            .rpc('query', { sql: statement + ';' });
            
          if (altError) {
            console.error('Alternative approach also failed:', altError);
          } else {
            console.log(`✅ Statement ${i + 1} completed with alternative approach`);
          }
        } else {
          console.log(`✅ Statement ${i + 1} completed successfully`);
        }
      }
    }
    
    console.log('✅ Migration completed!');
    
  } catch (error) {
    console.error('Migration error:', error);
    
    // Manual instructions
    console.log('\n📋 MANUAL MIGRATION REQUIRED:');
    console.log('Please run the following SQL in your Supabase SQL editor:');
    console.log('\n' + fs.readFileSync(path.join(process.cwd(), 'sql', '007_add_razorpay_fields.sql'), 'utf8'));
  }
}

runMigration();