import { COLORS } from '@/theme/colors';
import { ActivityIndicator } from 'react-native';

const FullPageLoader: React.FC = () => {
  return (
    <ActivityIndicator
      accessibilityLabel="Loading"
      size="large"
      color={COLORS.accent}
      style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
    />
  );
};

export default FullPageLoader;
