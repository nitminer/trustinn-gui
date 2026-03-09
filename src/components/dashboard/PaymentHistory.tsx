'use client';

import { useEffect, useState } from 'react';
import { Download, Filter, Search } from 'lucide-react';

interface Payment {
  _id: string;
  userId: string;
  amount: number;
  currency: string;
  plan: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod?: string;
  createdAt: string;
}

export default function PaymentHistory() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPlan, setFilterPlan] = useState<string>('all');

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);

      // Mock payment data
      const mockPayments: Payment[] = [
        {
          _id: 'pay_1',
          userId: 'user_1',
          amount: 29.99,
          currency: 'USD',
          plan: 'monthly',
          status: 'completed',
          paymentMethod: 'card',
          createdAt: '2024-01-15T10:30:00Z'
        },
        {
          _id: 'pay_2',
          userId: 'user_2',
          amount: 99.99,
          currency: 'USD',
          plan: 'yearly',
          status: 'completed',
          paymentMethod: 'upi',
          createdAt: '2024-01-20T14:20:00Z'
        },
        {
          _id: 'pay_3',
          userId: 'user_3',
          amount: 299.99,
          currency: 'USD',
          plan: 'lifetime',
          status: 'pending',
          paymentMethod: 'card',
          createdAt: '2024-01-25T09:15:00Z'
        },
        {
          _id: 'pay_4',
          userId: 'user_4',
          amount: 29.99,
          currency: 'USD',
          plan: 'monthly',
          status: 'failed',
          paymentMethod: 'wallet',
          createdAt: '2024-02-01T16:45:00Z'
        },
        {
          _id: 'pay_5',
          userId: 'user_5',
          amount: 99.99,
          currency: 'USD',
          plan: 'yearly',
          status: 'completed',
          paymentMethod: 'card',
          createdAt: '2024-02-05T11:30:00Z'
        }
      ];

      // Simulate API delay
      setTimeout(() => {
        setPayments(mockPayments);
        setLoading(false);
      }, 800);

    } catch (error) {
      console.error('Error fetching payments:', error);
      setLoading(false);
    }
  };

  const filteredPayments = payments
    .filter((payment) => {
      const matchesSearch = payment._id
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesStatus =
        filterStatus === 'all' || payment.status === filterStatus;
      const matchesPlan = filterPlan === 'all' || payment.plan === filterPlan;
      return matchesSearch && matchesStatus && matchesPlan;
    })
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-600/20 text-green-400';
      case 'pending':
        return 'bg-yellow-600/20 text-yellow-400';
      case 'failed':
        return 'bg-red-600/20 text-red-400';
      case 'refunded':
        return 'bg-gray-600/20 text-gray-400';
      default:
        return 'bg-gray-700/50 text-gray-400';
    }
  };

  const totalRevenue = payments
    .filter((p) => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  const handleExport = () => {
    const csv = [
      ['Payment ID', 'Amount', 'Currency', 'Plan', 'Status', 'Date'],
      ...filteredPayments.map((p) => [
        p._id,
        p.amount,
        p.currency,
        p.plan,
        p.status,
        new Date(p.createdAt).toLocaleDateString(),
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Payment History</h2>
          <p className="text-gray-400">Track all transactions and revenue</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition font-medium"
        >
          <Download size={18} />
          Export CSV
        </button>
      </div>

      {/* Revenue Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 border border-gray-700">
          <p className="text-gray-400 text-sm mb-2">Total Revenue</p>
          <p className="text-3xl font-bold text-white">${totalRevenue.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-2">Completed payments only</p>
        </div>
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 border border-gray-700">
          <p className="text-gray-400 text-sm mb-2">Total Transactions</p>
          <p className="text-3xl font-bold text-white">{payments.length}</p>
          <p className="text-xs text-gray-500 mt-2">All time</p>
        </div>
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 border border-gray-700">
          <p className="text-gray-400 text-sm mb-2">Success Rate</p>
          <p className="text-3xl font-bold text-white">
            {payments.length > 0
              ? (
                  (payments.filter((p) => p.status === 'completed').length /
                    payments.length) *
                  100
                ).toFixed(1)
              : 0}
            %
          </p>
          <p className="text-xs text-gray-500 mt-2">Completion rate</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-64 relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by payment ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:border-blue-600 focus:outline-none"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:border-blue-600 focus:outline-none"
        >
          <option value="all">All Status</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
        <select
          value={filterPlan}
          onChange={(e) => setFilterPlan(e.target.value)}
          className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:border-blue-600 focus:outline-none"
        >
          <option value="all">All Plans</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
          <option value="lifetime">Lifetime</option>
        </select>
      </div>

      {/* Payments Table */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>No payments found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-900 border-b border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-white">
                    Payment ID
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-white">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-white">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-white">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-white">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-white">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => (
                  <tr
                    key={payment._id}
                    className="border-b border-gray-700 hover:bg-gray-750 transition"
                  >
                    <td className="px-6 py-4 font-mono text-sm text-white">
                      {payment._id.substring(0, 12)}...
                    </td>
                    <td className="px-6 py-4 font-semibold text-white">
                      {payment.currency} {payment.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-gray-300 capitalize">
                      {payment.plan}
                    </td>
                    <td className="px-6 py-4 text-gray-300 capitalize">
                      {payment.paymentMethod || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          payment.status
                        )}`}
                      >
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-300 text-sm">
                      {new Date(payment.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
