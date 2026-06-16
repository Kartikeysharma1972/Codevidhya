import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { AnimatePresence } from 'framer-motion';

import PortalSessionNotice from './components/PortalSessionNotice';
import Dashboard from './pages/Dashboard';
import Alerts from './pages/Alerts';
import Teachers from './pages/Teachers';
import TeacherDetail from './pages/TeacherDetail';
import Students from './pages/Students';
import StudentDetail from './pages/StudentDetail';
import ChatMonitor from './pages/ChatMonitor';
import Analytics from './pages/Analytics';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Layout from './components/Layout';

function ProtectedRoute({ children }) {
  const { admin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          <p className="text-gray-500 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!admin) {
    // No sub-app login any more — auth comes from the Codevidhya portal handoff.
    return <PortalSessionNotice app="School Admin" />;
  }

  return children;
}

export default function App() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="teachers" element={<Teachers />} />
          <Route path="teachers/:id" element={<TeacherDetail />} />
          <Route path="students" element={<Students />} />
          <Route path="students/:id" element={<StudentDetail />} />
          <Route path="chats" element={<ChatMonitor />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}
