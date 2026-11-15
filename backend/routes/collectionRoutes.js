const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  createCollection,
  getUserCollections,
  getLatestCollectionMovies,
  addMovieToCollection,
  updateMovieCollectionNotes,
  getCollectionMovies,
  getCheckMovieExistInCollection,
  removeMovieFromCollection,
  deleteCollection,
} = require('../controllers/collectionController');
const {
  validateCollection,
  validateMovieToCollection,
  validateMovieCollectionNotes,
  validateCheckExist,
  validateRemoveMovie,
} = require('../validators/collectionValidators');

router.use(authenticate);

router.post('/', validateCollection, createCollection);
router.get('/', getUserCollections);
router.delete('/:collection_id', deleteCollection);

router.get('/latest_movies', getLatestCollectionMovies);
router.post('/:collection_id/movies', validateMovieToCollection, addMovieToCollection);
router.post(
  '/:collection_id/movies/:movie_id/notes',
  validateMovieCollectionNotes,
  updateMovieCollectionNotes,
);
router.get('/:collection_id/movies', getCollectionMovies);
router.get('/check_exist/:movie_or_tv_show_id', validateCheckExist, getCheckMovieExistInCollection);
router.delete('/:collection_id/movies/:movie_id', validateRemoveMovie, removeMovieFromCollection);

module.exports = router;
