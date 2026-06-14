import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Sidebar } from './components/Sidebar';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Students } from './pages/Students';
import { Reports } from './pages/Reports';
import { Risks } from './pages/Risks';
import { ClassAccess } from './pages/ClassAccess';
import { Settings } from './pages/Settings';
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
          <Route path="/risks" element={<Risks />} />
          <Route path="/permissions" element={<ClassAccess />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/recommendations" element={<Placeholder title="Tavsiyalar" />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/help" element={<Placeholder title="Yordam" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <HashRouter>
          <AppContent />
        </HashRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
