const express = require('express');
const { getPool, sql } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Cache configuration
const queryCache = new Map();
const CACHE_TTL = 300000; // 5 minutes for user data

function getCacheKey(params) {
  return JSON.stringify(params);
}

function getCachedQuery(key) {
  const cached = queryCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  queryCache.delete(key);
  return null;
}

function setCachedQuery(key, data) {
  queryCache.set(key, { data, timestamp: Date.now() });
  if (queryCache.size > 200) {
    const firstKey = queryCache.keys().next().value;
    queryCache.delete(firstKey);
  }
}

function invalidateUserCache(userId) {
  const keysToDelete = [];
  for (const key of queryCache.keys()) {
    if (key.includes(`"userId":${userId}`) || key.includes(`"researcherId":${userId}`)) {
      keysToDelete.push(key);
    }
  }
  keysToDelete.forEach(key => queryCache.delete(key));
}

// Record search query
router.post('/search', authenticateToken, async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
        data: null,
      });
    }

    const researcherId = req.user.userId;
    const role = req.user.role;

    if (role !== 'Researcher') {
      return res.status(200).json({
        success: true,
        message: 'Search performed but not recorded (user is not a researcher)',
        data: null,
      });
    }

    const pool = await getPool();

    await pool
      .request()
      .input('researcherId', sql.Int, researcherId)
      .input('query', sql.NVarChar(300), query.trim())
      .input('searchDate', sql.Date, new Date())
      .query(`
        INSERT INTO Search (Researcher_ID, Query, Search_Date)
        VALUES (@researcherId, @query, @searchDate)
      `);

    invalidateUserCache(researcherId);

    res.status(201).json({
      success: true,
      message: 'Search recorded successfully',
      data: null,
    });
  } catch (error) {
    console.error('Record search error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record search',
      data: null,
    });
  }
});

