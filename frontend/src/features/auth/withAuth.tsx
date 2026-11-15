import { memo, useEffect } from 'react';
import { useAuth } from './useAuth';
import { router } from '@/navigation/router';
import { routes, routeWithParams } from '@/navigation/routes';
import { useIsFocused } from 'expo-router/react-navigation';
import FullPageLoader from '@/components/FullPageLoader';

import { usePathname, useLocalSearchParams } from 'expo-router';

const withAuth = (Component: React.ComponentType) => {
  // usePathname below changes on every navigation; only this wrapper needs to re-render for it.
  const Protected = memo(Component);
  return function Authenticated(props: Record<string, never>) {
    const pathname = usePathname();
    const params = useLocalSearchParams();
    const focused = useIsFocused();
    const { isAuthenticated, loading } = useAuth();

    useEffect(() => {
      if (focused && !loading && !isAuthenticated) {
        router.replace(routes.loginWithReturnTo(routeWithParams(pathname, params)));
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps -- Redirect on auth or focus changes; changing route params must not retrigger it.
    }, [isAuthenticated, loading, focused]);

    if (loading) return <FullPageLoader />;
    if (!isAuthenticated) return null;

    return <Protected {...props} />;
  };
};

export default withAuth;
