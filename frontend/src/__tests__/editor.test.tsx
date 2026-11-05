import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import Editor from '../app/collection/add';
import { unsavedNotes } from '../stores/unsavedNotesStore';
import { CollectionStateStore } from '../stores/collectionStateStore';
import { MovieStore } from '../stores/movieStore';
import { Movie } from '../model/movieModel';
import { Success, Error as ApiError } from '../model/apiResponse';
import { fetchMovieDetails } from '../services/movieService';
import { getUserCollections, getCheckMovieExistInCollection, updateNotes, createCollection } from '../services/collectionService';
let mockPreventRemove: any;
const mockDispatch = jest.fn();
jest.mock('@react-navigation/native', () => ({ usePreventRemove: (prevent: boolean, callback: any) => { mockPreventRemove = { prevent, callback }; } }));
let mockParams = { movie_id: '7', is_tv_show: 'true' };
jest.mock('expo-router', () => ({ useLocalSearchParams: () => mockParams, useNavigation: () => ({ addListener: () => () => {}, dispatch: mockDispatch }) }));
jest.mock('../components/withAuth', () => ({ __esModule: true, default: (component: any) => component }));
jest.mock('../navigation/router', () => ({ router: { goBackSafely: jest.fn() } }));
jest.mock('../services/movieService', () => ({ fetchMovieDetails: jest.fn() }));
jest.mock('../services/collectionService', () => ({ getUserCollections: jest.fn(), getCheckMovieExistInCollection: jest.fn(), updateNotes: jest.fn(), createCollection: jest.fn() }));
beforeEach(() => {
 jest.clearAllMocks();
 unsavedNotes.clear();
 mockParams = { movie_id: '7', is_tv_show: 'true' };
 (fetchMovieDetails as jest.Mock).mockResolvedValue(new Success(new Movie({ id: 7, title: 'Arrival', isTvShow: true })));
 (getUserCollections as jest.Mock).mockResolvedValue(new Success([{ id: 'c', name: 'Watch' }]));
 (getCheckMovieExistInCollection as jest.Mock).mockResolvedValue(new Success([{ id: 'c', moviesCollectionNotes: 'saved' }]));
});
test('restores TV title and membership from URL without cache', async () => {
 const ui = render(<Editor/>);
 await act(async () => {});
 expect(fetchMovieDetails).toHaveBeenCalledWith('7', true);
 expect(getCheckMovieExistInCollection).toHaveBeenCalledWith('7', true);
 expect(ui.getByDisplayValue('saved')).toBeTruthy();
});
test('removal guard waits for the newest draft and stays open on failure', async () => {
 const ui = render(<Editor/>);
 await act(async () => {});
 (updateNotes as jest.Mock).mockResolvedValue(new ApiError('offline'));
 fireEvent.changeText(ui.getByPlaceholderText('Write custom notes...'), 'latest');
 await act(async () => { mockPreventRemove.callback({ data: { action: { type: 'GO_BACK' } } }); });
 expect(updateNotes).toHaveBeenCalledWith('c', '7', true, 'latest');
 expect(mockDispatch).not.toHaveBeenCalled();
 expect(ui.getByText('Retry')).toBeTruthy();
 (updateNotes as jest.Mock).mockResolvedValue(new Success(true));
 await act(async () => { mockPreventRemove.callback({ data: { action: { type: 'GO_BACK' } } }); });
 expect(mockDispatch).toHaveBeenCalledTimes(1);
});

test('removal guard freezes all note fields until every card has finished saving', async () => {
 (getUserCollections as jest.Mock).mockResolvedValue(new Success([{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }]));
 (getCheckMovieExistInCollection as jest.Mock).mockResolvedValue(new Success([{ id: 'a' }, { id: 'b' }]));
 let finish: any;
 (updateNotes as jest.Mock).mockImplementation(() => new Promise(resolve => finish = resolve));
 const ui = render(<Editor/>);
 await act(async () => {});
 fireEvent.changeText(ui.getAllByPlaceholderText('Write custom notes...')[1], 'pending B');
 await act(async () => { mockPreventRemove.callback({ data: { action: { type: 'GO_BACK' } } }); });
 expect(ui.getAllByPlaceholderText('Write custom notes...')[0].props.editable).toBe(false);
 expect(mockDispatch).not.toHaveBeenCalled();
 await act(async () => { finish(new Success(true)); });
 expect(mockDispatch).toHaveBeenCalledTimes(1);
});

