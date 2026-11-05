const { body, validationResult } = require('express-validator');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse } = require('../utils/responses');
const { 
  getTableName, 
  COLLECTIONS, 
  MOVIES_COLLECTIONS, 
  TV_SHOWS, 
  MOVIES, 
  COLLECTIONS_WITH_MOVIE_COUNT, 
  LATEST_MOVIES_IN_COLLECTION 
} = require('../utils/tableNames');

// Validation rules
exports.validateCollection = [
  body('name').trim().notEmpty().withMessage('Collection name is required.')
];

exports.validateMovieToCollection = [
  body('is_tv_show').isBoolean().withMessage('is_tv_show is requires and must be boolean.'),
  body('title').trim().notEmpty().withMessage('title is required.'),
  body('poster_path')
    .custom(value => value == null || typeof value === 'string').withMessage('poster path must be a string.')
    .customSanitizer(value => typeof value === 'string' ? value.trim() || null : value == null ? null : value)
];

exports.validateMovieCollectionNotes = [
  body('is_tv_show').isBoolean().withMessage('is_tv_show is requires and must be boolean.'),
];

// Create a new collection
exports.createCollection = asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(res, errors.array()[0].msg, 400);
  }

  const { name } = req.body;
  const userId = req.user.id;

  const { tableName, error: tableError } = getTableName(COLLECTIONS);
  if (tableError) {
    console.error('Environment error:', tableError);
    return errorResponse(res, tableError, 500);
  }

  // Check if user already has a collection with the same name.
  const { data: selectData, error: selectError } = await req.supabase
    .from(tableName)
    .select('*')
    .eq('user_id', userId);

  if (selectError) {
    console.error('Error fetching collections:', selectError);
    const debugMessage = selectError?.message
    return errorResponse(res, 'Failed to fetch collections', 500, debugMessage);
  }

  if (selectData) {
    const existingCollection = selectData.find(
      collection => collection.name.toLowerCase() === name.toLowerCase()
    );
    if (existingCollection) {
      return errorResponse(res, 'You already have a collection with the same name.', 400);
    }
  }

  const { data, error } = await req.supabase
    .from(tableName)
    .insert([{ name }])
    .select();

  if (error) {
    console.error('Error creating collection:', error);
    const debugMessage = error?.message
    return errorResponse(res, 'Failed to create collection', 500, debugMessage);
  }

  return successResponse(res, data[0], 'Collection created successfully', 201);
});

// Get all collections for a user
exports.getUserCollections = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const { tableName: collectionsTable, error: collectionsTableError } = getTableName(COLLECTIONS_WITH_MOVIE_COUNT);
  if (collectionsTableError) {
    console.error('Environment error:', collectionsTableError);
    return errorResponse(res, collectionsTableError, 500);
  }

  const { data, error } = await req.supabase
    .rpc(collectionsTable, { user_id_input: userId });

  if (error) {
    console.error('Error fetching collections:', error);
    const debugMessage = error?.message
    return errorResponse(res, 'Failed to fetch collections', 500, debugMessage);
  }

  data.forEach(element => {
    if (element && !element.last_updated) {
      element.last_updated = element.created_at;
    }
  });

  data.sort((a, b) => {
    const unixA = new Date(a.last_updated).getTime();
    const unixB = new Date(b.last_updated).getTime();
    return unixB - unixA;
  });

  data.sort((a, b) => {
    return b.movies_count - a.movies_count;
  })

  return successResponse(res, data, 'Collections retrieved successfully');
});

// Get the latest movies added to the collections
exports.getLatestCollectionMovies = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const { tableName: latestMoviesCollectionTable, error: latestMoviesCollectionTableError } = getTableName(LATEST_MOVIES_IN_COLLECTION);
  if (latestMoviesCollectionTableError) {
    console.error('Environment error:', latestMoviesCollectionTableError);
    return errorResponse(res, latestMoviesCollectionTableError, 500);
  }

  const { data, error } = await req.supabase
    .rpc(latestMoviesCollectionTable, { user_id_input: userId });

  if (error) {
    console.error('Error fetching latest movies:', error);
    const debugMessage = error?.message
    return errorResponse(res, 'Failed to fetch latest movies', 500, debugMessage);
  }

  const response = data.map(item => {
    return {
      ...item,
      movie_id: undefined,
      tv_show_id: undefined,
      id: item.is_tv_show ? item.tv_show_id : item.movie_id,
    }
  })

  return successResponse(res, response, 'Latest movies retrieved successfully');
})

