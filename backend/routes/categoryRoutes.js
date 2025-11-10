// backend/routes/categoryRoutes.js
const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// ✅ Get all categories
router.get('/categories', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM category');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ message: 'Error fetching categories' });
  }
});

// ✅ Get all subcategories
router.get('/subcategories', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM subcategory');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching subcategories:', err);
    res.status(500).json({ message: 'Error fetching subcategories' });
  }
});

// ✅ Get subcategories by category_id
router.get('/categories/:id/subcategories', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM subcategory WHERE category_id = ?', [id]);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching subcategories:', err);
    res.status(500).json({ message: 'Error fetching subcategories' });
  }
});

// ✅ Get products by subcategory name
router.get('/products/by-subcategory/:subcategory', async (req, res) => {
  const { subcategory } = req.params;
  try {
    // Find subcategory ID
    const [subRows] = await pool.query(
      'SELECT sno FROM subcategory WHERE subcategory_name = ?',
      [subcategory]
    );

    if (subRows.length === 0) {
      return res.json({ success: true, products: [] });
    }

    const subcategoryId = subRows[0].sno;

    // ✅ Fetch products from 'products' table instead of 'subcategory_1'
    const [prodRows] = await pool.query(
      'SELECT * FROM products WHERE subcategory_id = ?',
      [subcategoryId]
    );

    // Convert BLOB to base64 for each product
    const productsWithImages = prodRows.map(product => {
      let imageData = null;
      
      if (product.image) {
        try {
          // Handle Buffer object from MySQL
          if (Buffer.isBuffer(product.image)) {
            imageData = `data:${product.image_type || 'image/jpeg'};base64,${product.image.toString('base64')}`;
          } else if (product.image.type === 'Buffer' && Array.isArray(product.image.data)) {
            // Handle JSON serialized Buffer
            const buffer = Buffer.from(product.image.data);
            imageData = `data:${product.image_type || 'image/jpeg'};base64,${buffer.toString('base64')}`;
          } else if (typeof product.image === 'string') {
            // Already a string (base64)
            imageData = product.image.startsWith('data:') ? product.image : `data:${product.image_type || 'image/jpeg'};base64,${product.image}`;
          }
        } catch (err) {
          console.error('Error converting image to base64:', err);
          imageData = null;
        }
      }
      
      return {
        ...product,
        image: imageData
      };
    });

    res.json({ success: true, products: productsWithImages });
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ success: false, message: 'Error fetching products' });
  }
});

module.exports = router;
