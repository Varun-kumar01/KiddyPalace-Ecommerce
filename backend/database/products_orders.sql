-- Create products table for toys
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image LONGBLOB,
  image_type VARCHAR(50),
  category VARCHAR(100) DEFAULT 'toys',
  stock_quantity INT DEFAULT 0,
  age_range VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_category (category)
);

-- Insert sample toy products (without images initially)
INSERT INTO products (name, description, price, category, stock_quantity, age_range) VALUES
('Building Blocks Set', 'Colorful building blocks for creative play. Includes 100 pieces.', 29.99, 'toys', 50, '3-8 years'),
('Teddy Bear', 'Soft and cuddly teddy bear, perfect companion for kids.', 19.99, 'toys', 100, '0-5 years'),
('Remote Control Car', 'Fast RC car with rechargeable battery. Speed up to 20km/h.', 49.99, 'toys', 30, '6-12 years'),
('Puzzle Game', 'Educational puzzle with 500 pieces. Great for problem solving.', 24.99, 'toys', 75, '5-10 years'),
('Doll House', 'Beautiful wooden doll house with furniture included.', 89.99, 'toys', 20, '4-10 years'),
('Action Figure Set', 'Set of 5 superhero action figures with accessories.', 34.99, 'toys', 60, '5-12 years');

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  total_price DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_order_date (order_date)
);
