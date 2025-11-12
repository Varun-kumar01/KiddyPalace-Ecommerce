const db = require('../config/db');
const xlsx = require("xlsx");
const fs = require("fs");

// Helper function to convert image BLOB to base64
const convertStoredImageToBase64 = (image, imageType) => {
  if (!image) return null;
  try {
    if (Buffer.isBuffer(image)) {
      return `data:${imageType || 'image/jpeg'};base64,${image.toString('base64')}`;
    }
    if (image?.type === 'Buffer' && Array.isArray(image.data)) {
      const buffer = Buffer.from(image.data);
      return `data:${imageType || 'image/jpeg'};base64,${buffer.toString('base64')}`;
    }
    if (typeof image === 'string') {
      return image.startsWith('data:')
        ? image
        : `data:${imageType || 'image/jpeg'};base64,${image}`;
    }
  } catch (err) {
    console.error('Error converting image to base64:', err);
  }
  return null;
};

const buildAdditionalImagesMap = (rows = []) => {
  return rows.reduce((acc, row) => {
    const dataUri = convertStoredImageToBase64(row.image, row.image_type);
    if (!dataUri) return acc;
    if (!acc[row.product_id]) acc[row.product_id] = [];
    acc[row.product_id].push(dataUri);
    return acc;
  }, {});
};

const attachImagesToProducts = async (products = []) => {
  if (!Array.isArray(products) || products.length === 0) return [];

  const productIds = products.map(p => p.id);
  let additionalImagesMap = {};

  if (productIds.length > 0) {
    const [rows] = await db.query(
      `SELECT product_id, image, image_type 
       FROM product_images 
       WHERE product_id IN (?) 
       ORDER BY sort_order ASC, id ASC`,
      [productIds]
    );
    additionalImagesMap = buildAdditionalImagesMap(rows);
  }

  return products.map(product => {
    const primaryImage = convertStoredImageToBase64(product.image, product.image_type);
    const additionalImages = additionalImagesMap[product.id] || [];
    const imageGallery = primaryImage ? [primaryImage, ...additionalImages] : additionalImages;
    return { ...product, image: primaryImage, additionalImages, imageGallery };
  });
};





