import { ApiError, toApiError } from '@/lib/apiError';

test('ApiError exposes its message and status, defaulting to zero', () => {
  expect(new ApiError('Nope')).toMatchObject({ name: 'ApiError', message: 'Nope', status: 0 });
  expect(new ApiError('Missing', 404).status).toBe(404);
});

test('conversion preserves HTTP status and selects the requested message source', () => {
  const error = { isAxiosError: true, response: { status: 403, data: { message: 'Denied' } } };
  expect(toApiError(error, 'Fallback')).toMatchObject({ message: 'Fallback', status: 403 });
  expect(toApiError(error, 'Fallback', true)).toMatchObject({ message: 'Denied', status: 403 });
  expect(toApiError({ isAxiosError: true }, 'Fallback', true)).toMatchObject({
    message: 'Fallback',
    status: 0,
  });
  expect(toApiError(new Error('Offline'), 'Fallback')).toMatchObject({
    message: 'Fallback',
    status: 0,
  });
  const failure = new ApiError('Nope', 409);
  expect(toApiError(failure, 'Fallback')).toBe(failure);
});
