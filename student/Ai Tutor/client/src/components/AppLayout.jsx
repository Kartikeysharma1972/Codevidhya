import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiMenu, FiX, FiHome, FiBookOpen, FiFileText, FiLayers, FiAward,
  FiChevronDown, FiLogOut, FiTrash2, FiPlus, FiClock, FiZap,
} from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { sessionAPI } from '../utils/api';
import { LANGUAGES, labelFor } from '../utils/languages';
import toast from 'react-hot-toast';

const toolNav = [
  { path: '/dashboard', icon: FiHome, label: 'Dashboard' },
  { path: '/concept-explainer', icon: FiBookOpen, label: 'Concept Explainer', tool: 'concept-explainer' },
  { path: '/document-summarizer', icon: FiFileText, label: 'Document Summarizer', tool: 'document-summarizer' },
  { path: '/project-generator', icon: FiLayers, label: 'Project Ideas Generator', tool: 'project-generator' },
  { path: '/exam-prep', icon: FiAward, label: 'Exam Preparation', tool: 'exam-prep' },
];

function BrandMark() {
  return (
    <Link to="/dashboard" className="flex items-center gap-2.5 group">
      <span className="grid place-items-center w-9 h-9 rounded-xl bg-gradient-to-br from-primary-300 to-primary-500 text-white shadow-sm">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" fill="currentColor" />
          <circle cx="19" cy="19" r="2" fill="currentColor" opacity="0.9" />
        </svg>
      </span>
      <span className="leading-tight">
        <span className="block font-display font-extrabold text-[15.5px] text-gray-900">AI Tutor</span>
        <span className="block text-[10px] text-gray-400 -mt-0.5">by CodeVidhya</span>
      </span>
    </Link>
  );
}

