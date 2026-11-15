// TMDB ids are positive, without leading zeros or signs, and fit 32-bit integer columns.
const isTmdbId = (value) =>
  (typeof value === 'number' || typeof value === 'string') &&
  /^[1-9]\d*$/.test(String(value)) &&
  Number(value) <= 2147483647;

module.exports = { isTmdbId };
