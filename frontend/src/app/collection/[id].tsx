import withAuth from '@/features/auth/withAuth';
import CollectionDetailScreen from '@/features/collections/CollectionDetailScreen';
import { useLocalSearchParams } from 'expo-router';

const CollectionDetailPage = withAuth(() => {
  const params = useLocalSearchParams();
  return <CollectionDetailScreen params={params} />;
});

export default CollectionDetailPage;