// Get user search history with enhanced filtering
router.get('/searches/user/:userId', authenticateToken, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const dateFrom = req.query.dateFrom;
    const dateTo = req.query.dateTo;
    const offset = (page - 1) * limit;

    if (req.user.userId !== userId && req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
        data: null,
      });
    }

    const cacheKey = getCacheKey({ userId, page, limit, dateFrom, dateTo, type: 'searches' });
    const cached = getCachedQuery(cacheKey);
    
    if (cached) {
      return res.json(cached);
    }

    const pool = await getPool();
    const request = pool.request();
    
    let whereClause = 'WHERE Researcher_ID = @userId';
    request.input('userId', sql.Int, userId);
    
    if (dateFrom) {
      whereClause += ' AND Search_Date >= @dateFrom';
      request.input('dateFrom', sql.Date, dateFrom);
    }
    if (dateTo) {
      whereClause += ' AND Search_Date <= @dateTo';
      request.input('dateTo', sql.Date, dateTo);
    }

    request.input('offset', sql.Int, offset);
    request.input('limit', sql.Int, limit);

    const result = await request.query(`
      SELECT Search_ID, Query, Search_Date
      FROM Search WITH (NOLOCK)
      ${whereClause}
      ORDER BY Search_Date DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);

    const countRequest = pool.request();
    countRequest.input('userId', sql.Int, userId);
    if (dateFrom) countRequest.input('dateFrom', sql.Date, dateFrom);
    if (dateTo) countRequest.input('dateTo', sql.Date, dateTo);

    const countResult = await countRequest.query(`
      SELECT COUNT(*) as total FROM Search WITH (NOLOCK) ${whereClause}
    `);

    const total = countResult.recordset[0].total;

    const response = {
      success: true,
      message: 'Search history retrieved successfully',
      data: {
        searches: result.recordset,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    };

    setCachedQuery(cacheKey, response);
    res.json(response);
  } catch (error) {
    console.error('Get search history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve search history',
      data: null,
    });
  }
});

// Get popular search terms
router.get('/searches/popular', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const days = parseInt(req.query.days) || 30;

    const cacheKey = getCacheKey({ popular: true, limit, days });
    const cached = getCachedQuery(cacheKey);
    
    if (cached) {
      return res.json(cached);
    }

    const pool = await getPool();
    const result = await pool
      .request()
      .input('limit', sql.Int, limit)
      .input('days', sql.Int, days)
      .query(`
        SELECT TOP (@limit)
          Query,
          COUNT(*) as Search_Count,
          COUNT(DISTINCT Researcher_ID) as Unique_Researchers,
          MAX(Search_Date) as Last_Searched
        FROM Search WITH (NOLOCK)
        WHERE Search_Date >= DATEADD(day, -@days, GETDATE())
        GROUP BY Query
        ORDER BY Search_Count DESC, Last_Searched DESC
      `);

    const response = {
      success: true,
      message: 'Popular searches retrieved successfully',
      data: {
        searches: result.recordset,
        period: `Last ${days} days`,
      },
    };

    setCachedQuery(cacheKey, response);
    res.json(response);
  } catch (error) {
    console.error('Get popular searches error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve popular searches',
      data: null,
    });
  }
});

// Record download
router.post('/downloads', authenticateToken, async (req, res) => {
  try {
    const { paperId } = req.body;
    const researcherId = req.user.userId;

    if (!paperId) {
      return res.status(400).json({
        success: false,
        message: 'Paper ID is required',
        data: null,
      });
    }

    const pool = await getPool();
    
    // Check if user is a researcher
    const researcherCheck = await pool
      .request()
      .input('researcherId', sql.Int, researcherId)
      .query('SELECT Researcher_ID FROM Researcher WHERE Researcher_ID = @researcherId');

    if (researcherCheck.recordset.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'User is not a researcher',
        data: null,
      });
    }

    // Check if paper exists
    const paperCheck = await pool
      .request()
      .input('paperId', sql.Int, paperId)
      .query('SELECT Paper_ID FROM Paper WHERE Paper_ID = @paperId');

    if (paperCheck.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Paper not found',
        data: null,
      });
    }

    const result = await pool
      .request()
      .input('paperId', sql.Int, paperId)
      .input('researcherId', sql.Int, researcherId)
      .input('downloadDate', sql.Date, new Date())
      .query(`
        INSERT INTO Download (Paper_ID, Researcher_ID, Download_Date)
        VALUES (@paperId, @researcherId, @downloadDate);
        SELECT SCOPE_IDENTITY() as Download_ID
      `);

    invalidateUserCache(researcherId);

    res.status(201).json({
      success: true,
      message: 'Download recorded successfully',
      data: { downloadId: result.recordset[0].Download_ID },
    });
  } catch (error) {
    console.error('Record download error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record download',
      data: null,
    });
  }
});

// Get user download history with enhanced details
router.get('/downloads/user/:userId', authenticateToken, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const fieldId = req.query.fieldId;
    const dateFrom = req.query.dateFrom;
    const dateTo = req.query.dateTo;
    const offset = (page - 1) * limit;

    if (req.user.userId !== userId && req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
        data: null,
      });
    }

    const cacheKey = getCacheKey({ 
      userId, page, limit, fieldId, dateFrom, dateTo, type: 'downloads' 
    });
    const cached = getCachedQuery(cacheKey);
    
    if (cached) {
      return res.json(cached);
    }

    const pool = await getPool();
    const request = pool.request();
    
    let whereClause = 'WHERE d.Researcher_ID = @userId';
    request.input('userId', sql.Int, userId);
    
    if (fieldId) {
      whereClause += ' AND p.Field_ID = @fieldId';
      request.input('fieldId', sql.Int, fieldId);
    }
    if (dateFrom) {
      whereClause += ' AND d.Download_Date >= @dateFrom';
      request.input('dateFrom', sql.Date, dateFrom);
    }
    if (dateTo) {
      whereClause += ' AND d.Download_Date <= @dateTo';
      request.input('dateTo', sql.Date, dateTo);
    }

    request.input('offset', sql.Int, offset);
    request.input('limit', sql.Int, limit);

    const result = await request.query(`
      SELECT 
        d.Download_ID, 
        d.Download_Date, 
        p.Paper_ID, 
        p.Title, 
        p.Abstract, 
        p.Publication_Date,
        f.Field_Name,
        f.Field_ID,
        ISNULL((SELECT AVG(CAST(Rating as FLOAT)) FROM Review WHERE Paper_ID = p.Paper_ID), 0) as Average_Rating,
        ISNULL((SELECT COUNT(*) FROM Author_Paper WHERE Paper_ID = p.Paper_ID), 0) as Author_Count
      FROM Download d WITH (NOLOCK)
      INNER JOIN Paper p WITH (NOLOCK) ON d.Paper_ID = p.Paper_ID
      LEFT JOIN Field f WITH (NOLOCK) ON p.Field_ID = f.Field_ID
      ${whereClause}
      ORDER BY d.Download_Date DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);

    const countRequest = pool.request();
    countRequest.input('userId', sql.Int, userId);
    if (fieldId) countRequest.input('fieldId', sql.Int, fieldId);
    if (dateFrom) countRequest.input('dateFrom', sql.Date, dateFrom);
    if (dateTo) countRequest.input('dateTo', sql.Date, dateTo);

    const countResult = await countRequest.query(`
      SELECT COUNT(*) as total 
      FROM Download d WITH (NOLOCK)
      INNER JOIN Paper p WITH (NOLOCK) ON d.Paper_ID = p.Paper_ID
      ${whereClause}
    `);

    const total = countResult.recordset[0].total;

    const response = {
      success: true,
      message: 'Download history retrieved successfully',
      data: {
        downloads: result.recordset,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    };

    setCachedQuery(cacheKey, response);
    res.json(response);
  } catch (error) {
    console.error('Get download history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve download history',
      data: null,
    });
  }
});

