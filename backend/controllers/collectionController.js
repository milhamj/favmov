const { body, validationResult } = require('express-validator');
const supabase = require('../config/supabase');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse } = require('../utils/responses');
const { getTableName, COLLECTIONS, MOVIES_COLLECTIONS, TV_SHOWS, MOVIES, COLLECTIONS_WITH_MOVIE_COUNT } = require('../utils/tableNames');

// Validation rules
exports.validateCollection = [
  body('name').trim().notEmpty().withMessage('Collection name is required.')
];

exports.validateMovieToCollection = [
  body('is_tv_show').isBoolean().withMessage('is_tv_show is requires and must be boolean.'),
  body('title').trim().notEmpty().withMessage('title is required.'),
  body('poster_path').trim().notEmpty().withMessage('poster path is required.')
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
  const { data: selectData, error: selectError } = await supabase
    .from(tableName)
    .select('*')
    .eq('user_id', userId);

  if (selectError) {
    console.error('Error fetching collections:', selectError);
    const debugMessage = selectError?.message
    return errorResponse(res, 'Failed to fetch collections', 500, debugMessage);
  }

  if (selectData) {
    console.log("selectData:", selectData)
    const existingCollection = selectData.find(
      collection => collection.name.toLowerCase() === name.toLowerCase()
    );
    if (existingCollection) {
      return errorResponse(res, 'You already have a collection with the same name.', 400);
    }
  }

  const { data, error } = await supabase
    .from(tableName)
    .insert([{ name, user_id: userId }])
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

  const { data, error } = await supabase
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

  const sortedData = data.sort((a, b) => {
    const unixA = new Date(a.last_updated).getTime();
    const unixB = new Date(b.last_updated).getTime();
    return unixB - unixA;
  });

  return successResponse(res, sortedData, 'Collections retrieved successfully');
});