test.each(['oops', '%'])('invalid URL %s is actionable and never requests movie zero', async value => {
 mockParams.movie_id = value;
 const ui = render(<Editor/>);
 await act(async () => {});
 expect(ui.getByText('Invalid title URL')).toBeTruthy();
 expect(fetchMovieDetails).not.toHaveBeenCalled();
});
test('an obsolete movie response cannot replace a TV route with the same numeric ID', async () => {
 let finish: any;
 mockParams.is_tv_show = 'false';
 (fetchMovieDetails as jest.Mock).mockImplementationOnce(() => new Promise(resolve => finish = resolve));
 const ui = render(<Editor/>);
 await act(async () => {});
 mockParams.is_tv_show = 'true';
 ui.rerender(<Editor/>);
 await act(async () => {});
 await act(async () => { finish(new Success(new Movie({ id: 7, title: 'Old movie' }))); });
 expect(ui.getByText('Add Arrival to Collection')).toBeTruthy();
 expect(ui.queryByText('Add Old movie to Collection')).toBeNull();
 expect(fetchMovieDetails).toHaveBeenLastCalledWith('7', true);
});
test('load failure offers Retry', async () => {
 (fetchMovieDetails as jest.Mock).mockResolvedValueOnce(new ApiError('offline'));
 const ui = render(<Editor/>);
 await act(async () => {});
 expect(ui.getByText('offline')).toBeTruthy();
 await act(async () => { fireEvent.press(ui.getByText('Retry')); });
 expect(ui.getByDisplayValue('saved')).toBeTruthy();
});
test('creates a first collection in the existing sheet and retains the title', async () => {
 (getUserCollections as jest.Mock).mockResolvedValueOnce(new Success([])).mockResolvedValue(new Success([{ id: 'new', name: 'New collection' }]));
 (getCheckMovieExistInCollection as jest.Mock).mockResolvedValue(new Success([]));
 (createCollection as jest.Mock).mockResolvedValue(new Success({ id: 'new' }));
 const ui = render(<Editor/>);
 await act(async () => {});
 fireEvent.press(ui.getByText('Create Collection'));
 fireEvent.changeText(ui.getByPlaceholderText('Type collection name here...'), 'New collection');
 await act(async () => { fireEvent.press(ui.getByText('Save')); });
 expect(createCollection).toHaveBeenCalledWith('New collection');
 expect(ui.getByText('New collection')).toBeTruthy();
 expect(ui.getByText('Add Arrival to Collection')).toBeTruthy();
});

test('native removal stays prevented during a pending save and after failure', async () => {
 let finish: any;
 (updateNotes as jest.Mock).mockImplementationOnce(() => new Promise(r => finish = r));
 const ui = render(<Editor/>);
 await act(async () => {});
 fireEvent.changeText(ui.getByPlaceholderText('Write custom notes...'), 'native draft');
 expect(mockPreventRemove.prevent).toBe(true);
 await act(async () => { mockPreventRemove.callback({ data: { action: { type: 'GO_BACK' } } }); });
 expect(ui.getByPlaceholderText('Write custom notes...').props.editable).toBe(false);
 await act(async () => { finish(new ApiError('offline')); });
 expect(ui.getByText('Retry')).toBeTruthy();
 expect(mockPreventRemove.prevent).toBe(true);
});

