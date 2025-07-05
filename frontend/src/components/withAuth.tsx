import { useNavigation } from "@react-navigation/native";
import { useEffect } from "react";
import { ActivityIndicator } from "react-native";
import { useAuth } from "../hooks/useAuth";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../navigation/navigationTypes";

const withAuth = (Component: React.ComponentType) => {
    return (props: any) => {
        const navigation =  useNavigation<StackNavigationProp<RootStackParamList>>();
        const { isAuthenticated, loading } = useAuth();

        useEffect(() => {
            if (!loading && !isAuthenticated) {
                 navigation.reset({
                        index: 1,
                        routes: [
                        { name: 'MainPage', params: { activeTab: 'HomePage' } },
                        { name: 'LoginPage' },
                        ],
                    });
            }
        }, [isAuthenticated, loading, navigation]);

        if (loading) return <ActivityIndicator />;
        if (!isAuthenticated) return null;

        return <Component {...props} />;
    };
};

export default withAuth;