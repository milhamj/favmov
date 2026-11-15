import withAuth from '@/features/auth/withAuth';
import AddToCollectionScreen from '@/features/collections/AddToCollectionScreen';
import { useLocalSearchParams } from 'expo-router';

const AddToCollectionPage = withAuth(() => {
  const params = useLocalSearchParams();
  return <AddToCollectionScreen params={params} />;
});

export default AddToCollectionPage;
