import { useRef, useCallback, useLayoutEffect } from 'react';
import { useFocusEffect } from 'expo-router/react-navigation';
import { type UseQueryResult } from '@tanstack/react-query';

export function useRefetchStaleOnFocus(
  query: Pick<UseQueryResult, 'isStale' | 'refetch'>,
  enabled = true,
) {
  const current = useRef({ query, enabled });
  useLayoutEffect(() => {
    current.current = { query, enabled };
  });
  useFocusEffect(
    useCallback(() => {
      if (current.current.enabled && current.current.query.isStale)
        void current.current.query.refetch();
    }, []),
  );
}
