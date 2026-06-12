import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Cell,
} from 'recharts';
import api from '../utils/api';
import Header from '../components/Header';
import StatsCard from '../components/StatsCard';
import ExportButton from '../components/ExportButton';
import {
  HiOutlineChatBubbleLeftEllipsis,
  HiOutlineArrowPath,
  HiOutlineUserGroup,
  HiOutlineExclamationTriangle,
} from 'react-icons/hi2';

const COLORS = {
  emerald: '#10b981',
  emeraldDark: '#059669',
  emeraldLight: '#34d399',
  blue: '#3b82f6',
  purple: '#8b5cf6',
  amber: '#f59e0b',
  rose: '#f43f5e',
  cyan: '#06b6d4',
};

const tooltipStyle = {
  borderRadius: '12px',
  border: 'none',
  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
  fontSize: '13px',
};

function ChartCard({ title, children, delay = 0, loading }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="card p-6"
    >
      <h3 className="font-display font-bold text-gray-900 mb-4">{title}</h3>
      {loading ? (
        <div className="h-64 skeleton rounded-lg" />
      ) : (
        children
      )}
    </motion.div>
  );
}

function getHeatColor(count, maxCount) {
  if (!count || count === 0) return 'bg-gray-50 text-gray-400';
  const ratio = count / Math.max(maxCount, 1);
  if (ratio >= 0.75) return 'bg-emerald-600 text-white';
  if (ratio >= 0.5) return 'bg-emerald-400 text-white';
  if (ratio >= 0.25) return 'bg-emerald-200 text-emerald-800';
  return 'bg-emerald-100 text-emerald-700';
}

