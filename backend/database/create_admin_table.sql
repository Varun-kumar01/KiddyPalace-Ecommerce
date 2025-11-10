-- Create admin table for admin authentication
CREATE TABLE IF NOT EXISTS admin_users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  role VARCHAR(20) DEFAULT 'admin',
  is_active BOOLEAN DEFAULT true,
  last_login DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default admin user (password: admin123)
-- Password is hashed using bcrypt
INSERT INTO admin_users (username, email, password, full_name, role) 
VALUES (
  'admin', 
  'admin@toysstore.com', 
  '$2a$10$/QumeYWfpPgTeykLyNwFpOhcpzFnKHrO2Fxub0n2o63hsKkOyumtO', 
  'Store Administrator',
  'super_admin'
);

-- Note: The default password is 'admin123'
-- Please change this after first login!

-- Add indexes for performance
CREATE INDEX idx_admin_username ON admin_users(username);
CREATE INDEX idx_admin_email ON admin_users(email);
CREATE INDEX idx_admin_active ON admin_users(is_active);
