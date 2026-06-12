import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { HiOutlineAcademicCap, HiOutlineEye, HiOutlineEyeSlash } from 'react-icons/hi2';

export default function Login() {
  const { login, setup } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [setupForm, setSetupForm] = useState({
    name: '',
    email: '',
    password: '',
    school: '',
    setupKey: '',
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(loginForm.email, loginForm.password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetup = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await setup(
        setupForm.name,
        setupForm.email,
        setupForm.password,
        setupForm.school,
        setupForm.setupKey
      );
      setSuccess('Admin account created! You can now login.');
      setTab('login');
      setLoginForm({ email: setupForm.email, password: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Setup failed. Check your setup key.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen mesh-gradient-dark flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/20">
            <HiOutlineAcademicCap className="w-9 h-9 text-white" />
          </div>
          <h1 className="font-display font-bold text-3xl text-white">Codevidhya</h1>
          <p className="text-primary-200 text-sm mt-1 font-medium">School Admin Portal</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl shadow-black/10 p-8">
          {/* Tab toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
            {['login', 'setup'].map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTab(t);
                  setError('');
                  setSuccess('');
                }}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-all duration-200 ${
                  tab === t
                    ? 'bg-white text-primary-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t === 'login' ? 'Login' : 'Setup'}
              </button>
            ))}
          </div>

          {/* Error / Success */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg"
              >
                {error}
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg"
              >
                {success}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Login form */}
          <AnimatePresence mode="wait">
            {tab === 'login' ? (
              <motion.form
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleLogin}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                  <input
                    type="email"
                    required
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    className="input-field"
                    placeholder="admin@school.edu"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      className="input-field pr-10"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <HiOutlineEyeSlash className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-3"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Sign In'
                  )}
                </button>
              </motion.form>
            ) : (
              <motion.form
                key="setup"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleSetup}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    required
                    value={setupForm.name}
                    onChange={(e) => setSetupForm({ ...setupForm, name: e.target.value })}
                    className="input-field"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                  <input
                    type="email"
                    required
                    value={setupForm.email}
                    onChange={(e) => setSetupForm({ ...setupForm, email: e.target.value })}
                    className="input-field"
                    placeholder="admin@school.edu"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={setupForm.password}
                    onChange={(e) => setSetupForm({ ...setupForm, password: e.target.value })}
                    className="input-field"
                    placeholder="Min 6 characters"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">School Name</label>
                  <input
                    type="text"
                    required
                    value={setupForm.school}
                    onChange={(e) => setSetupForm({ ...setupForm, school: e.target.value })}
                    className="input-field"
                    placeholder="Your school name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Setup Key</label>
                  <input
                    type="text"
                    required
                    value={setupForm.setupKey}
                    onChange={(e) => setSetupForm({ ...setupForm, setupKey: e.target.value })}
                    className="input-field"
                    placeholder="Provided by Codevidhya"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-3"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Create Admin Account'
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center text-primary-200/60 text-xs mt-6">
          Codevidhya School Admin Portal
        </p>
      </motion.div>
    </div>
  );
}
