import withAuth from '@/features/auth/withAuth';
import CollectionsScreen from '@/features/collections/CollectionsScreen';

const CollectionPage = withAuth(() => {
  return <CollectionsScreen />;
});

export default CollectionPage;
