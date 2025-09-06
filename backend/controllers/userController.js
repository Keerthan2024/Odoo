const User = require('../models/User');
const bcrypt = require('bcryptjs');

class UserController {
  // Get user profile (already handled in auth, but extended version)
  static async getUserProfile(req, res, next) {
    try {
      const user = await User.findById(req.user.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.status(200).json({
        success: true,
        data: {
          user: user.getSafeUserData()
        }
      });
    } catch (error) {
      console.error('Get user profile error:', error);
      next(error);
    }
  }

  // Update user profile
  static async updateProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const updateData = req.body;

      // Remove sensitive fields that shouldn't be updated directly
      delete updateData.password;
      delete updateData.id;
      delete updateData.created_at;
      delete updateData.updated_at;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const updatedUser = await user.update(updateData);

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: updatedUser.getSafeUserData()
        }
      });
    } catch (error) {
      console.error('Update profile error:', error);
      next(error);
    }
  }

  // Change password
  static async changePassword(req, res, next) {
    try {
      const { current_password, new_password } = req.body;
      const userId = req.user.id;

      // Validate input
      if (!current_password || !new_password) {
        return res.status(400).json({
          success: false,
          message: 'Current password and new password are required'
        });
      }

      if (new_password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 6 characters long'
        });
      }

      // Get user with password
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(current_password, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      // Hash new password
      const saltRounds = 12;
      const hashedNewPassword = await bcrypt.hash(new_password, saltRounds);

      // Update password
      await user.update({ password: hashedNewPassword });

      res.status(200).json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      console.error('Change password error:', error);
      next(error);
    }
  }

  // Delete user account
  static async deleteAccount(req, res, next) {
    try {
      const { password } = req.body;
      const userId = req.user.id;

      if (!password) {
        return res.status(400).json({
          success: false,
          message: 'Password is required to delete account'
        });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Password is incorrect'
        });
      }

      // Soft delete user account
      await user.update({ status: 'inactive' });

      res.status(200).json({
        success: true,
        message: 'Account deleted successfully'
      });
    } catch (error) {
      console.error('Delete account error:', error);
      next(error);
    }
  }

  // Get user's dashboard stats
  static async getDashboardStats(req, res, next) {
    try {
      const userId = req.user.id;

      // Get stats from database
      const database = require('../config/database');
      const pool = database.getPool();

      // Get products count
      const [productsResult] = await pool.execute(
        'SELECT COUNT(*) as products_count FROM products WHERE seller_id = ? AND status = "active"',
        [userId]
      );

      // Get cart items count
      const [cartResult] = await pool.execute(
        'SELECT COUNT(*) as cart_items FROM cart WHERE user_id = ?',
        [userId]
      );

      // Get total cart value
      const [cartValueResult] = await pool.execute(
        'SELECT SUM(total) as cart_total FROM cart WHERE user_id = ?',
        [userId]
      );

      res.status(200).json({
        success: true,
        data: {
          stats: {
            products_listed: productsResult[0].products_count || 0,
            cart_items: cartResult[0].cart_items || 0,
            cart_total: cartValueResult[0].cart_total || 0
          }
        }
      });
    } catch (error) {
      console.error('Get dashboard stats error:', error);
      next(error);
    }
  }
}

module.exports = UserController;
