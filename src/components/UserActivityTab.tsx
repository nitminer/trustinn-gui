'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FiAlertCircle, FiUserCheck, FiClock, FiActivity, FiSearch, FiRefreshCw } from 'react-icons/fi';

interface UserActivityData {
  _id: string;
  userId: string;
  email: string;
  userName: string;
  lastLogin: string;
  lastLoginFormatted: string;
  lastActive: string;
  lastActiveFormatted: string;
  lastActivityAction: string;
  lastActivityPage: string;
  activityCount: number;
  isOnline: boolean;
  device: string;
  browser: string;
  ipAddress: string;
  inactiveMinutes: number;
  recentActivities: Array<{
    action: string;
    page?: string;
    timestamp: string;
  }>;
}

interface ActivityStats {
  onlineUsers: number;
  activeUsers: number;
  mostActiveUsers: Array<{
    email: string;
    activityCount: number;
  }>;
  activitiesByAction: Array<{
    _id: string;
    count: number;
  }>;
  avgActivityCount: number;
  totalActivityCount: number;
  uniqueUsers: number;
}

/**
 * User Activity Tab Component for Admin Dashboard
 * Displays user activity, last login, last active time, and recent actions
 */
export default function UserActivityTab() {
  const [activities, setActivities] = useState<UserActivityData[]>([]);
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const [searchEmail, setSearchEmail] = useState('');
  const [filterOnline, setFilterOnline] = useState<'all' | 'online' | 'offline'>('all');
  const [sortBy, setSortBy] = useState('lastActive');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [refreshing, setRefreshing] = useState(false);

  // Fetch activities
  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        order,
      });

      if (searchEmail) {
        params.append('search', searchEmail);
      }

      if (filterOnline !== 'all') {
        params.append('online', filterOnline === 'online' ? 'true' : 'false');
      }

      const response = await fetch(`/api/admin/users/activity?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch activities');
      }

      const result = await response.json();
      setActivities(result.data || []);
      setTotal(result.pagination?.total || 0);
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch activities');
    } finally {
      setLoading(false);
    }
  }, [page, limit, sortBy, order, searchEmail, filterOnline]);

  // Fetch statistics
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/users/activity/stats?timeRange=24h');

      if (!response.ok) {
        throw new Error('Failed to fetch statistics');
      }

      const result = await response.json();
      setStats(result.data?.stats || null);
    } catch (err) {
      console.error('Error fetching statistics:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchActivities();
    fetchStats();

    // Refresh stats every 5 minutes
    const interval = setInterval(fetchStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchActivities, fetchStats]);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchActivities();
    await fetchStats();
    setRefreshing(false);
  };

  // Handle search
  const handleSearch = (value: string) => {
    setSearchEmail(value);
    setPage(1);
  };

  // Format time difference
  const formatTimeDiff = (minutes: number): string => {
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  // Get status color
  const getStatusColor = (inactiveMinutes: number, isOnline: boolean): string => {
    if (!isOnline) return 'text-gray-500';
    if (inactiveMinutes > 180) return 'text-red-500'; // 3 hours
    if (inactiveMinutes > 30) return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Activity</h2>
          <p className="text-gray-600 mt-1">Monitor user sessions and activity in real-time</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <FiRefreshCw className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Online Users */}
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Online Now</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.onlineUsers}</p>
              </div>
              <FiUserCheck className="w-12 h-12 text-green-500 opacity-20" />
            </div>
          </div>

          {/* Active Users */}
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Active (24h)</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.activeUsers}</p>
              </div>
              <FiActivity className="w-12 h-12 text-blue-500 opacity-20" />
            </div>
          </div>

          {/* Avg Activity */}
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Avg Activity Count</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.avgActivityCount.toFixed(1)}</p>
              </div>
              <FiClock className="w-12 h-12 text-purple-500 opacity-20" />
            </div>
          </div>

          {/* Total Activities */}
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Activities</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalActivityCount}</p>
              </div>
              <FiActivity className="w-12 h-12 text-orange-500 opacity-20" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <FiSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search by email..."
                value={searchEmail}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filter Online Status */}
          <select
            value={filterOnline}
            onChange={(e) => {
              setFilterOnline(e.target.value as 'all' | 'online' | 'offline');
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Users</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="lastActive">Last Active</option>
            <option value="lastLogin">Last Login</option>
            <option value="activityCount">Activity Count</option>
          </select>

          {/* Order */}
          <button
            onClick={() => setOrder(order === 'desc' ? 'asc' : 'desc')}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100"
          >
            {order === 'desc' ? '↓ Desc' : '↑ Asc'}
          </button>
        </div>
      </div>

      {/* Activity Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {error && (
          <div className="p-4 bg-red-50 border-l-4 border-red-500 flex items-center gap-2 text-red-700">
            <FiAlertCircle />
            {error}
          </div>
        )}

        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading user activities...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">User</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Last Active</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Last Login</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Last Action</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Activity Count</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Device</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {activities.map((activity) => (
                    <tr key={activity._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{activity.userName}</p>
                          <p className="text-sm text-gray-600">{activity.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div title={activity.lastActiveFormatted}>
                          {formatTimeDiff(activity.inactiveMinutes)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div title={activity.lastLoginFormatted}>
                          {new Date(activity.lastLogin).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium">
                          {activity.lastActivityAction}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {activity.activityCount}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div>
                          <p>{activity.device}</p>
                          <p className="text-xs text-gray-500">{activity.browser}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              activity.isOnline && activity.inactiveMinutes < 180
                                ? 'bg-green-500'
                                : activity.inactiveMinutes < 30
                                ? 'bg-yellow-500'
                                : 'bg-gray-400'
                            }`}
                          ></div>
                          <span className={`text-xs font-medium ${getStatusColor(activity.inactiveMinutes, activity.isOnline)}`}>
                            {activity.isOnline && activity.inactiveMinutes < 180
                              ? 'Active'
                              : activity.inactiveMinutes < 30
                              ? 'Idle'
                              : 'Offline'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} users
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-gray-600">
                  Page {page} of {Math.ceil(total / limit)}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page * limit >= total}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
