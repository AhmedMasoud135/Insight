const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const { getPool, closePool } = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth');
const papersRoutes = require('./routes/papers');
const authorsRoutes = require('./routes/authors');
const fieldsRoutes = require('./routes/fields');
const interactionsRoutes = require('./routes/interactions');
const statisticsRoutes = require('./routes/statistics');
const aiRoutes = require('./routes/ai');
const usersRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    data: null,
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/papers', papersRoutes);
app.use('/api/authors', authorsRoutes);
app.use('/api/fields', fieldsRoutes);
app.use('/api/interactions', interactionsRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/users', usersRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    data: null,
  });
});

app.use(errorHandler);

const server = app.listen(PORT, async () => {
  try {
    await getPool();
    console.log(`✓ Server running on http://localhost:${PORT}`);
  } catch (error) {
    console.error('✗ Failed to start server:', error.message);
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  server.close(async () => {
    await closePool();
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = app;