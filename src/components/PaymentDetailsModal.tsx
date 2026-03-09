'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface BankDetails {
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  accountHolderName: string;
  branchName: string;
}

interface UPIDetails {
  upiId: string;
  enabled: boolean;
}

interface PaymentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (details: any) => Promise<void>;
  initialData?: {
    bankDetails: BankDetails;
    upiDetails: UPIDetails;
    supportEmail: string;
    supportPhone: string;
  };
  isLoading?: boolean;
}

export default function PaymentDetailsModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  isLoading = false
}: PaymentDetailsModalProps) {
  const [bankDetails, setBankDetails] = useState<BankDetails>(
    initialData?.bankDetails || {
      bankName: '',
      accountNumber: '',
      ifscCode: '',
      accountHolderName: '',
      branchName: ''
    }
  );

  const [upiDetails, setUpiDetails] = useState<UPIDetails>(
    initialData?.upiDetails || {
      upiId: '',
      enabled: true
    }
  );

  const [contactInfo, setContactInfo] = useState({
    supportEmail: initialData?.supportEmail || '',
    supportPhone: initialData?.supportPhone || ''
  });

  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'bank' | 'upi' | 'contact'>('bank');

  if (!isOpen) return null;

  const handleBankDetailChange = (field: keyof BankDetails, value: string) => {
    setBankDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleUPIChange = (field: keyof UPIDetails, value: any) => {
    setUpiDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleContactChange = (field: string, value: string) => {
    setContactInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!bankDetails.bankName || !bankDetails.accountNumber || !bankDetails.ifscCode) {
      setError('Please fill all bank details');
      return;
    }

    if (upiDetails.enabled && !upiDetails.upiId) {
      setError('Please enter UPI ID if UPI is enabled');
      return;
    }

    if (!contactInfo.supportEmail || !contactInfo.supportPhone) {
      setError('Please fill contact information');
      return;
    }

    try {
      await onSave({
        bankDetails,
        upiDetails,
        supportEmail: contactInfo.supportEmail,
        supportPhone: contactInfo.supportPhone
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save payment details');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-700">
        {/* Header */}
        <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Edit Payment Details</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-slate-700/50 border-b border-slate-700 px-6">
          <div className="flex gap-8">
            {(['bank', 'upi', 'contact'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-4 font-medium transition border-b-2 ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                {tab === 'bank' && 'Bank Details'}
                {tab === 'upi' && 'UPI Details'}
                {tab === 'contact' && 'Contact Info'}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Bank Details Tab */}
          {activeTab === 'bank' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">Bank Account Information</h3>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={bankDetails.bankName}
                  onChange={(e) => handleBankDetailChange('bankName', e.target.value)}
                  placeholder="e.g., State Bank of India"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Account Holder Name
                </label>
                <input
                  type="text"
                  value={bankDetails.accountHolderName}
                  onChange={(e) => handleBankDetailChange('accountHolderName', e.target.value)}
                  placeholder="e.g., NITMiner Technologies"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Account Number
                  </label>
                  <input
                    type="text"
                    value={bankDetails.accountNumber}
                    onChange={(e) => handleBankDetailChange('accountNumber', e.target.value)}
                    placeholder="e.g., 1234567890"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    value={bankDetails.ifscCode}
                    onChange={(e) => handleBankDetailChange('ifscCode', e.target.value)}
                    placeholder="e.g., SBIN0001234"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Branch Name
                </label>
                <input
                  type="text"
                  value={bankDetails.branchName}
                  onChange={(e) => handleBankDetailChange('branchName', e.target.value)}
                  placeholder="e.g., Bangalore"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="bg-blue-900/30 border border-blue-700 p-4 rounded-lg">
                <p className="text-sm text-blue-300">
                  💡 These details will be displayed on the contact page and in payment receipts.
                </p>
              </div>
            </div>
          )}

          {/* UPI Details Tab */}
          {activeTab === 'upi' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">UPI Details</h3>

              <div>
                <label className="flex items-center gap-3 mb-4">
                  <input
                    type="checkbox"
                    checked={upiDetails.enabled}
                    onChange={(e) => handleUPIChange('enabled', e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-white font-medium">Enable UPI Payments</span>
                </label>
              </div>

              {upiDetails.enabled && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    UPI ID
                  </label>
                  <input
                    type="text"
                    value={upiDetails.upiId}
                    onChange={(e) => handleUPIChange('upiId', e.target.value)}
                    placeholder="e.g., business@upi"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div className="bg-blue-900/30 border border-blue-700 p-4 rounded-lg">
                <p className="text-sm text-blue-300">
                  💡 UPI ID will be shown as an alternative payment method.
                </p>
              </div>
            </div>
          )}

          {/* Contact Info Tab */}
          {activeTab === 'contact' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">Support Contact Information</h3>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Support Email
                </label>
                <input
                  type="email"
                  value={contactInfo.supportEmail}
                  onChange={(e) => handleContactChange('supportEmail', e.target.value)}
                  placeholder="e.g., support@trustinn.com"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Support Phone
                </label>
                <input
                  type="tel"
                  value={contactInfo.supportPhone}
                  onChange={(e) => handleContactChange('supportPhone', e.target.value)}
                  placeholder="e.g., +91-9876543210"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="bg-blue-900/30 border border-blue-700 p-4 rounded-lg">
                <p className="text-sm text-blue-300">
                  💡 These contact details will be displayed on the contact page and in pricing page footer.
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition"
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
