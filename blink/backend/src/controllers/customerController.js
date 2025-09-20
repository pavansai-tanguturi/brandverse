// controllers/customers.js
import { supabaseAdmin } from '../config/supabaseClient.js';
import { nanoid } from 'nanoid';

// 🔐 GET /api/customers/me
export async function getMe(req, res) {
  try {
    // Fix: Use userId instead of id to match your JWT structure
    const userId = req.user.userId || req.user.id || req.user.sub;

    console.log('[getMe] User from token:', req.user);
    console.log('[getMe] Using userId:', userId);

    if (!userId) {
      return res.status(401).json({ error: 'User ID not found in token' });
    }

    const { data, error } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('auth_user_id', userId)
      .single();

    if (error) {
      console.log('[getMe] Supabase error:', error);
      return res.status(404).json({ error: 'Customer record not found' });
    }

    // Handle avatar URL signing
    try {
      const bucket = process.env.PRODUCT_IMAGES_BUCKET;
      if (data?.avatar_url && !data.avatar_url.startsWith('http') && bucket) {
        const { data: signed } = await supabaseAdmin
          .storage
          .from(bucket)
          .createSignedUrl(data.avatar_url, 60 * 60);
        data.avatar_url = signed?.signedUrl || null;
      }
    } catch (e) {
      // skip if signed URL fails
      console.warn('Avatar URL signing failed:', e.message);
    }

    res.json(data);
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// 📝 PUT /api/customers/me
export async function updateMe(req, res) {
  try {
    // Fix: Use userId instead of id to match your JWT structure
    const userId = req.user.userId || req.user.id || req.user.sub;
    
    if (!userId) {
      return res.status(401).json({ error: 'User ID not found in token' });
    }

    const patch = { ...req.body };

    // Remove protected fields
    delete patch.auth_user_id;
    delete patch.email;
    delete patch.is_admin;
    delete patch.id;
    delete patch.created_at;
    delete patch.updated_at;

    const { data, error } = await supabaseAdmin
      .from('customers')
      .update(patch)
      .eq('auth_user_id', userId)
      .select('*')
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    console.error('Update me error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// 🖼️ POST /api/customers/me/avatar
export async function uploadAvatar(req, res) {
  try {
    // Fix: Use userId instead of id to match your JWT structure
    const userId = req.user.userId || req.user.id || req.user.sub;
    
    if (!userId) {
      return res.status(401).json({ error: 'User ID not found in token' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.files[0];
    const ext = (file.originalname.split('.').pop() || 'png').toLowerCase();
    const filename = `avatars/${userId}/${nanoid(8)}.${ext}`;
    const bucket = process.env.PRODUCT_IMAGES_BUCKET;

    if (!bucket) {
      return res.status(500).json({ error: 'Storage configuration missing' });
    }

    // Upload new avatar
    const { error: uploadError } = await supabaseAdmin.storage
      .from(bucket)
      .upload(filename, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (uploadError) {
      return res.status(400).json({ error: uploadError.message });
    }

    // Get current avatar to delete old one
    const { data: currentCustomer } = await supabaseAdmin
      .from('customers')
      .select('avatar_url')
      .eq('auth_user_id', userId)
      .single();

    // Update customer record
    const { error: updateError } = await supabaseAdmin
      .from('customers')
      .update({ avatar_url: filename })
      .eq('auth_user_id', userId);

    if (updateError) {
      // Clean up uploaded file if database update fails
      await supabaseAdmin.storage.from(bucket).remove([filename]);
      return res.status(400).json({ error: updateError.message });
    }

    // Delete old avatar if it exists and is not a URL
    if (currentCustomer?.avatar_url && !currentCustomer.avatar_url.startsWith('http')) {
      try {
        await supabaseAdmin.storage.from(bucket).remove([currentCustomer.avatar_url]);
      } catch (e) {
        console.warn('Failed to delete old avatar:', e.message);
      }
    }

    // Create signed URL for response
    const { data: signed } = await supabaseAdmin
      .storage
      .from(bucket)
      .createSignedUrl(filename, 60 * 60);

    res.json({ 
      avatar_url: signed?.signedUrl || null, 
      path: filename,
      message: 'Avatar uploaded successfully'
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// ❌ DELETE /api/customers/me
export async function deleteMe(req, res) {
  try {
    // Fix: Use userId instead of id to match your JWT structure
    const userId = req.user.userId || req.user.id || req.user.sub;
    
    if (!userId) {
      return res.status(401).json({ error: 'User ID not found in token' });
    }

    const anonEmail = `deleted+${userId}@example.invalid`;

    // Get current customer data for cleanup
    const { data: customer } = await supabaseAdmin
      .from('customers')
      .select('avatar_url')
      .eq('auth_user_id', userId)
      .single();

    // Delete avatar from storage
    if (customer?.avatar_url && !customer.avatar_url.startsWith('http')) {
      try {
        const bucket = process.env.PRODUCT_IMAGES_BUCKET;
        if (bucket) {
          await supabaseAdmin.storage.from(bucket).remove([customer.avatar_url]);
        }
      } catch (e) {
        console.warn('Failed to delete avatar during account deletion:', e.message);
      }
    }

    // Soft delete customer record
    const { data, error } = await supabaseAdmin
      .from('customers')
      .update({
        deleted_at: new Date().toISOString(),
        email: anonEmail,
        full_name: null,
        phone: null,
        bio: null,
        marketing_opt_in: false,
        avatar_url: null
      })
      .eq('auth_user_id', userId)
      .select('*')
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Clear JWT cookie if it exists
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    res.json({ 
      deleted: true,
      message: 'Account deleted successfully. Please discard any stored tokens.'
    });
  } catch (error) {
    console.error('Delete me error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

//////////////////////////////////////////////////////////
// 🔐 ADMIN FUNCTIONS
//////////////////////////////////////////////////////////

// 🔍 GET /api/admin/customers
export async function listCustomers(req, res) {
  try {
    const { data: allCustomers, error: allError } = await supabaseAdmin
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (allError) throw allError;

    const calculateCustomerTier = (totalSpent, orderCount) => {
      const rupees = totalSpent / 100;
      if (rupees >= 100000 || orderCount >= 50)
        return { name: 'Platinum', color: 'text-purple-600', bgColor: 'bg-purple-100' };
      if (rupees >= 50000 || orderCount >= 25)
        return { name: 'Gold', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
      if (rupees >= 20000 || orderCount >= 10)
        return { name: 'Silver', color: 'text-gray-600', bgColor: 'bg-gray-100' };
      if (rupees >= 5000 || orderCount >= 3)
        return { name: 'Bronze', color: 'text-orange-600', bgColor: 'bg-orange-100' };
      return { name: 'New', color: 'text-blue-600', bgColor: 'bg-blue-100' };
    };

    const customerStats = {};

    // Process customers in batches for better performance
    for (const customer of allCustomers) {
      const { data: orders, error: ordersError } = await supabaseAdmin
        .from('orders')
        .select('id, total_cents, created_at')
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.warn(`Failed to get orders for customer ${customer.id}:`, ordersError.message);
      }

      const orderCount = orders?.length || 0;
      const totalSpent = orders?.reduce((sum, order) => sum + (order.total_cents || 0), 0) || 0;
      const tier = calculateCustomerTier(totalSpent, orderCount);

      customerStats[customer.id] = {
        ...customer,
        order_count: orderCount,
        total_spent: totalSpent,
        last_order_date: orders?.[0]?.created_at || null,
        tier
      };
    }

    res.json(Object.values(customerStats));
  } catch (error) {
    console.error('List customers error:', error);
    res.status(500).json({ error: error.message });
  }
}

// 🔍 GET /api/admin/customers/:id
export async function getCustomerDetails(req, res) {
  try {
    const { id } = req.params;

    const { data: customer, error: customerError } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    if (customerError) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('customer_id', id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (ordersError) {
      console.warn('Failed to get orders:', ordersError.message);
    }

    const addresses = [];

    const { data: addressData, error: addressError } = await supabaseAdmin
      .from('addresses')
      .select('*')
      .eq('customer_id', id)
      .order('is_default', { ascending: false });

    if (!addressError && addressData?.length > 0) {
      addressData.forEach(addr => {
        addresses.push({
          type: addr.is_default ? 'shipping' : 'additional',
          address: { ...addr }
        });
      });

      const defaultAddr = addressData[0];
      customer.shipping_address = { ...defaultAddr };
      customer.billing_address = { ...defaultAddr };
    } else {
      if (customer.shipping_address)
        addresses.push({ type: 'shipping', address: customer.shipping_address });
      if (customer.billing_address)
        addresses.push({ type: 'billing', address: customer.billing_address });
    }

    const orderCount = orders?.length || 0;
    const totalSpent = orders?.reduce((sum, order) => sum + (order.total_cents || 0), 0) || 0;

    const calculateCustomerTier = (total, count) => {
      const rupees = total / 100;
      if (rupees >= 100000 || count >= 50)
        return { name: 'Platinum', color: 'text-purple-600', bgColor: 'bg-purple-100' };
      if (rupees >= 50000 || count >= 25)
        return { name: 'Gold', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
      if (rupees >= 20000 || count >= 10)
        return { name: 'Silver', color: 'text-gray-600', bgColor: 'bg-gray-100' };
      if (rupees >= 5000 || count >= 3)
        return { name: 'Bronze', color: 'text-orange-600', bgColor: 'bg-orange-100' };
      return { name: 'New', color: 'text-blue-600', bgColor: 'bg-blue-100' };
    };

    const tier = calculateCustomerTier(totalSpent, orderCount);

    res.json({
      ...customer,
      order_count: orderCount,
      total_spent: totalSpent,
      recent_orders: orders || [],
      addresses,
      tier
    });
  } catch (error) {
    console.error('Get customer details error:', error);
    res.status(500).json({ error: error.message });
  }
}

// ✏️ PUT /api/admin/customers/:id
export async function updateCustomerAdmin(req, res) {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    // Remove protected fields
    delete updates.id;
    delete updates.auth_user_id;
    delete updates.created_at;
    delete updates.updated_at;

    const { data, error } = await supabaseAdmin
      .from('customers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ error: error.message });
  }
}