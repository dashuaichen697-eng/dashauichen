import { useEffect, useState } from 'react';

const SESSION_KEY = 'stellar-rpg-cloud-session';

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSession(session) {
  if (session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
}

export function useAuth() {
  const [session, setSession] = useState(loadSession);
  const [loading, setLoading] = useState(false);
  const [localOnly, setLocalOnly] = useState(false);

  useEffect(() => {
    saveSession(localOnly ? null : session);
  }, [localOnly, session]);

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
    if (nextSession) {
      setSession(nextSession);
    }
    return result;
  }

  async function signIn(email, password) {
    return applySession(await callAuthApi('signin', { email, password }));
  }

  async function signUp(email, password) {
    return applySession(await callAuthApi('signup', { email, password }));
  }

  async function resetPassword(email) {
    return callAuthApi('reset', { email });
  }

  async function signOut() {
    setSession(null);
    saveSession(null);
    return undefined;
  }

  function useLocalMode() {
    setLocalOnly(true);
    setSession(null);
    setLoading(false);
  }

  return {
    configured: !localOnly,
    cloudAvailable: true,
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