// Add a movie to a collection
exports.addMovieToCollection = asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(res, errors.array()[0].msg, 400);
  }

  const { collection_id } = req.params;
  const { is_tv_show, movie_id, tv_show_id, notes, title, poster_path, rating, rating_count } = req.body;

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
  const { data: collectionData, error: collectionError } = await supabase
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

  if (is_tv_show) {
    // Check if tv show already exists in the collection
    const { data: existingTvShowInCollection } = await supabase
    .from(moviesCollectionsTable)
    .select('*')
    .eq('collection_id', collection_id)
    .eq('tv_show_id', tv_show_id)
    .single();

    if (existingTvShowInCollection) {
      return errorResponse(res, 'TV Show already exists in this collection', 400);
    }

    // Check if the TV show already exists in the tv shows table, if not then add
    const { tableName: tvShowsTable, error: tvShowsTableError } = getTableName(TV_SHOWS);
    if (tvShowsTableError) {
      console.error('Environment error:', tvShowsTableError);
      return errorResponse(res, tvShowsTableError, 500);
    }

    const { data: existingTvShow } = await supabase
    .from(tvShowsTable)
    .select('*')
    .eq('id', tv_show_id)
    .single();

    if (!existingTvShow) {
      const { error: insertTvShowError } = await supabase.from(tvShowsTable).insert([{
        id: tv_show_id,
        title,
        poster_path,
        rating,
        rating_count
      }])

      if (insertTvShowError) {
        console.error('Error inserting tv show:', insertTvShowError);
        const debugMessage = insertTvShowError?.message
        return errorResponse(res, 'Error adding TV show to collection.', 500, debugMessage);
      }
    }
  } else {
    const { data: existingMovieInCollection } = await supabase
    .from(moviesCollectionsTable)
    .select('*')
    .eq('collection_id', collection_id)
    .eq('movie_id', movie_id)
    .single();

    if (existingMovieInCollection) {
      return errorResponse(res, 'Movie already exists in this collection', 400);
    }

    // Check if the movie already exists in the movies table, if not then add
    const { tableName: moviesTable, error: moviesTableError } = getTableName(MOVIES);
    if (moviesTableError) {
      console.error('Environment error:', moviesTableError);
      return errorResponse(res, moviesTableError, 500);
    }

    const { data: existingMovie } = await supabase
    .from(moviesTable)
    .select('*')
    .eq('id', movie_id)
    .single();

    if (!existingMovie) {
      const { error: insertMovieError } = await supabase.from(moviesTable).insert([{
        id: movie_id,
        title,
        poster_path,
        rating,
        rating_count
      }])

      if (insertMovieError) {
        console.error('Error inserting movie:', insertMovieError);
        const debugMessage = insertMovieError?.message
        return errorResponse(res, 'Error adding movie to collection.', 500, debugMessage);
      }
    }
  }

  // Add movie/tv show to collection
  const { data, error } = await supabase
  .from(moviesCollectionsTable)
  .insert([{
    collection_id,
    movie_id: is_tv_show ? null : movie_id,
    tv_show_id: is_tv_show ? tv_show_id : null,
    is_tv_show,
    notes,
    user_id: userId
  }])
  .select();

  if (error) {
    console.error('Error adding movie to collection:', error);
    const debugMessage = error?.message
    return errorResponse(res, 'Failed to add movie to collection', 500, debugMessage);
  }

  return successResponse(res, data[0], 'Movie added to collection successfully', 201);
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
  const { data: collectionData, error: collectionError } = await supabase
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
  const { data, error } = await supabase
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
      ${moviesTable}(title, poster_path, rating, rating_count),
      ${tvShowsTable}(title, poster_path, rating, rating_count)
    `)
    .eq('collection_id', collection_id)
    .eq('user_id', userId);

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
    id: item.is_tv_show ? item.tv_show_id : item.movie_id
  }))

  return successResponse(res, movies, 'Collection movies retrieved successfully');
});

// Remove a movie from a collection
exports.removeMovieFromCollection = asyncHandler(async (req, res) => {
  const { collection_id, movie_id } = req.params;
  const userId = req.user.id; // Assuming user ID is available from auth middleware

  const { tableName: collectionsTable, error: collectionsTableError } = getTableName(COLLECTIONS);
  if (collectionsTableError) {
    console.error('Environment error:', collectionsTableError);
    return errorResponse(res, collectionsTableError, 500);
  }

  // First verify the collection belongs to the user
  const { data: collectionData, error: collectionError } = await supabase
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
  const { error } = await supabase
    .from(moviesCollectionsTable)
    .delete()
    .eq('collection_id', collection_id)
    .eq('movie_id', movie_id)
    .eq('user_id', userId);

  if (error) {
    console.error('Error removing movie from collection:', error);
    const debugMessage = error?.message
    return errorResponse(res, 'Failed to remove movie from collection', 500, debugMessage);
  }

  return successResponse(res, null, 'Movie removed from collection successfully');
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
  const { data: collectionData, error: collectionError } = await supabase
    .from(collectionsTable)
    .select('*')
    .eq('id', collection_id)
    .eq('user_id', userId)
    .single();

  if (collectionError || !collectionData) {
    return errorResponse(res, 'Collection not found or access denied', 404, collectionError?.message);
  }

  const { tableName: moviesCollectionsTable, error: moviesCollectionsTableError } = getTableName(MOVIES_COLLECTIONS);
  if (moviesCollectionsTableError) {
    console.error('Environment error:', moviesCollectionsTableError);
    return errorResponse(res, moviesCollectionsTableError, 500);
  }

  // First delete all movies in the collection
  const { error: moviesDeleteError } = await supabase
    .from(moviesCollectionsTable)
    .delete()
    .eq('collection_id', collection_id)
    .eq('user_id', userId);

  if (moviesDeleteError) {
    console.error('Error deleting collection movies:', moviesDeleteError);
    return errorResponse(res, 'Failed to delete collection movies', 500);
  }

  // Then delete the collection
  const { error } = await supabase
    .from(collectionsTable)
    .delete()
    .eq('id', collection_id)
    .eq('user_id', userId);

  if (error) {
    console.error('Error deleting collection:', error);
    const debugMessage = error?.message
    return errorResponse(res, 'Failed to delete collection', 500, debugMessage);
  }

  return successResponse(res, null, 'Collection deleted successfully');
});