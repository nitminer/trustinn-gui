import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

/**
 * POST /api/auth/_log
 * Logs application events and debug information
 * 
 * Request body:
 * {
 *   "level": "info|warn|error|debug",
 *   "message": "log message",
 *   "userId": "optional_user_id",
 *   "context": { optional context data }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { level = 'info', message, userId, context = {} } = body;

    // Validate required fields
    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Sanitize log level
    const validLevels = ['debug', 'info', 'warn', 'error'];
    const logLevel = validLevels.includes(level) ? level : 'info';

    // Create log entry
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: logLevel,
      message,
      ...(userId && { userId }),
      ...(Object.keys(context).length > 0 && { context })
    };

    // Log to console (visible in server logs)
    console.log(`[${logLevel.toUpperCase()}] ${message}`, {
      timestamp,
      userId,
      context
    });

    // Optionally log to file in development or with specific log level
    if (process.env.NODE_ENV === 'development' || logLevel === 'error') {
      try {
        const logsDir = path.join(process.cwd(), 'logs');
        
        // Create logs directory if it doesn't exist
        try {
          await fs.mkdir(logsDir, { recursive: true });
        } catch (e) {
          // Directory might already exist
        }

        const logFilePath = path.join(logsDir, `trustinn-${new Date().toISOString().split('T')[0]}.log`);
        
        // Append log entry to file
        await fs.appendFile(
          logFilePath,
          JSON.stringify(logEntry) + '\n',
          { flag: 'a' }
        );
      } catch (fileError) {
        console.error('[/api/auth/_log] Failed to write log file:', fileError);
        // Don't fail the request if file logging fails
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Log entry recorded'
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[POST /api/auth/_log] Error:', error);
    
    // Still return success to avoid client errors
    return NextResponse.json(
      {
        success: true,
        message: 'Log entry recorded'
      },
      { status: 200 }
    );
  }
}

/**
 * GET /api/auth/_log
 * Returns recent log entries (optional, for debugging)
 * Only available in development mode
 */
export async function GET(request: NextRequest) {
  try {
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { error: 'Not available in production' },
        { status: 403 }
      );
    }

    const logsDir = path.join(process.cwd(), 'logs');
    
    try {
      const files = await fs.readdir(logsDir);
      const logFiles = files.filter(f => f.startsWith('trustinn-') && f.endsWith('.log'));
      
      // Get the most recent log file
      if (logFiles.length === 0) {
        return NextResponse.json(
          { logs: [], message: 'No log files found' },
          { status: 200 }
        );
      }

      const latestLogFile = logFiles.sort().reverse()[0];
      const logPath = path.join(logsDir, latestLogFile);
      const content = await fs.readFile(logPath, 'utf-8');
      
      const logs = content
        .split('\n')
        .filter(line => line.trim())
        .map(line => {
          try {
            return JSON.parse(line);
          } catch {
            return { raw: line };
          }
        });

      return NextResponse.json(
        {
          file: latestLogFile,
          logs: logs.slice(-100) // Return last 100 entries
        },
        { status: 200 }
      );
    } catch (readError) {
      console.error('[GET /api/auth/_log] Error reading logs:', readError);
      return NextResponse.json(
        { logs: [], error: 'Failed to read logs' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[GET /api/auth/_log] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
