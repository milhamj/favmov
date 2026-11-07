import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import NotFoundPage from '../app/+not-found';
import { router } from '../navigation/router';

jest.mock('expo-router', () => require('../../test/expoRouter'));

beforeEach(() => {
  jest.clearAllMocks();
});

test('explains the missing page and replaces it with home', () => {
  const ui = render(<NotFoundPage />);
  expect(ui.getByRole('header', { name: 'Page not found' })).toBeTruthy();
  expect(ui.getByText("This page doesn't exist or may have moved.")).toBeTruthy();
  fireEvent.press(ui.getByRole('button', { name: 'Go home' }));
  expect(router.replace).toHaveBeenCalledWith('/');
  expect(router.navigate).not.toHaveBeenCalled();
});

test.each([true, false])('back is safe with history=%s', hasHistory => {
  const expoRouter = require('../../test/expoRouter').router;
  expoRouter.canGoBack.mockReturnValue(hasHistory);
  const ui = render(<NotFoundPage />);
  fireEvent.press(ui.getByRole('button', { name: 'Go back' }));
  if (hasHistory) expect(expoRouter.back).toHaveBeenCalledTimes(1);
  else expect(expoRouter.replace).toHaveBeenCalledWith('/');
});
