import PersonScreen from '@/features/people/PersonScreen';
import { useLocalSearchParams } from 'expo-router';

const PeopleDetailPage = () => {
  const params = useLocalSearchParams();
  return <PersonScreen params={params} />;
};

export default PeopleDetailPage;
