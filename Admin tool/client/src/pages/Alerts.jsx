import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HiOutlineBellAlert,
  HiOutlineArrowTrendingDown,
  HiOutlineClock,
  HiOutlineExclamationTriangle,
} from 'react-icons/hi2';
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

export default function Alerts() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/alerts/at-risk');
      setData(res.data);
    } catch {
      setError('Failed to load alert data.');
    } finally {
      setLoading(false);
    }
  };

  const declining = data?.declining || [];
  const inactive = data?.inactive || [];
  const struggling = data?.struggling || [];
  const totalAtRisk = (data?.summary?.total_at_risk) ?? (declining.length + inactive.length + struggling.length);

  const decliningColumns = [
    {
      key: 'name',
      label: 'Student',
      render: (val) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-rose-100 text-rose-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
            {val?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <span className="font-medium text-gray-900">{val || '-'}</span>
        </div>
      ),
    },
    {
      key: 'grade',
      label: 'Grade',
      render: (val) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700">
          Grade {val || '-'}
        </span>
      ),
    },
    {
      key: 'recent_avg',
      label: 'Recent Avg%',
      render: (val) => <span className="font-semibold">{val != null ? `${Number(val).toFixed(1)}%` : '-'}</span>,
    },
    {
      key: 'previous_avg',
      label: 'Previous Avg%',
      render: (val) => <span className="text-gray-600">{val != null ? `${Number(val).toFixed(1)}%` : '-'}</span>,
    },
    {
      key: 'drop_pct',
      label: 'Drop%',
      render: (val) => {
        const drop = Number(val) || 0;
        return (
          <span className={`font-bold ${drop > 20 ? 'text-red-600' : 'text-amber-600'}`}>
            {drop.toFixed(1)}%
          </span>
        );
      },
    },
  ];

  const inactiveColumns = [
    {
      key: 'name',
      label: 'Student',
      render: (val) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
            {val?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <span className="font-medium text-gray-900">{val || '-'}</span>
        </div>
      ),
    },
    {
      key: 'grade',
      label: 'Grade',
      render: (val) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700">
          Grade {val || '-'}
        </span>
      ),
    },
    { key: 'email', label: 'Email' },
    {
      key: 'last_active',
      label: 'Last Active',
      render: (val) => <span className="text-gray-500">{formatDate(val)}</span>,
    },
    {
      key: 'days_inactive',
      label: 'Days Inactive',
      render: (val) => (
        <span className={`font-semibold ${(val || 0) > 30 ? 'text-red-600' : 'text-amber-600'}`}>
          {val ?? '-'}
        </span>
      ),
    },
  ];

  const strugglingColumns = [
    {
      key: 'name',
      label: 'Student',
      render: (val) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-red-100 text-red-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
            {val?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <span className="font-medium text-gray-900">{val || '-'}</span>
        </div>
      ),
    },
    {
      key: 'grade',
      label: 'Grade',
      render: (val) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700">
          Grade {val || '-'}
        </span>
      ),
    },
    {
      key: 'avg_accuracy',
      label: 'Avg Accuracy%',
      render: (val) => {
        const acc = Number(val) || 0;
        return (
          <span className={`font-bold ${acc < 40 ? 'text-red-600' : 'text-amber-600'}`}>
            {acc.toFixed(1)}%
          </span>
        );
      },
    },
    {
      key: 'total_tests',
      label: 'Total Tests',
      render: (val) => val ?? 0,
    },
  ];

  if (error) {
    return (
      <div>
        <Header title="Student Risk Alerts" subtitle="Monitor at-risk students" />
        <div className="card p-8 text-center text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div>
      <Header title="Student Risk Alerts" subtitle="Monitor at-risk students" />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard
          title="Total At-Risk"
          value={loading ? null : totalAtRisk}
          icon={HiOutlineBellAlert}
          color="rose"
          delay={0}
        />
        <StatsCard
          title="Declining Performance"
          value={loading ? null : declining.length}
          icon={HiOutlineArrowTrendingDown}
          color="amber"
          delay={0.05}
        />
        <StatsCard
          title="Inactive Students"
          value={loading ? null : inactive.length}
          icon={HiOutlineClock}
          color="rose"
          delay={0.1}
        />
        <StatsCard
          title="Struggling Students"
          value={loading ? null : struggling.length}
          icon={HiOutlineExclamationTriangle}
          color="rose"
          delay={0.15}
        />
      </div>

      {/* Declining Performance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-8"
      >
        <h3 className="font-display font-bold text-gray-900 mb-3 flex items-center gap-2">
          <HiOutlineArrowTrendingDown className="w-5 h-5 text-amber-500" />
          Declining Performance
        </h3>
        <DataTable
          columns={decliningColumns}
          data={declining}
          loading={loading}
          onRowClick={(row) => navigate(`/students/${row._id || row.id || row.student_id}`)}
          emptyMessage="No students with declining performance."
        />
      </motion.div>

      {/* Inactive Students */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-8"
      >
        <h3 className="font-display font-bold text-gray-900 mb-3 flex items-center gap-2">
          <HiOutlineClock className="w-5 h-5 text-amber-500" />
          Inactive Students
        </h3>
        <DataTable
          columns={inactiveColumns}
          data={inactive}
          loading={loading}
          onRowClick={(row) => navigate(`/students/${row._id || row.id || row.student_id}`)}
          emptyMessage="No inactive students."
        />
      </motion.div>

      {/* Struggling Students */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h3 className="font-display font-bold text-gray-900 mb-3 flex items-center gap-2">
          <HiOutlineExclamationTriangle className="w-5 h-5 text-red-500" />
          Struggling Students
        </h3>
        <DataTable
          columns={strugglingColumns}
          data={struggling}
          loading={loading}
          onRowClick={(row) => navigate(`/students/${row._id || row.id || row.student_id}`)}
          emptyMessage="No struggling students."
        />
      </motion.div>
    </div>
  );
}
