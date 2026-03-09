# Quick Start Guide - User Activity Tracking

## Installation Steps

### Step 1: Ensure MongoDB Connection

Make sure you have MongoDB URI in your `.env.local`:

```env
MONGODB_URI=your_mongodb_connection_string
```

### Step 2: Initialize Activity Tracker in Root Layout

Update your root layout file to initialize the activity tracker:

```tsx
// src/app/layout.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useActivityTracking } from '@/hooks/useActivityTracking';
import SessionWarningModal from '@/components/SessionWarningModal';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sessionWarning, setSessionWarning] = useState<number | null>(null);
  
  const { isSessionActive, trackPageView } = useActivityTracking({
    enabled: true,
    onSessionExpired: (reason) => {
      console.log('Session expired due to:', reason);
      // Auto-redirect handled by activity tracker
    },
    onSessionWarning: (remainingMinutes) => {
      setSessionWarning(remainingMinutes);
    },
  });

  useEffect(() => {
    // Track initial page view
    trackPageView();
  }, [trackPageView]);

  // Handle session warning event
  useEffect(() => {
    const handleWarning = (event: any) => {
      setSessionWarning(event.detail.remainingMinutes);
    };

    window.addEventListener('sessionWarning', handleWarning);
    return () => window.removeEventListener('sessionWarning', handleWarning);
  }, []);

  return (
    <html>
      <body>
        {sessionWarning && (
          <SessionWarningModal
            remainingMinutes={sessionWarning}
            onExtendSession={() => {
              // Just close modal, heartbeat will extend session
              setSessionWarning(null);
            }}
            onLogout={() => {
              window.location.href = '/login?reason=user_logout';
            }}
          />
        )}
        {children}
      </body>
    </html>
  );
}
```

### Step 3: Track Activities in Components

In any page or component, track user actions:

```tsx
'use client';

import { useActivityTracking } from '@/hooks/useActivityTracking';

export default function MyPage() {
  const { trackPageView, trackAction } = useActivityTracking();

  // Track page view on mount
  useEffect(() => {
    trackPageView('My Page Title');
  }, [trackPageView]);

  // Track specific actions
  const handleExecuteTool = async () => {
    await trackAction('tool_execution', {
      toolName: 'Tracer-X',
      duration: 2500,
      status: 'success',
    }, '/tools/tracer-x');

    // Execute tool...
  };

  const handleFileDownload = async () => {
    await trackAction('file_download', {
      fileName: 'report.pdf',
      size: 1024000,
    });

    // Download file...
  };

  return (
    <div>
      <h1>My Page</h1>
      <button onClick={handleExecuteTool}>Execute Tool</button>
      <button onClick={handleFileDownload}>Download Report</button>
    </div>
  );
}
```

### Step 4: Add User Activity Tab to Admin Dashboard

```tsx
// In your admin dashboard page
import UserActivityTab from '@/components/UserActivityTab';

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <h1>Admin Dashboard</h1>
      
      <div className="grid grid-cols-4 gap-4">
        {/* Other stats cards */}
      </div>

      {/* User Activity Tab */}
      <UserActivityTab />
    </div>
  );
}
```

## Configuration

### Change Inactivity Timeout

Edit `/root/nitminer/src/lib/activity-tracker/index.ts`:

```ts
// Change this (currently 3 hours = 180 minutes)
const INACTIVITY_TIMEOUT_MS = 3 * 60 * 60 * 1000;

// Example: 2 hours
const INACTIVITY_TIMEOUT_MS = 2 * 60 * 60 * 1000;

// Example: 30 minutes
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;
```

Also update the API endpoint:

Edit `/root/nitminer/src/app/api/activity/track/route.ts`:

```ts
const INACTIVITY_TIMEOUT_MINUTES = 120; // Change from 180
```

### Change Heartbeat Interval

Edit `/root/nitminer/src/lib/activity-tracker/index.ts`:

```ts
// Currently every 5 minutes
const HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000;

// Change to every 3 minutes
const HEARTBEAT_INTERVAL_MS = 3 * 60 * 1000;
```

## Activity Types to Track

Track different types of activities throughout your app:

