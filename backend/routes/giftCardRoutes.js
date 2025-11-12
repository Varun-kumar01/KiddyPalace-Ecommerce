const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../config/db');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '..', 'uploads', 'giftcards');
try {
  fs.mkdirSync(uploadDir, { recursive: true });
} catch (_) {}

// Set up image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/giftcards'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

const upload = multer({ storage });

// Create gift card (admin upload) — supports multiple images via field "images"
router.post('/', upload.any(), async (req, res) => {
  try {
    const { title, brand, sku, base_price, description } = req.body;
    let { price_options } = req.body;
    const uploadedFiles = Array.isArray(req.files) ? req.files : (req.file ? [req.file] : []);

    // Normalize price_options to JSON array if provided as comma-separated string
    const normalizePriceOptions = (input) => {
      if (!input || String(input).trim() === '') return null;
      try {
        // If already valid JSON, keep it
        const parsed = JSON.parse(input);
        if (Array.isArray(parsed)) return JSON.stringify(parsed.map(Number).filter(n => !Number.isNaN(n)));
      } catch (_) {
        // Fallback: comma-separated values
      }
      const arr = String(input)
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
        .map(v => Number(v))
        .filter(n => !Number.isNaN(n));
      return arr.length ? JSON.stringify(arr) : null;
    };

    const normalizedOptions = normalizePriceOptions(price_options);

    // Insert first to get id
    const [result] = await db.query(
      `INSERT INTO gift_cards (title, brand, sku, base_price, description, price_options, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [title, brand, sku, Number(base_price), description || '', normalizedOptions, null]
    );

    const giftcardId = result.insertId;

    // If multiple files uploaded, move them into per-id folder and set first as image_url
    let firstUrl = null;
    if (uploadedFiles.length > 0) {
      const perDir = path.join(uploadDir, String(giftcardId));
      try { fs.mkdirSync(perDir, { recursive: true }); } catch (_) {}

      uploadedFiles.forEach((file, idx) => {
        const ext = path.extname(file.originalname) || path.extname(file.filename) || '.jpg';
        const newName = `img-${idx + 1}${ext}`;
        const newPath = path.join(perDir, newName);
        try {
          fs.renameSync(file.path, newPath);
        } catch (_) {
          // fallback: copy
          try { fs.copyFileSync(file.path, newPath); fs.unlinkSync(file.path); } catch (_) {}
        }
        if (!firstUrl) firstUrl = `/uploads/giftcards/${giftcardId}/${newName}`;
      });

      if (firstUrl) {
        await db.query('UPDATE gift_cards SET image_url = ? WHERE id = ?', [firstUrl, giftcardId]);
      }
    }

    res.json({ success: true, message: 'Gift card added successfully!', id: giftcardId });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ success: false, message: err.sqlMessage || 'Failed to add gift card.' });
  }
});

// Get all gift cards
router.get('/', async (req, res) => {
  try {
    const [cards] = await db.query('SELECT * FROM gift_cards');
    res.json({ success: true, giftcards: cards });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch gift cards.' });
  }
});

// List images for a gift card — define BEFORE '/:id' so it isn't shadowed
router.get('/:id/images', async (req, res) => {
  try {
    const perDir = path.join(uploadDir, String(req.params.id));
    const files = fs.existsSync(perDir) ? fs.readdirSync(perDir) : [];
    const urls = files.map(f => `/uploads/giftcards/${req.params.id}/${f}`);
    res.json({ success: true, images: urls });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ success: false, message: 'Failed to list images.' });
  }
});

// Get single gift card by ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM gift_cards WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Gift card not found.' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ message: 'Failed to fetch gift card.' });
  }
});

// Delete gift card
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT id FROM gift_cards WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Gift card not found.' });

    await db.query('DELETE FROM gift_cards WHERE id = ?', [id]);
    res.json({ success: true, message: 'Gift card deleted successfully!' });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete gift card.' });
  }
});

module.exports = router;
