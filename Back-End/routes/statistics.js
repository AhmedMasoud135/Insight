const express = require('express');
const { getPool, sql } = require('../config/database');

const router = express.Router();

router.get('/papers', async (req, res) => {
  try {
    const pool = await getPool();

    const totalPapers = await pool
      .request()
      .query('SELECT COUNT(*) as total FROM Paper');

    const papersByField = await pool
      .request()
      .query(`
        SELECT f.Field_Name, COUNT(p.Paper_ID) as count
        FROM Field f
        LEFT JOIN Paper p ON p.Field_ID = f.Field_ID
        GROUP BY f.Field_Name
        ORDER BY count DESC
      `);

    const recentPapers = await pool
      .request()
      .query(`
        SELECT TOP 10 p.Paper_ID, p.Title, p.Publication_Date
        FROM Paper p
        ORDER BY p.Publication_Date DESC
      `);

    res.json({
      success: true,
      message: 'Paper statistics retrieved successfully',
      data: {
        totalPapers: totalPapers.recordset[0].total,
        papersByField: papersByField.recordset,
        recentPapers: recentPapers.recordset,
      },
    });
  } catch (error) {
    console.error('Get paper statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve paper statistics',
      data: null,
    });
  }
});

router.get('/downloads', async (req, res) => {
  try {
    const pool = await getPool();

    const totalDownloads = await pool
      .request()
      .query('SELECT COUNT(*) as total FROM Download');

    const downloadsByField = await pool
      .request()
      .query(`
        SELECT f.Field_Name, COUNT(d.Download_ID) as count
        FROM Field f
        LEFT JOIN Paper p ON p.Field_ID = f.Field_ID
        LEFT JOIN Download d ON d.Paper_ID = p.Paper_ID
        GROUP BY f.Field_Name
        ORDER BY count DESC
      `);

    const topDownloadedPapers = await pool
      .request()
      .query(`
        SELECT TOP 10 p.Paper_ID, p.Title, 
               (SELECT COUNT(*) FROM Download d WHERE d.Paper_ID = p.Paper_ID) as download_count
        FROM Paper p
        ORDER BY download_count DESC
      `);

    res.json({
      success: true,
      message: 'Download statistics retrieved successfully',
      data: {
        totalDownloads: totalDownloads.recordset[0].total,
        downloadsByField: downloadsByField.recordset,
        topDownloadedPapers: topDownloadedPapers.recordset,
      },
    });
  } catch (error) {
    console.error('Get download statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve download statistics',
      data: null,
    });
  }
});

router.get('/reviews', async (req, res) => {
  try {
    const pool = await getPool();

    const totalReviews = await pool
      .request()
      .query('SELECT COUNT(*) as total FROM Review');

    const averageRating = await pool
      .request()
      .query('SELECT AVG(CAST(Rating as FLOAT)) as average_rating FROM Review');

    const ratingDistribution = await pool
      .request()
      .query(`
        SELECT Rating, COUNT(*) as count
        FROM Review
        GROUP BY Rating
        ORDER BY Rating DESC
      `);

    const topRatedPapers = await pool
      .request()
      .query(`
        SELECT TOP 10 p.Paper_ID, p.Title, 
               AVG(CAST(r.Rating as FLOAT)) as average_rating, 
               COUNT(r.Review_ID) as review_count
        FROM Paper p
        INNER JOIN Review r ON p.Paper_ID = r.Paper_ID
        GROUP BY p.Paper_ID, p.Title
        ORDER BY average_rating DESC, review_count DESC
      `);

    res.json({
      success: true,
      message: 'Review statistics retrieved successfully',
      data: {
        totalReviews: totalReviews.recordset[0].total,
        averageRating: averageRating.recordset[0].average_rating || 0,
        ratingDistribution: ratingDistribution.recordset,
        topRatedPapers: topRatedPapers.recordset,
      },
    });
  } catch (error) {
    console.error('Get review statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve review statistics',
      data: null,
    });
  }
});

router.get('/searches', async (req, res) => {
  try {
    const pool = await getPool();

    const totalSearches = await pool
      .request()
      .query('SELECT COUNT(*) as total FROM Search');

    const popularSearches = await pool
      .request()
      .query(`
        SELECT TOP 20 Query, COUNT(*) as count
        FROM Search
        WHERE Query IS NOT NULL AND Query != ''
        GROUP BY Query
        ORDER BY count DESC
      `);

    res.json({
      success: true,
      message: 'Search statistics retrieved successfully',
      data: {
        totalSearches: totalSearches.recordset[0].total,
        popularSearches: popularSearches.recordset,
      },
    });
  } catch (error) {
    console.error('Get search statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve search statistics',
      data: null,
    });
  }
});

router.get('/overview', async (req, res) => {
  try {
    const pool = await getPool();

    const [totalPapers, totalFields, totalAuthors, totalDownloads] = await Promise.all([
      pool.request().query('SELECT COUNT(*) as total FROM Paper'),
      pool.request().query('SELECT COUNT(*) as total FROM Field'),
      pool.request().query('SELECT COUNT(*) as total FROM Author'),
      pool.request().query('SELECT COUNT(*) as total FROM Download'),
    ]);

    res.json({
      success: true,
      message: 'Overview statistics retrieved successfully',
      data: {
        totalPapers: totalPapers.recordset[0].total,
        totalFields: totalFields.recordset[0].total,
        totalAuthors: totalAuthors.recordset[0].total,
        totalDownloads: totalDownloads.recordset[0].total,
      },
    });
  } catch (error) {
    console.error('Get overview statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve overview statistics',
      data: null,
    });
  }
});

module.exports = router;