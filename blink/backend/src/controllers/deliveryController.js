import { supabaseAdmin } from '../config/supabaseClient.js';

// Get all delivery locations (public endpoint)
export async function getDeliveryLocations(req, res) {
  try {
    const { data, error } = await supabaseAdmin
      .from('delivery_locations')
      .select('*')
      .eq('is_active', true)
      .order('country', { ascending: true });

    if (error) {
      console.log('Delivery locations table not found, returning default locations');
      // Return default locations if table doesn't exist
      return res.json({ 
        deliveryLocations: [
          { id: '1', country: 'India', region: null, city: null, is_active: true },
          { id: '2', country: 'Canada', region: null, city: null, is_active: true },
          { id: '3', country: 'United Kingdom', region: null, city: null, is_active: true },
          { id: '4', country: 'Australia', region: null, city: null, is_active: true }
        ]
      });
    }

    res.json({ deliveryLocations: data || [] });
  } catch (error) {
    console.error('Error fetching delivery locations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Check if delivery is available to a specific location (public endpoint)
export async function checkDeliveryAvailability(req, res) {
  try {
    const { country, region, city } = req.query;

    if (!country) {
      return res.status(400).json({ error: 'Country is required' });
    }

    // Default allowed countries (if table doesn't exist)
    const defaultAllowedCountries = ['india', 'canada', 'united kingdom', 'australia', 'uk', 'britain'];
    const countryLower = country.toLowerCase();
    
    // Check for exact matches first (most specific to least specific)
    let query = supabaseAdmin
      .from('delivery_locations')
      .select('*')
      .eq('is_active', true)
      .ilike('country', country);

    try {
      if (city && region) {
        // Check for city-specific delivery
        const { data: cityData } = await query
          .ilike('city', city)
          .ilike('region', region);
        
        if (cityData && cityData.length > 0) {
          return res.json({ available: true, location: cityData[0] });
        }
      }

      if (region) {
        // Check for region-specific delivery
        const { data: regionData } = await query
          .ilike('region', region)
          .is('city', null);
        
        if (regionData && regionData.length > 0) {
          return res.json({ available: true, location: regionData[0] });
        }
      }

      // Check for country-wide delivery
      const { data: countryData, error } = await query
        .is('region', null)
        .is('city', null);

      if (!error && countryData && countryData.length > 0) {
        return res.json({ available: true, location: countryData[0] });
      }
    } catch (dbError) {
      console.log('Database query failed, using default logic:', dbError.message);
    }

    // Fallback to default logic if database queries fail
    const available = defaultAllowedCountries.includes(countryLower);
    res.json({ 
      available, 
      location: available ? { country, region: null, city: null, is_active: true } : null 
    });

  } catch (error) {
    console.error('Error checking delivery availability:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Admin endpoints

// Get all delivery locations for admin (including inactive)
export async function adminGetDeliveryLocations(req, res) {
  try {
    const { data, error } = await supabaseAdmin
      .from('delivery_locations')
      .select('*')
      .order('country', { ascending: true });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ deliveryLocations: data || [] });
  } catch (error) {
    console.error('Error fetching delivery locations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Add new delivery location
export async function adminAddDeliveryLocation(req, res) {
  try {
    const { country, region, city } = req.body;

    if (!country) {
      return res.status(400).json({ error: 'Country is required' });
    }

    const { data, error } = await supabaseAdmin
      .from('delivery_locations')
      .insert([{
        country: country.trim(),
        region: region ? region.trim() : null,
        city: city ? city.trim() : null,
        is_active: true
      }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ error: 'This delivery location already exists' });
      }
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({ 
      message: 'Delivery location added successfully', 
      location: data 
    });
  } catch (error) {
    console.error('Error adding delivery location:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Update delivery location
export async function adminUpdateDeliveryLocation(req, res) {
  try {
    const { id } = req.params;
    const { country, region, city, is_active } = req.body;

    if (!country) {
      return res.status(400).json({ error: 'Country is required' });
    }

    const { data, error } = await supabaseAdmin
      .from('delivery_locations')
      .update({
        country: country.trim(),
        region: region ? region.trim() : null,
        city: city ? city.trim() : null,
        is_active: is_active !== undefined ? is_active : true
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ error: 'This delivery location already exists' });
      }
      return res.status(400).json({ error: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: 'Delivery location not found' });
    }

    res.json({ 
      message: 'Delivery location updated successfully', 
      location: data 
    });
  } catch (error) {
    console.error('Error updating delivery location:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Delete delivery location
export async function adminDeleteDeliveryLocation(req, res) {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('delivery_locations')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: 'Delivery location not found' });
    }

    res.json({ message: 'Delivery location deleted successfully' });
  } catch (error) {
    console.error('Error deleting delivery location:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Toggle delivery location status
export async function adminToggleDeliveryLocation(req, res) {
  try {
    const { id } = req.params;

    // First get the current status
    const { data: current, error: fetchError } = await supabaseAdmin
      .from('delivery_locations')
      .select('is_active')
      .eq('id', id)
      .single();

    if (fetchError || !current) {
      return res.status(404).json({ error: 'Delivery location not found' });
    }

    // Toggle the status
    const { data, error } = await supabaseAdmin
      .from('delivery_locations')
      .update({ is_active: !current.is_active })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ 
      message: `Delivery location ${data.is_active ? 'enabled' : 'disabled'} successfully`, 
      location: data 
    });
  } catch (error) {
    console.error('Error toggling delivery location:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
