require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const { errorResponse } = require('./utils/responses');
const routes = require('./routes');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// API Routes first
app.use('/api', routes);

// Static files after API routes
app.use(express.static(path.join(__dirname, 'public')));

// Catch-all route for SPA - must be last
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  return errorResponse(res, err.message || 'Internal server error', err.status || 500);
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});