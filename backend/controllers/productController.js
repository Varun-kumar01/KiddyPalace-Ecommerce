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

    // Check for existing order references
    const [rows] = await db.query(
      'SELECT COUNT(*) AS referenceCount FROM order_items WHERE product_id = ?',[id]
    );
    const referenceCount = rows?.[0]?.referenceCount || 0;

    if (referenceCount > 0) {
      return res.status(409).json({
        success: false,
        message: 'Cannot delete product because it is referenced by existing orders',
        references: referenceCount
      });
    }

    // Delete product
    await db.query('DELETE FROM products WHERE id = ?', [id]);

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Delete product error:', error);
    // Handle FK constraint error gracefully if it slips through
    if (error?.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({
        success: false,
        message: 'Cannot delete product because it is referenced by existing orders'
      });
    }
    res.status(500).json({ message: 'Server error while deleting product' });
  }
};

// Get user orders with items
exports.getUserOrders = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    // Try orders_new first, fallback to orders if table was renamed
    let orders = [];
    
    try {
      const [ordersResult] = await db.query(
        `SELECT * FROM orders_new WHERE user_id = ? ORDER BY created_at DESC`,
        [userId]
      );
      orders = ordersResult;
    } catch (tableError) {
      // If orders_new doesn't exist, try orders table
      if (tableError.code === 'ER_NO_SUCH_TABLE' || tableError.message.includes("doesn't exist")) {
        console.log('orders_new table not found, trying orders table...');
        const [ordersResult] = await db.query(
          `SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC`,
          [userId]
        );
        orders = ordersResult;
      } else {
        throw tableError;
      }
    }

    if (!orders.length) {
      return res.status(200).json({ success: true, orders: [] });
    }

    const orderIds = orders.map(order => order.id);

    if (orderIds.length === 0) {
      return res.status(200).json({ success: true, orders: [] });
    }

    const [items] = await db.query(
      `SELECT * FROM order_items WHERE order_id IN (?) ORDER BY created_at ASC`,
      [orderIds]
    );

    const itemsByOrder = items.reduce((acc, item) => {
      if (!acc[item.order_id]) acc[item.order_id] = [];
      acc[item.order_id].push(item);
      return acc;
    }, {});

    const formattedOrders = orders.map(order => {
      let paymentDetails = order.payment_details;
      if (paymentDetails) {
        try {
          paymentDetails = typeof paymentDetails === 'string' ? JSON.parse(paymentDetails) : paymentDetails;
        } catch (err) {
          paymentDetails = null;
        }
      }

      const canModify = ['pending', 'processing'].includes(order.order_status);

      return {
        ...order,
        payment_details: paymentDetails,
        items: itemsByOrder[order.id] || [],
        isCancelable: canModify,
        canUpdateAddress: canModify,
      };
    });

    res.status(200).json({
      success: true,
      orders: formattedOrders,
    });

  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while fetching orders',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get single order details
exports.getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;

    const [orders] = await db.query(
      `SELECT * FROM orders_new WHERE id = ?`,
      [orderId]
    );

    if (!orders.length) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const order = orders[0];

    const [items] = await db.query(
      `SELECT * FROM order_items WHERE order_id = ? ORDER BY created_at ASC`,
      [orderId]
    );

    let paymentDetails = order.payment_details;
    if (paymentDetails) {
      try {
        paymentDetails = typeof paymentDetails === 'string' ? JSON.parse(paymentDetails) : paymentDetails;
      } catch (err) {
        paymentDetails = null;
      }
    }

    res.status(200).json({
      success: true,
      order: {
        ...order,
        payment_details: paymentDetails,
        items,
        isCancelable: ['pending', 'processing'].includes(order.order_status),
        canUpdateAddress: ['pending', 'processing'].includes(order.order_status),
      },
    });

  } catch (error) {
    console.error('Get order details error:', error);
    res.status(500).json({ message: 'Server error while fetching order details' });
  }
};

