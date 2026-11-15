import RetryButton from '@/components/RetryButton';
import { COLORS } from '@/theme/colors';
import { type UseInfiniteQueryResult } from '@tanstack/react-query';
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

type PagedQuery = Pick<
  UseInfiniteQueryResult,
  'hasNextPage' | 'isFetching' | 'isFetchingNextPage' | 'isFetchNextPageError' | 'fetchNextPage'
>;

export function loadNextPage(query: PagedQuery) {
  if (query.hasNextPage && !query.isFetching && !query.isFetchNextPageError)
    void query.fetchNextPage({ cancelRefetch: false });
}

export default function NextPageFooter({ query }: { query: PagedQuery }) {
  if (query.isFetchNextPageError)
    return <RetryButton onPress={() => void query.fetchNextPage({ cancelRefetch: false })} />;
  if (!query.isFetchingNextPage) return null;
  return (
    <View style={styles.loader}>
      <ActivityIndicator
        accessibilityLabel="Loading more results"
        size="small"
        color={COLORS.accent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  loader: { paddingVertical: 20, alignItems: 'center' },
});
