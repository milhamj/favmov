import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Modal, Platform, FlatList } from 'react-native';
import Toast from 'react-native-toast-message';
import CollectionPage from '../../app/(tabs)/collection';
import CollectionDetailPage from '../../app/collection/[id]';
import AddToCollectionPage from '../../app/collection/add';
import CollectionAddCard from '../../components/CollectionAddCard';
import { useAuth } from '../../hooks/useAuth';
import { Error as ApiError, Success } from '../../model/apiResponse';
import { Collection, CollectionCard } from '../../model/collectionModel';
import { Movie } from '../../model/movieModel';
import {
  createCollection, deleteMovieFromCollection, getCheckMovieExistInCollection, getCollectionDetail, getUserCollections, postAddMovieToCollection, updateNotes,
} from '../../services/collectionService';
import { CollectionStateStore } from '../../stores/collectionStateStore';
import { MovieStore } from '../../stores/movieStore';
import { unsavedNotes } from '../../stores/unsavedNotesStore';
import { fetchMovieDetails } from '../../services/movieService';
import { refocus, router, searchParams } from '../../../test/expoRouter';

jest.mock('expo-router', () => require('../../../test/expoRouter'));
jest.mock('@react-navigation/native', () => require('../../../test/expoRouter'));
jest.mock('../../services/collectionService', () => ({ createCollection: jest.fn(), deleteMovieFromCollection: jest.fn(), getCheckMovieExistInCollection: jest.fn(), getCollectionDetail: jest.fn(), getUserCollections: jest.fn(), postAddMovieToCollection: jest.fn(), updateNotes: jest.fn() }));
jest.mock('../../services/movieService', () => ({ fetchMovieDetails: jest.fn() }));
jest.mock('../../hooks/useAuth', () => ({ useAuth: jest.fn() }));

const listCollections = getUserCollections as jest.Mock;
const getDetail = getCollectionDetail as jest.Mock;
const create = createCollection as jest.Mock;
const add = postAddMovieToCollection as jest.Mock;
const remove = deleteMovieFromCollection as jest.Mock;
const saveNotes = updateNotes as jest.Mock;
const savedIn = getCheckMovieExistInCollection as jest.Mock;
const details = fetchMovieDetails as jest.Mock;
const collections = (...names: string[]) => new Success(names.map((name) => new Collection(`id-${name}`, name)));

beforeEach(() => {
  jest.clearAllMocks();
  MovieStore.clear();
  CollectionStateStore.setLastUpdated(0);
  (useAuth as jest.Mock).mockReturnValue({ isAuthenticated: true, loading: false });
  listCollections.mockResolvedValue(collections('Sci-Fi'));
  add.mockResolvedValue(new Success({}));
  remove.mockResolvedValue(new Success(true));
  saveNotes.mockResolvedValue(new Success(true));
});

