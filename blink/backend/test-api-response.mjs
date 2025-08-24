// Test the getProduct API endpoint to see if it returns image IDs

console.log('Testing getProduct API endpoint...');

const API_BASE = 'http://localhost:3001';
const productId = 'c7a143df-6cf4-48f3-b575-cd6d2a312784'; // From our test data

try {
  const response = await fetch(`${API_BASE}/api/products/${productId}`, {
    credentials: 'include'
  });
  
  if (response.ok) {
    const data = await response.json();
    console.log('\n📦 Product data received:');
    console.log('Product title:', data.title);
    console.log('Product images count:', data.product_images?.length || 0);
    
    if (data.product_images?.length > 0) {
      console.log('\n🖼️ Image details:');
      data.product_images.forEach((img, idx) => {
        console.log(`Image ${idx + 1}:`, {
          id: img.id,
          path: img.path,
          is_primary: img.is_primary,
          url: img.url ? 'URL provided' : 'No URL'
        });
      });
    }
  } else {
    console.error('API request failed:', response.status, response.statusText);
  }
} catch (error) {
  console.error('Error testing API:', error.message);
}
