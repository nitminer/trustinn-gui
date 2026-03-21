'use client';

import { useEffect, useState } from 'react';
import { Bell, Zap, Download } from 'lucide-react';

export function UpdateNotifier() {
  const [updateState, setUpdateState] = useState({
    available: false,
    downloaded: false,
    downloading: false,
    progress: 0,
    version: '',
  });

  const electronAPI = (typeof window !== 'undefined' && (window as any).electronAPI) ? (window as any).electronAPI : null;

  useEffect(() => {
    if (!electronAPI) return;

    // Listen for update-available event
    const unlistenAvailable = (window as any).ipcRenderer?.on?.('update-available', (args: any) => {
      setUpdateState((prev) => ({
        ...prev,
        available: true,
        version: args.version,
      }));
    });

    // Listen for update-downloaded event
    const unlistenDownloaded = (window as any).ipcRenderer?.on?.('update-downloaded', (args: any) => {
      setUpdateState((prev) => ({
        ...prev,
        downloaded: true,
        downloading: false,
        version: args.version,
      }));
    });

    // Listen for download-progress event
    const unlistenProgress = (window as any).ipcRenderer?.on?.('update-progress', (args: any) => {
      setUpdateState((prev) => ({
        ...prev,
        downloading: true,
        progress: args.percent,
      }));
    });

    return () => {
      // Note: Electron IPC listeners don't return unsubscribe functions
      // The listeners will be cleaned up when the component unmounts
    };
  }, []);

  if (!updateState.available && !updateState.downloaded && !updateState.downloading) {
    return null;
  }

  const handleDownload = () => {
    (window as any).ipcRenderer?.send?.('download-update');
    setUpdateState((prev) => ({ ...prev, downloading: true }));
  };

  const handleInstall = () => {
    (window as any).ipcRenderer?.send?.('install-update');
  };

  const handleDismiss = () => {
    setUpdateState({
      available: false,
      downloaded: false,
      downloading: false,
      progress: 0,
      version: '',
    });
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      {updateState.downloaded ? (
        // Update Ready to Install
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg shadow-lg p-4">
          <div className="flex items-start gap-3">
            <Zap className="w-6 h-6 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <p className="font-bold text-sm">Update Ready!</p>
              <p className="text-xs opacity-90 mt-1">
                Version {updateState.version} is ready to install. Restart required.
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleInstall}
                  className="bg-white text-green-600 hover:bg-green-50 text-xs font-semibold px-3 py-1 rounded transition-colors"
                >
                  Restart & Install
                </button>
                <button
                  onClick={handleDismiss}
                  className="bg-green-700 hover:bg-green-800 text-xs px-3 py-1 rounded transition-colors"
                >
                  Later
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : updateState.downloading ? (
        // Downloading Update
        <div className="bg-blue-500 text-white rounded-lg shadow-lg p-4">
          <div className="flex items-start gap-3">
            <Download className="w-6 h-6 flex-shrink-0 mt-1 animate-bounce" />
            <div className="flex-1">
              <p className="font-bold text-sm">Downloading Update</p>
              <div className="w-full bg-blue-700 rounded-full h-2 mt-2">
                <div
                  className="bg-white h-2 rounded-full transition-all duration-300"
                  style={{ width: `${updateState.progress}%` }}
                />
              </div>
              <p className="text-xs opacity-90 mt-1">{updateState.progress}% complete</p>
            </div>
          </div>
        </div>
      ) : (
        // Update Available
        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg shadow-lg p-4">
          <div className="flex items-start gap-3">
            <Bell className="w-6 h-6 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <p className="font-bold text-sm">New Version Available</p>
              <p className="text-xs opacity-90 mt-1">
                TrustInn {updateState.version} is now available.
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleDownload}
                  className="bg-white text-orange-600 hover:bg-orange-50 text-xs font-semibold px-3 py-1 rounded transition-colors"
                >
                  Download
                </button>
                <button
                  onClick={handleDismiss}
                  className="bg-orange-700 hover:bg-orange-800 text-xs px-3 py-1 rounded transition-colors"
                >
                  Skip
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UpdateNotifier;
