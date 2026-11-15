const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse } = require('../utils/responses');
const { firstValidationError } = require('../validators/collectionValidators');
const repository = require('../repositories/collectionRepository');
const {
  COLLECTIONS,
  MOVIES_COLLECTIONS,
  TV_SHOWS,
  MOVIES,
  COLLECTIONS_WITH_MOVIE_COUNT,
  LATEST_MOVIES_IN_COLLECTION,
} = require('../utils/tableNames');

const collectionHandler = (handler) =>
  asyncHandler(async (req, res) => {
    try {
      return await handler(req, res);
    } catch (error) {
      if (!error.tableError) throw error;
      console.error('Environment error:', error.message);
      return errorResponse(res, error.message, 500);
    }
  });

exports.createCollection = collectionHandler(async (req, res) => {
  const validationError = firstValidationError(req);
  if (validationError) return errorResponse(res, validationError, 400);

  const { name } = req.body;
  const userId = req.user.id;

  const { tableName } = repository.table(COLLECTIONS);

  const { data: selectData, error: selectError } = await repository.listCollections(
    req.supabase,
    tableName,
    userId,
  );

  if (selectError) {
    console.error('Error fetching collections:', selectError);
    const debugMessage = selectError?.message;
    return errorResponse(res, 'Failed to fetch collections', 500, debugMessage);
  }

  if (selectData) {
    const existingCollection = selectData.find(
      (collection) => collection.name.toLowerCase() === name.toLowerCase(),
    );
    if (existingCollection) {
      return errorResponse(res, 'You already have a collection with the same name.', 400);
    }
  }

  const { data, error } = await repository.insertCollection(req.supabase, tableName, name);

  if (error) {
    console.error('Error creating collection:', error);
    const debugMessage = error?.message;
    return errorResponse(res, 'Failed to create collection', 500, debugMessage);
  }

  return successResponse(res, data[0], 'Collection created successfully', 201);
});

exports.getUserCollections = collectionHandler(async (req, res) => {
  const userId = req.user.id;

  const { tableName: collectionsTable } = repository.table(COLLECTIONS_WITH_MOVIE_COUNT);

  const { data, error } = await repository.userCollections(req.supabase, userId, collectionsTable);

  if (error) {
    console.error('Error fetching collections:', error);
    const debugMessage = error?.message;
    return errorResponse(res, 'Failed to fetch collections', 500, debugMessage);
  }

  data.forEach((element) => {
    if (element && !element.last_updated) {
      element.last_updated = element.created_at;
    }
  });

  data.sort(
    (a, b) =>
      b.movies_count - a.movies_count ||
      new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime(),
  );

  return successResponse(res, data, 'Collections retrieved successfully');
});

exports.getLatestCollectionMovies = collectionHandler(async (req, res) => {
  const userId = req.user.id;

  const { tableName: latestMoviesCollectionTable } = repository.table(LATEST_MOVIES_IN_COLLECTION);

  const { data, error } = await repository.latestMovies(
    req.supabase,
    userId,
    latestMoviesCollectionTable,
  );

  if (error) {
    console.error('Error fetching latest movies:', error);
    const debugMessage = error?.message;
    return errorResponse(res, 'Failed to fetch latest movies', 500, debugMessage);
  }

  const response = data.map((item) => {
    return {
      ...item,
      movie_id: undefined,
      tv_show_id: undefined,
      id: item.is_tv_show ? item.tv_show_id : item.movie_id,
    };
  });

  return successResponse(res, response, 'Latest movies retrieved successfully');
});

