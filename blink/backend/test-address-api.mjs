import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3001/api';

const testAddressAPI = async () => {
  try {
    console.log('Testing Address API endpoints...\n');
    
    // You'll need to replace this with an actual customer ID from your database
    const testCustomerId = 'test-customer-id'; // Replace with real UUID
    
    console.log('1. Testing GET /api/addresses/customer/:customer_id');
    const response = await fetch(`${API_BASE}/addresses/customer/${testCustomerId}`);
    console.log('Status:', response.status);
    if (response.ok) {
      const addresses = await response.json();
      console.log('Addresses found:', addresses.length);
    } else {
      console.log('Error:', await response.text());
    }
    
    console.log('\n2. Testing POST /api/addresses/customer/:customer_id');
    const newAddress = {
      type: 'shipping',
      is_default: true,
      full_name: 'John Doe',
      phone: '+91 9876543210',
      address_line_1: '123 Main Street',
      address_line_2: 'Apartment 4B',
      city: 'Mumbai',
      state: 'Maharashtra',
      postal_code: '400001',
      country: 'India',
      landmark: 'Near Central Mall'
    };
    
    const createResponse = await fetch(`${API_BASE}/addresses/customer/${testCustomerId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAddress)
    });
    
    console.log('Create Status:', createResponse.status);
    if (createResponse.ok) {
      const createdAddress = await createResponse.json();
      console.log('Address created with ID:', createdAddress.id);
    } else {
      console.log('Create Error:', await createResponse.text());
    }
    
    console.log('\nAPI endpoints are ready!');
    console.log('\nAvailable endpoints:');
    console.log('GET /api/addresses/customer/:customer_id');
    console.log('GET /api/addresses/:id');
    console.log('POST /api/addresses/customer/:customer_id');
    console.log('PUT /api/addresses/:id');
    console.log('DELETE /api/addresses/:id');
    console.log('PATCH /api/addresses/:id/default');
    
  } catch (error) {
    console.error('Error testing API:', error.message);
    console.log('\nMake sure the server is running on http://localhost:3001');
  }
};

// Example address object for frontend integration
const exampleAddressObject = {
  type: 'shipping', // 'shipping', 'billing', or 'both'
  is_default: true,
  full_name: 'John Doe',
  phone: '+91 9876543210',
  address_line_1: '123 Main Street',
  address_line_2: 'Apartment 4B', // optional
  city: 'Mumbai',
  state: 'Maharashtra',
  postal_code: '400001',
  country: 'India', // defaults to 'India'
  landmark: 'Near Central Mall' // optional
};

console.log('Example address object for frontend:');
console.log(JSON.stringify(exampleAddressObject, null, 2));
console.log('\n');

testAddressAPI();
