const database = require('../config/database');

class Cart {
  constructor(cartData) {
    this.id = cartData.id;
    this.user_id = cartData.user_id;
    this.product_id = cartData.product_id;
    this.quantity = cartData.quantity;
    this.price = cartData.price;
    this.total = cartData.total;
    this.created_at = cartData.created_at;
    this.updated_at = cartData.updated_at;
    // Product details from JOIN
    this.product_title = cartData.product_title;
    this.product_image = cartData.product_image;
    this.product_category = cartData.product_category;
  }

  // Add product to cart
  static async addToCart(cartData) {
    try {
      const pool = database.getPool();
      
      // Check if item already exists in cart
      const [existingItems] = await pool.execute(
        'SELECT * FROM cart WHERE user_id = ? AND product_id = ?',
        [cartData.user_id, cartData.product_id]
      );

      if (existingItems.length > 0) {
        // Update existing item quantity
        const newQuantity = existingItems[0].quantity + cartData.quantity;
        const newTotal = newQuantity * cartData.price;
        
        await pool.execute(
          'UPDATE cart SET quantity = ?, total = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [newQuantity, newTotal, existingItems[0].id]
        );
        
        return await Cart.getCartItemById(existingItems[0].id);
      } else {
        // Add new item to cart
        const total = cartData.quantity * cartData.price;
        
        const [result] = await pool.execute(
          'INSERT INTO cart (user_id, product_id, quantity, price, total) VALUES (?, ?, ?, ?, ?)',
          [cartData.user_id, cartData.product_id, cartData.quantity, cartData.price, total]
        );
        
        return await Cart.getCartItemById(result.insertId);
      }
    } catch (error) {
      console.error('Add to cart error:', error);
      throw error;
    }
  }

  // Get cart item by ID
  static async getCartItemById(id) {
    try {
      const pool = database.getPool();
      const [rows] = await pool.execute(
        `SELECT c.*, p.title as product_title, p.image_url as product_image, p.category as product_category
         FROM cart c 
         JOIN products p ON c.product_id = p.id 
         WHERE c.id = ?`,
        [id]
      );

      return rows.length > 0 ? new Cart(rows[0]) : null;
    } catch (error) {
      throw error;
    }
  }

  // Get user's cart with product details
  static async getUserCart(userId) {
    try {
      const pool = database.getPool();
      const [rows] = await pool.execute(
        `SELECT c.*, p.title as product_title, p.image_url as product_image, 
                p.category as product_category, p.condition_status, p.brand
         FROM cart c 
         JOIN products p ON c.product_id = p.id 
         WHERE c.user_id = ? AND p.status = 'active'
         ORDER BY c.created_at DESC`,
        [userId]
      );

      return rows.map(row => new Cart(row));
    } catch (error) {
      throw error;
    }
  }

  // Update cart item quantity
  async updateQuantity(newQuantity) {
    try {
      const pool = database.getPool();
      const newTotal = newQuantity * this.price;
      
      await pool.execute(
        'UPDATE cart SET quantity = ?, total = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [newQuantity, newTotal, this.id]
      );
      
      return await Cart.getCartItemById(this.id);
    } catch (error) {
      throw error;
    }
  }

  // Remove item from cart
  async removeFromCart() {
    try {
      const pool = database.getPool();
      await pool.execute('DELETE FROM cart WHERE id = ?', [this.id]);
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Clear user's cart
  static async clearUserCart(userId) {
    try {
      const pool = database.getPool();
      await pool.execute('DELETE FROM cart WHERE user_id = ?', [userId]);
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Get cart summary
  static async getCartSummary(userId) {
    try {
      const pool = database.getPool();
      const [rows] = await pool.execute(
        `SELECT 
          COUNT(*) as item_count,
          SUM(quantity) as total_quantity,
          SUM(total) as subtotal
         FROM cart c 
         JOIN products p ON c.product_id = p.id 
         WHERE c.user_id = ? AND p.status = 'active'`,
        [userId]
      );

      return {
        item_count: rows[0].item_count || 0,
        total_quantity: rows[0].total_quantity || 0,
        subtotal: rows[0].subtotal || 0
      };
    } catch (error) {
      throw error;
    }
  }

  // Get safe cart data
  getSafeCartData() {
    return {
      id: this.id,
      user_id: this.user_id,
      product_id: this.product_id,
      quantity: this.quantity,
      price: this.price,
      total: this.total,
      created_at: this.created_at,
      updated_at: this.updated_at,
      product: {
        title: this.product_title,
        image_url: this.product_image,
        category: this.product_category
      }
    };
  }
}

module.exports = Cart;
