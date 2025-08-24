import { supabaseAdmin } from './src/config/supabaseClient.js';

async function addSampleData() {
  try {
    // First check if we have any customers
    const { data: existingCustomers, error: checkError } = await supabaseAdmin
      .from('customers')
      .select('id')
      .limit(1);

    if (checkError) {
      console.error('Error checking customers:', checkError);
      return;
    }

    // If no customers, add some sample ones
    if (!existingCustomers || existingCustomers.length === 0) {
      console.log('Adding sample customers...');
      
      const sampleCustomers = [
        {
          email: 'john.doe@example.com',
          full_name: 'John Doe',
          phone: '+1234567890',
          marketing_opt_in: true,
          shipping_address: {
            street: '123 Main St',
            city: 'New York',
            state: 'NY',
            zip: '10001',
            country: 'USA'
          },
          billing_address: {
            street: '123 Main St',
            city: 'New York', 
            state: 'NY',
            zip: '10001',
            country: 'USA'
          }
        },
        {
          email: 'jane.smith@example.com',
          full_name: 'Jane Smith',
          phone: '+1987654321',
          marketing_opt_in: false,
          shipping_address: {
            street: '456 Oak Ave',
            city: 'Los Angeles',
            state: 'CA',
            zip: '90210',
            country: 'USA'
          }
        },
        {
          email: 'bob.wilson@example.com',
          full_name: 'Bob Wilson',
          phone: '+1555123456',
          marketing_opt_in: true
        }
      ];

      const { data: customers, error: customerError } = await supabaseAdmin
        .from('customers')
        .insert(sampleCustomers)
        .select();

      if (customerError) {
        console.error('Error adding customers:', customerError);
        return;
      }

      console.log('Added customers:', customers);

      // Add some sample orders
      if (customers && customers.length > 0) {
        console.log('Adding sample orders...');
        
        const sampleOrders = [
          {
            customer_id: customers[0].id,
            status: 'completed',
            payment_status: 'paid',
            payment_method: 'Credit Card',
            subtotal_cents: 2999,
            tax_cents: 240,
            shipping_cents: 500,
            total_cents: 3739,
            shipping_address: customers[0].shipping_address,
            billing_address: customers[0].billing_address
          },
          {
            customer_id: customers[0].id,
            status: 'pending',
            payment_status: 'pending',
            payment_method: 'PayPal',
            subtotal_cents: 1599,
            tax_cents: 128,
            shipping_cents: 500,
            total_cents: 2227
          },
          {
            customer_id: customers[1].id,
            status: 'completed',
            payment_status: 'paid',
            payment_method: 'Debit Card',
            subtotal_cents: 4500,
            tax_cents: 360,
            shipping_cents: 500,
            total_cents: 5360,
            shipping_address: customers[1].shipping_address
          }
        ];

        const { data: orders, error: orderError } = await supabaseAdmin
          .from('orders')
          .insert(sampleOrders)
          .select();

        if (orderError) {
          console.error('Error adding orders:', orderError);
        } else {
          console.log('Added orders:', orders);
        }
      }
    } else {
      console.log('Customers already exist, skipping sample data');
    }

    console.log('Sample data setup complete!');
  } catch (err) {
    console.error('Error:', err);
  }
}

addSampleData();
