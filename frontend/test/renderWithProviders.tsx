import { type ReactElement, type PropsWithChildren } from 'react';
import { render, type RenderOptions } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider, notifyManager } from '@tanstack/react-query';
import { createQueryClient } from '@/lib/queryClient';
import { AuthProvider } from '@/features/auth/AuthProvider';

notifyManager.setScheduler((callback) => callback());

export const renderWithProviders = (
  ui: ReactElement,
  options?: RenderOptions & { queryClient?: QueryClient },
) => {
  const queryClient = options?.queryClient ?? createQueryClient();
  queryClient.setDefaultOptions({
    ...queryClient.getDefaultOptions(),
    queries: { ...queryClient.getDefaultOptions().queries, gcTime: Infinity },
  });
  const Providers = ({ children }: PropsWithChildren) => {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    );
  };
  return { ...render(ui, { ...options, wrapper: Providers }), queryClient };
};
