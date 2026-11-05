const mediaSync = require('../utils/mediaSync');

// One bad row fails a whole run, and a title removed from TMDB fails every run, so retries must stay spaced out
const RETRY_DELAY_MS = 60 * 60 * 1000;

let lastRunDay = null; // set only by a clean run, so a failed one is retried
let retryAt = 0;
let running = false;

/**
 * Refreshes stored TMDB data in the background on the first request of each UTC day
 */
const dailyMediaSync = (req, res, next) => {
  const today = new Date().toISOString().slice(0, 10);

  // shortcut: this state lives in memory, so it only guards one process; store it in Supabase if running several instances
  if (
    process.env.FAVMOV_SUPABASE_S_KEY && process.env.FAVMOV_TMDB_API_KEY
    && !running && lastRunDay !== today && Date.now() >= retryAt
  ) {
    running = true; // set before starting so simultaneous requests can't start a second run
    mediaSync.syncMedia()
      .then(() => { lastRunDay = today; })
      .catch((error) => {
        retryAt = Date.now() + RETRY_DELAY_MS;
        console.error('Media sync failed, retrying in an hour:', error);
      })
      .finally(() => { running = false; });
  }

  next();
};

module.exports = { dailyMediaSync, RETRY_DELAY_MS };
