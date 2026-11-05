require('dotenv').config();
// Before the other requires: config/supabase.js exits on load when its keys are missing
require('./utils/checkEnv').checkEnv();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const { errorResponse } = require('./utils/responses');
const routes = require('./routes');
const { dailyMediaSync } = require('./middleware/dailyMediaSync');
const createPageRoutes = require('./routes/pageRoutes');

const app = express();
const port = process.env.FAVMOV_PORT || 3000;

// Middleware
app.use(cors());
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(dailyMediaSync);

// API Routes first
app.use('/api', routes);

// 404 handler for unmatched /api routes
app.use('/api', (req, res) => {
  const errorMessage = `Unknown API endpoint: ${req.originalUrl}`;
  console.error('Not Found: ', errorMessage);
  return errorResponse(res, 'Not Found', 404, errorMessage);
});

// Static files after API routes
const publicDir = path.join(__dirname, 'public');
app.use(createPageRoutes(publicDir));

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  return errorResponse(res, err.message || 'Internal server error', err.status || 500, err.details || null);
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port} with environment ${process.env.FAVMOV_NODE_ENV}`);
});
