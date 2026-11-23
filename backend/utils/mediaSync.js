const { createClient } = require('@supabase/supabase-js');
const { requestMovie } = require('./detailSeo');
const { getTableName, MOVIES, TV_SHOWS } = require('./tableNames');

const MAX_FAILURES_IN_ROW = 5;

const getChanges = (item, tmdb, isTvShow) => {
  const latest = {
    title: isTvShow ? tmdb.name : tmdb.title,
    poster_path: tmdb.poster_path ?? item.poster_path, // TMDB dropping its artwork must not erase ours
    rating: tmdb.vote_average,
    rating_count: tmdb.vote_count,
    release_date: (isTvShow ? tmdb.first_air_date : tmdb.release_date) || null,
  };
  return Object.keys(latest).some((key) => latest[key] !== item[key]) ? latest : null;
};

const syncTable = async (supabase, tableName, isTvShow) => {
  // Supabase selects return at most 1000 rows without pagination.
  const { data: media, error } = await supabase.from(tableName).select('*');
  if (error) throw new Error(`Failed to fetch ${tableName}: ${error.message}`);

  let updated = 0;
  let skipped = 0;
  let failed = 0;
  let failedInRow = 0;
  for (const item of media) {
    // A TMDB outage fails every title, so stop early and let the retry delay handle it.
    if (failedInRow === MAX_FAILURES_IN_ROW)
      throw new Error(`Stopped ${tableName} sync after ${MAX_FAILURES_IN_ROW} failures in a row`);
    try {
      let tmdb;
      try {
        // Background work can wait longer than a page render for TMDB.
        tmdb = await requestMovie(item.id, isTvShow, 15000);
        failedInRow = 0;
      } catch (requestError) {
        failedInRow++;
        throw requestError;
      }
      // A title TMDB doesn't have stays missing on a retry, so it can't count as a failed run
      if (!tmdb) {
        skipped++;
        console.warn(`Media sync skipped ${tableName} id ${item.id}: not on TMDB`);
        continue;
      }

      const changes = getChanges(item, tmdb, isTvShow);
      if (!changes) continue;

      const { error: updateError } = await supabase
        .from(tableName)
        .update({ ...changes, updated_at: new Date().toISOString() })
        .eq('uuid', item.uuid);
      if (updateError) throw new Error(updateError.message);
      updated++;
    } catch (itemError) {
      // One bad title must not stop the rest of the sync
      failed++;
      console.error(`Media sync failed ${tableName} id ${item.id}:`, itemError.message);
    }
  }

  console.log(
    `Media sync ${tableName}: checked ${media.length}, updated ${updated}, skipped ${skipped}, failed ${failed}`,
  );
  return { checked: media.length, updated, skipped, failed };
};

const syncMedia = async () => {
  const { tableName: moviesTable, error: moviesTableError } = getTableName(MOVIES);
  const { tableName: tvShowsTable, error: tvShowsTableError } = getTableName(TV_SHOWS);
  if (moviesTableError || tvShowsTableError) throw new Error(moviesTableError || tvShowsTableError);

  // Service key: a background run has no signed-in user to act as
  const supabase = createClient(
    process.env.FAVMOV_SUPABASE_URL,
    process.env.FAVMOV_SUPABASE_S_KEY,
    {
      auth: { autoRefreshToken: false, persistSession: false }, // otherwise each run leaves a timer in the server
    },
  );

  // TV shows still sync when the movie pass stops, and the run still reports the stop.
  let stopped = null;
  let failed = 0;
  for (const [table, isTvShow] of [
    [moviesTable, false],
    [tvShowsTable, true],
  ]) {
    try {
      failed += (await syncTable(supabase, table, isTvShow)).failed;
    } catch (error) {
      stopped ??= error;
    }
  }
  if (stopped) throw stopped;
  if (failed) throw new Error(`${failed} media rows failed to sync`);
};

module.exports = { getChanges, syncTable, syncMedia };

if (require.main === module) {
  require('dotenv').config();
  syncMedia().catch((error) => {
    console.error('Media sync failed:', error);
    process.exitCode = 1;
  });
}
