# User Activity Tracking & Automatic Logout Feature

This document describes the complete implementation of automatic session logout after 3 hours of inactivity and user activity tracking for the admin dashboard.

## Features

1. **Automatic Logout**: User sessions automatically expire after 3 hours (180 minutes) of inactivity
2. **Activity Tracking**: All user activities are recorded (page views, API calls, tool executions, etc.)
3. **Session Management**: Real-time session status with WebSocket-like heartbeat mechanism
4. **Admin Dashboard**: Comprehensive User Activity Tab showing:
   - Active users in real-time
   - Last login and last active timestamps
   - Recent activities and actions
   - Device and browser information
   - Session duration and activity count

5. **Fast Access**: Uses IndexedDB for client-side caching and MongoDB with indexes for server-side queries
6. **Activity Timeline**: View detailed activity history for each user

## Architecture

### Backend Components

#### 1. MongoDB Models

**UserActivity Model** (`src/models/UserActivity.ts`)
- Tracks all user activities
- Stores activity logs with timestamps
- Indexes for fast queries

**SessionManagement Model** (`src/models/SessionManagement.ts`) - Already exists
- Manages active sessions
- Tracks last activity time
- Supports TTL for automatic cleanup

#### 2. API Endpoints

**Activity Tracking Endpoint**
- `POST /api/activity/track` - Track user activity
- `GET /api/activity/track` - Get current session status

**Admin Endpoints**
- `GET /api/admin/users/activity` - Get paginated user activity list
- `GET /api/admin/users/activity/stats` - Get activity statistics

### Frontend Components

#### 1. Activity Tracker (`src/lib/activity-tracker/`)
- Global activity tracking
- Local IndexedDB storage
- Heartbeat mechanism
- Inactivity detection
- Session timeout management

#### 2. React Hook (`src/hooks/useActivityTracking.ts`)
- Easy integration into React components
- Session expiration callbacks
- Activity tracking methods

#### 3. Admin Dashboard Component (`src/components/UserActivityTab.tsx`)
- User activity table
- Real-time statistics
- Search and filtering
- Pagination
- Activity status indicators

## Integration Guide

### 1. Setup Activity Tracking in Your App Layout

```tsx
// src/app/layout.tsx
'use client';

import { useActivityTracking } from '@/hooks/useActivityTracking';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isSessionActive } = useActivityTracking({
    onSessionExpired: (reason) => {
      console.log('Session expired:', reason);
      // Session will auto-redirect to login
    },
    onSessionWarning: (remainingMinutes) => {
      // Show warning dialog 10 minutes before expiry
      console.log(`Session expiring in ${remainingMinutes} minutes`);
    },
  });

  return (
    <html>
      <body>
        {!isSessionActive && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <h2>Session Expired</h2>
              <p>Your session has expired due to inactivity. Please login again.</p>
            </div>
          </div>
        )}
        {children}
      </body>
    </html>
  );
}
```

### 2. Track Specific Actions

```tsx
// In any component
import { useActivityTracking } from '@/hooks/useActivityTracking';

export default function MyComponent() {
  const { trackAction, trackPageView } = useActivityTracking();

  const handleToolExecution = async () => {
    // Track the action
    await trackAction('tool_execution', {
      toolName: 'Tracer-X',
      executionTime: 2500,
    }, '/tools/tracer-x');

    // Execute tool...
  };

  useEffect(() => {
    // Track page view on mount
    trackPageView('My Tools Page');
  }, [trackPageView]);

  return (
    <button onClick={handleToolExecution}>
      Execute Tool
    </button>
  );
}
```

### 3. Add User Activity Tab to Admin Dashboard

```tsx
// In your admin dashboard component
import UserActivityTab from '@/components/UserActivityTab';

export default function AdminDashboard() {
  return (
    <div>
      {/* Other tabs */}
      <UserActivityTab />
    </div>
  );
}
```

## Configuration

### Inactivity Timeout

To change the 3-hour timeout, update the constant in:
- `src/lib/activity-tracker/index.ts`: `INACTIVITY_TIMEOUT_MS`
- `src/app/api/activity/track/route.ts`: `INACTIVITY_TIMEOUT_MINUTES`

```ts
// Default: 3 hours (180 minutes)
const INACTIVITY_TIMEOUT_MS = 3 * 60 * 60 * 1000;
const INACTIVITY_TIMEOUT_MINUTES = 180;
```

### Heartbeat Interval

```ts
// How often to send updates to server (default: every 5 minutes)
const HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000;
```

## Activity Types

The following activity types are tracked:

- `login` - User login
- `logout` - User logout
- `page_view` - Page navigation
- `api_call` - API request
- `tool_execution` - Tool/utility execution
- `file_upload` - File upload
- `file_download` - File download
- `chat` - Chat message
- `settings_change` - Settings modification
- `other` - Other activities

## Database Schema

### UserActivity Collection