export default function AppLayout({ children, activeTool }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [gradeModalOpen, setGradeModalOpen] = useState(false);
  const [langModalOpen, setLangModalOpen] = useState(false);
  const [sessions, setSessions] = useState([]);
  const { user, logout, updateGrade, updateLanguage } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (activeTool) {
      sessionAPI.list(activeTool).then(res => setSessions(res.data.sessions)).catch(() => {});
    } else {
      sessionAPI.list().then(res => setSessions(res.data.sessions)).catch(() => {});
    }
  }, [activeTool, location.pathname]);

  const handleDeleteSession = async (id, e) => {
    e.stopPropagation();
    try {
      await sessionAPI.delete(id);
      setSessions(s => s.filter(sess => sess._id !== id));
      toast.success('Session deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const handleGradeChange = async (newGrade) => {
    try {
      await updateGrade(newGrade);
      setGradeModalOpen(false);
      toast.success(`Grade updated to Class ${newGrade}`);
    } catch { toast.error('Failed to update grade'); }
  };

  const handleLanguageChange = async (newLang) => {
    try {
      await updateLanguage(newLang);
      setLangModalOpen(false);
      toast.success(`Responses will now be in ${labelFor(newLang)}`);
    } catch { toast.error('Failed to update language'); }
  };

  return (
    <div className="app-shell flex h-screen app-bg">
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="w-[268px] bg-white/95 backdrop-blur-md border-r border-gray-100 flex flex-col fixed lg:relative h-full z-40"
          >
            <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-between">
              <BrandMark />
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg lg:hidden text-gray-400"
                aria-label="Close sidebar"
              >
                <FiX />
              </button>
            </div>

            {/* Plan badge */}
            <div className="px-3 pt-3">
              <div className="brand-ribbon rounded-xl px-3 py-2 flex items-center gap-2">
                <FiZap className="text-primary-500 flex-shrink-0" size={14} />
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-primary-700 leading-tight">Class {user?.grade} Plan</p>
                  <p className="text-[10.5px] text-primary-600/70 leading-tight">Grade-adaptive AI</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="px-3 pt-3 pb-1 space-y-0.5">
              <p className="px-3 mb-1.5 text-[10.5px] font-bold text-gray-400 uppercase tracking-[0.12em]">Workspace</p>
              {toolNav.map(item => {
                const active = location.pathname.startsWith(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-[13.5px] transition-all ${
                      active
                        ? 'bg-primary-50 text-primary-700 font-semibold shadow-[inset_0_0_0_1px_rgba(91,164,207,0.18)]'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <item.icon className="text-base flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                    {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary-500" />}
                  </Link>
                );
              })}
            </nav>

            {/* Session History */}
            <div className="flex-1 overflow-hidden flex flex-col border-t border-gray-100 mt-3">
              <div className="px-3 pt-3 pb-2 flex items-center justify-between">
                <span className="text-[10.5px] font-bold text-gray-400 uppercase tracking-[0.12em]">Recent</span>
                {activeTool && (
                  <button
                    onClick={() => navigate(`/${activeTool}`)}
                    className="p-1 hover:bg-primary-50 rounded-lg text-gray-400 hover:text-primary-600 transition-colors"
                    title="New session"
                  >
                    <FiPlus size={14} />
                  </button>
                )}
              </div>
              <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-0.5 scroll-fade-top">
                {sessions.length === 0 && (
                  <div className="text-center py-6 px-3">
                    <p className="text-[12px] text-gray-400">No sessions yet</p>
                    <p className="text-[10.5px] text-gray-300 mt-0.5">Start a chat to see history here</p>
                  </div>
                )}
                {sessions.map(s => (
                  <div
                    key={s._id}
                    onClick={() => navigate(`/${s.tool}/${s._id}`)}
                    className="group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[13px] text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FiClock className="text-gray-300 flex-shrink-0" size={11} />
                      <span className="truncate">{s.title}</span>
                    </div>
                    <button
                      onClick={(e) => handleDeleteSession(s._id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-opacity"
                      aria-label="Delete session"
                    >
                      <FiTrash2 size={11} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-14 bg-white/85 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-4 flex-shrink-0 sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
              aria-label="Toggle sidebar"
            >
              <FiMenu />
            </button>
            <div className="hidden lg:block w-px h-5 bg-gray-200" />
            <div className="hidden lg:flex items-center gap-2">
              <span className="text-[12px] text-gray-400">Welcome,</span>
              <span className="text-[13.5px] font-semibold text-gray-700">{user?.name?.split(' ')[0]}</span>
            </div>
          </div>

          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 px-2 py-1 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-300 to-primary-500 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div className="text-sm text-left hidden sm:block leading-tight pr-1">
                <div className="font-semibold text-gray-800 text-[13px]">{user?.name}</div>
                <div className="text-[11px] text-gray-400">Class {user?.grade}</div>
              </div>
              <FiChevronDown className="text-gray-400" size={14} />
            </button>

            {profileOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-12 w-64 bg-white rounded-2xl shadow-[0_20px_50px_-15px_rgba(15,23,42,0.18)] border border-gray-100 overflow-hidden z-50"
                >
                  <div className="px-4 py-3 bg-gradient-to-br from-primary-50/70 to-white border-b border-gray-100">
                    <div className="font-display font-bold text-gray-900 text-[14.5px]">{user?.name}</div>
                    <div className="text-[11.5px] text-gray-500 mt-0.5 truncate">{user?.email}</div>
                  </div>
                  <button
                    onClick={() => { setProfileOpen(false); setGradeModalOpen(true); }}
                    className="w-full px-4 py-2.5 text-left text-[13px] text-gray-600 hover:bg-gray-50 flex items-center justify-between"
                  >
                    <span>Change Grade</span>
                    <span className="text-[10.5px] text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full font-semibold">Class {user?.grade}</span>
                  </button>
                  <button
                    onClick={() => { setProfileOpen(false); setLangModalOpen(true); }}
                    className="w-full px-4 py-2.5 text-left text-[13px] text-gray-600 hover:bg-gray-50 flex items-center justify-between"
                  >
                    <span>Response Language</span>
                    <span className="text-[10.5px] text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full font-semibold">{labelFor(user?.language)}</span>
                  </button>
                  <div className="border-t border-gray-100" />
                  <button
                    onClick={() => { logout(); navigate('/'); }}
                    className="w-full px-4 py-2.5 text-left text-[13px] text-red-500 hover:bg-red-50 flex items-center gap-2"
                  >
                    <FiLogOut size={14} /> Logout
                  </button>
                </motion.div>
              </>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Grade Change Modal */}
      <AnimatePresence>
        {gradeModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setGradeModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-3xl p-7 w-full max-w-md shadow-[0_30px_80px_-20px_rgba(15,23,42,0.25)]"
            >
              <h3 className="font-display font-extrabold text-xl text-gray-900 mb-1">Change Your Class</h3>
              <p className="text-[13px] text-gray-500 mb-5">All responses will recalibrate to the new grade.</p>
              <div className="grid grid-cols-3 gap-2.5">
                {/* DEMO MODE: only classes 2, 6 and 10. Restore with Array.from({ length: 12 }, (_, i) => i + 1) */}
                {[2, 6, 10].map(g => (
                  <button
                    key={g}
                    onClick={() => handleGradeChange(g)}
                    className={`py-3 rounded-xl text-sm font-bold transition-all ${
                      user?.grade === g
                        ? 'bg-gradient-to-br from-primary-400 to-primary-600 text-white shadow-[0_8px_20px_-8px_rgba(46,134,193,0.55)]'
                        : 'bg-gray-50 text-gray-600 hover:bg-primary-50 hover:text-primary-600'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setGradeModalOpen(false)}
                className="w-full mt-5 py-2 text-gray-400 text-sm hover:text-gray-600 font-medium"
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Response Language Modal */}
      <AnimatePresence>
        {langModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setLangModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-3xl p-7 w-full max-w-md shadow-[0_30px_80px_-20px_rgba(15,23,42,0.25)]"
            >
              <h3 className="font-display font-extrabold text-xl text-gray-900 mb-1">Response Language</h3>
              <p className="text-[13px] text-gray-500 mb-5">
                The AI will explain in this language. Formulas, code, and technical terms stay in English so exam prep isn't affected.
              </p>
              <div className="grid grid-cols-2 gap-2.5 max-h-[320px] overflow-y-auto pr-1">
                {LANGUAGES.map(l => (
                  <button
                    key={l.value}
                    onClick={() => handleLanguageChange(l.value)}
                    className={`py-2.5 px-3 rounded-xl text-[13px] font-semibold transition-all text-left ${
                      (user?.language || 'English') === l.value
                        ? 'bg-gradient-to-br from-primary-400 to-primary-600 text-white shadow-[0_8px_20px_-8px_rgba(46,134,193,0.55)]'
                        : 'bg-gray-50 text-gray-600 hover:bg-primary-50 hover:text-primary-600'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setLangModalOpen(false)}
                className="w-full mt-5 py-2 text-gray-400 text-sm hover:text-gray-600 font-medium"
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
