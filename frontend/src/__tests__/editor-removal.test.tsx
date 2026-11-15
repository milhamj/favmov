import { renderWithProviders as render } from '../../test/renderWithProviders';
import React from 'react';
import { act, fireEvent } from '@testing-library/react-native';
import {
  NavigationContainer,
  createNavigationContainerRef,
  createNavigatorFactory,
  useNavigationBuilder,
  StackRouter,
  usePreventRemoveContext,
} from 'expo-router/react-navigation';
import Editor from '@/app/collection/add';
import { unsavedNotes } from '@/features/collections/unsavedNotesStore';
import { router } from '@/navigation/router';
import {
  updateNotes,
  postAddMovieToCollection,
  deleteMovieFromCollection,
} from '@/features/collections/collectionService';
import { ApiError } from '@/lib/apiError';
jest.mock('@/features/auth/useAuth', () => ({
  useAuth: () => ({ isAuthenticated: true, user: { id: 'u' } }),
}));
let mockPrevented: Record<string, { preventRemove: boolean }> = {};
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ movie_id: '7' }),
  useNavigation: () => require('expo-router/react-navigation').useNavigation(),
}));
jest.mock('@/features/auth/withAuth', () => ({
  __esModule: true,
  default: (component: any) => component,
}));
jest.mock('@/navigation/router', () => ({ router: { goBackSafely: jest.fn() } }));
jest.mock('@/features/movies/movieService', () => ({
  fetchMovieDetails: jest.fn(() =>
    Promise.resolve(require('../../test/factories').movie({ id: 7, title: 'Title' })),
  ),
}));
jest.mock('@/features/collections/collectionService', () => ({
  getUserCollections: jest.fn(() => Promise.resolve([{ id: 'c', name: 'Watch' }])),
  getCheckMovieExistInCollection: jest.fn(() => Promise.resolve([{ id: 'c' }])),
  updateNotes: jest.fn(),
  postAddMovieToCollection: jest.fn(),
  deleteMovieFromCollection: jest.fn(),
}));
function Observer() {
  const { preventedRoutes } = usePreventRemoveContext();
  React.useEffect(() => {
    mockPrevented = preventedRoutes;
  }, [preventedRoutes]);
  return null;
}
function Navigator(props: any) {
  const { state, descriptors, NavigationContent } = useNavigationBuilder(StackRouter, props);
  return (
    <NavigationContent>
      <Observer />
      {descriptors[state.routes[state.index].key].render()}
    </NavigationContent>
  );
}
const Stack = createNavigatorFactory(Navigator)();
const Home = () => null;
beforeEach(() => unsavedNotes.clear());
test('real prevention context keeps editor mounted during save/failure and permits retry removal', async () => {
  const navigation = createNavigationContainerRef<any>();
  let finish: any;
  (updateNotes as jest.Mock).mockImplementationOnce(
    () => new Promise((r, reject) => (finish = reject)),
  );
  const ui = render(
    <NavigationContainer
      ref={navigation}
      initialState={{ index: 1, routes: [{ name: 'home' }, { name: 'editor' }] }}
    >
      <Stack.Navigator>
        <Stack.Screen name="home" component={Home} />
        <Stack.Screen name="editor" component={Editor} />
      </Stack.Navigator>
    </NavigationContainer>,
  );
  await act(async () => {});
  const editorKey = navigation.getCurrentRoute()!.key;
  expect(mockPrevented[editorKey]?.preventRemove ?? false).toBe(false);
  fireEvent.changeText(ui.getByPlaceholderText('Write custom notes...'), 'native draft');
  await act(async () => {
    navigation.goBack();
  });
  expect(navigation.getCurrentRoute()!.name).toBe('editor');
  expect(mockPrevented[editorKey]?.preventRemove).toBe(true);
  await act(async () => {
    finish(new ApiError('offline'));
  });
  expect(ui.getByText('Retry')).toBeTruthy();
  expect(navigation.getCurrentRoute()!.name).toBe('editor');
  expect(mockPrevented[editorKey]?.preventRemove).toBe(true);
  (updateNotes as jest.Mock).mockResolvedValue(true);
  await act(async () => {
    navigation.goBack();
  });
  expect(navigation.getCurrentRoute()!.name).toBe('home');
});

test.each([false, true])(
  'custom Back leaves only after saving, initial save failure=%s',
  async (fails) => {
    const navigation = createNavigationContainerRef<any>();
    (router.goBackSafely as jest.Mock).mockImplementation(() => navigation.goBack());
    let finish: any, fail: any;
    (updateNotes as jest.Mock).mockImplementationOnce(
      () =>
        new Promise((r, reject) => {
          fail = reject;
          finish = r;
        }),
    );
    const ui = render(
      <NavigationContainer
        ref={navigation}
        initialState={{ index: 1, routes: [{ name: 'home' }, { name: 'editor' }] }}
      >
        <Stack.Navigator>
          <Stack.Screen name="home" component={Home} />
          <Stack.Screen name="editor" component={Editor} />
        </Stack.Navigator>
      </NavigationContainer>,
    );
    await act(async () => {});
    fireEvent.changeText(ui.getByPlaceholderText('Write custom notes...'), 'saved draft');
    await act(async () => {
      fireEvent.press(ui.getByRole('button', { name: 'Go back' }));
    });
    expect(navigation.getCurrentRoute()!.name).toBe('editor');
    expect(ui.getByPlaceholderText('Write custom notes...').props.editable).toBe(false);
    expect(updateNotes).toHaveBeenLastCalledWith('c', '7', false, 'saved draft');
    await act(async () => {
      if (fails) fail(new ApiError('offline'));
      else finish(true);
    });
    if (fails) {
      expect(navigation.getCurrentRoute()!.name).toBe('editor');
      expect(ui.getByText('Retry')).toBeTruthy();
      (updateNotes as jest.Mock).mockResolvedValue(true);
      await act(async () => {
        fireEvent.press(ui.getByRole('button', { name: 'Go back' }));
      });
    }
    expect(navigation.getCurrentRoute()!.name).toBe('home');
  },
);

