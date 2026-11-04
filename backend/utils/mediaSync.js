require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { requestMovie } = require('./movieSeo');
const { getTableName, MOVIES, TV_SHOWS } = require('./tableNames');

// Returns the latest TMDB values when the stored row differs from them, otherwise null
const getChanges = (item, tmdb, isTvShow) => {
  const latest = {
    title: isTvShow ? tmdb.name : tmdb.title,
    poster_path: tmdb.poster_path,
    rating: tmdb.vote_average,
    rating_count: tmdb.vote_count,
    release_date: isTvShow ? tmdb.first_air_date : tmdb.release_date,
  };
  return Object.keys(latest).some((key) => latest[key] !== item[key]) ? latest : null;
};

const syncTable = async (supabase, tableName, isTvShow) => {
  // shortcut: Supabase caps a select at 1000 rows by default, page with .range() before a table outgrows that
  const { data: media, error } = await supabase.from(tableName).select('*');
  if (error) throw new Error(`Failed to fetch ${tableName}: ${error.message}`);

  let updated = 0;
  let failed = 0;
  for (const item of media) {
    try {
      const changes = getChanges(item, await requestMovie(item.id, isTvShow), isTvShow);
      if (!changes) continue;

      const { error: updateError } = await supabase
        .from(tableName)
        .update({ ...changes, updated_at: new Date().toISOString() })
        .eq('uuid', item.uuid);
      if (updateError) throw new Error(updateError.message);
      updated++;
    } catch (itemError) {
      // One bad title (e.g. removed from TMDB) must not stop the rest of the sync
      failed++;
      console.error(`Media sync skipped ${tableName} id ${item.id}:`, itemError.message);
    }
  }

  console.log(`Media sync ${tableName}: checked ${media.length}, updated ${updated}, failed ${failed}`);
  return { checked: media.length, updated, failed };
};

const syncMedia = async () => {
  const { tableName: moviesTable, error: moviesTableError } = getTableName(MOVIES);
  const { tableName: tvShowsTable, error: tvShowsTableError } = getTableName(TV_SHOWS);
  if (moviesTableError || tvShowsTableError) throw new Error(moviesTableError || tvShowsTableError);

  // Service key: a background run has no signed-in user to act as
  const supabase = createClient(process.env.FAVMOV_SUPABASE_URL, process.env.FAVMOV_SUPABASE_S_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }, // otherwise each run leaves a timer in the server
  });

  const movies = await syncTable(supabase, moviesTable, false);
  const tvShows = await syncTable(supabase, tvShowsTable, true);
  const failed = movies.failed + tvShows.failed;
  if (failed) throw new Error(`${failed} media rows failed to sync`);
};

module.exports = { getChanges, syncTable, syncMedia };

if (require.main === module) {
  syncMedia().catch((error) => {
    console.error('Media sync failed:', error);
    process.exitCode = 1;
  });
}
