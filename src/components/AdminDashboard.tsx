import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, CreditCard, Package, TrendingUp, Search, Plus, Edit, Trash2, ChevronDown, Download, Filter, MoreVertical, DollarSign, Activity, UserCheck, Menu, X, Home, Settings, Bell, HelpCircle, LogOut, BarChart3 } from 'lucide-react';

interface StatCardProps {
  icon: React.ComponentType<any>;
  title: string;
  value: string | number;
  change: number;
  color: string;
}

interface NavItemProps {
  icon: React.ComponentType<any>;
  label: string;
  active?: boolean;
  onClick?: () => void;
  collapsed: boolean;
}

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Sample data
  const [stats] = useState({
    totalRevenue: 124500,
    totalUsers: 2847,
    activeSubscriptions: 1923,
    churnRate: 2.4
  });

  const [revenueData] = useState([
    { month: 'Jan', revenue: 45000, users: 450 },
    { month: 'Feb', revenue: 52000, users: 520 },
    { month: 'Mar', revenue: 48000, users: 580 },
    { month: 'Apr', revenue: 61000, users: 650 },
    { month: 'May', revenue: 55000, users: 720 },
    { month: 'Jun', revenue: 67000, users: 800 }
  ]);

  const [subscriptionData] = useState([
    { name: 'Basic', value: 45, color: '#3b82f6' },
    { name: 'Pro', value: 35, color: '#8b5cf6' },
    { name: 'Enterprise', value: 20, color: '#ec4899' }
  ]);

  const [users, setUsers] = useState<any[]>([]);

  // Fetch users from database
  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab]);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found. Please log in.');
      }

      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData?.message || `API Error: ${response.status} ${response.statusText}`;
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      if (!Array.isArray(data)) {
        throw new Error('Invalid response format - expected array of users');
      }

      // Transform database user data to match the table format
      const transformedUsers = data.map((user: any) => ({
        id: user._id || user.id,
        name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email,
        email: user.email,
        plan: user.plan || 'Basic',
        status: user.status || 'Active',
        joined: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A',
        mrr: user.mrr || 0
      }));
      setUsers(transformedUsers);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load users';
      setError(errorMsg);
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const [payments] = useState([
    { id: 1, user: 'Sarah Johnson', amount: 49, date: '2024-01-23', status: 'Completed', method: 'Credit Card' },
    { id: 2, user: 'Michael Chen', amount: 199, date: '2024-01-23', status: 'Completed', method: 'PayPal' },
    { id: 3, user: 'Emma Davis', amount: 19, date: '2024-01-22', status: 'Completed', method: 'Credit Card' },
    { id: 4, user: 'Olivia Brown', amount: 49, date: '2024-01-22', status: 'Pending', method: 'Bank Transfer' },
    { id: 5, user: 'James Wilson', amount: 49, date: '2024-01-20', status: 'Failed', method: 'Credit Card' }
  ]);

  const deleteUser = async (id: number | string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

      setUsers(users.filter(u => u.id !== id));
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('Failed to delete user');
    }
  };

  const StatCard = ({ icon: Icon, title, value, change, color }: StatCardProps) => (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <span className={`text-sm font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {change >= 0 ? '+' : ''}{change}%
        </span>
      </div>
      <h3 className="text-gray-600 text-sm font-medium mb-1">{title}</h3>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );

  const NavItem = ({ icon: Icon, label, active = false, onClick, collapsed }: NavItemProps) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
        active
          ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md'
          : 'text-gray-700 hover:bg-gray-100'
      } ${collapsed ? 'justify-center' : ''}`}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      {!collapsed && <span className="font-medium">{label}</span>}
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 h-screen bg-white border-r border-gray-200 transition-all duration-300 z-50 ${
        sidebarOpen ? 'w-64' : 'w-20'
      }`}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            {sidebarOpen && (
              <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                SaaS Admin
              </h2>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 p-4 space-y-2">
            <NavItem
              icon={Home}
              label="Overview"
              active={activeTab === 'overview'}
              onClick={() => setActiveTab('overview')}
              collapsed={!sidebarOpen}
            />
            <NavItem
              icon={Users}
              label="Users"
              active={activeTab === 'users'}
              onClick={() => setActiveTab('users')}
              collapsed={!sidebarOpen}
            />
            <NavItem
              icon={Package}
              label="Subscriptions"
              active={activeTab === 'subscriptions'}
              onClick={() => setActiveTab('subscriptions')}
              collapsed={!sidebarOpen}
            />
            <NavItem
              icon={CreditCard}
              label="Payments"
              active={activeTab === 'payments'}
              onClick={() => setActiveTab('payments')}
              collapsed={!sidebarOpen}
            />
            <NavItem
              icon={BarChart3}
              label="Analytics"
              active={activeTab === 'analytics'}
              onClick={() => setActiveTab('analytics')}
              collapsed={!sidebarOpen}
            />
           
            <div className="pt-4 border-t border-gray-200 mt-4">
              <NavItem
                icon={Settings}
                label="Settings"
                active={activeTab === 'settings'}
                onClick={() => setActiveTab('settings')}
                collapsed={!sidebarOpen}
              />
              <NavItem
                icon={Bell}
                label="Notifications"
                active={activeTab === 'notifications'}
                onClick={() => setActiveTab('notifications')}
                collapsed={!sidebarOpen}
              />
              <NavItem
                icon={HelpCircle}
                label="Help"
                active={activeTab === 'help'}
                onClick={() => setActiveTab('help')}
                collapsed={!sidebarOpen}
              />
            </div>
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-gray-200">
            <NavItem
              icon={LogOut}
              label="Logout"
              collapsed={!sidebarOpen}
            />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                </h1>
                <p className="text-sm text-gray-600 mt-1">Manage your application</p>
              </div>
              <div className="flex items-center gap-4">
                <button className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Export
                </button>
                <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add User
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 px-8 py-8">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  icon={DollarSign}
                  title="Total Revenue"
                  value={`$${stats.totalRevenue.toLocaleString()}`}
                  change={12.5}
                  color="bg-gradient-to-br from-green-500 to-green-600"
                />
                <StatCard
                  icon={Users}
                  title="Total Users"
                  value={stats.totalUsers.toLocaleString()}
                  change={8.2}
                  color="bg-gradient-to-br from-blue-500 to-blue-600"
                />
                <StatCard
                  icon={Package}
                  title="Active Subscriptions"
                  value={stats.activeSubscriptions.toLocaleString()}
                  change={5.7}
                  color="bg-gradient-to-br from-purple-500 to-purple-600"
                />
                <StatCard
                  icon={Activity}
                  title="Churn Rate"
                  value={`${stats.churnRate}%`}
                  change={-1.2}
                  color="bg-gradient-to-br from-pink-500 to-pink-600"
                />
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Revenue Overview</h3>
                    <select
                      value={selectedPeriod}
                      onChange={(e) => setSelectedPeriod(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="7d">Last 7 days</option>
                      <option value="30d">Last 30 days</option>
                      <option value="90d">Last 90 days</option>
                    </select>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                      />
                      <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Subscription Distribution</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={subscriptionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {subscriptionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 space-y-2">
                    {subscriptionData.map((item) => (
                      <div key={item.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                          <span className="text-sm text-gray-700">{item.name}</span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-6">
              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              {/* Search and Filters */}
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filter
                </button>
                <button 
                  onClick={fetchUsers}
                  className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  Refresh
                </button>
              </div>

              {/* Loading State */}
              {loading ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <span className="ml-4 text-gray-600">Loading users...</span>
                  </div>
                </div>
              ) : (
                /* Users Table */
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MRR</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {users.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                            No users found
                          </td>
                        </tr>
                      ) : (
                        users.filter(u =>
                          u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          u.email.toLowerCase().includes(searchTerm.toLowerCase())
                        ).map(user => (
                          <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <div>
                                <div className="font-medium text-gray-900">{user.name}</div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                user.plan === 'Enterprise' ? 'bg-purple-100 text-purple-700' :
                                user.plan === 'Pro' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {user.plan}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                user.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                              }`}>
                                {user.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-gray-900">${user.mrr}</td>
                            <td className="px-6 py-4 text-gray-600 text-sm">{user.joined}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                  <Edit className="w-4 h-4 text-gray-600" />
                                </button>
                                <button
                                  onClick={() => deleteUser(user.id)}
                                  className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {payments.map(payment => (
                    <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{payment.user}</td>
                      <td className="px-6 py-4 text-gray-900 font-semibold">${payment.amount}</td>
                      <td className="px-6 py-4 text-gray-600 text-sm">{payment.date}</td>
                      <td className="px-6 py-4 text-gray-600">{payment.method}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          payment.status === 'Completed' ? 'bg-green-100 text-green-700' :
                          payment.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                          <MoreVertical className="w-4 h-4 text-gray-600" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
