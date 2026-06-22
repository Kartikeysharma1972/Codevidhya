import { Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Login from './pages/Login';
import Signup from './pages/Signup';
import EmbeddedApp from './pages/EmbeddedApp';
import { useAuth, dashboardPathFor } from './contexts/AuthContext';

function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to={dashboardPathFor(user.role)} replace />;
  return children;
}

export default function App() {
  return (
    <AnimatePresence mode="wait">
      <Routes>
        <Route path="/" element={<Navigate to="/signup" replace />} />
        <Route path="/login"  element={<PublicOnly><Login /></PublicOnly>} />
        <Route path="/signup" element={<PublicOnly><Signup /></PublicOnly>} />
        <Route path="/student" element={<EmbeddedApp expected="student" />} />
        <Route path="/teacher" element={<EmbeddedApp expected="teacher" />} />
        <Route path="/admin"   element={<EmbeddedApp expected="admin"   />} />
        <Route path="*" element={<Navigate to="/signup" replace />} />
      </Routes>
    </AnimatePresence>
  );
}
