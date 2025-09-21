import { supabaseAdmin } from '../config/supabaseClient.js';

// Utility function to validate address data
const validateAddressData = (addressData) => {
  const errors = [];
  
  const requiredFields = {
    full_name: 'Full Name',
    phone: 'Phone Number',
    address_line_1: 'Address Line 1',
    city: 'City',
    state: 'State',
    postal_code: 'Postal Code'
  };

  for (const [field, label] of Object.entries(requiredFields)) {
    if (!addressData[field] || addressData[field].trim().length === 0) {
      errors.push(`${label} is required`);
    }
  }

  // Validate phone number format (basic validation)
  if (addressData.phone && !/^\d{10}$/.test(addressData.phone.replace(/[-\s]/g, ''))) {
    errors.push('Phone number must be 10 digits');
  }

  // Validate postal code format (basic validation for Indian PIN codes)
  if (addressData.postal_code && !/^\d{6}$/.test(addressData.postal_code)) {
    errors.push('Postal code must be 6 digits');
  }

  return errors;
};

// Utility function to verify address ownership
const verifyAddressOwnership = async (addressId, customerId) => {
  const { data, error } = await supabaseAdmin
    .from('addresses')
    .select('customer_id')
    .eq('id', addressId)
    .single();

  if (error || !data) {
    return false;
  }

  return data.customer_id === customerId;
};

