import { supabaseAdmin } from '../config/supabaseClient.js';
import { nanoid } from 'nanoid';

export async function listProducts(_req, res) {
  console.log('listProducts: Starting product fetch...');
  
  try {
    // Get products without relations first - much more reliable
    const { data: products, error: productsError } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (productsError) {
      console.error('listProducts: Error fetching products:', productsError);
      return res.status(500).json({ 
        error: 'Failed to fetch products',
        details: productsError.message,
        code: productsError.code
      });
    }

    if (!products || !Array.isArray(products)) {
      console.log('listProducts: No products found');
      return res.json([]);
    }

    console.log(`listProducts: Successfully fetched ${products.length} products`);

    // Get all product images in one query
    const productIds = products.map(p => p.id);
    const { data: allImages, error: imagesError } = await supabaseAdmin
      .from('product_images')
      .select('id, product_id, path, is_primary')
      .in('product_id', productIds);

    if (imagesError) {
      console.error('listProducts: Error fetching images:', imagesError);
    }

    // Get all categories in one query
    const categoryIds = [...new Set(products.map(p => p.category_id).filter(Boolean))];
    let allCategories = [];
    if (categoryIds.length > 0) {
      const { data: categories, error: categoriesError } = await supabaseAdmin
        .from('categories')
        .select('id, name, slug')
        .in('id', categoryIds);

      if (categoriesError) {
        console.error('listProducts: Error fetching categories:', categoriesError);
      } else {
        allCategories = categories || [];
      }
    }

    // Create lookup maps for better performance
    const imagesByProductId = {};
    (allImages || []).forEach(img => {
      if (!imagesByProductId[img.product_id]) {
        imagesByProductId[img.product_id] = [];
      }
      imagesByProductId[img.product_id].push(img);
    });

    const categoriesById = {};
    allCategories.forEach(cat => {
      categoriesById[cat.id] = cat;
    });

    // Process all products
    const enriched = await Promise.all(products.map(async (product) => {
      try {
        const productImages = imagesByProductId[product.id] || [];
        const category = categoriesById[product.category_id] || null;

        // Basic product data
        const productData = {
          ...product,
          product_images: productImages,
          price: product.price_cents ? (product.price_cents / 100) : 0,
          formatted_price: product.price_cents ? `₹${(product.price_cents / 100).toFixed(2)}` : '₹0.00',
          category: category,
          categories: category, // For backward compatibility
          is_active: product.is_active ?? true,
          image_url: null
        };

        // Get signed URL for primary image
        const primary = productImages.find(i => i.is_primary) || productImages[0];
        if (primary?.path && process.env.PRODUCT_IMAGES_BUCKET) {
          try {
            const { data: signed, error: signedError } = await supabaseAdmin.storage
              .from(process.env.PRODUCT_IMAGES_BUCKET)
              .createSignedUrl(primary.path, 600);

            if (!signedError && signed?.signedUrl) {
              productData.image_url = signed.signedUrl;
            }
          } catch (signedUrlError) {
            console.error(`listProducts: Error getting signed URL for product ${product.id}:`, signedUrlError);
          }
        }

        return productData;
      } catch (productError) {
        console.error(`listProducts: Error processing product ${product.id}:`, productError);
        // Return basic product data without image on error
        return {
          ...product,
          image_url: null,
          product_images: [],
          price: product.price_cents ? (product.price_cents / 100) : 0,
          formatted_price: product.price_cents ? `₹${(product.price_cents / 100).toFixed(2)}` : '₹0.00',
          category: null,
          categories: null,
          is_active: product.is_active ?? true
        };
      }
    }));

    console.log(`listProducts: Successfully processed ${enriched.length} products`);
    res.json(enriched);
    
  } catch (error) {
    console.error('listProducts: Unhandled error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

export async function getProduct(req, res) {
  const { id } = req.params;
  
  try {
    console.log(`getProduct: Fetching product with ID: ${id}`);
    
    // First, get the product without relations
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
    
    if (productError) {
      console.error(`getProduct: Error fetching product ${id}:`, productError);
      return res.status(404).json({ 
        error: 'Product not found', 
        details: productError.message 
      });
    }

    if (!product) {
      console.log(`getProduct: No product found with ID: ${id}`);
      return res.status(404).json({ error: 'Product not found' });
    }

    console.log(`getProduct: Successfully found product: ${product.title}`);
    
    // Separately fetch product images
    const { data: images, error: imagesError } = await supabaseAdmin
      .from('product_images')
      .select('id, path, is_primary')
      .eq('product_id', id);

    if (imagesError) {
      console.error(`getProduct: Error fetching images for product ${id}:`, imagesError);
      // Continue without images rather than failing
    }

    // Separately fetch category
    let category = null;
    if (product.category_id) {
      const { data: categoryData, error: categoryError } = await supabaseAdmin
        .from('categories')
        .select('id, name, slug')
        .eq('id', product.category_id)
        .single();
      
      if (categoryError) {
        console.error(`getProduct: Error fetching category for product ${id}:`, categoryError);
        // Continue without category rather than failing
      } else {
        category = categoryData;
      }
    }
    
    // Generate signed URLs for all product images
    const withUrls = await Promise.all((images || []).map(async (img) => {
      try {
        if (!process.env.PRODUCT_IMAGES_BUCKET) {
          console.warn('getProduct: PRODUCT_IMAGES_BUCKET not set');
          return { ...img, url: null };
        }

        const { data: signed, error: signedError } = await supabaseAdmin.storage
          .from(process.env.PRODUCT_IMAGES_BUCKET)
          .createSignedUrl(img.path, 600);
        
        if (signedError) {
          console.error(`getProduct: Error generating signed URL for image ${img.id}:`, signedError);
          return { ...img, url: null };
        }
        
        return { ...img, url: signed?.signedUrl || null };
      } catch (urlError) {
        console.error(`getProduct: Exception generating signed URL for image ${img.id}:`, urlError);
        return { ...img, url: null };
      }
    }));
    
    // Find primary image and create image_url field
    const primary = (withUrls || []).find(i => i.is_primary) || withUrls?.[0];
    let image_url = null;
    
    if (primary && primary.url) {
      image_url = primary.url;
    }
    
    const enrichedProduct = {
      ...product,
      product_images: withUrls || [],
      image_url,
      price: product.price_cents ? (product.price_cents / 100) : 0,
      formatted_price: product.price_cents ? `₹${(product.price_cents / 100).toFixed(2)}` : '₹0.00',
      category: category,
      categories: category, // For backward compatibility
      is_active: product.is_active ?? true
    };
    
    console.log(`getProduct: Successfully enriched product data`);
    res.json(enrichedProduct);
    
  } catch (error) {
    console.error(`getProduct: Unhandled error for product ${id}:`, error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

export async function createProduct(req, res) {
  // Check JWT authentication - user should be set by middleware
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    const { 
      title, 
      slug, 
      description, 
      price_cents, 
      currency = 'INR', 
      category_id, 
      stock_quantity = 0, 
      is_active = true,
      discount_percent = 0
    } = req.body;

    const { data: product, error: pErr } = await supabaseAdmin
      .from('products')
      .insert({ 
        title, 
        slug, 
        description, 
        price_cents: Number(price_cents), 
        currency, 
        category_id: category_id || null, 
        stock_quantity: Number(stock_quantity), 
        is_active,
        discount_percent: Number(discount_percent)
      })
      .select('*')
      .single();
    if (pErr) return res.status(400).json({ error: pErr.message });

    const rows = [];
    for (const [idx, file] of (req.files || []).entries()) {
      const ext = (file.originalname.split('.').pop() || 'jpg').toLowerCase();
      const path = `${product.id}/${nanoid(8)}.${ext}`;
      const { error: uErr } = await supabaseAdmin.storage
        .from(process.env.PRODUCT_IMAGES_BUCKET)
        .upload(path, file.buffer, { contentType: file.mimetype, upsert: false });
      if (uErr) return res.status(400).json({ error: uErr.message });
      rows.push({ product_id: product.id, path, is_primary: idx === 0 });
    }
    if (rows.length) await supabaseAdmin.from('product_images').insert(rows);

    res.status(201).json(product);
  } catch (e) { 
    console.error('Create product error:', e);
    res.status(500).json({ error: e.message }); 
  }
}

export async function updateProduct(req, res) {
  // Check JWT authentication - user should be set by middleware
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { id } = req.params;
  const patch = req.body;
  if ('price_cents' in patch) patch.price_cents = Number(patch.price_cents);
  if ('stock_quantity' in patch) patch.stock_quantity = Number(patch.stock_quantity);
  if ('discount_percent' in patch) patch.discount_percent = Number(patch.discount_percent);
  
  const { data, error } = await supabaseAdmin
    .from('products')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

export async function deleteProduct(req, res) {
  // Check JWT authentication - user should be set by middleware
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { id } = req.params;
  const { force } = req.query; // Optional force parameter to remove from carts

  try {
    // First check if the product is in any carts
    const { data: cartItems, error: cartError } = await supabaseAdmin
      .from('cart_items')
      .select('id, cart_id')
      .eq('product_id', id);

    if (cartError) {
      return res.status(500).json({ error: 'Error checking cart items' });
    }

    if (cartItems && cartItems.length > 0) {
      if (!force) {
        // If product is in carts and force is false, return error with count
        return res.status(400).json({ 
          error: 'Product is in active carts',
          message: `This product is in ${cartItems.length} active cart(s). Remove it from carts first or use force=true to automatically remove it.`,
          cartCount: cartItems.length
        });
      }

      // If force is true, remove from all carts first
      const { error: removeError } = await supabaseAdmin
        .from('cart_items')
        .delete()
        .eq('product_id', id);

      if (removeError) {
        return res.status(500).json({ 
          error: 'Failed to remove product from carts',
          details: removeError.message 
        });
      }
    }

    // Delete product images from storage
    const { data: imgs } = await supabaseAdmin
      .from('product_images')
      .select('path')
      .eq('product_id', id);

    if (imgs?.length) {
      await supabaseAdmin.storage
        .from(process.env.PRODUCT_IMAGES_BUCKET)
        .remove(imgs.map(i => i.path));
    }

    // Finally delete the product
    const { error } = await supabaseAdmin
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ 
      message: 'Product deleted successfully',
      removedFromCarts: cartItems?.length || 0
    });
  } catch (error) {
    console.error('Error in deleteProduct:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function addImages(req, res) {
  // Check JWT authentication - user should be set by middleware
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { id } = req.params;
  const { replace } = req.query; // check if we should replace existing images
  
  // If replace=true, delete existing images first
  if (replace === 'true') {
    console.log('[addImages] replace=true, deleting existing images for product', id);
    const { data: existingImages } = await supabaseAdmin
      .from('product_images')
      .select('path')
      .eq('product_id', id);
    console.log('[addImages] found existing images:', existingImages?.length);
    if (existingImages?.length) {
      // Delete from storage
      const storageRes = await supabaseAdmin.storage
        .from(process.env.PRODUCT_IMAGES_BUCKET)
        .remove(existingImages.map(img => img.path));
      console.log('[addImages] storage delete result:', storageRes);
      // Delete from database
      const dbRes = await supabaseAdmin
        .from('product_images')
        .delete()
        .eq('product_id', id);
      console.log('[addImages] db delete result:', dbRes);
    }
  }

  const rows = [];
  for (const [idx, file] of (req.files || []).entries()) {
    const ext = (file.originalname.split('.').pop() || 'jpg').toLowerCase();
    const path = `${id}/${nanoid(8)}.${ext}`;
    console.log('[addImages] uploading image', { idx, path });
    const { error: uErr } = await supabaseAdmin.storage
      .from(process.env.PRODUCT_IMAGES_BUCKET)
      .upload(path, file.buffer, { contentType: file.mimetype, upsert: false });
    if (uErr) {
      console.error('[addImages] upload error', uErr);
      return res.status(400).json({ error: uErr.message });
    }
    rows.push({ product_id: id, path, is_primary: idx === 0 }); // first image is primary
  }
  console.log('[addImages] inserting product_images rows:', rows.length);
  if (rows.length) await supabaseAdmin.from('product_images').insert(rows);
  res.json({ uploaded: rows.length, replaced: replace === 'true' });
}

export async function deleteImage(req, res) {
  // Check JWT authentication - user should be set by middleware
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { productId, imageId } = req.params;
  
  try {
    // Get the image path first
    const { data: image, error: fetchError } = await supabaseAdmin
      .from('product_images')
      .select('path, is_primary')
      .eq('id', imageId)
      .eq('product_id', productId)
      .single();
    
    if (fetchError || !image) {
      return res.status(404).json({ error: 'Image not found' });
    }
    
    // Delete from storage
    const { error: storageError } = await supabaseAdmin.storage
      .from(process.env.PRODUCT_IMAGES_BUCKET)
      .remove([image.path]);
    
    if (storageError) {
      console.error('Storage deletion error:', storageError);
      return res.status(400).json({ error: 'Failed to delete image from storage' });
    }
    
    // Delete from database
    const { error: dbError } = await supabaseAdmin
      .from('product_images')
      .delete()
      .eq('id', imageId)
      .eq('product_id', productId);
    
    if (dbError) {
      console.error('Database deletion error:', dbError);
      return res.status(400).json({ error: 'Failed to delete image from database' });
    }
    
    // If we deleted the primary image, make another image primary
    if (image.is_primary) {
      const { data: remainingImages } = await supabaseAdmin
        .from('product_images')
        .select('id')
        .eq('product_id', productId)
        .limit(1);
      
      if (remainingImages?.length > 0) {
        await supabaseAdmin
          .from('product_images')
          .update({ is_primary: true })
          .eq('id', remainingImages[0].id);
      }
    }
    
    res.json({ deleted: true, was_primary: image.is_primary });
  } catch (e) {
    console.error('Error deleting image:', e);
    res.status(500).json({ error: e.message });
  }
}

export async function searchProducts(req, res) {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length === 0) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const searchTerm = q.trim();
    console.log(`Searching for: "${searchTerm}"`);
    
    // First try exact matching with ILIKE
    const { data, error } = await supabaseAdmin
      .from('products')
      .select(`
        *, 
        product_images(id, path, is_primary),
        categories(id, name, slug)
      `)
      .eq('is_active', true)
      .ilike('title', `%${searchTerm}%`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Search error:', error);
      return res.status(400).json({ error: error.message });
    }

    let results = data || [];
    console.log(`Found ${results.length} exact matches`);
    
    // If no exact matches, try fuzzy matching
    if (results.length === 0) {
      console.log('No exact matches, trying fuzzy search...');
      // Try variations for fuzzy matching
      const fuzzySearches = [];
      const words = searchTerm.split(' ').filter(word => word.length > 1);
      for (const word of words) {
        // Try partial matches
        if (word.length >= 3) {
          // Missing first character: "bad" -> "ad"
          fuzzySearches.push(
            supabaseAdmin
              .from('products')
              .select(`*, product_images(id, path, is_primary), categories(id, name, slug)`)
              .eq('is_active', true)
              .ilike('title', `%${word.substring(1)}%`)
          );
          // Missing last character: "bad" -> "ba"
          fuzzySearches.push(
            supabaseAdmin
              .from('products')
              .select(`*, product_images(id, path, is_primary), categories(id, name, slug)`)
              .eq('is_active', true)
              .ilike('title', `%${word.substring(0, word.length-1)}%`)
          );
        }
        // Try individual character wildcards: "bad" -> "b_d", "_ad", "ba_"
        for (let i = 0; i < word.length; i++) {
          const pattern = word.substring(0, i) + '_' + word.substring(i + 1);
          fuzzySearches.push(
            supabaseAdmin
              .from('products')
              .select(`*, product_images(id, path, is_primary), categories(id, name, slug)`)
              .eq('is_active', true)
              .ilike('title', `%${pattern}%`)
          );
        }
      }
      // Execute fuzzy searches and combine results
      if (fuzzySearches.length > 0) {
        const fuzzyResults = await Promise.all(fuzzySearches);
        const allFuzzyData = [];
        
        for (const result of fuzzyResults) {
          if (!result.error && result.data) {
            allFuzzyData.push(...result.data);
          }
        }
        
        // Remove duplicates by ID
        const uniqueResults = allFuzzyData.filter((product, index, self) => 
          index === self.findIndex(p => p.id === product.id)
        );
        
        results = uniqueResults.slice(0, 20); // Limit to 20 results
        console.log(`Found ${results.length} fuzzy matches`);
      }
    }

    // Generate signed URLs for product images
    const enriched = await Promise.all(results.map(async (product) => {
      const primary = (product.product_images || []).find(i => i.is_primary) || product.product_images?.[0];
      let image_url = null;
      
      if (primary) {
        const { data: signed } = await supabaseAdmin.storage
          .from(process.env.PRODUCT_IMAGES_BUCKET)
          .createSignedUrl(primary.path, 600);
        image_url = signed?.signedUrl || null;
      }
      
      return { 
        ...product, 
        image_url,
        price: product.price_cents ? (product.price_cents / 100) : 0,
        discount: product.discount_percent || 0
      };
    }));

    console.log(`Returning ${enriched.length} search results`);
    res.json(enriched);
    
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}