import { supabaseAdmin } from '../config/supabaseClient.js';
import { nanoid } from 'nanoid';

export async function getMe(req, res) {
  if (!req.session?.user) return res.status(401).json({ error: 'Login required' });
  const userId = req.session.user.id;
  const { data, error } = await supabaseAdmin
    .from('customers')
    .select('*')
    .eq('auth_user_id', userId)
    .single();
  if (error) return res.status(404).json({ error: 'Customer record not found' });
  // If avatar_url stores an object path (no http), generate a signed URL on the fly
  try {
    const bucket = process.env.PRODUCT_IMAGES_BUCKET;
    if (data?.avatar_url && !data.avatar_url.startsWith('http') && bucket) {
      const { data: signed } = await supabaseAdmin.storage.from(bucket).createSignedUrl(data.avatar_url, 60 * 60);
      data.avatar_url = signed?.signedUrl || null;
    }
  } catch (e) {
    // non-fatal: return the record without signed url
  }
  res.json(data);
}

export async function updateMe(req, res) {
  if (!req.session?.user) return res.status(401).json({ error: 'Login required' });
  const userId = req.session.user.id;
  const patch = req.body || {};
  // prevent changing auth_user_id or email via this endpoint
  delete patch.auth_user_id;
  delete patch.email;

  const { data, error } = await supabaseAdmin
    .from('customers')
    .update(patch)
    .eq('auth_user_id', userId)
    .select('*')
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

export async function uploadAvatar(req, res) {
  if (!req.session?.user) return res.status(401).json({ error: 'Login required' });
  const userId = req.session.user.id;
  if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'No file uploaded' });
  const file = req.files[0];
  const ext = (file.originalname.split('.').pop() || 'png').toLowerCase();
  const filename = `${userId}/${nanoid(8)}.${ext}`;
  const bucket = process.env.PRODUCT_IMAGES_BUCKET;
  const { error: uErr } = await supabaseAdmin.storage
    .from(bucket)
    .upload(filename, file.buffer, { contentType: file.mimetype, upsert: false });
  if (uErr) return res.status(400).json({ error: uErr.message });

  // store the object path in the DB (so we can generate signed urls on demand)
  await supabaseAdmin.from('customers').update({ avatar_url: filename }).eq('auth_user_id', userId);

  // return a signed URL for immediate use
  const { data: signed } = await supabaseAdmin.storage.from(bucket).createSignedUrl(filename, 60 * 60);
  const avatarUrl = signed?.signedUrl || null;
  res.json({ avatar_url: avatarUrl, path: filename });
}

export async function deleteMe(req, res) {
  if (!req.session?.user) return res.status(401).json({ error: 'Login required' });
  const userId = req.session.user.id;
  // soft-delete: set deleted_at and anonymize email/full_name
  const anonEmail = `deleted+${userId}@example.invalid`;
  // optionally remove avatar object from storage if we stored a path
  try {
    const { data: customer } = await supabaseAdmin.from('customers').select('avatar_url').eq('auth_user_id', userId).single();
    const bucket = process.env.PRODUCT_IMAGES_BUCKET;
    if (customer?.avatar_url && bucket && !customer.avatar_url.startsWith('http')) {
      await supabaseAdmin.storage.from(bucket).remove([customer.avatar_url]);
    }
  } catch (e) {
    // ignore cleanup errors
  }

  const { data, error } = await supabaseAdmin
    .from('customers')
    .update({ deleted_at: new Date().toISOString(), email: anonEmail, full_name: null, phone: null, bio: null, marketing_opt_in: false, avatar_url: null })
    .eq('auth_user_id', userId)
    .select('*')
    .single();
  if (error) return res.status(400).json({ error: error.message });
  // clear session
  req.session.destroy(() => {});
  res.json({ deleted: true });
}

