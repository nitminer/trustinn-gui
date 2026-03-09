'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Search, ChevronUp, ChevronDown } from 'lucide-react';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  isPremium?: boolean;
  createdAt?: string;
}

interface UsersManagementProps {
  onStatsChange: () => void;
}

export default function UsersManagement({ onStatsChange }: UsersManagementProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'date'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);

      // Mock data for demonstration
      const mockUsers = [
        {
          _id: '1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phone: '+1234567890',
          isPremium: true,
          createdAt: '2024-01-15T10:30:00Z'
        },
        {
          _id: '2',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@example.com',
          phone: '+1234567891',
          isPremium: false,
          createdAt: '2024-01-20T14:20:00Z'
        },
        {
          _id: '3',
          firstName: 'Mike',
          lastName: 'Johnson',
          email: 'mike.johnson@example.com',
          phone: '+1234567892',
          isPremium: true,
          createdAt: '2024-01-25T09:15:00Z'
        },
        {
          _id: '4',
          firstName: 'Sarah',
          lastName: 'Williams',
          email: 'sarah.williams@example.com',
          phone: '+1234567893',
          isPremium: false,
          createdAt: '2024-02-01T16:45:00Z'
        },
        {
          _id: '5',
          firstName: 'David',
          lastName: 'Brown',
          email: 'david.brown@example.com',
          phone: '+1234567894',
          isPremium: true,
          createdAt: '2024-02-05T11:30:00Z'
        }
      ];

      // Simulate API delay
      setTimeout(() => {
        setUsers(mockUsers);
        setLoading(false);
      }, 800);

    } catch (error) {
      console.error('Error fetching users:', error);
      setLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Mock user creation
      const newUser = {
        _id: Date.now().toString(),
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        isPremium: false,
        createdAt: new Date().toISOString()
      };

      // Simulate API delay
      setTimeout(() => {
        setUsers(prev => [...prev, newUser]);
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          password: '',
        });
        setShowAddModal(false);
        onStatsChange();
      }, 500);

    } catch (error) {
      console.error('Error adding user:', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      // Mock user deletion
      setTimeout(() => {
        setUsers(prev => prev.filter(user => user._id !== userId));
        onStatsChange();
      }, 500);

    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const filteredUsers = users
    .filter(
      (user) =>
        user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let compareValue = 0;
      if (sortBy === 'name') {
        compareValue = `${a.firstName} ${a.lastName}`.localeCompare(
          `${b.firstName} ${b.lastName}`
        );
      } else if (sortBy === 'email') {
        compareValue = a.email.localeCompare(b.email);
      } else {
        compareValue =
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime();
      }
      return sortOrder === 'asc' ? compareValue : -compareValue;
    });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">User Management</h2>
          <p className="text-gray-400">Manage your user base and permissions</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 transition font-medium"
        >
          <Plus size={18} />
          Add User
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-64 relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:border-blue-600 focus:outline-none"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'name' | 'email' | 'date')}
          className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:border-blue-600 focus:outline-none"
        >
          <option value="name">Sort by Name</option>
          <option value="email">Sort by Email</option>
          <option value="date">Sort by Date</option>
        </select>
        <button
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white hover:bg-gray-700 transition"
        >
          {sortOrder === 'asc' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-900 border-b border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-white">Name</th>
                  <th className="px-6 py-3 text-left font-semibold text-white">Email</th>
                  <th className="px-6 py-3 text-left font-semibold text-white">Phone</th>
                  <th className="px-6 py-3 text-left font-semibold text-white">Status</th>
                  <th className="px-6 py-3 text-left font-semibold text-white">Joined</th>
                  <th className="px-6 py-3 text-center font-semibold text-white">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr
                    key={user._id}
                    className="border-b border-gray-700 hover:bg-gray-750 transition"
                  >
                    <td className="px-6 py-4 font-medium text-white">
                      {user.firstName} {user.lastName}
                    </td>
                    <td className="px-6 py-4 text-gray-300">{user.email}</td>
                    <td className="px-6 py-4 text-gray-300">{user.phone}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          user.isPremium
                            ? 'bg-purple-600/20 text-purple-400'
                            : 'bg-gray-700/50 text-gray-400'
                        }`}
                      >
                        {user.isPremium ? 'Premium' : 'Free'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-300 text-xs">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => setEditingUser(user)}
                          className="p-2 text-blue-400 hover:bg-gray-700 rounded-lg transition"
                          title="Edit user"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user._id)}
                          className="p-2 text-red-400 hover:bg-red-900/30 rounded-lg transition"
                          title="Delete user"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur p-4">
          <div className="bg-gray-900 rounded-lg border border-gray-700 w-full max-w-md">
            <div className="p-6 border-b border-gray-700 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">Add New User</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddUser} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="First Name"
                  required
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:border-blue-600 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  required
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:border-blue-600 focus:outline-none"
                />
              </div>
              <input
                type="email"
                placeholder="Email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:border-blue-600 focus:outline-none"
              />
              <input
                type="tel"
                placeholder="Phone"
                required
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:border-blue-600 focus:outline-none"
              />
              <input
                type="password"
                placeholder="Password"
                required
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:border-blue-600 focus:outline-none"
              />
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition font-medium"
                >
                  Add User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
