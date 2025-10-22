import { supabaseAdmin } from "../config/supabaseClient.js";
import { nanoid } from "nanoid";

export async function listProducts(_req, res) {
  console.log("listProducts: Starting product fetch...");

  try {
    // Get products without relations first - much more reliable
    const { data: products, error: productsError } = await supabaseAdmin
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (productsError) {
      console.error("listProducts: Error fetching products:", productsError);
      return res.status(500).json({
        error: "Failed to fetch products",
        details: productsError.message,
        code: productsError.code,
      });
    }

    if (!products || !Array.isArray(products)) {
      console.log("listProducts: No products found");
      return res.json([]);
    }

    console.log(
      `listProducts: Successfully fetched ${products.length} products`,
    );

    // Get all product images in one query
    const productIds = products.map((p) => p.id);
    const { data: allImages, error: imagesError } = await supabaseAdmin
      .from("product_images")
      .select("id, product_id, path, is_primary")
      .in("product_id", productIds);

    if (imagesError) {
      console.error("listProducts: Error fetching images:", imagesError);
    }

    // Get all categories in one query
    const categoryIds = [
      ...new Set(products.map((p) => p.category_id).filter(Boolean)),
    ];
    let allCategories = [];
    if (categoryIds.length > 0) {
      const { data: categories, error: categoriesError } = await supabaseAdmin
        .from("categories")
        .select("id, name, slug")
        .in("id", categoryIds);

      if (categoriesError) {
        console.error(
          "listProducts: Error fetching categories:",
          categoriesError,
        );
      } else {
        allCategories = categories || [];
      }
    }

    // Create lookup maps for better performance
    const imagesByProductId = {};
    (allImages || []).forEach((img) => {
      if (!imagesByProductId[img.product_id]) {
        imagesByProductId[img.product_id] = [];
      }
      imagesByProductId[img.product_id].push(img);
    });

    const categoriesById = {};
    allCategories.forEach((cat) => {
      categoriesById[cat.id] = cat;
    });

    // Process all products
    const enriched = await Promise.all(
      products.map(async (product) => {
        try {
          const productImages = imagesByProductId[product.id] || [];
          const category = categoriesById[product.category_id] || null;

          // Basic product data
          const productData = {
            ...product,
            product_images: productImages,
            price: product.price_cents ? product.price_cents / 100 : 0,
            formatted_price: product.price_cents
              ? `₹${(product.price_cents / 100).toFixed(2)}`
              : "₹0.00",
            category: category,
            categories: category, // For backward compatibility
            is_active: product.is_active ?? true,
            image_url: null,
          };

          // Get signed URL for primary image
          const primary =
            productImages.find((i) => i.is_primary) || productImages[0];
          if (primary?.path && process.env.PRODUCT_IMAGES_BUCKET) {
            try {
              const { data: signed, error: signedError } =
                await supabaseAdmin.storage
                  .from(process.env.PRODUCT_IMAGES_BUCKET)
                  .createSignedUrl(primary.path, 600);

              if (!signedError && signed?.signedUrl) {
                productData.image_url = signed.signedUrl;
              }
            } catch (signedUrlError) {
              console.error(
                `listProducts: Error getting signed URL for product ${product.id}:`,
                signedUrlError,
              );
            }
          }

          return productData;
        } catch (productError) {
          console.error(
            `listProducts: Error processing product ${product.id}:`,
            productError,
          );
          // Return basic product data without image on error
          return {
            ...product,
            image_url: null,
            product_images: [],
            price: product.price_cents ? product.price_cents / 100 : 0,
            formatted_price: product.price_cents
              ? `₹${(product.price_cents / 100).toFixed(2)}`
              : "₹0.00",
            category: null,
            categories: null,
            is_active: product.is_active ?? true,
          };
        }
      }),
    );

    console.log(
      `listProducts: Successfully processed ${enriched.length} products`,
    );
    res.json(enriched);
  } catch (error) {
    console.error("listProducts: Unhandled error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
}

export async function getProduct(req, res) {
  const { id } = req.params;

  try {
    console.log(`getProduct: Fetching product with ID: ${id}`);

    // First, get the product without relations
    const { data: product, error: productError } = await supabaseAdmin
      .from("products")
      .select("*")
      .eq("id", id)
      .single();

    if (productError) {
      console.error(`getProduct: Error fetching product ${id}:`, productError);
      return res.status(404).json({
        error: "Product not found",
        details: productError.message,
      });
    }

    if (!product) {
      console.log(`getProduct: No product found with ID: ${id}`);
      return res.status(404).json({ error: "Product not found" });
    }

    console.log(`getProduct: Successfully found product: ${product.title}`);

    // Separately fetch product images
    const { data: images, error: imagesError } = await supabaseAdmin
      .from("product_images")
      .select("id, path, is_primary")
      .eq("product_id", id);

    if (imagesError) {
      console.error(
        `getProduct: Error fetching images for product ${id}:`,
        imagesError,
      );
      // Continue without images rather than failing
    }

    // Separately fetch category
    let category = null;
    if (product.category_id) {
      const { data: categoryData, error: categoryError } = await supabaseAdmin
        .from("categories")
        .select("id, name, slug")
        .eq("id", product.category_id)
        .single();

      if (categoryError) {
        console.error(
          `getProduct: Error fetching category for product ${id}:`,
          categoryError,
        );
        // Continue without category rather than failing
      } else {
        category = categoryData;
      }
    }

    // Generate signed URLs for all product images
    const withUrls = await Promise.all(
      (images || []).map(async (img) => {
        try {
          if (!process.env.PRODUCT_IMAGES_BUCKET) {
            console.warn("getProduct: PRODUCT_IMAGES_BUCKET not set");
            return { ...img, url: null };
          }

          const { data: signed, error: signedError } =
            await supabaseAdmin.storage
              .from(process.env.PRODUCT_IMAGES_BUCKET)
              .createSignedUrl(img.path, 600);

          if (signedError) {
            console.error(
              `getProduct: Error generating signed URL for image ${img.id}:`,
              signedError,
            );
            return { ...img, url: null };
          }

          return { ...img, url: signed?.signedUrl || null };
        } catch (urlError) {
          console.error(
            `getProduct: Exception generating signed URL for image ${img.id}:`,
            urlError,
          );
          return { ...img, url: null };
        }
      }),
    );

    // Find primary image and create image_url field
    const primary = (withUrls || []).find((i) => i.is_primary) || withUrls?.[0];
    let image_url = null;

    if (primary && primary.url) {
      image_url = primary.url;
    }

    const enrichedProduct = {
      ...product,
      product_images: withUrls || [],
      image_url,
      price: product.price_cents ? product.price_cents / 100 : 0,
      formatted_price: product.price_cents
        ? `₹${(product.price_cents / 100).toFixed(2)}`
        : "₹0.00",
      category: category,
      categories: category, // For backward compatibility
      is_active: product.is_active ?? true,
    };

    console.log(`getProduct: Successfully enriched product data`);
    res.json(enrichedProduct);
  } catch (error) {
    console.error(`getProduct: Unhandled error for product ${id}:`, error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
}

export async function createProduct(req, res) {
  // Check JWT authentication - user should be set by middleware
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: "Admin access required" });
  }

  try {
    const {
      title,
      slug,
      description,
      price_cents,
      currency = "INR",
      category_id,
      stock_quantity = 0,
      is_active = true,
      discount_percent = 0,
    } = req.body;

    const { data: product, error: pErr } = await supabaseAdmin
      .from("products")
      .insert({
        title,
        slug,
        description,
        price_cents: Number(price_cents),
        currency,
        category_id: category_id || null,
        stock_quantity: Number(stock_quantity),
        is_active,
        discount_percent: Number(discount_percent),
      })
      .select("*")
      .single();
    if (pErr) return res.status(400).json({ error: pErr.message });

    const rows = [];
    for (const [idx, file] of (req.files || []).entries()) {
      const ext = (file.originalname.split(".").pop() || "jpg").toLowerCase();
      const path = `${product.id}/${nanoid(8)}.${ext}`;
      const { error: uErr } = await supabaseAdmin.storage
        .from(process.env.PRODUCT_IMAGES_BUCKET)
        .upload(path, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });
      if (uErr) return res.status(400).json({ error: uErr.message });
      rows.push({ product_id: product.id, path, is_primary: idx === 0 });
    }
    if (rows.length) await supabaseAdmin.from("product_images").insert(rows);

    res.status(201).json(product);
  } catch (e) {
    console.error("Create product error:", e);
    res.status(500).json({ error: e.message });
  }
}

