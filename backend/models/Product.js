const database = require('../config/database');

class Product {
  constructor(productData) {
    this.id = productData.id;
    this.title = productData.title;
    this.description = productData.description;
    this.category = productData.category;
    this.price = productData.price;
    this.quantity = productData.quantity;
    this.condition_status = productData.condition_status;
    this.year_of_manufacture = productData.year_of_manufacture;
    this.brand = productData.brand;
    this.model = productData.model;
    this.dimensions = productData.dimensions;
    this.weight = productData.weight;
    this.material = productData.material;
    this.original_packaging = productData.original_packaging;
    this.manual_included = productData.manual_included;
    this.working_condition_description = productData.working_condition_description;
    this.seller_id = productData.seller_id;
    this.image_url = productData.image_url;
    this.status = productData.status;
    this.created_at = productData.created_at;
    this.updated_at = productData.updated_at;
    this.seller_name = productData.seller_name;
    this.seller_email = productData.seller_email;
  }

  // UPDATED: Create product with duplicate prevention
  static async create(productData) {
    try {
      const pool = database.getPool();
      
      // CHECK FOR DUPLICATES FIRST
      const [existingProducts] = await pool.execute(
        'SELECT id FROM products WHERE title = ? AND seller_id = ? AND price = ?',
        [productData.title, productData.seller_id, productData.price]
      );

      if (existingProducts.length > 0) {
        throw new Error('A product with the same title and price already exists');
      }

      const preparedData = {
        title: productData.title || null,
        description: productData.description || null,
        category: productData.category || null,
        price: parseFloat(productData.price) || null,
        quantity: parseInt(productData.quantity) || 1,
        condition_status: productData.condition_status || null,
        year_of_manufacture: productData.year_of_manufacture ? parseInt(productData.year_of_manufacture) : null,
        brand: productData.brand || null,
        model: productData.model || null,
        dimensions: productData.dimensions || null,
        weight: productData.weight || null,
        material: productData.material || null,
        original_packaging: (productData.original_packaging === 'true' || productData.original_packaging === true) || false,
        manual_included: (productData.manual_included === 'true' || productData.manual_included === true) || false,
        working_condition_description: productData.working_condition_description || null,
        seller_id: productData.seller_id,
        image_url: productData.image_url || null
      };

      const [result] = await pool.execute(
        `INSERT INTO products (
          title, description, category, price, quantity, condition_status,
          year_of_manufacture, brand, model, dimensions, weight, material,
          original_packaging, manual_included, working_condition_description,
          seller_id, image_url, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          preparedData.title,
          preparedData.description,
          preparedData.category,
          preparedData.price,
          preparedData.quantity,
          preparedData.condition_status,
          preparedData.year_of_manufacture,
          preparedData.brand,
          preparedData.model,
          preparedData.dimensions,
          preparedData.weight,
          preparedData.material,
          preparedData.original_packaging,
          preparedData.manual_included,
          preparedData.working_condition_description,
          preparedData.seller_id,
          preparedData.image_url,
          'active'
        ]
      );

      return await Product.findById(result.insertId);
    } catch (error) {
      console.error('Product creation error:', error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      const pool = database.getPool();
      const [rows] = await pool.execute(
        `SELECT p.*, u.username as seller_name, u.email as seller_email
         FROM products p 
         JOIN users u ON p.seller_id = u.id 
         WHERE p.id = ?`,
        [id]
      );

      return rows.length > 0 ? new Product(rows[0]) : null;
    } catch (error) {
      throw error;
    }
  }

  // FIXED: Prevent duplicate results using GROUP BY
  static async findAll(filters = {}) {
    try {
      const pool = database.getPool();
      console.log('🔍 Starting product fetch with filters:', filters);
      
      // FIXED: Using GROUP BY to prevent duplicates
      let query = `
        SELECT p.id, p.title, p.description, p.category, p.price, 
               p.condition_status, p.brand, p.image_url, p.created_at,
               p.quantity, p.year_of_manufacture, p.model,
               u.username as seller_name
        FROM products p 
        INNER JOIN users u ON p.seller_id = u.id 
        WHERE p.status = ?
      `;
      
      let params = ['active'];

      // Add conditional filters
      if (filters.category && filters.category.trim()) {
        query += ' AND p.category = ?';
        params.push(filters.category.trim());
      }

      if (filters.condition_status && filters.condition_status.trim()) {
        query += ' AND p.condition_status = ?';
        params.push(filters.condition_status.trim());
      }

      if (filters.min_price && !isNaN(parseFloat(filters.min_price))) {
        query += ' AND p.price >= ?';
        params.push(parseFloat(filters.min_price));
      }

      if (filters.max_price && !isNaN(parseFloat(filters.max_price))) {
        query += ' AND p.price <= ?';
        params.push(parseFloat(filters.max_price));
      }

      if (filters.search && filters.search.trim()) {
        query += ' AND (p.title LIKE ? OR p.description LIKE ?)';
        const searchTerm = `%${filters.search.trim()}%`;
        params.push(searchTerm, searchTerm);
      }

      if (filters.seller_id && !isNaN(parseInt(filters.seller_id))) {
        query += ' AND p.seller_id = ?';
        params.push(parseInt(filters.seller_id));
      }

      // IMPORTANT: GROUP BY to prevent duplicates
      query += ' GROUP BY p.id ORDER BY p.created_at DESC LIMIT 50';
      
      console.log('🔍 Executing query:', query);
      console.log('📝 With parameters:', params);
      
      const [rows] = await pool.execute(query, params);
      
      console.log('✅ Query successful! Found', rows.length, 'unique products');
      console.log('🔢 Unique product IDs:', [...new Set(rows.map(r => r.id))].length);
      
      return rows.map(row => new Product(row));
      
    } catch (error) {
      console.error('❌ DETAILED ERROR in Product.findAll:', error);
      throw error;
    }
  }

  async update(updateData) {
    try {
      const pool = database.getPool();
      const setClause = [];
      const params = [];

      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined && key !== 'id') {
          setClause.push(`${key} = ?`);
          params.push(updateData[key]);
        }
      });

      if (setClause.length === 0) {
        throw new Error('No fields to update');
      }

      params.push(this.id);
      
      await pool.execute(
        `UPDATE products SET ${setClause.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        params
      );

      return await Product.findById(this.id);
    } catch (error) {
      throw error;
    }
  }

  async delete() {
    try {
      const pool = database.getPool();
      await pool.execute(
        'UPDATE products SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        ['inactive', this.id]
      );
      return true;
    } catch (error) {
      throw error;
    }
  }

  static async findBySeller(sellerId, filters = {}) {
    const mergedFilters = { ...filters, seller_id: sellerId };
    return await Product.findAll(mergedFilters);
  }

  static async search(searchTerm, filters = {}) {
    const mergedFilters = { ...filters, search: searchTerm };
    return await Product.findAll(mergedFilters);
  }

  getSafeProductData() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      category: this.category,
      price: this.price,
      quantity: this.quantity,
      condition_status: this.condition_status,
      year_of_manufacture: this.year_of_manufacture,
      brand: this.brand,
      model: this.model,
      dimensions: this.dimensions,
      weight: this.weight,
      material: this.material,
      original_packaging: this.original_packaging,
      manual_included: this.manual_included,
      working_condition_description: this.working_condition_description,
      seller_name: this.seller_name,
      image_url: this.image_url,
      status: this.status,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = Product;
