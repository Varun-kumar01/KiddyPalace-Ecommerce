const express = require('express');
const router = express.Router();
const {
  adminLogin,
  verifyAdmin,
  adminLogout,
  changePassword,
  createAdmin
} = require('../controllers/adminAuthController');
const { authenticateAdmin, requireSuperAdmin } = require('../middleware/adminAuth');

// Public routes
router.post('/login', adminLogin);

// Protected routes (require authentication)
router.get('/verify', verifyAdmin);
router.post('/logout', authenticateAdmin, adminLogout);
router.post('/change-password', authenticateAdmin, changePassword);

// Super admin only routes
router.post('/create-admin', authenticateAdmin, requireSuperAdmin, createAdmin);

module.exports = router;
