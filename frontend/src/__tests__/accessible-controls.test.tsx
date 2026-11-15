import React from 'react';
import { render } from '@testing-library/react-native';
import MovieCard from '@/features/movies/MovieCard';
import MoviePoster from '@/features/movies/MoviePoster';
import TopBar from '@/components/TopBar';

jest.mock('@/navigation/router', () => ({ router: { navigate: jest.fn() } }));
const movie = { id: 1, title: 'Inception', posterPath: '', rating: 8.4 };

test('poster cards name the movie and its rating', () => {
  const ui = render(<MovieCard movie={movie} onClick={jest.fn()} />);
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

test('web links activate once on Enter', () => {
  jest.isolateModules(() => {
    jest.doMock('react-native', () => ({ Platform: { OS: 'web' } }));
    const { linkKeyboardProps } = require('@/navigation/linkKeyboardProps');
    const event = {
      key: 'Enter',
      repeat: false,
      preventDefault: jest.fn(),
      currentTarget: { click: jest.fn() },
    };
    linkKeyboardProps.onKeyDownCapture(event);
    expect(event.currentTarget.click).toHaveBeenCalledTimes(1);
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    linkKeyboardProps.onKeyDownCapture({ ...event, repeat: true });
    linkKeyboardProps.onKeyDownCapture({ ...event, key: 'Tab' });
    expect(event.currentTarget.click).toHaveBeenCalledTimes(1);
  });
});
