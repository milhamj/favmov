import React from 'react';
import { render, act, fireEvent } from '@testing-library/react-native';
import { NavigationContainer, createNavigationContainerRef, createNavigatorFactory, useNavigationBuilder, StackRouter, usePreventRemoveContext } from '@react-navigation/native';
import Editor from '../app/collection/add';
import { unsavedNotes } from '../components/CollectionAddCard';
import { router } from '../navigation/router';
import { updateNotes, postAddMovieToCollection, deleteMovieFromCollection } from '../services/collectionService';
import { Success, Error as ApiError } from '../model/apiResponse';
let mockPrevented: Record<string, { preventRemove: boolean }> = {};
jest.mock('expo-router', () => ({ useLocalSearchParams: () => ({ movie_id: '7' }), useNavigation: () => require('@react-navigation/native').useNavigation() }));
jest.mock('../components/withAuth', () => ({ __esModule: true, default: (component: any) => component }));
jest.mock('../navigation/router', () => ({ router: { goBackSafely: jest.fn() } }));
jest.mock('../services/movieService', () => ({ fetchMovieDetails: jest.fn(() => Promise.resolve(new (require('../model/apiResponse').Success)(new (require('../model/movieModel').Movie)({ id: 7, title: 'Title' })))) }));
jest.mock('../services/collectionService', () => ({ getUserCollections: jest.fn(() => Promise.resolve(new (require('../model/apiResponse').Success)([{ id: 'c', name: 'Watch' }]))), getCheckMovieExistInCollection: jest.fn(() => Promise.resolve(new (require('../model/apiResponse').Success)([{ id: 'c' }]))), updateNotes: jest.fn(), postAddMovieToCollection: jest.fn(), deleteMovieFromCollection: jest.fn() }));
function Observer() { mockPrevented = usePreventRemoveContext().preventedRoutes; return null; }
function Navigator(props: any) {
 const { state, descriptors, NavigationContent } = useNavigationBuilder(StackRouter, props);
 return <NavigationContent><Observer/>{descriptors[state.routes[state.index].key].render()}</NavigationContent>;
}
const Stack = createNavigatorFactory(Navigator)();
const Home = () => null;
beforeEach(() => unsavedNotes.clear());
test('real prevention context keeps editor mounted during save/failure and permits retry removal', async () => {
 const navigation = createNavigationContainerRef<any>();
 let finish: any;
 (updateNotes as jest.Mock).mockImplementationOnce(() => new Promise(r => finish = r));
 const ui = render(<NavigationContainer ref={navigation} initialState={{ index: 1, routes: [{ name: 'home' }, { name: 'editor' }] }}><Stack.Navigator><Stack.Screen name="home" component={Home}/><Stack.Screen name="editor" component={Editor}/></Stack.Navigator></NavigationContainer>);
 await act(async () => {});
 const editorKey = navigation.getCurrentRoute()!.key;
 expect(mockPrevented[editorKey]?.preventRemove ?? false).toBe(false);
 fireEvent.changeText(ui.getByPlaceholderText('Write custom notes...'), 'native draft');
 await act(async () => { navigation.goBack(); });
 expect(navigation.getCurrentRoute()!.name).toBe('editor');
 expect(mockPrevented[editorKey]?.preventRemove).toBe(true);
 await act(async () => { finish(new ApiError('offline')); });
 expect(ui.getByText('Retry')).toBeTruthy();
 expect(navigation.getCurrentRoute()!.name).toBe('editor');
 expect(mockPrevented[editorKey]?.preventRemove).toBe(true);
 (updateNotes as jest.Mock).mockResolvedValue(new Success(true));
 await act(async () => { navigation.goBack(); });
 expect(navigation.getCurrentRoute()!.name).toBe('home');
});

test.each([false, true])('custom Back leaves only after saving, initial save failure=%s', async fails => {
 const navigation = createNavigationContainerRef<any>();
 (router.goBackSafely as jest.Mock).mockImplementation(() => navigation.goBack());
 let finish: any;
 (updateNotes as jest.Mock).mockImplementationOnce(() => new Promise(r => finish = r));
 const ui = render(<NavigationContainer ref={navigation} initialState={{ index: 1, routes: [{ name: 'home' }, { name: 'editor' }] }}><Stack.Navigator><Stack.Screen name="home" component={Home}/><Stack.Screen name="editor" component={Editor}/></Stack.Navigator></NavigationContainer>);
 await act(async () => {});
 fireEvent.changeText(ui.getByPlaceholderText('Write custom notes...'), 'saved draft');
 await act(async () => { fireEvent.press(ui.getByText('arrow-back')); });
 expect(navigation.getCurrentRoute()!.name).toBe('editor');
 expect(ui.getByPlaceholderText('Write custom notes...').props.editable).toBe(false);
 expect(updateNotes).toHaveBeenLastCalledWith('c', '7', false, 'saved draft');
 await act(async () => { finish(fails ? new ApiError('offline') : new Success(true)); });
 if (fails) {
  expect(navigation.getCurrentRoute()!.name).toBe('editor');
  expect(ui.getByText('Retry')).toBeTruthy();
  (updateNotes as jest.Mock).mockResolvedValue(new Success(true));
  await act(async () => { fireEvent.press(ui.getByText('arrow-back')); });
 }
 expect(navigation.getCurrentRoute()!.name).toBe('home');
});