export async function updateProduct(req, res) {
  // Check JWT authentication - user should be set by middleware
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: "Admin access required" });
  }

  const { id } = req.params;
  const patch = req.body;
  if ("price_cents" in patch) patch.price_cents = Number(patch.price_cents);
  if ("stock_quantity" in patch)
    patch.stock_quantity = Number(patch.stock_quantity);
  if ("discount_percent" in patch)
    patch.discount_percent = Number(patch.discount_percent);

  const { data, error } = await supabaseAdmin
    .from("products")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
}

export async function deleteProduct(req, res) {
  // Check JWT authentication - user should be set by middleware
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: "Admin access required" });
  }

  const { id } = req.params;
  const { force } = req.query; // Optional force parameter to remove from carts

  try {
    // First check if the product is in any carts
    const { data: cartItems, error: cartError } = await supabaseAdmin
      .from("cart_items")
      .select("id, cart_id")
      .eq("product_id", id);

    if (cartError) {
      return res.status(500).json({ error: "Error checking cart items" });
    }

    if (cartItems && cartItems.length > 0) {
      if (!force) {
        // If product is in carts and force is false, return error with count
        return res.status(400).json({
          error: "Product is in active carts",
          message: `This product is in ${cartItems.length} active cart(s). Remove it from carts first or use force=true to automatically remove it.`,
          cartCount: cartItems.length,
        });
      }

      // If force is true, remove from all carts first
      const { error: removeError } = await supabaseAdmin
        .from("cart_items")
        .delete()
        .eq("product_id", id);

      if (removeError) {
        return res.status(500).json({
          error: "Failed to remove product from carts",
          details: removeError.message,
        });
      }
    }

    // Delete product images from storage
    const { data: imgs } = await supabaseAdmin
      .from("product_images")
      .select("path")
      .eq("product_id", id);

    if (imgs?.length) {
      await supabaseAdmin.storage
        .from(process.env.PRODUCT_IMAGES_BUCKET)
        .remove(imgs.map((i) => i.path));
    }

    // Finally delete the product
    const { error } = await supabaseAdmin
      .from("products")
      .delete()
      .eq("id", id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      message: "Product deleted successfully",
      removedFromCarts: cartItems?.length || 0,
    });
  } catch (error) {
    console.error("Error in deleteProduct:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function addImages(req, res) {
  // Check JWT authentication - user should be set by middleware
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: "Admin access required" });
  }

  const { id } = req.params;
  const { replace } = req.query; // check if we should replace existing images

  // If replace=true, delete existing images first
  if (replace === "true") {
    console.log(
      "[addImages] replace=true, deleting existing images for product",
      id,
    );
    const { data: existingImages } = await supabaseAdmin
      .from("product_images")
      .select("path")
      .eq("product_id", id);
    console.log("[addImages] found existing images:", existingImages?.length);
    if (existingImages?.length) {
      // Delete from storage
      const storageRes = await supabaseAdmin.storage
        .from(process.env.PRODUCT_IMAGES_BUCKET)
        .remove(existingImages.map((img) => img.path));
      console.log("[addImages] storage delete result:", storageRes);
      // Delete from database
      const dbRes = await supabaseAdmin
        .from("product_images")
        .delete()
        .eq("product_id", id);
      console.log("[addImages] db delete result:", dbRes);
    }
  }

  const rows = [];
  for (const [idx, file] of (req.files || []).entries()) {
    const ext = (file.originalname.split(".").pop() || "jpg").toLowerCase();
    const path = `${id}/${nanoid(8)}.${ext}`;
    console.log("[addImages] uploading image", { idx, path });
    const { error: uErr } = await supabaseAdmin.storage
      .from(process.env.PRODUCT_IMAGES_BUCKET)
      .upload(path, file.buffer, { contentType: file.mimetype, upsert: false });
    if (uErr) {
      console.error("[addImages] upload error", uErr);
      return res.status(400).json({ error: uErr.message });
    }
    rows.push({ product_id: id, path, is_primary: idx === 0 }); // first image is primary
  }
  console.log("[addImages] inserting product_images rows:", rows.length);
  if (rows.length) await supabaseAdmin.from("product_images").insert(rows);
  res.json({ uploaded: rows.length, replaced: replace === "true" });
}

