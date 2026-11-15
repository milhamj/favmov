import { fireEvent, render } from '@testing-library/react-native';
import RootErrorBoundary from '@/components/RootErrorBoundary';
import FullPageLoader from '@/components/FullPageLoader';

test('explains an unexpected failure and retries without exposing the error', () => {
  const retry = jest.fn();
  const ui = render(<RootErrorBoundary error={new Error('private details')} retry={retry} />);
  expect(ui.getByText('Something went wrong')).toBeTruthy();
  expect(ui.queryByText('private details')).toBeNull();
  fireEvent.press(ui.getByRole('button', { name: 'Try again' }));
  expect(retry).toHaveBeenCalledTimes(1);
});

test('the shared page loader has an accessible label', () => {
  expect(render(<FullPageLoader />).getByLabelText('Loading')).toBeTruthy();
});
