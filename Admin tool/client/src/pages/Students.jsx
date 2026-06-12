import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineMagnifyingGlass, HiOutlineFunnel } from 'react-icons/hi2';
import api from '../utils/api';
import Header from '../components/Header';
import DataTable from '../components/DataTable';
import ExportButton from '../components/ExportButton';
import OnlineBadge from '../components/OnlineBadge';

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function Students() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [grade, setGrade] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [onlineIds, setOnlineIds] = useState(new Set());

  useEffect(() => {
    setPage(1);
  }, [search, grade]);

  useEffect(() => {
    fetchStudents();
  }, [page, grade, search]);

  useEffect(() => {
    fetchOnline();
    const interval = setInterval(fetchOnline, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (grade) params.grade = grade;
      if (search) params.search = search;
      const res = await api.get('/students', { params });
      setStudents(res.data.students || []);
      setTotal(res.data.total || 0);
      setPages(res.data.pages || 1);
    } catch {
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchOnline = async () => {
    try {
      const res = await api.get('/online');
      const ids = new Set(res.data.students.online.map((s) => s._id));
      setOnlineIds(ids);
    } catch {}
  };

  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (val, row) => (
        <div className="flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">
              {val?.charAt(0)?.toUpperCase() || '?'}
            </div>
            {onlineIds.has(row._id) && (
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full">
                <span className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-75" />
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">{val || '-'}</span>
            {onlineIds.has(row._id) && (
              <span className="text-[10px] font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">ONLINE</span>
            )}
          </div>
        </div>
      ),
    },
    { key: 'email', label: 'Email' },
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
      key: 'session_count',
      label: 'Sessions',
      render: (val) => val ?? 0,
    },
    {
      key: 'test_count',
      label: 'Tests Taken',
      render: (val) => val ?? 0,
    },
    {
      key: 'createdAt',
      label: 'Joined',
      render: (val) => <span className="text-gray-500">{formatDate(val)}</span>,
    },
  ];

  return (
    <div>
      <Header title="Students" subtitle={`${total} total students`} />

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row gap-3 mb-6"
      >
        <div className="relative flex-1 max-w-md">
          <HiOutlineMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search students by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-11"
          />
        </div>
        <div className="relative">
          <HiOutlineFunnel className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            className="input-field pl-10 pr-8 w-auto min-w-[160px] appearance-none cursor-pointer"
          >
            <option value="">All Grades</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
              <option key={g} value={g}>
                Grade {g}
              </option>
            ))}
          </select>
        </div>
        <ExportButton
          endpoint={`/export/students?format=csv${grade ? `&grade=${grade}` : ''}`}
          filename="students.csv"
        />
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <DataTable
          columns={columns}
          data={students}
          loading={loading}
          onRowClick={(row) => navigate(`/students/${row._id || row.id}`)}
          emptyMessage="No students found."
        />

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary text-sm px-3 py-1.5 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-sm text-gray-500">
              Page {page} of {pages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              disabled={page === pages}
              className="btn-secondary text-sm px-3 py-1.5 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
