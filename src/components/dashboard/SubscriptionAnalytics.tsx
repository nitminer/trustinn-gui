'use client';

import { useEffect, useState } from 'react';
import { Calendar, Clock, AlertCircle } from 'lucide-react';

interface Subscription {
  _id: string;
  userId: string;
  plan: string;
  status: string;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  price: number;
  daysUntilExpiry?: number;
}

export default function SubscriptionAnalytics() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);

      // Mock subscription data
      const mockSubscriptions = [
        {
          _id: 'sub_1',
          userId: 'user_1',
          plan: 'monthly',
          status: 'active',
          startDate: '2024-01-15T10:30:00Z',
          endDate: '2024-02-15T10:30:00Z',
          autoRenew: true,
          price: 29.99
        },
        {
          _id: 'sub_2',
          userId: 'user_2',
          plan: 'yearly',
          status: 'active',
          startDate: '2024-01-20T14:20:00Z',
          endDate: '2025-01-20T14:20:00Z',
          autoRenew: true,
          price: 99.99
        },
        {
          _id: 'sub_3',
          userId: 'user_3',
          plan: 'lifetime',
          status: 'active',
          startDate: '2024-01-25T09:15:00Z',
          endDate: '2034-01-25T09:15:00Z',
          autoRenew: false,
          price: 299.99
        },
        {
          _id: 'sub_4',
          userId: 'user_4',
          plan: 'monthly',
          status: 'expired',
          startDate: '2023-12-01T16:45:00Z',
          endDate: '2024-01-01T16:45:00Z',
          autoRenew: false,
          price: 29.99
        },
        {
          _id: 'sub_5',
          userId: 'user_5',
          plan: 'yearly',
          status: 'active',
          startDate: '2024-02-05T11:30:00Z',
          endDate: '2025-02-05T11:30:00Z',
          autoRenew: true,
          price: 99.99
        }
      ];

      // Simulate API delay
      setTimeout(() => {
        setSubscriptions(mockSubscriptions);
        setLoading(false);
      }, 800);

    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      setLoading(false);
    }
  };

  const filteredSubscriptions = subscriptions.filter(
    (sub) => filterStatus === 'all' || sub.status === filterStatus
  );

  const stats = {
    active: subscriptions.filter((s) => s.status === 'active').length,
    expiring: subscriptions.filter(
      (s) => s.status === 'active' && s.daysUntilExpiry! <= 30 && s.daysUntilExpiry! > 0
    ).length,
    expired: subscriptions.filter((s) => s.status === 'expired').length,
    byPlan: {
      monthly: subscriptions.filter((s) => s.plan === 'monthly').length,
      yearly: subscriptions.filter((s) => s.plan === 'yearly').length,
      lifetime: subscriptions.filter((s) => s.plan === 'lifetime').length,
    },
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-600/20 text-green-400';
      case 'expired':
        return 'bg-red-600/20 text-red-400';
      case 'cancelled':
        return 'bg-gray-600/20 text-gray-400';
      default:
        return 'bg-blue-600/20 text-blue-400';
    }
  };

  const getExpiryColor = (days?: number) => {
    if (!days) return 'text-gray-400';
    if (days <= 0) return 'text-red-400';
    if (days <= 30) return 'text-yellow-400';
    return 'text-green-400';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Subscription Analytics</h2>
        <p className="text-gray-400">Monitor active subscriptions and expiry dates</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 border border-gray-700">
          <p className="text-gray-400 text-sm mb-2">Active Subscriptions</p>
          <p className="text-3xl font-bold text-green-400">{stats.active}</p>
        </div>
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 border border-gray-700">
          <p className="text-gray-400 text-sm mb-2">Expiring Soon (30 days)</p>
          <p className="text-3xl font-bold text-yellow-400">{stats.expiring}</p>
        </div>
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 border border-gray-700">
          <p className="text-gray-400 text-sm mb-2">Expired</p>
          <p className="text-3xl font-bold text-red-400">{stats.expired}</p>
        </div>
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 border border-gray-700">
          <p className="text-gray-400 text-sm mb-2">Total Subscriptions</p>
          <p className="text-3xl font-bold text-blue-400">{subscriptions.length}</p>
        </div>
      </div>

      {/* Plan Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Plan Distribution</h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-300">Monthly Plans</span>
                <span className="font-semibold text-white">{stats.byPlan.monthly}</span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full"
                  style={{
                    width: `${
                      subscriptions.length > 0
                        ? (stats.byPlan.monthly / subscriptions.length) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-300">Yearly Plans</span>
                <span className="font-semibold text-white">{stats.byPlan.yearly}</span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-600 rounded-full"
                  style={{
                    width: `${
                      subscriptions.length > 0
                        ? (stats.byPlan.yearly / subscriptions.length) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-300">Lifetime Plans</span>
                <span className="font-semibold text-white">{stats.byPlan.lifetime}</span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-pink-600 rounded-full"
                  style={{
                    width: `${
                      subscriptions.length > 0
                        ? (stats.byPlan.lifetime / subscriptions.length) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Expiry Timeline */}
        <div className="lg:col-span-2 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Upcoming Expiries</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {subscriptions
              .filter((s) => s.status === 'active' && s.daysUntilExpiry! > 0)
              .sort((a, b) => (a.daysUntilExpiry || 999) - (b.daysUntilExpiry || 999))
              .slice(0, 10)
              .map((sub) => (
                <div
                  key={sub._id}
                  className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-700"
                >
                  <div className="flex items-center gap-3">
                    <Clock size={16} className="text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-white">
                        {sub.plan.charAt(0).toUpperCase() + sub.plan.slice(1)} Plan
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(sub.endDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className={`text-sm font-semibold ${getExpiryColor(sub.daysUntilExpiry)}`}>
                    {sub.daysUntilExpiry! <= 0
                      ? 'Expired'
                      : `${sub.daysUntilExpiry} days`}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Filter and Table */}
      <div>
        <div className="mb-4">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:border-blue-600 focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          ) : filteredSubscriptions.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>No subscriptions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-900 border-b border-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-white">Plan</th>
                    <th className="px-6 py-3 text-left font-semibold text-white">Status</th>
                    <th className="px-6 py-3 text-left font-semibold text-white">
                      Start Date
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-white">
                      End Date
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-white">
                      Days Left
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-white">
                      Auto Renew
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubscriptions.map((sub) => (
                    <tr
                      key={sub._id}
                      className="border-b border-gray-700 hover:bg-gray-750 transition"
                    >
                      <td className="px-6 py-4 font-medium text-white capitalize">
                        {sub.plan}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            sub.status
                          )}`}
                        >
                          {sub.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-300 text-sm">
                        {new Date(sub.startDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-gray-300 text-sm">
                        {new Date(sub.endDate).toLocaleDateString()}
                      </td>
                      <td className={`px-6 py-4 font-semibold ${getExpiryColor(sub.daysUntilExpiry)}`}>
                        {sub.daysUntilExpiry! <= 0 ? (
                          <div className="flex items-center gap-1">
                            <AlertCircle size={14} />
                            Expired
                          </div>
                        ) : (
                          `${sub.daysUntilExpiry} days`
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            sub.autoRenew
                              ? 'bg-green-600/20 text-green-400'
                              : 'bg-gray-600/20 text-gray-400'
                          }`}
                        >
                          {sub.autoRenew ? 'Yes' : 'No'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
