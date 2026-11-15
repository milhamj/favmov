import { renderWithProviders as render } from '../../test/renderWithProviders';
import React from 'react';
import { act, fireEvent } from '@testing-library/react-native';
import HomeSection, { SectionType } from '@/features/movies/HomeSection';
import { router } from '@/navigation/router';
jest.mock('@/features/auth/AuthProvider', () => ({
  AuthProvider: ({ children }: any) => children,
}));
jest.mock('@/features/auth/useAuth', () => ({ useAuth: () => ({ isAuthenticated: true }) }));
jest.mock('expo-router/react-navigation', () => ({ useFocusEffect: jest.fn() }));
jest.mock('@/features/movies/movieService', () => {
  const load = () =>
    Promise.resolve([
      require('../../test/factories').movie({
        id: 7,
        title: 'Title',
        isTvShow: true,
      }),
    ]);
  return {
    fetchFavoriteMovies: load,
    fetchTrendingMovies: load,
    fetchTrendingShows: load,
    fetchPopularMovies: load,
  };
});
jest.mock('@/navigation/router', () => ({ router: { navigate: jest.fn() } }));
jest.mock('@/features/movies/MovieCard', () => ({
  __esModule: true,
  default: ({ movie, onClick }: any) => {
    const { Text } = require('react-native');
    return <Text onPress={onClick}>{movie.title}</Text>;
  },
}));
test.each(Object.values(SectionType))(
  '%s has supported heading/card navigation',
  async (section) => {
    jest.clearAllMocks();
    const ui = render(<HomeSection section={section} />);
    await act(async () => {});
    if (section === SectionType.YourFavorites) {
      fireEvent.press(ui.getByText(section));
      expect(router.navigate).not.toHaveBeenCalled();
      expect(ui.queryByText('View All')).toBeNull();
    } else {
      fireEvent.press(ui.getByText(section));
      expect(router.navigate).toHaveBeenCalledWith(
        '/explore?section_type=' + encodeURIComponent(section),
      );
    }
    fireEvent.press(ui.getByText('Title'));
    expect(router.navigate).toHaveBeenLastCalledWith('/movie/7?is_tv_show=true');
  },
);
