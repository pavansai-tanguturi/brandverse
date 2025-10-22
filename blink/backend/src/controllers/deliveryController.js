import { supabaseAdmin } from "../config/supabaseClient.js";

// Simple function to normalize location strings for consistent comparison
const normalizeLocationString = (str) => {
  if (!str) return null;
  return str.trim();
};

// Utility function to normalize location strings
const normalizeLocation = (str) => {
  if (!str) return null;
  return str.trim().toLowerCase();
};

// Utility function to validate location data
const validateLocationData = (country, region, city) => {
  const errors = [];

  if (!country || country.trim().length === 0) {
    errors.push("Country is required");
  }

  if (country && country.trim().length < 2) {
    errors.push("Country must be at least 2 characters long");
  }

  if (region && region.trim().length < 2) {
    errors.push("Region must be at least 2 characters long");
  }

  if (city && city.trim().length < 2) {
    errors.push("City must be at least 2 characters long");
  }

  return errors;
};

// Get all delivery locations (public endpoint)
export async function getDeliveryLocations(req, res) {
  try {
    const { active_only = "true", country, region } = req.query;

    let query = supabaseAdmin.from("delivery_locations").select("*");

    // Filter by active status
    if (active_only === "true") {
      query = query.eq("is_active", true);
    }

    // Filter by country if provided
    if (country) {
      query = query.ilike("country", country);
    }

    // Filter by region if provided
    if (region) {
      query = query.ilike("region", region);
    }

    query = query
      .order("country", { ascending: true })
      .order("region", { ascending: true })
      .order("city", { ascending: true });

    const { data, error } = await query;

    if (error) {
      console.log(
        "Delivery locations table not found or error:",
        error.message,
      );
      return res.json({
        deliveryLocations: [],
        message: "Delivery locations table not configured",
      });
    }

    // Group locations by country for better organization
    const groupedLocations =
      data?.reduce((acc, location) => {
        const country = location.country;
        if (!acc[country]) {
          acc[country] = [];
        }
        acc[country].push(location);
        return acc;
      }, {}) || {};

    res.json({
      deliveryLocations: data || [],
      groupedLocations,
      total: data?.length || 0,
    });
  } catch (error) {
    console.error("Error fetching delivery locations:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Check if delivery is available to a specific location (public endpoint)
export async function checkDeliveryAvailability(req, res) {
  try {
    const { country, region, city } = req.query;

    if (!country) {
      return res.status(400).json({
        available: false,
        message: "Country is required",
        error: "Country parameter is missing",
      });
    }

    console.log(
      `🔍 Checking delivery for: ${city || "N/A"}, ${region || "N/A"}, ${country}`,
    );

    try {
      // 🎯 HIERARCHICAL DELIVERY CHECK: Check from most specific to most general

      // 1. First check for exact location match (city + region + country)
      if (city && region) {
        const { data: exactMatch, error: exactError } = await supabaseAdmin
          .from("delivery_locations")
          .select("*")
          .eq("is_active", true)
          .ilike("country", country)
          .ilike("region", region)
          .ilike("city", city);

        if (!exactError && exactMatch && exactMatch.length > 0) {
          const location = exactMatch[0];
          const locationName = [
            location.city,
            location.region,
            location.country,
          ]
            .filter(Boolean)
            .join(", ");
          console.log(`✅ Exact match found: ${locationName}`);

          return res.json({
            available: true,
            location: location,
            matchType: "exact",
            message: `Great! We deliver to ${locationName}.`,
          });
        }
      }

      // 2. Check for region-wide delivery (region + country, city = null)
      if (region) {
        const { data: regionMatch, error: regionError } = await supabaseAdmin
          .from("delivery_locations")
          .select("*")
          .eq("is_active", true)
          .ilike("country", country)
          .ilike("region", region)
          .is("city", null);

        if (!regionError && regionMatch && regionMatch.length > 0) {
          const location = regionMatch[0];
          const requestedLocation = [city, region, country]
            .filter(Boolean)
            .join(", ");
          console.log(
            `✅ Region-wide delivery found for: ${requestedLocation}`,
          );

          return res.json({
            available: true,
            location: location,
            matchType: "region",
            message: `Great! We deliver to all locations in ${region}, ${country}.`,
          });
        }
      }

      // 3. 🇮🇳 Check for COUNTRY-WIDE delivery (country only, region = null, city = null)
      const { data: countryMatch, error: countryError } = await supabaseAdmin
        .from("delivery_locations")
        .select("*")
        .eq("is_active", true)
        .ilike("country", country)
        .is("region", null)
        .is("city", null);

      if (!countryError && countryMatch && countryMatch.length > 0) {
        const location = countryMatch[0];
        const requestedLocation = [city, region, country]
          .filter(Boolean)
          .join(", ");
        console.log(`✅ Country-wide delivery found for: ${requestedLocation}`);

        return res.json({
          available: true,
          location: location,
          matchType: "country",
          message: `Great! We deliver anywhere in ${country}.`,
        });
      }

      // 4. No delivery available
      const deliveryData = null;
      const deliveryError = null;

      if (deliveryError) {
        console.error("Database error checking delivery:", deliveryError);
        return res.status(500).json({
          available: false,
          message: "Error checking delivery availability",
          error: "Database error",
        });
      }

      // Check if we found any matching active delivery locations
      const isAvailable = deliveryData && deliveryData.length > 0;

      if (isAvailable) {
        const location = deliveryData[0];
        const locationName = [location.city, location.region, location.country]
          .filter(Boolean)
          .join(", ");
        console.log(` Delivery available to: ${locationName}`);

        return res.json({
          available: true,
          location: location,
          message: `Great! We deliver to ${locationName}.`,
        });
      } else {
        // Check if the location exists but is disabled
        const { data: disabledLocation, error: disabledError } =
          await supabaseAdmin
            .from("delivery_locations")
            .select("*")
            .eq("is_active", false)
            .ilike("country", country)
            .ilike("region", region || "")
            .ilike("city", city || "");

        const locationName = [city, region, country].filter(Boolean).join(", ");

        if (!disabledError && disabledLocation && disabledLocation.length > 0) {
          console.log(` Delivery disabled for: ${locationName}`);
          return res.json({
            available: false,
            message: `Sorry, delivery is currently disabled for ${locationName}. Please contact us for updates.`,
          });
        } else {
          console.log(` Delivery not available for: ${locationName}`);
          return res.json({
            available: false,
            message: `Sorry, we don't currently deliver to ${locationName}. We're working to expand our delivery locations!`,
          });
        }
      }
    } catch (dbError) {
      console.error("Database query failed:", dbError);
      return res.json({
        available: false,
        location: null,
        message:
          "Unable to check delivery availability at this time. Please try again later.",
        error: "Database connection failed",
      });
    }
  } catch (error) {
    console.error("Error checking delivery availability:", error);
    res.status(500).json({
      available: false,
      message: "Internal server error",
      error: "Internal server error",
    });
  }
}

// Get delivery statistics (public endpoint)
export async function getDeliveryStats(req, res) {
  try {
    const { data: stats, error } = await supabaseAdmin
      .from("delivery_locations")
      .select("country, region, city, is_active");

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const totalLocations = stats?.length || 0;
    const activeLocations = stats?.filter((loc) => loc.is_active).length || 0;
    const countries = [...new Set(stats?.map((loc) => loc.country) || [])]
      .length;
    const regions = [
      ...new Set(
        stats?.filter((loc) => loc.region).map((loc) => loc.region) || [],
      ),
    ].length;
    const cities = [
      ...new Set(stats?.filter((loc) => loc.city).map((loc) => loc.city) || []),
    ].length;

    res.json({
      totalLocations,
      activeLocations,
      inactiveLocations: totalLocations - activeLocations,
      countries,
      regions,
      cities,
    });
  } catch (error) {
    console.error("Error fetching delivery stats:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Admin endpoints
export async function adminGetDeliveryLocations(req, res) {
  try {
    const { page = 1, limit = 50, search, country, is_active } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabaseAdmin
      .from("delivery_locations")
      .select("*", { count: "exact" });

    // Apply filters
    if (search) {
      query = query.or(
        `country.ilike.%${search}%,region.ilike.%${search}%,city.ilike.%${search}%`,
      );
    }

    if (country) {
      query = query.ilike("country", country);
    }

    if (is_active !== undefined) {
      query = query.eq("is_active", is_active === "true");
    }

    // Apply pagination
    query = query
      .range(offset, offset + parseInt(limit) - 1)
      .order("country", { ascending: true })
      .order("region", { ascending: true })
      .order("city", { ascending: true });

    const { data, error, count } = await query;

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      deliveryLocations: data || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching delivery locations:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Add new delivery location
export async function adminAddDeliveryLocation(req, res) {
  try {
    const { country, region, city, is_active = true } = req.body;

    // Validate input data
    const validationErrors = validateLocationData(country, region, city);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: "Validation failed",
        details: validationErrors,
      });
    }

    // Check for duplicate entries
    const { data: existing } = await supabaseAdmin
      .from("delivery_locations")
      .select("id")
      .eq("country", country.trim())
      .eq("region", region ? region.trim() : null)
      .eq("city", city ? city.trim() : null);

    if (existing && existing.length > 0) {
      return res
        .status(409)
        .json({ error: "This delivery location already exists" });
    }

    const { data, error } = await supabaseAdmin
      .from("delivery_locations")
      .insert([
        {
          country: country.trim(),
          region: region ? region.trim() : null,
          city: city ? city.trim() : null,
          is_active: Boolean(is_active),
        },
      ])
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return res
          .status(409)
          .json({ error: "This delivery location already exists" });
      }
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({
      message: "Delivery location added successfully",
      location: data,
    });
  } catch (error) {
    console.error("Error adding delivery location:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Bulk add delivery locations
export async function adminBulkAddDeliveryLocations(req, res) {
  try {
    const { locations } = req.body;

    if (!Array.isArray(locations) || locations.length === 0) {
      return res.status(400).json({ error: "Locations array is required" });
    }

    // Validate all locations
    const validationErrors = [];
    const validLocations = [];

    locations.forEach((loc, index) => {
      const errors = validateLocationData(loc.country, loc.region, loc.city);
      if (errors.length > 0) {
        validationErrors.push({
          index,
          location: loc,
          errors,
        });
      } else {
        validLocations.push({
          country: loc.country.trim(),
          region: loc.region ? loc.region.trim() : null,
          city: loc.city ? loc.city.trim() : null,
          is_active: Boolean(
            loc.is_active !== undefined ? loc.is_active : true,
          ),
        });
      }
    });

    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: "Validation failed for some locations",
        validationErrors,
        validCount: validLocations.length,
      });
    }

    const { data, error } = await supabaseAdmin
      .from("delivery_locations")
      .insert(validLocations)
      .select();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({
      message: `${data.length} delivery locations added successfully`,
      locations: data,
      count: data.length,
    });
  } catch (error) {
    console.error("Error bulk adding delivery locations:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Update delivery location
export async function adminUpdateDeliveryLocation(req, res) {
  try {
    const { id } = req.params;
    const { country, region, city, is_active } = req.body;

    // Validate input data
    const validationErrors = validateLocationData(country, region, city);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: "Validation failed",
        details: validationErrors,
      });
    }

    // Check if location exists
    const { data: existing } = await supabaseAdmin
      .from("delivery_locations")
      .select("*")
      .eq("id", id)
      .single();

    if (!existing) {
      return res.status(404).json({ error: "Delivery location not found" });
    }

    const { data, error } = await supabaseAdmin
      .from("delivery_locations")
      .update({
        country: country.trim(),
        region: region ? region.trim() : null,
        city: city ? city.trim() : null,
        is_active:
          is_active !== undefined ? Boolean(is_active) : existing.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return res
          .status(409)
          .json({ error: "This delivery location already exists" });
      }
      return res.status(400).json({ error: error.message });
    }

    res.json({
      message: "Delivery location updated successfully",
      location: data,
    });
  } catch (error) {
    console.error("Error updating delivery location:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Delete delivery location
export async function adminDeleteDeliveryLocation(req, res) {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from("delivery_locations")
      .delete()
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: "Delivery location not found" });
    }

    res.json({
      message: "Delivery location deleted successfully",
      deletedLocation: data,
    });
  } catch (error) {
    console.error("Error deleting delivery location:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Bulk delete delivery locations
export async function adminBulkDeleteDeliveryLocations(req, res) {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "IDs array is required" });
    }

    const { data, error } = await supabaseAdmin
      .from("delivery_locations")
      .delete()
      .in("id", ids)
      .select();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      message: `${data.length} delivery locations deleted successfully`,
      deletedCount: data.length,
      deletedLocations: data,
    });
  } catch (error) {
    console.error("Error bulk deleting delivery locations:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Toggle delivery location status
export async function adminToggleDeliveryLocation(req, res) {
  try {
    const { id } = req.params;

    // First get the current status
    const { data: current, error: fetchError } = await supabaseAdmin
      .from("delivery_locations")
      .select("is_active")
      .eq("id", id)
      .single();

    if (fetchError || !current) {
      return res.status(404).json({ error: "Delivery location not found" });
    }

    // Toggle the status
    const { data, error } = await supabaseAdmin
      .from("delivery_locations")
      .update({
        is_active: !current.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      message: `Delivery location ${data.is_active ? "enabled" : "disabled"} successfully`,
      location: data,
    });
  } catch (error) {
    console.error("Error toggling delivery location:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Bulk toggle delivery locations
export async function adminBulkToggleDeliveryLocations(req, res) {
  try {
    const { ids, is_active } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "IDs array is required" });
    }

    if (typeof is_active !== "boolean") {
      return res
        .status(400)
        .json({ error: "is_active must be a boolean value" });
    }

    const { data, error } = await supabaseAdmin
      .from("delivery_locations")
      .update({
        is_active: is_active,
        updated_at: new Date().toISOString(),
      })
      .in("id", ids)
      .select();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      message: `${data.length} delivery locations ${is_active ? "enabled" : "disabled"} successfully`,
      updatedCount: data.length,
      locations: data,
    });
  } catch (error) {
    console.error("Error bulk toggling delivery locations:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Export locations to CSV format
export async function adminExportDeliveryLocations(req, res) {
  try {
    const { format = "json" } = req.query;

    const { data, error } = await supabaseAdmin
      .from("delivery_locations")
      .select("*")
      .order("country", { ascending: true })
      .order("region", { ascending: true })
      .order("city", { ascending: true });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    if (format === "csv") {
      // Convert to CSV format
      const headers = [
        "ID",
        "Country",
        "Region",
        "City",
        "Active",
        "Created At",
        "Updated At",
      ];
      const csvData = [
        headers.join(","),
        ...data.map((loc) =>
          [
            loc.id,
            `"${loc.country || ""}"`,
            `"${loc.region || ""}"`,
            `"${loc.city || ""}"`,
            loc.is_active,
            loc.created_at,
            loc.updated_at,
          ].join(","),
        ),
      ].join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="delivery_locations_${new Date().toISOString().split("T")[0]}.csv"`,
      );
      res.send(csvData);
    } else {
      res.json({
        deliveryLocations: data || [],
        exportDate: new Date().toISOString(),
        count: data?.length || 0,
      });
    }
  } catch (error) {
    console.error("Error exporting delivery locations:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
