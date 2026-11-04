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

test('protected pages send guests to login', async ({ page }) => {
  for (const path of ['/collection', '/profile', '/collection/some-id']) {
    await page.goto(path);
    await expect(page).toHaveURL('/login');
  }
});

test('the favorite button asks a guest to log in', async ({ page }) => {
  await page.goto('/movie/101');
  await expect(page.getByText('About Galaxy Quest')).toBeVisible();
  await icon(page, 'favoriteOutline').click();
  await expect(page).toHaveURL('/login');
});

test('an unknown page answers 404', async ({ page }) => {
  expect((await page.goto('/no-such-page')).status()).toBe(404);
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
