import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import './index.css';

// Codevidhya portal SSO handoff — if portal sent a token via ?cv_handoff=…,
// drop it into the storage keys this app expects and force the dashboard route.
(function consumeCvHandoff() {
  try {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get('cv_handoff');
    if (!raw) return;
    const payload = JSON.parse(decodeURIComponent(escape(atob(decodeURIComponent(raw)))));
    if (payload && payload.token && payload.user) {
      localStorage.setItem('token', payload.token);
      localStorage.setItem('user', JSON.stringify(payload.user));
    }
    params.delete('cv_handoff');
    const qs = params.toString();
    // Always send the user straight to the dashboard, regardless of where the portal pointed.
    window.history.replaceState({}, '', '/dashboard' + (qs ? `?${qs}` : '') + window.location.hash);
  } catch { /* ignore */ }
})();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" />
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
