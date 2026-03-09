import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

export const maxDuration = 300; // 5 minutes for Vercel

// ─── Get file extension by language ────────────────────────────────────────
function getExt(lang: string): string {
  const map: Record<string, string> = { c: 'c', java: 'java', python: 'py', solidity: 'sol' };
  return map[lang.toLowerCase()] || 'txt';
}

// ─── Streaming compile handler ─────────────────────────────────────────────
export async function POST(request: NextRequest) {
  let tempDir = '';
  const encoder = new TextEncoder();

  try {
    const { language, code, fileName } = await request.json();

    if (!language || !code) {
      return NextResponse.json({ error: 'Language and code required' }, { status: 400 });
    }

    const lang = language.toLowerCase();
    tempDir = `/tmp/compile-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    fs.mkdirSync(tempDir, { recursive: true });

    // Write code to file with appropriate name based on language
    const ext = getExt(lang);
    let codeFileName = `code.${ext}`;
    
    // For Java, extract the class name (public or private) and use that as filename
    if (lang === 'java') {
      // Try to find public class first
      let classNameMatch = code.match(/public\s+class\s+(\w+)/);
      // If no public class, try any class declaration
      if (!classNameMatch) {
        classNameMatch = code.match(/class\s+(\w+)/);
      }
      if (classNameMatch) {
        codeFileName = `${classNameMatch[1]}.java`;
      }
    }
    
    const codeFile = path.join(tempDir, codeFileName);
    fs.writeFileSync(codeFile, code);

    // Create streaming response
    const stream = new ReadableStream({
      start(controller) {
        // Immediately send compilation started
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'start', message: `Compiling ${fileName || `code.${ext}`}...`, time: new Date().toISOString() })}\n\n`)
        );

        // Run compilation and stream output
        (async () => {
          try {
            let compileCmd = '';
            let displayMsg = '';
            let hasOutput = false;

            switch (lang) {
              case 'c':
                // Compile to executable then run it
                compileCmd = `cd ${tempDir} && gcc -o code code.c 2>&1 && ./code 2>&1`;
                displayMsg = 'Compiling C code...';
                break;
              case 'java':
                // Extract class name from filename and run after compilation
                const javaClassName = codeFileName.replace('.java', '');
                compileCmd = `cd ${tempDir} && javac ${codeFileName} 2>&1 && java ${javaClassName} 2>&1`;
                displayMsg = `Compiling ${codeFileName}...`;
                break;
              case 'python':
                // Execute Python script directly to show output
                compileCmd = `cd ${tempDir} && python3 code.py 2>&1`;
                displayMsg = 'Running Python code...';
                break;
              case 'solidity':
                // Just compile Solidity - shows bytecode/ABI
                compileCmd = `cd ${tempDir} && solc code.sol 2>&1`;
                displayMsg = 'Compiling Solidity code...';
                break;
              default:
                throw new Error(`Unsupported language: ${lang}`);
            }

            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'output', message: displayMsg, stream: 'stdout' })}\n\n`)
            );

            // Stream compilation output in real-time
            const proc = spawn('bash', ['-c', compileCmd], {
              cwd: tempDir,
              stdio: ['ignore', 'pipe', 'pipe'],
            });

            // Stream stdout
            proc.stdout?.on('data', (chunk) => {
              const text = chunk.toString().trim();
              if (text) {
                hasOutput = true;
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: 'output', message: text, stream: 'stdout' })}\n\n`)
                );
              }
            });

            // Stream stderr
            proc.stderr?.on('data', (chunk) => {
              const text = chunk.toString().trim();
              if (text) {
                hasOutput = true;
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: 'output', message: text, stream: 'stderr' })}\n\n`)
                );
              }
            });

            // Handle completion
            proc.on('close', (code) => {
              if (code === 0) {
                // If compilation succeeded but no output, show informational message
                if (!hasOutput) {
                  if (lang === 'c') {
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ type: 'output', message: '(Program executed with no output)', stream: 'stdout' })}\n\n`)
                    );
                  } else if (lang === 'python') {
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ type: 'output', message: '(Python script executed with no output)', stream: 'stdout' })}\n\n`)
                    );
                  } else if (lang === 'java') {
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ type: 'output', message: `(Java program executed)`, stream: 'stdout' })}\n\n`)
                    );
                  } else if (lang === 'solidity') {
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ type: 'output', message: '(Solidity compiled successfully)', stream: 'stdout' })}\n\n`)
                    );
                  }
                }
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: 'success', message: '✅ Compilation successful', exitCode: code })}\n\n`)
                );
              } else {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: 'error', message: `❌ Compilation failed (exit code: ${code})`, exitCode: code })}\n\n`)
                );
              }
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              controller.close();

              // Cleanup
              try {
                fs.rmSync(tempDir, { recursive: true, force: true });
              } catch {}
            });

            // Handle process errors
            proc.on('error', (err) => {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: 'error', message: `❌ Process error: ${err.message}` })}\n\n`)
              );
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              controller.close();
            });
          } catch (err) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'error', message: `❌ ${err instanceof Error ? err.message : 'Unknown error'}` })}\n\n`)
            );
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
             controller.close();
          }
        })();
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (err) {
    console.error('[compile-stream] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
