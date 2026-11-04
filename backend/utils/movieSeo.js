const SITE_URL = 'https://favmov.milhamj.com';
const TMDB_IMAGE_URL = 'https://image.tmdb.org/t/p/w500';
const CACHE_TTL_MS = 60 * 60 * 1000;
const NOT_FOUND_TTL_MS = 5 * 60 * 1000;
const FAILURE_BACKOFF_MS = 30 * 1000;
const CACHE_MAX_ENTRIES = 1000; // crawlers can walk many ids, so memory has to stay bounded

const movieCache = new Map();
const pendingLookups = new Map();
let retryTmdbAt = 0;

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

const setMeta = (html, attribute, key, value) => html.replace(
  new RegExp(`(<meta[^>]*${attribute}="${key}" content=")[^"]*`),
  (_, prefix) => prefix + escapeHtml(value)
);

// Expo can't render per request, so fill the prerendered template's head from TMDB data
const applyMovieSeo = (html, movie, pagePath) => {
  const title = `${movie.title || movie.name} | FavMov`;

  let result = html.replace(/(<title[^>]*>)[^<]*/, (_, prefix) => prefix + escapeHtml(title));
  result = setMeta(result, 'property', 'og:title', title);
  result = setMeta(result, 'property', 'twitter:title', title);
  result = setMeta(result, 'property', 'og:url', SITE_URL + pagePath);
  if (movie.overview) {
    result = setMeta(result, 'name', 'description', movie.overview);
    result = setMeta(result, 'property', 'og:description', movie.overview);
    result = setMeta(result, 'property', 'twitter:description', movie.overview);
  }
  if (movie.poster_path) {
    result = setMeta(result, 'property', 'og:image', TMDB_IMAGE_URL + movie.poster_path);
    result = setMeta(result, 'property', 'twitter:image', TMDB_IMAGE_URL + movie.poster_path);
  }
  return result;
};

const requestMovie = async (id, isTvShow) => {
  const key = `${isTvShow ? 'tv' : 'movie'}/${id}`;
  const response = await fetch(`https://api.themoviedb.org/3/${key}`, {
    headers: { Authorization: `Bearer ${process.env.FAVMOV_TMDB_API_KEY}` },
    signal: AbortSignal.timeout(2000),
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`TMDB responded with ${response.status}`);
  return response.json();
};

const cacheMovie = (key, movie) => {
  movieCache.delete(key);
  // A Map iterates in insertion order, so the first key is the oldest entry
  if (movieCache.size >= CACHE_MAX_ENTRIES) movieCache.delete(movieCache.keys().next().value);
  movieCache.set(key, { movie, expiresAt: Date.now() + (movie ? CACHE_TTL_MS : NOT_FOUND_TTL_MS) });
};

// Resolves to null when TMDB has no such title. Other failures reject, and pause all
// lookups briefly so an outage doesn't add the timeout to every page view.
const fetchMovie = async (id, isTvShow) => {
  const key = `${isTvShow ? 'tv' : 'movie'}/${id}`;
  const cached = movieCache.get(key);
  if (cached && Date.now() < cached.expiresAt) return cached.movie;
  if (pendingLookups.has(key)) return pendingLookups.get(key);
  if (Date.now() < retryTmdbAt) throw new Error('Skipping TMDB after a recent failure');

  const lookup = requestMovie(id, isTvShow)
    .then((movie) => {
      cacheMovie(key, movie);
      return movie;
    })
    .catch((error) => {
      retryTmdbAt = Date.now() + FAILURE_BACKOFF_MS;
      throw error;
    })
    .finally(() => pendingLookups.delete(key));
  pendingLookups.set(key, lookup);
  return lookup;
};

module.exports = { applyMovieSeo, fetchMovie, requestMovie };
