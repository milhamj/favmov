import { act, fireEvent, render, renderHook, screen } from '@testing-library/react-native';
import { Platform } from 'react-native';
import CollectionCard from '../../components/CollectionCard';
import ExpandableText from '../../components/ExpandableText';
import MovieCard from '../../components/MovieCard';
import MovieCardHorizontal from '../../components/MovieCardHorizontal';
import PeopleCardHorizontal from '../../components/PeopleCardHorizontal';
import SelectableChip from '../../components/SelectableChip';
import TopBar from '../../components/TopBar';
import { useDebouncedCallback } from '../../hooks/useDebouncedCallback';
import { Collection } from '../../model/collectionModel';
import { Movie } from '../../model/movieModel';
import { People } from '../../model/peopleModel';

describe('TopBar', () => {
  test('shows the title, and only the buttons it was given', () => {
    const back = jest.fn();
    const search = jest.fn();
    render(<TopBar title="Home" backButton={{ isShow: true, onClick: back }} icons={[{ name: 'search', onClick: search }]} />);
    fireEvent.press(screen.getByRole('button', { name: 'Go back' }));
    fireEvent.press(screen.getByText('search'));
    expect(screen.getByText('Home')).toBeTruthy();
    expect(back).toHaveBeenCalled();
    expect(search).toHaveBeenCalled();
  });

  test('hides the back button when told to', () => {
    render(<TopBar title="Home" backButton={{ isShow: false, onClick: jest.fn() }} />);
    expect(screen.queryByText('arrow-back')).toBeNull();
  });
});

describe('SelectableChip', () => {
  test('reports the toggled state', () => {
    const onSelect = jest.fn();
    render(<SelectableChip text="Movie" selected onSelect={onSelect} />);
    fireEvent.press(screen.getByText('Movie'));
    expect(onSelect).toHaveBeenCalledWith(false);
  });
});

describe('movie cards', () => {
  const movie = new Movie({ id: 1, title: 'Up', rating: 8, ratingCount: 10, releaseDate: '2009-05-28', collectionNotes: 'Sad start' });

  test('MovieCard shows the rating and reports presses', () => {
    const onClick = jest.fn();
    render(<MovieCard movie={movie} onClick={onClick} />);
    expect(screen.getByText('(10)')).toBeTruthy();
    fireEvent.press(screen.getByText('Up'));
    expect(onClick).toHaveBeenCalledWith(movie);
  });

  test('MovieCard leaves out a missing rating', () => {
    render(<MovieCard movie={new Movie({ id: 1, title: 'Up' })} />);
    expect(screen.queryByText(/⭐/)).toBeNull();
  });

  test('MovieCardHorizontal adds the year and collection notes', () => {
    render(<MovieCardHorizontal movie={movie} />);
    expect(screen.getByText('Up (2009)')).toBeTruthy();
    expect(screen.getByText('Sad start')).toBeTruthy();
  });
});

test('PeopleCardHorizontal shows the department when known', () => {
  const { rerender } = render(<PeopleCardHorizontal people={new People({ name: 'Ann', knownForDepartment: 'Acting' })} />);
  expect(screen.getByText('Known for: Acting')).toBeTruthy();
  rerender(<PeopleCardHorizontal people={new People({ name: 'Ann' })} />);
  expect(screen.queryByText(/Known for/)).toBeNull();
});

describe('CollectionCard', () => {
  test('shows a count when there are titles', () => {
    const collection = new Collection('c1', 'Sci-Fi');
    collection.moviesCount = 3;
    const onPress = jest.fn();
    render(<CollectionCard collection={collection} onPress={onPress} />);
    expect(screen.getByText(' (3)')).toBeTruthy();
    fireEvent.press(screen.getByText(/Sci-Fi/));
    expect(onPress).toHaveBeenCalled();
  });
});

describe('ExpandableText', () => {
  const layout = (lines: number) => ({ nativeEvent: { lines: new Array(lines) } });

  test('offers See More only for text past the limit, and toggles it', () => {
    expect(Platform.OS).not.toBe('web');
    render(<ExpandableText text="Long text" maxLines={2} />);
    fireEvent(screen.getByText('Long text'), 'textLayout', layout(2));
    expect(screen.queryByText('See More')).toBeNull();

    fireEvent(screen.getByText('Long text'), 'textLayout', layout(3));
    expect(screen.getByText('Long text').props.numberOfLines).toBe(1); // room for "See More"
    fireEvent.press(screen.getByText('See More'));
    expect(screen.getByText('Long text').props.numberOfLines).toBeUndefined();
    fireEvent.press(screen.getByText('See Less'));
    expect(screen.getByText('See More')).toBeTruthy();
  });
});

describe('useDebouncedCallback', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  test('runs once, the delay after the last call', () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 100));
    result.current();
    act(() => { jest.advanceTimersByTime(99); });
    result.current();
    act(() => { jest.advanceTimersByTime(99); });
    expect(callback).not.toHaveBeenCalled();
    act(() => { jest.advanceTimersByTime(1); });
    expect(callback).toHaveBeenCalledTimes(1);
  });

  test('cancel and unmount stop a waiting call', () => {
    const callback = jest.fn();
    const { result, unmount } = renderHook(() => useDebouncedCallback(callback, 100));
    result.current();
    result.current.cancel();
    result.current();
    unmount();
    act(() => { jest.advanceTimersByTime(100); });
    expect(callback).not.toHaveBeenCalled();
  });
});
