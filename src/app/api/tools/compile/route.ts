import { NextRequest, NextResponse } from 'next/server';
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

export const maxDuration = 300; // 5 minute max for Vercel

// ─── Per-language timeouts (ms) ───────────────────────────────────────────────
const LANG_TIMEOUTS: Record<string, number> = {
  c:        30_000,  // 30 s  – gcc is fast
  java:     60_000,  // 60 s  – JVM startup + javac (for large files only)
  python:   20_000,  // 20 s  – py_compile + interpreter
  solidity: 45_000,  // 45 s  – solc can be slow
};

// Fast timeouts for small files (< 5KB)
const FAST_LANG_TIMEOUTS: Record<string, number> = {
  c:        10_000,  // 10 s
  java:     15_000,  // 15 s (JVM startup is minimal for simple code)
  python:   5_000,   // 5 s
  solidity: 20_000,  // 20 s
};

// ─── Low-level runner ─────────────────────────────────────────────────────────
function run(
  cmd: string,
  opts: { input?: string; timeoutMs?: number } = {}
): { stdout: string; stderr: string; success: boolean; timedOut: boolean } {
  const timeoutMs = opts.timeoutMs ?? 60_000;

  try {
    const result = spawnSync('bash', ['-c', cmd], {
      encoding:  'utf-8',
      maxBuffer: 10 * 1024 * 1024,
      stdio:     ['pipe', 'pipe', 'pipe'],
      input:     opts.input ?? undefined,
      timeout:   timeoutMs,
    });

    const timedOut =
      (result.error as NodeJS.ErrnoException)?.code === 'ETIMEDOUT' ||
      result.signal === 'SIGTERM';

    return {
      stdout:   result.stdout ?? '',
      stderr:   result.stderr ?? '',
      success:  result.status === 0 && !timedOut,
      timedOut,
    };
  } catch (err) {
    return {
      stdout:  '',
      stderr:  err instanceof Error ? err.message : String(err),
      success: false,
      timedOut: false,
    };
  }
}