export async function deleteImage(req, res) {
  // Check JWT authentication - user should be set by middleware
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: "Admin access required" });
  }

  const { productId, imageId } = req.params;

  try {
    // Get the image path first
    const { data: image, error: fetchError } = await supabaseAdmin
      .from("product_images")
      .select("path, is_primary")
      .eq("id", imageId)
      .eq("product_id", productId)
      .single();

    if (fetchError || !image) {
      return res.status(404).json({ error: "Image not found" });
    }

    // Delete from storage
    const { error: storageError } = await supabaseAdmin.storage
      .from(process.env.PRODUCT_IMAGES_BUCKET)
      .remove([image.path]);

    if (storageError) {
      console.error("Storage deletion error:", storageError);
      return res
        .status(400)
        .json({ error: "Failed to delete image from storage" });
    }

    // Delete from database
    const { error: dbError } = await supabaseAdmin
      .from("product_images")
      .delete()
      .eq("id", imageId)
      .eq("product_id", productId);

    if (dbError) {
      console.error("Database deletion error:", dbError);
      return res
        .status(400)
        .json({ error: "Failed to delete image from database" });
    }

    // If we deleted the primary image, make another image primary
    if (image.is_primary) {
      const { data: remainingImages } = await supabaseAdmin
        .from("product_images")
        .select("id")
        .eq("product_id", productId)
        .limit(1);

      if (remainingImages?.length > 0) {
        await supabaseAdmin
          .from("product_images")
          .update({ is_primary: true })
          .eq("id", remainingImages[0].id);
      }
    }

    res.json({ deleted: true, was_primary: image.is_primary });
  } catch (e) {
    console.error("Error deleting image:", e);
    res.status(500).json({ error: e.message });
  }
}

