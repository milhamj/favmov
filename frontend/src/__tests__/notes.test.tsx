import React from 'react';
import { render, fireEvent, act, renderHook } from '@testing-library/react-native';
import Card from '../components/CollectionAddCard';
import { unsavedNotes } from '../stores/unsavedNotesStore';
import { Movie } from '../model/movieModel';
import { Success, Error as ApiError } from '../model/apiResponse';
import { updateNotes, deleteMovieFromCollection, postAddMovieToCollection } from '../services/collectionService';
import { useDebouncedCallback } from '../hooks/useDebouncedCallback';
jest.mock('../services/collectionService', () => ({ updateNotes: jest.fn(), deleteMovieFromCollection: jest.fn(), postAddMovieToCollection: jest.fn(() => Promise.resolve(new (require('../model/apiResponse').Success)(true))) }));
const update = updateNotes as jest.Mock;
const remove = deleteMovieFromCollection as jest.Mock;
const movie = new Movie({ id: 1 });
const collection = { id: 'c', name: 'Watch', isInCollection: true };
beforeEach(() => { jest.useFakeTimers(); jest.clearAllMocks(); unsavedNotes.clear(); update.mockResolvedValue(new Success(true)); });
afterEach(() => jest.useRealTimers());
test('serializes writes and coalesces the latest pending text including empty text', async () => {
 let finish: any;
 update.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
 const ui = render(<Card collection={collection} movie={movie}/>);
 fireEvent.changeText(ui.getByPlaceholderText('Write custom notes...'), 'first');
 await act(async () => { jest.advanceTimersByTime(1000); });
 fireEvent.changeText(ui.getByPlaceholderText('Write custom notes...'), 'second');
 fireEvent.changeText(ui.getByPlaceholderText('Write custom notes...'), '');
 await act(async () => { jest.advanceTimersByTime(1000); });
 expect(update).toHaveBeenCalledTimes(1);
 await act(async () => { finish(new Success(true)); });
 expect(update).toHaveBeenLastCalledWith('c', '1', false, '');
});
test('failed saves expose Retry without automatic retry loops', async () => {
 update.mockResolvedValue(new ApiError('offline'));
 const ui = render(<Card collection={collection} movie={movie}/>);
 fireEvent.changeText(ui.getByPlaceholderText('Write custom notes...'), 'draft');
 await act(async () => { jest.advanceTimersByTime(1000); });
 expect(ui.getByText('Retry')).toBeTruthy();
 await act(async () => { jest.advanceTimersByTime(10000); });
 expect(update).toHaveBeenCalledTimes(1);
 update.mockResolvedValue(new Success(true));
 await act(async () => { fireEvent.press(ui.getByText('Retry')); });
 expect(update).toHaveBeenCalledTimes(2);
});
test('debounce coalesces calls, uses the latest callback and cancels pending work', () => {
 const first = jest.fn(), second = jest.fn();
 const hook = renderHook(({ cb }) => useDebouncedCallback(cb, 1000), { initialProps: { cb: first } });
 act(() => { hook.result.current(); jest.advanceTimersByTime(500); hook.result.current(); });
 hook.rerender({ cb: second });
 act(() => jest.advanceTimersByTime(500));
 expect(second).not.toHaveBeenCalled();
 act(() => jest.advanceTimersByTime(500));
 expect(first).not.toHaveBeenCalled();
 expect(second).toHaveBeenCalledTimes(1);
 act(() => { hook.result.current(); hook.result.current.cancel(); jest.advanceTimersByTime(1000); });
 expect(second).toHaveBeenCalledTimes(1);
});

