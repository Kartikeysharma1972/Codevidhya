import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiClock, FiChevronLeft, FiChevronRight, FiAlertCircle, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../contexts/AuthContext';
import { aiAPI } from '../utils/api';
import toast from 'react-hot-toast';

const baseInstructions = [
  'Read all questions carefully before answering.',
  'Each question carries equal marks unless specified.',
  'There is no negative marking.',
  'Use paper and pen/pencil for rough work.',
  'Do not refresh or close the browser during the test.',
  'Manage your time wisely — keep an eye on the timer.',
  'Attempt all questions before submitting.',
  'Click "Submit Test" after completing all questions.',
  'Ensure stable internet connection during the test.',
  'The timer will automatically submit the test once time is over.',
];

function getInstructions(subject, grade) {
  const instructions = [...baseInstructions];
  const subjectLower = (subject || '').toLowerCase();
  if (['maths', 'mathematics', 'science', 'physics', 'chemistry'].some(s => subjectLower.includes(s))) {
    instructions.push('Keep rough sheets ready. Show step-by-step work for numericals.');
  }
  if (['computer science', 'cs', 'coding', 'informatics'].some(s => subjectLower.includes(s))) {
    instructions.push('Carefully read code snippets before selecting. Trace execution mentally.');
  }
  return instructions;
}

const typeLabels = {
  'mcq': 'MCQ', 'true-false': 'True / False', 'fill-blank': 'Fill in the Blank',
  'match-following': 'Match the Following', 'matrix-match': 'Matrix Match',
  'sequence-ordering': 'Sequence Ordering', 'assertion-reason': 'Assertion & Reason',
  'case-study': 'Case Study', 'numerical': 'Numerical', 'one-word': 'One Word Answer',
  'hots': 'HOTS', 'code-output': 'Code Output', 'multi-select': 'Multi-Select',
  'integer-type': 'Integer Type',
};
function formatType(type) { return typeLabels[type] || type; }

function parseMatches(formatted) {
  if (!formatted || typeof formatted !== 'string') return {};
  const out = {};
  formatted.split(',').forEach(pair => {
    const [idx, val] = pair.split('-').map(s => (s || '').trim());
    const n = parseInt(idx, 10);
    if (Number.isNaN(n) || !val || val === '?') return;
    out[n - 1] = val;
  });
  return out;
}

function MatchFollowingInput({ question, current, answers, handleAnswer }) {
  const pairs = question.pairs || [];
  const leftItems = pairs.map(p => p.left);
  const rightItems = pairs.map(p => p.right);
  const currentMatches = parseMatches(answers[current]);

  const updateMatch = (leftIdx, rightVal) => {
    const updated = { ...currentMatches, [leftIdx]: rightVal };
    const formatted = leftItems.map((_, i) => `${i + 1}-${updated[i] || '?'}`).join(', ');
    handleAnswer(current, formatted);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="font-medium text-sm text-gray-500 border-b pb-1">Column A</div>
        <div className="font-medium text-sm text-gray-500 border-b pb-1">Match with</div>
      </div>
      {leftItems.map((left, i) => (
        <div key={i} className="grid grid-cols-2 gap-4 items-center">
          <div className="text-sm text-gray-700 bg-gray-50 rounded-xl px-3 py-2">{i + 1}. {left}</div>
          <select
            value={currentMatches[i] || ''}
            onChange={e => updateMatch(i, e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white focus:border-primary-400 outline-none"
          >
            <option value="">Select</option>
            {rightItems.map((r, j) => <option key={j} value={String.fromCharCode(65 + j)}>{String.fromCharCode(65 + j)}. {r}</option>)}
          </select>
        </div>
      ))}
      <div className="mt-3 p-3 bg-blue-50 rounded-xl">
        <p className="text-xs text-gray-500 font-medium mb-1">Options (Column B):</p>
        {rightItems.map((r, j) => <p key={j} className="text-sm text-gray-600">{String.fromCharCode(65 + j)}. {r}</p>)}
      </div>
    </div>
  );
}

function SequenceOrderingInput({ question, current, answers, handleAnswer }) {
  const [items, setItems] = useState(question.items || []);

  useEffect(() => { setItems(question.items || []); }, [question]);

  const moveItem = (idx, dir) => {
    const newItems = [...items];
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= newItems.length) return;
    [newItems[idx], newItems[swapIdx]] = [newItems[swapIdx], newItems[idx]];
    setItems(newItems);
    handleAnswer(current, newItems.join(', '));
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-400 mb-2">Use arrows to arrange in correct order:</p>
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
          <span className="text-sm font-medium text-gray-400 w-6">{i + 1}.</span>
          <span className="text-sm text-gray-700 flex-1">{item}</span>
          <div className="flex flex-col gap-0.5">
            <button onClick={() => moveItem(i, -1)} disabled={i === 0} className="text-gray-400 hover:text-primary-500 disabled:opacity-20"><FiArrowUp size={14} /></button>
            <button onClick={() => moveItem(i, 1)} disabled={i === items.length - 1} className="text-gray-400 hover:text-primary-500 disabled:opacity-20"><FiArrowDown size={14} /></button>
          </div>
        </div>
      ))}
    </div>
  );
}

