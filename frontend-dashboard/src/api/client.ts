import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    localStorage.setItem('accessToken', token);
  } else {
    delete api.defaults.headers.common.Authorization;
    localStorage.removeItem('accessToken');
  }
}

const stored = localStorage.getItem('accessToken');
if (stored) {
  setAuthToken(stored);
}

let _redirectingToLogin = false;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !_redirectingToLogin) {
      _redirectingToLogin = true;
      setAuthToken(null);
      localStorage.removeItem('psixolog_user');
      // HashRouter ishlatilgani uchun hash'ni o'zgartiramiz (reload yo'q)
      window.location.hash = '#/';
      setTimeout(() => { _redirectingToLogin = false; }, 3000);
    }
    return Promise.reject(error);
  },
);
