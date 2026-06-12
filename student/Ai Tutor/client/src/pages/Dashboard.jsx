import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiBookOpen, FiFileText, FiLayers, FiAward, FiArrowRight, FiTrendingUp, FiClock, FiTarget,
} from 'react-icons/fi';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../contexts/AuthContext';

const tools = [
  {
    path: '/concept-explainer',
    icon: FiBookOpen,
    title: 'Concept Explainer',
    desc: 'Ask any CBSE question. Upload images, PDFs, or use voice — get clear, grade-adaptive explanations.',
    iconBg: 'from-sky-100 to-sky-200/70',
    iconColor: 'text-sky-600',
    chipBg: 'bg-sky-50 text-sky-700 border-sky-100',
    tag: 'Most used',
  },
  {
    path: '/document-summarizer',
    icon: FiFileText,
    title: 'Document Summarizer',
    desc: 'Drop a PDF, image, or paste text. Get full summaries, key points, or ask a specific question.',
    iconBg: 'from-emerald-100 to-emerald-200/70',
    iconColor: 'text-emerald-600',
    chipBg: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    tag: 'PDF / Image',
  },
  {
    path: '/project-generator',
    icon: FiLayers,
    title: 'Project Ideas Generator',
    desc: 'Distinct, CBSE-aligned project ideas with materials, build steps, effort level, and time estimate.',
    iconBg: 'from-violet-100 to-violet-200/70',
    iconColor: 'text-violet-600',
    chipBg: 'bg-violet-50 text-violet-700 border-violet-100',
    tag: 'Curated',
  },
  {
    path: '/exam-prep',
    icon: FiAward,
    title: 'Exam Preparation',
    desc: 'Timed mock tests with deep analytics, plus Focus Area deep-study packs for any topic.',
    iconBg: 'from-amber-100 to-amber-200/70',
    iconColor: 'text-amber-600',
    chipBg: 'bg-amber-50 text-amber-700 border-amber-100',
    tag: 'Mock + Focus',
  },
];

const tips = [
  { icon: FiTarget, label: 'Pick a subject + chapter in Concept Explainer for tightly scoped answers.' },
  { icon: FiClock, label: 'Mock tests adapt their length and difficulty to your class automatically.' },
  { icon: FiTrendingUp, label: 'Focus Area now accepts any topic — even one outside the selected chapter.' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-6xl mx-auto">
        {/* Hero band */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative overflow-hidden rounded-3xl p-6 md:p-8 mb-8 border border-primary-100 bg-gradient-to-br from-white via-primary-50/30 to-white"
        >
          <div className="absolute -top-8 -right-8 w-44 h-44 rounded-full bg-primary-200/40 blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-44 h-44 rounded-full bg-sky-200/40 blur-3xl" />
          <div className="relative flex items-start justify-between gap-6 flex-wrap">
            <div className="min-w-0">
              <p className="text-[11.5px] font-bold uppercase tracking-[0.14em] text-primary-500 mb-1.5">
                Welcome back
              </p>
              <h1 className="font-display font-extrabold text-2xl md:text-[28px] text-gray-900 leading-tight">
                Hey {firstName} — let's get learning.
              </h1>
              <p className="mt-2 text-[14px] text-gray-600 max-w-xl">
                Your AI study companion is calibrated to <span className="font-semibold text-primary-700">Class {user?.grade}</span>. Pick a tool to start.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-primary-100 text-[11.5px] font-semibold text-primary-700 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> All systems online
              </span>
            </div>
          </div>
        </motion.div>

        {/* Tools grid */}
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-display font-bold text-[15px] text-gray-900 uppercase tracking-[0.12em] text-opacity-80">
            <span className="text-gray-400">Your</span> Tools
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
          {tools.map((tool, i) => (
            <motion.div
              key={tool.path}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 + i * 0.06, duration: 0.4 }}
            >
              <Link
                to={tool.path}
                className="surface surface-hover block p-5 md:p-6 group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${tool.iconBg} ${tool.iconColor} grid place-items-center shadow-sm`}>
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

        {/* Tips strip */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="mt-10 grid md:grid-cols-3 gap-3"
        >
          {tips.map((t, i) => (
            <div key={i} className="surface px-4 py-3 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-primary-50 text-primary-600 grid place-items-center flex-shrink-0">
                <t.icon size={14} />
              </div>
              <p className="text-[12.5px] text-gray-600 leading-relaxed">{t.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </AppLayout>
  );
}
