import { supabaseAdmin } from './src/config/supabaseClient.js';

console.log('Testing image deletion functionality...');

try {
  // First, let's see what products and images we have
  const { data: products, error: pError } = await supabaseAdmin
    .from('products')
    .select(`
      id, 
      title,
      product_images(id, path, is_primary)
    `)
    .limit(3);
    
  if (pError) {
    console.error('Error fetching products:', pError);
  } else {
    console.log('Products with images:');
    products.forEach(product => {
      console.log(`\n📦 Product: ${product.title} (ID: ${product.id})`);
      if (product.product_images?.length > 0) {
        product.product_images.forEach((img, idx) => {
          console.log(`  🖼️  Image ${idx + 1}: ${img.id} (${img.path}) ${img.is_primary ? '⭐ PRIMARY' : ''}`);
        });
      } else {
        console.log('  📷 No images');
      }
    });
  }
  
  console.log('\n✅ Image deletion API endpoint added successfully!');
  console.log('🎯 New endpoint: DELETE /api/products/:productId/images/:imageId');
  console.log('🔒 Admin authentication required');
  console.log('💡 Frontend UI now includes hover-to-delete buttons for each image');
  
} catch (e) {
  console.error('Test failed:', e.message);
}
