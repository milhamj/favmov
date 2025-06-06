require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { errorResponse } = require('./utils/responses');
const routes = require('./routes');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// API Routes
app.use('/api', routes);

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to FavMov API' });
});

// 404 handler
app.use((req, res) => {
  return errorResponse(res, 'Route not found', 404);
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  return errorResponse(res, err.message || 'Internal server error', err.status || 500);
});

// Start server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});