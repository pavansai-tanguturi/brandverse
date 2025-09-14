import { supabaseAdmin } from '../config/supabaseClient.js';

// Get all addresses for a customer
const getCustomerAddresses = async (req, res) => {
  try {
    const { customer_id } = req.params;
    
    if (!customer_id) {
      return res.status(400).json({ error: 'Customer ID is required' });
    }

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
    if (!req.session || !req.session.user) {
      console.log('No session or user found');
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const auth_user_id = req.session.user.id;
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
    if (!req.session || !req.session.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const auth_user_id = req.session.user.id;
    
    // First, get the customer record to find the database customer ID
    let { data: customer, error: customerError } = await supabaseAdmin
      .from('customers')
      .select('id, email')
      .eq('auth_user_id', auth_user_id)
      .single();

    if (customerError || !customer) {
      console.error('Customer not found for auth_user_id:', auth_user_id, customerError);
      
      // Try to create the customer record if it doesn't exist
      const userEmail = req.session.user.email;
      const userName = req.session.user.full_name || req.session.user.name || 'User';
      
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

export {
  getCustomerAddresses,
  getAddress,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  getCurrentUserAddresses,
  createCurrentUserAddress
};
