import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import {
  FiBookOpen, FiFileText, FiLayers, FiAward, FiArrowRight, FiTrendingUp,
  FiClock, FiTarget, FiZap, FiActivity, FiBarChart2, FiStar,
} from 'react-icons/fi';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../contexts/AuthContext';
import { sessionAPI } from '../utils/api';

const tools = [
  {
    path: '/concept-explainer',
    icon: FiBookOpen,
    title: 'Concept Explainer',
    desc: 'Ask any CBSE question. Upload images, PDFs, or use voice — get clear, grade-adaptive explanations.',
    iconBg: 'from-sky-400 to-sky-600',
    glow: 'rgba(56,189,248,0.35)',
    chipBg: 'bg-sky-50 text-sky-700 border-sky-100',
    tag: 'Most used',
  },
  {
    path: '/document-summarizer',
    icon: FiFileText,
    title: 'Document Summarizer',
    desc: 'Drop a PDF, image, or paste text. Get full summaries, key points, or ask a specific question.',
    iconBg: 'from-emerald-400 to-emerald-600',
    glow: 'rgba(16,185,129,0.35)',
    chipBg: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    tag: 'PDF / Image',
  },
  {
    path: '/project-generator',
    icon: FiLayers,
    title: 'Project Ideas Generator',
    desc: 'Fresh, CBSE-aligned project ideas with materials, build steps, effort level, and time estimate.',
    iconBg: 'from-violet-400 to-violet-600',
    glow: 'rgba(139,92,246,0.35)',
    chipBg: 'bg-violet-50 text-violet-700 border-violet-100',
    tag: 'Always fresh',
  },
  {
    path: '/exam-prep',
    icon: FiAward,
    title: 'Exam Preparation',
    desc: 'Timed mock tests with deep analytics, plus Focus Area deep-study packs for any topic.',
    iconBg: 'from-amber-400 to-amber-600',
    glow: 'rgba(245,158,11,0.35)',
    chipBg: 'bg-amber-50 text-amber-700 border-amber-100',
    tag: 'Mock + Focus',
  },
];

