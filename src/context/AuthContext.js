import * as SecureStore from 'expo-secure-store';
import { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { reservasApi } from '../services/api';

const TOKEN_KEY = 'zona8.session';
const AuthContext = createContext(null);

async function readSession() {
  if (Platform.OS === 'web') return globalThis.localStorage?.getItem(TOKEN_KEY);
  return SecureStore.getItemAsync(TOKEN_KEY);
}

async function saveSession(value) {
  if (Platform.OS === 'web') {
    globalThis.localStorage?.setItem(TOKEN_KEY, value);
    return;
  }
  await SecureStore.setItemAsync(TOKEN_KEY, value);
}

async function clearSession() {
  if (Platform.OS === 'web') {
    globalThis.localStorage?.removeItem(TOKEN_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    readSession().then(async(value) => {
      if (value) {
        const storedSession = JSON.parse(value);
        if (storedSession.user?.email === 'emily@zona8.local') {
          storedSession.user = { ...storedSession.user, firstName: 'Fabian', lastName: 'Barrientos', email: 'Orleyfabian.r@gmail.com' };
          await saveSession(JSON.stringify(storedSession));
        }
        setSession(storedSession);
        if (storedSession.token && storedSession.token !== 'demo-local-token') {
          reservasApi.me(storedSession.token).then((user) => {
            const refreshedSession = { ...storedSession, user };
            setSession(refreshedSession);
            return saveSession(JSON.stringify(refreshedSession));
          }).catch(() => {});
        }
      }
      setLoading(false);
      
    }).catch(() => setLoading(false));
  }, []);

  async function signIn(username, password) {
    try {
      const remote = await reservasApi.login(username, password);
      const next = { token: remote.accessToken || remote.token, user: { ...remote, firstName: 'Fabian', lastName: 'Barrientos', email: 'Orleyfabian.r@gmail.com' } };
      await saveSession(JSON.stringify(next));
      setSession(next);
      return next;
    } catch (error) {
      if (username === 'emilys' && password === 'emilyspass') {
        const next = { token: 'demo-local-token', user: { firstName: 'Fabian', lastName: 'Barrientos', email: 'Orleyfabian.r@gmail.com' } };
        await saveSession(JSON.stringify(next));
        setSession(next);
        return next;
      }
      throw new Error('Credenciales invalidas. Usa emilys / emilyspass para la demo.');
    }
  }

  async function signOut() {
    await clearSession();
    setSession(null);
  }

  async function updateProfile(changes) {
    const next = {
      ...session,
      user: { ...session.user, ...changes },
    };
    await saveSession(JSON.stringify(next));
    setSession(next);
    return next;
  }

  return <AuthContext.Provider value={{ session, loading, signIn, signOut, updateProfile }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
