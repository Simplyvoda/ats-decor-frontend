import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {API_URL} from '@env';
import {emitUnauthorized} from '../utils/authEvents';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use(async config => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Supabase access tokens expire after ~1 hour. Exchange the stored refresh
// token for a fresh session via the backend; returns the new access token,
// or null if the session is truly dead (refresh token expired/revoked).
// Uses bare axios — NOT the `api` instance — so this call can never loop
// back through the 401 interceptor below.
const refreshSession = async (): Promise<string | null> => {
  try {
    const raw = await AsyncStorage.getItem('session');
    const refreshToken = raw ? JSON.parse(raw)?.refresh_token : null;
    if (!refreshToken) {
      return null;
    }
    const res = await axios.post(`${API_URL}/auth/refresh`, {
      refresh_token: refreshToken,
    });
    const session = res.data?.data?.session;
    if (!session?.access_token) {
      return null;
    }
    await AsyncStorage.setItem('token', session.access_token);
    await AsyncStorage.setItem('session', JSON.stringify(session));
    return session.access_token;
  } catch {
    return null;
  }
};

// One in-flight refresh shared by all concurrent 401s — several requests
// failing at once (e.g. a screen firing parallel fetches right as the token
// expires) must not each burn the single-use refresh token separately.
let refreshInFlight: Promise<string | null> | null = null;

// A 401 no longer means instant logout — first try to refresh the session
// and transparently retry the failed request. Only when the refresh itself
// fails (session genuinely dead) does the forced-logout pub/sub fire.
api.interceptors.response.use(
  response => response,
  async error => {
    const original = error.config;
    if (error.response?.status === 401 && original && !original._retried) {
      original._retried = true; // one retry per request, never loops
      if (!refreshInFlight) {
        refreshInFlight = refreshSession().finally(() => {
          refreshInFlight = null;
        });
      }
      const newToken = await refreshInFlight;
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      }
      emitUnauthorized();
    } else if (error.response?.status === 401) {
      // Retried request 401'd again even with a fresh token — give up.
      emitUnauthorized();
    }
    return Promise.reject(error);
  },
);

export default api;
