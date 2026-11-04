import { useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { router } from "../navigation/router";
import { routes, routeWithParams } from "../navigation/routes";
import FullPageLoader from "./FullPageLoader";

import { usePathname, useLocalSearchParams } from 'expo-router';

const withAuth = (Component: React.ComponentType) => {
    return (props: any) => {
        const pathname = usePathname();
        const params = useLocalSearchParams();
        const destination = routeWithParams(pathname, params);
        const { isAuthenticated, loading } = useAuth();

        useEffect(() => {
            if (!loading && !isAuthenticated) {
                router.replace(routes.loginWithReturnTo(destination));
            }
        }, [isAuthenticated, loading, destination]);

        if (loading) return <FullPageLoader />;
        if (!isAuthenticated) return null;

        return <Component {...props} />;
    };
};

export default withAuth;