test('failed list refresh after creation can retry without another POST or losing the title', async () => {
 (getUserCollections as jest.Mock).mockResolvedValueOnce(new Success([])).mockResolvedValueOnce(new ApiError('offline')).mockResolvedValueOnce(new Success([{ id: 'new', name: 'New collection' }]));
 (getCheckMovieExistInCollection as jest.Mock).mockResolvedValue(new Success([]));
 (createCollection as jest.Mock).mockResolvedValue(new Success({ id: 'new' }));
 const invalidated = jest.spyOn(CollectionStateStore, 'setLastUpdated');
 const ui = render(<Editor/>);
 await act(async () => {});
 fireEvent.press(ui.getByText('Create Collection'));
 fireEvent.changeText(ui.getByPlaceholderText('Type collection name here...'), 'New collection');
 await act(async () => { fireEvent.press(ui.getByText('Save')); });
 expect(ui.getByText('Retry')).toBeTruthy();
 expect(invalidated).toHaveBeenCalled();
 expect(ui.getByText('Add Arrival to Collection')).toBeTruthy();
 await act(async () => { fireEvent.press(ui.getByText('Retry')); });
 expect(getUserCollections).toHaveBeenCalledTimes(3);
 expect(createCollection).toHaveBeenCalledTimes(1);
 expect(ui.getByText('New collection')).toBeTruthy();
 expect(ui.queryByText('Retry')).toBeNull();
 invalidated.mockRestore();
});

test('collections containing the title appear first while other order is preserved', async () => {
 (getUserCollections as jest.Mock).mockResolvedValue(new Success([{ id: 'a', name: 'Alpha' }, { id: 'b', name: 'Beta' }, { id: 'g', name: 'Gamma' }]));
 (getCheckMovieExistInCollection as jest.Mock).mockResolvedValue(new Success([{ id: 'g' }]));
 const ui = render(<Editor/>);
 await act(async () => {});
 const Card = require('../components/CollectionAddCard').default;
 expect(ui.UNSAFE_getAllByType(Card).map(card => card.props.collection.name)).toEqual(['Gamma', 'Alpha', 'Beta']);
});
test('loading uses a neutral heading and long titles include an ellipsis', async () => {
 let finish: any;
 (fetchMovieDetails as jest.Mock).mockImplementationOnce(() => new Promise(r => finish = r));
 const ui = render(<Editor/>);
 expect(ui.getByText('Add to Collection')).toBeTruthy();
 await act(async () => { finish(new Success(new Movie({ id: 7, title: 'A very long movie title indeed' }))); });
 expect(ui.getByText('Add A very long movie ti... to Collection')).toBeTruthy();
});

test('an incomplete cached movie fetches details rather than accepting an empty title', async () => {
 MovieStore.cacheMovie(new Movie({ id: 7, isTvShow: true, collections: [] }));
 const ui = render(<Editor/>);
 await act(async () => {});
 expect(fetchMovieDetails).toHaveBeenCalledWith('7', true);
 expect(ui.getByText('Add Arrival to Collection')).toBeTruthy();
});

test('a stalled save still reaches the way out after the leave timeout', async () => {
 jest.useFakeTimers();
 const ui = render(<Editor/>);
 await act(async () => {});
 (updateNotes as jest.Mock).mockImplementation(() => new Promise(() => {}));
 fireEvent.changeText(ui.getByPlaceholderText('Write custom notes...'), 'stuck');
 await act(async () => { mockPreventRemove.callback({ data: { action: { type: 'GO_BACK' } } }); });
 expect(ui.queryByText('Leave without saving')).toBeNull();
 await act(async () => { jest.advanceTimersByTime(15000); });
 await act(async () => { fireEvent.press(ui.getByText('Leave without saving')); });
 expect(mockDispatch).toHaveBeenCalledWith({ type: 'GO_BACK' });
 jest.useRealTimers();
});

test('an invalid URL shows its error without a Retry that cannot help', async () => {
 mockParams = { movie_id: 'oops', is_tv_show: 'false' };
 const ui = render(<Editor/>);
 await act(async () => {});
 expect(ui.getByText('Invalid title URL')).toBeTruthy();
 expect(ui.queryByText('Retry')).toBeNull();
});

test('a cached title survives a failed load for the retry', async () => {
 const { MovieStore } = require('../stores/movieStore');
 MovieStore.cacheMovie(new Movie({ id: 7, title: 'Cached', isTvShow: true }));
 (getUserCollections as jest.Mock).mockResolvedValueOnce(new ApiError('offline'));
 const ui = render(<Editor/>);
 await act(async () => {});
 await act(async () => { fireEvent.press(ui.getByText('Retry')); });
 expect(fetchMovieDetails).not.toHaveBeenCalled();
 expect(ui.getByText('Add Cached to Collection')).toBeTruthy();
});
