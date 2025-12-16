const express = require('express');
const { getPool, sql } = require('../config/database');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    if (page < 1 || limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pagination parameters',
        data: null,
      });
    }

    const pool = await getPool();

    const result = await pool
      .request()
      .input('offset', sql.Int, offset)
      .input('limit', sql.Int, limit)
      .query(`
        SELECT 
          f.Field_ID, 
          f.Field_Name, 
          f.Description,
          (SELECT COUNT(*) FROM Paper p WHERE p.Field_ID = f.Field_ID) as Paper_Count
        FROM Field f
        ORDER BY f.Field_Name
        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
      `);

    const countResult = await pool
      .request()
      .query('SELECT COUNT(*) as total FROM Field');

    const total = countResult.recordset[0].total;

    res.json({
      success: true,
      message: 'Fields retrieved successfully',
      data: {
        fields: result.recordset,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get fields error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve fields',
      data: null,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const fieldId = parseInt(req.params.id);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    if (isNaN(fieldId) || fieldId < 1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid field ID',
        data: null,
      });
    }

    if (page < 1 || limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pagination parameters',
        data: null,
      });
    }

    const pool = await getPool();

    const fieldResult = await pool
      .request()
      .input('fieldId', sql.Int, fieldId)
      .query(`
        SELECT 
          f.Field_ID, 
          f.Field_Name, 
          f.Description,
          (SELECT COUNT(*) FROM Paper p WHERE p.Field_ID = f.Field_ID) as Paper_Count
        FROM Field f
        WHERE f.Field_ID = @fieldId
      `);

    if (fieldResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Field not found',
        data: null,
      });
    }

    const field = fieldResult.recordset[0];

    const papersResult = await pool
      .request()
      .input('fieldId', sql.Int, fieldId)
      .input('offset', sql.Int, offset)
      .input('limit', sql.Int, limit)
      .query(`
        SELECT 
          p.Paper_ID, 
          p.Title, 
          p.Abstract, 
          p.Publication_Date,
          (SELECT COUNT(*) FROM Author_Paper ap WHERE ap.Paper_ID = p.Paper_ID) as Author_Count,
          (SELECT COUNT(*) FROM Download d WHERE d.Paper_ID = p.Paper_ID) as Download_Count,
          (SELECT AVG(CAST(Rating as FLOAT)) FROM Review r WHERE r.Paper_ID = p.Paper_ID) as Avg_Rating
        FROM Paper p
        WHERE p.Field_ID = @fieldId
        ORDER BY p.Publication_Date DESC
        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
      `);

    const countResult = await pool
      .request()
      .input('fieldId', sql.Int, fieldId)
      .query('SELECT COUNT(*) as total FROM Paper WHERE Field_ID = @fieldId');

    const total = countResult.recordset[0].total;

    res.json({
      success: true,
      message: 'Field retrieved successfully',
      data: {
        Field_ID: field.Field_ID,
        Field_Name: field.Field_Name,
        Description: field.Description,
        Paper_Count: field.Paper_Count,
        papers: papersResult.recordset,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get field error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve field',
      data: null,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

router.post('/', async (req, res) => {
  try {
    const { Field_Name, Description } = req.body;

    if (!Field_Name || Field_Name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Field name is required',
        data: null,
      });
    }

    if (Field_Name.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Field name must be 100 characters or less',
        data: null,
      });
    }

    if (Description && Description.length > 300) {
      return res.status(400).json({
        success: false,
        message: 'Description must be 300 characters or less',
        data: null,
      });
    }

    const pool = await getPool();

    const existingField = await pool
      .request()
      .input('fieldName', sql.NVarChar(100), Field_Name.trim())
      .query('SELECT Field_ID FROM Field WHERE Field_Name = @fieldName');

    if (existingField.recordset.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Field with this name already exists',
        data: null,
      });
    }

    const result = await pool
      .request()
      .input('fieldName', sql.NVarChar(100), Field_Name.trim())
      .input('description', sql.NVarChar(300), Description?.trim() || null)
      .query(`
        INSERT INTO Field (Field_Name, Description)
        OUTPUT INSERTED.Field_ID, INSERTED.Field_Name, INSERTED.Description
        VALUES (@fieldName, @description)
      `);

    res.status(201).json({
      success: true,
      message: 'Field created successfully',
      data: result.recordset[0],
    });
  } catch (error) {
    console.error('Create field error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create field',
      data: null,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const fieldId = parseInt(req.params.id);
    const { Field_Name, Description } = req.body;

    if (isNaN(fieldId) || fieldId < 1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid field ID',
        data: null,
      });
    }

    if (!Field_Name || Field_Name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Field name is required',
        data: null,
      });
    }

    if (Field_Name.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Field name must be 100 characters or less',
        data: null,
      });
    }

    if (Description && Description.length > 300) {
      return res.status(400).json({
        success: false,
        message: 'Description must be 300 characters or less',
        data: null,
      });
    }

    const pool = await getPool();

    const existingField = await pool
      .request()
      .input('fieldId', sql.Int, fieldId)
      .query('SELECT Field_ID FROM Field WHERE Field_ID = @fieldId');

    if (existingField.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Field not found',
        data: null,
      });
    }

    const result = await pool
      .request()
      .input('fieldId', sql.Int, fieldId)
      .input('fieldName', sql.NVarChar(100), Field_Name.trim())
      .input('description', sql.NVarChar(300), Description?.trim() || null)
      .query(`
        UPDATE Field
        SET Field_Name = @fieldName, Description = @description
        OUTPUT INSERTED.Field_ID, INSERTED.Field_Name, INSERTED.Description
        WHERE Field_ID = @fieldId
      `);

    res.json({
      success: true,
      message: 'Field updated successfully',
      data: result.recordset[0],
    });
  } catch (error) {
    console.error('Update field error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update field',
      data: null,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const fieldId = parseInt(req.params.id);

    if (isNaN(fieldId) || fieldId < 1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid field ID',
        data: null,
      });
    }

    const pool = await getPool();

    const paperCheck = await pool
      .request()
      .input('fieldId', sql.Int, fieldId)
      .query('SELECT COUNT(*) as count FROM Paper WHERE Field_ID = @fieldId');

    if (paperCheck.recordset[0].count > 0) {
      return res.status(409).json({
        success: false,
        message: 'Cannot delete field with associated papers',
        data: null,
      });
    }

    const result = await pool
      .request()
      .input('fieldId', sql.Int, fieldId)
      .query('DELETE FROM Field WHERE Field_ID = @fieldId');

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({
        success: false,
        message: 'Field not found',
        data: null,
      });
    }

    res.json({
      success: true,
      message: 'Field deleted successfully',
      data: null,
    });
  } catch (error) {
    console.error('Delete field error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete field',
      data: null,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

module.exports = router;