// Get all addresses for a customer
const getCustomerAddresses = async (req, res) => {
  try {
    const { customer_id } = req.params;
    
    if (!customer_id) {
      return res.status(400).json({ error: 'Customer ID is required' });
    }
    
    if (!req.user) {
      return res.status(401).json({ error: 'Login required' });
    }

    const auth_user_id = req.user.id;
    const { data: addresses, error } = await supabaseAdmin
      .from('addresses')
      .select('*')
      .eq('customer_id', customer_id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching addresses:', error);
      return res.status(500).json({ error: 'Failed to fetch addresses' });
    }

    res.json(addresses || []);
  } catch (error) {
    console.error('Error in getCustomerAddresses:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get a specific address by ID
const getAddress = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: address, error } = await supabaseAdmin
      .from('addresses')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching address:', error);
      return res.status(404).json({ error: 'Address not found' });
    }

    res.json(address);
  } catch (error) {
    console.error('Error in getAddress:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create a new address
const createAddress = async (req, res) => {
  try {
    const { customer_id } = req.params;
    const {
      is_default,
      full_name,
      phone,
      address_line_1,
      address_line_2,
      city,
      state,
      postal_code,
      country,
      landmark
    } = req.body;

    // Validate required fields
    if (!full_name || !address_line_1 || !city || !state || !postal_code) {
      return res.status(400).json({ 
        error: 'Required fields: full_name, address_line_1, city, state, postal_code' 
      });
    }

    // If this is being set as default, unset other defaults for this customer
    if (is_default) {
      const { error: updateError } = await supabaseAdmin
        .from('addresses')
        .update({ is_default: false })
        .eq('customer_id', customer_id);

      if (updateError) {
        console.error('Error updating default addresses:', updateError);
      }
    }

    const addressData = {
      customer_id,
      is_default: is_default || false,
      full_name,
      phone,
      address_line_1,
      address_line_2,
      city,
      state,
      postal_code,
      country: country || 'India',
      landmark
    };

    const { data: address, error } = await supabaseAdmin
      .from('addresses')
      .insert(addressData)
      .select()
      .single();

    if (error) {
      console.error('Error creating address:', error);
      return res.status(500).json({ error: 'Failed to create address' });
    }

    res.status(201).json(address);
  } catch (error) {
    console.error('Error in createAddress:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update an address
const updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      is_default,
      full_name,
      phone,
      address_line_1,
      address_line_2,
      city,
      state,
      postal_code,
      country,
      landmark
    } = req.body;

        // Get the existing address to check if it exists and get customer info
    const { data: existingAddress, error: fetchError } = await supabaseAdmin
      .from('addresses')
      .select('customer_id')
      .eq('id', id)
      .single();

    if (fetchError) {
      return res.status(404).json({ error: 'Address not found' });
    }

    // If this is being set as default, unset other defaults for this customer
    if (is_default) {
      const { error: updateError } = await supabaseAdmin
        .from('addresses')
        .update({ is_default: false })
        .eq('customer_id', existingAddress.customer_id)
        .neq('id', id);

      if (updateError) {
        console.error('Error updating default addresses:', updateError);
      }
    }

    const updateData = {};
    if (is_default !== undefined) updateData.is_default = is_default;
    if (full_name !== undefined) updateData.full_name = full_name;
    if (phone !== undefined) updateData.phone = phone;
    if (address_line_1 !== undefined) updateData.address_line_1 = address_line_1;
    if (address_line_2 !== undefined) updateData.address_line_2 = address_line_2;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (postal_code !== undefined) updateData.postal_code = postal_code;
    if (country !== undefined) updateData.country = country;
    if (landmark !== undefined) updateData.landmark = landmark;

    const { data: address, error } = await supabaseAdmin
      .from('addresses')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating address:', error);
      return res.status(500).json({ error: 'Failed to update address' });
    }

    res.json(address);
  } catch (error) {
    console.error('Error in updateAddress:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete an address
const deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('addresses')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting address:', error);
      return res.status(500).json({ error: 'Failed to delete address' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error in deleteAddress:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Set an address as default
const setDefaultAddress = async (req, res) => {
  try {
    const { id } = req.params;

    // Get the address to get customer_id
    const { data: address, error: fetchError } = await supabaseAdmin
      .from('addresses')
      .select('customer_id')
      .eq('id', id)
      .single();

    if (fetchError) {
      return res.status(404).json({ error: 'Address not found' });
    }

    // Unset other defaults for this customer
    const { error: updateError } = await supabaseAdmin
      .from('addresses')
      .update({ is_default: false })
      .eq('customer_id', address.customer_id);

    if (updateError) {
      console.error('Error updating default addresses:', updateError);
    }

    // Set this address as default
    const { data: updatedAddress, error } = await supabaseAdmin
      .from('addresses')
      .update({ is_default: true })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error setting default address:', error);
      return res.status(500).json({ error: 'Failed to set default address' });
    }

    res.json(updatedAddress);
  } catch (error) {
    console.error('Error in setDefaultAddress:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all addresses for the current authenticated user
const getCurrentUserAddresses = async (req, res) => {
  try {
    if (!req.user) {
      console.log('No user found');
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const auth_user_id = req.user.id;
    console.log('Fetching addresses for auth_user_id:', auth_user_id);

    // First, get the customer record to find the database customer ID
    const { data: customer, error: customerError } = await supabaseAdmin
      .from('customers')
      .select('id, email')
      .eq('auth_user_id', auth_user_id)
      .single();

    if (customerError || !customer) {
      console.error('Customer not found for auth_user_id:', auth_user_id, customerError);
      return res.status(404).json({ error: 'Customer record not found' });
    }

    const customer_id = customer.id;
    console.log('Found customer database ID:', customer_id);

    const { data: addresses, error } = await supabaseAdmin
      .from('addresses')
      .select('*')
      .eq('customer_id', customer_id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user addresses:', error);
      return res.status(500).json({ error: 'Failed to fetch addresses' });
    }

    console.log('Found addresses for user:', addresses?.length || 0, 'addresses');
    res.json(addresses || []);
  } catch (error) {
    console.error('Error in getCurrentUserAddresses:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create a new address for the current authenticated user
const createCurrentUserAddress = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const auth_user_id = req.user.id;
    
    // First, get the customer record to find the database customer ID
    let { data: customer, error: customerError } = await supabaseAdmin
      .from('customers')
      .select('id, email')
      .eq('auth_user_id', auth_user_id)
      .single();

    if (customerError || !customer) {
      console.error('Customer not found for auth_user_id:', auth_user_id, customerError);
      
      // Try to create the customer record if it doesn't exist
      const userEmail = req.user.email;
      const userName = req.user.full_name || req.user.name || 'User';
      
      console.log('Attempting to create customer record for:', { auth_user_id, userEmail, userName });
      
      const { data: newCustomer, error: createError } = await supabaseAdmin
        .from('customers')
        .insert({
          auth_user_id: auth_user_id,
          email: userEmail,
          full_name: userName,
          phone: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError || !newCustomer) {
        console.error('Failed to create customer record:', createError);
        return res.status(500).json({ error: 'Failed to create customer record. Please contact support.' });
      }

      console.log('Successfully created customer record:', newCustomer);
      customer = newCustomer;
    }

    const customer_id = customer.id;
    console.log('Found customer for address creation:', { auth_user_id, customer_id, customer_email: customer.email });
    
    const {
      is_default,
      full_name,
      phone,
      address_line_1,
      address_line_2,
      city,
      state,
      postal_code,
      country,
      landmark
    } = req.body;

    // Validation
    if (!full_name || !phone || !address_line_1 || !city || !state || !postal_code) {
      return res.status(400).json({ 
        error: 'Required fields: full_name, phone, address_line_1, city, state, postal_code' 
      });
    }



    // If this is set as default, unset other default addresses
    if (is_default) {
      const { error: updateError } = await supabaseAdmin
        .from('addresses')
        .update({ is_default: false })
        .eq('customer_id', customer_id);

      if (updateError) {
        console.error('Error updating default addresses:', updateError);
      }
    }

    const addressData = {
      customer_id,
      is_default: is_default || false,
      full_name,
      phone,
      address_line_1,
      address_line_2,
      city,
      state,
      postal_code,
      country: country || 'India',
      landmark
    };

    const { data: address, error } = await supabaseAdmin
      .from('addresses')
      .insert(addressData)
      .select()
      .single();

    if (error) {
      console.error('Error creating address:', error);
      return res.status(500).json({ error: 'Failed to create address' });
    }

    console.log('Successfully created address:', address);
    res.status(201).json(address);
  } catch (error) {
    console.error('Error in createCurrentUserAddress:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Bulk create addresses
const bulkCreateAddresses = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { addresses } = req.body;
    if (!Array.isArray(addresses) || addresses.length === 0) {
      return res.status(400).json({ error: 'Addresses array is required' });
    }

    // Get customer ID
    const { data: customer } = await supabaseAdmin
      .from('customers')
      .select('id')
      .eq('auth_user_id', req.user.id)
      .single();

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Validate all addresses
    const validationErrors = [];
    addresses.forEach((addr, index) => {
      const errors = validateAddressData(addr);
      if (errors.length > 0) {
        validationErrors.push({ index, errors });
      }
    });

    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationErrors
      });
    }

    // Prepare addresses for insertion
    const addressesToInsert = addresses.map(addr => ({
      ...addr,
      customer_id: customer.id,
      country: addr.country || 'India'
    }));

    const { data, error } = await supabaseAdmin
      .from('addresses')
      .insert(addressesToInsert)
      .select();

    if (error) {
      return res.status(500).json({ error: 'Failed to create addresses' });
    }

    res.status(201).json({
      message: `Successfully created ${data.length} addresses`,
      addresses: data
    });
  } catch (error) {
    console.error('Error in bulkCreateAddresses:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Bulk delete addresses
const bulkDeleteAddresses = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Address IDs array is required' });
    }

    // Get customer ID
    const { data: customer } = await supabaseAdmin
      .from('customers')
      .select('id')
      .eq('auth_user_id', req.user.id)
      .single();

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Verify ownership of all addresses
    for (const id of ids) {
      const isOwner = await verifyAddressOwnership(id, customer.id);
      if (!isOwner) {
        return res.status(403).json({ error: 'Not authorized to delete one or more addresses' });
      }
    }

    const { data, error } = await supabaseAdmin
      .from('addresses')
      .delete()
      .in('id', ids)
      .eq('customer_id', customer.id)
      .select();

    if (error) {
      return res.status(500).json({ error: 'Failed to delete addresses' });
    }

    res.json({
      message: `Successfully deleted ${data.length} addresses`,
      deletedAddresses: data
    });
  } catch (error) {
    console.error('Error in bulkDeleteAddresses:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Copy/Duplicate an address
const duplicateAddress = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { id } = req.params;

    // Get customer ID
    const { data: customer } = await supabaseAdmin
      .from('customers')
      .select('id')
      .eq('auth_user_id', req.user.id)
      .single();

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Verify ownership and get address
    const isOwner = await verifyAddressOwnership(id, customer.id);
    if (!isOwner) {
      return res.status(403).json({ error: 'Not authorized to access this address' });
    }

    const { data: sourceAddress } = await supabaseAdmin
      .from('addresses')
      .select('*')
      .eq('id', id)
      .single();

    if (!sourceAddress) {
      return res.status(404).json({ error: 'Address not found' });
    }

    // Create new address based on source
    const { id: _, created_at, updated_at, is_default, ...addressData } = sourceAddress;
    const { data: newAddress, error } = await supabaseAdmin
      .from('addresses')
      .insert({
        ...addressData,
        is_default: false,
        full_name: `${sourceAddress.full_name} (Copy)`
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to duplicate address' });
    }

    res.status(201).json({
      message: 'Address duplicated successfully',
      address: newAddress
    });
  } catch (error) {
    console.error('Error in duplicateAddress:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Search/Filter addresses
const searchAddresses = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { query, state, city } = req.query;

    // Get customer ID
    const { data: customer } = await supabaseAdmin
      .from('customers')
      .select('id')
      .eq('auth_user_id', req.user.id)
      .single();

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    let dbQuery = supabaseAdmin
      .from('addresses')
      .select('*')
      .eq('customer_id', customer.id);

    // Apply filters
    if (query) {
      dbQuery = dbQuery.or(
        `full_name.ilike.%${query}%,address_line_1.ilike.%${query}%,address_line_2.ilike.%${query}%`
      );
    }

    if (state) {
      dbQuery = dbQuery.ilike('state', `%${state}%`);
    }

    if (city) {
      dbQuery = dbQuery.ilike('city', `%${city}%`);
    }

    // Order by default first, then created date
    dbQuery = dbQuery
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    const { data, error } = await dbQuery;

    if (error) {
      return res.status(500).json({ error: 'Failed to search addresses' });
    }

    res.json(data || []);
  } catch (error) {
    console.error('Error in searchAddresses:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export {
  getCustomerAddresses,
  getAddress,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  getCurrentUserAddresses,
  createCurrentUserAddress,
  bulkCreateAddresses,
  bulkDeleteAddresses,
  duplicateAddress,
  searchAddresses
};