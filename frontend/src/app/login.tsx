import LoginScreen from '@/features/auth/LoginScreen';
import { useLocalSearchParams } from 'expo-router';

const LoginPage = () => {
  const { return_to } = useLocalSearchParams();
  return <LoginScreen return_to={return_to} />;
};

export default LoginPage;
