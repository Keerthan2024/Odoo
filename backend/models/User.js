const database = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/config');

class User {
  constructor(userData) {
    this.id = userData.id;
    this.username = userData.username;
    this.email = userData.email;
    this.password_hash = userData.password_hash;
    this.profile_picture = userData.profile_picture;
    this.created_at = userData.created_at;
    this.updated_at = userData.updated_at;
  }

  // Create a new user
  static async create(userData) {
    const { username, email, password } = userData;
    
    try {
      // Hash the password
      const saltRounds = 12;
      const password_hash = await bcrypt.hash(password, saltRounds);
      
      const pool = database.getPool();
      const [result] = await pool.execute(
        'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
        [username, email, password_hash]
      );
      
      // Get the created user
      const [rows] = await pool.execute(
        'SELECT id, username, email, profile_picture, created_at FROM users WHERE id = ?',
        [result.insertId]
      );
      
      return new User(rows[0]);
    } catch (error) {
      throw error;
    }
  }

  // Find user by email
  static async findByEmail(email) {
    try {
      const pool = database.getPool();
      const [rows] = await pool.execute(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );
      
      return rows.length > 0 ? new User(rows[0]) : null;
    } catch (error) {
      throw error;
    }
  }

  // Find user by ID
  static async findById(id) {
    try {
      const pool = database.getPool();
      const [rows] = await pool.execute(
        'SELECT id, username, email, profile_picture, created_at, updated_at FROM users WHERE id = ?',
        [id]
      );
      
      return rows.length > 0 ? new User(rows[0]) : null;
    } catch (error) {
      throw error;
    }
  }

  // Verify password
  async verifyPassword(password) {
    return await bcrypt.compare(password, this.password_hash);
  }

  // Generate JWT token
  generateToken() {
    return jwt.sign(
      { 
        id: this.id, 
        username: this.username, 
        email: this.email 
      },
      process.env.JWT_SECRET || 'ecofinds-secret-key',
      { expiresIn: '7d' }
    );
  }

  // Get user's safe data (without password)
  getSafeUserData() {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
      profile_picture: this.profile_picture,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = User;
