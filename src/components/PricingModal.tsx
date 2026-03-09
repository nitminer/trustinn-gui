'use client';

import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

interface Feature {
  name: string;
  included: boolean;
}

interface Tool {
  name: string;
  available: boolean;
}

interface PricingPlan {
  _id?: string;
  planName: string;
  displayName: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  trialDays: number;
  trialExecutions: number;
  executionsPerMonth: number;
  storageGB: number;
  supportLevel: 'community' | 'email' | 'priority' | '24/7';
  features: Feature[];
  toolsIncluded: Tool[];
  isActive: boolean;
  displayOrder: number;
  color: string;
  badge: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (plan: PricingPlan) => Promise<void>;
  initialPlan?: PricingPlan | null;
  isLoading?: boolean;
}

const SUPPORT_LEVELS = ['community', 'email', 'priority', '24/7'];
const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export default function PricingModal({
  isOpen,
  onClose,
  onSave,
  initialPlan = null,
  isLoading = false
}: PricingModalProps) {
  const [formData, setFormData] = useState<PricingPlan>(
    initialPlan || {
      planName: '',
      displayName: '',
      description: '',
      monthlyPrice: 0,
      yearlyPrice: 0,
      trialDays: 0,
      trialExecutions: 999999,
      executionsPerMonth: 0,
      storageGB: 0,
      supportLevel: 'email',
      features: [],
      toolsIncluded: [],
      isActive: true,
      displayOrder: 0,
      color: '#3b82f6',
      badge: null
    }
  );

  const [newFeature, setNewFeature] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const finalValue = type === 'number' ? parseFloat(value) || 0 : value;

    setFormData(prev => ({
      ...prev,
      [name]: finalValue
    }));
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, { name: newFeature, included: true }]
      }));
      setNewFeature('');
    }
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.planName || !formData.displayName || !formData.description) {
      setError('Plan name, display name, and description are required');
      return;
    }

    try {
      await onSave(formData);
      setSuccess('Plan saved successfully!');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to save pricing plan');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <h2 className="text-2xl text-black font-bold">
            {initialPlan ? 'Edit Pricing Plan' : 'Create New Pricing Plan'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              {success}
            </div>
          )}

          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-black  text-lg">Basic Information</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plan Name (system identifier)
                </label>
                <input
                  type="text"
                  name="planName"
                  value={formData.planName}
                  onChange={handleInputChange}
                  disabled={!!initialPlan}
                  placeholder="e.g., starter, professional"
                  className="w-full text-black  px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleInputChange}
                  placeholder="e.g., Professional"
                  className="w-full text-black  px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Brief description of this plan"
                rows={2}
                className="w-full text-black px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Pricing</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Yearly Price (₹)
                </label>
                <input
                  type="number"
                  name="yearlyPrice"
                  value={formData.yearlyPrice}
                  onChange={handleInputChange}
                  min="0"
                  step="100"
                  className="w-full  text-black  px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Badge (Optional)
                </label>
                <input
                  type="text"
                  name="badge"
                  value={formData.badge || ''}
                  onChange={handleInputChange}
                  placeholder="e.g., Best Value"
                  className="w-full text-black  px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>



          {/* Support & Display */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Support & Display</h3>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-black font-medium text-gray-700 mb-1">
                  Support Level
                </label>
                <select
                  name="supportLevel"
                  value={formData.supportLevel}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {SUPPORT_LEVELS.map(level => (
                    <option key={level} value={level}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Color
                </label>
                <div className="flex gap-2">
                  {COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, color }))}
                      className={`w-8 h-8 rounded-full border-2 ${
                        formData.color === color ? 'border-gray-900' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  name="displayOrder"
                  value={formData.displayOrder}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full text-black  px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <h3 className="font-semibold text-black  text-lg">Features</h3>

            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                placeholder="Add a feature"
                className="flex-1 text-black  px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={addFeature}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition flex items-center gap-2"
              >
                <Plus size={18} /> Add
              </button>
            </div>

            <div className="space-y-2">
              {formData.features.map((feature, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                >
                  <span>{feature.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFeature(idx)}
                    className="text-red-500 hover:text-red-700 transition"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={(e) =>
                setFormData(prev => ({ ...prev, isActive: e.target.checked }))
              }
              className="w-4 h-4"
            />
            <label className="text-sm font-medium text-gray-700">
              Plan is active and visible
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg transition"
            >
              {isLoading ? 'Saving...' : 'Save Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
