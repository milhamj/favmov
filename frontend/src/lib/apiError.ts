import { isAxiosError } from 'axios';

export class ApiError extends globalThis.Error {
  constructor(
    message: string,
    public status: number = 0,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function toApiError(
  error: unknown,
  fallbackMessage: string,
  useResponseMessage = false,
): ApiError {
  if (error instanceof ApiError) return error;
  if (isAxiosError<{ message?: string }>(error)) {
    return new ApiError(
      (useResponseMessage && error.response?.data?.message) || fallbackMessage,
      error.response?.status,
    );
  }
  return new ApiError(fallbackMessage);
}
