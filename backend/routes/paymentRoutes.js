const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// Create Razorpay order
router.post('/payments/create-order', paymentController.createRazorpayOrder);

// Verify Razorpay signature
router.post('/payments/verify', paymentController.verifyRazorpaySignature);

module.exports = router;