function MultiSelectInput({ question, current, answers, handleAnswer }) {
  const options = question.options || [];
  const selected = answers[current]
    ? String(answers[current]).split(',').map(s => s.trim()).filter(Boolean)
    : [];

  const toggleOption = (letter) => {
    const updated = selected.includes(letter)
      ? selected.filter(s => s !== letter)
      : [...selected, letter];
    updated.sort();
    handleAnswer(current, updated.join(', '));
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-400 mb-1">Select all correct answers:</p>
      {options.map((opt, i) => {
        const letter = String.fromCharCode(65 + i);
        const isSelected = selected.includes(letter);
        return (
          <button
            key={i}
            onClick={() => toggleOption(letter)}
            className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all text-sm ${
              isSelected
                ? 'border-primary-400 bg-primary-50 text-primary-700 font-medium'
                : 'border-gray-100 hover:border-primary-200 text-gray-600'
            }`}
          >
            <span className={`inline-flex items-center justify-center w-5 h-5 rounded border mr-3 text-xs ${isSelected ? 'bg-primary-400 text-white border-primary-400' : 'border-gray-300'}`}>
              {isSelected ? '✓' : ''}
            </span>
            {letter}. {opt}
          </button>
        );
      })}
    </div>
  );
}

function QuestionInput({ type, question, current, answers, handleAnswer }) {
  if (type === 'match-following' || type === 'matrix-match') {
    return <MatchFollowingInput question={question} current={current} answers={answers} handleAnswer={handleAnswer} />;
  }
  if (type === 'sequence-ordering') {
    return <SequenceOrderingInput question={question} current={current} answers={answers} handleAnswer={handleAnswer} />;
  }
  if (type === 'multi-select') {
    return <MultiSelectInput question={question} current={current} answers={answers} handleAnswer={handleAnswer} />;
  }
  if (question.options && question.options.length > 0) {
    return (
      <div className="space-y-3">
        {question.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => handleAnswer(current, opt)}
            className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all text-sm ${
              answers[current] === opt
                ? 'border-primary-400 bg-primary-50 text-primary-700 font-medium'
                : 'border-gray-100 hover:border-primary-200 text-gray-600'
            }`}
          >
            <span className="font-medium text-gray-400 mr-3">{String.fromCharCode(65 + i)}.</span> {opt}
          </button>
        ))}
      </div>
    );
  }
  return (
    <input
      type="text"
      value={answers[current] || ''}
      onChange={e => handleAnswer(current, e.target.value)}
      placeholder={
        type === 'numerical' || type === 'integer-type' ? 'Enter your numerical answer...' :
        type === 'fill-blank' ? 'Fill in the blank...' :
        type === 'one-word' ? 'Enter one word answer...' :
        'Type your answer...'
      }
      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-400 outline-none text-sm"
    />
  );
}

