'use client';

import React, { useState, useEffect } from 'react';
import { Settings, X, Save, RotateCcw } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [apiUrl, setApiUrl] = useState('https://trustinn.nitminer.com');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadConfig();
    }
  }, [isOpen]);

  const loadConfig = async () => {
    try {
      // Check if running in Electron
      if (typeof window !== 'undefined' && (window as any).api?.invoke) {
        const config = await (window as any).api.invoke('get-app-config');
        setApiUrl(config?.apiUrl || 'https://trustinn.nitminer.com');
      }
    } catch (error) {
      console.error('Error loading config:', error);
      setMessage({ type: 'error', text: 'Failed to load settings' });
    }
  };

  const handleSave = async () => {
    if (!apiUrl.trim()) {
      setMessage({ type: 'error', text: 'API URL cannot be empty' });
      return;
    }

    if (!apiUrl.startsWith('http://') && !apiUrl.startsWith('https://')) {
      setMessage({ type: 'error', text: 'API URL must start with http:// or https://' });
      return;
    }

    setLoading(true);
    try {
      // Check if running in Electron
      if (typeof window !== 'undefined' && (window as any).api?.invoke) {
        await (window as any).api.invoke('set-app-config', { apiUrl });
        setMessage({ type: 'success', text: 'Settings saved! Please refresh to apply changes.' });
        // Reload after 2 seconds
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setMessage({ type: 'error', text: 'Not running in Electron app' });
      }
    } catch (error) {
      console.error('Error saving config:', error);
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setApiUrl('https://trustinn.nitminer.com');
    setMessage(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Application Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              API Server URL
            </label>
            <input
              type="text"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="https://trustinn.nitminer.com"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Enter the URL of your TrustInn API server (e.g., http://192.168.1.100:7075 or https://api.yourdomain.com)
            </p>
          </div>

          {/* Message */}
          {message && (
            <div
              className={`p-3 rounded-lg text-sm ${
                message.type === 'success'
                  ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                  : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
              }`}
            >
              {message.text}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleReset}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg
                     border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300
                     hover:bg-gray-50 dark:hover:bg-gray-800 transition disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg
                     bg-blue-500 hover:bg-blue-600 text-white transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
