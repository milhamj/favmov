const express = require('express');
const router = express.Router();
const collectionRoutes = require('./collectionRoutes');

router.use('/collections', collectionRoutes);

router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

module.exports = router;