// Add a movie to a collection
exports.addMovieToCollection = asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(res, errors.array()[0].msg, 400);
  }

  const { collection_id } = req.params;
  const { is_tv_show, movie_id, tv_show_id, notes, title, poster_path, rating, rating_count, release_date } = req.body;

  if (is_tv_show && !tv_show_id) {
    return errorResponse(res, 'tv_show_id is required when is_tv_show is true', 400);
  } else if (!is_tv_show && !movie_id) {
    return errorResponse(res, 'movie_id is required when is_tv_show is false', 400);
  }

  const userId = req.user.id;

  const { tableName: collectionsTable, error: collectionsTableError } = getTableName(COLLECTIONS);
  if (collectionsTableError) {
    console.error('Environment error:', collectionsTableError);
    return errorResponse(res, collectionsTableError, 500);
  }

  // First verify the collection belongs to the user
  const { data: collectionData, error: collectionError } = await req.supabase
    .from(collectionsTable)
    .select('*')
    .eq('id', collection_id)
    .eq('user_id', userId)
    .single();

  if (collectionError || !collectionData) {
    return errorResponse(res, 'Collection not found or access denied', 404);
  }

  const { tableName: moviesCollectionsTable, error: moviesCollectionsTableError } = getTableName(MOVIES_COLLECTIONS);
  if (moviesCollectionsTableError) {
    console.error('Environment error:', moviesCollectionsTableError);
    return errorResponse(res, moviesCollectionsTableError, 500);
  }

  const mediaId = is_tv_show ? tv_show_id : movie_id;
  const mediaLabel = is_tv_show ? 'TV show' : 'movie';
  const findEntry = () => req.supabase
    .from(moviesCollectionsTable)
    .select('*')
    .eq('collection_id', collection_id)
    .eq(is_tv_show ? 'tv_show_id' : 'movie_id', mediaId)
    .maybeSingle();

  // Adding is idempotent, so a retry after a lost response finds its entry
  const { data: existingEntry, error: existingEntryError } = await findEntry();

  if (existingEntryError) {
    console.error(`Error checking collection ${mediaLabel}:`, existingEntryError);
    return errorResponse(res, `Error adding ${mediaLabel} to collection.`, 500, existingEntryError.message);
  }

  if (existingEntry) {
    return successResponse(res, existingEntry, 'Already in this collection');
  }

  // Check if the movie/tv show already exists in its table, if not then add
  const { tableName: mediaTable, error: mediaTableError } = getTableName(is_tv_show ? TV_SHOWS : MOVIES);
  if (mediaTableError) {
    console.error('Environment error:', mediaTableError);
    return errorResponse(res, mediaTableError, 500);
  }

  const { data: existingMedia } = await req.supabase
  .from(mediaTable)
  .select('*')
  .eq('id', mediaId)
  .single();

  if (!existingMedia) {
    const { error: insertMediaError } = await req.supabase.from(mediaTable).insert([{
      id: mediaId,
      title,
      poster_path,
      rating,
      rating_count,
      release_date
    }])

    // 23505: a concurrent add stored this title first, which is all this step needs.
    if (insertMediaError && insertMediaError.code !== '23505') {
      console.error(`Error inserting ${mediaLabel}:`, insertMediaError);
      const debugMessage = insertMediaError?.message
      return errorResponse(res, `Error adding ${mediaLabel} to collection.`, 500, debugMessage);
    }
  }

  // Add movie/tv show to collection
  const { data, error } = await req.supabase
  .from(moviesCollectionsTable)
  .insert([{
    collection_id,
    movie_id: is_tv_show ? null : movie_id,
    tv_show_id: is_tv_show ? tv_show_id : null,
    is_tv_show,
    notes,
  }])
  .select();

  if (error?.code === '23505') {
    // A concurrent add won the unique index, so the entry the caller asked for exists.
    const { data: existing } = await findEntry();

    if (existing) return successResponse(res, existing, 'Already in this collection');
  }

  if (error) {
    console.error('Error adding movie to collection:', error);
    const debugMessage = error?.message
    return errorResponse(res, 'Failed to add movie to collection', 500, debugMessage);
  }

  return successResponse(res, data[0], 'Movie added to collection successfully', 201);
});

