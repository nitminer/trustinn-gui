import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const tools = {
    c: [
      {
        id: 'cbmc',
        name: 'Condition Satisfiability Analysis',
        shortName: 'CBMC',
        description: 'Bounded Model Checker for C',
        command: 'cbmc_script [FILE]',
        scriptDir: 'CBMC',
        supported_extensions: ['.c'],
        timeout: 300000 // 5 minutes
      },
      {
        id: 'gmcov',
        name: 'gMCov - Code Coverage Profiler',
        shortName: 'gMCov',
        description: 'MC/DC and SC-MCC Coverage Analysis',
        command: 'main-gProfiler [FILE] 4 2',
        scriptDir: 'gMCov',
        supported_extensions: ['.c'],
        timeout: 600000 // 10 minutes
      },
      {
        id: 'gmutant',
        name: 'gMutant',
        shortName: 'gMutant',
        description: 'DSE based Mutation Analyser',
        command: 'main-gProfiler [FILE] 4 2',
        scriptDir: 'gMutant',
        supported_extensions: ['.c'],
        timeout: 600000
      },
      {
        id: 'klee',
        name: 'KLEE - Symbolic Executor',
        shortName: 'KLEE',
        description: 'Dynamic Symbolic Execution Tool',
        command: 'klee.sh [FILE]',
        scriptDir: 'KLEE',
        supported_extensions: ['.c'],
        timeout: 300000
      },
      {
        id: 'kleema',
        name: 'KLEEMA - Code Mutation',
        shortName: 'KLEEMA',
        description: 'Automated Code Mutation Tool',
        command: 'kleema [FILE]',
        scriptDir: 'KLEEMA',
        supported_extensions: ['.c'],
        timeout: 300000
      },
      {
        id: 'tx',
        name: 'TracerX - Path Exploration',
        shortName: 'TracerX',
        description: 'Efficient Trace Explorer',
        command: 'tracerx [FILE]',
        scriptDir: 'TX',
        supported_extensions: ['.c'],
        timeout: 300000
      }
    ],
    solidity: [
      {
        id: 'solc',
        name: 'Solc - Solidity Compiler',
        shortName: 'Solc',
        description: 'Smart Contract Compiler',
        command: 'solc [FILE]',
        scriptDir: 'Solc',
        supported_extensions: ['.sol'],
        timeout: 60000 // 1 minute
      }
    ],
    java: [
      {
        id: 'java-tools',
        name: 'Java Analysis Tools',
        shortName: 'Java',
        description: 'Java Code Analysis and Execution',
        command: 'java [FILE]',
        scriptDir: 'JAVA',
        supported_extensions: ['.java'],
        timeout: 120000 // 2 minutes
      }
    ],
    python: [
      {
        id: 'python-exec',
        name: 'Python Executor',
        shortName: 'Python',
        description: 'Python Script Execution and Analysis',
        command: 'python [FILE]',
        scriptDir: 'python',
        supported_extensions: ['.py'],
        timeout: 120000
      }
    ]
  };

  return NextResponse.json(tools);
}