// Get download statistics for a user
router.get('/downloads/user/:userId/stats', authenticateToken, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    if (req.user.userId !== userId && req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
        data: null,
      });
    }

    const cacheKey = getCacheKey({ userId, type: 'downloadStats' });
    const cached = getCachedQuery(cacheKey);
    
    if (cached) {
      return res.json(cached);
    }

    const pool = await getPool();
    
    const [statsResult, fieldStatsResult, recentResult] = await Promise.all([
      // Overall statistics
      pool.request()
        .input('userId', sql.Int, userId)
        .query(`
          SELECT 
            COUNT(*) as Total_Downloads,
            COUNT(DISTINCT p.Field_ID) as Fields_Explored,
            COUNT(DISTINCT d.Paper_ID) as Unique_Papers,
            MIN(d.Download_Date) as First_Download,
            MAX(d.Download_Date) as Last_Download
          FROM Download d WITH (NOLOCK)
          INNER JOIN Paper p WITH (NOLOCK) ON d.Paper_ID = p.Paper_ID
          WHERE d.Researcher_ID = @userId
        `),
      
      // Downloads by field
      pool.request()
        .input('userId', sql.Int, userId)
        .query(`
          SELECT 
            f.Field_Name,
            f.Field_ID,
            COUNT(*) as Download_Count,
            COUNT(DISTINCT d.Paper_ID) as Unique_Papers
          FROM Download d WITH (NOLOCK)
          INNER JOIN Paper p WITH (NOLOCK) ON d.Paper_ID = p.Paper_ID
          INNER JOIN Field f WITH (NOLOCK) ON p.Field_ID = f.Field_ID
          WHERE d.Researcher_ID = @userId
          GROUP BY f.Field_Name, f.Field_ID
          ORDER BY Download_Count DESC
        `),
      
      // Recent activity (last 30 days)
      pool.request()
        .input('userId', sql.Int, userId)
        .query(`
          SELECT COUNT(*) as Recent_Downloads
          FROM Download WITH (NOLOCK)
          WHERE Researcher_ID = @userId
          AND Download_Date >= DATEADD(day, -30, GETDATE())
        `)
    ]);

    const response = {
      success: true,
      message: 'Download statistics retrieved successfully',
      data: {
        overall: statsResult.recordset[0],
        byField: fieldStatsResult.recordset,
        recentActivity: recentResult.recordset[0],
      },
    };

    setCachedQuery(cacheKey, response);
    res.json(response);
  } catch (error) {
    console.error('Get download stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve download statistics',
      data: null,
    });
  }
});

