import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import fsSync from 'fs';
// @ts-ignore
import archiver from 'archiver';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ folderName: string }> }
) {
  try {
    const { folderName } = await context.params;
    const { searchParams } = new URL(request.url);
    const inputFileName = searchParams.get('fileName') || '';
    const solidityMode = searchParams.get('mode') || ''; // For Solidity: 'bmc' or 'chc'

    // Extract base filename without extension from input (e.g., "sample.c" -> "sample")
    const fileBaseName = inputFileName.replace(/\.[^/.]+$/, '');

    console.log('Download ZIP request:');
    console.log('  Tool folder:', folderName);
    console.log('  Input file:', inputFileName);
    console.log('  Base name:', fileBaseName);
    if (solidityMode) {
      console.log('  Solidity mode:', solidityMode);
    }

    // Check multiple possible locations for the folder
    const projectRoot = path.join(process.cwd(), '..');
    
    // Map tool names to their directories
    const toolDirectoryMap: { [key: string]: string } = {
      'CBMC': 'CBMC',
      'KLEE': 'KLEE',
      'TX': 'TX',
      'KLEEMA': 'KLEEMA',
      'gMCov': 'gMCov',
      'gMutant': 'gMutant',
      'Solc': 'Solc',
      'JAVA': 'JAVA',
      'python': 'python',
    };

    let folderPath = null;

    // First, try to find the tool directory directly using the tool name
    if (toolDirectoryMap[folderName]) {
      const toolPath = path.join(projectRoot, toolDirectoryMap[folderName]);
      try {
        const stats = await fs.stat(toolPath);
        if (stats.isDirectory()) {
          folderPath = toolPath;
          console.log(`Found tool directory for ${folderName}:`, folderPath);
        }
      } catch {
        // Tool directory doesn't exist
      }
    }

    // If still not found, check alternate paths (for backward compatibility)
    if (!folderPath) {
      const possiblePaths = [
        path.join(projectRoot, 'uploads', folderName),
        path.join(projectRoot, 'results', folderName),
      ];

      for (const testPath of possiblePaths) {
        try {
          const stats = await fs.stat(testPath);
          if (stats.isDirectory()) {
            folderPath = testPath;
            console.log(`Found alternate directory for ${folderName}:`, folderPath);
            break;
          }
        } catch {
          // Folder doesn't exist at this path, try next
        }
      }
    }

    if (!folderPath) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    // Security check: ensure the folder is within allowed directories
    const resolvedPath = path.resolve(folderPath);
    const allowedDirs = [
      path.resolve(path.join(projectRoot, 'uploads')),
      path.resolve(path.join(projectRoot, 'results')),
      path.resolve(path.join(projectRoot, 'CBMC')),
      path.resolve(path.join(projectRoot, 'KLEE')),
      path.resolve(path.join(projectRoot, 'TX')),
      path.resolve(path.join(projectRoot, 'KLEEMA')),
      path.resolve(path.join(projectRoot, 'gMCov')),
      path.resolve(path.join(projectRoot, 'gMutant')),
      path.resolve(path.join(projectRoot, 'Solc')),
      path.resolve(path.join(projectRoot, 'JAVA')),
      path.resolve(path.join(projectRoot, 'python'))
    ];

    const isAllowed = allowedDirs.some(dir => resolvedPath.startsWith(dir));

    if (!isAllowed) {
      console.error(`Access denied for path: ${resolvedPath}`);
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Create archive
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });

    // Track whether we've isolated to a specific result folder
    let useFileNameFilter = true;

    // Get all files in the folder recursively, filtered by input filename
    async function getAllFilesForZip(dir: string, applyFilter: boolean = useFileNameFilter): Promise<string[]> {
      const fileList: string[] = [];
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);

          if (entry.isFile()) {
            // Include file if:
            // 1. No filter applied (applyFilter = false), include all files
            // 2. OR fileBaseName is empty (include all files)
            // 3. OR entry starts with fileBaseName
            if (!applyFilter || !fileBaseName || entry.name.startsWith(fileBaseName)) {
              fileList.push(fullPath);
            }
          } else if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.git' && entry.name !== '__pycache__') {
            // Recurse with same filter setting
            const subFiles = await getAllFilesForZip(fullPath, applyFilter);
            fileList.push(...subFiles);
          }
        }
      } catch (err) {
        console.error(`Error reading directory ${dir}:`, err);
      }
      return fileList;
    }

    // Special handling for Java and Python tools - look in RESULT subdirectory
    let searchPath = folderPath;
    if (folderName === 'JAVA' || folderName === 'python') {
      const resultPath = path.join(folderPath, 'RESULT');
      try {
        const stats = await fs.stat(resultPath);
        if (stats.isDirectory()) {
          searchPath = resultPath;
          console.log(`${folderName} tool detected, searching in RESULT subdirectory:`, searchPath);
        }
      } catch {
        // RESULT directory doesn't exist, continue with original path
      }
    }

    // Special handling for Solidity tools - look in Results subdirectory with mode-specific folders
    if (folderName === 'Solc' && fileBaseName) {
      const resultsPath = path.join(folderPath, 'Results');
      try {
        const stats = await fs.stat(resultsPath);
        if (stats.isDirectory()) {
          // Look for folder matching [filename]-[mode] pattern (e.g., RBC-bmc, RBC-chc)
          const expectedFolder = solidityMode 
            ? `${fileBaseName}-${solidityMode}` 
            : null;
          
          if (expectedFolder) {
            const solcResultPath = path.join(resultsPath, expectedFolder);
            try {
              const solcStats = await fs.stat(solcResultPath);
              if (solcStats.isDirectory()) {
                searchPath = solcResultPath;
                console.log(`Found Solidity result folder with mode ${solidityMode}:`, searchPath);
                useFileNameFilter = false;
              } else {
                // Try to find any folder matching the filename
                const entries = await fs.readdir(resultsPath, { withFileTypes: true });
                for (const entry of entries) {
                  if (entry.isDirectory() && entry.name.startsWith(fileBaseName)) {
                    searchPath = path.join(resultsPath, entry.name);
                    console.log(`Found Solidity result folder (pattern match):`, searchPath);
                    useFileNameFilter = false;
                    break;
                  }
                }
              }
            } catch {
              // Expected folder doesn't exist, try pattern matching
              const entries = await fs.readdir(resultsPath, { withFileTypes: true });
              for (const entry of entries) {
                if (entry.isDirectory() && entry.name.startsWith(fileBaseName)) {
                  searchPath = path.join(resultsPath, entry.name);
                  console.log(`Found Solidity result folder (fallback pattern match):`, searchPath);
                  useFileNameFilter = false;
                  break;
                }
              }
            }
          }
        }
      } catch {
        // Results directory doesn't exist, continue with original path
        console.log(`Results directory not found for Solidity, using tool directory`);
      }
    }

    
    // Special handling for C tools - look for tool-specific result folders
    // (C tools store results in named subdirectories within their tool folder)
    if ((folderName === 'CBMC' || folderName === 'KLEE' || folderName === 'KLEEMA' || 
         folderName === 'TX' || folderName === 'gMCov' || folderName === 'gMutant') && fileBaseName) {
      
      // Look for result folder that matches the file basename
      let resultFolderPath = null;
      
      // Try to find result folder based on tool type
      try {
        const entries = await fs.readdir(searchPath, { withFileTypes: true });
        
        for (const entry of entries) {
          if (!entry.isDirectory()) continue;
          
          let matches = false;
          
          if (folderName === 'gMCov' || folderName === 'gMutant') {
            // gMCov/gMutant use [filename]-RESULTS or [filename]-RESULTS-[number] pattern
            matches = entry.name === `${fileBaseName}-RESULTS` || 
                     entry.name.startsWith(`${fileBaseName}-RESULTS-`);
          } else if (folderName === 'KLEEMA') {
            // KLEEMA uses [filename]-RESULTS-[toolValue] pattern (e.g., sample-RESULTS-1)
            matches = entry.name.startsWith(`${fileBaseName}-RESULTS-`);
          } else if (folderName === 'KLEE' || folderName === 'TX') {
            // KLEE/TX might use [filename], [filename]-[number], or klee-out-[number] patterns
            matches = entry.name === fileBaseName || 
                     entry.name.startsWith(`${fileBaseName}-`) ||
                     entry.name.startsWith('klee-out-');
          } else if (folderName === 'CBMC') {
            // CBMC uses direct [filename] folder
            matches = entry.name === fileBaseName;
          }
          
          if (matches) {
            resultFolderPath = path.join(searchPath, entry.name);
            console.log(`Found ${folderName} result folder:`, resultFolderPath);
            break;
          }
        }
      } catch (err) {
        console.error(`Error reading directory for result folder search:`, err);
      }
      
      // If we found a specific result folder, use it instead of the tool directory
      if (resultFolderPath) {
        searchPath = resultFolderPath;
        useFileNameFilter = false; // Don't filter by filename in isolated result folder
        console.log(`Using isolated result folder for ${fileBaseName}:`, searchPath);
        console.log(`File filtering disabled for isolated folder`);
      } else {
        console.log(`No result folder found for ${fileBaseName} in ${folderName}, using tool directory with filename filter`);
      }
    }

    const files = await getAllFilesForZip(searchPath);

    if (files.length === 0) {
      return NextResponse.json({ error: 'No files to download. Make sure the tool has been executed.' }, { status: 400 });
    }

    console.log(`Found ${files.length} files to zip for ${fileBaseName || 'all'}`);

    // Add files to archive with their actual modification times
    for (const file of files) {
      const relativePath = path.relative(searchPath, file);
      
      // Get file stats and preserve the exact modification time
      const stats = await fs.stat(file);
      const mtime = stats.mtime;
      
      console.log(`Adding ${relativePath} with mtime: ${mtime.toISOString()}`);
      
      archive.file(file, { 
        name: relativePath,
        date: mtime // Use the actual file's modification time
      });
    }

    // Create a temporary file for the zip
    const tempZipPath = path.join('/tmp', `${fileBaseName || folderName}-${Date.now()}.zip`);

    // Create output stream
    const output = fsSync.createWriteStream(tempZipPath);

    // Archive events
    archive.on('error', (err: Error) => {
      console.error('Archive error:', err);
      output.destroy();
    });

    output.on('error', (err: Error) => {
      console.error('Stream error:', err);
    });

    // Finalize the archive
    await archive.finalize();

    // Wait for output stream to finish
    await new Promise<void>((resolve, reject) => {
      output.on('finish', () => resolve());
      output.on('error', reject);
      archive.pipe(output);
    });

    // Read the zip file and send it
    const zipBuffer = await fs.readFile(tempZipPath);

    // Clean up temporary zip file
    try {
      await fs.unlink(tempZipPath);
    } catch (err) {
      console.warn('Failed to clean up temporary zip file:', err);
    }

    console.log(`✅ ZIP created: ${fileBaseName || folderName}.zip (${zipBuffer.length} bytes)`);

    const zipFileName = fileBaseName ? `${fileBaseName}.zip` : `${folderName}-${Date.now()}.zip`;

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${zipFileName}"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Content-Length': zipBuffer.length.toString()
      }
    });

  } catch (error) {
    console.error('Download ZIP error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
