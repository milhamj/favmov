import MovieDetailScreen from '@/features/movies/MovieDetailScreen';
import { useLocalSearchParams } from 'expo-router';

const MovieDetailPage = () => {
  const params = useLocalSearchParams();
  return <MovieDetailScreen params={params} />;
};

export default MovieDetailPage;
