const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getPool, sql } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, affiliation, specialization } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required',
        data: null,
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
        data: null,
      });
    }

    const pool = await getPool();
    const checkResult = await pool
      .request()
      .input('email', sql.NVarChar, email)
      .query('SELECT User_ID FROM [User] WHERE Email = @email');

    if (checkResult.recordset.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered',
        data: null,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = role || 'Researcher';

    const result = await pool
      .request()
      .input('name', sql.NVarChar, name)
      .input('email', sql.NVarChar, email)
      .input('password', sql.NVarChar, hashedPassword)
      .input('role', sql.NVarChar, userRole)
      .query(
        'INSERT INTO [User] (Name, Email, Password, Role) VALUES (@name, @email, @password, @role); SELECT SCOPE_IDENTITY() as User_ID'
      );

    const userId = result.recordset[0].User_ID;

    // Insert into Researcher table with affiliation and specialization
    if (userRole === 'Researcher') {
      const joinDate = new Date();
      await pool
        .request()
        .input('researcherId', sql.Int, userId)
        .input('affiliation', sql.NVarChar, affiliation || null)
        .input('specialization', sql.NVarChar, specialization || null)
        .input('joinDate', sql.Date, joinDate)
        .query(
          'INSERT INTO Researcher (Researcher_ID, Affiliation, Specialization, Join_Date) VALUES (@researcherId, @affiliation, @specialization, @joinDate)'
        );
    }

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: { userId, email, name, role: userRole },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      data: null,
    });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
        data: null,
      });
    }

    const pool = await getPool();
    const result = await pool
      .request()
      .input('email', sql.NVarChar, email)
      .query('SELECT User_ID, Name, Email, Password, Role FROM [User] WHERE Email = @email');

    if (result.recordset.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        data: null,
      });
    }

    const user = result.recordset[0];
    
    const passwordMatch = await bcrypt.compare(password, user.Password);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        data: null,
      });
    }

    const token = jwt.sign(
      {
        userId: user.User_ID,
        email: user.Email,
        name: user.Name,
        role: user.Role,
      },
      process.env.JWT_SECRET || 'your-secret-key-change-this',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          userId: user.User_ID,
          name: user.Name,
          email: user.Email,
          role: user.Role,
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      data: null,
    });
  }
});

router.get('/me', authenticateToken, async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('userId', sql.Int, req.user.userId)
      .query('SELECT User_ID, Name, Email, Role FROM [User] WHERE User_ID = @userId');

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        data: null,
      });
    }

    res.json({
      success: true,
      message: 'User profile retrieved',
      data: result.recordset[0],
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user profile',
      data: null,
    });
  }
});

module.exports = router;