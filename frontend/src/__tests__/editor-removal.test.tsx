import React from 'react';
import { render, act, fireEvent } from '@testing-library/react-native';
import { NavigationContainer, createNavigationContainerRef, createNavigatorFactory, useNavigationBuilder, StackRouter, usePreventRemoveContext } from '@react-navigation/native';
import Editor from '../app/collection/add';
import { updateNotes } from '../services/collectionService';
import { Success, Error as ApiError } from '../model/apiResponse';
let mockPrevented: Record<string, { preventRemove: boolean }> = {};
jest.mock('expo-router', () => ({ useLocalSearchParams: () => ({ movie_id: '7' }), useNavigation: () => require('@react-navigation/native').useNavigation() }));
jest.mock('../components/withAuth', () => ({ __esModule: true, default: (component: any) => component }));
jest.mock('../navigation/router', () => ({ router: { goBackSafely: jest.fn() } }));
jest.mock('../services/movieService', () => ({ fetchMovieDetails: jest.fn(() => Promise.resolve(new (require('../model/apiResponse').Success)(new (require('../model/movieModel').Movie)({ id: 7, title: 'Title' })))) }));
jest.mock('../services/collectionService', () => ({ getUserCollections: jest.fn(() => Promise.resolve(new (require('../model/apiResponse').Success)([{ id: 'c', name: 'Watch' }]))), getCheckMovieExistInCollection: jest.fn(() => Promise.resolve(new (require('../model/apiResponse').Success)([{ id: 'c' }]))), updateNotes: jest.fn() }));
function Observer() { mockPrevented = usePreventRemoveContext().preventedRoutes; return null; }
function Navigator(props: any) {
 const { state, descriptors, NavigationContent } = useNavigationBuilder(StackRouter, props);
 return <NavigationContent><Observer/>{descriptors[state.routes[state.index].key].render()}</NavigationContent>;
}
const Stack = createNavigatorFactory(Navigator)();
const Home = () => null;
test('real prevention context keeps editor mounted during save/failure and permits retry removal', async () => {
 const navigation = createNavigationContainerRef<any>();
 let finish: any;
 (updateNotes as jest.Mock).mockImplementationOnce(() => new Promise(r => finish = r));
 const ui = render(<NavigationContainer ref={navigation} initialState={{ index: 1, routes: [{ name: 'home' }, { name: 'editor' }] }}><Stack.Navigator><Stack.Screen name="home" component={Home}/><Stack.Screen name="editor" component={Editor}/></Stack.Navigator></NavigationContainer>);
 await act(async () => {});
 const editorKey = navigation.getCurrentRoute()!.key;
 expect(mockPrevented[editorKey]?.preventRemove).toBe(true);
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
