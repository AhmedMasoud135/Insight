const express = require('express');
const { getPool, sql } = require('../config/database');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    let { page = 1, limit = 12, search } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    if (page < 1 || limit < 1 || limit > 100) {
      return res.status(400).json({ success: false, message: 'Invalid pagination parameters', data: null });
    }

    const offset = (page - 1) * limit;
    const pool = await getPool();

    let query = `
      SELECT
        a.Author_ID,
        a.First_Name,
        a.Last_Name,
        a.Email,
        a.Country,
        CASE WHEN a.Picture IS NOT NULL THEN 1 ELSE 0 END as Has_Picture,
        (SELECT COUNT(*) FROM Author_Paper ap WHERE ap.Author_ID = a.Author_ID) as Paper_Count
      FROM Author a
    `;

    let countQuery = `SELECT COUNT(*) as total FROM Author a`;

    const request = pool.request();
    const countRequest = pool.request();

    if (search && typeof search === 'string' && search.trim()) {
      const term = `%${search.trim()}%`;
      query += ` WHERE a.First_Name LIKE @search 
                 OR a.Last_Name LIKE @search 
                 OR a.Email LIKE @search 
                 OR a.Country LIKE @search 
                 OR CONCAT(a.First_Name, ' ', a.Last_Name) LIKE @search`;
      countQuery += ` WHERE a.First_Name LIKE @search 
                      OR a.Last_Name LIKE @search 
                      OR a.Email LIKE @search 
                      OR a.Country LIKE @search 
                      OR CONCAT(a.First_Name, ' ', a.Last_Name) LIKE @search`;
      request.input('search', sql.NVarChar(100), term);
      countRequest.input('search', sql.NVarChar(100), term);
    }

    query += ` ORDER BY a.Last_Name, a.First_Name OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;

    request.input('offset', sql.Int, offset);
    request.input('limit', sql.Int, limit);

    const result = await request.query(query);
    const countResult = await countRequest.query(countQuery);

    const total = countResult.recordset[0].total;

    res.json({
      success: true,
      message: 'Authors retrieved successfully',
      data: {
        authors: result.recordset,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    console.error('Get authors error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve authors',
      data: null,
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const authorId = parseInt(req.params.id);
    if (isNaN(authorId) || authorId < 1) return res.status(400).json({ success: false, message: 'Invalid author ID', data: null });

    const pool = await getPool();

    const authorResult = await pool.request()
      .input('authorId', sql.Int, authorId)
      .query(`
        SELECT a.Author_ID, a.First_Name, a.Last_Name, a.Email, a.Country,
               CASE WHEN a.Picture IS NOT NULL THEN 1 ELSE 0 END as Has_Picture,
               (SELECT COUNT(*) FROM Author_Paper ap WHERE ap.Author_ID = a.Author_ID) as Paper_Count
        FROM Author a WHERE a.Author_ID = @authorId
      `);

    if (authorResult.recordset.length === 0) return res.status(404).json({ success: false, message: 'Author not found', data: null });

    const author = authorResult.recordset[0];

    const papersResult = await pool.request()
      .input('authorId', sql.Int, authorId)
      .query(`
        SELECT p.Paper_ID, p.Title, p.Abstract, p.Publication_Date, f.Field_Name,
               (SELECT COUNT(*) FROM Download d WHERE d.Paper_ID = p.Paper_ID) as Download_Count,
               (SELECT AVG(CAST(Rating as FLOAT)) FROM Review r WHERE r.Paper_ID = p.Paper_ID) as Avg_Rating
        FROM Paper p
        INNER JOIN Author_Paper ap ON p.Paper_ID = ap.Paper_ID
        LEFT JOIN Field f ON p.Field_ID = f.Field_ID
        WHERE ap.Author_ID = @authorId
        ORDER BY p.Publication_Date DESC
      `);

    res.json({
      success: true,
      message: 'Author retrieved successfully',
      data: {
        Author_ID: author.Author_ID,
        First_Name: author.First_Name,
        Last_Name: author.Last_Name,
        Email: author.Email,
        Country: author.Country,
        Has_Picture: author.Has_Picture,
        Paper_Count: author.Paper_Count,
        papers: papersResult.recordset,
      },
    });
  } catch (error) {
    console.error('Get author error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve author', data: null });
  }
});

// New endpoint to get author image
router.get('/:id/image', async (req, res) => {
  try {
    const authorId = parseInt(req.params.id);
    if (isNaN(authorId) || authorId < 1) {
      return res.status(400).json({ success: false, message: 'Invalid author ID' });
    }

    const pool = await getPool();
    const result = await pool.request()
      .input('authorId', sql.Int, authorId)
      .query('SELECT Picture FROM Author WHERE Author_ID = @authorId');

    if (result.recordset.length === 0 || !result.recordset[0].Picture) {
      return res.status(404).json({ success: false, message: 'Image not found' });
    }

    const imageBuffer = result.recordset[0].Picture;
    
    // Set appropriate content type (assuming JPEG, adjust if needed)
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
    res.send(imageBuffer);
  } catch (error) {
    console.error('Get author image error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve image' });
  }
});

router.get('/:id/papers', async (req, res) => {
  try {
    const authorId = parseInt(req.params.id);
    let { page = 1, limit = 10 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    if (isNaN(authorId) || authorId < 1) return res.status(400).json({ success: false, message: 'Invalid author ID', data: null });
    if (page < 1 || limit < 1 || limit > 100) return res.status(400).json({ success: false, message: 'Invalid pagination', data: null });

    const offset = (page - 1) * limit;
    const pool = await getPool();

    const result = await pool.request()
      .input('authorId', sql.Int, authorId)
      .input('offset', sql.Int, offset)
      .input('limit', sql.Int, limit)
      .query(`
        SELECT p.Paper_ID, p.Title, p.Abstract, p.Publication_Date, f.Field_Name,
               (SELECT COUNT(*) FROM Download d WHERE d.Paper_ID = p.Paper_ID) as Download_Count,
               (SELECT AVG(CAST(Rating as FLOAT)) FROM Review r WHERE r.Paper_ID = p.Paper_ID) as Avg_Rating
        FROM Paper p
        INNER JOIN Author_Paper ap ON p.Paper_ID = ap.Paper_ID
        LEFT JOIN Field f ON p.Field_ID = f.Field_ID
        WHERE ap.Author_ID = @authorId
        ORDER BY p.Publication_Date DESC
        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
      `);

    const countResult = await pool.request()
      .input('authorId', sql.Int, authorId)
      .query(`SELECT COUNT(*) as total FROM Author_Paper WHERE Author_ID = @authorId`);

    const total = countResult.recordset[0].total;

    res.json({
      success: true,
      message: 'Author papers retrieved successfully',
      data: {
        papers: result.recordset,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    console.error('Get author papers error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve author papers', data: null });
  }
});

module.exports = router;