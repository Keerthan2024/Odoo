const mysql = require('mysql2/promise');
require('dotenv').config();

// FIXED - Removed deprecated MySQL2 configuration options
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Keer@2005',
  database: process.env.DB_NAME || 'ecofinds',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
};

class Database {
  constructor() {
    this.pool = null;
  }

  async connect() {
    try {
      this.pool = mysql.createPool(dbConfig);
      
      // Test the connection
      const connection = await this.pool.getConnection();
      console.log('✅ Database connected successfully');
      connection.release();
      
      // Create tables if they don't exist
      await this.createTables();
      
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      console.log('💡 Make sure MySQL is running and credentials in .env are correct');
      
      // In development, don't exit the process - allow server to continue
      if (process.env.NODE_ENV !== 'production') {
        console.log('🔄 Continuing without database connection in development mode');
      } else {
        process.exit(1);
      }
    }
  }

  async createTables() {
    if (!this.pool) {
      console.log('⚠️ No database connection available for table creation');
      return;
    }

    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        profile_picture VARCHAR(255),
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_username (username),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;

    const createProductsTable = `
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        category VARCHAR(50) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        quantity INT DEFAULT 1,
        condition_status VARCHAR(50),
        year_of_manufacture YEAR,
        brand VARCHAR(100),
        model VARCHAR(100),
        dimensions VARCHAR(100),
        weight VARCHAR(50),
        material VARCHAR(100),
        original_packaging BOOLEAN DEFAULT FALSE,
        manual_included BOOLEAN DEFAULT FALSE,
        working_condition_description TEXT,
        seller_id INT NOT NULL,
        image_url VARCHAR(255),
        status ENUM('active', 'sold', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_seller (seller_id),
        INDEX idx_category (category),
        INDEX idx_status (status),
        INDEX idx_price (price),
        INDEX idx_condition (condition_status),
        FULLTEXT idx_search (title, description)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;

    const createCartTable = `
      CREATE TABLE IF NOT EXISTS cart (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        price DECIMAL(10, 2) NOT NULL,
        total DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        INDEX idx_user_cart (user_id),
        INDEX idx_product_cart (product_id),
        UNIQUE KEY unique_user_product (user_id, product_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;

    const createPurchasesTable = `
      CREATE TABLE IF NOT EXISTS purchases (
        id INT AUTO_INCREMENT PRIMARY KEY,
        buyer_id INT NOT NULL,
        product_id INT NOT NULL,
        seller_id INT NOT NULL,
        purchase_price DECIMAL(10,2) NOT NULL,
        quantity INT DEFAULT 1,
        total_amount DECIMAL(10,2) NOT NULL,
        purchase_status ENUM('pending', 'completed', 'cancelled') DEFAULT 'completed',
        purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_buyer (buyer_id),
        INDEX idx_seller (seller_id),
        INDEX idx_product (product_id),
        INDEX idx_date (purchase_date),
        INDEX idx_status (purchase_status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;

    const createUserSessionsTable = `
      CREATE TABLE IF NOT EXISTS user_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token_hash VARCHAR(255) NOT NULL,
        device_info VARCHAR(255),
        ip_address VARCHAR(45),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_sessions (user_id),
        INDEX idx_token (token_hash),
        INDEX idx_active (is_active),
        INDEX idx_expires (expires_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;

    try {
      await this.pool.execute(createUsersTable);
      console.log('✅ Users table created/verified successfully');
      
      await this.pool.execute(createProductsTable);
      console.log('✅ Products table created/verified successfully');
      
      await this.pool.execute(createCartTable);
      console.log('✅ Cart table created/verified successfully');
      
      await this.pool.execute(createPurchasesTable);
      console.log('✅ Purchases table created/verified successfully');
      
      await this.pool.execute(createUserSessionsTable);
      console.log('✅ User sessions table created/verified successfully');
      
      console.log('✅ Database tables created/verified successfully');
    } catch (error) {
      console.error('❌ Error creating tables:', error);
      console.log('📝 Table creation details:', error.message);
    }
  }

  getPool() {
    return this.pool;
  }

  isConnected() {
    return this.pool !== null;
  }

  async safeExecute(query, params = []) {
    if (!this.pool) {
      throw new Error('Database connection not available');
    }
    
    try {
      return await this.pool.execute(query, params);
    } catch (error) {
      console.error('❌ Database query error:', error);
      throw error;
    }
  }

  async transaction(callback) {
    if (!this.pool) {
      throw new Error('Database connection not available');
    }

    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async healthCheck() {
    try {
      if (!this.pool) {
        return { status: 'disconnected', message: 'No connection pool' };
      }

      const [rows] = await this.pool.execute('SELECT 1 as health_check');
      return { 
        status: 'healthy', 
        message: 'Database connection is working',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return { 
        status: 'unhealthy', 
        message: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async getStats() {
    try {
      if (!this.pool) {
        return { error: 'No database connection' };
      }

      const [users] = await this.pool.execute('SELECT COUNT(*) as count FROM users WHERE status = "active"');
      const [products] = await this.pool.execute('SELECT COUNT(*) as count FROM products WHERE status = "active"');
      const [cartItems] = await this.pool.execute('SELECT COUNT(*) as count FROM cart');
      const [purchases] = await this.pool.execute('SELECT COUNT(*) as count FROM purchases');

      return {
        users: users[0].count,
        products: products[0].count,
        cart_items: cartItems[0].count,
        purchases: purchases[0].count,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting database stats:', error);
      return { error: error.message };
    }
  }
}

const database = new Database();
database.connect();

module.exports = database;
