import { Success, Error } from '../model/apiResponse';
import { supabase } from './supabaseClient';
import { Session, User } from '@supabase/supabase-js';

export const checkAuthStatus = async (): Promise<{
  session: Session | null;
  user: User | null;
}> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    
    return {
      session,
      user: session?.user ?? null
    };
  } catch (error) {
    console.error('Auth status check failed:', error);
    return { session: null, user: null };
  }
};

export const subscribeToAuthChanges = (
  callback: (session: Session | null) => void
) => {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
};

export const signInWithOtp = async (email: string): Promise<Success<any> | Error> => {
    try {
        const { data, error } = await supabase.auth.signInWithOtp({
            email: email,
            options: {
                shouldCreateUser: true,
            },
        })
        console.log(data, error)
        if (error) {
            console.error('Error signing in with OTP:', error);
            return new Error(error.message);
        }
        return new Success(data);
    } catch (error: any) {
        console.error('Error signing in with OTP:', error);
        return new Error(error.message);
    }
};