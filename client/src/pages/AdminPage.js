import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { FiUserX } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalPages: 0,
    totalUsers: 0,
    totalEdits: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch users
        const usersResponse = await api.get('/users');
        setUsers(usersResponse.data.users);

        // Fetch stats (you might need to create this endpoint)
        const statsResponse = await api.get('/wiki?limit=1');
        setStats({
          totalPages: statsResponse.data.total || 0,
          totalUsers: usersResponse.data.users.length,
          totalEdits: 0 // This should come from backend
        });
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load admin data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDeactivateUser = async (userId) => {
    if (!window.confirm('Deactivate this user? They won\'t be able to log in.')) {
      return;
    }

    try {
      await api.post(`/users/${userId}/deactivate`);
      setUsers(users.map(u => u._id === userId ? { ...u, isActive: false } : u));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to deactivate user');
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    try {
      await api.put(`/users/${userId}`, { role: newRole });
      setUsers(users.map(u => u._id === userId ? { ...u, role: newRole } : u));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user role');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading admin dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg p-8 text-white">
        <h1 className="text-4xl font-bold mb-2">🛡️ Admin Dashboard</h1>
        <p className="text-purple-100">Manage users, content, and system settings</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-6 shadow">
          <div className="text-3xl font-bold text-blue-600">{stats.totalPages}</div>
          <div className="text-gray-600 text-sm mt-2">Total Pages</div>
        </div>
        <div className="bg-white rounded-lg p-6 shadow">
          <div className="text-3xl font-bold text-green-600">{stats.totalUsers}</div>
          <div className="text-gray-600 text-sm mt-2">Active Users</div>
        </div>
        <div className="bg-white rounded-lg p-6 shadow">
          <div className="text-3xl font-bold text-purple-600">{stats.totalEdits}</div>
          <div className="text-gray-600 text-sm mt-2">Total Edits</div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Users Management */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">👥 User Management</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Last Login</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {user.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {user.department || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <select
                      value={user.role}
                      onChange={(e) => handleChangeRole(user._id, e.target.value)}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        user.role === 'admin'
                          ? 'bg-purple-100 text-purple-800'
                          : user.role === 'editor'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <option value="viewer">Viewer</option>
                      <option value="editor">Editor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        user.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {user.lastLogin
                      ? formatDistanceToNow(new Date(user.lastLogin), { addSuffix: true })
                      : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleDeactivateUser(user._id)}
                      disabled={!user.isActive}
                      className="text-red-600 hover:text-red-900 disabled:text-gray-400"
                      title="Deactivate user"
                    >
                      <FiUserX className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="px-6 py-12 text-center text-gray-500">
            No users found
          </div>
        )}
      </div>

      {/* System Info */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-bold text-gray-900 mb-4">🔐 Security Settings</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">JWT Expiration</span>
              <span className="text-gray-900 font-medium">7 days</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Password Hashing</span>
              <span className="text-gray-900 font-medium">bcryptjs</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">CORS Enabled</span>
              <span className="text-green-600 font-medium">✓</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-bold text-gray-900 mb-4">📊 System Info</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Environment</span>
              <span className="text-gray-900 font-medium">Production</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Database</span>
              <span className="text-gray-900 font-medium">MongoDB 7.0</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">API Version</span>
              <span className="text-gray-900 font-medium">v1.0</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
