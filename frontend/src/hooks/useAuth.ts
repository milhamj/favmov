import { useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { checkAuthStatus, subscribeToAuthChanges } from '../services/authService';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check initial auth state
    checkAuthStatus().then(({ session, user }) => {
      setSession(session);
      setUser(user);
      setLoading(false);
    });

    // Subscribe to auth changes
    const { data: { subscription } } = subscribeToAuthChanges((session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    // Cleanup subscription
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  return {
    user,
    session,
    loading,
    isAuthenticated: !!user
  };
};