exports.updateMovieCollectionNotes = asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(res, errors.array()[0].msg, 400);
  }

  const { collection_id, movie_id } = req.params;
  const { is_tv_show } = req.body;
  let { notes } = req.body;

  if (notes) {
    notes = notes.trim();
  } else {
    notes = '';
  }

  const userId = req.user.id;

  const { tableName: moviesCollectionsTable, error: moviesCollectionsTableError } = getTableName(MOVIES_COLLECTIONS);
  if (moviesCollectionsTableError) {
    console.error('Environment error:', moviesCollectionsTableError);
    return errorResponse(res, moviesCollectionsTableError, 500);
  }

  // Check if the movie/tv show exists in the collection
  const { data: existData, error: existError } = await req.supabase
  .from(moviesCollectionsTable)
  .select('*')
  .eq('collection_id', collection_id)
  .eq('user_id', userId)
  .eq(is_tv_show ? 'tv_show_id' : 'movie_id', movie_id)
  .single();

  if (existError || !existData) {
    return errorResponse(res, `${is_tv_show ? 'TV Show' : 'Movie'} not found in collection.`, 404, existError?.message);
  }

  // Update movie/tv show notes in collection
  const { data, error } = await req.supabase
  .from(moviesCollectionsTable)
  .update({ notes })
  .eq('collection_id', collection_id)
  .eq('user_id', userId)
  .eq(is_tv_show ? 'tv_show_id' : 'movie_id', movie_id)
  .select();

  if (error) {
    console.error('Error updating movie/tv show\'s collection notes:', error);
    const debugMessage = error?.message
    return errorResponse(res, 'Failed to update notes', 500, debugMessage);
  }

  return successResponse(res, data[0], 'Collection notes updated successfully', 201);
});

// Get all movies in a collection
exports.getCollectionMovies = asyncHandler(async (req, res) => {
  const { collection_id } = req.params;
  const userId = req.user.id; // Assuming user ID is available from auth middleware

  const { tableName: collectionsTable, error: collectionsTableError } = getTableName(COLLECTIONS);
  if (collectionsTableError) {
    console.error('Environment error:', collectionsTableError);
    return errorResponse(res, collectionsTableError, 500);
  }

  // First verify the collection belongs to the user
  const { data: collectionData, error: collectionError } = await req.supabase
    .from(collectionsTable)
    .select('*')
    .eq('id', collection_id)
    .eq('user_id', userId)
    .single();

  if (collectionError || !collectionData) {
    return errorResponse(res, 'Collection not found or access denied', 404);
  }

  const { tableName: moviesCollectionsTable, error: moviesCollectionsTableError } = getTableName(MOVIES_COLLECTIONS);
  const { tableName: moviesTable, error: moviesTableError } = getTableName(MOVIES);
  const { tableName: tvShowsTable, error: tvShowsTableError } = getTableName(TV_SHOWS);
  const tableError = moviesCollectionsTableError || moviesTableError || tvShowsTableError;

  if (tableError) {
    console.error('Environment error:', tableError);
    return errorResponse(res, tableError, 500);
  }

  // Get all movies in the collection
  const { data, error } = await req.supabase
    .from(moviesCollectionsTable)
    .select(`
      id,
      collection_id,
      movie_id,
      tv_show_id,
      is_tv_show,
      notes,
      user_id,
      created_at,
      ${moviesTable}(title, poster_path, rating, rating_count, release_date),
      ${tvShowsTable}(title, poster_path, rating, rating_count, release_date)
    `)
    .eq('collection_id', collection_id)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching collection movies:', error);
    const debugMessage = error?.message
    return errorResponse(res, 'Failed to fetch collection movies', 500, debugMessage);
  }

  const movies = data.map(item => ({
    ...item[moviesTable],
    ...item[tvShowsTable],
    is_tv_show: item.is_tv_show,
    notes: item.notes,
    created_at: item.created_at,
    id: item.is_tv_show ? item.tv_show_id : item.movie_id
  }));

  const response = collectionData;
  response.movies = movies;

  return successResponse(res, response, 'Collection movies retrieved successfully');
});

