import React from 'react';
import { render } from '@testing-library/react-native';
import RootLayout from '@/app/_layout';
import { SeoHead } from '@/components/SeoHead';

jest.mock('@/features/auth/AuthProvider', () => ({
  AuthProvider: ({ children }: React.PropsWithChildren) => children,
}));

let mockSegments = ['+not-found'];
jest.mock('expo-router', () => ({
  useSegments: () => mockSegments,
  Stack: Object.assign(() => null, { Screen: () => null }),
}));
jest.mock('@/components/SeoHead', () => ({ SeoHead: jest.fn(() => null) }));

test('resets not-found metadata when navigating to a normal route', () => {
  const ui = render(<RootLayout />);
  expect(jest.mocked(SeoHead).mock.calls.at(-1)?.[0]).toEqual(
    expect.objectContaining({ title: 'Page not found | FavMov' }),
  );
  mockSegments = ['(tabs)'];
  ui.rerender(<RootLayout />);
  expect(jest.mocked(SeoHead).mock.calls.at(-1)?.[0]).toEqual(
    expect.objectContaining({ title: undefined, description: undefined }),
  );
});