const toolMeta = {
  'concept-explainer': { icon: FiBookOpen, color: 'text-sky-500', bg: 'bg-sky-50', label: 'Concept Explainer' },
  'document-summarizer': { icon: FiFileText, color: 'text-emerald-500', bg: 'bg-emerald-50', label: 'Summarizer' },
  'project-generator': { icon: FiLayers, color: 'text-violet-500', bg: 'bg-violet-50', label: 'Project Ideas' },
  'exam-prep': { icon: FiAward, color: 'text-amber-500', bg: 'bg-amber-50', label: 'Exam Prep' },
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function relativeTime(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function accuracyColor(a) {
  if (a >= 80) return { text: 'text-emerald-600', bar: 'from-emerald-400 to-emerald-500', soft: 'bg-emerald-50' };
  if (a >= 60) return { text: 'text-sky-600', bar: 'from-sky-400 to-sky-500', soft: 'bg-sky-50' };
  if (a >= 40) return { text: 'text-amber-600', bar: 'from-amber-400 to-amber-500', soft: 'bg-amber-50' };
  return { text: 'text-rose-600', bar: 'from-rose-400 to-rose-500', soft: 'bg-rose-50' };
}

// Circular progress ring for the hero's average-accuracy badge.
function AccuracyRing({ value }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="relative grid place-items-center w-[86px] h-[86px]">
      <svg width="86" height="86" className="-rotate-90">
        <circle cx="43" cy="43" r={r} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="7" />
        <motion.circle
          cx="43" cy="43" r={r} fill="none" stroke="white" strokeWidth="7" strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.1, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute text-center text-white">
        <div className="font-display font-extrabold text-xl leading-none">
          <CountUp end={value} duration={1.1} />%
        </div>
        <div className="text-[9px] uppercase tracking-wider opacity-80 mt-0.5">Accuracy</div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, value, suffix, label, sub, tint, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="surface p-4 md:p-5 relative overflow-hidden"
    >
      <div className={`absolute -top-6 -right-6 w-20 h-20 rounded-full ${tint.blob} blur-2xl opacity-60`} />
      <div className="relative">
        <div className={`w-10 h-10 rounded-xl grid place-items-center ${tint.bg} ${tint.color} mb-3`}>
          <Icon size={18} />
        </div>
        <div className="font-display font-extrabold text-[26px] text-gray-900 leading-none">
          <CountUp end={value} duration={1.2} />{suffix}
        </div>
        <div className="text-[12.5px] font-semibold text-gray-700 mt-1.5">{label}</div>
        <div className="text-[11px] text-gray-400 mt-0.5">{sub}</div>
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const firstName = user?.name?.split(' ')[0] || 'there';

  const [tests, setTests] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.allSettled([sessionAPI.testHistory(), sessionAPI.list()])
      .then(([t, s]) => {
        if (t.status === 'fulfilled') setTests(t.value.data.tests || []);
        if (s.status === 'fulfilled') setSessions(s.value.data.sessions || []);
      })
      .finally(() => setLoaded(true));
  }, []);

  const stats = useMemo(() => {
    const count = tests.length;
    const avg = count ? Math.round(tests.reduce((a, t) => a + (t.accuracy || 0), 0) / count) : 0;
    const best = count ? Math.max(...tests.map(t => t.accuracy || 0)) : 0;
    return { count, avg, best, sessions: sessions.length };
  }, [tests, sessions]);

  const recentTests = tests.slice(0, 4);
  const recentSessions = sessions.slice(0, 5);

  return (
    <AppLayout>
      <div className="p-5 md:p-8 max-w-6xl mx-auto">
        {/* ───── Hero ───── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative overflow-hidden rounded-3xl p-6 md:p-8 mb-6 text-white shadow-[0_24px_60px_-24px_rgba(46,134,193,0.6)] bg-gradient-to-br from-primary-500 via-primary-600 to-sky-700"
        >
          <div className="sparkle-pattern absolute inset-0 pointer-events-none" />
          <div className="absolute -top-10 -right-8 w-52 h-52 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-12 left-1/3 w-52 h-52 rounded-full bg-sky-300/20 blur-3xl" />

          <div className="relative flex items-center justify-between gap-6 flex-wrap">
            <div className="min-w-0">
              <p className="text-[11.5px] font-bold uppercase tracking-[0.16em] text-white/75 mb-1.5">
                {greeting()}
              </p>
              <h1 className="font-display font-extrabold text-2xl md:text-[30px] leading-tight">
                Hey {firstName} <span className="inline-block">👋</span>
              </h1>
              <p className="mt-2 text-[14px] text-white/85 max-w-lg">
                Your AI study companion is tuned to <span className="font-bold text-white">Class {user?.grade}</span>.
                {stats.count > 0
                  ? ` You've taken ${stats.count} test${stats.count === 1 ? '' : 's'} so far — keep the streak going.`
                  : ' Pick a tool below and start learning.'}
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-2.5">
                <Link
                  to="/exam-prep"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-primary-700 font-bold text-[13.5px] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
                >
                  <FiAward size={15} /> Take a Mock Test
                </Link>
                <Link
                  to="/concept-explainer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 backdrop-blur-sm text-white font-semibold text-[13.5px] border border-white/25 hover:bg-white/25 transition-colors"
                >
                  <FiBookOpen size={15} /> Explain a Concept
                </Link>
              </div>
            </div>

            {/* Right badge: accuracy ring if they've tested, else online pill */}
            <div className="flex-shrink-0">
              {stats.count > 0 ? (
                <div className="glass-card !bg-white/10 !border-white/20 px-5 py-4 flex items-center gap-4">
                  <AccuracyRing value={stats.avg} />
                  <div className="leading-tight">
                    <p className="text-[11px] uppercase tracking-wider text-white/70 font-semibold">Average</p>
                    <p className="font-display font-extrabold text-lg">across {stats.count} tests</p>
                    <p className="text-[12px] text-white/75 mt-0.5 flex items-center gap-1">
                      <FiStar size={11} className="text-amber-300" /> Best {stats.best}%
                    </p>
                  </div>
                </div>
              ) : (
                <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/15 backdrop-blur-sm border border-white/25 text-[12px] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" /> All systems online
                </span>
              )}
            </div>
          </div>
        </motion.div>

        {/* ───── Stats row ───── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 md:gap-4 mb-8">
          <StatCard
            icon={FiActivity} value={stats.count} suffix="" label="Tests Taken"
            sub={stats.count ? 'Across all subjects' : 'Take your first test'}
            tint={{ bg: 'bg-sky-50', color: 'text-sky-600', blob: 'bg-sky-200/60' }} delay={0.05}
          />
          <StatCard
            icon={FiTarget} value={stats.avg} suffix="%" label="Avg. Accuracy"
            sub={stats.avg >= 75 ? 'Excellent work!' : stats.count ? 'Keep practising' : 'No data yet'}
            tint={{ bg: 'bg-emerald-50', color: 'text-emerald-600', blob: 'bg-emerald-200/60' }} delay={0.1}
          />
          <StatCard
            icon={FiTrendingUp} value={stats.best} suffix="%" label="Best Score"
            sub={stats.best ? 'Your personal best' : 'Yet to be set'}
            tint={{ bg: 'bg-amber-50', color: 'text-amber-600', blob: 'bg-amber-200/60' }} delay={0.15}
          />
          <StatCard
            icon={FiZap} value={stats.sessions} suffix="" label="Study Sessions"
            sub={stats.sessions ? 'Chats & deep-study' : 'Start a session'}
            tint={{ bg: 'bg-violet-50', color: 'text-violet-600', blob: 'bg-violet-200/60' }} delay={0.2}
          />
        </div>

        {/* ───── Tools ───── */}
        <div className="mb-4 flex items-center gap-2">
          <h2 className="font-display font-bold text-[15px] text-gray-900 uppercase tracking-[0.12em]">
            <span className="text-gray-400">Your</span> Tools
          </h2>
          <div className="flex-1 h-px bg-gray-100" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {tools.map((tool, i) => (
            <motion.div
              key={tool.path}
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.06, duration: 0.4 }}
            >
              <Link
                to={tool.path}
                className="surface card-glow block p-5 md:p-6 group relative overflow-hidden"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${tool.iconBg} text-white grid place-items-center shadow-lg`}>
                    <tool.icon className="text-xl" />
                  </div>
                  <span className={`text-[10.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${tool.chipBg}`}>
                    {tool.tag}
                  </span>
                </div>
                <h3 className="mt-4 font-display font-bold text-lg text-gray-900 leading-tight">{tool.title}</h3>
                <p className="mt-1.5 text-[13.5px] text-gray-500 leading-relaxed">{tool.desc}</p>
                <div className="mt-4 flex items-center gap-1.5 text-primary-600 text-[13px] font-semibold group-hover:gap-2.5 transition-all">
                  Open tool <FiArrowRight size={14} />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* ───── Recent activity ───── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-8">
          {/* Recent tests */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4 }}
            className="surface p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-bold text-[14.5px] text-gray-900 flex items-center gap-2">
                <FiBarChart2 className="text-primary-500" size={16} /> Recent Test Results
              </h3>
              <Link to="/exam-prep" className="text-[12px] font-semibold text-primary-600 hover:text-primary-700">New test</Link>
            </div>

            {loaded && recentTests.length === 0 && (
              <div className="text-center py-8">
                <div className="w-11 h-11 mx-auto rounded-2xl bg-primary-50 text-primary-500 grid place-items-center mb-2">
                  <FiAward size={18} />
                </div>
                <p className="text-[13px] text-gray-500 font-medium">No tests yet</p>
                <p className="text-[11.5px] text-gray-400 mt-0.5">Take a mock test to see your scores here.</p>
              </div>
            )}

            <div className="space-y-2">
              {recentTests.map((t, i) => {
                const c = accuracyColor(t.accuracy || 0);
                return (
                  <motion.button
                    key={t._id}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.32 + i * 0.05 }}
                    onClick={() => navigate(`/test-result/${t._id}`)}
                    className="w-full text-left p-3 rounded-xl border border-gray-100 hover:border-primary-200 hover:bg-gray-50/60 transition-all group"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-gray-800 truncate">{t.subject}</p>
                        <p className="text-[11px] text-gray-400">
                          {t.score}/{t.totalQuestions} correct · {relativeTime(t.createdAt)}
                        </p>
                      </div>
                      <div className={`text-[15px] font-display font-extrabold ${c.text} flex-shrink-0`}>{t.accuracy}%</div>
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div className={`h-full rounded-full bg-gradient-to-r ${c.bar}`} style={{ width: `${t.accuracy}%` }} />
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          {/* Recent sessions */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.4 }}
            className="surface p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-bold text-[14.5px] text-gray-900 flex items-center gap-2">
                <FiClock className="text-primary-500" size={16} /> Pick Up Where You Left Off
              </h3>
            </div>

            {loaded && recentSessions.length === 0 && (
              <div className="text-center py-8">
                <div className="w-11 h-11 mx-auto rounded-2xl bg-primary-50 text-primary-500 grid place-items-center mb-2">
                  <FiBookOpen size={18} />
                </div>
                <p className="text-[13px] text-gray-500 font-medium">No sessions yet</p>
                <p className="text-[11.5px] text-gray-400 mt-0.5">Your chats and study packs appear here.</p>
              </div>
            )}

            <div className="space-y-1.5">
              {recentSessions.map((s, i) => {
                const meta = toolMeta[s.tool] || { icon: FiActivity, color: 'text-gray-500', bg: 'bg-gray-50', label: s.tool };
                const Icon = meta.icon;
                return (
                  <motion.button
                    key={s._id}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.37 + i * 0.05 }}
                    onClick={() => navigate(`/${s.tool}/${s._id}`)}
                    className="w-full text-left flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors group"
                  >
                    <div className={`w-9 h-9 rounded-xl grid place-items-center flex-shrink-0 ${meta.bg} ${meta.color}`}>
                      <Icon size={15} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-gray-800 truncate">{s.title}</p>
                      <p className="text-[11px] text-gray-400">{meta.label} · {relativeTime(s.updatedAt)}</p>
                    </div>
                    <FiArrowRight className="text-gray-300 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" size={14} />
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
}
