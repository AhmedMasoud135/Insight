const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const { authenticateToken } = require('../middleware/auth');
const { getPool, sql } = require('../config/database');
const router = express.Router();
const CHATBOT_API_URL = process.env.CHATBOT_API_URL || 'http://localhost:8001';

function runPythonScript(scriptPath, args = []) {
  return new Promise((resolve, reject) => {
    const python = spawn('python3', [scriptPath, ...args]);
    let dataString = '';
    let errorString = '';

    python.stdout.on('data', (data) => {
      dataString += data.toString();
    });

    python.stderr.on('data', (data) => {
      errorString += data.toString();
    });

    python.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Python script failed: ${errorString}`));
      } else {
        try {
          resolve(JSON.parse(dataString));
        } catch (e) {
          resolve({ raw: dataString });
        }
      }
    });
  });
}

router.get('/recommendations/:researcherId', authenticateToken, async (req, res) => {
  try {
    const researcherId = req.params.researcherId;
    const limit = parseInt(req.query.limit) || 10;

    if (req.user.userId !== parseInt(researcherId) && req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
        data: null,
      });
    }

    const pool = await getPool();
    const downloadHistory = await pool
      .request()
      .input('researcherId', sql.Int, researcherId)
      .query(`
        SELECT DISTINCT p.Paper_ID, p.Title, f.Field_ID 
        FROM Download d 
        INNER JOIN Paper p ON d.Paper_ID = p.Paper_ID 
        LEFT JOIN Field f ON p.Field_ID = f.Field_ID 
        WHERE d.Researcher_ID = @researcherId 
        ORDER BY d.Download_Date DESC
      `);

    if (downloadHistory.recordset.length === 0) {
      return res.json({
        success: true,
        message: 'No recommendations available yet',
        data: {
          recommendations: [],
          message: 'Download more papers to get personalized recommendations',
        },
      });
    }

    const pythonPath = path.join(__dirname, '../..', process.env.PYTHON_RECOMMENDER_PATH);
    const paperIds = downloadHistory.recordset.map((r) => r.Paper_ID).join(',');

    const recommendations = await runPythonScript(pythonPath, [
      '--researcher_id',
      researcherId,
      '--paper_ids',
      paperIds,
      '--limit',
      limit.toString(),
    ]);

    if (recommendations.paper_ids && Array.isArray(recommendations.paper_ids)) {
      const placeholders = recommendations.paper_ids.map((_, i) => `@id${i}`).join(',');
      const request = pool.request();
      recommendations.paper_ids.forEach((id, i) => {
        request.input(`id${i}`, sql.Int, id);
      });

      const paperDetails = await request.query(`
        SELECT p.Paper_ID, p.Title, p.Abstract, p.Publication_Date, f.Field_Name,
               COUNT(DISTINCT ap.Author_ID) as Author_Count,
               COUNT(DISTINCT d.Download_ID) as Download_Count 
        FROM Paper p 
        LEFT JOIN Field f ON p.Field_ID = f.Field_ID 
        LEFT JOIN Author_Paper ap ON p.Paper_ID = ap.Paper_ID 
        LEFT JOIN Download d ON p.Paper_ID = d.Paper_ID 
        WHERE p.Paper_ID IN (${placeholders}) 
        GROUP BY p.Paper_ID, p.Title, p.Abstract, p.Publication_Date, f.Field_Name
      `);

      res.json({
        success: true,
        message: 'Recommendations retrieved successfully',
        data: {
          recommendations: paperDetails.recordset,
          score: recommendations.score || null,
        },
      });
    } else {
      res.json({
        success: true,
        message: 'Recommendations retrieved',
        data: {
          recommendations: [],
          raw: recommendations,
        },
      });
    }
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recommendations',
      data: null,
    });
  }
});

router.post('/assistant/query', authenticateToken, async (req, res) => {
  try {
    const { paperId, question } = req.body;

    if (!paperId || !question) {
      return res.status(400).json({
        success: false,
        message: 'Paper ID and question are required',
        data: null,
      });
    }

    const pool = await getPool();
    const paperResult = await pool
      .request()
      .input('paperId', sql.Int, paperId)
      .query('SELECT Paper_ID, Title, Path FROM Paper WHERE Paper_ID = @paperId');

    if (paperResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Paper not found',
        data: null,
      });
    }

    const paper = paperResult.recordset[0];
    const pythonPath = path.join(__dirname, '../..', process.env.PYTHON_CHATBOT_PATH);

    const response = await runPythonScript(pythonPath, [
      '--paper_path',
      paper.Path,
      '--question',
      question,
    ]);

    res.json({
      success: true,
      message: 'Query processed successfully',
      data: {
        paperId: paperId,
        paperTitle: paper.Title,
        question: question,
        answer: response.answer || response.raw || 'Unable to process query',
        confidence: response.confidence || null,
      },
    });
  } catch (error) {
    console.error('AI assistant query error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process query',
      data: null,
    });
  }
});

router.post('/assistant/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message is required',
        data: null,
      });
    }

    res.json({
      success: true,
      message: 'Please use the FastAPI endpoint directly',
      data: {
        message: message.trim(),
        answer: 'This endpoint should be called directly from the frontend to FastAPI at http://localhost:8001',
      },
    });
  } catch (error) {
    console.error('AI assistant chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process chat',
      data: null,
    });
  }
});

module.exports = router;