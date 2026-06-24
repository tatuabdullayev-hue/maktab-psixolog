import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { api, setAuthToken } from '../api/client';

interface PsychologistUser {
  id: string;
  fullName: string;
  role: string;
  schoolName?: string;
  district?: string;
}

interface AuthContextValue {
  user: PsychologistUser | null;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: PsychologistUser) => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  error: null,
  login: async () => {},
  logout: () => {},
  updateUser: () => {},
});

const STORAGE_KEY = 'psixolog_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PsychologistUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const storedUser = localStorage.getItem(STORAGE_KEY);
    if (token && storedUser) {
      try {
        setAuthToken(token);
        setUser(JSON.parse(storedUser));
      } catch {
        setAuthToken(null);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    setError(null);
    try {
      const { data } = await api.post('/auth/login', { username, password });
      setAuthToken(data.accessToken);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user));
      setUser(data.user);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Login yoki parol noto\'g\'ri');
      throw e;
    }
  };

  const logout = () => {
    setAuthToken(null);
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  const updateUser = (updated: PsychologistUser) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setUser(updated);
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
