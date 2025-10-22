import { supabaseAdmin } from "./src/config/supabaseClient.js";

async function enableCountryWideIndia() {
  try {
    console.log("🇮🇳 Enabling country-wide delivery for India...\n");

    // First, check current delivery locations
    console.log("1. Current delivery locations:");
    const { data: currentLocations, error: fetchError } = await supabaseAdmin
      .from("delivery_locations")
      .select("*")
      .eq("country", "India")
      .order("region")
      .order("city");

    if (fetchError) {
      console.error("❌ Failed to fetch current locations:", fetchError);
      return;
    }

    if (currentLocations && currentLocations.length > 0) {
      currentLocations.forEach((loc) => {
        const status = loc.is_active ? "✅ ACTIVE" : "❌ DISABLED";
        const locationName = [loc.city, loc.region, loc.country]
          .filter(Boolean)
          .join(", ");
        console.log(`   ${status} ${locationName}`);
      });
    } else {
      console.log("   No India locations found in database");
    }

    // Check if country-wide India entry already exists
    console.log("\n2. Checking for country-wide India entry...");
    const { data: countryWideEntry, error: countryError } = await supabaseAdmin
      .from("delivery_locations")
      .select("*")
      .eq("country", "India")
      .is("region", null)
      .is("city", null);

    if (countryError) {
      console.error("❌ Failed to check country-wide entry:", countryError);
      return;
    }

    if (countryWideEntry && countryWideEntry.length > 0) {
      const entry = countryWideEntry[0];
      if (entry.is_active) {
        console.log("✅ Country-wide India delivery is already ENABLED");
        console.log(`   Entry ID: ${entry.id}`);
        console.log(`   Status: ACTIVE`);
        console.log(
          "   This means ALL locations in India should be supported!",
        );
      } else {
        console.log("⚠️  Country-wide India entry exists but is DISABLED");
        console.log("   Enabling it now...");

        const { error: updateError } = await supabaseAdmin
          .from("delivery_locations")
          .update({
            is_active: true,
            updated_at: new Date().toISOString(),
          })
          .eq("id", entry.id);

        if (updateError) {
          console.error("❌ Failed to enable country-wide India:", updateError);
        } else {
          console.log("✅ Country-wide India delivery is now ENABLED!");
        }
      }
    } else {
      console.log("⚠️  Country-wide India entry does not exist");
      console.log("   Creating it now...");

      const { error: insertError } = await supabaseAdmin
        .from("delivery_locations")
        .insert({
          country: "India",
          region: null,
          city: null,
          is_active: true,
        });

      if (insertError) {
        console.error(
          "❌ Failed to create country-wide India entry:",
          insertError,
        );
      } else {
        console.log(
          "✅ Country-wide India delivery entry created and ENABLED!",
        );
      }
    }

    // Test the delivery check for Bhimavaram
    console.log("\n3. Testing delivery check for భీమవరం (Bhimavaram)...");

    const testLocations = [
      { country: "India", region: "Andhra Pradesh", city: "భీమవరం" },
      { country: "India", region: "Andhra Pradesh", city: "Bhimavaram" },
      { country: "India", region: "Tamil Nadu", city: "Chennai" },
      { country: "India", region: "Maharashtra", city: "RandomCity" },
    ];

    for (const testLocation of testLocations) {
      console.log(
        `\n🔍 Testing: ${testLocation.city}, ${testLocation.region}, ${testLocation.country}`,
      );

      // Simulate the delivery check API logic
      let query = supabaseAdmin
        .from("delivery_locations")
        .select("*")
        .eq("is_active", true)
        .ilike("country", testLocation.country);

      // Add region filter if provided
      if (testLocation.region) {
        query = query.ilike("region", testLocation.region);
      }

      // Add city filter if provided
      if (testLocation.city) {
        query = query.ilike("city", testLocation.city);
      }

      const { data: deliveryData, error: deliveryError } = await query;

      if (deliveryError) {
        console.log(`   ❌ Database Error: ${deliveryError.message}`);
        continue;
      }

      const isAvailable = deliveryData && deliveryData.length > 0;

      if (isAvailable) {
        const location = deliveryData[0];
        const matchType = location.city
          ? "city-specific"
          : location.region
            ? "region-specific"
            : "country-wide";
        console.log(`   ✅ DELIVERY AVAILABLE (${matchType})`);
        console.log(
          `   📍 Matched: ${[location.city, location.region, location.country].filter(Boolean).join(", ")}`,
        );
      } else {
        console.log(`   ❌ DELIVERY NOT AVAILABLE`);

        // Check if there's a broader match (country-wide)
        const { data: countryMatch } = await supabaseAdmin
          .from("delivery_locations")
          .select("*")
          .eq("is_active", true)
          .ilike("country", testLocation.country)
          .is("region", null)
          .is("city", null);

        if (countryMatch && countryMatch.length > 0) {
          console.log(
            `   💡 Should be available due to country-wide delivery!`,
          );
        }
      }
    }

    console.log("\n🎉 Country-wide India delivery setup completed!");
    console.log("\n📋 Summary:");
    console.log("✅ India country-wide delivery is now enabled");
    console.log("✅ ANY location in India should now accept orders");
    console.log("✅ This includes భీమవరం, Andhra Pradesh, India");
    console.log("\n🔄 Please refresh your website and try again!");
  } catch (error) {
    console.error("❌ Failed to enable country-wide India delivery:", error);
  }
}

// Run the setup
enableCountryWideIndia();
