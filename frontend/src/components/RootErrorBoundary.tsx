import type { ErrorBoundaryProps } from 'expo-router';
import AppButton from './AppButton';
import EmptyState from './EmptyState';
import PageContainer from './PageContainer';

export default function RootErrorBoundary({ retry }: ErrorBoundaryProps) {
  return (
    <PageContainer>
      <EmptyState
        headingLevel={1}
        title="Something went wrong"
        description="Please try again."
        illustration={require('../../assets/images/not_found_cinema.png')}
      >
        <AppButton label="Try again" onPress={retry} />
      </EmptyState>
    </PageContainer>
  );
}
