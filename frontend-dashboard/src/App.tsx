import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Students } from './pages/Students';
import { Placeholder } from './pages/Placeholder';
import './App.css';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="login-page">Yuklanmoqda...</div>;
  }

  if (!user) {
    return (
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }

  return (
    <div className="app">
      <Sidebar />
      <main className="app__content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/students" element={<Students />} />
          <Route path="/risks" element={<Placeholder title="Risklar" />} />
          <Route path="/reports" element={<Placeholder title="Hisobotlar" />} />
          <Route path="/recommendations" element={<Placeholder title="Tavsiyalar" />} />
          <Route path="/settings" element={<Placeholder title="Sozlamalar" />} />
          <Route path="/help" element={<Placeholder title="Yordam" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <AppContent />
      </HashRouter>
    </AuthProvider>
  );
}

export default App;
