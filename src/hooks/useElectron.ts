import { useEffect, useState } from 'react';

// Check if running in Electron
export const isElectron = () => {
  return typeof window !== 'undefined' && !!(window as any).electronAPI;
};

// Hook to use Electron API
export const useElectronAPI = () => {
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    setIsAvailable(isElectron());
  }, []);

  if (!isAvailable) {
    return null;
  }

  return (window as any).electronAPI;
};

// Local code execution hook
export const useLocalCodeExecution = () => {
  const electronAPI = useElectronAPI();

  const executeCode = async (language: string, code: string, input: string = '') => {
    if (!electronAPI) {
      throw new Error('Electron API not available');
    }

    try {
      const result = await electronAPI.executeCode(language, code, input);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    } catch (error) {
      throw error;
    }
  };

  return { executeCode, isAvailable: !!electronAPI };
};

// File system utilities
export const useFileSystem = () => {
  const electronAPI = useElectronAPI();

  return {
    readFile: async (path: string) => {
      if (!electronAPI) throw new Error('Electron API not available');
      return electronAPI.readFile(path);
    },
    writeFile: async (path: string, content: string) => {
      if (!electronAPI) throw new Error('Electron API not available');
      return electronAPI.writeFile(path, content);
    },
    deleteFile: async (path: string) => {
      if (!electronAPI) throw new Error('Electron API not available');
      return electronAPI.deleteFile(path);
    },
    listDirectory: async (path: string) => {
      if (!electronAPI) throw new Error('Electron API not available');
      return electronAPI.listDirectory(path);
    },
    createDirectory: async (path: string) => {
      if (!electronAPI) throw new Error('Electron API not available');
      return electronAPI.createDirectory(path);
    },
    selectFile: async (options?: any) => {
      if (!electronAPI) throw new Error('Electron API not available');
      return electronAPI.selectFile(options);
    },
    selectDirectory: async (options?: any) => {
      if (!electronAPI) throw new Error('Electron API not available');
      return electronAPI.selectDirectory(options);
    },
    saveFile: async (options?: any) => {
      if (!electronAPI) throw new Error('Electron API not available');
      return electronAPI.saveFile(options);
    },
  };
};

// System info
export const useSystemInfo = () => {
  const electronAPI = useElectronAPI();
  const [systemInfo, setSystemInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!electronAPI) {
      setLoading(false);
      return;
    }

    const fetchSystemInfo = async () => {
      try {
        const info = await electronAPI.getSystemInfo();
        setSystemInfo(info);
      } catch (error) {
        console.error('Failed to fetch system info:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSystemInfo();
  }, [electronAPI]);

  return { systemInfo, loading, isElectron: !!electronAPI };
};

// Window controls
export const useWindowControls = () => {
  const electronAPI = useElectronAPI();

  return {
    minimize: () => electronAPI?.minimizeWindow(),
    maximize: () => electronAPI?.maximizeWindow(),
    close: () => electronAPI?.closeWindow(),
  };
};
