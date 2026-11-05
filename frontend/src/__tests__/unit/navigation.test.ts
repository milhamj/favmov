import { router } from '../../navigation/router';
import { routes, routeWithParams, safeReturnTo } from '../../navigation/routes';
import { router as expoRouter } from '../../../test/expoRouter';

jest.mock('expo-router', () => require('../../../test/expoRouter'));

beforeEach(() => jest.clearAllMocks());

describe('routes', () => {
  test('builds movie and TV show paths', () => {
    expect(routes.movie(5)).toBe('/movie/5');
    expect(routes.movie(5, true)).toBe('/movie/5?is_tv_show=true');
    expect(routes.addToCollection(5)).toBe('/collection/add?movie_id=5');
    expect(routes.addToCollection(5, true)).toBe('/collection/add?movie_id=5&is_tv_show=true');
  });

  test('encodes user-visible values', () => {
    expect(routes.explore('Popular Movies')).toBe('/explore?section_type=Popular%20Movies');
    expect(routes.people('a/b')).toBe('/people/a%2Fb');
  });

});

describe('return destinations', () => {
  test('login carries the page to come back to', () => {
    expect(routes.loginWithReturnTo('/movie/5?is_tv_show=true')).toBe('/login?return_to=%2Fmovie%2F5%3Fis_tv_show%3Dtrue');
  });

  test.each(['/', '/collection', '/profile', '/movie/5', '/collection/abc-1', '/collection/add?movie_id=5'])('allows %s', (path) => {
    expect(safeReturnTo(path)).toBe(path);
  });

  test.each(['https://evil.test', '//evil.test', '/login', '/search', '/movie/abc', '/a b', undefined])('sends %s home instead', (path) => {
    expect(safeReturnTo(path)).toBe('/');
  });

  test('rebuilds a page URL from its query params, leaving out the path id', () => {
    expect(routeWithParams('/collection/add', { movie_id: '5', is_tv_show: 'true' })).toBe('/collection/add?movie_id=5&is_tv_show=true');
    expect(routeWithParams('/collection/abc', { id: 'abc' })).toBe('/collection/abc');
  });
});

describe('goBackSafely', () => {
  test('goes back when there is history', () => {
    expoRouter.canGoBack.mockReturnValue(true);
    router.goBackSafely();
    expect(expoRouter.back).toHaveBeenCalled();
    expect(expoRouter.replace).not.toHaveBeenCalled();
  });

  test('falls back to a page on a direct visit', () => {
    expoRouter.canGoBack.mockReturnValue(false);
    router.goBackSafely();
    expect(expoRouter.replace).toHaveBeenCalledWith('/');
    router.goBackSafely('/search');
    expect(expoRouter.replace).toHaveBeenCalledWith('/search');
  });
});