// Submit or update review
router.post('/reviews', authenticateToken, async (req, res) => {
  try {
    const { paperId, rating } = req.body;
    const researcherId = req.user.userId;

    if (!paperId || !rating) {
      return res.status(400).json({
        success: false,
        message: 'Paper ID and rating are required',
        data: null,
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5',
        data: null,
      });
    }

    const pool = await getPool();
    
    // Check if paper exists
    const paperCheck = await pool
      .request()
      .input('paperId', sql.Int, paperId)
      .query('SELECT Paper_ID FROM Paper WHERE Paper_ID = @paperId');

    if (paperCheck.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Paper not found',
        data: null,
      });
    }

    // Check if user already reviewed this paper
    const existingReview = await pool
      .request()
      .input('paperId', sql.Int, paperId)
      .input('researcherId', sql.Int, researcherId)
      .query('SELECT Review_ID FROM Review WHERE Paper_ID = @paperId AND Researcher_ID = @researcherId');

    if (existingReview.recordset.length > 0) {
      // Update existing review
      await pool
        .request()
        .input('reviewId', sql.Int, existingReview.recordset[0].Review_ID)
        .input('rating', sql.Int, rating)
        .query('UPDATE Review SET Rating = @rating, Review_Date = GETDATE() WHERE Review_ID = @reviewId');

      invalidateUserCache(researcherId);

      return res.json({
        success: true,
        message: 'Review updated successfully',
        data: { reviewId: existingReview.recordset[0].Review_ID },
      });
    }

    // Create new review
    const result = await pool
      .request()
      .input('paperId', sql.Int, paperId)
      .input('researcherId', sql.Int, researcherId)
      .input('rating', sql.Int, rating)
      .input('reviewDate', sql.Date, new Date())
      .query(`
        INSERT INTO Review (Paper_ID, Researcher_ID, Rating, Review_Date)
        VALUES (@paperId, @researcherId, @rating, @reviewDate);
        SELECT SCOPE_IDENTITY() as Review_ID
      `);

    invalidateUserCache(researcherId);

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: { reviewId: result.recordset[0].Review_ID },
    });
  } catch (error) {
    console.error('Submit review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit review',
      data: null,
    });
  }
});

// Get reviews for a paper with sorting options
router.get('/reviews/paper/:paperId', async (req, res) => {
  try {
    const paperId = req.params.paperId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sortBy = req.query.sortBy || 'date'; // date, rating
    const offset = (page - 1) * limit;

    const cacheKey = getCacheKey({ paperId, page, limit, sortBy, type: 'paperReviews' });
    const cached = getCachedQuery(cacheKey);
    
    if (cached) {
      return res.json(cached);
    }

    const orderBy = sortBy === 'rating' ? 'r.Rating DESC, r.Review_Date DESC' : 'r.Review_Date DESC';

    const pool = await getPool();
    const result = await pool
      .request()
      .input('paperId', sql.Int, paperId)
      .input('offset', sql.Int, offset)
      .input('limit', sql.Int, limit)
      .query(`
        SELECT 
          r.Review_ID, 
          r.Rating, 
          r.Review_Date, 
          r.Researcher_ID,
          u.Name as Reviewer_Name
        FROM Review r WITH (NOLOCK)
        INNER JOIN [User] u WITH (NOLOCK) ON r.Researcher_ID = u.User_ID
        WHERE r.Paper_ID = @paperId
        ORDER BY ${orderBy}
        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
      `);

    const [countResult, statsResult] = await Promise.all([
      pool.request()
        .input('paperId', sql.Int, paperId)
        .query('SELECT COUNT(*) as total FROM Review WHERE Paper_ID = @paperId'),
      
      pool.request()
        .input('paperId', sql.Int, paperId)
        .query(`
          SELECT 
            AVG(CAST(Rating as FLOAT)) as Average_Rating,
            COUNT(*) as Total_Reviews,
            SUM(CASE WHEN Rating = 5 THEN 1 ELSE 0 END) as Five_Stars,
            SUM(CASE WHEN Rating = 4 THEN 1 ELSE 0 END) as Four_Stars,
            SUM(CASE WHEN Rating = 3 THEN 1 ELSE 0 END) as Three_Stars,
            SUM(CASE WHEN Rating = 2 THEN 1 ELSE 0 END) as Two_Stars,
            SUM(CASE WHEN Rating = 1 THEN 1 ELSE 0 END) as One_Star
          FROM Review
          WHERE Paper_ID = @paperId
        `)
    ]);

    const total = countResult.recordset[0].total;

    const response = {
      success: true,
      message: 'Reviews retrieved successfully',
      data: {
        reviews: result.recordset,
        statistics: statsResult.recordset[0],
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    };

    setCachedQuery(cacheKey, response);
    res.json(response);
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve reviews',
      data: null,
    });
  }
});

