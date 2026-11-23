import React from 'react';
import { render } from '@testing-library/react-native';
import MovieCard from '@/features/movies/MovieCard';
import MoviePoster from '@/features/movies/MoviePoster';
import TopBar from '@/components/TopBar';

jest.mock('@/navigation/router', () => ({ router: { navigate: jest.fn() } }));
const movie = { id: 1, title: 'Inception', posterPath: '', rating: 8.4 };

test('poster cards name the movie and its rating', () => {
  const ui = render(<MovieCard movie={movie} link={{ href: '/movie/1', onPress: jest.fn() }} />);
  expect(ui.getByRole('link', { name: 'Inception, rated 8.40' })).toBeTruthy();
});

test.each([
  [[], 'Add to collection'],
  [[{}], 'In your collections'],
])('the heart names its collection state (%s)', (collections, name) => {
  const ui = render(
    <MoviePoster
      movie={movie}
      isAuthenticated
      isAuthLoading={false}
      membership={{ isPending: false, isFetching: false } as any}
      details={{ data: movie } as any}
      collections={collections as unknown[]}
    />,
  );
  expect(ui.getByRole('link', { name: name as string })).toBeTruthy();
});

test('the icon-only back button has a name', () => {
  const ui = render(<TopBar title="Movie" backButton={{ isShow: true, onClick: jest.fn() }} />);
  expect(ui.getByRole('button', { name: 'Go back' })).toBeTruthy();
});

test('the page title is a level-one heading', () => {
  const ui = render(<TopBar title="Movie" />);
  expect(ui.getByRole('header', { name: 'Movie' }).props['aria-level']).toBe(1);
});

test('web links let the browser handle modified clicks, block when disabled and navigate on plain ones', () => {
  jest.isolateModules(() => {
    jest.doMock('react-native', () => ({ Platform: { OS: 'web' } }));
    const { linkProps } = require('@/navigation/linkProps');
    const { navigate } = require('@/navigation/router').router;
    const beforeNavigate = jest.fn();
    const link = linkProps('/movie/1', beforeNavigate);
    expect(link.href).toBe('/movie/1');
    const click = (extra: object) => ({ preventDefault: jest.fn(), ...extra });

    for (const modified of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }]) {
      const event = click(modified);
      link.onPress(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    }
    expect(navigate).not.toHaveBeenCalled();
    expect(beforeNavigate).not.toHaveBeenCalled();

    const disabledLink = linkProps('/movie/1', beforeNavigate, true);
    const newTab = click({ ctrlKey: true });
    disabledLink.onPress(newTab);
    expect(newTab.preventDefault).not.toHaveBeenCalled();
    const blocked = click({});
    disabledLink.onPress(blocked);
    expect(blocked.preventDefault).toHaveBeenCalledTimes(1);
    expect(navigate).not.toHaveBeenCalled();
    expect(beforeNavigate).not.toHaveBeenCalled();

    const plain = click({});
    link.onPress(plain);
    expect(plain.preventDefault).toHaveBeenCalledTimes(1);
    expect(beforeNavigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith('/movie/1');
  });
});
