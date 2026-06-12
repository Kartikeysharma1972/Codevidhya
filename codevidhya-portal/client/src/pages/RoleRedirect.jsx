import { useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, dashboardPathFor } from '../contexts/AuthContext';

// Where each role-app is hosted. In dev these fall back to the local Vite ports.
// In production set VITE_STUDENT_URL / VITE_TEACHER_URL / VITE_ADMIN_URL at build time
// (Render env vars on the portal service) to the deployed sub-app URLs.
const TARGETS = {
  student: import.meta.env.VITE_STUDENT_URL || 'http://localhost:5173',
  teacher: import.meta.env.VITE_TEACHER_URL || 'http://localhost:5176',
  admin:   import.meta.env.VITE_ADMIN_URL   || 'http://localhost:5177',
};

function b64(obj) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(obj))));
}

export default function RoleRedirect({ expected }) {
  const { user, loading } = useAuth();
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    if (loading || !user) return;
    if (user.role !== expected) return;
    firedRef.current = true;

    let base = TARGETS[expected];

    let handoff = null;
    try {
      const raw = sessionStorage.getItem('cv_handoff');
      if (raw) {
        handoff = JSON.parse(raw);
        sessionStorage.removeItem('cv_handoff');
      }
    } catch { /* ignore */ }

    if (handoff && handoff.token) {
      const payload = { role: expected, token: handoff.token, user: handoff.user };
      const sep = base.includes('?') ? '&' : '?';
      base = `${base}${sep}cv_handoff=${encodeURIComponent(b64(payload))}`;
    }

    window.location.href = base;
  }, [user, loading, expected]);

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== expected) return <Navigate to={dashboardPathFor(user.role)} replace />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-pink-50">
      <div className="text-center">
        <div className="w-12 h-12 mx-auto border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        <p className="mt-4 text-gray-600 font-medium">Taking you to your {expected} dashboard…</p>
      </div>
    </div>
  );
}
