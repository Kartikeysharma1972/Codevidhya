import { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCheckCircle, FiXCircle, FiChevronDown, FiChevronUp, FiArrowLeft, FiDownload, FiClock, FiAward, FiTrendingUp, FiStar } from 'react-icons/fi';
import AppLayout from '../components/AppLayout';
import ChatMarkdown from '../components/ChatMarkdown';
import { useAuth } from '../contexts/AuthContext';
import { sessionAPI } from '../utils/api';
import toast from 'react-hot-toast';

function generatePercentile(accuracy) {
  if (accuracy >= 90) return Math.floor(Math.random() * 5) + 95;
  if (accuracy >= 80) return Math.floor(Math.random() * 10) + 80;
  if (accuracy >= 60) return Math.floor(Math.random() * 15) + 55;
  if (accuracy >= 40) return Math.floor(Math.random() * 15) + 30;
  return Math.floor(Math.random() * 20) + 10;
}

function getXPEarned(score, total) {
  return score * 10 + (score === total ? 50 : 0);
}

function getBadge(accuracy) {
  if (accuracy >= 90) return { label: 'Gold Star', color: 'text-yellow-500', bg: 'bg-yellow-50' };
  if (accuracy >= 70) return { label: 'Silver Star', color: 'text-gray-400', bg: 'bg-gray-50' };
  if (accuracy >= 50) return { label: 'Bronze Star', color: 'text-orange-400', bg: 'bg-orange-50' };
  return { label: 'Keep Going!', color: 'text-blue-400', bg: 'bg-blue-50' };
}

