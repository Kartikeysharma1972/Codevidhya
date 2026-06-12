import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HiOutlineArrowLeft,
  HiOutlineEnvelope,
  HiOutlineAcademicCap,
  HiOutlineTrophy,
  HiOutlineClipboardDocumentCheck,
  HiOutlineChatBubbleLeftRight,
  HiOutlineExclamationTriangle,
} from 'react-icons/hi2';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../utils/api';
import Header from '../components/Header';
import StatsCard from '../components/StatsCard';
import DataTable from '../components/DataTable';

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTimeAgo(dateStr) {
  if (!dateStr) return '-';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(dateStr);
}

export default function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [testHistory, setTestHistory] = useState([]);
  const [performance, setPerformance] = useState(null);
  const [weakAreas, setWeakAreas] = useState([]);
  const [toolUsage, setToolUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStudent();
  }, [id]);

  const fetchStudent = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/students/${id}`);
      setStudent(res.data.student);
      setSessions(res.data.sessions || []);
      setTestHistory(res.data.test_history || []);
      setPerformance(res.data.performance);
      setWeakAreas(res.data.weak_areas || []);
      setToolUsage(res.data.tool_usage || {});
    } catch {
      setError('Failed to load student details.');
    } finally {
      setLoading(false);
    }
  };

  const toolChartData = toolUsage
    ? (Array.isArray(toolUsage)
        ? toolUsage.map((t) => ({
            tool: (t.tool || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
            count: t.count,
          }))
        : Object.entries(toolUsage).map(([tool, count]) => ({
            tool: tool.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
            count,
          })))
    : [];

  const testColumns = [
    {
      key: 'subject',
      label: 'Subject',
      render: (val) => <span className="font-medium text-gray-900">{val || '-'}</span>,
    },
    {
      key: 'score',
      label: 'Score',
      render: (val, row) => (
        <span className="font-semibold">
          {val ?? '-'}{row.totalQuestions ? ` / ${row.totalQuestions}` : ''}
        </span>
      ),
    },
    {
      key: 'accuracy',
      label: 'Accuracy',
      render: (val) => {
        const accuracy = val ?? 0;
        const color = accuracy >= 80 ? 'text-green-600' : accuracy >= 60 ? 'text-amber-600' : 'text-red-600';
        return <span className={`font-semibold ${color}`}>{accuracy.toFixed(1)}%</span>;
      },
    },
    {
      key: 'createdAt',
      label: 'Date',
      render: (val) => <span className="text-gray-500">{formatDate(val)}</span>,
    },
  ];

  const sessionColumns = [
    {
      key: 'tool',
      label: 'Tool',
      render: (val) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700">
          {(val || '-').replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      key: 'title',
      label: 'Title',
      render: (val) => <span className="max-w-xs truncate block">{val || '-'}</span>,
    },
    {
      key: 'updatedAt',
      label: 'Last Active',
      render: (val) => <span className="text-gray-500">{formatTimeAgo(val || '')}</span>,
    },
  ];

  if (loading) {
    return (
      <div>
        <Header title="Student Detail" />
        <div className="space-y-4">
          <div className="skeleton h-32 rounded-xl" />
          <div className="grid grid-cols-3 gap-4">
            <div className="skeleton h-24 rounded-xl" />
            <div className="skeleton h-24 rounded-xl" />
            <div className="skeleton h-24 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Header title="Student Detail" />
        <div className="card p-8 text-center text-red-500">{error}</div>
      </div>
    );
  }

  const avgAccuracy = performance?.avg_accuracy ?? performance?.average_accuracy ?? 0;
  const totalTests = performance?.total_tests ?? testHistory.length;
  const totalSessions = performance?.total_sessions ?? sessions.length;

  return (
    <div>
      <button
        onClick={() => navigate('/students')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 mb-4 transition-colors"
      >
        <HiOutlineArrowLeft className="w-4 h-4" />
        Back to Students
      </button>

      <Header title={student?.name || 'Student'} subtitle="Student details and performance" />

      {/* Student Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-6 mb-6"
      >
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="w-14 h-14 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0">
            {student?.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-display font-bold text-gray-900">{student?.name}</h2>
            <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <HiOutlineEnvelope className="w-4 h-4" />
                {student?.email}
              </span>
              <span className="flex items-center gap-1.5">
                <HiOutlineAcademicCap className="w-4 h-4" />
                Grade {student?.grade || '-'}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatsCard
          title="Avg Accuracy"
          value={`${avgAccuracy.toFixed(1)}%`}
          icon={HiOutlineTrophy}
          color={avgAccuracy >= 80 ? 'emerald' : avgAccuracy >= 60 ? 'amber' : 'rose'}
          delay={0.1}
        />
        <StatsCard
          title="Total Tests"
          value={totalTests}
          icon={HiOutlineClipboardDocumentCheck}
          color="blue"
          delay={0.15}
        />
        <StatsCard
          title="Total Sessions"
          value={totalSessions}
          icon={HiOutlineChatBubbleLeftRight}
          color="purple"
          delay={0.2}
        />
      </div>

      {/* Weak Areas */}
      {weakAreas.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="card p-5 mb-6"
        >
          <div className="flex items-center gap-2 mb-3">
            <HiOutlineExclamationTriangle className="w-5 h-5 text-amber-500" />
            <h3 className="font-display font-bold text-gray-900">Weak Areas</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {weakAreas.map((area, i) => (
              <span
                key={i}
                className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full text-sm font-medium border border-amber-200"
              >
                {typeof area === 'string' ? area : area.area || area.topic || area.subject || '-'}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Tool Usage */}
      {toolChartData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card p-6 mb-6"
        >
          <h3 className="font-display font-bold text-gray-900 mb-4">Tool Usage</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={toolChartData} barSize={36}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="tool" tick={{ fontSize: 11, fill: '#6b7280' }} />
              <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
              <Tooltip
                contentStyle={{
                  borderRadius: '12px',
                  border: 'none',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  fontSize: '13px',
                }}
              />
              <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Test History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="mb-6"
      >
        <h3 className="font-display font-bold text-gray-900 mb-3">Test History</h3>
        <DataTable
          columns={testColumns}
          data={testHistory}
          emptyMessage="No test history available."
        />
      </motion.div>

      {/* Recent Sessions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h3 className="font-display font-bold text-gray-900 mb-3">Recent Sessions</h3>
        <DataTable
          columns={sessionColumns}
          data={sessions}
          onRowClick={(row) => navigate(`/chats?session=${row._id || row.id}`)}
          emptyMessage="No sessions available."
        />
      </motion.div>
    </div>
  );
}