describe('collections tab', () => {
  test('lists collections and opens one', async () => {
    render(<CollectionPage />);
    fireEvent.press(await screen.findByText(/Sci-Fi/));
    expect(router.navigate).toHaveBeenCalledWith('/collection/id-Sci-Fi');
  });

  test('invites the user to create the first one', async () => {
    listCollections.mockResolvedValue(collections());
    render(<CollectionPage />);
    expect(await screen.findByText("You don't have any collections yet.")).toBeTruthy();
    fireEvent.press(screen.getByText('Create Collection'));
    expect(screen.getByText('Create New Collection')).toBeTruthy();
  });

  test('shows a toast when loading fails', async () => {
    listCollections.mockResolvedValue(new ApiError('Failed to fetch collections'));
    render(<CollectionPage />);
    await waitFor(() => expect(Toast.show).toHaveBeenCalledWith(expect.objectContaining({ type: 'error', text2: 'Failed to fetch collections' })));
  });

  test('a failed load shows a persistent error and retries without claiming empty', async () => {
    listCollections.mockResolvedValue(new ApiError('Failed to fetch collections'));
    render(<CollectionPage />);
    expect(await screen.findByText('Failed to fetch collections')).toBeTruthy();
    expect(screen.queryByText("You don't have any collections yet.")).toBeNull();
    listCollections.mockResolvedValue(collections('Recovered'));
    fireEvent.press(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Recovered')).toBeTruthy();
    expect(screen.queryByText('Failed to fetch collections')).toBeNull();
  });

  test('creating a collection confirms and reloads the list', async () => {
    create.mockResolvedValue(new Success(new Collection('new', 'Drama')));
    render(<CollectionPage />);
    await screen.findByText(/Sci-Fi/);
    fireEvent.press(screen.getByText('add-circle'));
    fireEvent.changeText(screen.getByPlaceholderText('Type collection name here...'), '  Drama  ');
    listCollections.mockResolvedValue(collections('Sci-Fi', 'Drama'));
    fireEvent.press(screen.getByText('Save'));

    expect(await screen.findByText(/Drama/)).toBeTruthy();
    expect(create).toHaveBeenCalledWith('Drama');
    expect(Toast.show).toHaveBeenCalledWith(expect.objectContaining({ text1: 'Collection Created', text2: '"Drama" has been created successfully' }));
  });

  test('keeps the sheet open with the reason when creating fails', async () => {
    create.mockResolvedValue(new ApiError('You already have a collection with the same name.'));
    render(<CollectionPage />);
    await screen.findByText(/Sci-Fi/);
    fireEvent.press(screen.getByText('add-circle'));
    fireEvent.changeText(screen.getByPlaceholderText('Type collection name here...'), 'Sci-Fi');
    fireEvent.press(screen.getByText('Save'));

    expect(await screen.findByText(/already have a collection/)).toBeTruthy();
    expect(screen.getByText('Create New Collection')).toBeTruthy();
  });

  test('keeps a saving sheet open and blocks duplicate saves', async () => {
    let finish!: (result: Success<Collection>) => void;
    create.mockReturnValue(new Promise(resolve => { finish = resolve; }));
    render(<CollectionPage />);
    await screen.findByText(/Sci-Fi/);
    fireEvent.press(screen.getByText('add-circle'));
    fireEvent.changeText(screen.getByPlaceholderText('Type collection name here...'), '  Drama  ');
    fireEvent.press(screen.getByRole('button', { name: 'Save' }));
    fireEvent.press(screen.getByRole('button', { name: 'Save' }), { stopPropagation: jest.fn() });
    act(() => screen.UNSAFE_getByType(Modal).props.onRequestClose());
    expect(screen.getByText('Create New Collection')).toBeTruthy();
    expect(create).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledWith('Drama');
    await act(async () => { finish(new Success(new Collection('new', 'Drama'))); });
  });

  test('will not save a blank name', async () => {
    render(<CollectionPage />);
    await screen.findByText(/Sci-Fi/);
    fireEvent.press(screen.getByText('add-circle'));
    fireEvent.changeText(screen.getByPlaceholderText('Type collection name here...'), '   ');
    // Save is disabled, so the press lands on the sheet behind it, which needs an event
    fireEvent.press(screen.getByText('Save'), { stopPropagation: jest.fn() });
    expect(create).not.toHaveBeenCalled();
  });

  test('reloads on return only if a collection changed since', async () => {
    render(<CollectionPage />);
    await screen.findByText(/Sci-Fi/);

    await act(async () => refocus());
    expect(listCollections).toHaveBeenCalledTimes(1);

    CollectionStateStore.setLastUpdated(Date.now() + 1000);
    await act(async () => refocus());
    expect(listCollections).toHaveBeenCalledTimes(2);
  });

  test('a failed reload keeps the loaded list and only toasts', async () => {
    render(<CollectionPage />);
    await screen.findByText(/Sci-Fi/);

    listCollections.mockResolvedValue(new ApiError('Failed to fetch collections'));
    CollectionStateStore.setLastUpdated(Date.now() + 1000);
    await act(async () => refocus());
    await waitFor(() => expect(Toast.show).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' })));
    expect(screen.getByText(/Sci-Fi/)).toBeTruthy();
    expect(screen.queryByText('Retry')).toBeNull();
  });
});

describe('collection detail', () => {
  const detail = (movies: Movie[]) => {
    const collection = new Collection('c1', 'Sci-Fi');
    collection.movies = movies;
    return new Success(collection);
  };

  beforeEach(() => { searchParams.current = { id: 'c1' }; });

  test('shows the name and titles, and opens one', async () => {
    getDetail.mockResolvedValue(detail([new Movie({ id: 4, title: 'Lost', isTvShow: true, collectionNotes: 'Binge' })]));
    render(<CollectionDetailPage />);
    expect(await screen.findByText('Sci-Fi')).toBeTruthy();
    expect(screen.getByText('Binge')).toBeTruthy();
    fireEvent.press(screen.getByText('Lost'));
    expect(getDetail).toHaveBeenCalledWith('c1');
    expect(MovieStore.getCachedMovie('4', true)?.title).toBe('Lost');
    expect(router.navigate).toHaveBeenCalledWith('/movie/4?is_tv_show=true');
  });

  test('an empty collection points to search', async () => {
    getDetail.mockResolvedValue(detail([]));
    render(<CollectionDetailPage />);
    fireEvent.press(await screen.findByText('Search Movies or TV Shows'));
    expect(router.navigate).toHaveBeenCalledWith('/search');
  });

  test('shows a toast when the collection cannot be read', async () => {
    getDetail.mockResolvedValue(new ApiError('Collection not found or access denied', 404));
    render(<CollectionDetailPage />);
    await waitFor(() => expect(Toast.show).toHaveBeenCalledWith(expect.objectContaining({ type: 'error', text2: 'Collection not found or access denied' })));
    expect(screen.getByText('Collection')).toBeTruthy();
  });

  test('failed detail retries to a legitimate empty collection', async () => {
    getDetail.mockResolvedValue(new ApiError('Unable to read collection'));
    render(<CollectionDetailPage />);
    expect(await screen.findByText('Unable to read collection')).toBeTruthy();
    expect(screen.queryByText('No movies or TV show in this collection.')).toBeNull();
    getDetail.mockResolvedValue(detail([]));
    fireEvent.press(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('No movies or TV show in this collection.')).toBeTruthy();
    expect(screen.queryByText('Unable to read collection')).toBeNull();
  });

  test('reloads on return after a change', async () => {
    getDetail.mockResolvedValue(detail([new Movie({ id: 1, title: 'Old' })]));
    render(<CollectionDetailPage />);
    await screen.findByText('Old');

    getDetail.mockResolvedValue(detail([new Movie({ id: 2, title: 'New' })]));
    CollectionStateStore.setLastUpdated(Date.now() + 1000);
    await act(async () => refocus());
    expect(await screen.findByText('New')).toBeTruthy();
  });

  test('a failed reload keeps the loaded movies and only toasts', async () => {
    getDetail.mockResolvedValue(detail([new Movie({ id: 1, title: 'Old' })]));
    render(<CollectionDetailPage />);
    await screen.findByText('Old');

    getDetail.mockResolvedValue(new ApiError('Unable to read collection'));
    CollectionStateStore.setLastUpdated(Date.now() + 1000);
    await act(async () => refocus());
    await waitFor(() => expect(Toast.show).toHaveBeenCalledWith(expect.objectContaining({ type: 'error', text2: 'Unable to read collection' })));
    expect(screen.getByText('Old')).toBeTruthy();
    expect(screen.queryByText('Retry')).toBeNull();
  });
});

describe('add to collection page', () => {
  const membership = (...ids: string[]) => new Success(ids.map((id) => new Collection(id, id)));

  beforeEach(() => {
    searchParams.current = { movie_id: '1' };
    savedIn.mockResolvedValue(membership());
    details.mockResolvedValue(new Success(new Movie({ id: 1, title: 'From TMDB' })));
  });

  test('lists collections holding the title first, and shortens long titles', async () => {
    listCollections.mockResolvedValue(collections('Other', 'Holds it'));
    savedIn.mockResolvedValue(membership('id-Holds it'));
    MovieStore.cacheMovie(new Movie({ id: 1, title: 'A very long movie title indeed' }));
    render(<AddToCollectionPage />);
    await screen.findByText('Holds it');

    expect(screen.getByText('Add A very long movie ti... to Collection')).toBeTruthy();
    expect(details).not.toHaveBeenCalled();
    const names = screen.getAllByText(/Holds it|Other/).map((node) => node.props.children);
    expect(names).toEqual(['Holds it', 'Other']);
  });

  test('a reload rebuilds the page from the URL', async () => {
    searchParams.current = { movie_id: '1', is_tv_show: 'true' };
    render(<AddToCollectionPage />);
    expect(await screen.findByText('Add From TMDB to Collection')).toBeTruthy();
    expect(details).toHaveBeenCalledWith('1', true);
    expect(savedIn).toHaveBeenCalledWith('1', true);
  });

  test('a bad id explains itself with nothing to retry', async () => {
    searchParams.current = { movie_id: 'abc' };
    render(<AddToCollectionPage />);
    expect(await screen.findByText('Invalid title URL')).toBeTruthy();
    expect(screen.queryByText('Retry')).toBeNull();
    expect(details).not.toHaveBeenCalled();
  });

  test('a failed load offers a retry that recovers', async () => {
    listCollections.mockResolvedValue(new ApiError('Failed to fetch collections'));
    render(<AddToCollectionPage />);
    expect(await screen.findByText('Failed to fetch collections')).toBeTruthy();

    listCollections.mockResolvedValue(collections('Sci-Fi'));
    fireEvent.press(screen.getByText('Retry'));
    expect(await screen.findByText('Sci-Fi')).toBeTruthy();
  });

  test('the first collection can be created here', async () => {
    listCollections.mockResolvedValue(collections());
    create.mockResolvedValue(new Success(new Collection('id-Drama', 'Drama')));
    render(<AddToCollectionPage />);
    fireEvent.press(await screen.findByText('Create Collection'));
    fireEvent.changeText(screen.getByLabelText('Name'), 'Drama');
    listCollections.mockResolvedValue(collections('Drama'));
    fireEvent.press(screen.getByText('Save'));

    expect(await screen.findByText('Drama')).toBeTruthy();
    expect(CollectionStateStore.getLastUpdated()).toBeGreaterThan(0);
  });
});

describe('collection checkbox and notes', () => {
  const movie = new Movie({ id: 1, title: 'Up', isTvShow: true });
  const notesBox = 'Write custom notes...';
  const toggle = (value: boolean) => act(async () => { fireEvent.press(screen.getByRole('checkbox')); });
  const card = (isInCollection: boolean) => render(<CollectionAddCard collection={new CollectionCard('c1', 'Sci-Fi', isInCollection)} movie={movie} />);

  beforeEach(() => {
    jest.useFakeTimers();
    unsavedNotes.clear();
  });
  afterEach(() => jest.useRealTimers());

  test('Space toggles the web checkbox once without scrolling, including busy and disabled states', async () => {
    const platform = Platform.OS;
    Platform.OS = 'web';
    let finish!: (result: Success<any>) => void;
    add.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
    try {
      const ui = card(false);
      const preventDefault = jest.fn();
      const space = { key: ' ', repeat: false, preventDefault };
      await act(async () => { fireEvent(screen.getByRole('checkbox'), 'keyDownCapture', space); });
      expect(preventDefault).toHaveBeenCalledTimes(1);
      expect(add).toHaveBeenCalledTimes(1);
      await act(async () => {
        fireEvent(screen.getByRole('checkbox'), 'keyDownCapture', space);
        fireEvent(screen.getByRole('checkbox'), 'keyDownCapture', { ...space, repeat: true });
      });
      expect(add).toHaveBeenCalledTimes(1);
      await act(async () => { finish(new Success({})); });
      ui.rerender(<CollectionAddCard disabled collection={new CollectionCard('c1', 'Sci-Fi', true)} movie={movie} />);
      fireEvent(screen.getByRole('checkbox'), 'keyDownCapture', space);
      expect(remove).not.toHaveBeenCalled();
    } finally {
      Platform.OS = platform;
    }
  });

  test('checkbox names its selection and prevents duplicate and disabled presses', async () => {
    let finish!: (result: Success<any>) => void;
    add.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
    const ui = card(false);
    const checkbox = screen.getByRole('checkbox', { name: 'Sci-Fi', checked: false });
    await act(async () => { fireEvent.press(checkbox); });
    expect(screen.getByRole('checkbox', { name: 'Sci-Fi', busy: true, disabled: true })).toBeTruthy();
    await act(async () => { fireEvent.press(screen.getByRole('checkbox')); });
    expect(add).toHaveBeenCalledTimes(1);
    await act(async () => { finish(new Success({})); });
    expect(screen.getByLabelText('Notes for Sci-Fi')).toBeTruthy();
    ui.rerender(<CollectionAddCard disabled collection={new CollectionCard('c1', 'Sci-Fi', true)} movie={movie} />);
    fireEvent.press(screen.getByRole('checkbox', { name: 'Sci-Fi', checked: true, disabled: true }));
    expect(remove).not.toHaveBeenCalled();
  });

  test('adding saves the title, records the change, and reveals notes', async () => {
    card(false);
    expect(screen.queryByPlaceholderText(notesBox)).toBeNull();
    await toggle(true);

    expect(add).toHaveBeenCalledWith('c1', movie, true);
    expect(screen.getByPlaceholderText(notesBox)).toBeTruthy();
    expect(CollectionStateStore.getLastUpdated()).toBeGreaterThan(0);
  });

  test('re-adding shows the notes the server already holds', async () => {
    add.mockResolvedValue(new Success({ notes: 'From before' }));
    card(false);
    await toggle(true);
    expect(screen.getByPlaceholderText(notesBox).props.value).toBe('From before');
  });

  test('removing hides the notes', async () => {
    card(true);
    await toggle(false);
    expect(remove).toHaveBeenCalledWith('c1', '1', true);
    expect(screen.queryByPlaceholderText(notesBox)).toBeNull();
  });

  test('a failed add leaves the box unticked and offers a retry', async () => {
    add.mockResolvedValue(new ApiError('Failed to add'));
    card(false);
    await toggle(true);
    expect(screen.queryByPlaceholderText(notesBox)).toBeNull();
    expect(screen.getByText('Unable to update collection')).toBeTruthy();
    expect(Toast.show).toHaveBeenCalledWith(expect.objectContaining({ text2: 'Failed to add' }));
    expect(CollectionStateStore.getLastUpdated()).toBe(0);

    add.mockResolvedValue(new Success({}));
    await act(async () => { fireEvent.press(screen.getByText('Retry')); });
    expect(screen.getByPlaceholderText(notesBox)).toBeTruthy();
  });

  test('a failed removal keeps the title saved', async () => {
    remove.mockResolvedValue(new ApiError('Failed'));
    card(true);
    await toggle(false);
    expect(screen.getByPlaceholderText(notesBox)).toBeTruthy();
    expect(screen.getByText('Unable to update collection')).toBeTruthy();
  });

  test('saves notes one second after typing stops, and shows the state', async () => {
    card(true);
    expect(screen.getByText('Saved')).toBeTruthy();
    fireEvent.changeText(screen.getByPlaceholderText(notesBox), 'Good');
    expect(screen.getByText('Unsaved')).toBeTruthy();
    await act(async () => { await jest.advanceTimersByTimeAsync(500); });
    fireEvent.changeText(screen.getByPlaceholderText(notesBox), 'Good one');
    await act(async () => { await jest.advanceTimersByTimeAsync(999); });
    expect(saveNotes).not.toHaveBeenCalled();

    await act(async () => { await jest.advanceTimersByTimeAsync(1); });
    expect(saveNotes).toHaveBeenCalledTimes(1);
    expect(saveNotes).toHaveBeenCalledWith('c1', '1', true, 'Good one');
    expect(screen.getByText('Saved')).toBeTruthy();
    expect(CollectionStateStore.getLastUpdated()).toBeGreaterThan(0);
  });

  test('offers a retry when notes fail to save', async () => {
    saveNotes.mockResolvedValue(new ApiError('Failed to update notes'));
    card(true);
    fireEvent.changeText(screen.getByPlaceholderText(notesBox), 'x');
    await act(async () => { await jest.advanceTimersByTimeAsync(1000); });
    expect(Toast.show).toHaveBeenCalledWith(expect.objectContaining({ text2: 'Failed to update notes' }));
    expect(screen.getByText('Unable to save notes')).toBeTruthy();

    saveNotes.mockResolvedValue(new Success(true));
    await act(async () => { fireEvent.press(screen.getByText('Retry')); });
    expect(screen.getByText('Saved')).toBeTruthy();
  });
});

 test('collection cells retain half-width for an odd last row after resizing', async () => {
  listCollections.mockResolvedValue(collections('One', 'Two', 'Three'));
  render(<CollectionPage />);
  await screen.findByText('Three');
  const grid = () => screen.UNSAFE_getByType(FlatList);
  fireEvent(grid(), 'contentSizeChange', 288, 1200);
  expect(grid().props.renderItem({ item: grid().props.data[2] }).props.style.width).toBe(136);
  fireEvent(grid(), 'contentSizeChange', 608, 1200);
  expect(grid().props.renderItem({ item: grid().props.data[2] }).props.style.width).toBe(296);
});
