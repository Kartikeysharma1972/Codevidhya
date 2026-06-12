import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { FiLogOut } from 'react-icons/fi';
import { useAuth, dashboardPathFor } from '../contexts/AuthContext';
import LogoMark from '../components/LogoMark';

// Where each role-app is hosted. In dev these fall back to the local Vite ports.
// In production set VITE_STUDENT_URL / VITE_TEACHER_URL / VITE_ADMIN_URL at build
// time on the portal Render service so the iframe loads the deployed sub-app.
const TARGETS = {
  student: import.meta.env.VITE_STUDENT_URL || 'http://localhost:5173',
  teacher: import.meta.env.VITE_TEACHER_URL || 'http://localhost:5176',
  admin:   import.meta.env.VITE_ADMIN_URL   || 'http://localhost:5177',
};

const ROLE_LABEL = {
  student: 'AI Tutor',
  teacher: 'Classroom AI',
  admin:   'School Admin',
};

function b64(obj) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(obj))));
}

export default function EmbeddedApp({ expected }) {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const computedRef = useRef(false);
  const [src, setSrc] = useState(null);

  // Compute the iframe URL once, on first render where user/handoff are ready.
  // Using a ref guard so React 18 StrictMode's double-effect doesn't burn the
  // single-use handoff token from sessionStorage.
  useEffect(() => {
    if (computedRef.current) return;
    if (loading || !user) return;
    if (user.role !== expected) return;
    computedRef.current = true;

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

    setSrc(base);
  }, [user, loading, expected]);

  const onLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const headerLabel = useMemo(() => ROLE_LABEL[expected] || expected, [expected]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== expected) return <Navigate to={dashboardPathFor(user.role)} replace />;

  return (
    <div className="fixed inset-0 flex flex-col bg-gray-50">
      <header className="flex items-center justify-between gap-4 h-12 px-4 bg-white border-b border-gray-100 shadow-[0_1px_0_rgba(15,23,42,0.04)] flex-shrink-0 z-10">
        <LogoMark linkTo={null} />
        <div className="hidden sm:flex items-center gap-2 text-[12.5px] text-gray-500">
          <span className="px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 font-semibold">
            {headerLabel}
          </span>
          <span className="text-gray-400">·</span>
          <span className="font-medium text-gray-700">{user.name}</span>
        </div>
        <button
          onClick={onLogout}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-semibold text-gray-600 hover:text-primary-700 hover:bg-primary-50 transition-colors"
        >
          <FiLogOut size={14} /> Logout
        </button>
      </header>

      {src ? (
        <iframe
          src={src}
          title={`${headerLabel} workspace`}
          className="flex-1 w-full border-0"
          allow="clipboard-read; clipboard-write; fullscreen; microphone; camera"
        />
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
