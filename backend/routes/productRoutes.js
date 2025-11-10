const express = require('express');
const router = express.Router();
const multer = require('multer');
const productController = require('../controllers/productController');
const path = require('path');
const fs = require('fs');

// =====================================================
// 🖼️ IMAGE UPLOAD CONFIGURATION
// =====================================================
const imageStorage = multer.memoryStorage();

const uploadImage = multer({
  storage: imageStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 2MB max image size
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed!'), false);
  },
});

// =====================================================
// 📊 EXCEL UPLOAD CONFIGURATION
// =====================================================

// Ensure "uploads" directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Disk storage for Excel
const excelStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

// Accept only Excel MIME types
const uploadExcel = multer({
  storage: excelStorage,
  fileFilter: (req, file, cb) => {
    const validMime =
      file.mimetype === 'application/vnd.ms-excel' ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.mimetype.includes('spreadsheetml');
    if (validMime) cb(null, true);
    else cb(new Error('Only Excel files are allowed!'), false);
  },
});

// =====================================================
// 📦 PRODUCT ROUTES
// =====================================================

// Fetch all products
router.get('/products', productController.getAllProducts);

// Get single product
router.get('/products/:id', productController.getProductById);

// Add new product (with image)
router.post('/products', uploadImage.single('image'), productController.addProduct);

// Update product image
router.put('/products/:id/image', uploadImage.single('image'), productController.updateProductImage);

// Update product stock
router.put('/products/:id/stock', productController.updateProductStock);

// Delete a product
router.delete('/products/:id', productController.deleteProduct);

// Create new order
router.post('/orders', productController.createOrder);

// Fetch user’s orders
router.get('/orders/user/:userId', productController.getUserOrders);

// Get products by subcategory
router.get('/products/subcategory/:subcategoryId', productController.getProductsBySubcategory);

// =====================================================
// 📂 BULK UPLOAD PRODUCTS FROM EXCEL
// =====================================================
router.post('/upload-excel', uploadExcel.single('file'), productController.uploadProductsFromExcel);

module.exports = router;
