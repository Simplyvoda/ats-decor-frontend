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

// A 401 means the backend has rejected this token (expired/revoked) —
// treat it as an immediate logout rather than leaving stale screens up.
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      emitUnauthorized();
    }
    return Promise.reject(error);
  },
);

export default api;
