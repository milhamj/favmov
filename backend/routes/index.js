const express = require('express');
const router = express.Router();
const collectionRoutes = require('./collectionRoutes');
const { getHealth, getDatabaseHealth } = require('../controllers/healthController');

router.use('/collections', collectionRoutes);

router.get('/health', getHealth);
router.get('/health/db', getDatabaseHealth);

module.exports = router;