exports.addMovieToCollection = collectionHandler(async (req, res) => {
  const validationError = firstValidationError(req);
  if (validationError) return errorResponse(res, validationError, 400);

  const { collection_id } = req.params;
  const {
    is_tv_show,
    movie_id,
    tv_show_id,
    notes,
    title,
    poster_path,
    rating,
    rating_count,
    release_date,
  } = req.body;

  const userId = req.user.id;

  const { tableName: collectionsTable } = repository.table(COLLECTIONS);

  const { data: collectionData, error: collectionError } = await repository.ownedCollection(
    req.supabase,
    userId,
    collectionsTable,
    collection_id,
  );

  if (collectionError || !collectionData) {
    return errorResponse(res, 'Collection not found or access denied', 404);
  }

  const { tableName: moviesCollectionsTable } = repository.table(MOVIES_COLLECTIONS);

  const mediaId = is_tv_show ? tv_show_id : movie_id;
  const mediaLabel = is_tv_show ? 'TV show' : 'movie';
  const findEntry = () =>
    repository.findEntry(req.supabase, moviesCollectionsTable, collection_id, is_tv_show, mediaId);

  // Adding is idempotent, so a retry after a lost response finds its entry
  const { data: existingEntries, error: existingEntryError } = await findEntry();

  if (existingEntryError) {
    console.error(`Error checking collection ${mediaLabel}:`, existingEntryError);
    return errorResponse(
      res,
      `Error adding ${mediaLabel} to collection.`,
      500,
      existingEntryError.message,
    );
  }

  if (existingEntries.length > 0) {
    return successResponse(res, existingEntries[0], 'Already in this collection');
  }

  const { tableName: mediaTable } = repository.table(is_tv_show ? TV_SHOWS : MOVIES);

  const { data: existingMedia } = await repository.findMedia(req.supabase, mediaTable, mediaId);

  if (!existingMedia) {
    const { error: insertMediaError } = await repository.insertMedia(
      req.supabase,
      mediaTable,
      mediaId,
      title,
      poster_path,
      rating,
      rating_count,
      release_date,
    );

    // 23505: a concurrent add stored this title first, which is all this step needs.
    if (insertMediaError && insertMediaError.code !== '23505') {
      console.error(`Error inserting ${mediaLabel}:`, insertMediaError);
      const debugMessage = insertMediaError?.message;
      return errorResponse(res, `Error adding ${mediaLabel} to collection.`, 500, debugMessage);
    }
  }

  const { data, error } = await repository.insertEntry(
    req.supabase,
    collection_id,
    moviesCollectionsTable,
    movie_id,
    tv_show_id,
    is_tv_show,
    notes,
  );

  if (error?.code === '23505') {
    // A concurrent add won the unique index, so the entry the caller asked for exists.
    const { data: existing } = await findEntry();

    if (existing?.[0]) return successResponse(res, existing[0], 'Already in this collection');
  }

  if (error) {
    console.error('Error adding movie to collection:', error);
    const debugMessage = error?.message;
    return errorResponse(res, 'Failed to add movie to collection', 500, debugMessage);
  }

  return successResponse(res, data[0], 'Movie added to collection successfully', 201);
});

exports.updateMovieCollectionNotes = collectionHandler(async (req, res) => {
  const validationError = firstValidationError(req);
  if (validationError) return errorResponse(res, validationError, 400);

  const { collection_id, movie_id } = req.params;
  const { is_tv_show } = req.body;
  const notes = req.body.notes ?? '';

  const userId = req.user.id;

  const { tableName: moviesCollectionsTable } = repository.table(MOVIES_COLLECTIONS);

  const { data, error } = await repository.updateNotes(
    req.supabase,
    userId,
    collection_id,
    moviesCollectionsTable,
    movie_id,
    is_tv_show,
    notes,
  );

  if (error) {
    console.error("Error updating movie/tv show's collection notes:", error);
    const debugMessage = error?.message;
    return errorResponse(res, 'Failed to update notes', 500, debugMessage);
  }

  if (data.length === 0) {
    return errorResponse(res, `${is_tv_show ? 'TV Show' : 'Movie'} not found in collection.`, 404);
  }

  return successResponse(res, data[0], 'Collection notes updated successfully', 200);
});

exports.getCollectionMovies = collectionHandler(async (req, res) => {
  const { collection_id } = req.params;
  const userId = req.user.id;

  const { tableName: collectionsTable } = repository.table(COLLECTIONS);

  const { data: collectionData, error: collectionError } = await repository.ownedCollection(
    req.supabase,
    userId,
    collectionsTable,
    collection_id,
  );

  if (collectionError || !collectionData) {
    return errorResponse(res, 'Collection not found or access denied', 404);
  }

  const { tableName: moviesCollectionsTable } = repository.table(MOVIES_COLLECTIONS);
  const { tableName: moviesTable } = repository.table(MOVIES);
  const { tableName: tvShowsTable } = repository.table(TV_SHOWS);

  const { data, error } = await repository.collectionMovies(
    req.supabase,
    userId,
    collection_id,
    moviesCollectionsTable,
    moviesTable,
    tvShowsTable,
  );

  if (error) {
    console.error('Error fetching collection movies:', error);
    const debugMessage = error?.message;
    return errorResponse(res, 'Failed to fetch collection movies', 500, debugMessage);
  }

  const movies = data.map((item) => ({
    ...item[moviesTable],
    ...item[tvShowsTable],
    is_tv_show: item.is_tv_show,
    notes: item.notes,
    created_at: item.created_at,
    id: item.is_tv_show ? item.tv_show_id : item.movie_id,
  }));

  const response = collectionData;
  response.movies = movies;

  return successResponse(res, response, 'Collection movies retrieved successfully');
});

