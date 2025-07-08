const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  createCollection,
  getUserCollections,
  getLatestCollectionMovies,
  addMovieToCollection,
  getCollectionMovies,
  getCheckMovieExistInCollection,
  removeMovieFromCollection,
  deleteCollection,
  validateCollection,
  validateMovieToCollection
} = require('../controllers/collectionController');

// All routes require authentication
router.use(authenticate);

// Collection routes
router.post('/', validateCollection, createCollection);
router.get('/', getUserCollections);
router.delete('/:collection_id', deleteCollection);

// Movie in collection routes
router.get('/latest_movies', getLatestCollectionMovies);
router.post('/:collection_id/movies', validateMovieToCollection, addMovieToCollection);
router.get('/:collection_id/movies', getCollectionMovies);
router.get('/check_exist/:movie_or_tv_show_id', getCheckMovieExistInCollection);
router.delete('/:collection_id/movies/:movie_id', removeMovieFromCollection);

module.exports = router;