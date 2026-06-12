import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowRight, FiMail, FiLock, FiUser } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [grade, setGrade] = useState(null);
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) return toast.error('Passwords do not match');
    if (!grade) return toast.error('Please select your class');
    if (password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      await signup(name, email, password, grade);
      toast.success('Account created!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="landing-root min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50/60 via-white to-sky-50/40 px-4 py-10 relative overflow-hidden"
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-primary-200 rounded-full filter blur-[80px] opacity-30 animate-blob-1"></div>
        <div className="absolute bottom-10 right-10 w-72 h-72 bg-sky-200 rounded-full filter blur-[80px] opacity-40 animate-blob-2"></div>
      </div>

      <div className="relative w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2.5 mb-6 group">
          <span className="grid place-items-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary-300 to-primary-500 text-white shadow-sm">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" fill="currentColor" />
              <circle cx="19" cy="19" r="2" fill="currentColor" opacity="0.9" />
            </svg>
          </span>
          <span className="leading-tight">
            <span className="block font-display font-extrabold text-[17px] text-gray-900">AI Tutor</span>
            <span className="block text-[10px] text-gray-400 -mt-0.5">by CodeVidhya</span>
          </span>
        </Link>

        <div className="bg-white/80 backdrop-blur-md border border-white/60 rounded-3xl p-7 shadow-[0_30px_60px_-25px_rgba(15,23,42,0.18)]">
          <h2 className="font-display font-extrabold text-2xl text-gray-900 text-center">Create your account</h2>
          <p className="text-[13px] text-gray-500 text-center mt-1">Pick your class and we'll calibrate everything to it.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-[12.5px] font-semibold text-gray-700 mb-1.5">Full Name</label>
              <div className="relative">
                <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                <input
                  type="text" value={name} onChange={e => setName(e.target.value)} required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm bg-white"
                  placeholder="Your name"
                />
              </div>
            </div>
            <div>
              <label className="block text-[12.5px] font-semibold text-gray-700 mb-1.5">Email</label>
              <div className="relative">
                <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm bg-white"
                  placeholder="your@email.com"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[12.5px] font-semibold text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                  <input
                    type="password" value={password} onChange={e => setPassword(e.target.value)} required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm bg-white"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[12.5px] font-semibold text-gray-700 mb-1.5">Confirm</label>
                <div className="relative">
                  <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                  <input
                    type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm bg-white"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            {/* Grade Selector */}
            <div>
              <label className="block text-[12.5px] font-semibold text-gray-700 mb-2">Select Your Class</label>
              <div className="grid grid-cols-6 gap-2">
                {Array.from({ length: 12 }, (_, i) => i + 1).map(g => (
                  <button
                    key={g} type="button"
                    onClick={() => setGrade(g)}
                    className={`py-2.5 rounded-xl text-sm font-bold transition-all ${
                      grade === g
                        ? 'bg-gradient-to-br from-primary-400 to-primary-600 text-white shadow-[0_6px_18px_-6px_rgba(46,134,193,0.55)]'
                        : 'bg-gray-50 text-gray-600 hover:bg-primary-50 hover:text-primary-600'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full mt-1 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-bold hover:opacity-95 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_12px_28px_-12px_rgba(46,134,193,0.55)]"
            >
              {loading ? 'Creating account…' : <>Create account <FiArrowRight size={15} /></>}
            </button>
          </form>

          <p className="text-center text-[13px] text-gray-500 mt-6">
            Already have an account? <Link to="/login" className="text-primary-600 font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </motion.div>
  );
}