exports.getCheckMovieExistInCollection = collectionHandler(async (req, res) => {
  const validationError = firstValidationError(req);
  if (validationError) return errorResponse(res, validationError, 400);

  const { movie_or_tv_show_id } = req.params;
  const is_tv_show = req.query.is_tv_show === 'true';
  const userId = req.user.id;

  const { tableName: moviesCollectionsTable } = repository.table(MOVIES_COLLECTIONS);
  const { tableName: collectionsTable } = repository.table(COLLECTIONS);

  const [
    { data: moviesCollectionData, error: moviesCollectionError },
    { data: collectionData, error: collectionError },
  ] = await Promise.all([
    repository.containingEntries(
      req.supabase,
      moviesCollectionsTable,
      userId,
      is_tv_show,
      movie_or_tv_show_id,
    ),
    repository.collectionsForUser(req.supabase, userId, collectionsTable),
  ]);

  if (moviesCollectionError) {
    console.error('Error fetching collection movies:', moviesCollectionError);
    const debugMessage = moviesCollectionError?.message;
    return errorResponse(res, 'Failed to fetch collection movies', 500, debugMessage);
  }

  if (collectionError) {
    console.error('Error fetching collection movies:', collectionError);
    const debugMessage = collectionError?.message;
    return errorResponse(res, 'Failed to fetch collection movies', 500, debugMessage);
  }

  const response = [];
  collectionData.forEach((collection) => {
    const moviesCollectionItem = moviesCollectionData.find(
      (item) => item.collection_id === collection.id,
    );
    if (moviesCollectionItem) {
      response.push({
        collection_id: collection.id,
        collection_name: collection.name,
        notes: moviesCollectionItem.notes,
      });
    }
  });

  return successResponse(res, response, 'The movie/tv show has been checked successfully');
});

exports.removeMovieFromCollection = collectionHandler(async (req, res) => {
  const validationError = firstValidationError(req);
  if (validationError) return errorResponse(res, validationError, 400);

  const { collection_id, movie_id } = req.params;
  const is_tv_show = req.query.is_tv_show === 'true';
  const userId = req.user.id;

  const { tableName: collectionsTable } = repository.table(COLLECTIONS);

  const { data: collectionData, error: collectionError } = await repository.ownedCollection(
    req.supabase,
    userId,
    collectionsTable,
    collection_id,
  );

  if (collectionError || !collectionData) {
    return errorResponse(res, 'Collection not found or access denied', 404);
  }

  const { tableName: moviesCollectionsTable } = repository.table(MOVIES_COLLECTIONS);

  const { error } = await repository.removeEntry(
    req.supabase,
    moviesCollectionsTable,
    userId,
    is_tv_show,
    collection_id,
    movie_id,
  );

  if (error) {
    console.error('Error removing movie from collection:', error);
    const debugMessage = error?.message;
    return errorResponse(res, 'Failed to remove movie from collection', 500, debugMessage);
  }

  const response = {
    is_success: true,
  };

  return successResponse(res, response, 'Movie removed from collection successfully');
});

exports.deleteCollection = collectionHandler(async (req, res) => {
  const { collection_id } = req.params;
  const userId = req.user.id;

  const { tableName: collectionsTable } = repository.table(COLLECTIONS);

  const { data: collectionData, error: collectionError } = await repository.ownedCollection(
    req.supabase,
    userId,
    collectionsTable,
    collection_id,
  );

  if (collectionError || !collectionData) {
    return errorResponse(
      res,
      'Collection not found or access denied',
      404,
      collectionError?.message,
    );
  }

  // The collection foreign key cascades entries in the same database statement.
  const { error } = await repository.deleteCollection(
    req.supabase,
    userId,
    collectionsTable,
    collection_id,
  );

  if (error) {
    console.error('Error deleting collection:', error);
    const debugMessage = error?.message;
    return errorResponse(res, 'Failed to delete collection', 500, debugMessage);
  }

  const response = {
    is_success: true,
  };

  return successResponse(res, response, 'Collection deleted successfully');
});
