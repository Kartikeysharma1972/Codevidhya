import { Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import RoleRedirect from './pages/RoleRedirect';
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
        <Route path="/" element={<LandingPage />} />
        <Route path="/login"  element={<PublicOnly><Login /></PublicOnly>} />
        <Route path="/signup" element={<PublicOnly><Signup /></PublicOnly>} />
        <Route path="/student" element={<RoleRedirect expected="student" />} />
        <Route path="/teacher" element={<RoleRedirect expected="teacher" />} />
        <Route path="/admin"   element={<RoleRedirect expected="admin"   />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}
