import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineMagnifyingGlass,
  HiOutlineFunnel,
  HiOutlineXMark,
  HiOutlineArrowLeft,
  HiOutlineUserCircle,
  HiOutlineCpuChip,
  HiOutlineFlag,
  HiOutlineShieldExclamation,
} from 'react-icons/hi2';
import api from '../utils/api';
import Header from '../components/Header';
import DataTable from '../components/DataTable';

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
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
  return new Date(dateStr).toLocaleDateString();
}

export default function ChatMonitor() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState('teacher');

  // Teacher chats state
  const [teacherChats, setTeacherChats] = useState([]);
  const [teacherTotal, setTeacherTotal] = useState(0);
  const [teacherPage, setTeacherPage] = useState(1);
  const [teacherPages, setTeacherPages] = useState(1);
  const [teacherLoading, setTeacherLoading] = useState(false);
  const [teacherSearch, setTeacherSearch] = useState('');
  const [teacherToolFilter, setTeacherToolFilter] = useState('');
  const [selectedTeacherChat, setSelectedTeacherChat] = useState(null);

  // Student chats state
  const [studentChats, setStudentChats] = useState([]);
  const [studentTotal, setStudentTotal] = useState(0);
  const [studentPage, setStudentPage] = useState(1);
  const [studentPages, setStudentPages] = useState(1);
  const [studentLoading, setStudentLoading] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentToolFilter, setStudentToolFilter] = useState('');

  // Flagged chats state
  const [flaggedChats, setFlaggedChats] = useState([]);
  const [flaggedLoading, setFlaggedLoading] = useState(false);
  const [selectedFlagged, setSelectedFlagged] = useState(null);
  const [reviewStatus, setReviewStatus] = useState('reviewed');
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewSaving, setReviewSaving] = useState(false);

  // Flag modal state
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [flagTarget, setFlagTarget] = useState(null);
  const [flagReason, setFlagReason] = useState('');
  const [flagging, setFlagging] = useState(false);

  // Scan state
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  // Toast state
  const [toast, setToast] = useState('');

  // Session detail view
  const [sessionDetail, setSessionDetail] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(false);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  // Check for session param from URL
  useEffect(() => {
    const sessionId = searchParams.get('session');
    if (sessionId) {
      setTab('student');
      fetchSessionDetail(sessionId);
    }
  }, [searchParams]);

  // Fetch teacher chats
  useEffect(() => {
    if (tab === 'teacher') fetchTeacherChats();
  }, [tab, teacherPage, teacherSearch, teacherToolFilter]);

  // Fetch student chats
  useEffect(() => {
    if (tab === 'student' && !sessionDetail) fetchStudentChats();
  }, [tab, studentPage, studentSearch, studentToolFilter]);

  // Fetch flagged chats
  useEffect(() => {
    if (tab === 'flagged') fetchFlaggedChats();
  }, [tab]);

  const fetchTeacherChats = async () => {
    setTeacherLoading(true);
    try {
      const params = { page: teacherPage, limit: 20 };
      if (teacherSearch) params.search = teacherSearch;
      if (teacherToolFilter) params.tool_filter = teacherToolFilter;
      const res = await api.get('/chats/teacher-chats', { params });
      setTeacherChats(res.data.chats || []);
      setTeacherTotal(res.data.total || 0);
      setTeacherPages(res.data.pages || 1);
    } catch {
      setTeacherChats([]);
    } finally {
      setTeacherLoading(false);
    }
  };

  const fetchStudentChats = async () => {
    setStudentLoading(true);
    try {
      const params = { page: studentPage, limit: 20 };
      if (studentSearch) params.search = studentSearch;
      if (studentToolFilter) params.tool = studentToolFilter;
      const res = await api.get('/chats/student-chats', { params });
      setStudentChats(res.data.chats || []);
      setStudentTotal(res.data.total || 0);
      setStudentPages(res.data.pages || 1);
    } catch {
      setStudentChats([]);
    } finally {
      setStudentLoading(false);
    }
  };

  const fetchFlaggedChats = async () => {
    setFlaggedLoading(true);
    try {
      const res = await api.get('/moderation/flagged', { params: { status: 'pending' } });
      setFlaggedChats(res.data.flagged || res.data.chats || []);
    } catch {
      setFlaggedChats([]);
    } finally {
      setFlaggedLoading(false);
    }
  };

  const fetchSessionDetail = async (sessionId) => {
    setSessionLoading(true);
    try {
      const res = await api.get(`/chats/student-chats/${sessionId}`);
      setSessionDetail(res.data.session || res.data);
    } catch {
      setSessionDetail(null);
    } finally {
      setSessionLoading(false);
    }
  };

  const handleFlag = async () => {
    if (!flagTarget || !flagReason.trim()) return;
    setFlagging(true);
    try {
      await api.post('/moderation/flag', {
        chatType: flagTarget.type,
        chatId: flagTarget.id,
        reason: flagReason.trim(),
      });
      showToast('Chat flagged successfully');
      setShowFlagModal(false);
      setFlagTarget(null);
      setFlagReason('');
    } catch {
      showToast('Failed to flag chat');
    } finally {
      setFlagging(false);
    }
  };

  const handleReview = async () => {
    if (!selectedFlagged) return;
    setReviewSaving(true);
    try {
      await api.put(`/moderation/flagged/${selectedFlagged._id || selectedFlagged.id}/review`, {
        status: reviewStatus,
        notes: reviewNotes,
      });
      showToast('Review saved successfully');
      setSelectedFlagged(null);
      setReviewStatus('reviewed');
      setReviewNotes('');
      fetchFlaggedChats();
    } catch {
      showToast('Failed to save review');
    } finally {
      setReviewSaving(false);
    }
  };

  const handleScan = async () => {
    setScanning(true);
    setScanResult(null);
    try {
      const res = await api.post('/moderation/scan');
      setScanResult(res.data);
      showToast(`Scan complete: ${res.data.flagged_count ?? 0} items flagged`);
      if (tab === 'flagged') fetchFlaggedChats();
    } catch {
      showToast('Scan failed');
    } finally {
      setScanning(false);
    }
  };

  const openFlagModal = (type, id) => {
    setFlagTarget({ type, id });
    setFlagReason('');
    setShowFlagModal(true);
  };

  const teacherChatColumns = [
    {
      key: 'teacher_name',
      label: 'Teacher',
      render: (val) => (
        <span className="font-medium text-gray-900">{val || '-'}</span>
      ),
    },
    {
      key: 'tool_name',
      label: 'Tool',
      render: (val) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700">
          {(val || '-').replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      key: 'topic',
      label: 'Topic',
      render: (val) => <span className="max-w-xs truncate block text-gray-700">{val || '-'}</span>,
    },
    {
      key: 'grade_level',
      label: 'Grade',
      render: (val) => val || '-',
    },
    {
      key: 'subject',
      label: 'Subject',
      render: (val) => val || '-',
    },
    {
      key: 'created_at',
      label: 'Date',
      render: (val) => <span className="text-gray-500 whitespace-nowrap">{formatTimeAgo(val)}</span>,
    },
    {
      key: '_flag',
      label: '',
      render: (_, row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            openFlagModal('teacher', row._id || row.id);
          }}
          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Flag this chat"
        >
          <HiOutlineFlag className="w-4 h-4" />
        </button>
      ),
    },
  ];

  const studentChatColumns = [
    {
      key: 'user',
      label: 'Student',
      render: (val) => (
        <span className="font-medium text-gray-900">{val?.name || '-'}</span>
      ),
    },
    {
      key: 'tool',
      label: 'Tool',
      render: (val) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
          {(val || '-').replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      key: 'title',
      label: 'Title',
      render: (val) => <span className="max-w-xs truncate block text-gray-700">{val || '-'}</span>,
    },
    {
      key: 'messageCount',
      label: 'Messages',
      render: (val) => val ?? 0,
    },
    {
      key: 'updatedAt',
      label: 'Last Active',
      render: (val) => (
        <span className="text-gray-500 whitespace-nowrap">
          {formatTimeAgo(val)}
        </span>
      ),
    },
    {
      key: '_flag',
      label: '',
      render: (_, row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            openFlagModal('student', row._id || row.id);
          }}
          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Flag this chat"
        >
          <HiOutlineFlag className="w-4 h-4" />
        </button>
      ),
    },
  ];

  const flaggedColumns = [
    {
      key: 'chat_type',
      label: 'Type',
      render: (val) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          val === 'teacher' ? 'bg-primary-50 text-primary-700' : 'bg-blue-50 text-blue-700'
        }`}>
          {val || '-'}
        </span>
      ),
    },
    {
      key: 'reason',
      label: 'Reason',
      render: (val) => <span className="max-w-xs truncate block text-gray-700">{val || '-'}</span>,
    },
    {
      key: 'flagged_by',
      label: 'Flagged By',
      render: (val) => val || '-',
    },
    {
      key: 'created_at',
      label: 'Date',
      render: (val) => <span className="text-gray-500 whitespace-nowrap">{formatTimeAgo(val)}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => {
        const colors = {
          pending: 'bg-amber-50 text-amber-700',
          reviewed: 'bg-green-50 text-green-700',
          escalated: 'bg-red-50 text-red-700',
          dismissed: 'bg-gray-100 text-gray-600',
        };
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[val] || colors.pending}`}>
            {val || 'pending'}
          </span>
        );
      },
    },
  ];

  // Session detail view
  if (sessionDetail) {
    const messages = sessionDetail.messages || [];
    return (
      <div>
        <button
          onClick={() => {
            setSessionDetail(null);
            setSearchParams({});
          }}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 mb-4 transition-colors"
        >
          <HiOutlineArrowLeft className="w-4 h-4" />
          Back to Chat Monitor
        </button>

        <Header
          title={sessionDetail.title || 'Chat Session'}
          subtitle={`${(sessionDetail.tool || '').replace(/_/g, ' ')} | ${messages.length} messages`}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6 max-w-3xl"
        >
          {sessionLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton h-16 rounded-lg" />
              ))}
            </div>
          ) : messages.length > 0 ? (
            <div className="space-y-4">
              {messages.map((msg, i) => {
                const isUser = msg.role === 'user' || msg.sender === 'user';
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`flex gap-3 ${isUser ? '' : 'flex-row-reverse'}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isUser ? 'bg-blue-100 text-blue-600' : 'bg-primary-100 text-primary-600'
                    }`}>
                      {isUser ? (
                        <HiOutlineUserCircle className="w-5 h-5" />
                      ) : (
                        <HiOutlineCpuChip className="w-5 h-5" />
                      )}
                    </div>
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${
                        isUser
                          ? 'bg-blue-50 text-blue-900 rounded-tl-md'
                          : 'bg-gray-50 text-gray-800 rounded-tr-md'
                      }`}
                    >
                      {msg.content || msg.text || '-'}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-gray-400 py-8">No messages in this session.</p>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div>
      <Header title="Chat Monitor" subtitle="Monitor all teacher and student conversations" />

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap bg-gray-100 rounded-lg p-1 mb-6 max-w-lg"
      >
        {[
          { key: 'teacher', label: 'Teacher Chats' },
          { key: 'student', label: 'Student Chats' },
          { key: 'flagged', label: 'Flagged Chats' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-all duration-200 ${
              tab === t.key
                ? 'bg-white text-primary-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </motion.div>

      {/* Teacher Chats Tab */}
      {tab === 'teacher' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1 max-w-md">
              <HiOutlineMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by topic or teacher..."
                value={teacherSearch}
                onChange={(e) => {
                  setTeacherSearch(e.target.value);
                  setTeacherPage(1);
                }}
                className="input-field pl-11"
              />
            </div>
            <div className="relative">
              <HiOutlineFunnel className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Filter by tool..."
                value={teacherToolFilter}
                onChange={(e) => {
                  setTeacherToolFilter(e.target.value);
                  setTeacherPage(1);
                }}
                className="input-field pl-10 w-auto min-w-[180px]"
              />
            </div>
          </div>

          <DataTable
            columns={teacherChatColumns}
            data={teacherChats}
            loading={teacherLoading}
            onRowClick={(row) => setSelectedTeacherChat(row)}
            emptyMessage="No teacher chats found."
          />

          {teacherPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                onClick={() => setTeacherPage((p) => Math.max(1, p - 1))}
                disabled={teacherPage === 1}
                className="btn-secondary text-sm px-3 py-1.5 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm text-gray-500">
                Page {teacherPage} of {teacherPages}
              </span>
              <button
                onClick={() => setTeacherPage((p) => Math.min(teacherPages, p + 1))}
                disabled={teacherPage === teacherPages}
                className="btn-secondary text-sm px-3 py-1.5 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* Student Chats Tab */}
      {tab === 'student' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1 max-w-md">
              <HiOutlineMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by student or title..."
                value={studentSearch}
                onChange={(e) => {
                  setStudentSearch(e.target.value);
                  setStudentPage(1);
                }}
                className="input-field pl-11"
              />
            </div>
            <div className="relative">
              <HiOutlineFunnel className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Filter by tool..."
                value={studentToolFilter}
                onChange={(e) => {
                  setStudentToolFilter(e.target.value);
                  setStudentPage(1);
                }}
                className="input-field pl-10 w-auto min-w-[180px]"
              />
            </div>
          </div>

          <DataTable
            columns={studentChatColumns}
            data={studentChats}
            loading={studentLoading}
            onRowClick={(row) => fetchSessionDetail(row._id || row.id)}
            emptyMessage="No student chats found."
          />

          {studentPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                onClick={() => setStudentPage((p) => Math.max(1, p - 1))}
                disabled={studentPage === 1}
                className="btn-secondary text-sm px-3 py-1.5 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm text-gray-500">
                Page {studentPage} of {studentPages}
              </span>
              <button
                onClick={() => setStudentPage((p) => Math.min(studentPages, p + 1))}
                disabled={studentPage === studentPages}
                className="btn-secondary text-sm px-3 py-1.5 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* Flagged Chats Tab */}
      {tab === 'flagged' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={handleScan}
              disabled={scanning}
              className="btn-secondary inline-flex items-center gap-2 text-sm"
            >
              {scanning ? (
                <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
              ) : (
                <HiOutlineShieldExclamation className="w-4 h-4" />
              )}
              {scanning ? 'Scanning...' : 'Scan for Keywords'}
            </button>
            {scanResult && (
              <span className="text-sm text-gray-500">
                {scanResult.flagged_count ?? 0} items flagged, {scanResult.scanned ?? 0} scanned
              </span>
            )}
          </div>

          <DataTable
            columns={flaggedColumns}
            data={flaggedChats}
            loading={flaggedLoading}
            onRowClick={(row) => {
              setSelectedFlagged(row);
              setReviewStatus(row.status || 'reviewed');
              setReviewNotes(row.review_notes || '');
            }}
            emptyMessage="No flagged chats found."
          />
        </motion.div>
      )}

      {/* Teacher Chat Detail Modal */}
      <AnimatePresence>
        {selectedTeacherChat && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedTeacherChat(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
            >
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="font-display font-bold text-gray-900">
                    {selectedTeacherChat.topic || 'Chat Detail'}
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {selectedTeacherChat.teacher_name || '-'} | {(selectedTeacherChat.tool_name || '').replace(/_/g, ' ')} | {selectedTeacherChat.subject || '-'} | Grade {selectedTeacherChat.grade_level || '-'}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedTeacherChat(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <HiOutlineXMark className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto flex-1">
                <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                  {selectedTeacherChat.response_content || selectedTeacherChat.content || 'No content available.'}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Flag Modal */}
      <AnimatePresence>
        {showFlagModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={() => setShowFlagModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <HiOutlineFlag className="w-5 h-5 text-red-500" />
                <h3 className="font-display font-bold text-gray-900">Flag Chat</h3>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Reason</label>
                <input
                  type="text"
                  value={flagReason}
                  onChange={(e) => setFlagReason(e.target.value)}
                  placeholder="Why are you flagging this chat?"
                  className="input-field"
                  autoFocus
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setShowFlagModal(false)} className="btn-secondary text-sm">
                  Cancel
                </button>
                <button
                  onClick={handleFlag}
                  disabled={!flagReason.trim() || flagging}
                  className="bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg px-4 py-2.5 text-sm transition-colors disabled:opacity-50"
                >
                  {flagging ? 'Flagging...' : 'Flag'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Flagged Chat Review Modal */}
      <AnimatePresence>
        {selectedFlagged && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedFlagged(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col"
            >
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-display font-bold text-gray-900">Review Flagged Chat</h3>
                <button
                  onClick={() => setSelectedFlagged(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <HiOutlineXMark className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                {/* Flagged info */}
                <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-1">
                  <p><span className="font-medium text-gray-700">Type:</span> {selectedFlagged.chat_type || '-'}</p>
                  <p><span className="font-medium text-gray-700">Reason:</span> {selectedFlagged.reason || '-'}</p>
                  <p><span className="font-medium text-gray-700">Flagged By:</span> {selectedFlagged.flagged_by || '-'}</p>
                  <p><span className="font-medium text-gray-700">Date:</span> {formatDate(selectedFlagged.created_at)}</p>
                </div>

                {/* Chat content */}
                {(selectedFlagged.content || selectedFlagged.chat_content) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Chat Content</label>
                    <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap max-h-40 overflow-y-auto">
                      {selectedFlagged.content || selectedFlagged.chat_content}
                    </div>
                  </div>
                )}

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                  <select
                    value={reviewStatus}
                    onChange={(e) => setReviewStatus(e.target.value)}
                    className="input-field"
                  >
                    <option value="reviewed">Reviewed</option>
                    <option value="escalated">Escalated</option>
                    <option value="dismissed">Dismissed</option>
                  </select>
                </div>

                {/* Review notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Review Notes</label>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Add review notes..."
                    className="input-field min-h-[80px] resize-y"
                    rows={3}
                  />
                </div>

                <button
                  onClick={handleReview}
                  disabled={reviewSaving}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {reviewSaving ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : null}
                  {reviewSaving ? 'Saving...' : 'Save Review'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