export default function Analytics() {
  const [usageOverTime, setUsageOverTime] = useState([]);
  const [toolPopularity, setToolPopularity] = useState([]);
  const [gradePerformance, setGradePerformance] = useState([]);
  const [topTeachers, setTopTeachers] = useState([]);
  const [studentPerformance, setStudentPerformance] = useState([]);
  const [loading, setLoading] = useState(true);

  // New feature states
  const [effectiveness, setEffectiveness] = useState([]);
  const [effectivenessLoading, setEffectivenessLoading] = useState(true);
  const [curriculum, setCurriculum] = useState([]);
  const [curriculumLoading, setCurriculumLoading] = useState(true);
  const [curriculumGrade, setCurriculumGrade] = useState('');
  const [engagement, setEngagement] = useState(null);
  const [engagementLoading, setEngagementLoading] = useState(true);
  const [grade1, setGrade1] = useState('6');
  const [grade2, setGrade2] = useState('8');
  const [gradeComparison, setGradeComparison] = useState(null);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [benchmarks, setBenchmarks] = useState([]);
  const [benchmarksLoading, setBenchmarksLoading] = useState(true);
  const [costData, setCostData] = useState(null);
  const [costLoading, setCostLoading] = useState(true);
  const [costDays, setCostDays] = useState(30);

  useEffect(() => {
    fetchAllAnalytics();
    fetchEffectiveness();
    fetchCurriculum();
    fetchEngagement();
    fetchBenchmarks();
    fetchCostTracking();
  }, []);

  useEffect(() => {
    fetchCurriculum();
  }, [curriculumGrade]);

  useEffect(() => {
    fetchCostTracking();
  }, [costDays]);

  const fetchAllAnalytics = async () => {
    setLoading(true);
    try {
      const [usage, tools, grades, teachers, students] = await Promise.allSettled([
        api.get('/analytics/usage-over-time'),
        api.get('/analytics/tool-popularity'),
        api.get('/analytics/grade-performance'),
        api.get('/analytics/top-teachers'),
        api.get('/analytics/student-performance'),
      ]);

      if (usage.status === 'fulfilled') {
        setUsageOverTime(
          (usage.value.data.usage || []).map((d) => ({
            ...d,
            date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          }))
        );
      }
      if (tools.status === 'fulfilled') {
        setToolPopularity(
          (tools.value.data.tools || []).map((d) => ({
            ...d,
            tool_name: (d.tool_name || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
          }))
        );
      }
      if (grades.status === 'fulfilled') {
        setGradePerformance(
          (grades.value.data.grades || []).map((d) => ({
            ...d,
            grade: `Grade ${d.grade}`,
            avg_accuracy: Number((d.avg_accuracy || 0).toFixed(1)),
          }))
        );
      }
      if (teachers.status === 'fulfilled') {
        setTopTeachers(teachers.value.data.teachers || []);
      }
      if (students.status === 'fulfilled') {
        setStudentPerformance(
          (students.value.data.subjects || []).map((d) => ({
            ...d,
            avg_accuracy: Number((d.avg_accuracy || 0).toFixed(1)),
          }))
        );
      }
    } catch {
      // Individual failures handled by allSettled
    } finally {
      setLoading(false);
    }
  };

  const fetchEffectiveness = async () => {
    setEffectivenessLoading(true);
    try {
      const res = await api.get('/analytics/teacher-effectiveness');
      setEffectiveness(res.data.teachers || []);
    } catch {
      setEffectiveness([]);
    } finally {
      setEffectivenessLoading(false);
    }
  };

  const fetchCurriculum = async () => {
    setCurriculumLoading(true);
    try {
      const params = {};
      if (curriculumGrade) params.grade = curriculumGrade;
      const res = await api.get('/analytics/curriculum-coverage', { params });
      setCurriculum(res.data.coverage || []);
    } catch {
      setCurriculum([]);
    } finally {
      setCurriculumLoading(false);
    }
  };

  const fetchEngagement = async () => {
    setEngagementLoading(true);
    try {
      const res = await api.get('/analytics/engagement');
      setEngagement(res.data);
    } catch {
      setEngagement(null);
    } finally {
      setEngagementLoading(false);
    }
  };

  const fetchGradeComparison = async () => {
    setComparisonLoading(true);
    try {
      const res = await api.get('/analytics/grade-comparison', { params: { grade1, grade2 } });
      setGradeComparison(res.data);
    } catch {
      setGradeComparison(null);
    } finally {
      setComparisonLoading(false);
    }
  };

  const fetchBenchmarks = async () => {
    setBenchmarksLoading(true);
    try {
      const res = await api.get('/analytics/subject-benchmarks');
      setBenchmarks(res.data.benchmarks || []);
    } catch {
      setBenchmarks([]);
    } finally {
      setBenchmarksLoading(false);
    }
  };

  const fetchCostTracking = async () => {
    setCostLoading(true);
    try {
      const res = await api.get('/analytics/cost-tracking', { params: { days: costDays } });
      setCostData(res.data);
    } catch {
      setCostData(null);
    } finally {
      setCostLoading(false);
    }
  };

  // Build curriculum heatmap data
  const curriculumSubjects = [...new Set(curriculum.map(c => c.subject))];
  const curriculumTopics = [...new Set(curriculum.map(c => c.topic))];
  const maxCurrCount = Math.max(...curriculum.map(c => c.session_count || 0), 1);
  const currMap = {};
  curriculum.forEach(c => { currMap[`${c.subject}__${c.topic}`] = c.session_count || 0; });

  // Cost daily data for chart
  const costChartData = (costData?.daily_costs || []).map(d => ({
    ...d,
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    cost: Number((d.estimated_cost || 0).toFixed(4)),
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <Header title="Analytics" subtitle="Usage trends and performance insights" />
        <ExportButton endpoint="/export/analytics?format=csv" filename="analytics.csv" />
      </div>

      {/* Usage Over Time */}
      <ChartCard title="Usage Over Time (Last 30 Days)" delay={0} loading={loading}>
        {usageOverTime.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={usageOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6b7280' }} />
              <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line
                type="monotone"
                dataKey="count"
                stroke={COLORS.emerald}
                strokeWidth={2.5}
                dot={{ fill: COLORS.emerald, r: 3 }}
                activeDot={{ r: 6, fill: COLORS.emerald }}
                name="Lessons"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
            No usage data available
          </div>
        )}
      </ChartCard>

      {/* Two column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Tool Popularity */}
        <ChartCard title="Tool Popularity" delay={0.1} loading={loading}>
          {toolPopularity.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={toolPopularity} layout="vertical" barSize={24}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis type="number" tick={{ fontSize: 12, fill: '#6b7280' }} />
                <YAxis
                  type="category"
                  dataKey="tool_name"
                  width={120}
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill={COLORS.emerald} radius={[0, 6, 6, 0]} name="Usage Count" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
              No tool data available
            </div>
          )}
        </ChartCard>

        {/* Grade Performance */}
        <ChartCard title="Grade Performance (Avg Accuracy)" delay={0.15} loading={loading}>
          {gradePerformance.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={gradePerformance} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="grade" tick={{ fontSize: 11, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} domain={[0, 100]} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend formatter={(value) => <span className="text-xs text-gray-600">{value}</span>} />
                <Bar dataKey="avg_accuracy" fill={COLORS.blue} radius={[6, 6, 0, 0]} name="Avg Accuracy %" />
                <Bar dataKey="test_count" fill={COLORS.emeraldLight} radius={[6, 6, 0, 0]} name="Test Count" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
              No grade performance data available
            </div>
          )}
        </ChartCard>

        {/* Top Teachers */}
        <ChartCard title="Top Teachers (By Lessons Generated)" delay={0.2} loading={loading}>
          {topTeachers.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topTeachers.slice(0, 10)} layout="vertical" barSize={22}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis type="number" tick={{ fontSize: 12, fill: '#6b7280' }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={110}
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value) => [value, 'Lessons']}
                  labelFormatter={(label) => {
                    const teacher = topTeachers.find((t) => t.name === label);
                    return teacher ? `${label} (${teacher.email})` : label;
                  }}
                />
                <Bar dataKey="total_lessons" fill={COLORS.purple} radius={[0, 6, 6, 0]} name="Lessons" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
              No teacher data available
            </div>
          )}
        </ChartCard>

        {/* Student Performance by Subject */}
        <ChartCard title="Student Performance by Subject" delay={0.25} loading={loading}>
          {studentPerformance.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={studentPerformance} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="subject" tick={{ fontSize: 11, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} domain={[0, 100]} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend formatter={(value) => <span className="text-xs text-gray-600">{value}</span>} />
                <Bar dataKey="avg_accuracy" fill={COLORS.amber} radius={[6, 6, 0, 0]} name="Avg Accuracy %" />
                <Bar dataKey="total_tests" fill={COLORS.emeraldDark} radius={[6, 6, 0, 0]} name="Total Tests" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
              No student performance data available
            </div>
          )}
        </ChartCard>
      </div>

      {/* ===== FEATURE 5: Teacher Effectiveness ===== */}
      <div className="mt-8">
        <ChartCard title="Teacher Effectiveness (Student Accuracy Correlation)" delay={0.3} loading={effectivenessLoading}>
          {effectiveness.length > 0 ? (
            <ResponsiveContainer width="100%" height={Math.max(300, effectiveness.length * 40)}>
              <BarChart data={effectiveness.slice(0, 15)} layout="vertical" barSize={22}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis type="number" tick={{ fontSize: 12, fill: '#6b7280' }} domain={[0, 100]} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={120}
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value, name) => [
                    `${Number(value).toFixed(1)}%`,
                    name === 'student_avg_accuracy' ? 'Student Avg Accuracy' : name,
                  ]}
                />
                <Bar
                  dataKey="student_avg_accuracy"
                  name="Student Avg Accuracy"
                  radius={[0, 6, 6, 0]}
                  fill={COLORS.blue}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
              No teacher effectiveness data available
            </div>
          )}
        </ChartCard>
      </div>

      {/* ===== FEATURE 7: Engagement Depth Metrics ===== */}
      <div className="mt-8">
        <h2 className="font-display font-bold text-lg text-gray-900 mb-4">Engagement Depth</h2>
        {engagementLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-28 rounded-xl" />
            ))}
          </div>
        ) : engagement ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatsCard
                title="Avg Messages/Session"
                value={Number(engagement.avg_messages || 0).toFixed(1)}
                icon={HiOutlineChatBubbleLeftEllipsis}
                color="emerald"
              />
              <StatsCard
                title="Deep Sessions (10+)"
                value={engagement.deep_sessions ?? 0}
                subtitle={`of ${engagement.total_sessions ?? 0} total`}
                icon={HiOutlineUserGroup}
                color="blue"
              />
              <StatsCard
                title="Abandoned (1 msg)"
                value={engagement.abandoned_sessions ?? 0}
                icon={HiOutlineExclamationTriangle}
                color="amber"
              />
              <StatsCard
                title="Returning Users"
                value={engagement.returning_users ?? 0}
                subtitle={engagement.returning_pct != null ? `${Number(engagement.returning_pct).toFixed(1)}% of users` : ''}
                icon={HiOutlineArrowPath}
                color="purple"
              />
            </div>
            {(engagement.tool_engagement || []).length > 0 && (
              <ChartCard title="Avg Messages per Tool" delay={0.35} loading={false}>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={engagement.tool_engagement} barSize={32}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis
                      dataKey="tool"
                      tick={{ fontSize: 11, fill: '#6b7280' }}
                      tickFormatter={t => (t || '').replace(/_/g, ' ')}
                    />
                    <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="avg_messages" fill={COLORS.cyan} radius={[6, 6, 0, 0]} name="Avg Messages" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            )}
          </>
        ) : (
          <div className="card p-8 text-center text-gray-400 text-sm">No engagement data available</div>
        )}
      </div>

      {/* ===== FEATURE 6: Curriculum Coverage Heatmap ===== */}
      <div className="mt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-gray-900">Curriculum Coverage Heatmap</h3>
            <select
              value={curriculumGrade}
              onChange={(e) => setCurriculumGrade(e.target.value)}
              className="input-field w-auto min-w-[140px] text-sm py-2"
            >
              <option value="">All Grades</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
                <option key={g} value={g}>Grade {g}</option>
              ))}
            </select>
          </div>
          {curriculumLoading ? (
            <div className="h-64 skeleton rounded-lg" />
          ) : curriculum.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 font-semibold text-gray-600 sticky left-0 bg-white">Subject</th>
                    {curriculumTopics.slice(0, 15).map((topic, i) => (
                      <th key={i} className="text-center py-2 px-2 font-medium text-gray-500 text-xs max-w-[80px] truncate" title={topic}>
                        {topic?.length > 10 ? topic.slice(0, 10) + '...' : topic}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {curriculumSubjects.map((subject, si) => (
                    <tr key={si}>
                      <td className="py-2 px-3 font-medium text-gray-800 sticky left-0 bg-white">{subject}</td>
                      {curriculumTopics.slice(0, 15).map((topic, ti) => {
                        const count = currMap[`${subject}__${topic}`] || 0;
                        return (
                          <td key={ti} className="text-center py-2 px-2">
                            <span className={`inline-block w-10 h-8 rounded flex items-center justify-center text-xs font-semibold ${getHeatColor(count, maxCurrCount)}`}>
                              {count || '-'}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                <span>Less</span>
                <span className="inline-block w-6 h-4 bg-gray-50 rounded border" />
                <span className="inline-block w-6 h-4 bg-emerald-100 rounded" />
                <span className="inline-block w-6 h-4 bg-emerald-200 rounded" />
                <span className="inline-block w-6 h-4 bg-emerald-400 rounded" />
                <span className="inline-block w-6 h-4 bg-emerald-600 rounded" />
                <span>More</span>
              </div>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
              No curriculum data available
            </div>
          )}
        </motion.div>
      </div>

      {/* ===== FEATURE 9: Comparative Analytics ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Grade Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="card p-6"
        >
          <h3 className="font-display font-bold text-gray-900 mb-4">Grade Comparison</h3>
          <div className="flex items-center gap-3 mb-4">
            <select
              value={grade1}
              onChange={(e) => setGrade1(e.target.value)}
              className="input-field w-auto text-sm py-2"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
                <option key={g} value={g}>Grade {g}</option>
              ))}
            </select>
            <span className="text-sm text-gray-400 font-medium">vs</span>
            <select
              value={grade2}
              onChange={(e) => setGrade2(e.target.value)}
              className="input-field w-auto text-sm py-2"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
                <option key={g} value={g}>Grade {g}</option>
              ))}
            </select>
            <button onClick={fetchGradeComparison} disabled={comparisonLoading} className="btn-primary text-sm py-2">
              {comparisonLoading ? 'Loading...' : 'Compare'}
            </button>
          </div>
          {gradeComparison ? (
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Students', key: 'students' },
                { label: 'Sessions', key: 'sessions' },
                { label: 'Tests', key: 'tests' },
                { label: 'Avg Accuracy', key: 'avg_accuracy', format: v => `${Number(v || 0).toFixed(1)}%` },
              ].map(({ label, key, format }) => {
                const v1 = gradeComparison.grade1?.[key] ?? 0;
                const v2 = gradeComparison.grade2?.[key] ?? 0;
                const display = format || (v => v);
                return (
                  <div key={key} className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 font-medium mb-2">{label}</p>
                    <div className="flex justify-between">
                      <div className="text-center">
                        <p className={`text-lg font-bold ${v1 >= v2 ? 'text-green-600' : 'text-gray-700'}`}>
                          {display(v1)}
                        </p>
                        <p className="text-xs text-gray-400">Gr {gradeComparison.grade1?.grade}</p>
                      </div>
                      <div className="text-center">
                        <p className={`text-lg font-bold ${v2 >= v1 ? 'text-green-600' : 'text-gray-700'}`}>
                          {display(v2)}
                        </p>
                        <p className="text-xs text-gray-400">Gr {gradeComparison.grade2?.grade}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-gray-400 text-sm">
              Select two grades and click Compare
            </div>
          )}
        </motion.div>

        {/* Subject Benchmarks */}
        <ChartCard title="Subject Difficulty Ranking" delay={0.5} loading={benchmarksLoading}>
          {benchmarks.length > 0 ? (
            <ResponsiveContainer width="100%" height={Math.max(250, benchmarks.length * 35)}>
              <BarChart data={benchmarks} layout="vertical" barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis type="number" tick={{ fontSize: 12, fill: '#6b7280' }} domain={[0, 100]} />
                <YAxis
                  type="category"
                  dataKey="subject"
                  width={100}
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Avg Accuracy']}
                />
                <Bar dataKey="avg_accuracy" name="Avg Accuracy" radius={[0, 6, 6, 0]}>
                  {benchmarks.map((entry, i) => {
                    const acc = entry.avg_accuracy || 0;
                    const fill = acc >= 70 ? COLORS.emerald : acc >= 50 ? COLORS.amber : COLORS.rose;
                    return <Cell key={i} fill={fill} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
              No benchmark data available
            </div>
          )}
        </ChartCard>
      </div>

      {/* ===== FEATURE 10: API Cost Tracking ===== */}
      <div className="mt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-gray-900">API Cost Estimation</h3>
            <div className="flex items-center gap-2">
              {[7, 14, 30, 90].map(d => (
                <button
                  key={d}
                  onClick={() => setCostDays(d)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    costDays === d
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>

          {costLoading ? (
            <div className="h-64 skeleton rounded-lg" />
          ) : costData ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500 font-medium">Total Cost</p>
                  <p className="text-xl font-bold text-gray-900">${Number(costData.total_cost_period || 0).toFixed(2)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500 font-medium">Avg Daily</p>
                  <p className="text-xl font-bold text-gray-900">${Number(costData.avg_daily_cost || 0).toFixed(2)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500 font-medium">Classroom AI</p>
                  <p className="text-xl font-bold text-emerald-600">${Number(costData.cost_by_platform?.classroom_ai || 0).toFixed(2)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500 font-medium">AI Tutor</p>
                  <p className="text-xl font-bold text-blue-600">${Number(costData.cost_by_platform?.ai_tutor || 0).toFixed(2)}</p>
                </div>
              </div>

              {costChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={costChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6b7280' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={v => `$${v}`} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`$${Number(v).toFixed(4)}`, 'Est. Cost']} />
                    <Line
                      type="monotone"
                      dataKey="cost"
                      stroke={COLORS.purple}
                      strokeWidth={2.5}
                      dot={{ fill: COLORS.purple, r: 2 }}
                      name="Daily Cost"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
                  No cost data for this period
                </div>
              )}
              <p className="text-xs text-gray-400 mt-3 text-center">
                Costs are estimates based on token usage patterns
              </p>
            </>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
              No cost data available
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

