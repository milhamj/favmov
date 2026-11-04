import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import Editor from '../app/collection/add';
import { Movie } from '../model/movieModel';
import { Success, Error as ApiError } from '../model/apiResponse';
import { fetchMovieDetails } from '../services/movieService';
import { getUserCollections, getCheckMovieExistInCollection, updateNotes, createCollection } from '../services/collectionService';
import { router } from '../navigation/router';
let mockPreventRemove: any;
jest.mock('@react-navigation/native', () => ({ usePreventRemove: (prevent: boolean, callback: any) => { mockPreventRemove = { prevent, callback }; } }));
let mockParams = { movie_id: '7', is_tv_show: 'true' };
jest.mock('expo-router', () => ({ useLocalSearchParams: () => mockParams, useNavigation: () => ({ addListener: () => () => {}, dispatch: jest.fn() }) }));
jest.mock('../components/withAuth', () => ({ __esModule: true, default: (component: any) => component }));
jest.mock('../navigation/router', () => ({ router: { goBackSafely: jest.fn() } }));
jest.mock('../services/movieService', () => ({ fetchMovieDetails: jest.fn() }));
jest.mock('../services/collectionService', () => ({ getUserCollections: jest.fn(), getCheckMovieExistInCollection: jest.fn(), updateNotes: jest.fn(), createCollection: jest.fn() }));
beforeEach(() => {
 jest.clearAllMocks();
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
test('Back waits for the newest draft and stays open on failure', async () => {
 const ui = render(<Editor/>);
 await act(async () => {});
 (updateNotes as jest.Mock).mockResolvedValue(new ApiError('offline'));
 fireEvent.changeText(ui.getByPlaceholderText('Write custom notes...'), 'latest');
 await act(async () => { fireEvent.press(ui.getByText('arrow-back')); });
 expect(updateNotes).toHaveBeenCalledWith('c', '7', true, 'latest');
 expect(router.goBackSafely).not.toHaveBeenCalled();
 expect(ui.getByText('Retry')).toBeTruthy();
 (updateNotes as jest.Mock).mockResolvedValue(new Success(true));
 await act(async () => { fireEvent.press(ui.getByText('arrow-back')); });
 expect(router.goBackSafely).toHaveBeenCalledTimes(1);
});

test('Back freezes all note fields until every card has finished saving', async () => {
 (getUserCollections as jest.Mock).mockResolvedValue(new Success([{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }]));
 (getCheckMovieExistInCollection as jest.Mock).mockResolvedValue(new Success([{ id: 'a' }, { id: 'b' }]));
 let finish: any;
 (updateNotes as jest.Mock).mockImplementation(() => new Promise(resolve => finish = resolve));
 const ui = render(<Editor/>);
 await act(async () => {});
 fireEvent.changeText(ui.getAllByPlaceholderText('Write custom notes...')[1], 'pending B');
 await act(async () => { fireEvent.press(ui.getByText('arrow-back')); });
 expect(ui.getAllByPlaceholderText('Write custom notes...')[0].props.editable).toBe(false);
 expect(router.goBackSafely).not.toHaveBeenCalled();
 await act(async () => { finish(new Success(true)); });
 expect(router.goBackSafely).toHaveBeenCalledTimes(1);
});

test('invalid URL is actionable and never requests movie zero', async () => {
 mockParams.movie_id = 'oops';
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
