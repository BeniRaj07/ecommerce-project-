import axios from 'axios';
import store from './store/store';
import { logout } from './store/slices/authSlice';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
});

// This is the interceptor. It runs before every single request.
API.interceptors.request.use((config) => {
  // Get the user info from the Redux state
  const { userInfo } = store.getState().auth;
  if (userInfo) {
    // If the user is logged in, add their token to the Authorization header
    config.headers.Authorization = `Bearer ${userInfo.token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// If the server ever rejects our token (expired, or the account behind it no
// longer exists — e.g. the database was reseeded), clear the stale session
// instead of leaving the app stuck thinking it's still logged in.
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 && store.getState().auth.userInfo) {
      store.dispatch(logout());
    }
    return Promise.reject(error);
  }
);

export default API;