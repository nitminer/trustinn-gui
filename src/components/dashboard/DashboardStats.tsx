'use client';

import { useEffect, useState } from 'react';
import { Users, CreditCard, TrendingUp, Clock, RefreshCw } from 'lucide-react';

interface StatsData {
  totalUsers: number;
  totalPayments: number;
  totalRevenue: number;
  premiumUsers: number;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down';
}

function StatCard({ icon, label, value, change, trend }: StatCardProps) {
  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 border border-gray-700 hover:border-blue-600 transition">
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-blue-600/20 rounded-lg text-blue-400">
          {icon}
        </div>
        {change && (
          <span className={`text-sm font-semibold ${trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
            {trend === 'up' ? '↑' : '↓'} {change}
          </span>
        )}
      </div>
      <p className="text-gray-400 text-sm mb-2">{label}</p>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
  );
}

export default function DashboardStats({ 
  stats, 
  onRefresh 
}: { 
  stats: StatsData;
  onRefresh: () => void;
}) {
  const [monthlyRevenue, setMonthlyRevenue] = useState('0');
  const [avgSubscriptionValue, setAvgSubscriptionValue] = useState('0');

  useEffect(() => {
    if (stats.totalPayments > 0) {
      const avg = (stats.totalRevenue / stats.totalPayments).toFixed(2);
      setAvgSubscriptionValue(avg);
    }
    // Mock monthly revenue (in real app, fetch from API)
    setMonthlyRevenue(`$${(stats.totalRevenue * 0.3).toFixed(2)}`);
  }, [stats]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Dashboard Overview</h2>
          <p className="text-gray-400">Monitor your SaaS metrics and user activity</p>
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition font-medium"
        >
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<Users size={24} />}
          label="Total Users"
          value={stats.totalUsers}
          change="12%"
          trend="up"
        />
        <StatCard
          icon={<CreditCard size={24} />}
          label="Total Payments"
          value={stats.totalPayments}
          change="8%"
          trend="up"
        />
        <StatCard
          icon={<TrendingUp size={24} />}
          label="Total Revenue"
          value={`$${stats.totalRevenue.toFixed(2)}`}
          change="24%"
          trend="up"
        />
        <StatCard
          icon={<Users size={24} />}
          label="Premium Users"
          value={stats.premiumUsers}
          change="15%"
          trend="up"
        />
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Monthly Revenue</h3>
            <div className="p-2 bg-green-600/20 rounded-lg text-green-400">
              <TrendingUp size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-white mb-2">{monthlyRevenue}</p>
          <p className="text-sm text-gray-400">This month's earnings</p>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Avg Subscription Value</h3>
            <div className="p-2 bg-purple-600/20 rounded-lg text-purple-400">
              <CreditCard size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-white mb-2">${Number(avgSubscriptionValue).toFixed(2)}</p>
          <p className="text-sm text-gray-400">Per transaction</p>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Premium Conversion</h3>
            <div className="p-2 bg-orange-600/20 rounded-lg text-orange-400">
              <Clock size={20} />
            </div>
          </div>
          <p className="text-3xl font-bold text-white mb-2">
            {stats.totalUsers > 0 ? ((stats.premiumUsers / stats.totalUsers) * 100).toFixed(1) : 0}%
          </p>
          <p className="text-sm text-gray-400">Of total users</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart Placeholder */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Revenue Trend</h3>
          <div className="h-64 flex items-end justify-around gap-2">
            {[60, 45, 70, 55, 90, 75, 85].map((height, i) => (
              <div
                key={i}
                className="flex-1 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t hover:from-blue-500 hover:to-blue-300 transition cursor-pointer"
                style={{ height: `${height * 1.5}px` }}
                title={`Week ${i + 1}: $${height * 100}`}
              />
            ))}
          </div>
          <div className="flex justify-between mt-4 text-xs text-gray-400">
            <span>Week 1</span>
            <span>Week 7</span>
          </div>
        </div>

        {/* User Growth Chart */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">User Growth</h3>
          <div className="h-64 flex items-end justify-around gap-2">
            {[30, 35, 45, 55, 60, 68, stats.totalUsers || 70].map((height, i) => (
              <div
                key={i}
                className="flex-1 bg-gradient-to-t from-green-600 to-green-400 rounded-t hover:from-green-500 hover:to-green-300 transition cursor-pointer"
                style={{ height: `${(height / 100) * 200}px` }}
                title={`Week ${i + 1}: ${Math.round(height)} users`}
              />
            ))}
          </div>
          <div className="flex justify-between mt-4 text-xs text-gray-400">
            <span>Week 1</span>
            <span>Week 7</span>
          </div>
        </div>
      </div>
    </div>
  );
}
