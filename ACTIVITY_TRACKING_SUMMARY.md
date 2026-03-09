# User Activity Tracking Implementation - Complete Summary

## Overview

A complete user activity tracking system with automatic logout after 3 hours of inactivity has been implemented. The system includes:

- **Automatic Session Logout**: Users are automatically logged out after 3 hours (180 minutes) of inactivity
- **Real-time Activity Monitoring**: User activities are tracked and stored in MongoDB
- **Admin Dashboard**: Comprehensive dashboard showing user activity, last login, last active time
- **IndexedDB Caching**: Fast local storage of activities using IndexedDB (like WhatsApp's "last seen" feature)
- **WebSocket-like Heartbeat**: Periodic activity updates to server every 5 minutes
- **Session Warning**: Users receive warning 50 minutes before session expires

## Files Created

### 1. Backend - Models

#### `/root/nitminer/src/models/UserActivity.ts`
- MongoDB schema for storing user activities
- Fields: userId, email, lastLogin, lastActive, activityCount, activities array, device/browser info
- Indexes for fast queries on userId, email, lastActive

### 2. Backend - API Endpoints

#### `/root/nitminer/src/app/api/activity/track/route.ts`
- **POST**: Track user activity
  - Receives action, page, details from client
  - Updates UserActivity document
  - Returns session expiration status
- **GET**: Get current session status
  - Returns isOnline, lastActive, inactiveMinutes

#### `/root/nitminer/src/app/api/admin/users/activity/route.ts`
- **GET**: Fetch paginated list of user activities (Admin only)
  - Supports filtering by email, online status
  - Supports sorting by lastActive, lastLogin, activityCount
  - Returns user info, activity details, recent actions
  - Pagination with total count

#### `/root/nitminer/src/app/api/admin/users/activity/stats/route.ts`
- **GET**: Fetch activity statistics (Admin only)
  - Online users count
  - Active users in time range (24h, 7d, 30d)
  - Most active users
  - Activities breakdown by action type
  - Average activity metrics

### 3. Frontend - Client Libraries

#### `/root/trustinn/client/src/lib/activity-tracker/index.ts`
- **ActivityTracker class** - Main activity tracking utility
- Features:
  - Session ID generation
  - IndexedDB local storage
  - User activity listeners (mouse, keyboard, scroll, touch)
  - Heartbeat timer (every 5 minutes)
  - Inactivity checker (every 1 minute)
  - Auto-logout after 3 hours
  - Device/browser detection
  - Server communication

Methods:
- `initialize(userId)` - Initialize tracker for user
- `trackPageView(pageName)` - Track page navigation
- `trackAction(action, details, page)` - Track specific action
- `getSessionInfo()` - Get current session status
- `logout(reason)` - Logout user
- `onSessionExpired(callback)` - Subscribe to expiration events

### 4. Frontend - React Hooks

#### `/root/trustinn/client/src/hooks/useActivityTracking.ts`
- **useActivityTracking** - React hook for activity tracking
- Features:
  - Integrates ActivityTracker singleton
  - Manages session state
  - Tracks inactive minutes
  - Callbacks for session expiration and warnings
  - Methods: trackAction, trackPageView, getSessionInfo

### 5. Frontend - Components

#### `/root/trustinn/client/src/components/UserActivityTab.tsx`
- Admin dashboard component showing user activities
- Features:
  - Real-time statistics cards (online users, active users, avg activity)
  - Search by email
  - Filter by online/offline status
  - Sort by lastActive, lastLogin, activityCount
  - Paginated table of users
  - Status indicators (Active/Idle/Offline)
  - Time formatting (5m ago, 2h ago, etc.)
  - Device and browser information
  - Auto-refresh every 5 minutes

#### `/root/trustinn/client/src/components/SessionWarningModal.tsx`
- Warning modal shown when session is about to expire
- Features:
  - Yellow warning styling
  - Time remaining countdown
  - Continue Session / Logout buttons
  - Progress bar showing time until expiry
  - Auto-triggered 10 minutes before logout

## How It Works

### Client-Side Flow

1. **User Logs In**
   - useActivityTracking hook initializes
   - ActivityTracker.initialize() called with userId
   - Session ID created
   - Initial page view tracked

2. **User Activity Detection**
   - Global listeners track: mouse, keyboard, scroll, touch, click
   - Page navigation tracked via history.pushState override
   - Activities stored locally in IndexedDB first

3. **Heartbeat (Every 5 Minutes)**
   - Significant activities sent to server
   - Server updates lastActive timestamp
   - Server checks if session expired (>180 minutes)
   - Response indicates if session is expired

4. **Inactivity Check (Every 1 Minute)**
   - Calculate minutes since lastActivity
   - At 170 minutes: Show warning modal
   - At 180 minutes: Auto-logout, redirect to login

### Server-Side Flow

1. **Track Activity Endpoint**
   - Receive activity from client
   - Validate user session
   - Update UserActivity document:
     - lastActive = current time
     - activityCount increment
     - Add to activities array (keep last 100)
   - Check if session expired (> 180 minutes)
   - Return session expiration status

2. **Admin Activity List**
   - Query UserActivity with filters
   - Paginate results
   - Join with User collection for names
   - Calculate inactiveMinutes
   - Return formatted response

3. **Admin Statistics**
   - Aggregation pipeline for stats
   - Count online users
   - Get most active users
   - Group activities by action
   - Calculate averages

## Configuration Constants

### Inactivity Timeout
- **Location**: `src/lib/activity-tracker/index.ts` + `src/app/api/activity/track/route.ts`
- **Current**: 3 hours (180 minutes)
- **Adjustment**: Change `INACTIVITY_TIMEOUT_MS` and `INACTIVITY_TIMEOUT_MINUTES`

### Heartbeat Interval
- **Location**: `src/lib/activity-tracker/index.ts`
- **Current**: Every 5 minutes
- **Adjustment**: Change `HEARTBEAT_INTERVAL_MS`

### Inactivity Check Interval
- **Location**: `src/lib/activity-tracker/index.ts`
- **Current**: Every 1 minute
- **Adjustment**: Change `ACTIVITY_CHECK_INTERVAL_MS`

## Database Schema

### UserActivity Collection
```
{
  _id: ObjectId,
  userId: ObjectId (indexed),
  email: String (indexed),
  sessionId: String,
  lastLogin: Date,
  lastActive: Date (indexed),
  lastActivityAction: String,
  lastActivityPage: String,
  activityCount: Number,
  ipAddress: String,
  userAgent: String,
  isOnline: Boolean (indexed),
  inactivityMinutes: Number,
  sessionDuration: Number,
  device: String,
  browser: String,
  os: String,
  location: {
    country: String,
    city: String,
    latitude: Number,
    longitude: Number
  },
  activities: [
    {
      action: String,
      page: String,
      timestamp: Date,
      details: Mixed
    }
  ],
  createdAt: Date (indexed),
  updatedAt: Date
}
```

Indexes:
- `{ userId: 1, lastActive: -1 }` - Fast queries for user activities
- `{ email: 1, lastLogin: -1 }` - Fast queries by email
- `{ isOnline: 1, lastActive: -1 }` - Fast queries for online users
- `{ createdAt: -1 }` - Fast queries by creation date

## Integration Checklist

- [ ] Copy all API routes to `/root/nitminer/src/app/api/`
- [ ] Copy UserActivity model to `/root/nitminer/src/models/`
- [ ] Copy activity tracker to `/root/trustinn/client/src/lib/`
- [ ] Copy hooks to `/root/trustinn/client/src/hooks/`
- [ ] Copy components to `/root/trustinn/client/src/components/`
- [ ] Update root layout to use `useActivityTracking` hook
- [ ] Add `UserActivityTab` component to admin dashboard
- [ ] Test activity tracking in development
- [ ] Setup MongoDB indexes (automatically created via schema)
- [ ] Deploy to production
- [ ] Monitor admin dashboard for activity data

## Performance Optimization

### Client-Side
- Activities cached in IndexedDB before sending to server
- Batched updates every 5 minutes (heartbeat)
- Only significant actions sent to server
- No tracking on every keystroke

### Server-Side
- MongoDB indexes on frequently queried fields
- Aggregation pipeline for statistics
- Pagination for activity list
- TTL index on SessionManagement for auto-cleanup

### Caching Strategy
- IndexedDB for local activity storage
- Redis (optional) for session caching
- Database indexes for fast queries

## Security Features

1. **Authentication Check**: All endpoints validate NextAuth session
2. **Role-Based Access**: Admin endpoints check for admin role
3. **IP Tracking**: IP address logged for audit trail
4. **User Agent**: Browser/OS information captured
5. **Session Validation**: Server validates on every activity update

## Monitoring & Debugging

### Server Logs
```
[ActivityTracker] Initialized for user: user_id
Activity tracking error: error_message
Error retrieving activities: error_message
```

### Client Logs
```javascript
// Get session info
const info = await activityTracker.getSessionInfo();
console.log(info);

// Check if initialized
console.log(activityTracker.isInitialized);
```

### Admin Dashboard
- Real-time stats update every 5 minutes
- Search and filter for troubleshooting
- View individual user activity timelines

## API Response Examples

### Track Activity (Success)
```json
{
  "success": true,
  "sessionExpired": false,
  "inactiveMinutes": 5,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Track Activity (Session Expired)
```json
{
  "success": true,
  "sessionExpired": true,
  "inactiveMinutes": 185,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### User Activities List
```json
{
  "success": true,
  "data": [
    {
      "userName": "John Doe",
      "userEmail": "john@example.com",
      "lastActive": "2024-01-15T10:30:00Z",
      "inactiveMinutes": 5,
      "isOnline": true,
      "activityCount": 42,
      "device": "Desktop",
      "browser": "Chrome"
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

## Documentation Files

1. **USER_ACTIVITY_TRACKING_SETUP.md** - Complete technical documentation
2. **QUICK_START_ACTIVITY_TRACKING.md** - Quick start guide with examples

## Future Enhancements

1. WebSocket integration for real-time activity updates
2. Geolocation tracking with maps
3. Custom inactivity thresholds per user/role
4. Advanced activity analytics and reports
5. Activity export/download capabilities
6. Anomaly detection using ML
7. API rate limiting based on activity
8. Activity replay/timeline visualization
9. Bulk user action (logout all sessions)
10. Activity retention policies

## Support & Troubleshooting

### Issue: Sessions expire immediately
**Solution**: Ensure `useActivityTracking` is initialized in root layout

### Issue: Activities not tracked
**Solution**: Verify user is authenticated and `trackAction` is called

### Issue: Admin dashboard shows no data
**Solution**: Verify user has admin role and check MongoDB connection

### Issue: Performance degradation
**Solution**: Check activity array size, consider archiving old activities

## Endpoints Summary

| Endpoint | Method | Protection | Purpose |
|----------|--------|-----------|---------|
| `/api/activity/track` | POST | User Auth | Track activity |
| `/api/activity/track` | GET | User Auth | Get session status |
| `/api/admin/users/activity` | GET | Admin Auth | List user activities |
| `/api/admin/users/activity/stats` | GET | Admin Auth | Activity statistics |

## Version

- **Implementation Date**: 2024
- **System**: User Activity Tracking v1.0
- **Inactivity Timeout**: 3 hours (configurable)
- **Heartbeat Interval**: 5 minutes (configurable)

---

**Implementation Complete!** 

All components are ready for integration. Follow the QUICK_START_ACTIVITY_TRACKING.md guide to integrate into your application.
