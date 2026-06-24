import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AccessGate } from './pages/AccessGate';
import { Register } from './pages/Register';
import { GameTest } from './pages/GameTest';
import { ImpulseGame } from './pages/ImpulseGame';
import { ColorTest } from './pages/ColorTest';
import { LifeChoicesTest } from './pages/LifeChoicesTest';
import { Thanks } from './pages/Thanks';
import './App.css';

function AppContent() {
  const { student, loading, error } = useAuth();

  if (loading) {
    return <div className="page page--center">Yuklanmoqda...</div>;
  }

  if (error) {
    return (
      <div className="page page--center">
        <p>Avtorizatsiyada xatolik: {error}</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={student ? <Navigate to="/test" replace /> : <Register />} />
      <Route path="/test" element={student ? <GameTest /> : <Navigate to="/" replace />} />
      <Route
        path="/impulse-game"
        element={student ? <ImpulseGame /> : <Navigate to="/" replace />}
      />
      <Route
        path="/color-test"
        element={student ? <ColorTest /> : <Navigate to="/" replace />}
      />
      <Route
        path="/life-choices"
        element={student ? <LifeChoicesTest /> : <Navigate to="/" replace />}
      />
      <Route path="/thanks" element={<Thanks />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AccessGate>
      <AuthProvider>
        <HashRouter>
          <AppContent />
        </HashRouter>
      </AuthProvider>
    </AccessGate>
  );
}

export default App;
