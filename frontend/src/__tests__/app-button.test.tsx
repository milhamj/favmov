import React from 'react';
import { StyleSheet } from 'react-native';
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

test('a disabled action is dimmed but a loading one keeps its full-strength spinner', () => {
  const opacity = () => StyleSheet.flatten(screen.getByRole('button', { name: 'Save' }).props.style).opacity;
  const disabled = render(<AppButton label="Save" onPress={jest.fn()} disabled />);
  expect(opacity()).toBe(0.5);
  disabled.unmount();
  render(<AppButton label="Save" onPress={jest.fn()} loading />);
  expect(opacity()).toBe(1);
});

test('an error without a recovery action shows only its message', () => {
  render(<RetryButton message="Invalid title URL" />);
  expect(screen.getByText('Invalid title URL')).toBeTruthy();
  expect(screen.queryByRole('button')).toBeNull();
});
