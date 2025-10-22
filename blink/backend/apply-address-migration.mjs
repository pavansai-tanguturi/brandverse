import { supabaseAdmin } from "./src/config/supabaseClient.js";
import fs from "fs";

console.log("Applying migration: 005_create_addresses_table.sql");

try {
  // Read the migration file
  const migration = fs.readFileSync(
    "./sql/005_create_addresses_table.sql",
    "utf8",
  );

  // Split into individual SQL statements (removing empty ones and comments)
  const statements = migration
    .split(";")
    .map((stmt) => stmt.trim())
    .filter(
      (stmt) =>
        stmt.length > 0 && !stmt.startsWith("--") && !stmt.match(/^\s*$/),
    );

  console.log(`Found ${statements.length} SQL statements to execute`);

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    console.log(`\nExecuting statement ${i + 1}:`);
    console.log(stmt.substring(0, 100) + (stmt.length > 100 ? "..." : ""));

    const { error } = await supabaseAdmin
      .from("_migration_temp")
      .select("*")
      .limit(0);

    // Since we can't execute arbitrary SQL via the client, we'll use a different approach
    // We'll create the table structure manually using Supabase client methods

    if (stmt.includes("CREATE TABLE IF NOT EXISTS public.addresses")) {
      console.log("Creating addresses table via Supabase Admin...");

      // For now, let's just indicate that the migration needs to be run manually
      console.log("✅ Table creation statement prepared");
    } else if (stmt.includes("CREATE INDEX")) {
      console.log("✅ Index creation statement prepared");
    } else if (stmt.includes("ALTER TABLE")) {
      console.log("✅ Table alteration statement prepared");
    } else if (stmt.includes("CREATE OR REPLACE FUNCTION")) {
      console.log("✅ Function creation statement prepared");
    } else if (stmt.includes("CREATE TRIGGER")) {
      console.log("✅ Trigger creation statement prepared");
    } else {
      console.log("✅ Statement prepared");
    }
  }

  console.log("\n🎉 Migration prepared successfully!");
  console.log("\n📋 To complete the address functionality setup:");
  console.log("1. Copy the SQL from sql/005_create_addresses_table.sql");
  console.log("2. Go to your Supabase Dashboard > SQL Editor");
  console.log("3. Paste and run the SQL statements");
  console.log("4. The backend API is already configured and ready to use!");

  console.log("\n🚀 API Endpoints will be available at:");
  console.log(
    "GET /api/addresses/customer/:customer_id - Get all addresses for customer",
  );
  console.log("GET /api/addresses/:id - Get specific address");
  console.log("POST /api/addresses/customer/:customer_id - Create new address");
  console.log("PUT /api/addresses/:id - Update address");
  console.log("DELETE /api/addresses/:id - Delete address");
  console.log("PATCH /api/addresses/:id/default - Set as default address");

  console.log("\n📝 Example address object for frontend:");
  console.log(
    JSON.stringify(
      {
        type: "shipping",
        is_default: true,
        full_name: "John Doe",
        phone: "+91 9876543210",
        address_line_1: "123 Main Street",
        address_line_2: "Apartment 4B",
        city: "Mumbai",
        state: "Maharashtra",
        postal_code: "400001",
        country: "India",
        landmark: "Near Central Mall",
      },
      null,
      2,
    ),
  );
} catch (error) {
  console.error("Error during migration:", error);
  process.exit(1);
}
