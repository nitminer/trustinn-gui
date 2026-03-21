const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const tempDir = path.join(os.tmpdir(), 'trustinn-exec');

// Ensure temp directory exists
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const executeCodeLocally = (language, code, input = '') => {
  return new Promise((resolve, reject) => {
    const timestamp = Date.now();
    let filename, command, args;

    try {
      switch (language.toLowerCase()) {
        case 'python':
        case 'py':
          filename = path.join(tempDir, `script_${timestamp}.py`);
          fs.writeFileSync(filename, code);
          command = 'python';
          args = [filename];
          break;

        case 'java':
          filename = path.join(tempDir, `Main_${timestamp}.java`);
          const className = `Main_${timestamp}`;
          const javaCode = code.replace(/public\s+class\s+\w+/, `public class ${className}`);
          fs.writeFileSync(filename, javaCode);
          // Compile first
          return compileAndRunJava(filename, className, input, resolve, reject);

        case 'javascript':
        case 'js':
          filename = path.join(tempDir, `script_${timestamp}.js`);
          fs.writeFileSync(filename, code);
          command = 'node';
          args = [filename];
          break;

        case 'solidity':
          // For Solidity, we'd need a local compiler
          return solitidyCompile(code, input, resolve, reject);

        case 'cpp':
        case 'c++':
          filename = path.join(tempDir, `main_${timestamp}.cpp`);
          const exePath = path.join(tempDir, `main_${timestamp}`);
          fs.writeFileSync(filename, code);
          // Compile C++
          const compileProcess = spawn('g++', [filename, '-o', exePath]);
          let compileError = '';

          compileProcess.stderr.on('data', (data) => {
            compileError += data.toString();
          });

          compileProcess.on('close', (code) => {
            if (code !== 0) {
              reject(new Error(`Compilation Error:\n${compileError}`));
            } else {
              runExecutable(exePath, input, resolve, reject, filename);
            }
          });
          return;

        case 'c':
          filename = path.join(tempDir, `main_${timestamp}.c`);
          const cExePath = path.join(tempDir, `main_${timestamp}`);
          fs.writeFileSync(filename, code);
          const cCompileProcess = spawn('gcc', [filename, '-o', cExePath]);
          let cCompileError = '';

          cCompileProcess.stderr.on('data', (data) => {
            cCompileError += data.toString();
          });

          cCompileProcess.on('close', (code) => {
            if (code !== 0) {
              reject(new Error(`Compilation Error:\n${cCompileError}`));
            } else {
              runExecutable(cExePath, input, resolve, reject, filename);
            }
          });
          return;

        default:
          reject(new Error(`Unsupported language: ${language}`));
          return;
      }

      // Run the process
      const process = spawn(command, args, {
        timeout: 300000, // 5 minutes
        maxBuffer: 1024 * 1024 * 10, // 10MB
      });

      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      process.stdin.write(input);
      process.stdin.end();

      process.on('close', (code) => {
        // Cleanup
        try {
          fs.unlinkSync(filename);
        } catch (e) {
          // Ignore cleanup errors
        }

        if (code !== 0) {
          reject(new Error(`${stderr || stdout}`));
        } else {
          resolve({
            output: stdout,
            exitCode: code,
            executionTime: Date.now() - timestamp,
          });
        }
      });

      process.on('error', (error) => {
        reject(error);
      });

      // Timeout handling
      const timeout = setTimeout(() => {
        process.kill();
        reject(new Error('Execution timeout - exceeded 5 minutes'));
      }, 300000);

      process.on('exit', () => clearTimeout(timeout));
    } catch (error) {
      reject(error);
    }
  });
};

const compileAndRunJava = (filename, className, input, resolve, reject) => {
  const classPath = path.dirname(filename);
  const classPathArg = classPath;

  // Compile
  const javac = spawn('javac', [filename]);
  let compileError = '';

  javac.stderr.on('data', (data) => {
    compileError += data.toString();
  });

  javac.on('close', (code) => {
    if (code !== 0) {
      reject(new Error(`Compilation Error:\n${compileError}`));
      return;
    }

    // Run
    const java = spawn('java', ['-cp', classPathArg, className], {
      timeout: 300000,
      maxBuffer: 1024 * 1024 * 10,
    });

    let stdout = '';
    let stderr = '';
    const timestamp = Date.now();

    java.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    java.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    java.stdin.write(input);
    java.stdin.end();

    java.on('close', (code) => {
      // Cleanup
      try {
        fs.unlinkSync(filename);
        fs.unlinkSync(filename.replace('.java', '.class'));
      } catch (e) {
        // Ignore cleanup errors
      }

      if (code !== 0) {
        reject(new Error(`${stderr || stdout}`));
      } else {
        resolve({
          output: stdout,
          exitCode: code,
          executionTime: Date.now() - timestamp,
        });
      }
    });

    java.on('error', (error) => {
      reject(error);
    });

    const timeout = setTimeout(() => {
      java.kill();
      reject(new Error('Execution timeout - exceeded 5 minutes'));
    }, 300000);

    java.on('exit', () => clearTimeout(timeout));
  });
};

const runExecutable = (exePath, input, resolve, reject, sourceFile) => {
  const executable = spawn(exePath, [], {
    timeout: 300000,
    maxBuffer: 1024 * 1024 * 10,
  });

  let stdout = '';
  let stderr = '';
  const timestamp = Date.now();

  executable.stdout.on('data', (data) => {
    stdout += data.toString();
  });

  executable.stderr.on('data', (data) => {
    stderr += data.toString();
  });

  executable.stdin.write(input);
  executable.stdin.end();

  executable.on('close', (code) => {
    // Cleanup
    try {
      fs.unlinkSync(exePath);
      fs.unlinkSync(sourceFile);
    } catch (e) {
      // Ignore cleanup errors
    }

    if (code !== 0) {
      reject(new Error(`${stderr || stdout}`));
    } else {
      resolve({
        output: stdout,
        exitCode: code,
        executionTime: Date.now() - timestamp,
      });
    }
  });

  executable.on('error', (error) => {
    reject(error);
  });

  const timeout = setTimeout(() => {
    executable.kill();
    reject(new Error('Execution timeout - exceeded 5 minutes'));
  }, 300000);

  executable.on('exit', () => clearTimeout(timeout));
};

const solitidyCompile = (code, input, resolve, reject) => {
  // Solidity compilation would require solc compiler
  // For now, we'll return a message that local Solidity execution
  // requires solc to be installed
  reject(new Error('Solidity execution requires solc to be installed locally. Please install it via: npm install -g solc'));
};

const createLocalExecutor = () => {
  // Cleanup old temp files on startup
  try {
    const files = fs.readdirSync(tempDir);
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    
    files.forEach(file => {
      const filePath = path.join(tempDir, file);
      const stats = fs.statSync(filePath);
      if (stats.mtimeMs < oneHourAgo) {
        fs.unlinkSync(filePath);
      }
    });
  } catch (e) {
    console.warn('Cleanup warning:', e.message);
  }
};

module.exports = { executeCodeLocally, createLocalExecutor };
