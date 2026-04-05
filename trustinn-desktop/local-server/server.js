const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

const upload = multer({ storage: multer.memoryStorage() });

let serverRef = null;
let appRef = null;

function createTempWorkspace() {
  const dir = path.join(os.tmpdir(), 'trustinn-desktop', String(Date.now()));
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function commandExists(cmd) {
  return new Promise((resolve) => {
    const child = spawn(process.platform === 'win32' ? 'where' : 'which', [cmd], {
      stdio: 'ignore',
      shell: false,
    });
    child.on('exit', (code) => resolve(code === 0));
    child.on('error', () => resolve(false));
  });
}

function runCommand(command, args, opts = {}) {
  const timeoutMs = opts.timeoutMs || 300000;
  const cwd = opts.cwd || process.cwd();
  const env = { ...process.env, ...(opts.env || {}) };

  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd,
      env,
      shell: false,
    });

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, timeoutMs);

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      clearTimeout(timer);
      resolve({ code: 1, stdout, stderr: `${stderr}\n${error.message}`.trim(), timedOut });
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ code: code ?? 1, stdout, stderr, timedOut });
    });
  });
}

async function compileCode(language, code, fileName = 'program') {
  const tmpDir = createTempWorkspace();

  if (language === 'python') {
    const py = path.join(tmpDir, fileName.endsWith('.py') ? fileName : 'program.py');
    await fsp.writeFile(py, code, 'utf8');
    const pythonExists = await commandExists('python3');
    if (!pythonExists) {
      return { ok: false, output: 'python3 not found on this system' };
    }
    const res = await runCommand('python3', ['-m', 'py_compile', py], { cwd: tmpDir });
    return { ok: res.code === 0, output: [res.stdout, res.stderr].filter(Boolean).join('\n') || (res.code === 0 ? 'Python syntax check passed' : 'Compilation failed') };
  }

  if (language === 'c') {
    const src = path.join(tmpDir, fileName.endsWith('.c') ? fileName : 'program.c');
    const out = path.join(tmpDir, process.platform === 'win32' ? 'program.exe' : 'program.out');
    await fsp.writeFile(src, code, 'utf8');
    const gccExists = await commandExists('gcc');
    if (!gccExists) {
      return { ok: false, output: 'gcc not found on this system' };
    }
    const res = await runCommand('gcc', [src, '-o', out], { cwd: tmpDir });
    return { ok: res.code === 0, output: [res.stdout, res.stderr].filter(Boolean).join('\n') || (res.code === 0 ? 'C compilation successful' : 'Compilation failed') };
  }

  if (language === 'java') {
    const normalized = fileName.endsWith('.java') ? fileName : 'Program.java';
    const src = path.join(tmpDir, normalized);
    await fsp.writeFile(src, code, 'utf8');
    const javacExists = await commandExists('javac');
    if (!javacExists) {
      return { ok: false, output: 'javac not found on this system' };
    }
    const res = await runCommand('javac', [src], { cwd: tmpDir });
    return { ok: res.code === 0, output: [res.stdout, res.stderr].filter(Boolean).join('\n') || (res.code === 0 ? 'Java compilation successful' : 'Compilation failed') };
  }

  if (language === 'solidity') {
    const src = path.join(tmpDir, fileName.endsWith('.sol') ? fileName : 'Contract.sol');
    await fsp.writeFile(src, code, 'utf8');
    const solcExists = await commandExists('solc');
    if (!solcExists) {
      return { ok: false, output: 'solc not found on this system' };
    }
    const res = await runCommand('solc', ['--bin', src], { cwd: tmpDir });
    return { ok: res.code === 0, output: [res.stdout, res.stderr].filter(Boolean).join('\n') || (res.code === 0 ? 'Solidity compilation successful' : 'Compilation failed') };
  }

  return { ok: false, output: `Unsupported language: ${language}` };
}