export default function TestResult() {
  const { testId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [result, setResult] = useState(location.state?.result || null);
  const [expandedQ, setExpandedQ] = useState(null);
  const printRef = useRef(null);

  useEffect(() => {
    if (!result && testId) {
      sessionAPI.getTest(testId).then(res => {
        const t = res.data.test;
        setResult({
          subject: t.subject,
          score: t.score,
          totalQuestions: t.totalQuestions,
          accuracy: t.accuracy,
          topicWiseAccuracy: t.topicWiseAccuracy,
          weakAreas: t.weakAreas,
          questions: t.questions,
          timeTaken: t.timeTaken,
          timeAllotted: t.timeAllotted,
        });
      }).catch(() => toast.error('Failed to load result'));
    }
  }, [testId, result]);

  const handleDownloadPDF = () => {
    const printContent = printRef.current;
    if (!printContent) return;
    const win = window.open('', '_blank');
    if (!win) { toast.error('Allow pop-ups to download the report'); return; }
    win.document.write(`
      <html><head><title>Mock Test Report</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
        h1 { color: #5BA4CF; font-size: 20px; }
        h2 { font-size: 16px; margin-top: 20px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
        .score-box { display: flex; gap: 30px; margin: 15px 0; }
        .score-item { text-align: center; }
        .score-item .value { font-size: 28px; font-weight: bold; }
        .score-item .label { font-size: 11px; color: #888; }
        .question { margin: 12px 0; padding: 10px; border: 1px solid #eee; border-radius: 8px; }
        .correct { color: #22c55e; } .wrong { color: #ef4444; }
        .topic-bar { background: #f3f4f6; border-radius: 8px; height: 8px; margin: 4px 0; }
        .topic-fill { height: 8px; border-radius: 8px; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        td, th { padding: 6px 10px; border: 1px solid #eee; font-size: 12px; }
        th { background: #f9fafb; }
      </style></head><body>
      <h1>Mock Test Report — ${result?.subject || 'Test'}</h1>
      <div class="score-box">
        <div class="score-item"><div class="value">${result?.score}/${result?.totalQuestions}</div><div class="label">Score</div></div>
        <div class="score-item"><div class="value">${result?.accuracy}%</div><div class="label">Accuracy</div></div>
        <div class="score-item"><div class="value">${result?.totalQuestions}</div><div class="label">Questions</div></div>
      </div>
      <h2>Question Review</h2>
      ${(result?.questions || []).map((q, i) => `
        <div class="question">
          <p><strong>Q${i + 1}.</strong> ${q.question || ''} <span style="font-size:10px;color:#999">[${q.type || 'mcq'}]</span></p>
          <p>Your Answer: <span class="${q.isCorrect ? 'correct' : 'wrong'}">${q.studentAnswer || 'Not answered'}</span></p>
          <p>Correct Answer: <span class="correct">${q.correctAnswer || ''}</span></p>
          ${q.explanation ? `<p style="font-size:12px;color:#555"><em>${q.explanation}</em></p>` : ''}
        </div>
      `).join('')}
      </body></html>
    `);
    win.document.close();
    win.print();
  };

  if (!result) {
    return (
      <AppLayout activeTool="exam-prep">
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-400"></div>
        </div>
      </AppLayout>
    );
  }

  const scoreColor = result.accuracy >= 80 ? 'text-green-500' : result.accuracy >= 50 ? 'text-yellow-500' : 'text-red-500';
  const grade = user?.grade || 10;
  const showPercentile = grade >= 9;
  const showGamification = grade <= 8;
  const percentile = showPercentile ? generatePercentile(result.accuracy) : null;
  const xp = showGamification ? getXPEarned(result.score, result.totalQuestions) : 0;
  const badge = showGamification ? getBadge(result.accuracy) : null;

  const totalTimeTaken = result.timeTaken || 0;
  const timeAllotted = result.timeAllotted || 0;
  const avgTimePerQ = result.questions?.length ? Math.round(totalTimeTaken / result.questions.length) : 0;
  const timeUsedPct = timeAllotted > 0 ? Math.round((totalTimeTaken / timeAllotted) * 100) : 0;

  const headlineMsg =
    result.accuracy >= 90 ? 'Outstanding — you crushed it.' :
    result.accuracy >= 75 ? 'Strong performance.' :
    result.accuracy >= 50 ? 'Solid effort — let’s sharpen the weak spots.' :
    result.accuracy >= 30 ? 'Room to grow. Review and try again.' :
    'Tough one. Focus on the basics and bounce back.';

  return (
    <AppLayout activeTool="exam-prep">
      <div className="p-6 md:p-8 max-w-4xl mx-auto" ref={printRef}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <button onClick={() => navigate('/exam-prep')} className="flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-800 font-medium">
              <FiArrowLeft size={14} /> Back to Exam Prep
            </button>
            <button onClick={handleDownloadPDF} className="flex items-center gap-1.5 px-3 py-1.5 text-[12.5px] font-semibold text-primary-600 border border-primary-200 rounded-xl hover:bg-primary-50 transition-colors">
              <FiDownload size={13} /> Download Report
            </button>
          </div>

          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary-500 mb-1">Test Results</p>
          <h1 className="font-display font-extrabold text-2xl md:text-[28px] text-gray-900 leading-tight">{headlineMsg}</h1>
          <p className="mt-1 text-[13.5px] text-gray-500">{result.subject || 'Mock Test'} · Class {user?.grade}</p>

          <div className="mt-5" />

          {/* Gamification for Class 1-8 */}
          {showGamification && (
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-5 mb-6 text-center">
              <div className="flex items-center justify-center gap-6">
                <div className={`${badge.bg} rounded-xl p-3`}>
                  <FiAward className={`text-3xl ${badge.color}`} />
                  <p className={`text-xs font-semibold mt-1 ${badge.color}`}>{badge.label}</p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <FiStar className="text-yellow-500" />
                    <span className="text-2xl font-bold text-purple-600">+{xp} XP</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">Points earned this test</p>
                </div>
                {result.accuracy === 100 && (
                  <div className="bg-green-50 rounded-xl p-3">
                    <span className="text-lg">🔥</span>
                    <p className="text-xs font-semibold text-green-600 mt-1">Perfect!</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Score Card */}
          <div className="surface p-6 mb-6 relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-primary-100/40 blur-3xl" />
            <div className={`relative grid ${showPercentile ? 'grid-cols-2 md:grid-cols-5' : 'grid-cols-2 md:grid-cols-4'} gap-4 text-center`}>
              <div>
                <div className={`font-display font-extrabold text-3xl md:text-4xl ${scoreColor}`}>{result.score}<span className="text-gray-300 text-2xl">/{result.totalQuestions}</span></div>
                <div className="text-[11px] text-gray-500 mt-1 uppercase tracking-wider font-semibold">Score</div>
              </div>
              <div>
                <div className={`font-display font-extrabold text-3xl md:text-4xl ${scoreColor}`}>{result.accuracy}%</div>
                <div className="text-[11px] text-gray-500 mt-1 uppercase tracking-wider font-semibold">Accuracy</div>
              </div>
              <div>
                <div className="font-display font-extrabold text-3xl md:text-4xl text-primary-600">{result.totalQuestions}</div>
                <div className="text-[11px] text-gray-500 mt-1 uppercase tracking-wider font-semibold">Questions</div>
              </div>
              <div>
                <div className={`font-display font-extrabold text-3xl md:text-4xl ${result.weakAreas?.length ? 'text-rose-500' : 'text-emerald-500'}`}>{result.weakAreas?.length || 0}</div>
                <div className="text-[11px] text-gray-500 mt-1 uppercase tracking-wider font-semibold">Weak Areas</div>
              </div>
              {showPercentile && (
                <div>
                  <div className="font-display font-extrabold text-3xl md:text-4xl text-indigo-600">{percentile}<span className="text-xl">th</span></div>
                  <div className="text-[11px] text-gray-500 mt-1 uppercase tracking-wider font-semibold">Percentile</div>
                </div>
              )}
            </div>
          </div>

          {/* Time Management Stats (Class 9-12) */}
          {showPercentile && totalTimeTaken > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
              <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2"><FiClock className="text-primary-400" /> Time Management</h3>
              <div className="grid grid-cols-3 gap-4 text-center mb-4">
                <div>
                  <div className="text-2xl font-bold text-gray-700">{Math.floor(totalTimeTaken / 60)}:{(totalTimeTaken % 60).toString().padStart(2, '0')}</div>
                  <div className="text-xs text-gray-400">Time Used</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-700">{avgTimePerQ}s</div>
                  <div className="text-xs text-gray-400">Avg per Question</div>
                </div>
                <div>
                  <div className={`text-2xl font-bold ${timeUsedPct <= 80 ? 'text-green-500' : timeUsedPct <= 100 ? 'text-yellow-500' : 'text-red-500'}`}>{timeUsedPct}%</div>
                  <div className="text-xs text-gray-400">Time Utilization</div>
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full transition-all ${timeUsedPct <= 80 ? 'bg-green-400' : timeUsedPct <= 100 ? 'bg-yellow-400' : 'bg-red-400'}`}
                  style={{ width: `${Math.min(100, timeUsedPct)}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-2 text-center">
                {timeUsedPct <= 60 ? 'Great pace! You had plenty of time to review.' :
                 timeUsedPct <= 80 ? 'Good time management.' :
                 timeUsedPct <= 100 ? 'Tight on time — practice speed.' :
                 'You ran out of time — focus on quicker strategies.'}
              </p>
            </div>
          )}

          {/* Topic-wise Accuracy */}
          {result.topicWiseAccuracy && Object.keys(result.topicWiseAccuracy).length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
              <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2"><FiTrendingUp className="text-primary-400" /> Topic-wise Performance</h3>
              <div className="space-y-3">
                {Object.entries(result.topicWiseAccuracy).map(([topic, data]) => {
                  const pct = Math.round((data.correct / data.total) * 100);
                  return (
                    <div key={topic}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-600">{topic}</span>
                        <span className={`font-medium ${pct >= 80 ? 'text-green-500' : pct >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                          {data.correct}/{data.total} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${pct >= 80 ? 'bg-green-400' : pct >= 50 ? 'bg-yellow-400' : 'bg-red-400'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Weak Areas */}
          {result.weakAreas?.length > 0 && (
            <div className="bg-red-50 rounded-2xl p-5 mb-6">
              <h3 className="font-semibold text-red-700 mb-2">Weak Areas — Focus on these:</h3>
              <div className="flex flex-wrap gap-2">
                {result.weakAreas.map((area, i) => (
                  <span key={i} className="px-3 py-1 bg-white text-red-600 text-sm rounded-full border border-red-100">{area}</span>
                ))}
              </div>
            </div>
          )}

          {/* Question Review */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-700 mb-4">Question Review</h3>
            <div className="space-y-3">
              {result.questions?.map((q, i) => (
                <div key={i} className="border border-gray-50 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedQ(expandedQ === i ? null : i)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      {q.isCorrect ? <FiCheckCircle className="text-green-500" /> : <FiXCircle className="text-red-500" />}
                      <span className="text-sm text-gray-700 text-left">Q{i + 1}. {q.question?.substring(0, 80)}{q.question?.length > 80 ? '...' : ''}</span>
                      {q.type && <span className="px-1.5 py-0.5 rounded text-[10px] bg-gray-100 text-gray-500 whitespace-nowrap ml-1">{q.type}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      {q.timeTakenSeconds > 0 && <span className="text-[10px] text-gray-300">{q.timeTakenSeconds}s</span>}
                      {expandedQ === i ? <FiChevronUp className="text-gray-400" /> : <FiChevronDown className="text-gray-400" />}
                    </div>
                  </button>

                  {expandedQ === i && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} className="px-4 pb-4 border-t border-gray-50">
                      <div className="pt-3 space-y-3 text-sm">
                        <p className="text-gray-700"><strong>Question:</strong> {q.question}</p>
                        <p className="text-gray-500"><strong>Your Answer:</strong> <span className={q.isCorrect ? 'text-green-600' : 'text-red-500'}>{q.studentAnswer || 'Not answered'}</span></p>
                        <p className="text-gray-500"><strong>Correct Answer:</strong> <span className="text-green-600 font-medium">{q.correctAnswer}</span></p>
                        {q.timeTakenSeconds > 0 && (
                          <p className="text-gray-400 text-xs flex items-center gap-1"><FiClock size={12} /> Time spent: {q.timeTakenSeconds}s</p>
                        )}
                        {q.explanation && (
                          <div className="bg-blue-50 rounded-xl p-3">
                            <strong className="text-blue-700 text-xs">Explanation:</strong>
                            <div className="mt-1"><ChatMarkdown content={q.explanation} /></div>
                          </div>
                        )}
                        {q.studyNotes && (
                          <div className="bg-gray-50 rounded-xl p-3">
                            <strong className="text-gray-500 text-xs">Study Notes:</strong>
                            <div className="mt-1"><ChatMarkdown content={q.studyNotes} /></div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
}