test('a permanently failed save offers an explicit way to leave without saving', async () => {
  const navigation = createNavigationContainerRef<any>();
  (updateNotes as jest.Mock).mockRejectedValue(new ApiError('Title not found in collection', 404));
  const ui = render(
    <NavigationContainer
      ref={navigation}
      initialState={{ index: 1, routes: [{ name: 'home' }, { name: 'editor' }] }}
    >
      <Stack.Navigator>
        <Stack.Screen name="home" component={Home} />
        <Stack.Screen name="editor" component={Editor} />
      </Stack.Navigator>
    </NavigationContainer>,
  );
  await act(async () => {});
  const editorKey = navigation.getCurrentRoute()!.key;
  fireEvent.changeText(ui.getByPlaceholderText('Write custom notes...'), 'unsaved draft');
  await act(async () => {
    navigation.goBack();
  });
  expect(navigation.getCurrentRoute()!.name).toBe('editor');
  expect(mockPrevented[editorKey]?.preventRemove).toBe(true);
  expect(ui.getByText('Your latest edits could not be saved.')).toBeTruthy();
  const attempts = (updateNotes as jest.Mock).mock.calls.length;
  await act(async () => {
    fireEvent.press(ui.getByText('Leave without saving'));
  });
  expect(navigation.getCurrentRoute()!.name).toBe('home');
  expect(updateNotes).toHaveBeenCalledTimes(attempts);
  expect(mockPrevented[editorKey]).toBeUndefined();
});

test('a clean editor does not prevent Back or start a save', async () => {
  const navigation = createNavigationContainerRef<any>();
  render(
    <NavigationContainer
      ref={navigation}
      initialState={{ index: 1, routes: [{ name: 'home' }, { name: 'editor' }] }}
    >
      <Stack.Navigator>
        <Stack.Screen name="home" component={Home} />
        <Stack.Screen name="editor" component={Editor} />
      </Stack.Navigator>
    </NavigationContainer>,
  );
  await act(async () => {});
  const key = navigation.getCurrentRoute()!.key;
  expect(mockPrevented[key]?.preventRemove ?? false).toBe(false);
  await act(async () => {
    navigation.goBack();
  });
  expect(navigation.getCurrentRoute()!.name).toBe('home');
});
test('successful card Retry clears the failed-leave banner and prevention', async () => {
  const navigation = createNavigationContainerRef<any>();
  (updateNotes as jest.Mock).mockRejectedValueOnce(new ApiError('offline')).mockResolvedValue(true);
  const ui = render(
    <NavigationContainer
      ref={navigation}
      initialState={{ index: 1, routes: [{ name: 'home' }, { name: 'editor' }] }}
    >
      <Stack.Navigator>
        <Stack.Screen name="home" component={Home} />
        <Stack.Screen name="editor" component={Editor} />
      </Stack.Navigator>
    </NavigationContainer>,
  );
  await act(async () => {});
  fireEvent.changeText(ui.getByPlaceholderText('Write custom notes...'), 'draft');
  await act(async () => {
    navigation.goBack();
  });
  expect(ui.getByText('Your latest edits could not be saved.')).toBeTruthy();
  await act(async () => {
    fireEvent.press(ui.getByText('Retry'));
  });
  expect(ui.queryByText('Your latest edits could not be saved.')).toBeNull();
  expect(mockPrevented[navigation.getCurrentRoute()!.key]?.preventRemove ?? false).toBe(false);
  await act(async () => {
    navigation.goBack();
  });
  expect(navigation.getCurrentRoute()!.name).toBe('home');
});
test.each([false, true])(
  'membership failure during Back keeps the editor open with its inline error, adding=%s',
  async (adding) => {
    const navigation = createNavigationContainerRef<any>();
    let finish: any;
    if (adding)
      require('@/features/collections/collectionService').getCheckMovieExistInCollection.mockResolvedValueOnce(
        [],
      );
    const change = (adding ? postAddMovieToCollection : deleteMovieFromCollection) as jest.Mock;
    change
      .mockImplementationOnce(() => new Promise((r, reject) => (finish = reject)))
      .mockResolvedValue(true);
    const ui = render(
      <NavigationContainer
        ref={navigation}
        initialState={{ index: 1, routes: [{ name: 'home' }, { name: 'editor' }] }}
      >
        <Stack.Navigator>
          <Stack.Screen name="home" component={Home} />
          <Stack.Screen name="editor" component={Editor} />
        </Stack.Navigator>
      </NavigationContainer>,
    );
    await act(async () => {});
    await act(async () => {
      fireEvent.press(ui.getByRole('checkbox'));
    });
    await act(async () => {
      navigation.goBack();
    });
    await act(async () => {
      finish(new ApiError('offline'));
    });
    expect(navigation.getCurrentRoute()!.name).toBe('editor');
    expect(ui.getByText('Unable to update collection')).toBeTruthy();
    expect(ui.queryByText('Your latest edits could not be saved.')).toBeNull();
    await act(async () => {
      fireEvent.press(ui.getByText('Retry'));
    });
    expect(ui.queryByText('Unable to update collection')).toBeNull();
    await act(async () => {
      navigation.goBack();
    });
    expect(navigation.getCurrentRoute()!.name).toBe('home');
  },
);

jest.mock('@/features/auth/AuthProvider', () => ({
  AuthProvider: ({ children }: any) => children,
}));
