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

  async function callAuthApi(mode, payload) {
    const response = await fetch(`/api/auth?mode=${mode}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await response.json().catch(() => ({
      data: null,
      error: { message: '云端同步连接失败，请稍后重试或先使用本地模式进入。' }
    }));

    if (!response.ok && !result.error) {
      return { data: null, error: { message: '云端同步连接失败，请稍后重试或先使用本地模式进入。' } };
    }

    return result;
  }

  async function applySession(result) {
    const nextSession = result.data?.session;
    if (nextSession && supabase) {
      const { error } = await supabase.auth.setSession({
        access_token: nextSession.access_token,
        refresh_token: nextSession.refresh_token
      });
      if (error) return { data: result.data, error };
      setSession(nextSession);
    }
    return result;
  }

  async function signIn(email, password) {
    if (!supabase) return { error: new Error('云端同步尚未配置') };
    return applySession(await callAuthApi('signin', { email, password }));
  }

  async function signUp(email, password) {
    if (!supabase) return { error: new Error('云端同步尚未配置') };
    return applySession(await callAuthApi('signup', { email, password }));
  }

  async function resetPassword(email) {
    if (!supabase) return { error: new Error('云端同步尚未配置') };
    return callAuthApi('reset', { email });
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
