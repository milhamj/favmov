const SITE_URL = 'https://favmov.milhamj.com';
const TMDB_IMAGE_URL = 'https://image.tmdb.org/t/p/w500';
const CACHE_TTL_MS = 60 * 60 * 1000;
const CACHE_MAX_ENTRIES = 1000; // crawlers can walk many ids, so memory has to stay bounded

const movieCache = new Map();

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

// Only successes are stored, so a TMDB outage isn't remembered after it ends
const fetchMovie = async (id, isTvShow) => {
  const key = `${isTvShow ? 'tv' : 'movie'}/${id}`;
  const cached = movieCache.get(key);
  if (cached && Date.now() < cached.expiresAt) return cached.movie;

  const response = await fetch(`https://api.themoviedb.org/3/${key}`, {
    headers: { Authorization: `Bearer ${process.env.FAVMOV_TMDB_API_KEY}` },
    signal: AbortSignal.timeout(2000),
  });
  if (!response.ok) throw new Error(`TMDB responded with ${response.status}`);
  const movie = await response.json();

  movieCache.delete(key);
  // A Map iterates in insertion order, so the first key is the oldest entry
  if (movieCache.size >= CACHE_MAX_ENTRIES) movieCache.delete(movieCache.keys().next().value);
  movieCache.set(key, { movie, expiresAt: Date.now() + CACHE_TTL_MS });
  return movie;
};

module.exports = { applyMovieSeo, fetchMovie };
