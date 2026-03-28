import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      setIsLoadingAuth(true);

      const { data, error } = await supabase.auth.getSession();

      if (!isMounted) return;

      if (error) {
        setAuthError({
          type: 'auth_required',
          message: error.message,
        });
        setSession(null);
        setUser(null);
        setIsLoadingAuth(false);
        return;
      }

      const currentSession = data?.session ?? null;
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setAuthError(null);
      setIsLoadingAuth(false);
    };

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setAuthError(null);
      setIsLoadingAuth(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loginWithOtp = async (email) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      return { success: false, error };
    }

    return { success: true };
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return { success: false, error };
    }

    return { success: true };
  };

  const navigateToLogin = () => {
    window.location.href = '/login';
  };

  const value = useMemo(
    () => ({
      user,
      session,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      loginWithOtp,
      logout,
      navigateToLogin,
    }),
    [user, session, isLoadingAuth, isLoadingPublicSettings, authError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