test.each([true, false])('removal success=%s clears drafts only after confirmation', async succeeds => {
 const Checkbox = require('expo-checkbox').default;
 const { postAddMovieToCollection } = require('../services/collectionService');
 const notedMovie = new Movie({ id: 1, collections: [{ id: 'c', moviesCollectionNotes: 'old' } as any] });
 remove.mockResolvedValue(succeeds ? new Success(true) : new ApiError('offline'));
 const ui = render(<Card collection={collection} movie={notedMovie}/>);
 fireEvent.changeText(ui.getByPlaceholderText('Write custom notes...'), 'pending');
 await act(async () => { ui.UNSAFE_getByType(Checkbox).props.onValueChange(false); });
 await act(async () => { jest.advanceTimersByTime(1000); });
 if (succeeds) {
  expect(update).not.toHaveBeenCalled();
  expect(ui.queryByPlaceholderText('Write custom notes...')).toBeNull();
  await act(async () => { ui.UNSAFE_getByType(Checkbox).props.onValueChange(true); });
  expect(postAddMovieToCollection).toHaveBeenCalled();
  expect(ui.getByPlaceholderText('Write custom notes...').props.value).toBe('');
 } else {
  expect(ui.getByDisplayValue('pending')).toBeTruthy();
  expect(update).toHaveBeenCalledWith('c', '1', false, 'pending');
 }
});
test('unmount cancels a debounced callback', () => {
 const cb = jest.fn();
 const hook = renderHook(() => useDebouncedCallback(cb, 100));
 act(() => hook.result.current());
 hook.unmount();
 act(() => jest.advanceTimersByTime(100));
 expect(cb).not.toHaveBeenCalled();
});
test('a pending removal prevents typing from scheduling another note write', async () => {
 const Checkbox = require('expo-checkbox').default;
 let finish: any;
 remove.mockImplementation(() => new Promise(resolve => finish = resolve));
 const ui = render(<Card collection={collection} movie={movie}/>);
 await act(async () => { ui.UNSAFE_getByType(Checkbox).props.onValueChange(false); });
 expect(ui.getByPlaceholderText('Write custom notes...').props.editable).toBe(false);
 fireEvent.changeText(ui.getByPlaceholderText('Write custom notes...'), 'during deletion');
 await act(async () => { jest.advanceTimersByTime(1000); });
 expect(update).not.toHaveBeenCalled();
 await act(async () => { finish(new Success(true)); });
});
test('navigation waits for membership removal before draining notes', async () => {
 const Checkbox = require('expo-checkbox').default;
 let finish: any, drain: any;
 remove.mockImplementation(() => new Promise(resolve => finish = resolve));
 const ui = render(<Card collection={collection} movie={movie} registerSave={(_id, save) => { if (save) drain = save; }}/>);
 fireEvent.changeText(ui.getByPlaceholderText('Write custom notes...'), 'pending');
 await act(async () => { ui.UNSAFE_getByType(Checkbox).props.onValueChange(false); });
 let drained = false;
 let navigation: any;
 await act(async () => { navigation = drain().then(() => { drained = true; }); });
 expect(drained).toBe(false);
 expect(update).not.toHaveBeenCalled();
 await act(async () => { finish(new Success(true)); await navigation; });
 expect(drained).toBe(true);
 expect(update).not.toHaveBeenCalled();
});

test('failed slow removal resumes autosave only after membership is known', async () => {
 const Checkbox = require('expo-checkbox').default;
 let finish: any;
 remove.mockImplementationOnce(() => new Promise(resolve => finish = resolve));
 const ui = render(<Card collection={collection} movie={movie}/>);
 fireEvent.changeText(ui.getByPlaceholderText('Write custom notes...'), 'retained draft');
 await act(async () => { ui.UNSAFE_getByType(Checkbox).props.onValueChange(false); });
 await act(async () => { jest.advanceTimersByTime(5000); });
 expect(update).not.toHaveBeenCalled();
 await act(async () => { finish(new ApiError('offline')); });
 await act(async () => { jest.advanceTimersByTime(1000); });
 expect(update).toHaveBeenCalledTimes(1);
 expect(update).toHaveBeenCalledWith('c', '1', false, 'retained draft');
 expect(ui.getByText('Saved')).toBeTruthy();
});

test('unmounting with a pending edit saves it immediately', async () => {
 const ui = render(<Card collection={collection} movie={movie}/>);
 fireEvent.changeText(ui.getByPlaceholderText('Write custom notes...'), 'left in a hurry');
 ui.unmount();
 await act(async () => {});
 expect(update).toHaveBeenCalledWith('c', '1', false, 'left in a hurry');
});

test('a successful save on unmount leaves no stored draft', async () => {
 const ui = render(<Card collection={collection} movie={movie}/>);
 fireEvent.changeText(ui.getByPlaceholderText('Write custom notes...'), 'saved late');
 ui.unmount();
 await act(async () => {});
 expect(unsavedNotes.size).toBe(0);
});

test('a draft that cannot save on unmount is restored and autosaved on return', async () => {
 update.mockResolvedValueOnce(new ApiError('signed out'));
 const first = render(<Card collection={collection} movie={movie}/>);
 fireEvent.changeText(first.getByPlaceholderText('Write custom notes...'), 'kept through login');
 first.unmount();
 await act(async () => {});
 const second = render(<Card collection={collection} movie={movie}/>);
 expect(second.getByDisplayValue('kept through login')).toBeTruthy();
 await act(async () => { jest.advanceTimersByTime(1000); });
 expect(update).toHaveBeenCalledTimes(2);
 expect(update).toHaveBeenLastCalledWith('c', '1', false, 'kept through login');
});

