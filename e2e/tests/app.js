const base = require('@playwright/test');

// The icon buttons have no accessible name, so they are found by their MaterialIcons glyph
const ICONS = { search: '', favorite: '', favoriteOutline: '', back: '', add: '' };

const media = (id, title, extra = {}) => ({
  id,
  title,
  name: title,
  poster_path: `/${id}.jpg`,
  vote_average: 7.5,
  vote_count: 120,
  overview: `About ${title}`,
  release_date: '2001-02-03',
  first_air_date: '2001-02-03',
  ...extra,
});

const MOVIE = media(101, 'Galaxy Quest', {
  runtime: 102,
  genres: [{ name: 'Comedy' }],
  credits: {
    cast: [{ id: 501, name: 'Sigourney Weaver', character: 'Gwen', profile_path: '/s.jpg' }],
    crew: [{ id: 502, name: 'Dean Parisot', job: 'Director' }],
  },
});
const SHOW = media(202, 'Star Trek', { credits: { cast: [], crew: [] } });
const POPULAR = media(303, 'Popular Film');
const PERSON = {
  id: 501,
  name: 'Sigourney Weaver',
  known_for_department: 'Acting',
  gender: 1,
  biography: 'An American actress.',
  movie_credits: {
    cast: [
      {
        id: 101,
        title: 'Galaxy Quest',
        character: 'Gwen',
        release_date: '1999-12-25',
        vote_average: 7.3,
        vote_count: 10,
      },
    ],
    crew: [],
  },
  tv_credits: { cast: [], crew: [] },
};

const tmdbBody = (url) => {
  const path = url.pathname.replace('/3/', '');
  const list = (...results) => ({ results, total_pages: 1 });
  if (path === 'trending/movie/week') return list(MOVIE);
  if (path === 'trending/tv/week') return list(SHOW);
  if (path === 'movie/popular') return list(POPULAR);
  if (path === 'search/movie')
    return url.searchParams.get('query') === 'galaxy' ? list(MOVIE) : list();
  if (path === 'search/tv') return list(SHOW);
  if (path === 'search/person') return list(PERSON);
  if (path === 'movie/101') return MOVIE;
  if (path === 'tv/202') return SHOW;
  if (path === 'person/501') return PERSON;
  return null;
};

const test = base.test.extend({
  page: async ({ page }, use) => {
    // Nothing may reach the internet. Later routes win, so TMDB is carved out of this one.
    await page.route(
      (url) => url.hostname !== '127.0.0.1',
      (route) => route.abort(),
    );
    await page.route('https://api.themoviedb.org/3/**', (route) => {
      const body = tmdbBody(new URL(route.request().url()));
      return route.fulfill({
        status: body ? 200 : 404,
        contentType: 'application/json',
        headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' },
        body: JSON.stringify(body ?? { status_message: 'Not found' }),
      });
    });
    await use(page);
  },
});

// Pushed screens stay mounted underneath, so the top screen's icon is the last match
const icon = (page, name) => page.getByText(ICONS[name], { exact: true }).last();

// Starts from /login, so afterwards the app has no page to go back to and lands on home
const signIn = async (page) => {
  await page.goto('/login');
  await page.getByPlaceholder('Email').fill('alice@example.com');
  await page.getByText('Send OTP').click();
  await page.getByPlaceholder('Input your OTP here...').fill('123456');
  await page.getByText('LOGIN', { exact: true }).click();
  await base.expect(page.getByText('Trending Movies')).toBeVisible();
};

const openTab = (page, name) => page.getByRole('tab', { name }).click();

const createCollection = async (page, name) => {
  await openTab(page, 'Collections');
  await page.getByText('Create Collection').click();
  await page.getByPlaceholder('Type collection name here...').fill(name);
  await page.getByText('Save', { exact: true }).click();
  await base.expect(page.getByText(`"${name}" has been created successfully`)).toBeVisible();
};

// The browser focus ring wraps the focused element, so the input itself must draw the field
// surface; any border or fill on a wrapper hugging the input shows a second box around the ring.
const expectFieldOwnsFocusRing = async (input) => {
  await input.focus();
  await base.expect(input).toBeFocused();
  await base.expect(input).not.toHaveCSS('outline-style', 'none');
  await base.expect(input).toHaveCSS('border-top-width', '1px');
  const decoratedWrappers = await input.evaluate((el) => {
    const field = el.getBoundingClientRect();
    const found = [];
    for (let node = el.parentElement; node; node = node.parentElement) {
      const box = node.getBoundingClientRect();
      // Wrappers around just the field stay under twice its area; past that it's the form or page.
      if (box.width * box.height > 2 * field.width * field.height) break;
      const style = getComputedStyle(node);
      if (style.borderTopWidth !== '0px' || style.backgroundColor !== 'rgba(0, 0, 0, 0)') {
        found.push(node.outerHTML.slice(0, 80));
      }
    }
    return found;
  });
  base.expect(decoratedWrappers).toEqual([]);
};

module.exports = {
  test,
  expect: base.expect,
  icon,
  signIn,
  openTab,
  createCollection,
  expectFieldOwnsFocusRing,
};
