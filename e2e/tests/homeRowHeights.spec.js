const { test, expect, media } = require('./app');

// Headless Chromium hides scrollbars by default; lay them out so a row's scrollbar counts towards its height.
test.use({ launchOptions: { ignoreDefaultArgs: ['--hide-scrollbars'] } });

// Each row's scroll track width as the browser computes it ('auto' shows it, 'none' hides it).
const trackWidths = (page) =>
  page.$$eval('[data-home-row]', (els) => els.map((el) => getComputedStyle(el).scrollbarWidth));

const keepsHeight = async (page, track) => {
  // A long rating that could wrap, and a title with no rating at all
  const held = {
    'Trending Movies': ['trending/movie/**', { vote_average: 8.534, vote_count: 35421 }],
    'Popular Movies': ['movie/popular**', { vote_average: undefined }],
  };
  let release;
  const gate = new Promise((resolve) => (release = resolve));
  for (const [path, extra] of Object.values(held))
    await page.route(`https://api.themoviedb.org/3/${path}`, async (route) => {
      await gate;
      await route.fulfill({
        contentType: 'application/json',
        headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' },
        body: JSON.stringify({
          page: 1,
          total_pages: 1,
          results: [media(303, 'Held Film', extra)],
        }),
      });
    });
  const heights = () =>
    Promise.all(
      Object.keys(held).map((name) =>
        page
          .getByTestId(`home-section-${name}`)
          .evaluate((el) => el.getBoundingClientRect().height),
      ),
    );
  const busy = (name) => page.getByRole('link', { name });

  try {
    await page.goto('/');
    for (const name of Object.keys(held)) {
      await expect(busy(name)).toHaveAttribute('aria-busy', 'true');
      // Still a real link while loading, but announced as disabled
      await expect(busy(name)).toHaveAttribute('aria-disabled', 'true');
      await expect(busy(name)).toHaveAttribute('href', /\/explore\?section_type=/);
    }
    expect(new Set(await trackWidths(page))).toEqual(new Set([track]));
    const loading = await heights();
    release();
    for (const name of Object.keys(held))
      await expect(busy(name)).not.toHaveAttribute('aria-busy', 'true');
    expect(await heights()).toEqual(loading);
    expect(new Set(await trackWidths(page))).toEqual(new Set([track]));
    await expect(page.getByText('(35K)')).toBeVisible();
  } finally {
    release();
  }
};

test('home sections keep their height when their titles arrive', ({ page }) =>
  keepsHeight(page, 'auto'));

test.describe('on a touch screen', () => {
  test.use({ hasTouch: true, isMobile: true });

  test('home rows hide the scrollbar track and keep their height', ({ page }) =>
    keepsHeight(page, 'none'));
});
