import { useEffect } from 'react';

// Stand-in for expo-router, used as: jest.mock('expo-router', () => require('<path>/test/expoRouter'))
export const router = { navigate: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: jest.fn(() => true) };

export const searchParams: { current: Record<string, string> } = { current: {} };
export const useLocalSearchParams = () => searchParams.current;

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
