const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// JWT Secret Key (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-admin-key-2025';

// Admin Login
const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    // Find admin user
    const [admins] = await db.query(
      'SELECT * FROM admin_users WHERE (username = ? OR email = ?) AND is_active = true',
      [username, username]
    );

    if (admins.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const admin = admins[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, admin.password);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    await db.query(
      'UPDATE admin_users SET last_login = NOW() WHERE id = ?',
      [admin.id]
    );

    // Generate JWT token
    const token = jwt.sign(
      {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Remove password from response
    delete admin.password;

    res.json({
      success: true,
      message: 'Login successful',
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        full_name: admin.full_name,
        role: admin.role,
        last_login: admin.last_login
      }
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

// Verify Admin Token (for protected routes)
const verifyAdmin = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Get admin details
    const [admins] = await db.query(
      'SELECT id, username, email, full_name, role, last_login FROM admin_users WHERE id = ? AND is_active = true',
      [decoded.id]
    );

    if (admins.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token or admin not found'
      });
    }

    res.json({
      success: true,
      admin: admins[0]
    });

  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

// Admin Logout (optional - mainly for updating last activity)
const adminLogout = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    // Update last activity (optional)
    await db.query(
      'UPDATE admin_users SET updated_at = NOW() WHERE id = ?',
      [decoded.id]
    );

    res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    res.json({
      success: true,
      message: 'Logout successful'
    });
  }
};

// Change Admin Password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const token = req.headers.authorization?.split(' ')[1];

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    // Get admin
    const [admins] = await db.query(
      'SELECT * FROM admin_users WHERE id = ? AND is_active = true',
      [decoded.id]
    );

    if (admins.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    const admin = admins[0];

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, admin.password);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await db.query(
      'UPDATE admin_users SET password = ? WHERE id = ?',
      [hashedPassword, admin.id]
    );

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while changing password'
    });
  }
};

// Create New Admin (only super_admin can do this)
const createAdmin = async (req, res) => {
  try {
    const { username, email, password, full_name, role } = req.body;
    const token = req.headers.authorization?.split(' ')[1];

    // Verify requester is super_admin
    const decoded = jwt.verify(token, JWT_SECRET);
    const [requesters] = await db.query(
      'SELECT role FROM admin_users WHERE id = ?',
      [decoded.id]
    );

    if (requesters.length === 0 || requesters[0].role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Only super admin can create new admins'
      });
    }

    // Validate input
    if (!username || !email || !password || !full_name) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Check if username or email already exists
    const [existing] = await db.query(
      'SELECT id FROM admin_users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Username or email already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new admin
    const [result] = await db.query(
      'INSERT INTO admin_users (username, email, password, full_name, role) VALUES (?, ?, ?, ?, ?)',
      [username, email, hashedPassword, full_name, role || 'admin']
    );

    res.json({
      success: true,
      message: 'Admin created successfully',
      adminId: result.insertId
    });

  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating admin'
    });
  }
};

module.exports = {
  adminLogin,
  verifyAdmin,
  adminLogout,
  changePassword,
  createAdmin,
  JWT_SECRET
};