exports.getCheckMovieExistInCollection = asyncHandler(async (req, res) => {
  const { movie_or_tv_show_id } = req.params;
  const is_tv_show  = req.query.is_tv_show === 'true';
  const userId = req.user.id;

  const { tableName: moviesCollectionsTable, error: moviesCollectionsTableError } = getTableName(MOVIES_COLLECTIONS);
  if (moviesCollectionsTableError) {
    console.error('Environment error:', moviesCollectionsTableError);
    return errorResponse(res, moviesCollectionsTableError, 500);
  }

  const query = req.supabase
  .from(moviesCollectionsTable)
  .select(`*`)
  .eq('user_id', userId);

  if (is_tv_show) {
    query.eq('tv_show_id', movie_or_tv_show_id);
  } else {
    query.eq('movie_id', movie_or_tv_show_id);
  }

  const { data: moviesCollectionData, error: moviesCollectionError } = await query
    .order('created_at', { ascending: false });

  if (moviesCollectionError) {
    console.error('Error fetching collection movies:', moviesCollectionError);
    const debugMessage = moviesCollectionError?.message
    return errorResponse(res, 'Failed to fetch collection movies', 500, debugMessage);
  }

  const { tableName: collectionsTable, error: collectionsTableError } = getTableName(COLLECTIONS);
  if (collectionsTableError) {
    console.error('Environment error:', collectionsTableError);
    return errorResponse(res, collectionsTableError, 500);
  }

  const { data: collectionData, error: collectionError } = await req.supabase
  .from(collectionsTable)
  .select(`*`)
  .eq('user_id', userId);

  if (collectionError) {
    console.error('Error fetching collection movies:', collectionError);
    const debugMessage = collectionError?.message
    return errorResponse(res, 'Failed to fetch collection movies', 500, debugMessage);
  }

  const response = [];
  collectionData.forEach(collection => {
    const moviesCollectionItem = moviesCollectionData.find(
      item => item.collection_id === collection.id
    );
    if (moviesCollectionItem) {
      response.push({
        collection_id: collection.id,
        collection_name: collection.name,
        notes: moviesCollectionItem.notes,
      })
    }
  });

  return successResponse(res, response, 'The movie/tv show has been checked successfully');
});

// Remove a movie from a collection
exports.removeMovieFromCollection = asyncHandler(async (req, res) => {
  const { collection_id, movie_id } = req.params;
  const is_tv_show  = req.query.is_tv_show === 'true';
  const userId = req.user.id; // Assuming user ID is available from auth middleware

  const { tableName: collectionsTable, error: collectionsTableError } = getTableName(COLLECTIONS);
  if (collectionsTableError) {
    console.error('Environment error:', collectionsTableError);
    return errorResponse(res, collectionsTableError, 500);
  }

  // First verify the collection belongs to the user
  const { data: collectionData, error: collectionError } = await req.supabase
    .from(collectionsTable)
    .select('*')
    .eq('id', collection_id)
    .eq('user_id', userId)
    .single();

  if (collectionError || !collectionData) {
    return errorResponse(res, 'Collection not found or access denied', 404);
  }

  const { tableName: moviesCollectionsTable, error: moviesCollectionsTableError } = getTableName(MOVIES_COLLECTIONS);
  if (moviesCollectionsTableError) {
    console.error('Environment error:', moviesCollectionsTableError);
    return errorResponse(res, moviesCollectionsTableError, 500);
  }

  // Remove movie from collection
  const query = req.supabase.from(moviesCollectionsTable)
  .delete()
  .eq('collection_id', collection_id)
  .eq('user_id', userId);
  
  if (is_tv_show) {
    query.eq('tv_show_id', movie_id);
  } else {
    query.eq('movie_id', movie_id);
  }

  const { error } = await query;

  if (error) {
    console.error('Error removing movie from collection:', error);
    const debugMessage = error?.message
    return errorResponse(res, 'Failed to remove movie from collection', 500, debugMessage);
  }

  const response = {
    is_success: true
  }

  return successResponse(res, response, 'Movie removed from collection successfully');
});

// Delete a collection
exports.deleteCollection = asyncHandler(async (req, res) => {
  const { collection_id } = req.params;
  const userId = req.user.id; // Assuming user ID is available from auth middleware

  const { tableName: collectionsTable, error: collectionsTableError } = getTableName(COLLECTIONS);
  if (collectionsTableError) {
    console.error('Environment error:', collectionsTableError);
    return errorResponse(res, collectionsTableError, 500);
  }

  // First verify the collection belongs to the user
  const { data: collectionData, error: collectionError } = await req.supabase
    .from(collectionsTable)
    .select('*')
    .eq('id', collection_id)
    .eq('user_id', userId)
    .single();

  if (collectionError || !collectionData) {
    return errorResponse(res, 'Collection not found or access denied', 404, collectionError?.message);
  }

  // The collection foreign key cascades entries in the same database statement.
  const { error } = await req.supabase
    .from(collectionsTable)
    .delete()
    .eq('id', collection_id)
    .eq('user_id', userId);

  if (error) {
    console.error('Error deleting collection:', error);
    const debugMessage = error?.message
    return errorResponse(res, 'Failed to delete collection', 500, debugMessage);
  }

  const response = {
    is_success: true
  }

  return successResponse(res, response, 'Collection deleted successfully');
});