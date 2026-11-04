const SITE_URL = 'https://favmov.milhamj.com';
const TMDB_IMAGE_URL = 'https://image.tmdb.org/t/p/w500';

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

// shortcut: one TMDB call per page load, add a small cache if crawlers hit the rate limit
const fetchMovie = async (id, isTvShow) => {
  const response = await fetch(`https://api.themoviedb.org/3/${isTvShow ? 'tv' : 'movie'}/${id}`, {
    headers: { Authorization: `Bearer ${process.env.FAVMOV_TMDB_API_KEY}` },
    signal: AbortSignal.timeout(2000),
  });
  if (!response.ok) throw new Error(`TMDB responded with ${response.status}`);
  return response.json();
};

module.exports = { applyMovieSeo, fetchMovie };
