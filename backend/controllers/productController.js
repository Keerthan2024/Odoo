const Product = require('../models/Product');
const path = require('path');

class ProductController {
  // Create a new product
  static async createProduct(req, res, next) {
    try {
      const productData = {
        ...req.body,
        seller_id: req.user.id,
        image_url: req.file ? `/uploads/products/${req.file.filename}` : null
      };

      const product = await Product.create(productData);

      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: {
          product: product.getSafeProductData()
        }
      });
    } catch (error) {
      console.error('Product creation error:', error);
      next(error);
    }
  }

  // Get all products with filters - ENHANCED ERROR HANDLING
  static async getProducts(req, res, next) {
    try {
      console.log('📥 GET /products request received');
      console.log('📝 Query parameters:', req.query);
      
      // For now, ignore filters and just get all products
      const filters = {};
      
      console.log('🔄 Calling Product.findAll...');
      const products = await Product.findAll(filters);
      
      console.log('✅ Successfully fetched', products.length, 'products');
      
      const response = {
        success: true,
        data: {
          products: products.map(product => product.getSafeProductData()),
          count: products.length
        }
      };
      
      console.log('📤 Sending response:', response.data.count, 'products');
      res.status(200).json(response);
      
    } catch (error) {
      console.error('❌ CONTROLLER ERROR in getProducts:');
      console.error('- Error object:', error);
      console.error('- Error message:', error.message);
      console.error('- Error stack:', error.stack);
      
      // Pass error to global error handler
      next(error);
    }
  }

  // Get single product by ID
  static async getProductById(req, res, next) {
    try {
      const product = await Product.findById(req.params.id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      res.status(200).json({
        success: true,
        data: {
          product: product.getSafeProductData()
        }
      });
    } catch (error) {
      console.error('Get product error:', error);
      next(error);
    }
  }

  // Update product (only by owner)
  static async updateProduct(req, res, next) {
    try {
      const product = await Product.findById(req.params.id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      // Check ownership
      if (product.seller_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'You can only update your own products'
        });
      }

      const updateData = { ...req.body };
      
      // If new image uploaded, update image_url
      if (req.file) {
        updateData.image_url = `/uploads/products/${req.file.filename}`;
      }

      const updatedProduct = await product.update(updateData);

      res.status(200).json({
        success: true,
        message: 'Product updated successfully',
        data: {
          product: updatedProduct.getSafeProductData()
        }
      });
    } catch (error) {
      console.error('Product update error:', error);
      next(error);
    }
  }

  // Delete product (only by owner)
  static async deleteProduct(req, res, next) {
    try {
      const product = await Product.findById(req.params.id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      // Check ownership
      if (product.seller_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'You can only delete your own products'
        });
      }

      await product.delete();

      res.status(200).json({
        success: true,
        message: 'Product deleted successfully'
      });
    } catch (error) {
      console.error('Product deletion error:', error);
      next(error);
    }
  }

  // Get user's products (my listings)
  static async getUserProducts(req, res, next) {
    try {
      const filters = {
        limit: req.query.limit || 10,
        offset: req.query.offset || 0,
        category: req.query.category,
        condition_status: req.query.condition_status
      };

      const products = await Product.findBySeller(req.user.id, filters);

      res.status(200).json({
        success: true,
        data: {
          products: products.map(product => product.getSafeProductData()),
          count: products.length
        }
      });
    } catch (error) {
      console.error('Get user products error:', error);
      next(error);
    }
  }

  // Search products
  static async searchProducts(req, res, next) {
    try {
      const searchTerm = req.query.search;
      
      if (!searchTerm) {
        return res.status(400).json({
          success: false,
          message: 'Search term is required'
        });
      }

      const filters = {
        category: req.query.category,
        condition_status: req.query.condition_status,
        min_price: req.query.min_price,
        max_price: req.query.max_price,
        limit: req.query.limit || 10,
        offset: req.query.offset || 0
      };

      const products = await Product.search(searchTerm, filters);

      res.status(200).json({
        success: true,
        data: {
          products: products.map(product => product.getSafeProductData()),
          count: products.length,
          searchTerm: searchTerm
        }
      });
    } catch (error) {
      console.error('Search products error:', error);
      next(error);
    }
  }
}

module.exports = ProductController;
