const mediaSync = require('../utils/mediaSync');

let lastRunDay = null;

/**
 * Refreshes stored TMDB data in the background on the first request of each UTC day
 */
const dailyMediaSync = (req, res, next) => {
  const today = new Date().toISOString().slice(0, 10);

  // shortcut: the day lives in memory, so a restart allows one extra run; store it in Supabase if running several instances
  if (process.env.FAVMOV_SUPABASE_S_KEY && process.env.FAVMOV_TMDB_API_KEY && lastRunDay !== today) {
    lastRunDay = today; // set before starting so simultaneous requests can't start a second run
    mediaSync.syncMedia().catch((error) => console.error('Media sync failed:', error));
  }

  next();
};

module.exports = { dailyMediaSync };
