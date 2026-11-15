import { startTransition, createContext, useState, useEffect, PropsWithChildren } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { checkAuthStatus, subscribeToAuthChanges } from './authService';

export const AuthContext = createContext<
  | {
      user: User | null;
      session: Session | null;
      loading: boolean;
      isAuthenticated: boolean;
    }
  | undefined
>(undefined);

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // An auth event can arrive before the initial lookup resolves and is newer than it.
    let heardEvent = false;
    checkAuthStatus().then(({ session, user }) => {
      if (heardEvent) {
        startTransition(() => setLoading(false));
        return;
      }
      startTransition(() => {
        setSession(session);
        setUser(user);
        setLoading(false);
      });
    });

    const {
      data: { subscription },
    } = subscribeToAuthChanges((session) => {
      heardEvent = true;
      startTransition(() => {
        setSession(session);
        setUser(session?.user ?? null);
      });
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};
