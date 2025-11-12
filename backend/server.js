const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const adminAuthRoutes = require('./routes/adminAuth');
const categoryRoutes = require('./routes/categoryRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const giftCardRoutes = require('./routes/giftCardRoutes'); // ✅ new

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));


// Serve uploaded images
app.use('/uploads', express.static('uploads'));

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminAuthRoutes);
app.use('/api', productRoutes);
app.use('/api', categoryRoutes);
app.use('/api', paymentRoutes);
// Mount gift cards routes under /api/giftcards
app.use('/api/giftcards', giftCardRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'E-commerce API is running' });
});

// Test endpoint to verify server is working
app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'API is working correctly', timestamp: new Date().toISOString() });
});

// 404 handler for API routes - always return JSON
app.use('/api/*', (req, res) => {
  res.status(404).json({ 
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}` 
  });
});

// General 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    message: 'Endpoint not found' 
  });
});

// Error handler middleware - always return JSON
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
