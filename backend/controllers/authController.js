const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// ✅ SIGNUP Controller (for users)
exports.signup = async (req, res) => {
  try {
    const { firstName, lastName, email, countryCode, mobileNumber, password } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !countryCode || !mobileNumber || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message:
          'Password must be at least 8 characters long and contain at least one letter and one number',
      });
    }

    // Validate phone number
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(mobileNumber)) {
      return res.status(400).json({ message: 'Invalid phone number format' });
    }

    // Check if user already exists
    const [existingUsers] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert into users table
    const [result] = await db.query(
      'INSERT INTO users (first_name, last_name, email, country_code, mobile_number, password_hash) VALUES (?, ?, ?, ?, ?, ?)',
      [firstName, lastName, email, countryCode, mobileNumber, passwordHash]
    );

    // Generate token
    const token = jwt.sign(
      { id: result.insertId, email, role: 'user' },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: result.insertId,
        firstName,
        lastName,
        email,
        countryCode,
        mobileNumber,
        role: 'user',
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// ✅ LOGIN Controller (checks both users and admin_users)
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Try users table
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

    if (users.length > 0) {
      const user = users[0];
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);

      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: 'user' },
        process.env.JWT_SECRET || 'default_secret',
        { expiresIn: '7d' }
      );

      return res.status(200).json({
        message: 'User login successful',
        token,
        user: {
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          countryCode: user.country_code,
          mobileNumber: user.mobile_number,
          role: 'user',
        },
      });
    }

    // Try admin_users table
    const [admins] = await db.query('SELECT * FROM admin_users WHERE email = ?', [email]);

    if (admins.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const admin = admins[0];
    const isAdminPasswordValid = await bcrypt.compare(password, admin.password);

    if (!isAdminPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: admin.role },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      message: 'Admin login successful',
      token,
      user: {
        id: admin.id,
        username: admin.username,
        fullName: admin.full_name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};