// Admin functions
export async function listCustomers(req, res) {
  if (!req.session?.user || req.session.user.id !== process.env.ADMIN_ID)
    return res.status(403).json({ error: 'Admin only' });

  try {
    // Get all customers
    const { data: allCustomers, error: allError } = await supabaseAdmin
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (allError) throw allError;

    // Customer tier calculation function
    const calculateCustomerTier = (totalSpent, orderCount) => {
      const spentInRupees = totalSpent / 100; // Convert from cents to rupees
      
      if (spentInRupees >= 100000 || orderCount >= 50) {
        return { name: 'Platinum', color: 'text-purple-600', bgColor: 'bg-purple-100' };
      } else if (spentInRupees >= 50000 || orderCount >= 25) {
        return { name: 'Gold', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
      } else if (spentInRupees >= 20000 || orderCount >= 10) {
        return { name: 'Silver', color: 'text-gray-600', bgColor: 'bg-gray-100' };
      } else if (spentInRupees >= 5000 || orderCount >= 3) {
        return { name: 'Bronze', color: 'text-orange-600', bgColor: 'bg-orange-100' };
      } else {
        return { name: 'New', color: 'text-blue-600', bgColor: 'bg-blue-100' };
      }
    };

    // Get order statistics for each customer
    const customerStats = {};
    
    for (const customer of allCustomers) {
      const { data: orders, error: ordersError } = await supabaseAdmin
        .from('orders')
        .select('id, total_cents, status, created_at')
        .eq('customer_id', customer.id);

      if (!ordersError && orders) {
        const orderCount = orders.length;
        const totalSpent = orders.reduce((sum, order) => sum + (order.total_cents || 0), 0);
        const tier = calculateCustomerTier(totalSpent, orderCount);
        
        customerStats[customer.id] = {
          ...customer,
          order_count: orderCount,
          total_spent: totalSpent,
          last_order_date: orders.length > 0 ? orders[0].created_at : null,
          tier: tier
        };
      } else {
        const tier = calculateCustomerTier(0, 0);
        customerStats[customer.id] = {
          ...customer,
          order_count: 0,
          total_spent: 0,
          last_order_date: null,
          tier: tier
        };
      }
    }

    const processedCustomers = Object.values(customerStats);
    res.json(processedCustomers);
  } catch (error) {
    console.error('List customers error:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function getCustomerDetails(req, res) {
  if (!req.session?.user || req.session.user.id !== process.env.ADMIN_ID)
    return res.status(403).json({ error: 'Admin only' });

  try {
    const { id } = req.params;

    // Get customer basic info
    const { data: customer, error: customerError } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    if (customerError) throw customerError;

    // Get customer orders
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('customer_id', id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (ordersError) throw ordersError;

    // Get customer addresses (check if customer has address fields)
    const addresses = [];
    if (customer.shipping_address || customer.billing_address) {
      if (customer.shipping_address) {
        addresses.push({
          type: 'shipping',
          address: customer.shipping_address
        });
      }
      if (customer.billing_address) {
        addresses.push({
          type: 'billing', 
          address: customer.billing_address
        });
      }
    }

    // Calculate totals and tier
    const orderCount = orders.length;
    const totalSpent = orders.reduce((sum, order) => sum + (order.total_cents || 0), 0);
    
    // Customer tier calculation
    const calculateCustomerTier = (totalSpent, orderCount) => {
      const spentInRupees = totalSpent / 100;
      
      if (spentInRupees >= 100000 || orderCount >= 50) {
        return { name: 'Platinum', color: 'text-purple-600', bgColor: 'bg-purple-100' };
      } else if (spentInRupees >= 50000 || orderCount >= 25) {
        return { name: 'Gold', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
      } else if (spentInRupees >= 20000 || orderCount >= 10) {
        return { name: 'Silver', color: 'text-gray-600', bgColor: 'bg-gray-100' };
      } else if (spentInRupees >= 5000 || orderCount >= 3) {
        return { name: 'Bronze', color: 'text-orange-600', bgColor: 'bg-orange-100' };
      } else {
        return { name: 'New', color: 'text-blue-600', bgColor: 'bg-blue-100' };
      }
    };
    
    const tier = calculateCustomerTier(totalSpent, orderCount);

    const customerDetails = {
      ...customer,
      order_count: orderCount,
      total_spent: totalSpent,
      recent_orders: orders,
      addresses: addresses,
      tier: tier
    };

    res.json(customerDetails);
  } catch (error) {
    console.error('Get customer details error:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function updateCustomerAdmin(req, res) {
  if (!req.session?.user || req.session.user.id !== process.env.ADMIN_ID)
    return res.status(403).json({ error: 'Admin only' });

  try {
    const { id } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated
    delete updates.id;
    delete updates.auth_user_id;
    delete updates.created_at;

    const { data, error } = await supabaseAdmin
      .from('customers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ error: error.message });
  }
}