// Get all products
exports.getAllProducts = async (req, res) => {
  try {
    // Show all products (including out of stock) for admin, only in-stock for customers
    const showAll = req.query.showAll === 'true';
    const query = showAll 
      ? 'SELECT * FROM products ORDER BY created_at DESC'
      : 'SELECT * FROM products WHERE stock_quantity > 0 ORDER BY created_at DESC';
    
    const [products] = await db.query(query);
    
    // Convert BLOB to base64 for each product
    const productsWithImages = await attachImagesToProducts(products);
    
    res.status(200).json({
      success: true,
      products: productsWithImages
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Server error while fetching products' });
  }
};

// Get single product
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const [products] = await db.query('SELECT * FROM products WHERE id = ?', [id]);
    
    if (products.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    const [productWithImages] = await attachImagesToProducts([products[0]]);
    
    res.status(200).json({
      success: true,
      product: productWithImages
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ message: 'Server error while fetching product' });
  }
};

// Add product with image
exports.addProduct = async (req, res) => {
  try {
    const {
      name,
      product_code,
      description,
      mrp,
      discount,
      price,
      category_id,
      subcategory_id,
      stock_quantity,
      age_range,
      gender,
      highlights,
      specifications,
      brand_name,

    } = req.body;

    let uploadedImages = [];
    if (Array.isArray(req.files)) {
      uploadedImages = req.files.filter(
        file => file?.fieldname === 'image' || file?.fieldname === 'images'
      );
    } else if (req.files) {
      if (Array.isArray(req.files.image)) uploadedImages = uploadedImages.concat(req.files.image);
      if (Array.isArray(req.files.images)) uploadedImages = uploadedImages.concat(req.files.images);
    }
    if (uploadedImages.length === 0 && req.file) uploadedImages = [req.file];
    if (uploadedImages.length > 5) uploadedImages = uploadedImages.slice(0, 5);

    const primaryImageFile = uploadedImages[0];
    const image = primaryImageFile ? primaryImageFile.buffer : null;
    const image_type = primaryImageFile ? primaryImageFile.mimetype : null;

    if (!name || !price) {
      return res.status(400).json({ error: 'Name and price are required' });
    }

    const [result] = await db.query(
      `INSERT INTO products 
      (name, product_code, description, mrp, discount, price, image, image_type, category_id, subcategory_id, stock_quantity, age_range, gender, highlights, specifications, brand_name)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        description || '',
        product_code,
        mrp,
        discount,
        price,
        image,
        image_type,
        category_id || null,
        subcategory_id || null,
        stock_quantity || 0,
        age_range || '',
        gender || '',
        highlights || '',
        specifications || '',
        brand_name || ''
      ]
    );

    const additionalImages = uploadedImages.slice(1);
    if (additionalImages.length > 0) {
      // await ensureProductImagesTable();
      await Promise.all(
        additionalImages.map((file, index) =>
          db.query(
            `INSERT INTO product_images (product_id, image, image_type, sort_order) VALUES (?, ?, ?, ?)`,
            [result.insertId, file.buffer, file.mimetype, index]
          )
        )
      );
    }

    res.status(201).json({
      success: true,
      message: 'Product added successfully',
      productId: result.insertId
    });

  } catch (error) {
    console.error('Add product error:', error);
    res.status(500).json({ error: 'Server error while adding product' });
  }
};


// Update product image
exports.updateProductImage = async (req, res) => {
  try {
    const { id } = req.params;

    let uploadedImages = [];
    if (Array.isArray(req.files)) {
      uploadedImages = req.files.filter(
        file => file?.fieldname === 'image' || file?.fieldname === 'images'
      );
    } else if (req.files) {
      if (Array.isArray(req.files.image)) uploadedImages = uploadedImages.concat(req.files.image);
      if (Array.isArray(req.files.images)) uploadedImages = uploadedImages.concat(req.files.images);
    }
    if (uploadedImages.length === 0 && req.file) uploadedImages = [req.file];
    if (uploadedImages.length === 0) {
      return res.status(400).json({ success: false, message: 'No image file provided' });
    }

    const primaryIndexRaw = Array.isArray(req.body?.primaryImageIndex)
      ? req.body.primaryImageIndex[0]
      : req.body?.primaryImageIndex;
    let primaryIndex = parseInt(primaryIndexRaw, 10);
    if (Number.isNaN(primaryIndex) || primaryIndex < 0 || primaryIndex >= uploadedImages.length) {
      const explicitPrimaryIdx = uploadedImages.findIndex(f => f.fieldname === 'image');
      primaryIndex = explicitPrimaryIdx !== -1 ? explicitPrimaryIdx : 0;
    }

    const primaryFile = uploadedImages[primaryIndex];
    const additionalImages = uploadedImages.filter((_, i) => i !== primaryIndex);

    await db.query('UPDATE products SET image = ?, image_type = ? WHERE id = ?', [
      primaryFile.buffer,
      primaryFile.mimetype,
      id,
    ]);

    let insertedCount = 0;
    if (additionalImages.length > 0) {
      // await ensureProductImagesTable();

      const [[{ maxOrder = -1 } = {}]] = await db.query(
        'SELECT COALESCE(MAX(sort_order), -1) AS maxOrder FROM product_images WHERE product_id = ?',
        [id]
      );
      const baseOrder = Number.isFinite(Number(maxOrder)) ? Number(maxOrder) : -1;

      await Promise.all(
        additionalImages.map((file, index) =>
          db.query(
            `INSERT INTO product_images (product_id, image, image_type, sort_order) VALUES (?, ?, ?, ?)`,
            [id, file.buffer, file.mimetype, baseOrder + 1 + index]
          )
        )
      );
      insertedCount = additionalImages.length;
    }

    res.status(200).json({
      success: true,
      message:
        insertedCount > 0
          ? `Product image updated. Added ${insertedCount} additional image${insertedCount > 1 ? 's' : ''}.`
          : 'Product image updated successfully.',
      primaryUpdated: true,
      additionalInserted: insertedCount,
    });
  } catch (error) {
    console.error('Update image error:', error);
    res.status(500).json({ message: 'Server error while updating image' });
  }
};


// Create order with complete checkout flow
exports.createOrder = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    const { userId, items, totalAmount, shippingAddress, paymentMethod, paymentDetails } = req.body;

    // Validation
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No items in order' });
    }

    if (!shippingAddress || !paymentMethod) {
      return res.status(400).json({ message: 'Shipping address and payment method are required' });
    }

    // Start transaction
    await connection.beginTransaction();

    // Check stock for all items
    for (const item of items) {
      const [products] = await connection.query(
        'SELECT stock_quantity FROM products WHERE id = ?',
        [item.id]
      );
      
      if (products.length === 0) {
        await connection.rollback();
        return res.status(404).json({ message: `Product ${item.name} not found` });
      }

      if (products[0].stock_quantity < item.quantity) {
        await connection.rollback();
        return res.status(400).json({ 
          message: `Insufficient stock for ${item.name}. Available: ${products[0].stock_quantity}` 
        });
      }
    }

    // Generate order number
    const orderNumber = 'ORD' + Date.now() + Math.floor(Math.random() * 1000);

    // Calculate amounts
   // ✅ Calculate safe subtotal and total
const subtotal = Array.isArray(items)
  ? items.reduce((sum, item) => {
      const price = Number(item.price) || 0;
      const qty = Number(item.quantity) || 1;
      return sum + price * qty;
    }, 0)
  : 0;

const safeSubtotal = isNaN(subtotal) ? 0 : Number(subtotal.toFixed(2));
const safeTotal = isNaN(safeSubtotal) ? 0 : safeSubtotal;


    // Insert order
    const [orderResult] = await connection.query(
      `INSERT INTO orders_new (
        user_id, order_number, total_amount, subtotal,
        shipping_full_name, shipping_email, shipping_phone, shipping_address,
        shipping_city, shipping_state, shipping_zip_code, shipping_country,
        payment_method, payment_status, payment_details, order_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId || null,
        orderNumber,
        safeTotal,
        safeSubtotal,
        // gstAmount,
        shippingAddress.fullName,
        shippingAddress.email,
        shippingAddress.phone,
        shippingAddress.address,
        shippingAddress.city,
        shippingAddress.state || '',
        shippingAddress.zipCode,
        shippingAddress.country || 'India',
        paymentMethod,
        paymentMethod === 'cod' ? 'pending' : 'completed',
        JSON.stringify(paymentDetails || {}),
        'pending'
      ]
    );

    const orderId = orderResult.insertId;

    // Insert order items and update stock
    for (const item of items) {
      // Insert order item
      const price = Number(item.price) || 0;
const qty = Number(item.quantity) || 1; // default to 1 if missing
const total = price * qty;

await connection.query(
  `INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, item_total)
   VALUES (?, ?, ?, ?, ?, ?)`,
  [orderId, item.id, item.name, price, qty, total]
);

      // Update stock
      await connection.query(
        'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
        [item.quantity, item.id]
      );
    }

    // Commit transaction
    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      orderId: orderId,
      orderNumber: orderNumber
    });

  } catch (error) {
    // Rollback on error
    await connection.rollback();
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Server error while placing order' });
  } finally {
    connection.release();
  }
};

