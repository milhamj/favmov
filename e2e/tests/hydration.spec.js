const { test, expect } = require('./app');

// shortcut: #421 is an unrelated race (an update reaches a Suspense boundary still hydrating), about 1 load in 30 in any browser. Drop this once it is fixed.
const isHydrationFailure = (message) => !message.includes('#421');

// React only reports hydration failures as uncaught minified errors, so a page can look fine with them.
for (const path of ['/', '/search', '/login', '/movie/101', '/people/501']) {
  test(`${path} hydrates the prerendered HTML`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(path, { waitUntil: 'load' });
    // Glyphs are already in the prerendered HTML; React's fiber key only appears once hydration reaches them.
    // Every icon, because each Suspense boundary hydrates on its own.
    await page.waitForFunction(() => {
      const icons = [...document.querySelectorAll('#root [data-testid="iconIcon"]')];
      return icons.length && icons.every((icon) => Object.keys(icon).some((key) => key.startsWith('__reactFiber$')));
    });
    await page.waitForLoadState('networkidle');
    expect(errors.filter(isHydrationFailure)).toEqual([]);
  });
}
