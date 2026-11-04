require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs/promises');
const { errorResponse } = require('./utils/responses');
const routes = require('./routes');
const { applyMovieSeo, fetchMovie } = require('./utils/movieSeo');

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
app.use(express.static(publicDir, { extensions: ['html'], redirect: false }));

// Each route has its own prerendered HTML; serving another route's breaks hydration - must be last
app.use(async (req, res) => {
  const movieId = req.path.match(/^\/movie\/(\d+)\/?$/)?.[1];
  if (movieId && process.env.FAVMOV_TMDB_API_KEY) {
    try {
      const [html, movie] = await Promise.all([
        fs.readFile(path.join(publicDir, 'movie', '[id].html'), 'utf8'),
        fetchMovie(movieId, req.query.is_tv_show === 'true'),
      ]);
      return res.type('html').send(applyMovieSeo(html, movie, req.originalUrl));
    } catch (error) {
      console.error('Movie SEO failed, serving default head:', error.message);
    }
  }

  const dynamicRoute = req.path.match(/^\/(movie|people|collection)\/[^/]+\/?$/);
  if (dynamicRoute) return res.sendFile(path.join(publicDir, dynamicRoute[1], '[id].html'));
  // collection/ is also a directory, so express.static skips collection.html
  if (/^\/collection\/?$/.test(req.path)) return res.sendFile(path.join(publicDir, 'collection.html'));
  res.status(404).sendFile(path.join(publicDir, '+not-found.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  return errorResponse(res, err.message || 'Internal server error', err.status || 500, err.details || null);
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port} with environment ${process.env.FAVMOV_NODE_ENV}`);
});