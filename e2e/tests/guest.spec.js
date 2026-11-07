const { test, expect, icon } = require('./app');

test('a guest can browse from home to a title and a person', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Trending Movies')).toBeVisible();
  await expect(page.getByText('Trending TV Shows')).toBeVisible();
  await expect(page.getByText('Popular Film')).toBeVisible();
  await expect(page.getByText('Your Favorites')).toHaveCount(0);

  await page.getByText('Galaxy Quest').first().click();
  await expect(page).toHaveURL('/movie/101');
  await expect(page.getByText('About Galaxy Quest')).toBeVisible();
  await expect(page.getByText('102 minutes • 2001-02-03 • Directed by Dean Parisot')).toBeVisible();

  await page.getByText('Sigourney Weaver').click();
  await expect(page).toHaveURL('/people/501');
  await expect(page.getByText('An American actress.')).toBeVisible();

  await page.getByText('as Gwen').click();
  await expect(page).toHaveURL('/movie/101');
});

test('a TV show keeps its type through a reload', async ({ page }) => {
  await page.goto('/');
  await page.getByText('Star Trek').click();
  await expect(page).toHaveURL('/movie/202?is_tv_show=true');
  await page.reload();
  await expect(page.getByText(/• TV Show/)).toBeVisible();
});

test('View All opens the full list', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Popular Film')).toBeVisible(); // sections load independently, so last() could be an earlier one
  await page.getByText('View All').last().click();
  await expect(page).toHaveURL('/explore?section_type=Popular%20Movies');
  await expect(page.getByText('Popular Film').last()).toBeVisible(); // home stays mounted underneath
});

test('search covers movies, TV shows and people', async ({ page }) => {
  await page.goto('/search');
  await page.getByPlaceholder('Type any Movie title...').fill('galaxy');
  await expect(page.getByText('Galaxy Quest')).toBeVisible();

  await page.getByText('TV Show', { exact: true }).click();
  await expect(page.getByText('Star Trek')).toBeVisible();

  await page.getByText('People', { exact: true }).click();
  await page.getByText('Sigourney Weaver').click();
  await expect(page).toHaveURL('/people/501');
});

test('search says when nothing matches', async ({ page }) => {
  await page.goto('/search');
  await page.getByPlaceholder('Type any Movie title...').fill('zzz');
  await expect(page.getByText('No results found.')).toBeVisible();
});

test('a failed search can be retried', async ({ page }) => {
  let broken = true;
  await page.route('https://api.themoviedb.org/3/search/movie**', (route) => (broken ? route.abort() : route.fallback()));

  await page.goto('/search');
  await page.getByPlaceholder('Type any Movie title...').fill('galaxy');
  await expect(page.getByText('Unable to load results')).toBeVisible();

  broken = false;
  await page.getByText('Retry').click();
  await expect(page.getByText('Galaxy Quest')).toBeVisible();
});

test('protected pages send guests to login', async ({ page }) => {
  for (const path of ['/collection', '/profile', '/collection/some-id']) {
    await page.goto(path);
    await expect(page).toHaveURL(`/login?return_to=${encodeURIComponent(path)}`);
  }
});

test('the favorite button asks a guest to log in', async ({ page }) => {
  await page.goto('/movie/101');
  await expect(page.getByText('About Galaxy Quest')).toBeVisible();
  await icon(page, 'favoriteOutline').click();
  await expect(page).toHaveURL('/login?return_to=%2Fmovie%2F101');
});

test('an unknown page answers 404 and offers recovery', async ({ page }) => {
  const errors = [];
  page.on('console', message => {
    if (message.type() === 'error' && /hydrat|did not match/i.test(message.text())) errors.push(message.text());
  });
  for (const path of ['/no-such-page', '/movie/5/extra']) {
    expect((await page.goto(path)).status()).toBe(404);
    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
    const illustration = page.locator('img[src*="not_found_cinema"]');
    await expect(illustration).toHaveJSProperty('naturalWidth', 720);
    expect(await illustration.evaluate(image => {
      const bounds = image.getBoundingClientRect();
      return bounds.width / bounds.height;
    })).toBeCloseTo(1.5);
    await expect(page).toHaveTitle('Page not found | FavMov');
    expect((await page.reload()).status()).toBe(404);
    await page.getByRole('button', { name: 'Go home' }).click();
    await expect(page).toHaveURL('/');
    await expect(page.getByText('Trending Movies')).toBeVisible();
    await expect(page).toHaveTitle('FavMov: Your Movie Companion');
  }
  expect(errors).toEqual([]);
});

test('pages hydrate without React errors', async ({ page }) => {
  const errors = [];
  page.on('console', (message) => {
    if (message.type() === 'error' && /hydrat|did not match/i.test(message.text())) errors.push(message.text());
  });
  for (const path of ['/', '/search', '/login', '/movie/101', '/people/501', '/explore?section_type=Popular%20Movies']) {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
  }
  expect(errors).toEqual([]);
});