// Get user's reviews
router.get('/reviews/user/:userId', authenticateToken, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    if (req.user.userId !== userId && req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
        data: null,
      });
    }

    const cacheKey = getCacheKey({ userId, page, limit, type: 'userReviews' });
    const cached = getCachedQuery(cacheKey);
    
    if (cached) {
      return res.json(cached);
    }

    const pool = await getPool();
    const result = await pool
      .request()
      .input('userId', sql.Int, userId)
      .input('offset', sql.Int, offset)
      .input('limit', sql.Int, limit)
      .query(`
        SELECT 
          r.Review_ID,
          r.Rating,
          r.Review_Date,
          p.Paper_ID,
          p.Title,
          p.Abstract,
          f.Field_Name
        FROM Review r WITH (NOLOCK)
        INNER JOIN Paper p WITH (NOLOCK) ON r.Paper_ID = p.Paper_ID
        LEFT JOIN Field f WITH (NOLOCK) ON p.Field_ID = f.Field_ID
        WHERE r.Researcher_ID = @userId
        ORDER BY r.Review_Date DESC
        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
      `);

    const countResult = await pool
      .request()
      .input('userId', sql.Int, userId)
      .query('SELECT COUNT(*) as total FROM Review WHERE Researcher_ID = @userId');

    const total = countResult.recordset[0].total;

    const response = {
      success: true,
      message: 'User reviews retrieved successfully',
      data: {
        reviews: result.recordset,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    };

    setCachedQuery(cacheKey, response);
    res.json(response);
  } catch (error) {
    console.error('Get user reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user reviews',
      data: null,
    });
  }
});

// Update review
router.put('/reviews/:id', authenticateToken, async (req, res) => {
  try {
    const reviewId = req.params.id;
    const { rating } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Valid rating (1-5) is required',
        data: null,
      });
    }

    const pool = await getPool();
    const reviewCheck = await pool
      .request()
      .input('reviewId', sql.Int, reviewId)
      .query('SELECT Researcher_ID FROM Review WHERE Review_ID = @reviewId');

    if (reviewCheck.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
        data: null,
      });
    }

    if (reviewCheck.recordset[0].Researcher_ID !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own reviews',
        data: null,
      });
    }

    await pool
      .request()
      .input('reviewId', sql.Int, reviewId)
      .input('rating', sql.Int, rating)
      .query('UPDATE Review SET Rating = @rating, Review_Date = GETDATE() WHERE Review_ID = @reviewId');

    invalidateUserCache(req.user.userId);

    res.json({
      success: true,
      message: 'Review updated successfully',
      data: null,
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update review',
      data: null,
    });
  }
});

// Delete review
router.delete('/reviews/:id', authenticateToken, async (req, res) => {
  try {
    const reviewId = req.params.id;

    const pool = await getPool();
    const reviewCheck = await pool
      .request()
      .input('reviewId', sql.Int, reviewId)
      .query('SELECT Researcher_ID FROM Review WHERE Review_ID = @reviewId');

    if (reviewCheck.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
        data: null,
      });
    }

    if (reviewCheck.recordset[0].Researcher_ID !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own reviews',
        data: null,
      });
    }

    await pool
      .request()
      .input('reviewId', sql.Int, reviewId)
      .query('DELETE FROM Review WHERE Review_ID = @reviewId');

    invalidateUserCache(req.user.userId);

    res.json({
      success: true,
      message: 'Review deleted successfully',
      data: null,
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete review',
      data: null,
    });
  }
});

module.exports = router;