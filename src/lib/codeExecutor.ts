// This is a bridge between the web API and local Electron execution
// It determines whether to use the local CPU or remote server

import axios from 'axios';

interface ExecutionResult {
  output: string;
  exitCode: number;
  executionTime: number;
}

export const executeCode = async (
  language: string,
  code: string,
  input: string = '',
  useLocal: boolean = false
): Promise<ExecutionResult> => {
  // Check if Electron API is available
  const electronAPI = (window as any).electronAPI;
  const canUseLocal = !!electronAPI && useLocal;

  if (canUseLocal) {
    // Use local CPU for execution
    try {
      const result = await electronAPI.executeCode(language, code, input);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    } catch (error) {
      console.error('Local execution error:', error);
      // Fallback to server if local fails
      return executeCodeOnServer(language, code, input);
    }
  } else {
    // Use remote server
    return executeCodeOnServer(language, code, input);
  }
};

const executeCodeOnServer = async (
  language: string,
  code: string,
  input: string
): Promise<ExecutionResult> => {
  try {
    const response = await axios.post('/api/execute', {
      language,
      code,
      input,
    });

    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.error || 'Failed to execute code on server'
    );
  }
};

// Utility to get available execution locations
export const getExecutionMethods = () => {
  const electronAPI = (window as any).electronAPI;
  const methods: ('local' | 'server')[] = ['server'];

  if (electronAPI) {
    methods.unshift('local');
  }

  return methods;
};

// Get preferred execution method based on system capabilities
export const getPreferredExecutionMethod = (): 'local' | 'server' => {
  const electronAPI = (window as any).electronAPI;
  if (electronAPI) {
    // Prefer local execution in Electron
    return 'local';
  }
  return 'server';
};
