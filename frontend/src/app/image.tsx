import ImageScreen from '@/components/ImageScreen';
import { useLocalSearchParams } from 'expo-router';

export default function ImagePage() {
  const params = useLocalSearchParams();
  return <ImageScreen params={params} />;
}
