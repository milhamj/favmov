const { getTableName } = require('../utils/tableNames');

exports.table = (name) => {
  const result = getTableName(name);
  if (result.error) throw Object.assign(new Error(result.error), { tableError: true });
  return result;
};

exports.findEntry = async (client, moviesCollectionsTable, collection_id, is_tv_show, mediaId) =>
  client
    .from(moviesCollectionsTable)
    .select('*')
    .eq('collection_id', collection_id)
    .eq(is_tv_show ? 'tv_show_id' : 'movie_id', mediaId)
    .order('created_at', { ascending: false })
    .limit(1);

exports.containingEntries = async (
  client,
  moviesCollectionsTable,
  userId,
  is_tv_show,
  movie_or_tv_show_id,
) => {
  const query = client.from(moviesCollectionsTable).select(`*`).eq('user_id', userId);

  if (is_tv_show) {
    query.eq('tv_show_id', movie_or_tv_show_id);
  } else {
    query.eq('movie_id', movie_or_tv_show_id);
  }

  return await query.order('created_at', { ascending: false });
};

exports.removeEntry = async (
  client,
  moviesCollectionsTable,
  userId,
  is_tv_show,
  collection_id,
  movie_id,
) => {
  const query = client
    .from(moviesCollectionsTable)
    .delete()
    .eq('collection_id', collection_id)
    .eq('user_id', userId);

  if (is_tv_show) {
    query.eq('tv_show_id', movie_id);
  } else {
    query.eq('movie_id', movie_id);
  }

  return await query;
};

exports.deleteCollection = async (client, userId, collectionsTable, collection_id) =>
  client.from(collectionsTable).delete().eq('id', collection_id).eq('user_id', userId);

exports.ownedCollection = async (client, userId, collectionsTable, collection_id) =>
  client.from(collectionsTable).select('*').eq('id', collection_id).eq('user_id', userId).single();

exports.collectionsForUser = async (client, userId, collectionsTable) =>
  client.from(collectionsTable).select(`*`).eq('user_id', userId);

exports.collectionMovies = async (
  client,
  userId,
  collection_id,
  moviesCollectionsTable,
  moviesTable,
  tvShowsTable,
) =>
  client
    .from(moviesCollectionsTable)
    .select(
      `
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
    `,
    )
    .eq('collection_id', collection_id)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

exports.updateNotes = async (
  client,
  userId,
  collection_id,
  moviesCollectionsTable,
  movie_id,
  is_tv_show,
  notes,
) =>
  client
    .from(moviesCollectionsTable)
    .update({ notes })
    .eq('collection_id', collection_id)
    .eq('user_id', userId)
    .eq(is_tv_show ? 'tv_show_id' : 'movie_id', movie_id)
    .select();

exports.insertEntry = async (
  client,
  collection_id,
  moviesCollectionsTable,
  movie_id,
  tv_show_id,
  is_tv_show,
  notes,
) =>
  client
    .from(moviesCollectionsTable)
    .insert([
      {
        collection_id,
        movie_id: is_tv_show ? null : movie_id,
        tv_show_id: is_tv_show ? tv_show_id : null,
        is_tv_show,
        notes,
      },
    ])
    .select();

exports.insertMedia = async (
  client,
  mediaTable,
  mediaId,
  title,
  poster_path,
  rating,
  rating_count,
  release_date,
) =>
  client.from(mediaTable).insert([
    {
      id: mediaId,
      title,
      poster_path,
      rating,
      rating_count,
      release_date,
    },
  ]);

exports.findMedia = async (client, mediaTable, mediaId) =>
  client.from(mediaTable).select('*').eq('id', mediaId).single();

exports.latestMovies = async (client, userId, latestMoviesCollectionTable) =>
  client.rpc(latestMoviesCollectionTable, {
    user_id_input: userId,
  });

exports.userCollections = async (client, userId, collectionsTable) =>
  client.rpc(collectionsTable, { user_id_input: userId });

exports.insertCollection = async (client, tableName, name) =>
  client.from(tableName).insert([{ name }]).select();

exports.listCollections = async (client, tableName, userId) =>
  client.from(tableName).select('*').eq('user_id', userId);
