// backend/server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const adminAuthRoutes = require('./routes/adminAuth');
const categoryRoutes = require('./routes/categoryRoutes'); // <-- new
const paymentRoutes = require('./routes/paymentRoutes');

const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use(cors()); // allow requests from frontend (you can restrict origin later)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminAuthRoutes);
app.use('/api', productRoutes);
app.use('/api', categoryRoutes); // <-- register categories routes
app.use('/api', paymentRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'E-commerce API is running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
