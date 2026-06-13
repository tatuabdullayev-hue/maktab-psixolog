import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { api, setAuthToken } from '../api/client';

interface Student {
  id: string;
  firstName: string;
  lastName?: string;
  className?: string;
  age?: number;
  schoolName?: string;
  currentRiskScore: number;
}

export interface RegisterStudentData {
  firstName: string;
  lastName: string;
  className: string;
  age?: number;
  schoolName?: string;
  district?: string;
}

interface AuthContextValue {
  student: Student | null;
  loading: boolean;
  error: string | null;
  registerWeb: (data: RegisterStudentData) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  student: null,
  loading: true,
  error: null,
  registerWeb: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function restore() {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get('/students/me');
        setStudent(data);
      } catch {
        setAuthToken(null);
      } finally {
        setLoading(false);
      }
    }
    restore();
  }, []);

  const registerWeb = async (formData: RegisterStudentData) => {
    setError(null);
    try {
      const { data } = await api.post('/auth/register', formData);
      setAuthToken(data.accessToken);
      setStudent(data.student);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Ro'yxatdan o'tishda xatolik");
      throw e;
    }
  };

  const logout = () => {
    setAuthToken(null);
    setStudent(null);
  };

  return (
    <AuthContext.Provider value={{ student, loading, error, registerWeb, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