test('a draft is not restored after discarding or once the title left the collection', async () => {
 const discarded = render(<Card collection={collection} movie={movie}/>);
 fireEvent.changeText(discarded.getByPlaceholderText('Write custom notes...'), 'throw away');
 discarded.rerender(<Card collection={collection} movie={movie} discarding/>);
 discarded.unmount();
 expect(unsavedNotes.size).toBe(0);
 unsavedNotes.set('c:1:false', { draft: 'orphan', base: { current: '' } });
 const removed = render(<Card collection={{ ...collection, isInCollection: false }} movie={movie}/>);
 await act(async () => { jest.advanceTimersByTime(5000); });
 expect(update).not.toHaveBeenCalled();
 expect(unsavedNotes.size).toBe(0);
 removed.unmount();
});

test('membership Retry repeats the request and clears the failure', async () => {
 const Checkbox = require('expo-checkbox').default;
 remove.mockResolvedValueOnce(new ApiError('offline')).mockResolvedValueOnce(new Success(true));
 const ui = render(<Card collection={collection} movie={movie}/>);
 await act(async () => { ui.UNSAFE_getByType(Checkbox).props.onValueChange(false); });
 await act(async () => { fireEvent.press(ui.getByText('Retry')); });
 expect(remove).toHaveBeenCalledTimes(2);
 expect(ui.queryByText('Unable to update collection')).toBeNull();
});

test('leaving saves notes and never replays or blocks on an already visible membership failure', async () => {
 const Checkbox = require('expo-checkbox').default;
 let drain: any;
 remove.mockResolvedValueOnce(new ApiError('offline'));
 const ui = render(<Card collection={collection} movie={movie} registerSave={(_id, save) => { if (save) drain = save; }}/>);
 await act(async () => { ui.UNSAFE_getByType(Checkbox).props.onValueChange(false); });
 fireEvent.changeText(ui.getByPlaceholderText('Write custom notes...'), 'keeping this');
 let result: any;
 await act(async () => { result = await drain(); });
 expect(result).toBe(true);
 expect(update).toHaveBeenCalledWith('c', '1', false, 'keeping this');
 expect(remove).toHaveBeenCalledTimes(1);
 expect(ui.getByDisplayValue('keeping this')).toBeTruthy();
});

test('a membership change failing during leave blocks that leave', async () => {
 const Checkbox = require('expo-checkbox').default;
 let drain: any, finish: any;
 remove.mockImplementationOnce(() => new Promise(resolve => finish = resolve));
 const ui = render(<Card collection={collection} movie={movie} registerSave={(_id, save) => { if (save) drain = save; }}/>);
 await act(async () => { ui.UNSAFE_getByType(Checkbox).props.onValueChange(false); });
 let leaving: any;
 await act(async () => { leaving = drain(); });
 await act(async () => { finish(new ApiError('offline')); });
 await expect(leaving).resolves.toBe(false);
});

test('discarding stops a running save from sending newer text', async () => {
 let finish: any;
 update.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
 const ui = render(<Card collection={collection} movie={movie}/>);
 fireEvent.changeText(ui.getByPlaceholderText('Write custom notes...'), 'first');
 await act(async () => { jest.advanceTimersByTime(1000); });
 fireEvent.changeText(ui.getByPlaceholderText('Write custom notes...'), 'discard me');
 ui.rerender(<Card collection={collection} movie={movie} discarding/>);
 ui.unmount();
 await act(async () => { finish(new Success(true)); });
 expect(update).toHaveBeenCalledTimes(1);
});

test('an add that finds the row keeps the notes already on the server', async () => {
 const Checkbox = require('expo-checkbox').default;
 (postAddMovieToCollection as jest.Mock).mockResolvedValueOnce(new Success({ notes: 'from elsewhere' }));
 const ui = render(<Card collection={{ ...collection, isInCollection: false }} movie={movie}/>);
 await act(async () => { ui.UNSAFE_getByType(Checkbox).props.onValueChange(true); });
 expect(ui.getByDisplayValue('from elsewhere')).toBeTruthy();
 expect(ui.getByText('Saved')).toBeTruthy();
});

