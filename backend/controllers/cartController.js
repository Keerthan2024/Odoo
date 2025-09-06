const Cart = require('../models/Cart');
const Product = require('../models/Product');

class CartController {
  // Add product to cart
  static async addToCart(req, res, next) {
    try {
      const { product_id, quantity = 1 } = req.body;
      const user_id = req.user.id;

      // Validate input
      if (!product_id) {
        return res.status(400).json({
          success: false,
          message: 'Product ID is required'
        });
      }

      if (quantity < 1) {
        return res.status(400).json({
          success: false,
          message: 'Quantity must be at least 1'
        });
      }

      // Check if product exists and is active
      const product = await Product.findById(product_id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      // Check if user is trying to add their own product
      if (product.seller_id === user_id) {
        return res.status(400).json({
          success: false,
          message: 'You cannot add your own product to cart'
        });
      }

      // Add to cart
      const cartData = {
        user_id: user_id,
        product_id: product_id,
        quantity: parseInt(quantity),
        price: product.price
      };

      const cartItem = await Cart.addToCart(cartData);

      res.status(201).json({
        success: true,
        message: 'Product added to cart successfully',
        data: {
          cart_item: cartItem.getSafeCartData()
        }
      });
    } catch (error) {
      console.error('Add to cart error:', error);
      next(error);
    }
  }

  // Get user's cart
  static async getCart(req, res, next) {
    try {
      const user_id = req.user.id;

      const cartItems = await Cart.getUserCart(user_id);
      const cartSummary = await Cart.getCartSummary(user_id);

      res.status(200).json({
        success: true,
        data: {
          cart_items: cartItems.map(item => item.getSafeCartData()),
          summary: cartSummary
        }
      });
    } catch (error) {
      console.error('Get cart error:', error);
      next(error);
    }
  }

  // Update cart item quantity
  static async updateCartItem(req, res, next) {
    try {
      const { id } = req.params;
      const { quantity } = req.body;
      const user_id = req.user.id;

      if (!quantity || quantity < 1) {
        return res.status(400).json({
          success: false,
          message: 'Valid quantity is required'
        });
      }

      // Get cart item and verify ownership
      const cartItem = await Cart.getCartItemById(id);
      if (!cartItem) {
        return res.status(404).json({
          success: false,
          message: 'Cart item not found'
        });
      }

      if (cartItem.user_id !== user_id) {
        return res.status(403).json({
          success: false,
          message: 'You can only update your own cart items'
        });
      }

      // Update quantity
      const updatedItem = await cartItem.updateQuantity(parseInt(quantity));

      res.status(200).json({
        success: true,
        message: 'Cart item updated successfully',
        data: {
          cart_item: updatedItem.getSafeCartData()
        }
      });
    } catch (error) {
      console.error('Update cart item error:', error);
      next(error);
    }
  }

  // Remove item from cart
  static async removeFromCart(req, res, next) {
    try {
      const { id } = req.params;
      const user_id = req.user.id;

      // Get cart item and verify ownership
      const cartItem = await Cart.getCartItemById(id);
      if (!cartItem) {
        return res.status(404).json({
          success: false,
          message: 'Cart item not found'
        });
      }

      if (cartItem.user_id !== user_id) {
        return res.status(403).json({
          success: false,
          message: 'You can only remove your own cart items'
        });
      }

      await cartItem.removeFromCart();

      res.status(200).json({
        success: true,
        message: 'Item removed from cart successfully'
      });
    } catch (error) {
      console.error('Remove from cart error:', error);
      next(error);
    }
  }

  // Clear cart
  static async clearCart(req, res, next) {
    try {
      const user_id = req.user.id;

      await Cart.clearUserCart(user_id);

      res.status(200).json({
        success: true,
        message: 'Cart cleared successfully'
      });
    } catch (error) {
      console.error('Clear cart error:', error);
      next(error);
    }
  }

  // Get cart summary
  static async getCartSummary(req, res, next) {
    try {
      const user_id = req.user.id;

      const summary = await Cart.getCartSummary(user_id);

      res.status(200).json({
        success: true,
        data: {
          summary: summary
        }
      });
    } catch (error) {
      console.error('Get cart summary error:', error);
      next(error);
    }
  }
}

module.exports = CartController;
