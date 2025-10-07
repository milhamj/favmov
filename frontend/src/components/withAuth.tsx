import { useEffect } from "react";
import { ActivityIndicator } from "react-native";
import { useAuth } from "../hooks/useAuth";
import { router } from "../navigation/router";
import { routes } from "../navigation/routes";

const withAuth = (Component: React.ComponentType) => {
    return (props: any) => {
        const { isAuthenticated, loading } = useAuth();

        useEffect(() => {
            if (!loading && !isAuthenticated) {
                router.replace(routes.login);
            }
        }, [isAuthenticated, loading, router]);

        if (loading) return <ActivityIndicator />;
        if (!isAuthenticated) return null;

        return <Component {...props} />;
    };
};

export default withAuth;