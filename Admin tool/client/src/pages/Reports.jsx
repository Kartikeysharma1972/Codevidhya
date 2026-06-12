import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HiOutlinePrinter } from 'react-icons/hi2';
import api from '../utils/api';
import Header from '../components/Header';

export default function Reports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await api.get('/export/report');
      setData(res.data);
    } catch {
      setError('Failed to load report data.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <Header title="Reports" subtitle="Printable summary report" />
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-32 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Header title="Reports" subtitle="Printable summary report" />
        <div className="card p-8 text-center text-red-500">{error}</div>
      </div>
    );
  }

  const overview = data?.overview || {};
  const trends = data?.trends || {};
  const gradePerformance = data?.grade_performance || [];
  const toolUsage = data?.tool_usage || [];
  const topTeachers = data?.top_teachers || [];
  const atRiskSummary = data?.at_risk_summary || {};

  return (
    <div>
      <div className="no-print">
        <Header title="Reports" subtitle="Printable summary report" />
      </div>

      {/* Print Button */}
      <div className="no-print mb-6">
        <button
          onClick={() => window.print()}
          className="btn-primary inline-flex items-center gap-2"
        >
          <HiOutlinePrinter className="w-5 h-5" />
          Print Report
        </button>
      </div>

      {/* Report Content */}
      <div className="space-y-6 max-w-4xl">
        {/* Print Header */}
        <div className="print-only mb-8">
          <h1 className="text-2xl font-display font-bold text-gray-900">Codevidhya School Admin Report</h1>
          <p className="text-sm text-gray-500 mt-1">
            Generated on {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Overview Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6"
        >
          <h2 className="font-display font-bold text-lg text-gray-900 mb-4 border-b border-gray-100 pb-2">
            Overview
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total Teachers', value: overview.teachers ?? '-' },
              { label: 'Total Students', value: overview.students ?? '-' },
              { label: 'Total Lessons', value: overview.lessons ?? '-' },
              { label: 'Total Tests', value: overview.tests ?? '-' },
              { label: 'Active Teachers', value: overview.active_teachers ?? '-' },
              { label: 'Active Students', value: overview.active_students ?? '-' },
              { label: 'Avg Accuracy', value: overview.avg_accuracy != null ? `${Number(overview.avg_accuracy).toFixed(1)}%` : '-' },
              { label: 'Total Sessions', value: overview.total_sessions ?? '-' },
            ].map((stat, i) => (
              <div key={i} className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Trends */}
        {Object.keys(trends).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card p-6"
          >
            <h2 className="font-display font-bold text-lg text-gray-900 mb-4 border-b border-gray-100 pb-2">
              Weekly Trends
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Object.entries(trends).map(([key, val], i) => {
                const change = val?.change_pct ?? 0;
                return (
                  <div key={i} className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 font-medium capitalize">{key}</p>
                    <p className="text-xl font-bold text-gray-900 mt-1">{val?.current ?? '-'}</p>
                    <p className={`text-xs font-medium mt-1 ${change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                      {change > 0 ? '+' : ''}{change.toFixed(1)}% vs last week
                    </p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Grade Performance */}
        {gradePerformance.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card p-6"
          >
            <h2 className="font-display font-bold text-lg text-gray-900 mb-4 border-b border-gray-100 pb-2">
              Grade Performance
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 font-semibold text-gray-600">Grade</th>
                    <th className="text-left py-2 px-3 font-semibold text-gray-600">Students</th>
                    <th className="text-left py-2 px-3 font-semibold text-gray-600">Avg Accuracy</th>
                    <th className="text-left py-2 px-3 font-semibold text-gray-600">Tests</th>
                    <th className="text-left py-2 px-3 font-semibold text-gray-600">Sessions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {gradePerformance.map((g, i) => (
                    <tr key={i}>
                      <td className="py-2 px-3 font-medium">Grade {g.grade}</td>
                      <td className="py-2 px-3">{g.students ?? '-'}</td>
                      <td className="py-2 px-3">
                        <span className={`font-semibold ${(g.avg_accuracy || 0) >= 70 ? 'text-green-600' : 'text-amber-600'}`}>
                          {g.avg_accuracy != null ? `${Number(g.avg_accuracy).toFixed(1)}%` : '-'}
                        </span>
                      </td>
                      <td className="py-2 px-3">{g.test_count ?? g.tests ?? '-'}</td>
                      <td className="py-2 px-3">{g.session_count ?? g.sessions ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Tool Usage */}
        {toolUsage.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card p-6"
          >
            <h2 className="font-display font-bold text-lg text-gray-900 mb-4 border-b border-gray-100 pb-2">
              Tool Usage
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 font-semibold text-gray-600">Tool</th>
                    <th className="text-left py-2 px-3 font-semibold text-gray-600">Usage Count</th>
                    <th className="text-left py-2 px-3 font-semibold text-gray-600">% of Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {toolUsage.map((t, i) => (
                    <tr key={i}>
                      <td className="py-2 px-3 font-medium">
                        {(t.tool_name || t.tool || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                      </td>
                      <td className="py-2 px-3">{t.count ?? '-'}</td>
                      <td className="py-2 px-3">{t.percentage != null ? `${Number(t.percentage).toFixed(1)}%` : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Top Teachers */}
        {topTeachers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card p-6"
          >
            <h2 className="font-display font-bold text-lg text-gray-900 mb-4 border-b border-gray-100 pb-2">
              Top Teachers
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 font-semibold text-gray-600">Name</th>
                    <th className="text-left py-2 px-3 font-semibold text-gray-600">Email</th>
                    <th className="text-left py-2 px-3 font-semibold text-gray-600">School</th>
                    <th className="text-left py-2 px-3 font-semibold text-gray-600">Lessons</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {topTeachers.map((t, i) => (
                    <tr key={i}>
                      <td className="py-2 px-3 font-medium">{t.name}</td>
                      <td className="py-2 px-3 text-gray-500">{t.email}</td>
                      <td className="py-2 px-3">{t.school_name || '-'}</td>
                      <td className="py-2 px-3 font-semibold text-primary-700">{t.total_lessons ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* At-Risk Summary */}
        {Object.keys(atRiskSummary).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="card p-6"
          >
            <h2 className="font-display font-bold text-lg text-gray-900 mb-4 border-b border-gray-100 pb-2">
              At-Risk Summary
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Total At-Risk', value: atRiskSummary.total ?? '-', color: 'text-red-600' },
                { label: 'Declining', value: atRiskSummary.declining ?? '-', color: 'text-amber-600' },
                { label: 'Inactive', value: atRiskSummary.inactive ?? '-', color: 'text-amber-600' },
                { label: 'Struggling', value: atRiskSummary.struggling ?? '-', color: 'text-red-600' },
              ].map((stat, i) => (
                <div key={i} className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
                  <p className={`text-xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
