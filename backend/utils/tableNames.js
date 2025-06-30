const getTableName = (baseName) => {
  const env = process.env.NODE_ENV;
  
  if (env === 'development') {
    return { 
      tableName: `dev_${baseName}`,
      error: null
    };
  } else if (env === 'production') {
    return {
      tableName: `prod_${baseName}`,
      error: null
    };
  } else {
    return {
      tableName: null,
      error: `Invalid environment: ${env}. Only 'development' and 'production' are supported.`
    };
  }
};

module.exports = {
  getTableName,
  COLLECTIONS: 'collections',
  MOVIES: 'movies',
  TV_SHOWS: 'tv_shows',
  MOVIES_COLLECTIONS: 'movies_collections',
  COLLECTIONS_WITH_MOVIE_COUNT: 'collections_with_movie_count'
};