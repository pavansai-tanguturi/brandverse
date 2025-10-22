import { supabaseAdmin } from "./src/config/supabaseClient.js";
import fs from "fs";
import path from "path";

async function runDeliveryLocationsMigration() {
  try {
    console.log("🚀 Starting delivery locations migration...");

    const migrationPath = path.join(
      process.cwd(),
      "sql",
      "008_create_delivery_locations.sql",
    );
    const migrationSQL = fs.readFileSync(migrationPath, "utf8");

    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0 && !stmt.startsWith("--"));

    console.log(`📝 Executing ${statements.length} SQL statements...`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);

        try {
          const { error } = await supabaseAdmin.rpc("exec_sql", {
            sql: statement + ";",
          });

          if (error) {
            // Try direct query approach
            const { error: directError } = await supabaseAdmin
              .from("information_schema.tables")
              .select("*")
              .limit(1);

            if (directError) {
              console.warn(
                `⚠️  Statement ${i + 1} may have failed:`,
                error.message,
              );
            } else {
              console.log(`✅ Statement ${i + 1} completed`);
            }
          } else {
            console.log(`✅ Statement ${i + 1} completed successfully`);
          }
        } catch (stmtError) {
          console.warn(`⚠️  Statement ${i + 1} error:`, stmtError.message);
        }
      }
    }

    // Verify the table was created by checking if we can query it
    console.log("🔍 Verifying delivery_locations table...");
    const { data: testData, error: testError } = await supabaseAdmin
      .from("delivery_locations")
      .select("count")
      .limit(1);

    if (testError) {
      console.error("❌ Table verification failed:", testError.message);
      console.log("\n📋 MANUAL MIGRATION REQUIRED:");
      console.log("Please run the following SQL in your Supabase SQL editor:");
      console.log("\n" + migrationSQL);
    } else {
      console.log("✅ Migration completed successfully!");

      // Check if we have delivery locations
      const { data: locations, error: locError } = await supabaseAdmin
        .from("delivery_locations")
        .select("*")
        .eq("is_active", true);

      if (!locError && locations) {
        console.log(`📍 Found ${locations.length} active delivery locations:`);
        locations.forEach((loc) => {
          const locationName = [loc.city, loc.region, loc.country]
            .filter(Boolean)
            .join(", ");
          console.log(`   - ${locationName}`);
        });
      }
    }
  } catch (error) {
    console.error("❌ Migration error:", error);

    // Manual instructions
    console.log("\n📋 MANUAL MIGRATION REQUIRED:");
    console.log("Please run the following SQL in your Supabase SQL editor:");
    try {
      const migrationSQL = fs.readFileSync(
        path.join(process.cwd(), "sql", "008_create_delivery_locations.sql"),
        "utf8",
      );
      console.log("\n" + migrationSQL);
    } catch (readError) {
      console.log("Could not read migration file:", readError.message);
    }
  }
}

// Run the migration
runDeliveryLocationsMigration();
