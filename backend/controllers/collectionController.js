const { body, validationResult } = require('express-validator');
const supabase = require('../config/supabase');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse } = require('../utils/responses');
const { getTableName, COLLECTIONS, MOVIES_COLLECTIONS } = require('../utils/tableNames');

// Validation rules
exports.validateCollection = [
  body('name').trim().notEmpty().withMessage('Collection name is required')
];

exports.validateMovieToCollection = [
  body('movie_id').isInt().withMessage('Valid movie ID is required')
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

  const { tableName, error: tableError } = getTableName(COLLECTIONS);
  if (tableError) {
    console.error('Environment error:', tableError);
    return errorResponse(res, tableError, 500);
  }

  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching collections:', error);
    const debugMessage = error?.message
    return errorResponse(res, 'Failed to fetch collections', 500, debugMessage);
  }

  return successResponse(res, data, 'Collections retrieved successfully');
});

// Add a movie to a collection
exports.addMovieToCollection = asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(res, errors.array()[0].msg, 400);
  }

  const { collection_id } = req.params;
  const { movie_id, notes } = req.body;
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

  // Check if movie already exists in the collection
  const { data: existingMovie, error: existingMovieError } = await supabase
    .from(moviesCollectionsTable)
    .select('*')
    .eq('collection_id', collection_id)
    .eq('movie_id', movie_id)
    .single();

  if (existingMovie) {
    return errorResponse(res, 'Movie already exists in this collection', 400);
  }

  // Add movie to collection
  const { data, error } = await supabase
    .from(moviesCollectionsTable)
    .insert([{
      collection_id,
      movie_id,
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
  if (moviesCollectionsTableError) {
    console.error('Environment error:', moviesCollectionsTableError);
    return errorResponse(res, moviesCollectionsTableError, 500);
  }

  // Get all movies in the collection
  const { data, error } = await supabase
    .from(moviesCollectionsTable)
    .select('*')
    .eq('collection_id', collection_id)
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching collection movies:', error);
    const debugMessage = error?.message
    return errorResponse(res, 'Failed to fetch collection movies', 500, debugMessage);
  }

  return successResponse(res, data, 'Collection movies retrieved successfully');
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
    return errorResponse(res, 'Collection not found or access denied', 404);
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