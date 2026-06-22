import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiArrowRight, FiCheck, FiLock, FiMail, FiUser, FiBookOpen, FiHome,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import LogoMark from '../components/LogoMark';
import { useAuth, dashboardPathFor } from '../contexts/AuthContext';

const ROLES = [
  { value: 'student', label: 'Student' },
  { value: 'teacher', label: 'Teacher / Faculty' },
  { value: 'admin',   label: 'School Admin' },
];

const ordinal = (n) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

// All classes 1-12 are shown and selectable. Curated demo output covers 2/6/10.
const GRADES = Array.from({ length: 12 }, (_, i) => i + 1);

function passwordCheck(pw) {
  return {
    length:    pw.length >= 8,
    upper:     /[A-Z]/.test(pw),
    number:    /[0-9]/.test(pw),
  };
}

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [role, setRole] = useState('student');
  const [grade, setGrade] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const { signup } = useAuth();
  const navigate = useNavigate();

  const pwState = useMemo(() => passwordCheck(password), [password]);
  const pwOk = pwState.length && pwState.upper && pwState.number;

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !schoolName.trim()) {
      return toast.error('Please fill in all fields.');
    }
    if (role === 'student' && !grade) {
      return toast.error('Please select your grade.');
    }
    if (!pwOk) return toast.error('Password does not meet the rules.');
    if (password !== confirm) return toast.error('Passwords do not match.');

    setLoading(true);
    try {
      const u = await signup({
        name: name.trim(),
        email: email.trim(),
        schoolName: schoolName.trim(),
        role,
        grade: role === 'student' ? Number(grade) : undefined,
        password,
      });
      toast.success(`Welcome, ${u.name}!`);
      navigate(dashboardPathFor(u.role), { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not create your account.');
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

      <div className="relative w-full max-w-lg">
        <div className="flex justify-center mb-5">
          <LogoMark linkTo="/" />
        </div>

        <div className="bg-white/85 backdrop-blur-md border border-white/70 rounded-3xl p-7 shadow-soft">
          <h1 className="font-display font-extrabold text-2xl text-gray-900 text-center">
            Create your Codevidhya account
          </h1>
          <p className="text-[13px] text-gray-500 text-center mt-1">
            One login for AI Tutor, Classroom AI and the Admin Portal.
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <Field icon={<FiUser size={15} />} label="Full name">
              <input
                type="text" value={name} onChange={(e) => setName(e.target.value)} required
                placeholder="Your full name" className="cv-input"
              />
            </Field>

            <Field icon={<FiMail size={15} />} label="Email">
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                placeholder="you@school.com" className="cv-input"
              />
            </Field>

            <Field icon={<FiHome size={15} />} label="School name">
              <input
                type="text" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} required
                placeholder="e.g. Delhi Public School, Noida" className="cv-input"
              />
            </Field>

            <div>
              <label className="block text-[12.5px] font-semibold text-gray-700 mb-1.5">I am a…</label>
              <div className="grid grid-cols-3 gap-2">
                {ROLES.map((r) => (
                  <button
                    key={r.value} type="button" onClick={() => setRole(r.value)}
                    className={`py-2.5 rounded-xl text-[13px] font-semibold border transition-all ${
                      role === r.value
                        ? 'bg-primary-600 text-white border-primary-600 shadow-[0_6px_18px_-6px_rgba(59,107,255,0.55)]'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300 hover:text-primary-600'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {role === 'student' && (
              <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className=""
              >
                <label className="block text-[12.5px] font-semibold text-gray-700 mb-1.5">
                  Grade <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FiBookOpen className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                  <select
                    value={grade} onChange={(e) => setGrade(e.target.value)} required
                    className="cv-input appearance-none cursor-pointer"
                  >
                    <option value="" disabled>Select your class</option>
                    {GRADES.map((g) => (
                      <option key={g} value={g}>
                        {ordinal(g)} Grade
                      </option>
                    ))}
                  </select>
                </div>
              </motion.div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Field icon={<FiLock size={15} />} label="Password">
                <input
                  type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                  placeholder="••••••••" className="cv-input"
                />
              </Field>
              <Field icon={<FiLock size={15} />} label="Confirm">
                <input
                  type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required
                  placeholder="••••••••" className="cv-input"
                />
              </Field>
            </div>

            <ul className="grid grid-cols-3 gap-2 text-[11.5px]">
              <PwRule ok={pwState.length} text="8+ characters" />
              <PwRule ok={pwState.upper}  text="1 uppercase" />
              <PwRule ok={pwState.number} text="1 number" />
            </ul>

            <button
              type="submit" disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-primary-600 to-fuchsia-600 hover:opacity-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_12px_28px_-12px_rgba(59,107,255,0.55)]"
            >
              {loading ? 'Creating account…' : <>Create account <FiArrowRight size={15} /></>}
            </button>
          </form>

          <p className="text-center text-[13px] text-gray-500 mt-6">
            Already have one?{' '}
            <Link to="/login" className="text-primary-700 font-semibold hover:underline">Sign in</Link>
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

function PwRule({ ok, text }) {
  return (
    <li className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border ${
      ok ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-gray-50 text-gray-500 border-gray-100'
    }`}>
      <FiCheck size={11} className={ok ? '' : 'opacity-40'} />
      <span>{text}</span>
    </li>
  );
}
