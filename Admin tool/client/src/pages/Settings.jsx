import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineCog6Tooth,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineXMark,
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
  });
}

export default function Settings() {
  // Admin users state
  const [admins, setAdmins] = useState([]);
  const [adminsLoading, setAdminsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', email: '', password: '', school: '', role: 'admin' });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Portal settings state
  const [settings, setSettings] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState('');
  const [keywordInput, setKeywordInput] = useState('');

  // Local settings form
  const [flaggingKeywords, setFlaggingKeywords] = useState([]);
  const [inactiveDays, setInactiveDays] = useState(14);
  const [accuracyDrop, setAccuracyDrop] = useState(15);
  const [minAccuracy, setMinAccuracy] = useState(40);

  useEffect(() => {
    fetchAdmins();
    fetchSettings();
  }, []);

  const fetchAdmins = async () => {
    setAdminsLoading(true);
    try {
      const res = await api.get('/management/admins');
      setAdmins(res.data.admins || []);
    } catch {
      setAdmins([]);
    } finally {
      setAdminsLoading(false);
    }
  };

  const fetchSettings = async () => {
    setSettingsLoading(true);
    try {
      const res = await api.get('/management/settings');
      const s = res.data.settings || res.data;
      setSettings(s);
      setFlaggingKeywords(s.flagging_keywords || []);
      setInactiveDays(s.inactive_days_threshold ?? 14);
      setAccuracyDrop(s.accuracy_drop_threshold ?? 15);
      setMinAccuracy(s.min_accuracy_threshold ?? 40);
    } catch {
      setSettings(null);
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    setAddError('');
    try {
      await api.post('/management/admins', addForm);
      setShowAddModal(false);
      setAddForm({ name: '', email: '', password: '', school: '', role: 'admin' });
      fetchAdmins();
    } catch (err) {
      setAddError(err.response?.data?.error || 'Failed to add admin.');
    } finally {
      setAddLoading(false);
    }
  };

  const handleDeleteAdmin = async (id) => {
    try {
      await api.delete(`/management/admins/${id}`);
      setDeleteConfirm(null);
      fetchAdmins();
    } catch {
      // silently fail
    }
  };

  const handleSaveSettings = async () => {
    setSettingsSaving(true);
    setSettingsSuccess('');
    try {
      await api.put('/management/settings', {
        flagging_keywords: flaggingKeywords,
        inactive_days_threshold: Number(inactiveDays),
        accuracy_drop_threshold: Number(accuracyDrop),
        min_accuracy_threshold: Number(minAccuracy),
      });
      setSettingsSuccess('Settings saved successfully!');
      setTimeout(() => setSettingsSuccess(''), 3000);
    } catch {
      // silently fail
    } finally {
      setSettingsSaving(false);
    }
  };

  const addKeyword = () => {
    const trimmed = keywordInput.trim();
    if (trimmed && !flaggingKeywords.includes(trimmed)) {
      setFlaggingKeywords([...flaggingKeywords, trimmed]);
    }
    setKeywordInput('');
  };

  const removeKeyword = (kw) => {
    setFlaggingKeywords(flaggingKeywords.filter((k) => k !== kw));
  };

  const adminColumns = [
    {
      key: 'name',
      label: 'Name',
      render: (val) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
            {val?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <span className="font-medium text-gray-900">{val || '-'}</span>
        </div>
      ),
    },
    { key: 'email', label: 'Email' },
    { key: 'school', label: 'School', render: (val) => val || '-' },
    {
      key: 'role',
      label: 'Role',
      render: (val) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-50 text-primary-700 capitalize">
          {val || 'admin'}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Created',
      render: (val) => <span className="text-gray-500">{formatDate(val || '')}</span>,
    },
    {
      key: '_actions',
      label: '',
      render: (_, row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setDeleteConfirm(row._id || row.id);
          }}
          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <HiOutlineTrash className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div>
      <Header title="Settings" subtitle="Manage admins and portal configuration" />

      {/* Admin Users Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-gray-900 flex items-center gap-2">
            <HiOutlineCog6Tooth className="w-5 h-5 text-primary-600" />
            Admin Users
          </h3>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary inline-flex items-center gap-2 text-sm"
          >
            <HiOutlinePlus className="w-4 h-4" />
            Add Admin
          </button>
        </div>
        <DataTable
          columns={adminColumns}
          data={admins}
          loading={adminsLoading}
          emptyMessage="No admin users found."
        />
      </motion.div>

      {/* Portal Settings Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h3 className="font-display font-bold text-gray-900 mb-4 flex items-center gap-2">
          <HiOutlineCog6Tooth className="w-5 h-5 text-primary-600" />
          Portal Settings
        </h3>

        {settingsLoading ? (
          <div className="card p-6 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-12 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="card p-6 space-y-6">
            {/* Flagging Keywords */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Flagging Keywords</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {flaggingKeywords.map((kw, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm font-medium border border-red-200"
                  >
                    {kw}
                    <button onClick={() => removeKeyword(kw)} className="hover:text-red-900">
                      <HiOutlineXMark className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addKeyword(); } }}
                  placeholder="Add keyword and press Enter..."
                  className="input-field flex-1"
                />
                <button onClick={addKeyword} className="btn-secondary text-sm px-4">
                  Add
                </button>
              </div>
            </div>

            {/* Threshold Settings */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Inactive Days Threshold
                </label>
                <input
                  type="number"
                  value={inactiveDays}
                  onChange={(e) => setInactiveDays(e.target.value)}
                  className="input-field"
                  min={1}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Accuracy Drop Threshold (%)
                </label>
                <input
                  type="number"
                  value={accuracyDrop}
                  onChange={(e) => setAccuracyDrop(e.target.value)}
                  className="input-field"
                  min={1}
                  max={100}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Min Accuracy Threshold (%)
                </label>
                <input
                  type="number"
                  value={minAccuracy}
                  onChange={(e) => setMinAccuracy(e.target.value)}
                  className="input-field"
                  min={0}
                  max={100}
                />
              </div>
            </div>

            {/* Save */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleSaveSettings}
                disabled={settingsSaving}
                className="btn-primary inline-flex items-center gap-2"
              >
                {settingsSaving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : null}
                {settingsSaving ? 'Saving...' : 'Save Settings'}
              </button>
              {settingsSuccess && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-green-600 font-medium"
                >
                  {settingsSuccess}
                </motion.span>
              )}
            </div>
          </div>
        )}
      </motion.div>

      {/* Add Admin Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-display font-bold text-gray-900">Add Admin</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <HiOutlineXMark className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <form onSubmit={handleAddAdmin} className="p-6 space-y-4">
                {addError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                    {addError}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
                  <input
                    type="text"
                    required
                    value={addForm.name}
                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                    className="input-field"
                    placeholder="Full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                  <input
                    type="email"
                    required
                    value={addForm.email}
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    className="input-field"
                    placeholder="admin@school.edu"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={addForm.password}
                    onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                    className="input-field"
                    placeholder="Min 6 characters"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">School</label>
                  <input
                    type="text"
                    value={addForm.school}
                    onChange={(e) => setAddForm({ ...addForm, school: e.target.value })}
                    className="input-field"
                    placeholder="School name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
                  <select
                    value={addForm.role}
                    onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                    className="input-field"
                  >
                    <option value="admin">Admin</option>
                    <option value="superadmin">Super Admin</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {addLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : null}
                  {addLoading ? 'Creating...' : 'Create Admin'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6"
            >
              <h3 className="font-display font-bold text-gray-900 mb-2">Delete Admin</h3>
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to delete this admin? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="btn-secondary text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteAdmin(deleteConfirm)}
                  className="bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg px-4 py-2.5 text-sm transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
