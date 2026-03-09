import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ folderName: string }> }
) {
  try {
    const { folderName } = await context.params;

    // Check multiple possible locations for the folder
    const projectRoot = path.join(process.cwd());
    const possiblePaths = [
      path.join(projectRoot, 'uploads', folderName),
      path.join(projectRoot, 'results', folderName),
      path.join(projectRoot, folderName),  // Direct tool directory
      path.join(projectRoot, 'CBMC'),      // CBMC
      path.join(projectRoot, 'KLEE'),      // KLEE
      path.join(projectRoot, 'TX'),        // TracerX
      path.join(projectRoot, 'KLEEMA'),    // KLEEMA
      path.join(projectRoot, 'gMCov'),     // gMCov
      path.join(projectRoot, 'gMutant'),   // gMutant
      path.join(projectRoot, 'VeriSol'),   // VeriSol
      path.join(projectRoot, 'JAVA'),      // JAVA
      path.join(projectRoot, 'python'),    // python
    ];

    let folderPath = null;

    // Find the first path that exists
    for (const testPath of possiblePaths) {
      try {
        const stats = await fs.stat(testPath);
        if (stats.isDirectory()) {
          folderPath = testPath;
          break;
        }
      } catch {
        // Folder doesn't exist at this path, try next
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
      path.resolve(path.join(projectRoot, 'VeriSol')),
      path.resolve(path.join(projectRoot, 'JAVA')),
      path.resolve(path.join(projectRoot, 'python'))
    ];

    const isAllowed = allowedDirs.some(dir => resolvedPath.startsWith(dir));

    if (!isAllowed) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Recursively collect files from folderPath and subdirectories
    async function getAllFiles(dir: string, relativePrefix = ''): Promise<Array<{
      name: string;
      relativePath: string;
      size: number;
      downloadUrl: string;
    }>> {
      const fileList: Array<{
        name: string;
        relativePath: string;
        size: number;
        downloadUrl: string;
      }> = [];
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          const relativePath = relativePrefix ? `${relativePrefix}/${entry.name}` : entry.name;

          if (entry.isFile()) {
            const stats = await fs.stat(fullPath);
            fileList.push({
              name: entry.name,
              relativePath: relativePath,
              size: stats.size,
              downloadUrl: `/api/download/${folderName}/${relativePath}`
            });
          } else if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.git' && entry.name !== '__pycache__') {
            // Recursively get files from subdirectories, but limit depth
            const subFiles = await getAllFiles(fullPath, relativePath);
            fileList.push(...subFiles);
          }
        }
      } catch (err) {
        console.error(`Error reading directory ${dir}:`, err);
      }
      return fileList;
    }

    const files = await getAllFiles(folderPath);

    // Filter and sort files by extension and name
    const fileList = files
      .filter(f => !f.name.startsWith('.'))  // Skip hidden files
      .sort((a, b) => {
        // Sort by extension first, then by name
        const extA = path.extname(a.name).toLowerCase();
        const extB = path.extname(b.name).toLowerCase();
        if (extA !== extB) return extA.localeCompare(extB);
        return a.name.localeCompare(b.name);
      });

    return NextResponse.json({ files: fileList });
  } catch (error) {
    console.error('Folder error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}