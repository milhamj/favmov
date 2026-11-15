import ExploreScreen from '@/features/movies/ExploreScreen';
import { useLocalSearchParams } from 'expo-router';

const ExplorePage = () => {
  const params = useLocalSearchParams();
  return <ExploreScreen params={params} />;
};

export default ExplorePage;
