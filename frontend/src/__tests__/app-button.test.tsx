import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import AppButton from '../components/AppButton';
import RetryButton from '../components/RetryButton';

test('a text action invokes its callback when available', () => {
  const onPress = jest.fn();
  render(<AppButton label="Save" onPress={onPress} />);
  fireEvent.press(screen.getByRole('button', { name: 'Save' }));
  expect(onPress).toHaveBeenCalledTimes(1);
});

test.each([{ disabled: true }, { loading: true }])('an unavailable action keeps its name and blocks presses: %p', props => {
  const onPress = jest.fn();
  render(<AppButton label="Save" onPress={onPress} {...props} />);
  const button = screen.getByRole('button', { name: 'Save' });
  expect(button.props.accessibilityState).toEqual({ disabled: true, busy: !!props.loading });
  fireEvent.press(button);
  expect(onPress).not.toHaveBeenCalled();
});

test('an error without a recovery action shows only its message', () => {
  render(<RetryButton message="Invalid title URL" />);
  expect(screen.getByText('Invalid title URL')).toBeTruthy();
  expect(screen.queryByRole('button')).toBeNull();
});
