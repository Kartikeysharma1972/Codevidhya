import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { FiLogOut, FiRefreshCw } from 'react-icons/fi';
import { useAuth, dashboardPathFor, readHandoff } from '../contexts/AuthContext';
import { authAPI } from '../utils/api';
import LogoMark from '../components/LogoMark';

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

function buildIframeUrl(role, handoff) {
  let base = TARGETS[role];
  if (handoff && handoff.token) {
    const payload = { role, token: handoff.token, user: handoff.user };
    const sep = base.includes('?') ? '&' : '?';
    base = `${base}${sep}cv_handoff=${encodeURIComponent(b64(payload))}`;
  }
  return base;
}

export default function EmbeddedApp({ expected }) {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const computedRef = useRef(false);
  const [src, setSrc] = useState(null);
  const [status, setStatus] = useState('booting'); // booting | ready | failed

  useEffect(() => {
    if (computedRef.current) return;
    if (loading || !user) return;
    if (user.role !== expected) return;
    computedRef.current = true;

    const handoff = readHandoff();
    if (handoff && handoff.token) {
      setSrc(buildIframeUrl(expected, handoff));
      setStatus('ready');
      return;
    }

    // No persisted handoff (cold-start during signup may have skipped it).
    // Politely show "warming up", then mount the iframe without a handoff so
    // the user can finish via the sub-app's own login as a last-resort.
    setStatus('warming');
    const fallback = setTimeout(() => {
      setSrc(buildIframeUrl(expected, null));
      setStatus('failed');
    }, 12000);
    return () => clearTimeout(fallback);
  }, [user, loading, expected]);

  const onRetry = async () => {
    setStatus('booting');
    try {
      // Re-fetch current portal session; if the server can re-mirror, /me will
      // include a fresh handoff (server-side persistence below).
      const res = await authAPI.me();
      if (res.data?.handoff?.token) {
        localStorage.setItem('cv_handoff_v2', JSON.stringify(res.data.handoff));
        setSrc(buildIframeUrl(expected, res.data.handoff));
        setStatus('ready');
        return;
      }
    } catch { /* ignore */ }
    setStatus('failed');
    setSrc(buildIframeUrl(expected, null));
  };

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
      <header className="flex items-center justify-between gap-4 h-12 px-4 bg-white border-b border-gray-100 flex-shrink-0 z-10">
        <LogoMark linkTo={null} />
        <div className="hidden sm:flex items-center gap-2 text-[12.5px] text-gray-500">
          <span className="px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 font-semibold">
            {headerLabel}
          </span>
          <span className="text-gray-400">·</span>
          <span className="font-medium text-gray-700">{user.name}</span>
        </div>
        <div className="flex items-center gap-2">
          {status === 'failed' && (
            <button
              onClick={onRetry}
              title="Retry auto-login"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors"
            >
              <FiRefreshCw size={13} /> Retry
            </button>
          )}
          <button
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-semibold text-gray-600 hover:text-primary-700 hover:bg-primary-50 transition-colors"
          >
            <FiLogOut size={14} /> Logout
          </button>
        </div>
      </header>

      {src ? (
        <iframe
          key={src}
          src={src}
          title={`${headerLabel} workspace`}
          className="flex-1 w-full border-0"
          allow="clipboard-read; clipboard-write; fullscreen; microphone; camera"
        />
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md px-6">
            <div className="w-12 h-12 mx-auto border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            <p className="mt-5 font-display font-bold text-gray-800">
              Setting up your {headerLabel} workspace…
            </p>
            <p className="mt-2 text-[13.5px] text-gray-500 leading-relaxed">
              First-time logins on the free tier take a few seconds while we
              wake the dashboard server. Stay here — we'll land you inside
              automatically.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
