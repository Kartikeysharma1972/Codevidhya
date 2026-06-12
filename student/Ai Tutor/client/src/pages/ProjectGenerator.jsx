import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiRefreshCw, FiLayers, FiCheck } from 'react-icons/fi';
import AppLayout from '../components/AppLayout';
import PageHeader from '../components/PageHeader';
import ChatMarkdown from '../components/ChatMarkdown';
import { useAuth } from '../contexts/AuthContext';
import { aiAPI, curriculumAPI } from '../utils/api';
import toast from 'react-hot-toast';

const projectTypes = [
  'Physical Model', 'Chart / Poster', 'Presentation (PPT)',
  'Website / App', 'Science Experiment', 'Research Report',
];

export default function ProjectGenerator() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [subject, setSubject] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [projectType, setProjectType] = useState('');
  const [topic, setTopic] = useState('');
  const [showCustomTopic, setShowCustomTopic] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const resultRef = useRef(null);

  useEffect(() => {
    if (user?.grade) {
      curriculumAPI.getSubjects(user.grade).then(res => setSubjects(res.data.subjects)).catch(() => {});
    }
  }, [user?.grade]);

  useEffect(() => {
    if (subject && user?.grade) {
      curriculumAPI.getChapters(user.grade, subject).then(res => setChapters(res.data.chapters)).catch(() => {});
      setSelectedChapter('');
    } else {
      setChapters([]);
    }
  }, [subject, user?.grade]);

  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [result]);

  const finalTopic = topic.trim() || selectedChapter || '';

  const handleGenerate = async () => {
    if (!subject) return toast.error('Please select a subject');
    setLoading(true);
    setResult('');
    try {
      const res = await aiAPI.projectIdeas({ subject, projectType, topic: finalTopic });
      setResult(res.data.response);
    } catch {
      toast.error('Failed to generate ideas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout activeTool="project-generator">
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        <PageHeader
          icon={FiLayers}
          eyebrow="Project Ideas Generator"
          title="Sharp project ideas, on demand."
          subtitle={`Class ${user?.grade} · We mix Easy / Medium / Hard and give you materials, steps, time estimate, and the CBSE connection.`}
        />

        <div className="mt-7 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[12.5px] font-semibold text-gray-700 mb-1.5">Subject <span className="text-rose-500">*</span></label>
            <select
              value={subject} onChange={e => setSubject(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-sm bg-white"
            >
              <option value="">Select subject</option>
              {subjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[12.5px] font-semibold text-gray-700 mb-1.5">Project Type</label>
            <select
              value={projectType} onChange={e => setProjectType(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-sm bg-white"
            >
              <option value="">Any type</option>
              {projectTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {subject && chapters.length > 0 && (
          <div className="mt-5">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[12.5px] font-semibold text-gray-700">
                Pick a chapter / topic
              </label>
              <button
                onClick={() => setShowCustomTopic(v => !v)}
                className="text-[11.5px] text-primary-600 font-semibold hover:underline"
              >
                {showCustomTopic ? 'Hide custom topic' : 'Or type a custom topic'}
              </button>
            </div>
            <div className="flex flex-wrap gap-2 max-h-52 overflow-y-auto p-3 bg-gray-50/60 rounded-2xl border border-gray-100">
              {chapters.map((ch, i) => {
                const selected = selectedChapter === ch;
                return (
                  <button
                    key={i}
                    onClick={() => { setSelectedChapter(ch); setTopic(''); }}
                    className={`px-3 py-1.5 rounded-xl text-[12px] font-medium transition-all flex items-center gap-1.5 ${
                      selected
                        ? 'bg-primary-500 text-white shadow-sm'
                        : 'bg-white text-gray-700 border border-gray-100 hover:border-primary-300 hover:text-primary-600'
                    }`}
                  >
                    {selected && <FiCheck size={11} />}
                    {ch}
                  </button>
                );
              })}
            </div>
            {showCustomTopic && (
              <input
                type="text" value={topic}
                onChange={e => { setTopic(e.target.value); if (e.target.value) setSelectedChapter(''); }}
                placeholder="e.g., Renewable energy in everyday life"
                className="w-full mt-3 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-sm"
              />
            )}
          </div>
        )}

        <button
          onClick={handleGenerate} disabled={loading || !subject}
          className="w-full mt-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold hover:opacity-95 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2 shadow-[0_10px_28px_-12px_rgba(46,134,193,0.5)]"
        >
          {loading ? <><FiRefreshCw className="animate-spin" /> Generating…</> : <><FiRefreshCw /> Generate Ideas{finalTopic ? ` · ${finalTopic}` : ''}</>}
        </button>

        {/* Loading Animation */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mt-6 surface p-8 flex flex-col items-center justify-center gap-4"
            >
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2.5 h-2.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2.5 h-2.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <p className="text-[13px] text-gray-500 font-medium">Crafting project ideas for you…</p>
              <div className="w-full max-w-xs space-y-2.5 mt-1">
                <div className="skeleton h-3 w-full" />
                <div className="skeleton h-3 w-4/5" />
                <div className="skeleton h-3 w-3/5" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {result && !loading && (
            <motion.div
              ref={resultRef}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="mt-6 surface p-6 ring-1 ring-primary-100"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-bold text-gray-900">Project Ideas</h3>
                <button
                  onClick={handleGenerate} disabled={loading}
                  className="text-[12.5px] text-primary-600 font-semibold hover:text-primary-700 flex items-center gap-1.5"
                >
                  <FiRefreshCw className={loading ? 'animate-spin' : ''} size={12} /> Regenerate
                </button>
              </div>
              <ChatMarkdown content={result} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
