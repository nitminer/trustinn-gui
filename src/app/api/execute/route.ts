import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import fsSync from 'fs';

const execAsync = promisify(exec);

export const maxDuration = 600; // 10 minute timeout for execution

export async function POST(request: NextRequest) {
  let formData: FormData;
  
  try {
    // Parse form data
    formData = await request.formData();
  } catch (error) {
    console.error('Error parsing form data:', error);
    return NextResponse.json(
      { error: 'Invalid form data' },
      { status: 400 }
    );
  }

  try {
    const file = formData.get('file') as File;
    const command = formData.get('command') as string;
    const type = formData.get('type') as string;

    if (!file || !command) {
      return NextResponse.json({ error: 'File and command are required' }, { status: 400 });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'uploads');
    try {
      await fs.access(uploadsDir);
    } catch {
      await fs.mkdir(uploadsDir, { recursive: true });
    }

    // Save uploaded file
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = path.join(uploadsDir, fileName);
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    
    // Write file with proper error handling
    try {
      await fs.writeFile(filePath, fileBuffer);
    } catch (writeError) {
      console.error('Error writing file:', writeError);
      // Try to clean up any partial file
      try {
        await fs.unlink(filePath);
      } catch {
        // Ignore cleanup errors
      }
      return NextResponse.json(
        { error: 'Failed to save uploaded file' },
        { status: 500 }
      );
    }

    console.log('File upload info:');
    console.log('  Filename:', fileName);
    console.log('  Original name:', file.name);
    console.log('  File path:', filePath);
    console.log('  File exists:', fsSync.existsSync(filePath));

    // Tool directory mapping based on script names
    const toolMap: { [key: string]: string | null } = {
      'cbmc_script': 'CBMC',
      'kleema': 'KLEEMA',
      'klee': 'KLEE',
      'tracerx': 'TX',
      'main-gProfiler': null, // Determined separately below
    };

    // Determine tool directory
    let toolDir: string | null = null;
    for (const [scriptName, dir] of Object.entries(toolMap)) {
      if (command.includes(scriptName)) {
        // Special case for main-gProfiler - need to check if it's gMCov or gMutant
        if (scriptName === 'main-gProfiler') {
          // Check the 'tool' parameter that was sent from client
          const tool = formData.get('tool') as string;
          toolDir = tool && tool.includes('Coverage') ? 'gMCov' : 'gMutant';
          console.log(`[execute] main-gProfiler detected - tool from client: "${tool}" -> determined toolDir: ${toolDir}`);
        } else {
          toolDir = dir as string;
        }
        console.log(`[execute] Command matches script: ${scriptName}, toolDir: ${toolDir}`);
        break;
      }
    }

    // Replace [FILE] placeholder with actual file path initially
    let actualCommand = command.replace('[FILE]', filePath);

    // Handle special cases for different file types
    let finalCommand = actualCommand;
    let workingDir = process.cwd();

    // For C tools, run from the root directory where tool folders are located
    if (type === 'c' && toolDir) {
      // Get the root directory (parent of client directory)
      const rootDir = path.join(process.cwd(), '..');
      const toolPath = path.join(rootDir, toolDir);

      // Create tool directory if it doesn't exist
      try {
        await fs.access(toolPath);
      } catch {
        await fs.mkdir(toolPath, { recursive: true });
      }

      let targetPath = `${toolPath}/${file.name}`;
      let fileNameForCommand = file.name;

      // For gMCov and gMutant, the script appends .c to the filename
      // So we need to pass the filename without the .c extension
      if ((toolDir === 'gMCov' || toolDir === 'gMutant') && file.name.endsWith('.c')) {
        fileNameForCommand = file.name.slice(0, -2); // Remove .c extension
        targetPath = `${toolPath}/${fileNameForCommand}`;
        console.log(`gMCov/gMutant detected: copying with stripped extension`);

        // Create Programs/GCOV and Programs/CBMC subdirectories and copy file there with .c extension
        // as the script expects these directories to exist and contain the file with .c
        const programsGcovDir = `${toolPath}/Programs/GCOV`;
        const programsCbmcDir = `${toolPath}/Programs/CBMC`;
        
        try {
          await fs.mkdir(programsGcovDir, { recursive: true });
          await fs.mkdir(programsCbmcDir, { recursive: true });
          
          // Copy the file with .c extension to these directories (as the script expects)
          await fs.copyFile(filePath, `${programsGcovDir}/${file.name}`);
          await fs.copyFile(filePath, `${programsCbmcDir}/${file.name}`);
          console.log('Copied file to Programs/GCOV and Programs/CBMC subdirectories');
        } catch (err) {
          console.warn('Warning: could not create/populate Programs subdirectories:', err);
        }
      }

      console.log(`Copying C file to ${toolDir}:`, { from: filePath, to: targetPath });

      // Copy the file to tool directory with error handling
      try {
        await fs.copyFile(filePath, targetPath);
        console.log('  File copied successfully');
      } catch (copyError) {
        console.error(`Error copying file to ${toolDir}:`, copyError);
        // Try to clean up
        try {
          await fs.unlink(filePath);
        } catch {
          // Ignore
        }
        return NextResponse.json(
          { error: `Failed to copy file to ${toolDir} directory: ${copyError instanceof Error ? copyError.message : 'Unknown error'}` },
          { status: 500 }
        );
      }

      // Update command to use the filename (with or without extension depending on tool)
      finalCommand = command.replace('[FILE]', fileNameForCommand);
      workingDir = toolPath;
    }

    // Special handling for Solidity tools
    if (type === 'solidity') {
      const rootDir = path.join(process.cwd(), '..');
      const solcDir = `${rootDir}/Solc`;

      // Create Solc directory if it doesn't exist
      try {
        await fs.access(solcDir);
      } catch {
        await fs.mkdir(solcDir, { recursive: true });
      }

      const targetPath = `${solcDir}/${file.name}`;

      console.log('Copying Solidity file:');
      console.log('  From:', filePath);
      console.log('  To:', targetPath);
      console.log('  Original name:', file.name);

      // Copy the file to Solc directory with error handling
      try {
        await fs.copyFile(filePath, targetPath);
        console.log('  File copied successfully');
      } catch (copyError) {
        console.error('Error copying Solidity file:', copyError);
        try {
          await fs.unlink(filePath);
        } catch {
          // Ignore
        }
        return NextResponse.json(
          { error: 'Failed to copy Solidity file' },
          { status: 500 }
        );
      }

      // Update command to use just the filename and run from Solc directory
      finalCommand = command.replace('[FILE]', file.name);
      workingDir = solcDir;
    }

    // Handle Java tools
    if (type === 'java') {
      const rootDir = path.join(process.cwd(), '..');
      const javaDir = `${rootDir}/JAVA`;

      try {
        await fs.access(javaDir);
      } catch {
        await fs.mkdir(javaDir, { recursive: true });
      }

      const targetPath = `${javaDir}/${file.name}`;
      try {
        await fs.copyFile(filePath, targetPath);
        finalCommand = command.replace('[FILE]', file.name);
        workingDir = javaDir;
      } catch (copyError) {
        console.error('Error copying Java file:', copyError);
        try {
          await fs.unlink(filePath);
        } catch {
          // Ignore
        }
        return NextResponse.json(
          { error: 'Failed to copy Java file' },
          { status: 500 }
        );
      }
    }

    // Handle Python tools
    if (type === 'python') {
      const rootDir = path.join(process.cwd(), '..');
      const pythonDir = `${rootDir}/python`;

      try {
        await fs.access(pythonDir);
      } catch {
        await fs.mkdir(pythonDir, { recursive: true });
      }

      const targetPath = `${pythonDir}/${file.name}`;
      try {
        await fs.copyFile(filePath, targetPath);
        finalCommand = command.replace('[FILE]', file.name);
        workingDir = pythonDir;
      } catch (copyError) {
        console.error('Error copying Python file:', copyError);
        try {
          await fs.unlink(filePath);
        } catch {
          // Ignore
        }
        return NextResponse.json(
          { error: 'Failed to copy Python file' },
          { status: 500 }
        );
      }
    }

    console.log('Executing command:', finalCommand);
    console.log('Working directory:', workingDir);

    // Execute the command using spawn for better output handling
    // This captures both stdout and stderr in real-time
    let output = '';
    let executionError: Error | null = null;
    
    try {
      // Use execAsync with proper shell to capture all output
      const { stdout, stderr } = await execAsync(finalCommand, {
        cwd: workingDir,
        timeout: 600000, // 10 minutes timeout
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      });
      // Combine stdout and stderr, but don't add separators
      // This way output appears exactly as it would in the terminal
      output = stdout;
      if (stderr) {
        output += stderr;
      }
    } catch (execError: any) {
      // Check if this was a timeout error
      if (execError.signal === 'SIGTERM' || execError.code === 'ETIMEDOUT' || execError.killed) {
        output = `❌ Execution Timeout\n\nThe compilation/execution exceeded the 10-minute timeout limit.\n\nPossible causes:\n- Code is too complex for analysis\n- Analysis/compilation is taking too long\n- Infinite loop in the code\n\nPlease try:\n1. Simplifying your code\n2. Breaking it into smaller functions\n3. Removing any infinite loops`;
      } else {
        // Even if exec fails, it may have produced useful output
        // Capture stdout and stderr from the error object
        output = execError.stdout || '';
        if (execError.stderr) {
          output += execError.stderr;
        }
      }
      executionError = execError;
      
      console.log('Command exited with error but captured output');
      console.log('Exit code:', execError.code);
      console.log('Signal:', execError.signal);
      console.log('Output length:', output.length);
    }

    // Check if we have meaningful output (not just errors)
    const hasOutput = output && output.trim().length > 0;
    
    console.log('Command executed');
    console.log('Output length:', output.length);
    console.log('Has meaningful output:', hasOutput);
    console.log('First 500 chars of output:', output.substring(0, 500));
    console.log('Last 500 chars of output:', output.substring(Math.max(0, output.length - 500)));

    // Clean up uploaded file (keep files in tool directories for analysis)
    try {
      await fs.unlink(filePath);
      console.log('Temporary file cleaned up');
    } catch (cleanupError) {
      console.warn('Failed to clean up temporary file:', cleanupError);
    }

    // Return success if we have output, regardless of exit code
    if (hasOutput || !executionError) {
      return NextResponse.json({
        success: true,
        output: output
      });
    } else {
      // Only return error if there's no output and there was an actual error
      return NextResponse.json({
        success: false,
        error: executionError instanceof Error ? executionError.message : 'Command execution failed'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Execute error:', error);

    // Clean up any uploaded files on error
    try {
      const uploadsDir = path.join(process.cwd(), 'uploads');
      const files = await fs.readdir(uploadsDir);
      for (const file of files) {
        if (file.startsWith(Date.now().toString().slice(0, -3))) { // Rough cleanup of recent files
          await fs.unlink(path.join(uploadsDir, file));
        }
      }
    } catch (cleanupError) {
      console.warn('Failed to clean up files on error:', cleanupError);
    }

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}