async function executeCode(type, code, fileName = 'program') {
  const tmpDir = createTempWorkspace();

  if (type === 'python') {
    const py = path.join(tmpDir, fileName.endsWith('.py') ? fileName : 'program.py');
    await fsp.writeFile(py, code, 'utf8');
    const exists = await commandExists('python3');
    if (!exists) return { ok: false, output: 'python3 not found on this system' };
    const res = await runCommand('python3', [py], { cwd: tmpDir });
    return { ok: res.code === 0, output: [res.stdout, res.stderr].filter(Boolean).join('\n') };
  }

  if (type === 'c') {
    const src = path.join(tmpDir, fileName.endsWith('.c') ? fileName : 'program.c');
    const exe = path.join(tmpDir, process.platform === 'win32' ? 'program.exe' : 'program.out');
    await fsp.writeFile(src, code, 'utf8');
    const gccExists = await commandExists('gcc');
    if (!gccExists) return { ok: false, output: 'gcc not found on this system' };

    const comp = await runCommand('gcc', [src, '-o', exe], { cwd: tmpDir });
    if (comp.code !== 0) {
      return { ok: false, output: [comp.stdout, comp.stderr].filter(Boolean).join('\n') || 'Compilation failed' };
    }

    const exec = await runCommand(exe, [], { cwd: tmpDir });
    return { ok: exec.code === 0, output: [exec.stdout, exec.stderr].filter(Boolean).join('\n') };
  }

  if (type === 'java') {
    const normalized = fileName.endsWith('.java') ? fileName : 'Program.java';
    const src = path.join(tmpDir, normalized);
    await fsp.writeFile(src, code, 'utf8');
    const javacExists = await commandExists('javac');
    const javaExists = await commandExists('java');
    if (!javacExists || !javaExists) return { ok: false, output: 'Java (javac/java) not found on this system' };

    const comp = await runCommand('javac', [src], { cwd: tmpDir });
    if (comp.code !== 0) {
      return { ok: false, output: [comp.stdout, comp.stderr].filter(Boolean).join('\n') || 'Compilation failed' };
    }

    const mainClass = path.basename(normalized, '.java');
    const exec = await runCommand('java', ['-cp', tmpDir, mainClass], { cwd: tmpDir });
    return { ok: exec.code === 0, output: [exec.stdout, exec.stderr].filter(Boolean).join('\n') };
  }

  if (type === 'solidity') {
    const src = path.join(tmpDir, fileName.endsWith('.sol') ? fileName : 'Contract.sol');
    await fsp.writeFile(src, code, 'utf8');
    const solcExists = await commandExists('solc');
    if (!solcExists) return { ok: false, output: 'solc not found on this system' };
    const res = await runCommand('solc', ['--bin', '--abi', src], { cwd: tmpDir });
    return { ok: res.code === 0, output: [res.stdout, res.stderr].filter(Boolean).join('\n') };
  }

  return { ok: false, output: `Unsupported type: ${type}` };
}

function createApp(allowedOrigin) {
  const app = express();

  app.use(cors({
    origin: (origin, cb) => {
      if (!origin || origin === allowedOrigin) return cb(null, true);
      return cb(new Error('Origin not allowed'));
    },
    credentials: true,
  }));

  app.use(express.json({ limit: '10mb' }));

  app.options('*', (req, res) => {
    res.sendStatus(204);
  });

  app.get('/health', (req, res) => {
    res.json({ ok: true, mode: 'desktop-local-execution' });
  });

  app.post('/api/tools/compile', async (req, res) => {
    const { language, code, fileName } = req.body || {};
    if (!language || !code) {
      return res.status(400).json({ error: 'Language and code are required' });
    }

    try {
      const result = await compileCode(language, code, fileName || 'program');
      if (!result.ok) {
        return res.status(200).json({ success: false, error: result.output || 'Compilation failed' });
      }
      return res.json({ success: true, fileName: fileName || 'program', language, output: result.output || 'Compilation successful' });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message || 'Compilation failed' });
    }
  });

  app.post('/api/tools/compile-stream', async (req, res) => {
    const { language, code, fileName } = req.body || {};
    if (!language || !code) {
      return res.status(400).json({ error: 'Language and code required' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const send = (event) => {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    };

    send({ type: 'start', message: `Starting local ${language} compilation...` });

    try {
      const result = await compileCode(language, code, fileName || 'program');
      if (!result.ok) {
        send({ type: 'error', message: result.output || 'Compilation failed' });
      } else {
        const lines = (result.output || 'Compilation successful').split('\n').filter(Boolean);
        for (const line of lines) send({ type: 'output', message: line });
        send({ type: 'success', message: 'Compilation completed locally' });
      }
      res.write('data: [DONE]\n\n');
      res.end();
    } catch (error) {
      send({ type: 'error', message: error.message || 'Compilation failed' });
      res.write('data: [DONE]\n\n');
      res.end();
    }
  });

  app.post('/api/tools/execute', upload.any(), async (req, res) => {
    const type = req.body?.type;
    const inputMode = req.body?.inputMode || 'code';

    if (!type) {
      return res.status(400).json({ success: false, error: 'type is required' });
    }

    try {
      let code = req.body?.code || '';
      let fileName = 'program';

      if (inputMode === 'file') {
        const f = (req.files || [])[0];
        if (!f) {
          return res.status(400).json({ success: false, error: 'file is required for file mode' });
        }
        code = f.buffer.toString('utf8');
        fileName = f.originalname || 'program';
      } else {
        fileName = req.body?.fileName || 'program';
      }

      if (!code || !code.trim()) {
        return res.status(400).json({ success: false, error: 'Code is empty' });
      }

      const result = await executeCode(type, code, fileName);
      if (!result.ok) {
        return res.status(200).json({ success: false, error: result.output || 'Execution failed' });
      }

      return res.json({
        success: true,
        output: result.output || 'Execution completed locally',
        fileName,
        files: [],
      });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message || 'Execution failed' });
    }
  });

  return app;
}

async function startLocalServer({ port, allowedOrigin }) {
  if (serverRef) return;

  appRef = createApp(allowedOrigin);

  await new Promise((resolve, reject) => {
    serverRef = appRef.listen(port, '127.0.0.1', () => {
      console.log(`[trustinn-desktop] Local execution server listening on 127.0.0.1:${port}`);
      resolve();
    });

    serverRef.on('error', (err) => {
      reject(err);
    });
  });
}

async function stopLocalServer() {
  if (!serverRef) return;
  await new Promise((resolve) => {
    serverRef.close(() => resolve());
  });
  serverRef = null;
  appRef = null;
}

module.exports = {
  startLocalServer,
  stopLocalServer,
};