test('a draft older than the server note is dropped rather than saved over it', async () => {
 unsavedNotes.set('c:1:false', { draft: 'old draft', base: { current: 'older server text' } });
 const fresh = new Movie({ id: 1, collections: [{ id: 'c', name: 'Watch', moviesCollectionNotes: 'newer server text' } as any] });
 const ui = render(<Card collection={collection} movie={fresh}/>);
 await act(async () => { jest.advanceTimersByTime(5000); });
 expect(ui.getByDisplayValue('newer server text')).toBeTruthy();
 expect(update).not.toHaveBeenCalled();
 expect(require('react-native-toast-message').default.show).toHaveBeenCalledWith(expect.objectContaining({ text1: 'Unsaved note not restored' }));
});

test('draining a clean card does not show saving state or write', async () => {
 let drain: any;
 const ui = render(<Card collection={collection} movie={movie} registerSave={(_id, save) => { if (save) drain = save; }}/>);
 let pending: any;
 act(() => { pending = drain(); });
 expect(ui.queryByText('Saving')).toBeNull();
 await act(async () => { await pending; });
 expect(update).not.toHaveBeenCalled();
});

test('a draft survives trimming by the server and saves that finish after unmount', async () => {
 let finish: any;
 update.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; })).mockResolvedValueOnce(new ApiError('signed out'));
 const first = render(<Card collection={collection} movie={movie}/>);
 fireEvent.changeText(first.getByPlaceholderText('Write custom notes...'), 'ab ');
 await act(async () => { jest.advanceTimersByTime(1000); });
 fireEvent.changeText(first.getByPlaceholderText('Write custom notes...'), 'ab c');
 first.unmount();
 await act(async () => { finish(new Success(true)); });
 const stored = new Movie({ id: 1, collections: [{ id: 'c', name: 'Watch', moviesCollectionNotes: 'ab' } as any] });
 const second = render(<Card collection={collection} movie={stored}/>);
 expect(second.getByDisplayValue('ab c')).toBeTruthy();
});

test('a failed save shows the server reason', async () => {
 update.mockResolvedValue(new ApiError('Movie not found in collection.'));
 const ui = render(<Card collection={collection} movie={movie}/>);
 fireEvent.changeText(ui.getByPlaceholderText('Write custom notes...'), 'draft');
 await act(async () => { jest.advanceTimersByTime(1000); });
 expect(require('react-native-toast-message').default.show).toHaveBeenCalledWith(expect.objectContaining({ text2: 'Movie not found in collection.' }));
});

test('note Retry cannot send a draft while the editor is discarding', async () => {
 update.mockResolvedValue(new ApiError('offline'));
 const ui = render(<Card collection={collection} movie={movie}/>);
 fireEvent.changeText(ui.getByPlaceholderText('Write custom notes...'), 'draft');
 await act(async () => { jest.advanceTimersByTime(1000); });
 expect(update).toHaveBeenCalledTimes(1);
 ui.rerender(<Card collection={collection} movie={movie} disabled discarding/>);
 await act(async () => { fireEvent.press(ui.getByText('Retry')); });
 expect(update).toHaveBeenCalledTimes(1);
});

test('Retry clears the error when the text returned to what is saved', async () => {
 let finish: any;
 update.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
 const ui = render(<Card collection={collection} movie={movie}/>);
 fireEvent.changeText(ui.getByPlaceholderText('Write custom notes...'), 'typo');
 await act(async () => { jest.advanceTimersByTime(1000); });
 fireEvent.changeText(ui.getByPlaceholderText('Write custom notes...'), '');
 await act(async () => { finish(new ApiError('offline')); });
 await act(async () => { fireEvent.press(ui.getByText('Retry')); });
 expect(ui.queryByText('Retry')).toBeNull();
});

test('a slow unmount save cannot delete a newer stored draft', async () => {
 let finish: any;
 update.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
 const first = render(<Card collection={collection} movie={movie}/>);
 fireEvent.changeText(first.getByPlaceholderText('Write custom notes...'), 'older');
 first.unmount();
 const newer = { draft: 'newer', base: { current: '' } };
 unsavedNotes.set('c:1:false', newer);
 await act(async () => { finish(new Success(true)); });
 expect(unsavedNotes.get('c:1:false')).toBe(newer);
});

test('unmounting during a removal neither saves nor stores the draft', async () => {
 const Checkbox = require('expo-checkbox').default;
 remove.mockImplementationOnce(() => new Promise(() => {}));
 const ui = render(<Card collection={collection} movie={movie}/>);
 fireEvent.changeText(ui.getByPlaceholderText('Write custom notes...'), 'being removed');
 await act(async () => { ui.UNSAFE_getByType(Checkbox).props.onValueChange(false); });
 ui.unmount();
 await act(async () => {});
 expect(update).not.toHaveBeenCalled();
 expect(unsavedNotes.size).toBe(0);
});
