import { useEffect, useState } from 'react';
import { isCloudConfigured, supabase } from '../lib/supabase';

export function useAuth() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(isCloudConfigured);
  const [localOnly, setLocalOnly] = useState(false);

  useEffect(() => {
    if (!supabase || localOnly) {
      setLoading(false);
      return undefined;
    }

    let mounted = true;
    supabase.auth.getSession()
      .then(({ data }) => {
        if (!mounted) return;
        setSession(data.session);
        setLoading(false);
      })
      .catch((error) => {
        console.error('[StellarRPG] Supabase session 初始化失败', error);
        if (mounted) setLoading(false);
      });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, [localOnly]);

  async function signIn(email, password) {
    if (!supabase) return { error: new Error('云端同步尚未配置') };
    return supabase.auth.signInWithPassword({ email, password });
  }

  async function signUp(email, password) {
    if (!supabase) return { error: new Error('云端同步尚未配置') };
    return supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
  }

  async function resetPassword(email) {
    if (!supabase) return { error: new Error('云端同步尚未配置') };
    return supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
  }

  async function signOut() {
    if (localOnly || !supabase) return undefined;
    return supabase.auth.signOut();
  }

  function useLocalMode() {
    setLocalOnly(true);
    setSession(null);
    setLoading(false);
  }

  return {
    configured: isCloudConfigured && !localOnly,
    cloudAvailable: isCloudConfigured,
    localOnly,
    loading,
    session,
    user: session?.user ?? null,
    signIn,
    signUp,
    resetPassword,
    signOut,
    useLocalMode
  };
}
