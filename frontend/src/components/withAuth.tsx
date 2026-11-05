import { memo, useEffect, useRef } from "react";
import { useAuth } from "../hooks/useAuth";
import { router } from "../navigation/router";
import { routes, routeWithParams } from "../navigation/routes";
import { useIsFocused } from "@react-navigation/native";
import FullPageLoader from "./FullPageLoader";

import { usePathname, useLocalSearchParams } from 'expo-router';

const withAuth = (Component: React.ComponentType) => {
    // usePathname below changes on every navigation; only this wrapper needs to re-render for it.
    const Protected = memo(Component);
    return (props: any) => {
        const pathname = usePathname();
        const params = useLocalSearchParams();
        const focused = useIsFocused();
        const destination = useRef('');
        destination.current = routeWithParams(pathname, params);
        const { isAuthenticated, loading } = useAuth();

        useEffect(() => {
            if (focused && !loading && !isAuthenticated) {
                router.replace(routes.loginWithReturnTo(destination.current));
            }
        }, [isAuthenticated, loading, focused]);

        if (loading) return <FullPageLoader />;
        if (!isAuthenticated) return null;

        return <Protected {...props} />;
    };
};

export default withAuth;