```tsx
// Page navigation
trackPageView('Dashboard');

// Tool execution
trackAction('tool_execution', {
  toolName: 'Tracer-X',
  executionTime: 2500,
  status: 'success'
});

// API calls
trackAction('api_call', {
  endpoint: '/api/tools/execute',
  method: 'POST',
  duration: 500
});

// File operations
trackAction('file_download', {
  fileName: 'report.pdf',
  size: 1024000
});

trackAction('file_upload', {
  fileName: 'test.sol',
  size: 5000,
  type: 'solidity'
});

// Settings changes
trackAction('settings_change', {
  setting: 'theme',
  oldValue: 'light',
  newValue: 'dark'
});

// Chat messages
trackAction('chat', {
  conversationId: 'conv_123',
  messageLength: 150
});
```

## Monitoring in Admin Dashboard

Admin users can:

1. **View Real-time Statistics**
   - Online users count
   - Active users in 24h
   - Average activity count
   - Total activities

2. **Search and Filter**
   - Search by email
   - Filter by online/offline status
   - Sort by last active, last login, or activity count

3. **View User Details**
   - Last login timestamp
   - Last active timestamp
   - Last action performed
   - Activity count
   - Device and browser info
   - IP address

4. **Pagination**
   - View 20 users per page
   - Navigate through pages
   - See total user count

## API Endpoints Reference

### Track Activity
```
POST /api/activity/track
Content-Type: application/json

{
  "action": "page_view",
  "page": "/tools",
  "details": { "title": "Tools Page" },
  "sessionId": "session_xxx",
  "device": "Desktop",
  "browser": "Chrome",
  "os": "Windows"
}

Response:
{
  "success": true,
  "sessionExpired": false,
  "inactiveMinutes": 5,
  "action": "page_view",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Get Current Session Status
```
GET /api/activity/track

Response:
{
  "isOnline": true,
  "lastActive": "2024-01-15T10:30:00Z",
  "lastActivityAction": "page_view",
  "inactiveMinutes": 5,
  "sessionDuration": 120,
  "activityCount": 42,
  "sessionExpired": false
}
```

### Get User Activities (Admin Only)
```
GET /api/admin/users/activity?page=1&limit=20&sortBy=lastActive&order=desc&online=true&search=user@example.com

Response:
{
  "success": true,
  "data": [ /* user activity objects */ ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### Get Activity Statistics (Admin Only)
```
GET /api/admin/users/activity/stats?timeRange=24h

Response:
{
  "success": true,
  "data": {
    "timeRange": "24h",
    "stats": {
      "onlineUsers": 23,
      "activeUsers": 156,
      "mostActiveUsers": [ /* ... */ ],
      "activitiesByAction": [ /* ... */ ],
      "avgActivityCount": 38,
      "totalActivityCount": 19000,
      "uniqueUsers": 500
    }
  }
}
```

## Troubleshooting

### Sessions Expiring Immediately
1. Check that `useActivityTracking` hook is initialized in root layout
2. Verify MongoDB connection with `MONGODB_URI`
3. Check browser console for errors
4. Verify user is authenticated (NextAuth session exists)

### Activities Not Tracking
1. Check that component has `useActivityTracking` hook
2. Verify `trackAction` is being called
3. Check Network tab for `/api/activity/track` requests
4. Ensure user has valid session

### Admin Dashboard Not Showing Data
1. Verify user has `role: 'admin'` in database
2. Check that API endpoint is accessible
3. Verify MongoDB contains UserActivity collection
4. Check browser console and server logs for errors

## Best Practices

1. **Track Meaningful Actions**: Only track important user actions, not every keystroke
2. **Include Details**: Add relevant context to activity details
3. **Monitor Session Health**: Check admin dashboard regularly for user engagement
4. **Adjust Timeout**: Set inactivity timeout appropriate for your use case
5. **Test Thoroughly**: Test logout and warning flows before deployment

## Performance Tips

1. Activities are cached locally using IndexedDB first
2. Server updates happen in batches every 5 minutes
3. Only significant actions are sent to server
4. Database queries are indexed for fast access
5. Old sessions auto-clean up via MongoDB TTL

## Next Steps

1. Deploy changes to production
2. Monitor user activities in admin dashboard
3. Gather feedback on inactivity timeout duration
4. Fine-tune configuration as needed
5. Add custom analytics based on activity data
