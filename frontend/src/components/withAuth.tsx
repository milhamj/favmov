import { useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { router } from "../navigation/router";
import { routes } from "../navigation/routes";
import FullPageLoader from "./FullPageLoader";

const withAuth = (Component: React.ComponentType) => {
    return (props: any) => {
        const { isAuthenticated, loading } = useAuth();

        useEffect(() => {
            if (!loading && !isAuthenticated) {
                router.replace(routes.login);
            }
        }, [isAuthenticated, loading, router]);

        if (loading) return <FullPageLoader />;
        if (!isAuthenticated) return null;

        return <Component {...props} />;
    };
};

export default withAuth;