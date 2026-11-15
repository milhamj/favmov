import { ApiError } from '@/lib/apiError';
import { supabase } from '@/lib/supabaseClient';
import { Session, User } from '@supabase/supabase-js';

const toAuthError = (error: unknown) =>
  error instanceof ApiError
    ? error
    : new ApiError(
        typeof error === 'object' &&
          error !== null &&
          'message' in error &&
          typeof error.message === 'string' &&
          error.message
          ? error.message
          : 'Unable to sign in',
      );

export const checkAuthStatus = async (): Promise<{
  session: Session | null;
  user: User | null;
}> => {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    if (error) throw error;
    return {
      session,
      user: session?.user ?? null,
    };
  } catch {
    return { session: null, user: null };
  }
};

export const subscribeToAuthChanges = (callback: (session: Session | null) => void) => {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
};

export const signInWithOtp = async (
  email: string,
): Promise<{ user: User | null; session: Session | null; messageId?: string | null }> => {
  try {
    const { data, error } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        shouldCreateUser: true,
      },
    });
    if (error) throw error;
    return data;
  } catch (error: unknown) {
    throw toAuthError(error);
  }
};

export const verifyOtp = async (
  email: string,
  token: string,
): Promise<{ user: User | null; session: Session | null }> => {
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });
    if (error) throw error;
    return data;
  } catch (error: unknown) {
    throw toAuthError(error);
  }
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw new ApiError(error.message);
};
