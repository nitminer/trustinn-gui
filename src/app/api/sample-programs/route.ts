import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { getCache, setCache } from '@/lib/redis';

/**
 * GET /api/sample-programs?tool=CBMC&language=c
 * Fetches sample programs from /root/Executable programs/[TOOL]/ folder
 * Returns list of files with their content
 * Uses Redis caching for high-traffic scenarios
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tool = searchParams.get('tool');
    const language = searchParams.get('language') || '';

    if (!tool) {
      return NextResponse.json(
        { error: 'Tool parameter is required' },
        { status: 400 }
      );
    }

    // Create cache key
    const cacheKey = `samples:${tool}:${language}`;
    console.log(`[sample-programs] Request: ${cacheKey}`);

    // Try Redis cache first
    const cached = await getCache(cacheKey);
    if (cached && Object.keys(cached).length > 0) {
      console.log(`[sample-programs] ✅ Cache HIT: ${cacheKey}`);
      const response = NextResponse.json({ 
        samples: cached,
        fromCache: true,
        cacheHit: true
      });
      response.headers.set('Cache-Control', 'public, max-age=3600');
      response.headers.set('X-Cache', 'HIT');
      return response;
    }

    console.log(`[sample-programs] Cache MISS: ${cacheKey}, loading from disk...`);

    // Map tool names to folder names
    const toolFolderMap: { [key: string]: string } = {
      'CBMC': 'CBMC',
      'KLEE': 'KLEE',
      'KLEEMA': 'KLEEMA',
      'TX': 'TX',
      'gMCov': 'gMCov',
      'gMutant': 'gMutant',
      'JBMC': 'JAVA',
      'VeriSol': 'SOLIDITY',
      'Condition Coverage Fuzzing': 'PYTHON',
    };

    const folderName = toolFolderMap[tool];
    if (!folderName) {
      return NextResponse.json(
        { error: `Unknown tool: ${tool}` },
        { status: 400 }
      );
    }

    // Construct path to sample programs folder
    // Support multiple possible locations for sample programs
    let samplePath = path.join('/root/Executable programs', folderName);
    
    // Special handling for each tool - try multiple possible locations
    if (tool === 'gMCov') {
      // For gMCov, ONLY use the reference samples from Executable programs
      // Priority: Use Executable programs first, never fall back to trustinn for gMCov
      const executableProgramsPath = path.join('/root/Executable programs', 'gMCov', 'Programs', 'CBMC');
      try {
        await fs.access(executableProgramsPath);
        samplePath = executableProgramsPath;
        console.log(`[sample-programs] Using Executable programs for gMCov: ${samplePath}`);
      } catch {
        console.error(`[sample-programs] ⚠️  Executable programs path not found for gMCov: ${executableProgramsPath}`);
        // Only try alternate paths if primary path doesn't exist
        const possiblePaths = [
          path.join('/root/Executable programs', 'gMCov'),
        ];
        for (const p of possiblePaths) {
          try {
            await fs.access(p);
            samplePath = p;
            break;
          } catch {
            // Path doesn't exist, try next one
          }
        }
      }
    } else if (tool === 'gMutant') {
      // For gMutant, ONLY use the reference samples from Executable programs
      // Priority: Use Executable programs first, never fall back to trustinn for gMutant
      const executableProgramsPath = path.join('/root/Executable programs', 'gMutant', 'Programs', 'CBMC');
      try {
        await fs.access(executableProgramsPath);
        samplePath = executableProgramsPath;
        console.log(`[sample-programs] Using Executable programs for gMutant: ${samplePath}`);
      } catch {
        console.error(`[sample-programs] ⚠️  Executable programs path not found for gMutant: ${executableProgramsPath}`);
        // Only try alternate paths if primary path doesn't exist
        const possiblePaths = [
          path.join('/root/Executable programs', 'gMutant'),
        ];
        for (const p of possiblePaths) {
          try {
            await fs.access(p);
            samplePath = p;
            break;
          } catch {
            // Path doesn't exist, try next one
          }
        }
      }
    } else if (tool === 'CBMC' || tool === 'KLEE' || tool === 'KLEEMA' || tool === 'TX') {
      // Try multiple locations for C tools
      const possiblePaths = [
        path.join('/root/Executable programs', folderName),
        path.join('/root/trustinn', folderName, 'Programs', 'CBMC'),
      ];
      for (const p of possiblePaths) {
        try {
          await fs.access(p);
          samplePath = p;
          break;
        } catch {
          // Path doesn't exist, try next one
        }
      }
    } else {
      // For other tools, try the main location first, then trustinn
      const possiblePaths = [
        path.join('/root/Executable programs', folderName),
        path.join('/root/trustinn', folderName),
      ];
      for (const p of possiblePaths) {
        try {
          await fs.access(p);
          samplePath = p;
          break;
        } catch {
          // Path doesn't exist, try next one
        }
      }
    }

    console.log(`[sample-programs] Fetching samples from: ${samplePath}`);

    // Check if folder exists
    let folderExists = false;
    try {
      await fs.access(samplePath);
      folderExists = true;
    } catch {
      console.error(`[sample-programs] 🔴 Path not found: ${samplePath}`);
      // Last resort - try to create proper error message
      return NextResponse.json(
        { 
          error: `Sample programs folder not found for ${tool}`,
          requestedPath: samplePath,
          tool: tool,
          language: language
        },
        { status: 404 }
      );
    }

    if (!folderExists) {
      return NextResponse.json(
        { 
          error: `Sample programs folder not found for ${tool}: ${samplePath}`,
          requestedPath: samplePath,
          tool: tool,
          language: language
        },
        { status: 404 }
      );
    }

    // Read files from folder
    const files = await fs.readdir(samplePath, { withFileTypes: true });
    const samplePrograms: { [key: string]: string } = {};
    let totalSize = 0;
    
    // Filter files based on language extensions
    const extensionMap: { [key: string]: string[] } = {
      'CBMC': ['.c'],
      'KLEE': ['.c'],
      'KLEEMA': ['.c'],
      'TX': ['.c'],
      'gMCov': ['.c'],
      'gMutant': ['.c'],
      'JBMC': ['.java'],
      'VeriSol': ['.sol'],
      'Condition Coverage Fuzzing': ['.py'],
    };

    const validExtensions = extensionMap[tool] || [];

    // Whitelist of reference sample files - exclude development files
    const referenceFileWhitelist = new Set([
      'PS-P2-L-T-R16-small.c',
      'PS-P3-L-T-R20-B3-SMALL.c',
      'PS-Prob1-IO-R14-B2-prev.c',
      'PS-Wtest9-B3.c',
      'PS-Wtest9-B6.c',
      'PS-Wtest10-B2.c',
      'PS-Wtest10-B3.c',
      'PS-Wtest10-B4.c',
      'a-MetaWithBraces-V4.c',
      'a-MetaWithBraces-V4.gcno',
      'main-gProfiler.sh',
      'symb3.c', // Keep for now but can remove if needed
      'program.c',
      'P2-L-T-R16-small.c',
    ]);

    // For gMutant and gMCov, use stricter filtering
    const isStrictMode = tool === 'gMutant' || tool === 'gMCov';
    const strictModeBlacklist = new Set([
      'symb3.c', // Development file - should not appear in sample list
      'main-gProfiler.sh',
      'program.c',
      'P2-L-T-R16-small.c',
    ]);

    for (const file of files) {
      if (!file.isFile()) continue;

      // Check if file has valid extension
      const fileExt = path.extname(file.name).toLowerCase();
      if (!validExtensions.includes(fileExt)) continue;

      // Strict filtering for gMutant/gMCov - exclude development files
      if (isStrictMode && strictModeBlacklist.has(file.name)) {
        console.log(`[sample-programs] ⊘ Skipping development file: ${file.name}`);
        continue;
      }

      try {
        const filePath = path.join(samplePath, file.name);
        const content = await fs.readFile(filePath, 'utf-8');
        samplePrograms[file.name] = content;
        totalSize += content.length;
        console.log(`[sample-programs] ✓ ${file.name} (${(content.length / 1024).toFixed(1)}KB)`);
      } catch (err) {
        console.warn(`[sample-programs] Failed to read ${file.name}:`, err instanceof Error ? err.message : 'Unknown error');
      }
    }

    if (Object.keys(samplePrograms).length === 0) {
      console.warn(`[sample-programs] ⚠️  No sample programs found for ${tool}`);
      return NextResponse.json(
        { 
          samples: {}, 
          message: `No sample programs found for ${tool}`,
          requestedTool: tool,
          searchPath: samplePath
        },
        { status: 200 }
      );
    }

    // Cache the samples in Redis for 6 hours
    const cacheSuccess = await setCache(cacheKey, samplePrograms, 21600);
    console.log(`[sample-programs] ${cacheSuccess ? '✅' : '⚠️'} Cached: ${Object.keys(samplePrograms).length} files (${(totalSize / 1024).toFixed(1)}KB) for 6 hours`);

    // Return with cache headers
    const response = NextResponse.json({
      samples: samplePrograms,
      fromCache: false,
      cacheHit: false,
      filesCount: Object.keys(samplePrograms).length,
      totalSize: `${(totalSize / 1024).toFixed(1)}KB`,
      cached: cacheSuccess
    });
    
    response.headers.set('Cache-Control', 'public, max-age=21600'); // 6 hours browser cache
    response.headers.set('X-Cache', 'MISS');
    
    return response;

  } catch (error) {
    console.error('[sample-programs] Error:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
