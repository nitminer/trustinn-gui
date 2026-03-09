import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ folderName: string; fileName: string[] }> }
) {
  try {
    const { folderName, fileName } = await context.params;
    const fileNamePath = fileName.join('/');  // Join the array back to path

    // Check multiple possible locations for the file
    const projectRoot = path.join(process.cwd());
    const possiblePaths = [
      path.join(projectRoot, 'uploads', folderName, fileNamePath),
      path.join(projectRoot, 'results', folderName, fileNamePath),
      path.join(projectRoot, folderName, fileNamePath),  // Direct tool directory
      path.join(projectRoot, 'CBMC', fileNamePath),
      path.join(projectRoot, 'KLEE', fileNamePath),
      path.join(projectRoot, 'TX', fileNamePath),
      path.join(projectRoot, 'KLEEMA', fileNamePath),
      path.join(projectRoot, 'gMCov', fileNamePath),
      path.join(projectRoot, 'gMutant', fileNamePath),
      path.join(projectRoot, 'VeriSol', fileNamePath),
      path.join(projectRoot, 'JAVA', fileNamePath),
      path.join(projectRoot, 'python', fileNamePath)
    ];

    let filePath = null;

    // Find the first path that exists
    for (const testPath of possiblePaths) {
      try {
        await fs.access(testPath);
        filePath = testPath;
        break;
      } catch {
        // File doesn't exist at this path, try next
      }
    }

    if (!filePath) {
      console.log('File not found. Tried paths:', possiblePaths);
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Security check: ensure the file is within allowed directories
    const resolvedPath = path.resolve(filePath);
    const allowedDirs = [
      path.resolve(path.join(projectRoot, 'uploads')),
      path.resolve(path.join(projectRoot, 'results')),
      path.resolve(path.join(projectRoot, 'CBMC')),
      path.resolve(path.join(projectRoot, 'KLEE')),
      path.resolve(path.join(projectRoot, 'TX')),
      path.resolve(path.join(projectRoot, 'KLEEMA')),
      path.resolve(path.join(projectRoot, 'gMCov')),
      path.resolve(path.join(projectRoot, 'gMutant')),
      path.resolve(path.join(projectRoot, 'VeriSol')),
      path.resolve(path.join(projectRoot, 'JAVA')),
      path.resolve(path.join(projectRoot, 'python'))
    ];

    const isAllowed = allowedDirs.some(dir => resolvedPath.startsWith(dir));

    if (!isAllowed) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check if path is a directory
    const stats = await fs.stat(filePath);
    if (stats.isDirectory()) {
      return NextResponse.json({ error: 'Cannot download directory' }, { status: 400 });
    }

    // Read file content
    const fileContent = await fs.readFile(filePath, 'utf8');

    // Return file with appropriate headers
    return new NextResponse(fileContent, {
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="${path.basename(filePath)}"`,
      },
    });

  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}