import { router } from '../../navigation/router';
import { routes } from '../../navigation/routes';
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

  test('KNOWN ISSUE: routes.collections points at a page that does not exist', () => {
    expect(routes.collections).toBe('/collections'); // the real page is /collection
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
