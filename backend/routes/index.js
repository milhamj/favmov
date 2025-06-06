const express = require('express');
const router = express.Router();
const collectionRoutes = require('./collectionRoutes');

// API routes
router.use('/collections', collectionRoutes);

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

module.exports = router;