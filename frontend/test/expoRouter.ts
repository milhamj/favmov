import { useEffect } from 'react';

// Stand-in for expo-router and @react-navigation/native, used as:
// jest.mock('expo-router', () => require('<path>/test/expoRouter'))
export const router = { navigate: jest.fn(), replace: jest.fn(), back: jest.fn(), dismissTo: jest.fn(), canGoBack: jest.fn(() => true) };

export const searchParams: { current: Record<string, string> } = { current: {} };
export const useLocalSearchParams = () => searchParams.current;

export const pathname: { current: string } = { current: '/' };
export const usePathname = () => pathname.current;

export const screenFocused: { current: boolean } = { current: true };
export const useIsFocused = () => screenFocused.current;

export const useNavigation = () => ({ dispatch: jest.fn(), addListener: () => () => {} });
export const usePreventRemove = () => {};

const focusCallbacks = new Set<() => void>();

export const useFocusEffect = (callback: () => void | (() => void)) => {
  useEffect(() => {
    focusCallbacks.add(callback as () => void);
    const cleanup = callback();
    return () => {
      focusCallbacks.delete(callback as () => void);
      cleanup?.();
    };
  }, [callback]);
};

// Simulates the user coming back to a screen that stayed mounted
export const refocus = () => focusCallbacks.forEach((callback) => callback());