// ─── Route handler ────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  let tempDir = '';

  try {
    const { language, code, fileName, input } = await request.json();

    if (!language || !code) {
      return NextResponse.json({ error: 'Language and code are required' }, { status: 400 });
    }

    const lang        = language.toLowerCase() as string;
    // Adaptive timeout: use fast timeout for small files (< 5KB)
    const isLargeCode = code.length > 5120;
    const timeoutMs   = isLargeCode 
      ? LANG_TIMEOUTS[lang] ?? 60_000
      : FAST_LANG_TIMEOUTS[lang] ?? 30_000;
    const displayName = fileName || `code.${getExt(lang)}`;

    tempDir = `/tmp/compile-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    fs.mkdirSync(tempDir, { recursive: true });

    const output = await compileAndRun(lang, code, input, tempDir, timeoutMs);

    return NextResponse.json({ success: true, fileName: displayName, language, output });
  } catch (err) {
    console.error('[compile] Error:', err);
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: msg, output: `Compilation failed: ${msg}` },
      { status: 500 }
    );
  } finally {
    if (tempDir) {
      try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch {}
    }
  }
}

// ─── Dispatch ─────────────────────────────────────────────────────────────────
async function compileAndRun(
  lang: string,
  code: string,
  input: string | undefined,
  tempDir: string,
  timeoutMs: number
): Promise<string> {
  switch (lang) {
    case 'c':        return compileC(code, input, tempDir, timeoutMs);
    case 'java':     return compileJava(code, input, tempDir, timeoutMs);
    case 'python':   return compilePython(code, input, tempDir, timeoutMs);
    case 'solidity': return compileSolidity(code, tempDir, timeoutMs);
    default:
      throw new Error(`Unsupported language: ${lang}`);
  }
}

// ─── C ────────────────────────────────────────────────────────────────────────
function compileC(code: string, input: string | undefined, tempDir: string, ms: number): string {
  const src = path.join(tempDir, 'code.c');
  const bin = path.join(tempDir, 'program');
  fs.writeFileSync(src, code);

  const compile = run(`gcc -Wall -Wextra "${src}" -o "${bin}" -lm`, { timeoutMs: ms });

  if (compile.timedOut)
    return `❌ Compilation timed out after ${ms / 1000}s.\nThe code may be too complex or contain an infinite loop.`;

  if (!compile.success)
    return `❌ Compilation Failed:\n${compile.stderr || compile.stdout || 'Unknown error'}`;

  const warnings = compile.stderr ? `\n⚠️  Compiler Warnings:\n${compile.stderr}\n` : '';

  // Run with a shorter exec timeout (20 s max)
  const exec = run(`"${bin}"`, { input, timeoutMs: Math.min(ms, 20_000) });

  if (exec.timedOut)
    return `✅ Compilation Successful!${warnings}\n\n⏱️  Execution timed out (program ran too long).`;

  return `✅ Compilation Successful!${warnings}\n\n${exec.stdout || '(no output)'}${exec.stderr ? `\nRuntime Errors:\n${exec.stderr}` : ''}`;
}

// ─── Java ─────────────────────────────────────────────────────────────────────
function compileJava(code: string, input: string | undefined, tempDir: string, ms: number): string {
  // Extract public class name so the file matches what javac expects
  const match   = code.match(/public\s+class\s+(\w+)/);
  const cls     = match?.[1] ?? 'Main';
  const src     = path.join(tempDir, `${cls}.java`);
  fs.writeFileSync(src, code);

  // javac is the slow part – give it the full language timeout
  const compile = run(`javac "${src}"`, { timeoutMs: ms });

  if (compile.timedOut)
    return `❌ Compilation timed out after ${ms / 1000}s.\nJava compilation can be slow on first run – try again or simplify the code.`;

  if (!compile.success) {
    const err = compile.stderr || compile.stdout || 'Unknown javac error';
    return `❌ Compilation Failed:\n${err}`;
  }

  const warnings = compile.stderr ? `\n⚠️  Compiler Warnings:\n${compile.stderr}\n` : '';

  // Run with 20 s exec timeout; set a small heap to avoid OOM
  const exec = run(
    `cd "${tempDir}" && java -Xmx256m -Xss4m ${cls}`,
    { input, timeoutMs: Math.min(ms, 20_000) }
  );

  if (exec.timedOut)
    return `✅ Compilation Successful!${warnings}\n\n⏱️  Execution timed out (program ran too long).`;

  return `✅ Compilation Successful!${warnings}\n\n${exec.stdout || '(no output)'}${exec.stderr ? `\nRuntime Errors:\n${exec.stderr}` : ''}`;
}

// ─── Python ───────────────────────────────────────────────────────────────────
function compilePython(code: string, input: string | undefined, tempDir: string, ms: number): string {
  const src = path.join(tempDir, 'code.py');
  fs.writeFileSync(src, code);

  // Syntax check
  const check = run(`python3 -m py_compile "${src}"`, { timeoutMs: ms });

  if (check.timedOut)
    return `❌ Syntax check timed out after ${ms / 1000}s.`;

  if (!check.success)
    return `❌ Syntax Check Failed:\n${check.stderr || check.stdout || 'Unknown syntax error'}`;

  // Execute
  const exec = run(`python3 "${src}"`, { input, timeoutMs: Math.min(ms, 20_000) });

  if (exec.timedOut)
    return `✅ Syntax Check Passed!\n\n⏱️  Execution timed out (program ran too long).`;

  return `✅ Syntax Check Passed!\n\n${exec.stdout || '(no output)'}${exec.stderr ? `\nErrors:\n${exec.stderr}` : ''}`;
}

// ─── Solidity ─────────────────────────────────────────────────────────────────
function compileSolidity(code: string, tempDir: string, ms: number): string {
  const src = path.join(tempDir, 'code.sol');
  fs.writeFileSync(src, code);

  const compile = run(`solc "${src}" --optimize`, { timeoutMs: ms });

  if (compile.timedOut)
    return `❌ Compilation timed out after ${ms / 1000}s.`;

  if (!compile.success)
    return `❌ Compilation Failed:\n${compile.stderr || compile.stdout || 'Unknown error'}`;

  const warnings = compile.stderr ? `\n⚠️  Warnings:\n${compile.stderr}` : '';

  return `✅ Compilation Successful!\n\nCommand:\nsolc code.sol --optimize${warnings}\n\n${'═'.repeat(36)}\n📦 Bytecode Output:\n${'═'.repeat(36)}\n${compile.stdout || '(Bytecode generated)'}`;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getExt(lang: string): string {
  return ({ c: 'c', java: 'java', python: 'py', solidity: 'sol' } as Record<string, string>)[lang] ?? lang;
}