// Update product stock
exports.updateProductStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { stock_quantity } = req.body;

    // Validate input
    if (stock_quantity === undefined || stock_quantity === null) {
      return res.status(400).json({ 
        success: false,
        message: 'Stock quantity is required' 
      });
    }

    if (stock_quantity < 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Stock quantity cannot be negative' 
      });
    }

    // Check if product exists
    const [products] = await db.query('SELECT * FROM products WHERE id = ?', [id]);
    
    if (products.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Product not found' 
      });
    }

    // Update stock
    await db.query(
      'UPDATE products SET stock_quantity = ? WHERE id = ?',
      [stock_quantity, id]
    );

    res.status(200).json({
      success: true,
      message: 'Stock updated successfully',
      stock_quantity: stock_quantity
    });

  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while updating stock' 
    });
  }
};

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if product exists
    const [products] = await db.query('SELECT * FROM products WHERE id = ?', [id]);
    
    if (products.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Delete product
    await db.query('DELETE FROM products WHERE id = ?', [id]);

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Server error while deleting product' });
  }
};

// Get user orders
exports.getUserOrders = async (req, res) => {
  try {
    const { userId } = req.params;

    const [orders] = await db.query(
      `SELECT o.*, p.name as product_name, p.image_url, p.price 
       FROM orders o 
       JOIN products p ON o.product_id = p.id 
       WHERE o.user_id = ? 
       ORDER BY o.order_date DESC`,
      [userId]
    );

    res.status(200).json({
      success: true,
      orders: orders
    });

  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Server error while fetching orders' });
  }
};

