const test = require('node:test');
const assert = require('node:assert');
const { applyMovieSeo } = require('./movieSeo');

const template = '<title data-rh="true">Default</title>'
  + '<meta data-rh="true" name="description" content="Default"/>'
  + '<meta data-rh="true" property="og:title" content="Default"/>'
  + '<meta data-rh="true" property="og:description" content="Default"/>'
  + '<meta data-rh="true" property="og:url" content="Default"/>'
  + '<meta data-rh="true" property="og:image" content="DefaultImage"/>'
  + '<meta data-rh="true" property="twitter:title" content="Default"/>';

test('fills the head from movie data', () => {
  const html = applyMovieSeo(template, { title: 'Up', overview: 'Balloons', poster_path: '/up.jpg' }, '/movie/1');
  assert.match(html, /<title data-rh="true">Up \| FavMov<\/title>/);
  assert.match(html, /name="description" content="Balloons"/);
  assert.match(html, /property="og:url" content="https:\/\/favmov.milhamj.com\/movie\/1"/);
  assert.match(html, /property="og:image" content="https:\/\/image.tmdb.org\/t\/p\/w500\/up.jpg"/);
  assert.match(html, /property="twitter:title" content="Up \| FavMov"/);
});

test('uses the TV show name and keeps defaults for missing fields', () => {
  const html = applyMovieSeo(template, { name: 'Dark', overview: '', poster_path: null }, '/movie/2');
  assert.match(html, /<title data-rh="true">Dark \| FavMov/);
  assert.match(html, /name="description" content="Default"/);
  assert.match(html, /property="og:image" content="DefaultImage"/);
});

test('escapes TMDB text so it cannot break out of the head', () => {
  const html = applyMovieSeo(template, { title: '</title><script>x</script>', overview: '"><script>$&' }, '/movie/3');
  assert.doesNotMatch(html, /<script/);
  assert.match(html, /name="description" content="&#34;&#62;&#60;script&#62;\$&#38;"/);
});
