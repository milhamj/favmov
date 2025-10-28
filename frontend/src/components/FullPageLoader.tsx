import { ActivityIndicator } from "react-native";

const FullPageLoader: React.FC = () => {
    return <ActivityIndicator 
        size="large" 
        color="tomato" 
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }} 
    />;
}

export default FullPageLoader;