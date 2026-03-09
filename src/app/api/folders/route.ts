import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

export async function GET(request: NextRequest) {
  try {
    // Since we're in Next.js, the uploads directory should be relative to the project root
    const uploadsDir = path.join(process.cwd(), 'uploads');

    // Create uploads directory if it doesn't exist
    try {
      await fs.access(uploadsDir);
    } catch {
      await fs.mkdir(uploadsDir, { recursive: true });
    }

    const entries = await fs.readdir(uploadsDir, { withFileTypes: true });

    const folders = entries
      .filter(entry => entry.isDirectory())
      .map(entry => ({
        name: entry.name,
        path: path.join(uploadsDir, entry.name)
      }));

    return NextResponse.json({ folders });
  } catch (error) {
    console.error('Folders error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}