test('a permanently failed save offers an explicit way to leave without saving', async () => {
 const navigation = createNavigationContainerRef<any>();
 (updateNotes as jest.Mock).mockResolvedValue(new ApiError('Title not found in collection', 404));
 const ui = render(<NavigationContainer ref={navigation} initialState={{ index: 1, routes: [{ name: 'home' }, { name: 'editor' }] }}><Stack.Navigator><Stack.Screen name="home" component={Home}/><Stack.Screen name="editor" component={Editor}/></Stack.Navigator></NavigationContainer>);
 await act(async () => {});
 const editorKey = navigation.getCurrentRoute()!.key;
 fireEvent.changeText(ui.getByPlaceholderText('Write custom notes...'), 'unsaved draft');
 await act(async () => { navigation.goBack(); });
 expect(navigation.getCurrentRoute()!.name).toBe('editor');
 expect(mockPrevented[editorKey]?.preventRemove).toBe(true);
 expect(ui.getByText('Your latest edits could not be saved.')).toBeTruthy();
 const attempts = (updateNotes as jest.Mock).mock.calls.length;
 await act(async () => { fireEvent.press(ui.getByText('Leave without saving')); });
 expect(navigation.getCurrentRoute()!.name).toBe('home');
 expect(updateNotes).toHaveBeenCalledTimes(attempts);
 expect(mockPrevented[editorKey]).toBeUndefined();
});

test('a clean editor does not prevent Back or start a save', async () => {
 const navigation = createNavigationContainerRef<any>();
 const ui = render(<NavigationContainer ref={navigation} initialState={{ index: 1, routes: [{ name: 'home' }, { name: 'editor' }] }}><Stack.Navigator><Stack.Screen name="home" component={Home}/><Stack.Screen name="editor" component={Editor}/></Stack.Navigator></NavigationContainer>);
 await act(async () => {});
 const key = navigation.getCurrentRoute()!.key;
 expect(mockPrevented[key]?.preventRemove ?? false).toBe(false);
 await act(async () => { navigation.goBack(); });
 expect(navigation.getCurrentRoute()!.name).toBe('home');
});
test('successful card Retry clears the failed-leave banner and prevention', async () => {
 const navigation = createNavigationContainerRef<any>();
 (updateNotes as jest.Mock).mockResolvedValueOnce(new ApiError('offline')).mockResolvedValue(new Success(true));
 const ui = render(<NavigationContainer ref={navigation} initialState={{ index: 1, routes: [{ name: 'home' }, { name: 'editor' }] }}><Stack.Navigator><Stack.Screen name="home" component={Home}/><Stack.Screen name="editor" component={Editor}/></Stack.Navigator></NavigationContainer>);
 await act(async () => {});
 fireEvent.changeText(ui.getByPlaceholderText('Write custom notes...'), 'draft');
 await act(async () => { navigation.goBack(); });
 expect(ui.getByText('Your latest edits could not be saved.')).toBeTruthy();
 await act(async () => { fireEvent.press(ui.getByText('Retry')); });
 expect(ui.queryByText('Your latest edits could not be saved.')).toBeNull();
 expect(mockPrevented[navigation.getCurrentRoute()!.key]?.preventRemove ?? false).toBe(false);
 await act(async () => { navigation.goBack(); });
 expect(navigation.getCurrentRoute()!.name).toBe('home');
});
test.each([false, true])('failed pending membership change blocks Back until retry succeeds, adding=%s', async adding => {
 const Checkbox = require('expo-checkbox').default;
 const navigation = createNavigationContainerRef<any>();
 let finish: any;
 if (adding) require('../services/collectionService').getCheckMovieExistInCollection.mockResolvedValueOnce(new Success([]));
 const change = (adding ? postAddMovieToCollection : deleteMovieFromCollection) as jest.Mock;
 change.mockImplementationOnce(() => new Promise(r => finish = r)).mockResolvedValue(new Success(true));
 const ui = render(<NavigationContainer ref={navigation} initialState={{ index: 1, routes: [{ name: 'home' }, { name: 'editor' }] }}><Stack.Navigator><Stack.Screen name="home" component={Home}/><Stack.Screen name="editor" component={Editor}/></Stack.Navigator></NavigationContainer>);
 await act(async () => {});
 await act(async () => { ui.UNSAFE_getByType(Checkbox).props.onValueChange(adding); });
 await act(async () => { navigation.goBack(); });
 await act(async () => { finish(new ApiError('offline')); });
 expect(navigation.getCurrentRoute()!.name).toBe('editor');
 expect(ui.getByText('Your latest edits could not be saved.')).toBeTruthy();
 await act(async () => { fireEvent.press(ui.getByText('Retry')); });
 expect(ui.queryByText('Your latest edits could not be saved.')).toBeNull();
 await act(async () => { navigation.goBack(); });
 expect(navigation.getCurrentRoute()!.name).toBe('home');
});