export default function MockTest() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { subject, chapters, questionType, questionCount } = location.state || {};

  const [phase, setPhase] = useState('loading');
  const [questions, setQuestions] = useState([]);
  const [config, setConfig] = useState(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const questionTimeRef = useRef({});
  const questionStartRef = useRef(null);

  useEffect(() => {
    if (!subject) { navigate('/exam-prep'); return; }
    generateTest();
  }, []);

  const generateTest = async () => {
    setPhase('loading');
    try {
      const res = await aiAPI.generateMockTest({
        subject,
        chapters,
        questionType: questionType || null,
        questionCount: questionCount || null,
      });
      setQuestions(res.data.questions.map(q => ({ ...q, studentAnswer: null })));
      setConfig(res.data.config);
      setTimeLeft(res.data.config.totalTime * 60);
      setPhase('info');
    } catch {
      toast.error('Failed to generate test');
      navigate('/exam-prep');
    }
  };

  const trackQuestionTime = (fromQ, toQ) => {
    if (questionStartRef.current !== null && fromQ !== undefined) {
      const elapsed = Math.round((Date.now() - questionStartRef.current) / 1000);
      questionTimeRef.current[fromQ] = (questionTimeRef.current[fromQ] || 0) + elapsed;
    }
    questionStartRef.current = Date.now();
  };

  const startTest = () => {
    setPhase('test');
    startTimeRef.current = Date.now();
    questionStartRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); handleSubmit(); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const navigateTo = (idx) => {
    trackQuestionTime(current, idx);
    setCurrent(idx);
  };

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const handleAnswer = (questionIndex, answer) => {
    setAnswers(prev => ({ ...prev, [questionIndex]: answer }));
    setQuestions(prev => prev.map((q, i) => i === questionIndex ? { ...q, studentAnswer: answer } : q));
  };

  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);
    trackQuestionTime(current);
    const timeTaken = startTimeRef.current ? Math.round((Date.now() - startTimeRef.current) / 1000) : 0;

    try {
      const res = await aiAPI.submitMockTest({
        subject, chapters,
        questions: questions.map((q, i) => ({
          ...q,
          studentAnswer: answers[i] ?? null,
          timeTakenSeconds: questionTimeRef.current[i] || 0,
        })),
        timeTaken,
      });
      navigate(`/test-result/${res.data.testId}`, { state: { result: res.data } });
    } catch {
      toast.error('Failed to submit test');
      setSubmitting(false);
    }
  }, [submitting, questions, answers, subject, chapters, navigate, current]);

  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  const answeredCount = Object.keys(answers).length;

  if (phase === 'loading') {
    return (
      <AppLayout activeTool="exam-prep">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="inline-flex w-14 h-14 rounded-2xl bg-primary-50 text-primary-500 items-center justify-center mb-3">
              <div className="animate-spin rounded-full h-7 w-7 border-2 border-primary-300 border-t-transparent" />
            </div>
            <p className="font-display font-bold text-gray-800">Generating your mock test…</p>
            <p className="text-[12px] text-gray-400 mt-1">Calibrating questions to Class {user?.grade}</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (phase === 'info') {
    const testInstructions = getInstructions(subject, user?.grade);
    const questionTypes = [...new Set(questions.map(q => q.type).filter(Boolean))];
    const chapterDisplay = chapters && chapters.length > 0 ? chapters.join(', ') : 'All chapters';

    return (
      <AppLayout activeTool="exam-prep">
        <div className="p-6 md:p-8 max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary-500 mb-1.5">Mock Test</p>
            <h1 className="font-display font-extrabold text-2xl md:text-[28px] text-gray-900 leading-tight">{subject}</h1>
            <p className="mt-1.5 text-[13.5px] text-gray-500">Take a deep breath. You've got this.</p>

            <div className="mt-6 rounded-2xl overflow-hidden border border-primary-100 bg-gradient-to-br from-primary-50/50 via-white to-sky-50/40">
              <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-primary-100/60">
                {[
                  { v: questions.length, l: 'Questions' },
                  { v: `${config?.totalTime} min`, l: 'Duration' },
                  { v: 'Mixed', l: 'Difficulty' },
                  { v: `Class ${user?.grade}`, l: 'Level' },
                ].map((s, i) => (
                  <div key={i} className="px-4 py-4 text-center">
                    <div className="font-display font-extrabold text-2xl text-primary-700">{s.v}</div>
                    <div className="text-[11px] text-gray-500 mt-0.5 uppercase tracking-wider font-semibold">{s.l}</div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-3 border-t border-primary-100/70 bg-white/60">
                <p className="text-[12px] text-gray-600 text-center"><span className="font-semibold">Topics:</span> {chapterDisplay}</p>
                {questionTypes.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 justify-center mt-2">
                    {questionTypes.map(t => (
                      <span key={t} className="px-2 py-0.5 rounded-full text-[10.5px] bg-primary-50 text-primary-700 border border-primary-100 font-semibold">{formatType(t)}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-5 surface p-5">
              <h3 className="font-display font-bold text-gray-900 mb-3 flex items-center gap-2 text-[15px]"><FiAlertCircle className="text-amber-500" /> Instructions</h3>
              <ol className="space-y-1.5">
                {testInstructions.map((inst, i) => (
                  <li key={i} className="text-[13px] text-gray-600 flex gap-2.5">
                    <span className="text-primary-400 font-bold flex-shrink-0">{i + 1}.</span>
                    <span>{inst}</span>
                  </li>
                ))}
              </ol>
              {user?.grade <= 5 && <p className="mt-3 text-[13px] text-primary-600 font-semibold">Try your best! Read carefully and have fun learning. ✨</p>}
            </div>

            <button
              onClick={startTest}
              className="w-full mt-5 py-3.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-2xl font-bold hover:opacity-95 transition-opacity text-[15px] shadow-[0_15px_35px_-12px_rgba(46,134,193,0.55)]"
            >
              I'm ready — Start Test →
            </button>
          </motion.div>
        </div>
      </AppLayout>
    );
  }

  const q = questions[current];
  const progressPct = Math.round((answeredCount / questions.length) * 100);
  const timeFraction = config?.totalTime ? timeLeft / (config.totalTime * 60) : 1;

  return (
    <AppLayout activeTool="exam-prep">
      <div className="flex flex-col h-full app-bg">
        {/* Timer Bar */}
        <div className="bg-white/85 backdrop-blur-sm border-b border-gray-100 px-4 md:px-6 py-2.5 flex items-center justify-between flex-shrink-0 sticky top-0 z-10">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-[12.5px] font-semibold text-gray-700">
              Question <span className="text-primary-600">{current + 1}</span> / {questions.length}
            </span>
            <div className="hidden sm:flex items-center gap-1.5">
              <div className="w-28 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-400 to-primary-600 transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <span className="text-[11px] text-gray-500">{answeredCount}/{questions.length}</span>
            </div>
          </div>
          <div className={`flex items-center gap-2 font-mono font-bold tabular-nums px-3 py-1 rounded-xl ${
            timeLeft < 60
              ? 'text-rose-600 bg-rose-50 animate-pulse'
              : timeFraction < 0.25
                ? 'text-amber-600 bg-amber-50'
                : 'text-gray-700 bg-gray-50'
          }`}>
            <FiClock size={14} /> {formatTime(timeLeft)}
          </div>
        </div>

        {/* Question */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-3xl mx-auto">
            {q && (
              <motion.div key={current} initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }}>
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  {q.type && <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold uppercase tracking-wider bg-primary-50 text-primary-700 border border-primary-100">{formatType(q.type)}</span>}
                  {q.difficulty && <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold uppercase tracking-wider border ${
                    q.difficulty === 'easy' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                    q.difficulty === 'medium' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                    'bg-rose-50 text-rose-700 border-rose-100'
                  }`}>{q.difficulty}</span>}
                  {q.topic && <span className="text-[11px] text-gray-400">· {q.topic}</span>}
                </div>

                <h2 className="font-display font-bold text-[18px] md:text-xl text-gray-900 mb-6 leading-snug whitespace-pre-line">{q.question}</h2>

                <QuestionInput type={q.type} question={q} current={current} answers={answers} handleAnswer={handleAnswer} />
              </motion.div>
            )}
          </div>
        </div>

        {/* Question Navigation */}
        <div className="bg-white border-t border-gray-100 px-4 md:px-6 py-3 flex-shrink-0">
          <div className="max-w-3xl mx-auto">
            <div className="flex flex-wrap gap-1.5 mb-3 justify-center">
              {questions.map((_, i) => (
                <button
                  key={i}
                  onClick={() => navigateTo(i)}
                  className={`w-8 h-8 rounded-lg text-[11.5px] font-bold transition-all ${
                    i === current
                      ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-sm ring-2 ring-primary-200'
                      : answers[i] !== undefined
                        ? 'bg-primary-50 text-primary-700 border border-primary-100'
                        : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                  }`}
                  aria-label={`Go to question ${i + 1}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={() => navigateTo(Math.max(0, current - 1))} disabled={current === 0}
                className="flex items-center gap-1.5 px-4 py-2 text-[13px] text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl disabled:opacity-30 font-medium transition-colors"
              >
                <FiChevronLeft size={14} /> Previous
              </button>
              {current === questions.length - 1 ? (
                <button
                  onClick={handleSubmit} disabled={submitting}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-bold hover:opacity-95 transition-opacity disabled:opacity-50 shadow-[0_8px_22px_-10px_rgba(16,185,129,0.5)]"
                >
                  {submitting ? 'Submitting…' : 'Submit Test'}
                </button>
              ) : (
                <button
                  onClick={() => navigateTo(Math.min(questions.length - 1, current + 1))}
                  className="flex items-center gap-1.5 px-4 py-2 text-[13px] text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-xl font-semibold transition-colors"
                >
                  Next <FiChevronRight size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