// FIXED SEARCH FUNCTION - NO JOINS
// Helper function to calculate Levenshtein distance for spell checking
function levenshteinDistance(str1, str2) {
  const matrix = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1, // deletion
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

// Phonetic pattern replacements for sound-based matching
const phoneticPatterns = [
  // Common sound replacements
  { pattern: /ph/g, replacement: "f" },
  { pattern: /ck/g, replacement: "k" },
  { pattern: /qu/g, replacement: "kw" },
  { pattern: /x/g, replacement: "ks" },
  { pattern: /z/g, replacement: "s" },
  { pattern: /c([eiy])/g, replacement: "s$1" }, // ce, ci, cy -> se, si, sy
  { pattern: /c([aou])/g, replacement: "k$1" }, // ca, co, cu -> ka, ko, ku
  { pattern: /gh/g, replacement: "" }, // silent gh
  { pattern: /kn/g, replacement: "n" }, // silent k
  { pattern: /wr/g, replacement: "r" }, // silent w
];

// Generate phonetic variants of a word
function generatePhoneticVariants(word) {
  let variants = [word.toLowerCase()];

  // Apply phonetic transformations
  for (const { pattern, replacement } of phoneticPatterns) {
    const transformed = word.toLowerCase().replace(pattern, replacement);
    if (transformed !== word.toLowerCase()) {
      variants.push(transformed);
    }
  }

  // Generate common kid-mistake patterns
  const kidPatterns = [
    // Double letters (common in kid writing)
    (word) => word.replace(/(.)\1+/g, "$1"), // remove doubled letters
    (word) => word.replace(/([aeiou])/g, "$1$1"), // double vowels
    // Common letter swaps
    (word) => word.replace(/ei/g, "ie").replace(/ie/g, "ei"),
    (word) => word.replace(/ys/g, "s").replace(/ies/g, "s"), // toys -> tays
    (word) => word.replace(/oo/g, "u").replace(/u/g, "oo"), // book -> buk
    // Missing letters
    (word) => word.replace(/ing$/g, "in"), // running -> runnin
    (word) => word.replace(/ed$/g, "d"), // played -> playd
  ];

  kidPatterns.forEach((patternFn) => {
    try {
      const variant = patternFn(word.toLowerCase());
      if (variant !== word.toLowerCase() && !variants.includes(variant)) {
        variants.push(variant);
      }
    } catch (e) {
      // Skip if pattern fails
    }
  });

  return variants;
}

// Advanced similarity scoring
function calculateSimilarityScore(word1, word2) {
  const len1 = word1.length;
  const len2 = word2.length;

  // Exact match
  if (word1 === word2) return 1.0;

  // Length difference penalty
  const lengthDiff = Math.abs(len1 - len2);
  const maxLen = Math.max(len1, len2);
  const lengthScore = 1 - (lengthDiff / maxLen) * 0.3;

  // Levenshtein distance
  const distance = levenshteinDistance(word1, word2);
  const distanceScore = 1 - distance / maxLen;

  // Common prefix/suffix bonus
  let prefixBonus = 0;
  let suffixBonus = 0;

  // Check common prefix
  for (let i = 0; i < Math.min(len1, len2); i++) {
    if (word1[i] === word2[i]) {
      prefixBonus += 0.1;
    } else {
      break;
    }
  }

  // Check common suffix
  for (let i = 1; i <= Math.min(len1, len2); i++) {
    if (word1[len1 - i] === word2[len2 - i]) {
      suffixBonus += 0.1;
    } else {
      break;
    }
  }

  return Math.min(
    1.0,
    lengthScore * 0.3 +
      distanceScore * 0.5 +
      prefixBonus * 0.1 +
      suffixBonus * 0.1,
  );
}

// Helper function to find similar words using multiple strategies
function findSimilarWords(searchWord, wordList, maxResults = 3) {
  const suggestions = new Map();
  const lowerSearchWord = searchWord.toLowerCase();

  // Generate variants of the search word
  const searchVariants = generatePhoneticVariants(searchWord);

  for (const word of wordList) {
    const lowerWord = word.toLowerCase();
    let bestScore = 0;

    // Check direct similarity
    const directScore = calculateSimilarityScore(lowerSearchWord, lowerWord);
    bestScore = Math.max(bestScore, directScore);

    // Check against phonetic variants
    for (const variant of searchVariants) {
      const variantScore = calculateSimilarityScore(variant, lowerWord);
      bestScore = Math.max(bestScore, variantScore * 0.9); // Slight penalty for variant matches
    }

    // Check if word variants match search word
    const wordVariants = generatePhoneticVariants(word);
    for (const wordVariant of wordVariants) {
      const reverseScore = calculateSimilarityScore(
        lowerSearchWord,
        wordVariant,
      );
      bestScore = Math.max(bestScore, reverseScore * 0.9);
    }

    // Only include if score is above threshold
    if (bestScore > 0.6 && bestScore < 1.0) {
      suggestions.set(word, bestScore);
    }
  }

  // Sort by score and return top results
  return Array.from(suggestions.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxResults)
    .map(([word]) => word);
}

export async function searchProducts(req, res) {
  try {
    const { q } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({ error: "Search query is required" });
    }

    const searchTerm = q.trim();
    console.log(`Searching for: "${searchTerm}"`);

    // Get all categories and product titles for spell checking
    const { data: categoriesForSpelling } = await supabaseAdmin
      .from("categories")
      .select("name");

    const { data: productsForSpelling } = await supabaseAdmin
      .from("products")
      .select("title")
      .eq("is_active", true);

    // Create word lists for spell checking
    const categoryNames = (categoriesForSpelling || []).map((c) => c.name);
    const productTitles = (productsForSpelling || []).map((p) => p.title);
    const allWords = [
      ...categoryNames,
      ...productTitles.flatMap((title) => title.split(" ")),
      // Common product keywords
      "toys",
      "clothing",
      "shoes",
      "electronics",
      "books",
      "games",
      "sports",
      "beauty",
      "home",
      "kitchen",
    ].filter((word) => word && word.length > 2);

    // Find suggestions for misspelled words
    const searchWords = searchTerm.split(" ");
    const suggestions = [];
    let correctedSearchTerm = searchTerm;

    for (const word of searchWords) {
      if (word.length > 2) {
        const similarWords = findSimilarWords(word, allWords, 2);
        if (similarWords.length > 0) {
          suggestions.push({
            original: word,
            suggestions: similarWords,
          });

          // Use the best suggestion for automatic correction
          correctedSearchTerm = correctedSearchTerm.replace(
            word,
            similarWords[0],
          );
        }
      }
    }

    // Try original search term first
    let searchTermToUse = searchTerm;
    let didYouMean = null;

    // First search in product titles with original term
    const { data: products, error: searchError } = await supabaseAdmin
      .from("products")
      .select("*")
      .eq("is_active", true)
      .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      .order("created_at", { ascending: false })
      .limit(20);

    if (searchError) {
      console.error("Search error:", searchError);
      return res.status(400).json({ error: searchError.message });
    }

    let results = products || [];
    console.log(
      `Found ${results.length} products matching search in titles/descriptions`,
    );

    // Also search by category names with original term
    const { data: categories, error: catError } = await supabaseAdmin
      .from("categories")
      .select("id, name, slug")
      .ilike("name", `%${searchTerm}%`);

    if (!catError && categories && categories.length > 0) {
      console.log(`Found ${categories.length} matching categories`);

      // Get products from matching categories
      const categoryIds = categories.map((cat) => cat.id);
      const { data: categoryProducts, error: catProductsError } =
        await supabaseAdmin
          .from("products")
          .select("*")
          .eq("is_active", true)
          .in("category_id", categoryIds)
          .limit(20);

      if (!catProductsError && categoryProducts) {
        // Merge with existing results, avoiding duplicates
        const existingIds = new Set(results.map((p) => p.id));
        const newProducts = categoryProducts.filter(
          (p) => !existingIds.has(p.id),
        );
        results = [...results, ...newProducts];
        console.log(
          `Added ${newProducts.length} products from category matches`,
        );
      }
    }

    // If no results and we have suggestions, try with corrected term
    if (
      results.length === 0 &&
      correctedSearchTerm !== searchTerm &&
      suggestions.length > 0
    ) {
      console.log(
        `No results for "${searchTerm}", trying corrected term: "${correctedSearchTerm}"`,
      );
      searchTermToUse = correctedSearchTerm;
      didYouMean = correctedSearchTerm;

      // Search with corrected term
      const { data: correctedProducts } = await supabaseAdmin
        .from("products")
        .select("*")
        .eq("is_active", true)
        .or(
          `title.ilike.%${correctedSearchTerm}%,description.ilike.%${correctedSearchTerm}%`,
        )
        .order("created_at", { ascending: false })
        .limit(20);

      if (correctedProducts) {
        results = correctedProducts;
        console.log(
          `Found ${results.length} products with corrected search term`,
        );
      }

      // Also search corrected term in categories
      const { data: correctedCategories } = await supabaseAdmin
        .from("categories")
        .select("id, name, slug")
        .ilike("name", `%${correctedSearchTerm}%`);

      if (correctedCategories && correctedCategories.length > 0) {
        const categoryIds = correctedCategories.map((cat) => cat.id);
        const { data: correctedCategoryProducts } = await supabaseAdmin
          .from("products")
          .select("*")
          .eq("is_active", true)
          .in("category_id", categoryIds)
          .limit(20);

        if (correctedCategoryProducts) {
          const existingIds = new Set(results.map((p) => p.id));
          const newProducts = correctedCategoryProducts.filter(
            (p) => !existingIds.has(p.id),
          );
          results = [...results, ...newProducts];
          console.log(
            `Added ${newProducts.length} products from corrected category matches`,
          );
        }
      }
    }

    if (results.length === 0) {
      console.log("No matches found, trying fuzzy search...");

      // Enhanced fuzzy search with multiple strategies
      const words = searchTerm.split(" ").filter((word) => word.length > 2);
      const allFuzzyResults = [];

      for (const word of words) {
        if (word.length >= 3) {
          console.log(`Trying fuzzy search for word: "${word}"`);

          // Strategy 1: Partial substring matches
          const patterns = [
            word.substring(1), // Remove first char: "clothes" -> "lothes"
            word.substring(0, word.length - 1), // Remove last char: "clothes" -> "clothe"
            word.substring(0, word.length - 2), // Remove last 2 chars: "clothes" -> "cloth"
          ];

          // Strategy 2: Add common suffixes for better matching
          const variations = [
            word + "ing", // "cloth" -> "clothing"
            word + "es", // "cloth" -> "clothes"
            word + "s", // "shoe" -> "shoes"
          ];

          // If word ends with 's', try without it
          if (word.endsWith("s") && word.length > 3) {
            variations.push(word.slice(0, -1)); // "clothes" -> "clothe"
            variations.push(word.slice(0, -1) + "ing"); // "clothes" -> "clothing"
          }

          // Combine all patterns
          const allPatterns = [...patterns, ...variations];

          console.log(`Testing patterns for "${word}":`, allPatterns);

          // Search in categories with all patterns
          for (const pattern of allPatterns) {
            try {
              const { data: catResults, error: catError } = await supabaseAdmin
                .from("categories")
                .select("id, name, slug")
                .ilike("name", `%${pattern}%`);

              if (!catError && catResults && catResults.length > 0) {
                console.log(
                  `Pattern "${pattern}" matched categories:`,
                  catResults.map((c) => c.name),
                );

                // Get products from these categories
                const categoryIds = catResults.map((cat) => cat.id);
                const { data: categoryProducts } = await supabaseAdmin
                  .from("products")
                  .select("*")
                  .eq("is_active", true)
                  .in("category_id", categoryIds)
                  .limit(10);

                if (categoryProducts) {
                  allFuzzyResults.push(...categoryProducts);
                }
              }
            } catch (error) {
              console.error(`Error with pattern "${pattern}":`, error);
            }
          }

          // Also search in product titles with patterns
          for (const pattern of allPatterns) {
            try {
              const { data: productResults } = await supabaseAdmin
                .from("products")
                .select("*")
                .eq("is_active", true)
                .ilike("title", `%${pattern}%`)
                .limit(5);

              if (productResults) {
                allFuzzyResults.push(...productResults);
              }
            } catch (error) {
              console.error(
                `Error searching products with pattern "${pattern}":`,
                error,
              );
            }
          }
        }
      }

      if (allFuzzyResults.length > 0) {
        // Remove duplicates by ID
        const uniqueResults = allFuzzyResults.filter(
          (product, index, self) =>
            index === self.findIndex((p) => p.id === product.id),
        );

        results = uniqueResults.slice(0, 20);
        console.log(
          `Found ${results.length} fuzzy matches from ${allFuzzyResults.length} total results`,
        );
      }
    }

    if (results.length === 0) {
      console.log("No results found for search term:", searchTerm);
      return res.json([]);
    }

    // Now fetch related data separately for each product
    const productIds = results.map((p) => p.id);

    // Fetch all images for these products
    const { data: allImages } = await supabaseAdmin
      .from("product_images")
      .select("id, product_id, path, is_primary")
      .in("product_id", productIds);

    // Fetch all categories for these products
    const categoryIds = [
      ...new Set(results.map((p) => p.category_id).filter(Boolean)),
    ];
    let allCategories = [];
    if (categoryIds.length > 0) {
      const { data: categories } = await supabaseAdmin
        .from("categories")
        .select("id, name, slug")
        .in("id", categoryIds);
      allCategories = categories || [];
    }

    // Create lookup maps
    const imagesByProductId = {};
    (allImages || []).forEach((img) => {
      if (!imagesByProductId[img.product_id]) {
        imagesByProductId[img.product_id] = [];
      }
      imagesByProductId[img.product_id].push(img);
    });

    const categoriesById = {};
    allCategories.forEach((cat) => {
      categoriesById[cat.id] = cat;
    });

    // Enrich products with images and categories
    const enriched = await Promise.all(
      results.map(async (product) => {
        const productImages = imagesByProductId[product.id] || [];
        const category = categoriesById[product.category_id] || null;

        // Get signed URL for primary image
        const primary =
          productImages.find((i) => i.is_primary) || productImages[0];
        let image_url = null;

        if (primary?.path && process.env.PRODUCT_IMAGES_BUCKET) {
          try {
            const { data: signed } = await supabaseAdmin.storage
              .from(process.env.PRODUCT_IMAGES_BUCKET)
              .createSignedUrl(primary.path, 600);
            image_url = signed?.signedUrl || null;
          } catch (urlError) {
            console.error(
              `Error getting signed URL for product ${product.id}:`,
              urlError,
            );
          }
        }

        return {
          ...product,
          product_images: productImages,
          category: category,
          categories: category, // backward compatibility
          image_url,
          price: product.price_cents ? product.price_cents / 100 : 0,
          formatted_price: product.price_cents
            ? `₹${(product.price_cents / 100).toFixed(2)}`
            : "₹0.00",
          discount: product.discount_percent || 0,
        };
      }),
    );

    console.log(`Returning ${enriched.length} enriched search results`);

    // Prepare response with suggestions
    const response = {
      products: enriched,
      searchTerm: searchTerm,
      suggestions: suggestions.length > 0 ? suggestions : null,
      didYouMean: didYouMean,
      correctedResults: didYouMean !== null,
    };

    res.json(response);
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
