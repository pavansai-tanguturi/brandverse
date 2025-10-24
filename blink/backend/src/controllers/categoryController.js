import { supabaseAdmin } from "../config/supabaseClient.js";

export async function listCategories(_req, res) {
  try {
    const { data, error } = await supabaseAdmin
      .from("categories")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("Categories fetch error:", error);
      return res.status(400).json({ error: error.message });
    }

    // Get product counts for each category
    const categoriesWithCounts = await Promise.all(
      data.map(async (category) => {
        const { count } = await supabaseAdmin
          .from("products")
          .select("*", { count: "exact", head: true })
          .eq("category_id", category.id)
          .eq("is_active", true);

        return {
          ...category,
          count: count || 0,
        };
      }),
    );

    // Add "All Products" category
    const { count: totalCount } = await supabaseAdmin
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);

    const allCategories = [
      {
        id: "all",
        name: "All Products",
        slug: "all",
        count: totalCount || 0,
        image_url: null,
        created_at: null,
      },
      ...categoriesWithCounts,
    ];

    res.json(allCategories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getCategory(req, res) {
  try {
    const { identifier } = req.params;

    // Check if identifier is UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const isUUID = uuidRegex.test(identifier);

    let query = supabaseAdmin.from("categories").select("*");

    if (isUUID) {
      query = query.eq("id", identifier);
    } else {
      query = query.eq("slug", identifier);
    }

    const { data, error } = await query.single();

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json({ error: "Category not found" });
      }
      return res.status(400).json({ error: error.message });
    }

    // Get product count for this category
    const { count } = await supabaseAdmin
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("category_id", data.id)
      .eq("is_active", true);

    res.json({
      ...data,
      count: count || 0,
    });
  } catch (error) {
    console.error("Error fetching category:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function createCategory(req, res) {
  if (!req.user || !req.user.isAdmin)
    return res.status(403).json({ error: "Admin only" });

  const { name, slug, image_url } = req.body;

  // Validate required fields
  if (!name || !slug) {
    return res.status(400).json({ error: "Name and slug are required" });
  }

  const categoryData = {
    name: name.trim(),
    slug: slug.trim().toLowerCase(),
    ...(image_url && { image_url: image_url.trim() }),
  };

  const { data, error } = await supabaseAdmin
    .from("categories")
    .insert(categoryData)
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      // Unique constraint violation
      if (error.message.includes("categories_name_key")) {
        return res.status(400).json({ error: "Category name already exists" });
      }
      if (error.message.includes("categories_slug_key")) {
        return res.status(400).json({ error: "Category slug already exists" });
      }
    }
    return res.status(400).json({ error: error.message });
  }

  res.status(201).json(data);
}

export async function updateCategory(req, res) {
  if (!req.user || !req.user.isAdmin)
    return res.status(403).json({ error: "Admin only" });

  const { id } = req.params;
  const { name, slug, image_url } = req.body;

  // Validate UUID format
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return res.status(400).json({ error: "Invalid category ID format" });
  }

  // Build update object with only provided fields
  const updateData = {};
  if (name !== undefined) updateData.name = name.trim();
  if (slug !== undefined) updateData.slug = slug.trim().toLowerCase();
  if (image_url !== undefined)
    updateData.image_url = image_url ? image_url.trim() : null;

  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({ error: "No valid fields to update" });
  }

  const { data, error } = await supabaseAdmin
    .from("categories")
    .update(updateData)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      // Unique constraint violation
      if (error.message.includes("categories_name_key")) {
        return res.status(400).json({ error: "Category name already exists" });
      }
      if (error.message.includes("categories_slug_key")) {
        return res.status(400).json({ error: "Category slug already exists" });
      }
    }
    if (error.code === "PGRST116") {
      // No rows returned
      return res.status(404).json({ error: "Category not found" });
    }
    return res.status(400).json({ error: error.message });
  }

  res.json(data);
}

export async function deleteCategory(req, res) {
  if (!req.user || !req.user.isAdmin)
    return res.status(403).json({ error: "Admin only" });

  const { id } = req.params;
  const force = req.query.force === "true";

  // Validate UUID format
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return res.status(400).json({ error: "Invalid category ID format" });
  }

  // Check if category has products
  const { count: productCount, data: products } = await supabaseAdmin
    .from("products")
    .select("id", { count: "exact" })
    .eq("category_id", id);

  if (productCount > 0) {
    if (!force) {
      return res.status(400).json({
        error:
          "Cannot delete category with existing products. Please move or delete all products first.",
        message: `This category has ${productCount} product(s). Use force=true to delete the category and all its products.`,
        productCount,
      });
    }

    // Force delete: Remove products and their related data first
    if (products && products.length > 0) {
      const productIds = products.map((p) => p.id);

      // Delete cart items for these products
      await supabaseAdmin
        .from("cart_items")
        .delete()
        .in("product_id", productIds);

      // Delete product images from database
      const { data: productImages } = await supabaseAdmin
        .from("product_images")
        .select("path")
        .in("product_id", productIds);

      // Delete images from storage
      if (productImages && productImages.length > 0) {
        const paths = productImages.map((img) => img.path);
        await supabaseAdmin.storage
          .from(process.env.PRODUCT_IMAGES_BUCKET || "product-images")
          .remove(paths);
      }

      // Delete product images records
      await supabaseAdmin
        .from("product_images")
        .delete()
        .in("product_id", productIds);

      // Delete products
      await supabaseAdmin.from("products").delete().in("id", productIds);
    }
  }

  const { error } = await supabaseAdmin
    .from("categories")
    .delete()
    .eq("id", id);

  if (error) {
    if (error.code === "PGRST116") {
      // No rows returned
      return res.status(404).json({ error: "Category not found" });
    }
    return res.status(400).json({ error: error.message });
  }

  res.status(200).json({
    message: force
      ? `Category and ${productCount} product(s) deleted successfully`
      : "Category deleted successfully",
    deletedProducts: force ? productCount : 0,
  });
}
