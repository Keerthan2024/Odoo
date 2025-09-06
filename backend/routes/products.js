const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/productController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { validateProduct, validateProductUpdate, validateSearch } = require('../middleware/validation');
const { handleImageUpload } = require('../middleware/upload');

// @route   GET /api/products
// @desc    Get all products with filters
// @access  Public
router.get('/', validateSearch, ProductController.getProducts);

// @route   GET /api/products/search
// @desc    Search products
// @access  Public
router.get('/search', validateSearch, ProductController.searchProducts);

// @route   GET /api/products/my
// @desc    Get current user's products
// @access  Private
router.get('/my', authenticateToken, ProductController.getUserProducts);

// @route   POST /api/products
// @desc    Create a new product
// @access  Private
router.post('/', authenticateToken, handleImageUpload, validateProduct, ProductController.createProduct);

// NEW: Cleanup route to remove duplicate products
// @route   DELETE /api/products/cleanup-duplicates
// @desc    Remove duplicate products, keeping one copy of each
// @access  Private
router.delete('/cleanup-duplicates', authenticateToken, async (req, res) => {
  try {
    const database = require('../config/database');
    const pool = database.getPool();
    
    console.log('🧹 Starting duplicate cleanup...');
    
    // Delete duplicates, keep the one with lowest ID
    const [result] = await pool.execute(`
      DELETE p1 FROM products p1
      INNER JOIN products p2 
      ON p1.title = p2.title 
      AND p1.seller_id = p2.seller_id 
      AND p1.price = p2.price
      AND p1.id > p2.id
    `);
    
    console.log('✅ Cleanup completed. Removed', result.affectedRows, 'duplicate products');
    
    res.json({ 
      success: true, 
      message: `Successfully removed ${result.affectedRows} duplicate products`,
      duplicates_removed: result.affectedRows
    });
  } catch (error) {
    console.error('❌ Cleanup error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to clean up duplicates',
      error: error.message 
    });
  }
});

// @route   GET /api/products/:id
// @desc    Get single product by ID
// @access  Public
router.get('/:id', ProductController.getProductById);

// @route   PUT /api/products/:id
// @desc    Update product
// @access  Private (owner only)
router.put('/:id', authenticateToken, handleImageUpload, validateProductUpdate, ProductController.updateProduct);

// @route   DELETE /api/products/:id
// @desc    Delete product
// @access  Private (owner only)
router.delete('/:id', authenticateToken, ProductController.deleteProduct);

module.exports = router;
