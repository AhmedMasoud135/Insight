const express = require('express');
const { getPool, sql } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const router = express.Router();

router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.User_ID || req.user.id;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user token',
        data: null,
      });
    }
    
    const pool = await getPool();
    
    const result = await pool
      .request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT 
          u.User_ID as userId,
          u.Name as name,
          u.Email as email,
          u.Role as role,
          u.Photo as photo,
          r.Affiliation as affiliation,
          r.Specialization as specialization
        FROM [User] u
        LEFT JOIN Researcher r ON u.User_ID = r.Researcher_ID
        WHERE u.User_ID = @userId
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        data: null,
      });
    }
    
    const userData = result.recordset[0];
    
    if (userData.photo) {
      userData.photo = Buffer.from(userData.photo).toString('base64');
    }
    
    const reviewsResult = await pool
      .request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT TOP 3
          r.Review_ID as reviewId,
          r.Rating as rating,
          r.Review_Date as reviewDate,
          p.Paper_ID as paperId,
          p.Title as paperTitle,
          p.Publication_Date as publicationDate
        FROM Review r
        INNER JOIN Paper p ON r.Paper_ID = p.Paper_ID
        WHERE r.Researcher_ID = @userId
        ORDER BY r.Review_ID DESC
      `);
    
    const downloadsResult = await pool
      .request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT TOP 3
          d.Download_ID as downloadId,
          d.Download_Date as downloadDate,
          p.Paper_ID as paperId,
          p.Title as paperTitle,
          p.Publication_Date as publicationDate,
          p.Abstract as abstract
        FROM Download d
        INNER JOIN Paper p ON d.Paper_ID = p.Paper_ID
        WHERE d.Researcher_ID = @userId
        ORDER BY d.Download_ID DESC
      `);
    
    userData.recentReviews = reviewsResult.recordset;
    userData.recentDownloads = downloadsResult.recordset;
    
    res.json({
      success: true,
      message: 'User profile fetched successfully',
      data: userData,
    });
  } catch (error) {
    console.error('Fetch profile error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message,
      data: null,
    });
  }
});

router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.User_ID || req.user.id;
    const { name, affiliation, specialization, photo } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user token',
        data: null,
      });
    }
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Name is required',
        data: null,
      });
    }
    
    const pool = await getPool();
    
    let photoBuffer = null;
    if (photo) {
      const base64Data = photo.replace(/^data:image\/\w+;base64,/, '');
      photoBuffer = Buffer.from(base64Data, 'base64');
    }
    
    const updateUserQuery = photoBuffer 
      ? 'UPDATE [User] SET Name = @name, Photo = @photo WHERE User_ID = @userId'
      : 'UPDATE [User] SET Name = @name WHERE User_ID = @userId';
    
    const request = pool
      .request()
      .input('userId', sql.Int, userId)
      .input('name', sql.NVarChar, name);
    
    if (photoBuffer) {
      request.input('photo', sql.VarBinary, photoBuffer);
    }
    
    await request.query(updateUserQuery);
    
    const checkResearcher = await pool
      .request()
      .input('userId', sql.Int, userId)
      .query('SELECT Researcher_ID FROM Researcher WHERE Researcher_ID = @userId');
    
    if (checkResearcher.recordset.length > 0) {
      await pool
        .request()
        .input('userId', sql.Int, userId)
        .input('affiliation', sql.NVarChar, affiliation || null)
        .input('specialization', sql.NVarChar, specialization || null)
        .query(`
          UPDATE Researcher 
          SET Affiliation = @affiliation, Specialization = @specialization 
          WHERE Researcher_ID = @userId
        `);
    } else if (affiliation || specialization) {
      await pool
        .request()
        .input('userId', sql.Int, userId)
        .input('affiliation', sql.NVarChar, affiliation || null)
        .input('specialization', sql.NVarChar, specialization || null)
        .input('joinDate', sql.Date, new Date())
        .query(`
          INSERT INTO Researcher (Researcher_ID, Affiliation, Specialization, Join_Date)
          VALUES (@userId, @affiliation, @specialization, @joinDate)
        `);
    }
    
    res.json({
      success: true,
      message: 'User profile updated successfully',
      data: { userId, name, affiliation, specialization },
    });
  } catch (error) {
    console.error('Update profile error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message,
      data: null,
    });
  }
});

router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.User_ID || req.user.id;
    const { currentPassword, newPassword } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user token',
        data: null,
      });
    }
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required',
        data: null,
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters',
        data: null,
      });
    }
    
    const pool = await getPool();
    
    const userResult = await pool
      .request()
      .input('userId', sql.Int, userId)
      .query('SELECT Password FROM [User] WHERE User_ID = @userId');
    
    if (userResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        data: null,
      });
    }
    
    const user = userResult.recordset[0];
    const isPasswordValid = await bcrypt.compare(currentPassword, user.Password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
        data: null,
      });
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await pool
      .request()
      .input('userId', sql.Int, userId)
      .input('password', sql.NVarChar, hashedPassword)
      .query('UPDATE [User] SET Password = @password WHERE User_ID = @userId');
    
    res.json({
      success: true,
      message: 'Password updated successfully',
      data: null,
    });
  } catch (error) {
    console.error('Change password error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message,
      data: null,
    });
  }
});

router.delete('/account', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.User_ID || req.user.id;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user token',
        data: null,
      });
    }
    
    const pool = await getPool();
    
    await pool
      .request()
      .input('userId', sql.Int, userId)
      .query('DELETE FROM Review WHERE Researcher_ID = @userId');
    
    await pool
      .request()
      .input('userId', sql.Int, userId)
      .query('DELETE FROM Download WHERE Researcher_ID = @userId');
    
    await pool
      .request()
      .input('userId', sql.Int, userId)
      .query('DELETE FROM Search WHERE Researcher_ID = @userId');
    
    await pool
      .request()
      .input('userId', sql.Int, userId)
      .query('DELETE FROM Researcher WHERE Researcher_ID = @userId');
    
    await pool
      .request()
      .input('userId', sql.Int, userId)
      .query('DELETE FROM [User] WHERE User_ID = @userId');
    
    res.json({
      success: true,
      message: 'Account deleted successfully',
      data: null,
    });
  } catch (error) {
    console.error('Delete account error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message,
      data: null,
    });
  }
});

module.exports = router;