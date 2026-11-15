const express = require('express');
const fs = require('fs/promises');
const path = require('path');
const { applyMovieSeo, fetchMovie } = require('../utils/movieSeo');
const { isTmdbId } = require('../utils/tmdbId');

const createPageRoutes = (publicDir) => {
  const router = express.Router();

  // Rewritten rather than redirected, so //example.com/ can't become an open redirect
  router.use((req, res, next) => {
    if (req.path.length > 1 && req.path.endsWith('/'))
      req.url = req.url.replace(/(.)\/+(?=\?|$)/, '$1');
    next();
  });
  // Expo exports package assets under node_modules/.pnpm, and express.static hides dot folders by default
  router.use(
    '/assets/node_modules',
    express.static(path.join(publicDir, 'assets', 'node_modules'), {
      dotfiles: 'allow',
      redirect: false,
    }),
  );
  router.use(express.static(publicDir, { extensions: ['html'], redirect: false }));

  // Each route has its own prerendered HTML; serving another route's breaks hydration - must be last
  router.use(async (req, res) => {
    const [, page, id] = req.path.match(/^\/(movie|people|collection)\/([^/]+)$/) ?? [];
    const isInvalidId = Boolean(page) && page !== 'collection' && !isTmdbId(id);
    const movieId = page === 'movie' && !isInvalidId ? id : undefined;
    if (movieId && process.env.FAVMOV_TMDB_API_KEY) {
      try {
        const isTvShow = req.query.is_tv_show === 'true';
        const [html, movie] = await Promise.all([
          fs.readFile(path.join(publicDir, 'movie', '[id].html'), 'utf8'),
          fetchMovie(movieId, isTvShow),
        ]);
        if (!movie) return res.status(404).type('html').send(html);
        const pagePath = `/movie/${movieId}${isTvShow ? '?is_tv_show=true' : ''}`;
        return res.type('html').send(applyMovieSeo(html, movie, pagePath));
      } catch (error) {
        console.error('Movie SEO failed, serving default head:', error.message);
      }
    }

    if (page) {
      return res.status(isInvalidId ? 404 : 200).sendFile(path.join(publicDir, page, '[id].html'));
    }
    // collection/ is also a directory, so express.static skips collection.html
    if (req.path === '/collection') return res.sendFile(path.join(publicDir, 'collection.html'));
    res.status(404).sendFile(path.join(publicDir, '+not-found.html'));
  });

  return router;
};

module.exports = createPageRoutes;