```json
{
  "_id": ObjectId,
  "userId": ObjectId,
  "email": "user@example.com",
  "sessionId": "session_xxx",
  "lastLogin": ISODate,
  "lastActive": ISODate,
  "lastActivityAction": "page_view",
  "lastActivityPage": "/tools",
  "activityCount": 42,
  "ipAddress": "123.45.67.89",
  "userAgent": "Mozilla/5.0...",
  "isOnline": true,
  "inactivityMinutes": 5,
  "sessionDuration": 120,
  "device": "Desktop",
  "browser": "Chrome",
  "os": "Windows",
  "location": {
    "country": "US",
    "city": "New York",
    "latitude": 40.7128,
    "longitude": -74.0060
  },
  "activities": [
    {
      "action": "page_view",
      "page": "/tools",
      "timestamp": ISODate,
      "details": {}
    }
  ],
  "createdAt": ISODate,
  "updatedAt": ISODate
}
```

## API Response Examples

### Track Activity Response

```json
{
  "success": true,
  "message": "Activity tracked successfully",
  "sessionExpired": false,
  "inactiveMinutes": 5,
  "action": "page_view",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Get User Activities Response

```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "userName": "John Doe",
      "userEmail": "john@example.com",
      "lastActive": "2024-01-15T10:30:00Z",
      "lastActiveFormatted": "5m ago",
      "lastLogin": "2024-01-15T08:00:00Z",
      "lastLoginFormatted": "2 hours ago",
      "lastActivityAction": "page_view",
      "activityCount": 42,
      "isOnline": true,
      "device": "Desktop",
      "browser": "Chrome",
      "inactiveMinutes": 5,
      "recentActivities": [
        {
          "action": "page_view",
          "page": "/tools",
          "timestamp": "2024-01-15T10:30:00Z"
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### Activity Statistics Response

```json
{
  "success": true,
  "data": {
    "stats": {
      "onlineUsers": 23,
      "activeUsers": 156,
      "uniqueUsers": 500,
      "avgActivityCount": 38,
      "totalActivityCount": 19000,
      "mostActiveUsers": [
        {
          "email": "user1@example.com",
          "activityCount": 250
        }
      ],
      "activitiesByAction": [
        {
          "_id": "page_view",
          "count": 9500
        },
        {
          "_id": "api_call",
          "count": 7200
        }
      ]
    }
  }
}
```

## Client-Side Storage

### IndexedDB Structure

The activity tracker uses IndexedDB for local caching:

**activities** store:
```
{
  id: "timestamp_random",
  userId: "user_id",
  action: "page_view",
  timestamp: 1234567890,
  page: "/tools"
}
```

**sessionInfo** store:
```
{
  id: "session_info",
  lastActivityTime: 1234567890,
  sessionId: "session_xxx"
}
```

## Monitoring & Debugging

### Server-Side Logs

```ts
// Activity tracking logs
[ActivityTracker] Initialized for user: user_id
Activity tracking error: error_message
Error retrieving activity: error_message
```

### Client-Side Console

```ts
// Check session status
const info = await activityTracker.getSessionInfo();
console.log(info);
// { isActive: true, inactiveMinutes: 5, sessionDuration: 120 }

// Track action
await activityTracker.trackAction('tool_execution', { toolName: 'Tool' });
```

## Performance Optimization

1. **Batching**: Activities are batched before sending to server (only on significant actions)
2. **Indexing**: MongoDB indexes on frequently queried fields:
   - `userId` + `lastActive`
   - `email` + `lastLogin`
   - `isOnline` + `lastActive`
   - `createdAt`

3. **Local Caching**: IndexedDB stores activities locally, reducing server calls
4. **TTL**: MongoDB TTL index on `expiresAt` field automatically removes old sessions

## Security Considerations

1. **Session Validation**: Server validates session token on every activity update
2. **Admin Access**: Activity endpoints require admin role
3. **IP Tracking**: IP address is logged for security audit trail
4. **User Agent**: Browser/OS information is captured

## Troubleshooting

### Session Expires Too Early
- Check `INACTIVITY_TIMEOUT_MS` in activity tracker
- Verify heartbeat is sending (check Network tab)
- Check server logs for session validation errors

### Activities Not Being Tracked
- Verify activity tracker is initialized in layout
- Check browser console for errors
- Ensure user is authenticated (check NextAuth session)

### Admin Dashboard Not Showing Data
- Verify user has admin role
- Check API response in Network tab
- Verify MongoDB connection and indexes

## Files Modified/Created

### New Files
- `src/models/UserActivity.ts` - User activity model
- `src/app/api/activity/track/route.ts` - Activity tracking API
- `src/app/api/admin/users/activity/route.ts` - Admin activity list API
- `src/app/api/admin/users/activity/stats/route.ts` - Activity statistics API
- `src/lib/activity-tracker/index.ts` - Activity tracker utility
- `src/hooks/useActivityTracking.ts` - React hook for activity tracking
- `src/components/UserActivityTab.tsx` - Admin dashboard component

### Updated Files
- None (this is a new feature)

## Future Enhancements

1. WebSocket integration for real-time updates
2. Geolocation tracking
3. Custom inactivity thresholds per user
4. Activity export/reporting
5. Machine learning for anomaly detection
6. Advanced analytics and heatmaps
7. API rate limiting based on activity
