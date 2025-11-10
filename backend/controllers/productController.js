const db = require('../config/db');
const xlsx = require("xlsx");
const fs = require("fs");

// Helper function to convert image BLOB to base64
const convertImageToBase64 = (image, imageType) => {
  if (!image) return null;
  try {
    if (Buffer.isBuffer(image)) {
      return `data:${imageType || 'image/jpeg'};base64,${image.toString('base64')}`;
    }
    if (image.type === 'Buffer' && Array.isArray(image.data)) {
      const buffer = Buffer.from(image.data);
      return `data:${imageType || 'image/jpeg'};base64,${buffer.toString('base64')}`;
    }
    if (typeof image === 'string') {
      return image.startsWith('data:') ? image : `data:${imageType || 'image/jpeg'};base64,${image}`;
    }
    return null;
  } catch (err) {
    console.error('Error converting image to base64:', err);
    return null;
  }
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
    const productsWithImages = products.map(product => ({
      ...product,
      image: convertImageToBase64(product.image, product.image_type)
    }));
    
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
    
    const product = {
      ...products[0],
      image: convertImageToBase64(products[0].image, products[0].image_type)
    };
    
    res.status(200).json({
      success: true,
      product: product
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

    const image = req.file ? req.file.buffer : null;
    const image_type = req.file ? req.file.mimetype : null;

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

    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const image = req.file.buffer;
    const image_type = req.file.mimetype;

    await db.query(
      'UPDATE products SET image = ?, image_type = ? WHERE id = ?',
      [image, image_type, id]
    );

    res.status(200).json({
      success: true,
      message: 'Product image updated successfully'
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
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const gstAmount = subtotal * 0.18;
    const total = subtotal + gstAmount;

    // Insert order
    const [orderResult] = await connection.query(
      `INSERT INTO orders_new (
        user_id, order_number, total_amount, subtotal, gst_amount,
        shipping_full_name, shipping_email, shipping_phone, shipping_address,
        shipping_city, shipping_state, shipping_zip_code, shipping_country,
        payment_method, payment_status, payment_details, order_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId || null,
        orderNumber,
        total,
        subtotal,
        gstAmount,
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
      await connection.query(
        `INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, item_total)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [orderId, item.id, item.name, item.price, item.quantity, item.price * item.quantity]
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
    const productsWithImages = products.map(product => ({
      ...product,
      image: convertImageToBase64(product.image, product.image_type)
    }));
    
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