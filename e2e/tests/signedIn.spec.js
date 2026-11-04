const { test, expect, icon, signIn, openTab, createCollection } = require('./app');

test('login recovers from a wrong code and returns to the title', async ({ page }) => {
  await page.goto('/movie/101');
  await icon(page, 'favoriteOutline').click();
  await page.getByPlaceholder('Email').fill('alice@example.com');
  await page.getByText('Send OTP').click();
  await expect(page.getByText('We have sent you an OTP to your email.')).toBeVisible();

  await page.getByPlaceholder('Input your OTP here...').fill('000000');
  await page.getByText('LOGIN', { exact: true }).click();
  await expect(page.getByText('Token has expired or is invalid')).toBeVisible();

  await page.getByPlaceholder('Input your OTP here...').fill('123456');
  await page.getByText('LOGIN', { exact: true }).click();
  await expect(page.getByText('Welcome alice@example.com')).toBeVisible();
  await expect(page).toHaveURL('/movie/101');
});

test('a user saves a title with notes, sees it everywhere, then removes it', async ({ page }) => {
  await signIn(page);
  await createCollection(page, 'Sci-Fi');

  // Save it
  await openTab(page, 'Home');
  await page.getByText('Galaxy Quest').first().click();
  await icon(page, 'favoriteOutline').click();
  await expect(page).toHaveURL('/collection/add?movie_id=101');
  await page.getByRole('checkbox').click();

  const notesSaved = page.waitForResponse((response) => response.url().endsWith('/notes') && response.status() === 201);
  await page.getByPlaceholder('Write custom notes...').fill('  Never give up  ');
  await notesSaved;

  // The title page, collection and home all reflect it
  await icon(page, 'back').click();
  await expect(icon(page, 'favorite')).toBeVisible();
  await icon(page, 'back').click();
  await expect(page.getByText('Your Favorites')).toBeVisible();

  await openTab(page, 'Collections');
  await page.getByText('Sci-Fi (1)').click(); // waits out the refetch that replaces the list on return
  await expect(page.getByText('Galaxy Quest (2001)')).toBeVisible();
  await expect(page.getByText('Never give up', { exact: true })).toBeVisible();

  // It survives a reload, which also proves the session persists
  await page.reload();
  await expect(page.getByText('Never give up', { exact: true })).toBeVisible();

  // Remove it
  await page.getByText('Galaxy Quest (2001)').click();
  await icon(page, 'favorite').click();
  await page.getByRole('checkbox').click();
  await expect(page.getByPlaceholder('Write custom notes...')).toHaveCount(0);
  await icon(page, 'back').click();
  await expect(icon(page, 'favoriteOutline')).toBeVisible();
  await icon(page, 'back').click();
  await expect(page.getByText('No movies or TV show in this collection.')).toBeVisible();
});

test('a duplicate collection name is explained in the sheet', async ({ page }) => {
  await signIn(page);
  await createCollection(page, 'Sci-Fi');
  await icon(page, 'add').click();
  await page.getByPlaceholder('Type collection name here...').fill('sci-fi');
  await page.getByText('Save', { exact: true }).click();
  await expect(page.getByText('You already have a collection with the same name.')).toBeVisible();
});

test('logout ends the session', async ({ page }) => {
  await signIn(page);
  await openTab(page, 'Profile');
  await expect(page.getByText('alice@example.com')).toBeVisible();
  await page.getByText('Logout').click();
  // KNOWN ISSUE: the code goes home, but the mounted withAuth screens then redirect to login,
  // and the "Logout successful" toast is lost on the way
  await expect(page).toHaveURL('/login');
  await expect(page.getByText('Logout successful')).toHaveCount(0);

  await page.goto('/profile');
  await expect(page).toHaveURL('/login');
});

test('KNOWN ISSUE: reloading the add-to-collection page throws the user out', async ({ page }) => {
  await signIn(page);
  await page.goto('/collection/add?movie_id=101');
  await expect(page.getByText('Movie collections are needed')).toBeVisible();
  await expect(page).toHaveURL('/');
});