// Get products by subcategory
exports.getProductsBySubcategory = async (req, res) => {
  try {
    const { subcategoryId } = req.params;
    
    const [products] = await db.query(
      'SELECT * FROM products WHERE subcategory_id = ? ORDER BY created_at DESC',
      [subcategoryId]
    );
    
    // Convert BLOB to base64 for each product
    const productsWithImages = await attachImagesToProducts(products);

    
    res.status(200).json({
      success: true,
      products: productsWithImages
    });
  } catch (error) {
    console.error('Get products by subcategory error:', error);
    res.status(500).json({ message: 'Server error while fetching products' });
  }
};

// 📦 BULK UPLOAD PRODUCTS FROM EXCEL


exports.uploadProductsFromExcel = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ message: "Excel file is empty or invalid" });
    }

    const headers = Object.keys(data[0]).map(h => String(h).trim().toLowerCase());

    // Accept either category_id or category; subcategory_id or subcategory
    const hasCategory = headers.includes("category_id") || headers.includes("category");
    const hasSubcategory = headers.includes("subcategory_id") || headers.includes("subcategory");

    const requiredAlways = ["name", "product_code", "description", "mrp", "discount", "price", "stock_quantity", "brand_name", "age_range", "gender"];
    const missingAlways = requiredAlways.filter(h => !headers.includes(h));

    const missing = [...missingAlways];
    if (!hasCategory) missing.push("category_id (or category)");
    if (!hasSubcategory) missing.push("subcategory_id (or subcategory)");

    // Optional fields
    const hasHighlights = headers.includes("highlights");
    const hasSpecifications = headers.includes("specifications");

    if (missing.length > 0) {
      return res.status(400).json({
        message: "Invalid Excel headers",
        missing_headers: missing
      });
    }

    const insertQuery = `
      INSERT INTO products 
      (name, product_code, description, mrp, discount, price, category_id, subcategory_id, stock_quantity, brand_name, age_range, gender, highlights, specifications)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    let inserted = 0;
    for (const rowRaw of data) {
      const row = {};
      for (const k in rowRaw) row[k.toLowerCase()] = rowRaw[k];

      const name = String(row.name || "").trim();
      const product_code = String(row.product_code || "");
      const description = String(row.description || "");
      const mrp = Number(row.mrp);
      const discount = Number(row.discount);
      const price = Number(row.price);
      const category_id = row.category_id !== "" ? Number(row.category_id) : (row.category !== "" ? Number(row.category) : null);
      const subcategory_id = row.subcategory_id !== "" ? Number(row.subcategory_id) : (row.subcategory !== "" ? Number(row.subcategory) : null);
      const stock_quantity = row.stock_quantity === "" ? 0 : Number(row.stock_quantity);
      const brand_name = String(row.brand_name || "");
      const age_range = String(row.age_range || "");
      const gender = String(row.gender || "");

      // ✅ New optional columns
      const highlights = hasHighlights ? String(row.highlights || "") : "";
      const specifications = hasSpecifications ? String(row.specifications || "") : "";

      if (!name || Number.isNaN(price)) continue;

      await db.query(insertQuery, [
        name,
        product_code,
        description,
        mrp,
        discount,
        price,
        Number.isNaN(category_id) ? null : category_id,
        Number.isNaN(subcategory_id) ? null : subcategory_id,
        Number.isNaN(stock_quantity) ? 0 : stock_quantity,
        brand_name,
        age_range,
        gender,
        highlights,
        specifications
      ]);
      inserted += 1;
    }

    try { fs.unlinkSync(req.file.path); } catch (_) {}

    return res.json({
      message: "Products uploaded successfully!",
      rows_inserted: inserted
    });
  } catch (error) {
    console.error("Error uploading Excel:", error);
    try { if (req.file?.path) fs.unlinkSync(req.file.path); } catch (_) {}
    return res.status(500).json({
      message: "Error uploading Excel",
      error: error.message
    });
  }
};