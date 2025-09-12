import { supabaseAdmin } from './src/config/supabaseClient.js';

console.log('Creating sample analytics data...');

try {
  // First, let's check if we have any customers
  const { data: customers, error: custError } = await supabaseAdmin
    .from('customers')
    .select('id')
    .limit(1);
    
  if (custError) {
    console.error('Error fetching customers:', custError);
    process.exit(1);
  }
  
  if (!customers || customers.length === 0) {
    console.log('Creating a sample customer...');
    const { data: newCustomer, error: newCustError } = await supabaseAdmin
      .from('customers')
      .insert({
        email: 'test@example.com',
        name: 'Test Customer'
      })
      .select('id')
      .single();
      
    if (newCustError) {
      console.error('Error creating customer:', newCustError);
      process.exit(1);
    }
    customers.push(newCustomer);
  }
  
  const customerId = customers[0].id;
  console.log('Using customer ID:', customerId);
  
  // Get some products
  const { data: products, error: prodError } = await supabaseAdmin
    .from('products')
    .select('id, title, price_cents')
    .limit(5);
    
  if (prodError || !products || products.length === 0) {
    console.error('No products found. Please create some products first.');
    process.exit(1);
  }
  
  console.log(`Found ${products.length} products`);
  
  // Create sample orders for the last 30 days
  const orders = [];
  const orderItems = [];
  
  for (let i = 0; i < 15; i++) {
    const orderDate = new Date();
    orderDate.setDate(orderDate.getDate() - Math.floor(Math.random() * 30));
    
    const selectedProducts = products.slice(0, Math.floor(Math.random() * 3) + 1);
    const totalCents = selectedProducts.reduce((sum, product) => {
      const quantity = Math.floor(Math.random() * 3) + 1;
      return sum + (product.price_cents * quantity);
    }, 0);
    
    const order = {
      customer_id: customerId,
      status: Math.random() > 0.2 ? 'completed' : (Math.random() > 0.5 ? 'pending' : 'cancelled'),
      total_cents: totalCents,
      subtotal_cents: totalCents,
      tax_cents: 0,
      shipping_cents: 0,
      discount_cents: 0,
      currency: 'INR',
      created_at: orderDate.toISOString()
    };
    
    orders.push(order);
  }
  
  console.log(`Creating ${orders.length} sample orders...`);
  
  const { data: createdOrders, error: orderError } = await supabaseAdmin
    .from('orders')
    .insert(orders)
    .select('id, total_cents');
    
  if (orderError) {
    console.error('Error creating orders:', orderError);
    process.exit(1);
  }
  
  console.log(`Created ${createdOrders.length} orders`);
  
  // Create order items for each order
  for (let i = 0; i < createdOrders.length; i++) {
    const order = createdOrders[i];
    const selectedProducts = products.slice(0, Math.floor(Math.random() * 3) + 1);
    
    for (const product of selectedProducts) {
      const quantity = Math.floor(Math.random() * 3) + 1;
      orderItems.push({
        order_id: order.id,
        product_id: product.id,
        title: product.title,
        quantity: quantity,
        unit_price_cents: product.price_cents,
        total_cents: quantity * product.price_cents
      });
    }
  }
  
  if (orderItems.length > 0) {
    console.log(`Creating ${orderItems.length} order items...`);
    const { error: itemError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItems);
      
    if (itemError) {
      console.error('Error creating order items:', itemError);
    } else {
      console.log('Order items created successfully');
    }
  }
  
  console.log('✅ Sample analytics data created successfully!');
  console.log('📊 You can now test the analytics dashboard');
  
} catch (error) {
  console.error('Failed to create sample data:', error);
  process.exit(1);
}
