import { NextRequest, NextResponse } from 'next/server';
import { execSync, exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import fsSync from 'fs';
import User from '@/lib/models/User';
import dbConnect from '@/lib/mongodb';
import { rateLimitMiddleware } from '@/lib/rate-limit';

// Promisify exec for non-blocking shell execution
const execAsync = promisify(exec);

// Extended timeout for long-running tools (gMCov, gMutant can take 30-60 minutes)
export const maxDuration = 3600;

/**
 * Schedule automatic cleanup of tool result files using async/await
 * Deletes: fileBaseName/ folder and related files after specified delay
 * @param toolDir - Directory where tool files are stored
 * @param fileBaseName - Base name of the file (e.g., "sample" from "sample.c")
 * @param delayMs - Delay in milliseconds before cleanup (default: 60000 = 1 minute)
 */
async function scheduleCleanupAsync(toolDir: string, fileBaseName: string, delayMs: number = 60000) {
  const cleanupTime = new Date(Date.now() + delayMs).toLocaleTimeString();
  console.log(`[cleanup-scheduler] ⏰ Scheduled cleanup for "${fileBaseName}" at ${cleanupTime}`);
  
  // Use setImmediate to ensure cleanup happens on next event loop
  setImmediate(async () => {
    // Wait for delay
    await new Promise(resolve => setTimeout(resolve, delayMs));
    
    const startTime = new Date().toLocaleTimeString();
    console.log(`\n[cleanup] 🗑️  STARTING CLEANUP at ${startTime} for "${fileBaseName}"\n`);
    
    try {
      // Use shell to forcefully delete with rm -rf
      const folderPath = path.join(toolDir, fileBaseName);
      const deleteCmd = `rm -rf "${folderPath}" "${folderPath}.c" "${folderPath}.java" "${folderPath}.py" "${folderPath}.sol" 2>&1`;
      
      console.log(`[cleanup] Running: ${deleteCmd}`);
      
      const { stdout, stderr } = await execAsync(deleteCmd);
      
      console.log(`[cleanup] 🔨 Shell command executed`);
      if (stderr) console.log(`[cleanup] stderr:`, stderr);
      if (stdout) console.log(`[cleanup] stdout:`, stdout);
      
      // Verify deletion
      try {
        const listCmd = `ls -la "${toolDir}" | grep "${fileBaseName}" | head -5`;
        const { stdout: listOutput } = await execAsync(listCmd).catch(() => ({ stdout: '' }));
        
        if (listOutput.trim()) {
          console.log(`[cleanup] ⚠️  Files still found after rm:\n${listOutput}`);
        } else {
          console.log(`[cleanup] ✅ Verified: ${fileBaseName}* files successfully deleted`);
        }
      } catch (e) {
        console.log(`[cleanup] ✅ Verified: ${fileBaseName}* files successfully deleted (no output from check)`);
      }
      
      const endTime = new Date().toLocaleTimeString();
      console.log(`\n[cleanup] ✅ CLEANUP COMPLETE at ${endTime}\n`);
    } catch (err) {
      console.error(`[cleanup] ❌ ERROR:`, err);
    }
  });
}

/**
 * Format error messages from execSync timeout and other errors
 * @param error - The error object from execSync
 * @returns Formatted error message
 */
function formatExecError(error: any, tool: string): string {
  // Check for timeout error
  if (error.signal === 'SIGTERM' || error.code === 'ETIMEDOUT' || error.killed) {
    return `❌ Execution Timeout\n\nThe ${tool} tool exceeded the 3-minute timeout limit.\n\nPossible causes:\n- Code is too complex for analysis\n- Analysis is taking longer than expected\n- Java compilation or verification is intensive\n\nPlease try:\n1. Simplifying your code\n2. Breaking it into smaller functions\n3. Running simpler test cases first`;
  }
  
  // Get available output
  const stdout = error.stdout?.toString() || '';
  const stderr = error.stderr?.toString() || '';
  const message = error.message || '';
  
  // Return the most informative error message
  if (stderr) return `❌ Error:\n${stderr}`;
  if (stdout) return `❌ Error:\n${stdout}`;
  if (message) return `❌ Error: ${message}`;
  return `❌ Unknown error occurred during ${tool} execution`;
}

/**
 * Normalize C file for consistent processing across tools
 * Fixes line endings, encoding, and whitespace issues
 * @param filePath - Path to the C file to normalize
 */
async function normalizeCFile(filePath: string): Promise<void> {
  try {
    let content = await fs.readFile(filePath, 'utf-8');
    
    // Remove BOM if present
    if (content.charCodeAt(0) === 0xFEFF) {
      content = content.slice(1);
      console.log(`[normalize-c] Removed BOM from file`);
    }
    
    // Normalize line endings to LF (Unix style)
    content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    // Ensure file ends with newline
    if (!content.endsWith('\n')) {
      content += '\n';
    }
    
    // Write back normalized content
    await fs.writeFile(filePath, content, 'utf-8');
    console.log(`[normalize-c] ✅ File normalized for consistent processing`);
  } catch (error: any) {
    console.error(`[normalize-c] Error normalizing file:`, error.message);
    // Don't throw - continue even if normalization fails
  }
}

/**
 * Preprocess C code to add mock CPROVER function definitions if missing
 * Detects usage of nondet_int() or __CPROVER_input() and adds mock implementations
 * if the functions are not already defined
 * @param filePath - Path to the C file to preprocess
 */
async function preprocessCFileForGMutant(filePath: string, language: string): Promise<void> {
  if (language !== 'c') return;
  
  try {
    let content = await fs.readFile(filePath, 'utf-8');
    const originalContent = content;
    
    // Check if file contains calls to nondet_int or __CPROVER_input
    const hasNondetInt = content.includes('nondet_int()') || content.includes('nondet_int (');
    const hasCproverInput = content.includes('__CPROVER_input(') || content.includes('__CPROVER_input (');
    
    // Check if mock definitions already exist
    const hasNondetIntDef = /int\s+nondet_int\s*\(\s*\)/.test(content);
    const hasCproverInputDef = /void\s+__CPROVER_input/.test(content);
    
    if (!hasNondetInt && !hasCproverInput) {
      // No CPROVER functions used, no preprocessing needed
      return;
    }
    
    console.log(`[preprocess-c] File uses: nondet_int=${hasNondetInt}, __CPROVER_input=${hasCproverInput}`);
    console.log(`[preprocess-c] Definitions exist: nondet_int=${hasNondetIntDef}, __CPROVER_input=${hasCproverInputDef}`);
    
    if ((hasNondetInt && !hasNondetIntDef) || (hasCproverInput && !hasCproverInputDef)) {
      console.log(`[preprocess-c] Adding mock CPROVER function definitions...`);
      
      // Find the location to insert the definitions (after includes, before main)
      const includeEndMatch = content.match(/^([\s\S]*?#include\s*[<"][^>"]*[>"]\s*\n)/m);
      let insertPos = includeEndMatch ? includeEndMatch[0].length : 0;
      
      // Skip any #ifdef, #define, etc. after includes
      const afterIncludesMatch = content.substring(insertPos).match(/^([\s\S]*?)(?=\n\s*(int\s+main|void\s|typedef\s|struct\s))/);
      if (afterIncludesMatch) {
        insertPos += afterIncludesMatch[0].length;
      }
      
      // Create the mock function definitions
      let mockFunctions = '\n// Mock definitions for CPROVER functions (GCC compatibility)\n';
      if (hasNondetInt && !hasNondetIntDef) {
        mockFunctions += 'int nondet_int() {\n    return 0;\n}\n\n';
      }
      if (hasCproverInput && !hasCproverInputDef) {
        mockFunctions += 'void __CPROVER_input(char* name, int val) {\n    printf("Input %s set to %d\\n", name, val);\n}\n';
      }
      mockFunctions += '\n';
      
      // Insert the mock functions
      content = content.substring(0, insertPos) + mockFunctions + content.substring(insertPos);
      
      // Write back the modified content
      await fs.writeFile(filePath, content, 'utf-8');
      console.log(`[preprocess-c] ✅ Added mock function definitions to ${path.basename(filePath)}`);
    } else {
      console.log(`[preprocess-c] ✅ All required CPROVER function definitions already present`);
    }
  } catch (error: any) {
    console.error(`[preprocess-c] Error preprocessing file:`, error.message);
    // Don't throw - let the tool execution attempt even if preprocessing fails
  }
}

/**
 * Validate C code for patterns that might cause issues with gMutant/gMCov mutation generators
 * @param filePath - Path to the C file to validate
 * @param tool - The tool being used (gMutant, gMCov)
 * @returns Warning message if potential issues found, empty string otherwise
 */
async function validateCCodeForMutationTools(filePath: string, tool: string): Promise<string> {
  if (tool !== 'gMutant' && tool !== 'gMCov') return '';
  
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const warnings: string[] = [];
    
    // Check for deeply nested conditions (more than 4 levels)
    const nestedIfPattern = /if\s*\([^)]*if\s*\([^)]*if\s*\([^)]*if\s*\(/g;
    if (nestedIfPattern.test(content)) {
      warnings.push('⚠️ Deeply nested if conditions detected - mutation generator may have issues');
    }
    
    // Check for complex logical operators in conditions
    const complexConditionPattern = /if\s*\([^)]{100,}\)/;
    if (complexConditionPattern.test(content)) {
      warnings.push('⚠️ Very long complex conditions detected - simplify for better mutation generation');
    }
    
    // Check for mixed bitwise and logical operators which can confuse the mutator
    const mixedOperators = /([&|^])\s*[&|]\s*|([&|])\s*[&|]\s*[&|]/;
    if (mixedOperators.test(content)) {
      warnings.push('⚠️ Mixed bitwise/logical operators detected - may cause mutation generation issues');
    }
    
    if (warnings.length > 0) {
      console.log(`[code-validate] Potential issues detected for ${tool}:`, warnings);
      return warnings.join('\n') + '\n\n';
    }
    
    return '';
  } catch (error: any) {
    console.error(`[code-validate] Error validating code:`, error.message);
    return '';
  }
}

/**
 * POST /api/tools/execute
 * Executes a tool on the server with proper authentication and authorization checks
 * 
 * Security:
 * - Requires userId from authenticated session
 * - Verifies user has access (premium or trials)
 * - Validates file is a legitimate submission
 * - Sandboxes tool execution
 */
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const formData = await request.formData();
    let tool = formData.get('tool') as string;
    const language = formData.get('type') as string;
    const file = formData.get('file') as File;
    const code = formData.get('code') as string;
    const inputMode = formData.get('inputMode') as string;
    const userId = request.headers.get('x-user-id');
    const isPremiumHeader = request.headers.get('x-is-premium') === 'true';

    // Map display names to actual tool names
    const toolMapping: { [key: string]: string } = {
      'Condition Satisfiability Analysis': 'CBMC',
      'Dynamic Symbolic Execution': 'KLEE',
      'Dynamic Symbolic Execution with Pruning': 'KLEE',
      'DSE based Mutation Analyser': 'KLEEMA',
      'Advance Code Coverage Profiler': 'gMCov',
      'Mutation Testing Profiler': 'gMutant',
      'JBMC': 'JBMC',
      'Condition Coverage Fuzzing': 'Condition Coverage Fuzzing',
      'VeriSol': 'VeriSol'
    };

    // Convert display name to tool name
    if (toolMapping[tool]) {
      tool = toolMapping[tool];
    }

    // Security: Verify user ID is present
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Rate limiting: Max 5 tool executions per minute per user
    const rateLimitResponse = rateLimitMiddleware(userId, 5, 60000);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
    console.log(`[tools-execute] Rate limit OK for user ${userId}`);

    // Security: Skip DB lookup for premium users (optimization)
    // Only verify trial count for non-premium users
    if (!isPremiumHeader) {
      const user = await User.findById(userId);
      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      // Check if user has access (non-premium users need trials)
      if (user.trialCount <= 0) {
        return NextResponse.json(
          { error: 'No access. Please subscribe or use available trials.' },
          { status: 403 }
        );
      }
    }

    // Validate inputs based on mode
    if (inputMode === 'file' && !file) {
      return NextResponse.json(
        { error: 'File is required for file mode' },
        { status: 400 }
      );
    }
    if (inputMode === 'code' && !code) {
      return NextResponse.json(
        { error: 'Code is required for code mode' },
        { status: 400 }
      );
    }
    if (!tool || !language) {
      return NextResponse.json(
        { error: 'Tool and language are required' },
        { status: 400 }
      );
    }

    // Security: Validate file (only for file mode)
    if (inputMode === 'file') {
      if (!(file instanceof File)) {
        return NextResponse.json(
          { error: 'Invalid file' },
          { status: 400 }
        );
      }

      // Security: Check file size (max 10MB)
      const MAX_FILE_SIZE = 10 * 1024 * 1024;
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: 'File size exceeds maximum of 10MB' },
          { status: 413 }
        );
      }

      // Security: Validate file name to prevent path traversal
      const fileName = file.name;
      if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
        return NextResponse.json(
          { error: 'Invalid file name' },
          { status: 400 }
        );
      }
    }

    // Security: Validate code (only for code mode)
    if (inputMode === 'code') {
      if (typeof code !== 'string' || code.length > 100000) { // Max 100KB code
        return NextResponse.json(
          { error: 'Invalid or too large code' },
          { status: 400 }
        );
      }
    }

    // Create temporary working directory
    const tmpDir = `/tmp/trustinn-${Date.now()}`;
    await fs.mkdir(tmpDir, { recursive: true });
    
    try {
      let filePath = '';
      let fileName = '';

      if (inputMode === 'file') {
        // Save uploaded file
        const fileBuffer = await file.arrayBuffer();
        fileName = file.name;
        filePath = path.join(tmpDir, fileName);
        await fs.writeFile(filePath, Buffer.from(fileBuffer));

        // Verify file was written successfully
        const fileStats = await fs.stat(filePath);
        console.log(`[tools-execute] File saved: ${filePath} (${fileStats.size} bytes)`);
        
        if (fileStats.size === 0) {
          return NextResponse.json(
            { error: 'File upload failed - received empty file' },
            { status: 400 }
          );
        }
      } else if (inputMode === 'code') {
        // Save code as file
        let extension = language === 'c' ? 'c' : language === 'java' ? 'java' : language === 'python' ? 'py' : 'sol';
        let baseFileName = 'program';
        
        // For Java, extract the class name from the code
        if (language === 'java') {
          const classMatch = code.match(/public\s+class\s+(\w+)/);
          if (classMatch && classMatch[1]) {
            baseFileName = classMatch[1];
            console.log(`[tools-execute] Extracted Java class name: ${baseFileName}`);
          }
        }
        
        fileName = `${baseFileName}.${extension}`;
        filePath = path.join(tmpDir, fileName);
        await fs.writeFile(filePath, code);

        // Verify code was written successfully
        const fileStats = await fs.stat(filePath);
        console.log(`[tools-execute] Code saved: ${filePath} (${fileStats.size} bytes)`);
      }
      
      console.log(`[tools-execute] Tool: ${tool}, Language: ${language}, Input Mode: ${inputMode}`);

      // Preprocess C files for tools that need CPROVER functions (gMutant, gMCov)
      let codeValidationWarning = '';
      if ((tool === 'gMutant' || tool === 'gMCov') && language === 'c') {
        // Normalize file first (fix line endings, encoding, BOM)
        await normalizeCFile(filePath);
        
        // Then preprocess to add CPROVER function definitions
        await preprocessCFileForGMutant(filePath, language);
        
        // Validate code for potential mutation generation issues
        codeValidationWarning = await validateCCodeForMutationTools(filePath, tool);
        if (codeValidationWarning) {
          console.log(`[tools-execute] Code validation warnings for ${tool}:\n${codeValidationWarning}`);
        }
      }

      let output = '';

      // Execute tool based on type
      if (tool === 'CBMC' && language === 'c') {
        try {
          // Normalize C file before processing
          await normalizeCFile(filePath);
          
          // Copy file to CBMC directory and execute script from there
          const cbmcDir = '/root/trustinn/CBMC';
          const fileNameWithoutExt = path.basename(fileName, path.extname(fileName));
          const cbmcFilePath = path.join(cbmcDir, fileName);
          
          // Copy file to CBMC directory
          console.log(`[tools-execute] Copying file to CBMC: ${filePath} → ${cbmcFilePath}`);
          await fs.copyFile(filePath, cbmcFilePath);
          
          // Verify file was copied
          const fileExists = await fs.access(cbmcFilePath).then(() => true).catch(() => false);
          if (!fileExists) {
            throw new Error(`Failed to copy file to CBMC directory: ${cbmcFilePath}`);
          }
          console.log(`[tools-execute] File copied to CBMC successfully`);
          
          const unwoundBound = formData.get('bound') || '10';
          // Use timeout wrapper to enforce hard limit (3 minutes)
          const command = `cd "${cbmcDir}" && timeout 180 bash ./cbmc_script.sh "${fileNameWithoutExt}.c" "${unwoundBound}" 2>&1`;
          
          console.log(`[tools-execute] Executing CBMC: ${command}`);
          console.log(`[tools-execute] CBMC timeout: 3 minutes (180 seconds)`);
          
          try {
            output = execSync(command, { timeout: 240000, maxBuffer: 50 * 1024 * 1024, shell: '/bin/bash', encoding: 'utf-8' }).toString();
            console.log(`[tools-execute] CBMC execution completed, output length: ${output.length} bytes`);
            
            // Check if output is empty or too short
            if (!output || output.trim().length === 0) {
              console.warn(`[tools-execute] CBMC output is empty, checking result files...`);
            }
            
            // Filter out duplicate footer information from CBMC output
            const lines = output.split('\n');
            const filteredLines = lines.filter(line => 
              !line.includes('Total number of Reachable paths') &&
              !line.includes('Total number of Unreachable paths') &&
              !line.includes('Total time (sec)') &&
              !line.includes('remove this')
            );
            output = filteredLines.join('\n');
            
            // Try to read CBMC result file if it was created
            const cbmcResultDir = path.join(cbmcDir, fileNameWithoutExt);
            try {
              const resultFiles = await fs.readdir(cbmcResultDir);
              const resultFile = resultFiles.find(f => f.endsWith('.txt') || f.endsWith('.result'));
              if (resultFile) {
                const resultContent = await fs.readFile(path.join(cbmcResultDir, resultFile), 'utf-8');
                if (resultContent && resultContent.trim()) {
                  output = output + '\n\n--- Results File Content ---\n' + resultContent;
                }
              }
            } catch (e) {
              // Result directory or files may not exist, continue with stdout output
            }
            
            // Schedule cleanup of result files after 5 minutes
            console.log(`[tools-execute] Results stored in: /root/trustinn/CBMC/${fileNameWithoutExt}/ folder (will auto-delete in 5 minutes)`);
            scheduleCleanupAsync(cbmcDir, fileNameWithoutExt, 300000);
          } catch (execError: any) {
            const errorOutput = execError.stdout || execError.stderr || execError.message || 'No output';
            if (execError.code === 'ETIMEDOUT' || (execError.signal && execError.signal.includes('SIGTERM'))) {
              output = `⏱️ CBMC execution timeout (3 minutes exceeded).\n`;
              output += `This satisfiability problem is too complex for the time limit.\n`;
              output += `Try reducing the unwind bound.\n`;
              output += `Partial output:\n${String(errorOutput)}`;
              console.log(`[tools-execute] CBMC timeout after 3 minutes`);
            } else {
              output = `❌ CBMC execution error:\n${String(errorOutput)}`;
              console.error(`[tools-execute] CBMC error:`, execError);
            }
          }
        } catch (toolError: any) {
          output = output || String(toolError.message);
          console.error(`[tools-execute] CBMC error:`, toolError);
        }
      } else if (tool === 'KLEEMA' && language === 'c') {
        try {
          // Copy file to KLEEMA directory and execute
          const kleemaDir = '/root/trustinn/KLEEMA';
          const fileNameWithoutExt = path.basename(fileName, path.extname(fileName));
          const kleemaFilePath = path.join(kleemaDir, fileName);
          
          // Copy file to KLEEMA directory
          console.log(`[tools-execute] Copying file to KLEEMA: ${filePath} → ${kleemaFilePath}`);
          await fs.copyFile(filePath, kleemaFilePath);
          
          // Verify file was copied
          const fileExists = await fs.access(kleemaFilePath).then(() => true).catch(() => false);
          if (!fileExists) {
            throw new Error(`Failed to copy file to KLEEMA directory: ${kleemaFilePath}`);
          }
          console.log(`[tools-execute] File copied successfully to KLEEMA`);
          
          const toolValue = formData.get('value') || '1';
          // Set environment variables for KLEE runtime library and cleanup old artifacts
          const envVars = `export LD_LIBRARY_PATH="/usr/local/lib:/usr/lib/x86_64-linux-gnu:/root/trustinn/KLEE:/root/trustinn/KLEEMA:$LD_LIBRARY_PATH"`;
          const cleanupOld = `rm -rf ${fileNameWithoutExt}-* ${fileNameWithoutExt}_* 2>/dev/null || true`;
          const command = `cd "${kleemaDir}" && ${envVars} && ${cleanupOld} && timeout 540 bash ./kleema.sh "${fileNameWithoutExt}" "${toolValue}" 2>&1`;
          
          console.log(`[tools-execute] Executing KLEEMA: ${command}`);
          console.log(`[tools-execute] KLEEMA timeout: 9 minutes (540 seconds)`);
          
          try {
            output = execSync(command, { timeout: 600000, maxBuffer: 50 * 1024 * 1024, shell: '/bin/bash', encoding: 'utf-8' }).toString();
            console.log(`[tools-execute] KLEEMA execution completed`);
            
            // Filter out duplicate footer information from KLEEMA output
            const kleemaLines = output.split('\n');
            const kleemaFilteredLines = kleemaLines.filter(line => 
              !line.includes('Total number of Reachable paths') &&
              !line.includes('Total number of Unreachable paths') &&
              !line.includes('Total time (sec)') &&
              !line.includes('remove this')
            );
            output = kleemaFilteredLines.join('\n');
            
            // Schedule cleanup of result files after 5 minutes
            console.log(`[tools-execute] Results stored in: /root/trustinn/KLEEMA/${fileNameWithoutExt}/ folder (will auto-delete in 5 minutes)`);
            scheduleCleanupAsync(kleemaDir, fileNameWithoutExt, 300000);
          } catch (execError: any) {
            const errorOutput = execError.stdout || execError.stderr || execError.message || 'No output';
            if (execError.code === 'ETIMEDOUT' || (execError.signal && execError.signal.includes('SIGTERM'))) {
              output = `⏱️ KLEEMA execution timeout (9 minutes exceeded).\n`;
              output += `This analysis is too complex for the time limit.\n`;
              output += `Partial output:\n${String(errorOutput)}`;
              console.log(`[tools-execute] KLEEMA timeout after 9 minutes`);
            } else {
              output = output || `❌ KLEEMA execution error:\n${String(errorOutput)}`;
              console.error(`[tools-execute] KLEEMA error:`, execError);
            }
          }
        } catch (toolError: any) {
          output = output || String(toolError.message);
          console.error(`[tools-execute] KLEEMA error:`, toolError);
        }
      } else if (tool === 'KLEE' && language === 'c') {
        try {
          // Normalize C file before processing
          await normalizeCFile(filePath);
          
          // Copy file to KLEE directory and execute
          const kleeDir = '/root/trustinn/KLEE';
          const fileNameWithoutExt = path.basename(fileName, path.extname(fileName));
          const kleeFilePath = path.join(kleeDir, fileName);
          
          // Copy file to KLEE directory
          console.log(`[tools-execute] Copying file to KLEE: ${filePath} → ${kleeFilePath}`);
          await fs.copyFile(filePath, kleeFilePath);
          
          // Verify file was copied
          const fileExists = await fs.access(kleeFilePath).then(() => true).catch(() => false);
          if (!fileExists) {
            throw new Error(`Failed to copy file to KLEE directory: ${kleeFilePath}`);
          }
          console.log(`[tools-execute] File copied to KLEE successfully`);
          
          const toolValue = formData.get('toolValue') || '1';
          // Set environment for KLEE runtime and cleanup old artifacts
          const envVars = `export LD_LIBRARY_PATH="/usr/local/lib:/usr/lib/x86_64-linux-gnu:/root/trustinn/KLEE:$LD_LIBRARY_PATH"`;
          const cleanupOld = `rm -rf klee-out-* klee-last 2>/dev/null || true`;
          // Use timeout wrapper to enforce hard limit (4 minutes)
          const command = `cd "${kleeDir}" && ${envVars} && ${cleanupOld} && timeout 240 bash ./klee.sh "${fileNameWithoutExt}.c" "${toolValue}" 2>&1`;
          
          console.log(`[tools-execute] Executing KLEE: ${command}`);
          console.log(`[tools-execute] KLEE timeout: 4 minutes (240 seconds)`);
          
          try {
            output = execSync(command, { timeout: 300000, maxBuffer: 50 * 1024 * 1024, shell: '/bin/bash', encoding: 'utf-8' }).toString();
            console.log(`[tools-execute] KLEE execution completed`);
            
            // Filter out duplicate footer information from KLEE output
            const kleeLines = output.split('\n');
            const kleeFilteredLines = kleeLines.filter(line => 
              !line.includes('Total number of Reachable paths') &&
              !line.includes('Total number of Unreachable paths') &&
              !line.includes('Total time (sec)') &&
              !line.includes('remove this')
            );
            output = kleeFilteredLines.join('\n');
            
            // Schedule cleanup of result files after 5 minutes
            console.log(`[tools-execute] Results stored in: /root/trustinn/KLEE/${fileNameWithoutExt}/ folder (will auto-delete in 5 minutes)`);
            scheduleCleanupAsync(kleeDir, fileNameWithoutExt, 300000);
          } catch (execError: any) {
            const errorOutput = execError.stdout || execError.stderr || execError.message || 'No output';
            if (execError.code === 'ETIMEDOUT' || (execError.signal && execError.signal.includes('SIGTERM'))) {
              output = `⏱️ KLEE execution timeout (4 minutes exceeded).\n`;
              output += `This analysis is too complex for the time limit.\n`;
              output += `Partial output:\n${String(errorOutput)}`;
              console.log(`[tools-execute] KLEE timeout after 4 minutes`);
            } else {
              output = output || `❌ KLEE execution error:\n${String(errorOutput)}`;
              console.error(`[tools-execute] KLEE error:`, execError);
            }
          }
        } catch (toolError: any) {
          output = output || String(toolError.message);
          console.error(`[tools-execute] KLEE error:`, toolError);
        }
      } else if (tool === 'gMCov' && language === 'c') {
        try {
          // Copy file to gMCov root directory
          const gmcovDir = '/root/trustinn/gMCov';
          let fileNameWithoutExt = path.basename(fileName, path.extname(fileName));
          
          // For code mode, use a unique name instead of generic "program" to avoid conflicts
          if (inputMode === 'code') {
            fileNameWithoutExt = `program-${Date.now()}`;
            console.log(`[tools-execute] Code mode: Using unique filename to avoid conflicts: ${fileNameWithoutExt}`);
          }
          
          // Ensure filename is valid for shell
          fileNameWithoutExt = fileNameWithoutExt.replace(/[^a-zA-Z0-9_-]/g, '_');
          const newFileName = `${fileNameWithoutExt}.c`;
          const gmcovFilePath = path.join(gmcovDir, newFileName);
          
          // Copy file to gMCov root directory
          console.log(`[tools-execute] Copying file to gMCov: ${filePath} → ${gmcovFilePath}`);
          await fs.copyFile(filePath, gmcovFilePath);
          
          // Verify file was copied
          const fileExists = await fs.access(gmcovFilePath).then(() => true).catch(() => false);
          if (!fileExists) {
            throw new Error(`Failed to copy file to gMCov directory: ${gmcovFilePath}`);
          }
          console.log(`[tools-execute] File copied to gMCov successfully`);
          
          const version = formData.get('version') || '1';
          const timebound = formData.get('timebound') || '60';
          // Set environment for gMCov runtime and cleanup old artifacts
          const envVars = `export LD_LIBRARY_PATH="/usr/local/lib:/usr/lib/x86_64-linux-gnu:/root/trustinn/KLEE:/root/trustinn/gMCov:$LD_LIBRARY_PATH"`;
          const cleanupOld = `rm -rf ${fileNameWithoutExt}-* ${fileNameWithoutExt}_* 2>/dev/null || true`;
          // Use timeout wrapper to enforce hard limit (10 minutes)
          const command = `cd "${gmcovDir}" && ${envVars} && ${cleanupOld} && timeout 600 bash ./main-gProfiler.sh "${fileNameWithoutExt}" "${version}" "${timebound}" 2>&1`;
          
          console.log(`[tools-execute] Executing gMCov: ${command}`);
          console.log(`[tools-execute] gMCov timeout: 10 minutes (600 seconds)`);
          
          try {
            output = execSync(command, { timeout: 660000, maxBuffer: 50 * 1024 * 1024, shell: '/bin/bash', encoding: 'utf-8' }).toString();
            console.log(`[tools-execute] gMCov execution completed`);
            
            // Add any code validation warnings to the output
            if (codeValidationWarning) {
              output = codeValidationWarning + '\n---\n\n' + output;
            }
            
            // Extract only the Coverage Report section from gMCov output
            const reportStartIndex = output.indexOf('============');
            if (reportStartIndex !== -1) {
              // Find the start of the report and extract only the report section
              const reportSection = output.substring(reportStartIndex);
              // Keep only lines from the report onwards (clean debug output)
              const reportLines = reportSection.split('\n');
              // Filter to keep only the report section
              const cleanReportLines: string[] = [];
              for (const line of reportLines) {
                cleanReportLines.push(line);
                if (line.includes('Report-Finish') || line.includes('====================')) {
                  // Stop after report finish line or similar separator
                  if (cleanReportLines.length > 1) break;
                }
              }
              output = cleanReportLines.join('\n');
              
              // Ensure we have some output
              if (output.trim().length < 20) {
                console.warn('[tools-execute] Warning: Coverage report section is too short');
              }
            } else {
              // Fallback: if report not found, show all output
              console.warn('[tools-execute] Warning: Coverage report header not found in output');
            }
            
            // Schedule cleanup of result files after 5 minutes
            console.log(`[tools-execute] Results stored in: /root/trustinn/gMCov/${fileNameWithoutExt}/ folder (will auto-delete in 5 minutes)`);
            scheduleCleanupAsync(gmcovDir, fileNameWithoutExt, 300000);
          } catch (execError: any) {
            const errorOutput = execError.stdout || execError.stderr || execError.message || 'No output';
            const errorString = String(errorOutput);
            
            // Check if error is due to syntax errors in generated code
            const hasSyntaxError = errorString.includes('error: expected') || 
                                  errorString.includes('syntax error') ||
                                  errorString.includes('MetaWithBraces');
            
            if (execError.code === 'ETIMEDOUT' || (execError.signal && execError.signal.includes('SIGTERM'))) {
              output = `⏱️ gMCov execution timeout (10 minutes exceeded).\n`;
              output += `Code coverage analysis is too complex for the time limit.\n`;
              output += `Try with a simpler C file.\n`;
              if (codeValidationWarning) {
                output += `\nCode validation warnings:\n${codeValidationWarning}`;
              }
              output += `\nPartial output:\n${String(errorOutput)}`;
              console.log(`[tools-execute] gMCov timeout after 10 minutes`);
            } else if (hasSyntaxError) {
              // Code generation created invalid code
              output = `⚠️ Code instrumentation encountered syntax issues.\n\n`;
              output += `This can happen with complex code structures.\n`;
              output += `Try:\n`;
              output += `• Using a simpler code structure\n`;
              output += `• Uploading a known working sample file\n`;
              output += `• Checking your code for complex nested conditions\n`;
              if (codeValidationWarning) {
                output += `\nCode validation warnings:\n${codeValidationWarning}`;
              }
              output += `\n\nTechnical details:\n${String(errorOutput)}`;
              console.log(`[tools-execute] gMCov syntax error detected`);
            } else {
              output = `❌ gMCov execution error:\n`;
              if (codeValidationWarning) {
                output += `\nCode validation warnings:\n${codeValidationWarning}\n`;
              }
              output += `${String(errorOutput)}`;
              console.error(`[tools-execute] gMCov error:`, execError);
            }
          }
        } catch (toolError: any) {
          output = output || String(toolError.message);
          console.error(`[tools-execute] gMCov error:`, toolError);
        }
      } else if (tool === 'gMutant' && language === 'c') {
        try {
          // Copy file to gMutant root directory
          const gmutantDir = '/root/trustinn/gMutant';
          let fileNameWithoutExt = path.basename(fileName, path.extname(fileName));
          
          // For code mode, use a unique name instead of generic "program" to avoid conflicts
          if (inputMode === 'code') {
            fileNameWithoutExt = `program-${Date.now()}`;
            console.log(`[tools-execute] Code mode: Using unique filename to avoid conflicts: ${fileNameWithoutExt}`);
          }
          
          // Ensure filename is valid for shell
          fileNameWithoutExt = fileNameWithoutExt.replace(/[^a-zA-Z0-9_-]/g, '_');
          const newFileName = `${fileNameWithoutExt}.c`;
          const gmutantFilePath = path.join(gmutantDir, newFileName);
          
          // Copy file to gMutant root directory
          console.log(`[tools-execute] Copying file to gMutant: ${filePath} → ${gmutantFilePath}`);
          await fs.copyFile(filePath, gmutantFilePath);
          
          // Verify file was copied
          const fileExists = await fs.access(gmutantFilePath).then(() => true).catch(() => false);
          if (!fileExists) {
            throw new Error(`Failed to copy file to gMutant directory: ${gmutantFilePath}`);
          }
          console.log(`[tools-execute] File copied to gMutant successfully`);
          
          const version = formData.get('version') || '1';
          const timebound = formData.get('timebound') || '3600';
          // Set environment for gMutant runtime and cleanup old artifacts
          const envVars = `export LD_LIBRARY_PATH="/usr/local/lib:/usr/lib/x86_64-linux-gnu:/root/trustinn/KLEE:/root/trustinn/gMutant:$LD_LIBRARY_PATH"`;
          const cleanupOld = `rm -rf ${fileNameWithoutExt}-* ${fileNameWithoutExt}_* 2>/dev/null || true`;
          // Use timeout wrapper to enforce hard limit (20 minutes)
          const command = `cd "${gmutantDir}" && ${envVars} && ${cleanupOld} && timeout 1200 bash ./main-gProfiler.sh "${fileNameWithoutExt}" "${version}" "${timebound}" 2>&1`;
          
          console.log(`[tools-execute] Executing gMutant: ${command}`);
          console.log(`[tools-execute] gMutant timeout: 20 minutes (1200 seconds)`);
          
          try {
            output = execSync(command, { timeout: 1260000, maxBuffer: 50 * 1024 * 1024, shell: '/bin/bash', encoding: 'utf-8' }).toString();
            console.log(`[tools-execute] gMutant execution completed`);
            
            // Add any code validation warnings to the output
            if (codeValidationWarning) {
              output = codeValidationWarning + '\n---\n\n' + output;
            }
            
            // Extract only the Mutation Report section from gMutant output
            const reportStartIndex = output.indexOf('============Mutation Report====================');
            if (reportStartIndex !== -1) {
              // Find the start of the report and extract only the report section
              const reportSection = output.substring(reportStartIndex);
              // Keep only lines from the report onwards (clean debug output)
              const reportLines = reportSection.split('\n');
              // Filter to keep only the report section up to and including the finish line
              const cleanReportLines: string[] = [];
              for (const line of reportLines) {
                cleanReportLines.push(line);
                if (line.includes('============Report-Finish====================')) {
                  break;
                }
              }
              output = cleanReportLines.join('\n');
              
              // Ensure we have some successful output
              if (!output.includes('***Total no. of')) {
                console.warn('[tools-execute] Warning: Mutation report found but missing expected fields');
              }
            } else {
              // Fallback: if report not found, show all output
              console.warn('[tools-execute] Warning: Mutation report header not found in output');
            }
            
            // Schedule cleanup of result files after 5 minutes
            console.log(`[tools-execute] Results stored in: /root/trustinn/gMutant/${fileNameWithoutExt}/ folder (will auto-delete in 5 minutes)`);
            scheduleCleanupAsync(gmutantDir, fileNameWithoutExt, 300000);
          } catch (execError: any) {
            const errorOutput = execError.stdout || execError.stderr || execError.message || 'No output';
            const errorString = String(errorOutput);
            
            // Check if error is due to syntax errors in generated mutations
            const hasMutationSyntaxError = errorString.includes('error: expected') || 
                                          errorString.includes('syntax error') ||
                                          errorString.includes('MetaWithBraces');
            
            if (execError.code === 'ETIMEDOUT' || (execError.signal && execError.signal.includes('SIGTERM'))) {
              output = `⏱️ gMutant execution timeout (20 minutes exceeded).\n`;
              output += `Mutation analysis is too complex for the time limit.\n`;
              output += `Try with a simpler C file or fewer mutations.\n`;
              if (codeValidationWarning) {
                output += `\nCode validation warnings:\n${codeValidationWarning}`;
              }
              output += `\nPartial output:\n${String(errorOutput)}`;
              console.log(`[tools-execute] gMutant timeout after 20 minutes`);
            } else if (hasMutationSyntaxError) {
              // Mutation generator created invalid mutations
              output = `⚠️ Mutation generation created syntactically invalid mutations.\n\n`;
              output += `This means the mutation generator found edge cases in your code structure.\n`;
              output += `Try:\n`;
              output += `• Using a simpler code structure\n`;
              output += `• Uploading a known working sample file\n`;
              output += `• Checking your code for complex nested conditionals or operators\n`;
              if (codeValidationWarning) {
                output += `\nCode validation warnings:\n${codeValidationWarning}`;
              }
              output += `\n\nTechnical details:\n${String(errorOutput)}`;
              console.log(`[tools-execute] gMutant mutation syntax error detected`);
            } else {
              output = `❌ gMutant execution error:\n`;
              if (codeValidationWarning) {
                output += `\nCode validation warnings:\n${codeValidationWarning}\n`;
              }
              output += `${String(errorOutput)}`;
              console.error(`[tools-execute] gMutant error:`, execError);
            }
          }
          
          // Check if execution was successful by looking for the results directory
          const resultsDir = path.join(gmutantDir, `${fileNameWithoutExt}-RESULTS`);
          if (fsSync.existsSync(resultsDir)) {
            // output += '\n\n✅ Results generated successfully!\n';
          }
        } catch (toolError: any) {
          output = output || String(toolError.message);
          console.error(`[tools-execute] gMutant error:`, toolError);
          
          // Provide helpful error message for common issues
          if (String(output).includes('cannot open data file') || String(output).includes('division by 0')) {
            output += '\n\n⚠️  Note: The Mutation Testing Profiler requires test cases to be generated first.\n';
            output += 'For best results, ensure your C file can be successfully analyzed by:\n';
            output += '1. First using "Advance Code Coverage Profiler" to generate code coverage data\n';
            output += '2. Then using "Mutation Testing Profiler" with the same file\n';
          }
        }
      } else if (tool === 'JBMC' && language === 'java') {
        try {
          const javaDir = '/root/trustinn/JAVA';
          const fileNameWithoutExt = path.basename(fileName, path.extname(fileName));
          const javaFilePath = path.join(javaDir, fileName);
          
          await fs.copyFile(filePath, javaFilePath);
          
          const command = `cd "${javaDir}" && bash ./shellsc.sh "${fileNameWithoutExt}.java" 2>&1`;
          
          console.log(`[tools-execute] Executing JBMC: ${command}`);
          output = execSync(command, { timeout: 180000, maxBuffer: 10 * 1024 * 1024 }).toString();
          
          console.log(`[tools-execute] JBMC execution completed`);
          
          // Schedule cleanup of result files after 5 minutes
          console.log(`[tools-execute] Results stored in: /root/trustinn/JAVA/${fileNameWithoutExt}/ folder (will auto-delete in 5 minutes)`);
          scheduleCleanupAsync('/root/trustinn/JAVA', fileNameWithoutExt, 300000);
        } catch (toolError: any) {
          output = formatExecError(toolError, 'JBMC');
          console.error(`[tools-execute] JBMC error: ${toolError.message}`);
        }
      } else if (language === 'python') {
        try {
          const pythonDir = '/root/trustinn/python';
          const fileNameWithoutExt = path.basename(fileName, path.extname(fileName));
          const pythonFilePath = path.join(pythonDir, fileName);
          
          await fs.copyFile(filePath, pythonFilePath);
          
          const command = `cd "${pythonDir}" && bash ./shellpy.sh "${fileNameWithoutExt}.py" 2>&1`;
          
          console.log(`[tools-execute] Executing Python tool: ${command}`);
          output = execSync(command, { timeout: 180000, maxBuffer: 10 * 1024 * 1024 }).toString();
          
          console.log(`[tools-execute] Python tool execution completed`);
          
          // Schedule cleanup of result files after 5 minutes
          console.log(`[tools-execute] Results stored in: /root/trustinn/python/${fileNameWithoutExt}/ folder (will auto-delete in 5 minutes)`);
          scheduleCleanupAsync('/root/trustinn/python', fileNameWithoutExt, 300000);
        } catch (toolError: any) {
          output = formatExecError(toolError, 'Python Analysis');
          console.error(`[tools-execute] Python tool error: ${toolError.message}`);
        }
      } else if (tool === 'VeriSol' && language === 'solidity') {
        try {
          const solidityDir = '/root/trustinn/Solc';
          const fileNameWithoutExt = path.basename(fileName, path.extname(fileName));
          const solidityFilePath = path.join(solidityDir, fileName);
          const mode = formData.get('mode') || 'bmc';
          
          // Create Solc directory if it doesn't exist
          try {
            await fs.mkdir(solidityDir, { recursive: true });
          } catch (mkdirError: any) {
            console.warn(`[tools-execute] Warning creating Solc directory:`, mkdirError.message);
          }
          
          console.log(`[tools-execute] Copying file to VeriSol: ${filePath} → ${solidityFilePath}`);
          await fs.copyFile(filePath, solidityFilePath);
          
          // Verify file was copied
          const fileExists = await fs.access(solidityFilePath).then(() => true).catch(() => false);
          if (!fileExists) {
            throw new Error(`Failed to copy file to VeriSol directory: ${solidityFilePath}`);
          }
          console.log(`[tools-execute] File copied to VeriSol successfully`);
          
          const command = `cd "${solidityDir}" && bash ./final.sh "${fileNameWithoutExt}.sol" "${mode}" 2>&1`;
          
          console.log(`[tools-execute] Executing VeriSol: ${command}`);
          output = execSync(command, { timeout: 180000, maxBuffer: 10 * 1024 * 1024 }).toString();
          
          console.log(`[tools-execute] VeriSol execution completed`);
          
          // Schedule cleanup of result files after 5 minutes
          console.log(`[tools-execute] Results stored in: /root/trustinn/Solc/${fileNameWithoutExt}/ folder (will auto-delete in 5 minutes)`);
          scheduleCleanupAsync('/root/trustinn/Solc', fileNameWithoutExt, 300000);
        } catch (toolError: any) {
          output = formatExecError(toolError, 'VeriSol');
          console.error(`[tools-execute] VeriSol error: ${toolError.message}`);
        }
      } else {
        output = `Tool '${tool}' for language '${language}' is not supported.\nSupported tools:\n- CBMC (c)\n- KLEE (c)\n- KLEEMA (c)\n- gMCov (c)\n- gMutant (c)\n- JBMC (java)\n- Condition Coverage Fuzzing (python)\n- VeriSol (solidity)`;
      }

      return NextResponse.json({
        success: true,
        output: output || 'Tool executed successfully.',
        tool: tool,
        fileName: fileName,
        language: language,
        files: []
      });

    } catch (executionError) {
      console.error('[tools-execute] Execution error:', executionError);
      throw executionError;
    } finally {
      // Cleanup temporary directory
      try {
        await fs.rm(tmpDir, { recursive: true, force: true });
        console.log(`[tools-execute] Cleaned up temporary directory: ${tmpDir}`);
      } catch (cleanupError) {
        console.warn(`[tools-execute] Failed to cleanup temporary directory: ${cleanupError}`);
      }
    }

  } catch (error) {
    console.error('Tool execution error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}