# Database Setup Instructions

## Complete Order Flow - Database Update

Follow these steps to update your database for the complete order flow:

### Option 1: Fresh Installation (Recommended for new projects)

```sql
-- 1. Drop old orders table if exists
DROP TABLE IF EXISTS orders;

-- 2. Create new orders table
CREATE TABLE orders_new (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  order_number VARCHAR(50) UNIQUE,
  total_amount DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  gst_amount DECIMAL(10, 2) NOT NULL,
  
  shipping_full_name VARCHAR(255) NOT NULL,
  shipping_email VARCHAR(255) NOT NULL,
  shipping_phone VARCHAR(20) NOT NULL,
  shipping_address TEXT NOT NULL,
  shipping_city VARCHAR(100) NOT NULL,
  shipping_state VARCHAR(100),
  shipping_zip_code VARCHAR(20) NOT NULL,
  shipping_country VARCHAR(100) DEFAULT 'India',
  
  payment_method VARCHAR(50) NOT NULL,
  payment_status VARCHAR(50) DEFAULT 'pending',
  payment_details JSON,
  
  order_status VARCHAR(50) DEFAULT 'pending',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 3. Create order_items table
CREATE TABLE order_items (
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

-- 4. Rename the table
ALTER TABLE orders_new RENAME TO orders;
```

### Option 2: If you have existing orders to migrate

```sql
-- 1. Create new table with different name
-- Run the CREATE TABLE orders_new statement from Option 1

-- 2. Create order_items table
-- Run the CREATE TABLE order_items statement from Option 1

-- 3. Update your backend code to use 'orders_new' instead of 'orders'
-- Or manually migrate data and rename tables

-- 4. Later, drop old table
-- DROP TABLE orders_old;
```

### How to run these commands:

1. **Using MySQL Workbench:**
   - Open MySQL Workbench
   - Connect to your database
   - Open a new SQL tab
   - Copy and paste the SQL commands
   - Execute

2. **Using Command Line:**
   ```bash
   mysql -u root -p ecommerce_db < backend/database/update_orders_schema.sql
   ```

3. **Using phpMyAdmin:**
   - Open phpMyAdmin
   - Select `ecommerce_db` database
   - Go to SQL tab
   - Paste the commands
   - Click Go

### Verify Installation:

```sql
-- Check if tables exist
SHOW TABLES;

-- Check orders table structure
DESCRIBE orders;

-- Check order_items table structure
DESCRIBE order_items;

-- Test query
SELECT * FROM orders LIMIT 1;
SELECT * FROM order_items LIMIT 1;
```

### Important Notes:

1. **Backup First:** Always backup your database before making schema changes
   ```bash
   mysqldump -u root -p ecommerce_db > backup_before_update.sql
   ```

2. **Table Name:** The backend code now uses `orders_new` table. After running the SQL, either:
   - Rename `orders_new` to `orders`, OR
   - Keep the name and update all backend references

3. **Foreign Keys:** Make sure:
   - `users` table exists with `id` column
   - `products` table exists with `id` column

4. **Test After Update:**
   - Try placing a test order from the e-commerce site
   - Check if data is being inserted correctly
   - Verify stock is being updated

### Troubleshooting:

**Error: Table 'orders' already exists**
- Solution: Drop the old table first or rename it
  ```sql
  ALTER TABLE orders RENAME TO orders_backup;
  ```

**Error: Foreign key constraint fails**
- Solution: Check if referenced tables (users, products) exist
- Verify column types match

**Error: Cannot add foreign key constraint**
- Solution: Remove foreign keys temporarily
  ```sql
  -- Create table without foreign keys
  -- Add foreign keys later with ALTER TABLE
  ```
