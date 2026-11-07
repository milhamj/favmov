import { COLORS } from '../styles/colors';
import { ActivityIndicator } from "react-native";

const FullPageLoader: React.FC = () => {
    return <ActivityIndicator
        size="large"
        color={COLORS.accent}
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
    />;
}

export default FullPageLoader;