// Admin: Get all orders with items (optionally filter by status)
exports.getAllOrders = async (req, res) => {
  try {
    const { status } = req.query;

    // Try orders_new first, fallback to orders if table was renamed
    let orders = [];
    let tableName = 'orders_new';
    
    try {
      const whereClause = status ? 'WHERE order_status = ?' : '';
      const params = status ? [status] : [];

      const [ordersResult] = await db.query(
        `SELECT * FROM orders_new ${whereClause} ORDER BY created_at DESC`,
        params
      );
      orders = ordersResult;
    } catch (tableError) {
      // If orders_new doesn't exist, try orders table
      if (tableError.code === 'ER_NO_SUCH_TABLE' || tableError.message.includes("doesn't exist")) {
        console.log('orders_new table not found, trying orders table...');
        tableName = 'orders';
        const whereClause = status ? 'WHERE order_status = ?' : '';
        const params = status ? [status] : [];

        const [ordersResult] = await db.query(
          `SELECT * FROM orders ${whereClause} ORDER BY created_at DESC`,
          params
        );
        orders = ordersResult;
      } else {
        throw tableError;
      }
    }

    if (!orders.length) {
      return res.status(200).json({ success: true, orders: [] });
    }

    const orderIds = orders.map(o => o.id);

    if (orderIds.length === 0) {
      return res.status(200).json({ success: true, orders: [] });
    }

    const [items] = await db.query(
      `SELECT * FROM order_items WHERE order_id IN (?) ORDER BY created_at ASC`,
      [orderIds]
    );

    const itemsByOrder = items.reduce((acc, item) => {
      if (!acc[item.order_id]) acc[item.order_id] = [];
      acc[item.order_id].push(item);
      return acc;
    }, {});

    const formatted = orders.map(order => {
      let paymentDetails = order.payment_details;
      if (paymentDetails) {
        try {
          paymentDetails = typeof paymentDetails === 'string' ? JSON.parse(paymentDetails) : paymentDetails;
        } catch (_) {
          paymentDetails = null;
        }
      }
      return {
        ...order,
        payment_details: paymentDetails,
        items: itemsByOrder[order.id] || []
      };
    });

    res.status(200).json({ success: true, orders: formatted });
  } catch (error) {
    console.error('Get all orders error:', error);
    // Ensure we always return JSON, even on error
    res.status(500).json({ 
      success: false,
      message: 'Server error while fetching all orders',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Accept an order (mark as 'accepted') - changes status from pending to accepted
exports.acceptOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Try orders_new first, fallback to orders if table was renamed
    let orders = [];
    let tableName = 'orders_new';
    
    try {
      const [ordersResult] = await db.query(
        `SELECT id, order_status FROM orders_new WHERE id = ?`,
        [orderId]
      );
      orders = ordersResult;
    } catch (tableError) {
      // If orders_new doesn't exist, try orders table
      if (tableError.code === 'ER_NO_SUCH_TABLE' || tableError.message.includes("doesn't exist")) {
        console.log('orders_new table not found, trying orders table...');
        tableName = 'orders';
        const [ordersResult] = await db.query(
          `SELECT id, order_status FROM orders WHERE id = ?`,
          [orderId]
        );
        orders = ordersResult;
      } else {
        throw tableError;
      }
    }

    if (!orders.length) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const order = orders[0];
    
    // Only allow accepting orders that are pending
    if (order.order_status !== 'pending') {
      return res.status(400).json({ 
        success: false,
        message: `Cannot accept order. Current status is '${order.order_status}'. Only pending orders can be accepted.` 
      });
    }

    // Update order status from pending to accepted
    await db.query(
      `UPDATE ${tableName} SET order_status = 'accepted', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [orderId]
    );

    res.status(200).json({ success: true, message: 'Order accepted successfully. Status changed from pending to accepted.' });
  } catch (error) {
    console.error('Accept order error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while accepting order',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Cancel order and restock items
exports.cancelOrder = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { orderId } = req.params;
    const { userId } = req.body;

    if (!orderId || !userId) {
      connection.release();
      return res.status(400).json({ message: 'Order ID and User ID are required' });
    }

    await connection.beginTransaction();

    const [orders] = await connection.query(
      `SELECT id, user_id, order_status FROM orders_new WHERE id = ? FOR UPDATE`,
      [orderId]
    );

    if (!orders.length) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ message: 'Order not found' });
    }

    const order = orders[0];

    if (order.user_id && Number(order.user_id) !== Number(userId)) {
      await connection.rollback();
      connection.release();
      return res.status(403).json({ message: 'You are not authorized to modify this order' });
    }

    if (['cancelled', 'delivered'].includes(order.order_status)) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ message: `Order already ${order.order_status}` });
    }

    const [items] = await connection.query(
      `SELECT product_id, quantity FROM order_items WHERE order_id = ?`,
      [orderId]
    );

    for (const item of items) {
      await connection.query(
        'UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?',
        [item.quantity, item.product_id]
      );
    }

    await connection.query(
      `UPDATE orders_new SET order_status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [orderId]
    );

    await connection.commit();
    connection.release();

    res.status(200).json({ success: true, message: 'Order cancelled successfully' });

  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error('Cancel order error:', error);
    res.status(500).json({ message: 'Server error while cancelling order' });
  }
};

// Update shipping address for an order
exports.updateOrderAddress = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { orderId } = req.params;
    const { userId, shippingAddress } = req.body;

    if (!orderId || !userId || !shippingAddress) {
      connection.release();
      return res.status(400).json({ message: 'Order ID, User ID and shipping address are required' });
    }

    const {
      fullName,
      email,
      phone,
      address,
      city,
      state = '',
      zipCode,
      country = 'India',
    } = shippingAddress;

    if (!fullName || !email || !phone || !address || !city || !zipCode) {
      connection.release();
      return res.status(400).json({ message: 'Incomplete shipping address details' });
    }

    await connection.beginTransaction();

    const [orders] = await connection.query(
      `SELECT user_id, order_status FROM orders_new WHERE id = ? FOR UPDATE`,
      [orderId]
    );

    if (!orders.length) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ message: 'Order not found' });
    }

    const order = orders[0];

    if (order.user_id && Number(order.user_id) !== Number(userId)) {
      await connection.rollback();
      connection.release();
      return res.status(403).json({ message: 'You are not authorized to modify this order' });
    }

    if (!['pending', 'processing'].includes(order.order_status)) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ message: 'Address cannot be updated after order is shipped' });
    }

    await connection.query(
      `UPDATE orders_new SET 
        shipping_full_name = ?,
        shipping_email = ?,
        shipping_phone = ?,
        shipping_address = ?,
        shipping_city = ?,
        shipping_state = ?,
        shipping_zip_code = ?,
        shipping_country = ?,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        fullName,
        email,
        phone,
        address,
        city,
        state,
        zipCode,
        country,
        orderId,
      ]
    );

    await connection.commit();
    connection.release();

    res.status(200).json({ success: true, message: 'Shipping address updated successfully' });

  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error('Update order address error:', error);
    res.status(500).json({ message: 'Server error while updating address' });
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

// Get tracking info for a specific order item
exports.getItemTracking = async (req, res) => {
  try {
    const { orderId, itemId } = req.params;

    if (!orderId || !itemId) {
      return res.status(400).json({ success: false, message: 'Order ID and Item ID are required' });
    }

    // Load order (for overall status) and item (for item-level details if present)
    const [[orderRows], [itemRows]] = await Promise.all([
      db.query(`SELECT id, order_status, created_at, updated_at FROM orders_new WHERE id = ?`, [orderId]),
      db.query(`SELECT * FROM order_items WHERE id = ? AND order_id = ?`, [itemId, orderId])
    ]);

    if (!orderRows || orderRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    if (!itemRows || itemRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Order item not found' });
    }

    const order = orderRows[0];
    const item = itemRows[0];

    // Some installations may not yet have tracking fields on order_items.
    // We will derive a simple timeline from order_status and include optional fields if present.
    const carrier = item.carrier || null;
    const trackingNumber = item.tracking_number || null;
    const itemStatus = item.item_status || null; // optional per-item status if schema supports it

    // Build a basic timeline based on known statuses
    const status = (itemStatus || order.order_status || 'pending').toLowerCase();
    const steps = [
      { key: 'placed', label: 'Order Placed' },
      { key: 'processing', label: 'Processing' },
      { key: 'accepted', label: 'Accepted' },
      { key: 'shipped', label: 'Shipped' },
      { key: 'delivered', label: 'Delivered' }
    ];

    const isCompleted = (stepKey) => {
      const orderOf = { placed: 0, pending: 0, processing: 1, accepted: 2, shipped: 3, delivered: 4, cancelled: -1 };
      const current = orderOf[status] ?? 0;
      const step = orderOf[stepKey] ?? -1;
      return step !== -1 && current >= step;
    };

    const timeline = steps.map(s => ({
      key: s.key,
      label: s.label,
      completed: isCompleted(s.key)
    }));

    // If cancelled, annotate
    const cancelled = status === 'cancelled';

    return res.status(200).json({
      success: true,
      tracking: {
        orderId: Number(orderId),
        itemId: Number(itemId),
        product_name: item.product_name,
        status: cancelled ? 'cancelled' : status,
        carrier,
        trackingNumber,
        timeline,
        updated_at: order.updated_at,
      }
    });
  } catch (error) {
    console.error('Get item tracking error:', error);
    return res.status(500).json({ success: false, message: 'Server error while fetching tracking info' });
  }
};