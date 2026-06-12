import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowRight, FiLock, FiMail } from 'react-icons/fi';
import toast from 'react-hot-toast';
import LogoMark from '../components/LogoMark';
import { useAuth, dashboardPathFor } from '../contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) return toast.error('Please fill in both fields.');
    setLoading(true);
    try {
      const u = await login(email.trim(), password);
      toast.success(`Welcome back, ${u.name.split(' ')[0]}!`);
      navigate(dashboardPathFor(u.role), { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="min-h-screen flex items-center justify-center px-4 py-10 bg-gradient-to-br from-primary-50 via-white to-fuchsia-50 relative overflow-hidden"
    >
      <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-primary-200/40 blur-3xl" />
      <div className="absolute bottom-10 right-10 w-72 h-72 rounded-full bg-fuchsia-200/40 blur-3xl" />

      <div className="relative w-full max-w-md">
        <div className="flex justify-center mb-5">
          <LogoMark linkTo="/" />
        </div>

        <div className="bg-white/85 backdrop-blur-md border border-white/70 rounded-3xl p-7 shadow-soft">
          <h1 className="font-display font-extrabold text-2xl text-gray-900 text-center">Welcome back</h1>
          <p className="text-[13px] text-gray-500 text-center mt-1">
            We’ll take you straight to your dashboard.
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <Field icon={<FiMail size={15} />} label="Email">
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                placeholder="you@school.com" className="cv-input"
              />
            </Field>
            <Field icon={<FiLock size={15} />} label="Password">
              <input
                type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                placeholder="••••••••" className="cv-input"
              />
            </Field>

            <button
              type="submit" disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-primary-600 to-fuchsia-600 hover:opacity-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_12px_28px_-12px_rgba(59,107,255,0.55)]"
            >
              {loading ? 'Signing in…' : <>Sign in <FiArrowRight size={15} /></>}
            </button>
          </form>

          <p className="text-center text-[13px] text-gray-500 mt-6">
            New here?{' '}
            <Link to="/signup" className="text-primary-700 font-semibold hover:underline">Create an account</Link>
          </p>
        </div>
      </div>

      <style>{`
        .cv-input {
          width: 100%;
          padding: 10px 14px 10px 36px;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          background: #fff;
          font-size: 14px;
          outline: none;
          transition: border .15s ease, box-shadow .15s ease;
        }
        .cv-input:focus {
          border-color: #5B86FF;
          box-shadow: 0 0 0 4px rgba(91,134,255,0.15);
        }
      `}</style>
    </motion.div>
  );
}

function Field({ icon, label, children }) {
  return (
    <div>
      <label className="block text-[12.5px] font-semibold text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>
        {children}
      </div>
    </div>
  );
}
