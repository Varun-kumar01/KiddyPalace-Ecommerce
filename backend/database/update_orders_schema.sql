-- Update orders table to support complete order flow
-- Run this script in your MySQL database

-- First, create a new orders table with all required fields
CREATE TABLE IF NOT EXISTS orders_new (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  order_number VARCHAR(50) UNIQUE,
  total_amount DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  gst_amount DECIMAL(10, 2) NOT NULL,
  
  -- Shipping Address
  shipping_full_name VARCHAR(255) NOT NULL,
  shipping_email VARCHAR(255) NOT NULL,
  shipping_phone VARCHAR(20) NOT NULL,
  shipping_address TEXT NOT NULL,
  shipping_city VARCHAR(100) NOT NULL,
  shipping_state VARCHAR(100),
  shipping_zip_code VARCHAR(20) NOT NULL,
  shipping_country VARCHAR(100) DEFAULT 'India',
  
  -- Payment Information
  payment_method VARCHAR(50) NOT NULL, -- 'upi', 'card', 'netbanking', 'cod'
  payment_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  payment_details JSON, -- Store additional payment info
  
  -- Order Status
  order_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'shipped', 'delivered', 'cancelled'
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Create order_items table to store multiple products per order
CREATE TABLE IF NOT EXISTS order_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  product_price DECIMAL(10, 2) NOT NULL,
  quantity INT NOT NULL,
  item_total DECIMAL(10, 2) NOT NULL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (order_id) REFERENCES orders_new(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);

-- If you want to migrate existing orders (optional)
-- INSERT INTO orders_new (user_id, order_number, total_amount, subtotal, gst_amount, 
--                         shipping_full_name, shipping_email, shipping_phone, 
--                         shipping_address, shipping_city, shipping_zip_code,
--                         payment_method, order_status, created_at)
-- SELECT user_id, 
--        CONCAT('ORD', LPAD(id, 6, '0')), 
--        total_price, 
--        total_price / 1.18, 
--        total_price - (total_price / 1.18),
--        'Unknown', 
--        'unknown@email.com', 
--        '0000000000',
--        'Address not available', 
--        'Unknown', 
--        '000000',
--        'cod',
--        status,
--        created_at
-- FROM orders;

-- Drop old orders table (only after data migration if needed)
-- DROP TABLE IF EXISTS orders;

-- Rename new table
-- ALTER TABLE orders_new RENAME TO orders;

-- Note: If you already have an 'orders' table, you may need to:
-- 1. Back up your existing orders table
-- 2. Drop the old table
-- 3. Create this new structure
-- Or rename the new table to something like 'orders_v2' and update the code accordingly
