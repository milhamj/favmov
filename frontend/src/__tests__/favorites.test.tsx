import React from 'react';
import { render, act, fireEvent } from '@testing-library/react-native';
import { Pressable } from 'react-native';
import HomeSection, { SectionType } from '../components/HomeSection';
import { Success } from '../model/apiResponse';
import { Movie } from '../model/movieModel';
import { router } from '../navigation/router';
jest.mock('../hooks/useAuth', () => ({ useAuth: () => ({ isAuthenticated: true }) }));
jest.mock('@react-navigation/native', () => ({ useFocusEffect: jest.fn() }));
jest.mock('../services/movieService', () => {
 const load = () => Promise.resolve(new (require('../model/apiResponse').Success)([new (require('../model/movieModel').Movie)({ id: 7, title: 'Title', isTvShow: true })]));
 return { fetchFavoriteMovies: load, fetchTrendingMovies: load, fetchTrendingShows: load, fetchPopularMovies: load };
});
jest.mock('../navigation/router', () => ({ router: { navigate: jest.fn() } }));
jest.mock('../components/MovieCard', () => ({ __esModule: true, default: ({ movie, onClick }: any) => { const { Text } = require('react-native'); return <Text onPress={onClick}>{movie.title}</Text>; } }));
test.each(Object.values(SectionType))('%s has supported heading/card navigation', async section => {
 jest.clearAllMocks();
 const ui = render(<HomeSection section={section}/>);
 await act(async () => {});
 if (section === SectionType.YourFavorites) expect(ui.UNSAFE_queryAllByType(Pressable)).toHaveLength(0);
 else { fireEvent.press(ui.getByText(section)); expect(router.navigate).toHaveBeenCalledWith('/explore?section_type=' + encodeURIComponent(section)); }
 fireEvent.press(ui.getByText('Title'));
 expect(router.navigate).toHaveBeenLastCalledWith('/movie/7?is_tv_show=true');
});
