# User Activity Tracking API Documentation

## Base URL
```
https://www.nitminer.com/api/
```

## Authentication
All endpoints require valid NextAuth session. Admin endpoints additionally require `role: 'admin'`.

---

## Activity Tracking Endpoints

### 1. Track User Activity

**Endpoint**: `POST /activity/track`

**Description**: Track user activity and update session status. Called automatically by activity tracker every 5 minutes.

**Authentication**: User (logged in)

**Request Headers**:
```
Content-Type: application/json
Authorization: Bearer <session-token>
```

**Request Body**:
```json
{
  "action": "page_view",
  "page": "/tools/tracer-x",
  "details": {
    "duration": 2500,
    "status": "success"
  },
  "sessionId": "session_xxx",
  "device": "Desktop",
  "browser": "Chrome",
  "os": "Windows"
}
```

**Request Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| action | string | Yes | Activity type: `login`, `logout`, `page_view`, `api_call`, `tool_execution`, `file_upload`, `file_download`, `chat`, `settings_change`, `other` |
| page | string | No | Current page URL or path |
| details | object | No | Additional activity details |
| sessionId | string | No | Current session ID |
| device | string | No | Device type: `Desktop`, `Mobile`, `Tablet` |
| browser | string | No | Browser name: `Chrome`, `Firefox`, `Safari`, `Edge` |
| os | string | No | Operating system: `Windows`, `macOS`, `Linux`, `Android`, `iOS` |

**Response** (Success):
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

**Response** (Session Expired):
```json
{
  "success": true,
  "message": "Activity tracked successfully",
  "sessionExpired": true,
  "inactiveMinutes": 185,
  "action": "page_view",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Status Codes**:
- `200` - Successfully tracked
- `401` - Unauthorized (not logged in)
- `500` - Server error

**Example Request**:
```bash
curl -X POST https://www.nitminer.com/api/activity/track \
  -H "Content-Type: application/json" \
  -d '{
    "action": "tool_execution",
    "page": "/tools/tracer-x",
    "details": {
      "toolName": "Tracer-X",
      "executionTime": 2500,
      "status": "success"
    },
    "device": "Desktop",
    "browser": "Chrome",
    "os": "Windows"
  }'
```

**Example Usage (React)**:
```typescript
const trackActivity = async () => {
  const response = await fetch('/api/activity/track', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'tool_execution',
      page: window.location.pathname,
      details: {
        toolName: 'Tracer-X',
        executionTime: 2500,
      },
      device: 'Desktop',
      browser: 'Chrome',
      os: 'Windows',
    }),
  });

  const result = await response.json();
  if (result.sessionExpired) {
    // Redirect to login
    window.location.href = '/login?reason=session_expired';
  }
};
```

---

### 2. Get Current Session Status

**Endpoint**: `GET /activity/track`

**Description**: Get current user's session status and inactivity information.

**Authentication**: User (logged in)

**Query Parameters**: None

**Response** (Success):
```json
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

**Response** (Session Not Found):
```json
{
  "isOnline": false,
  "lastActive": null,
  "inactiveMinutes": null
}
```

**Status Codes**:
- `200` - Success
- `401` - Unauthorized
- `500` - Server error

**Example Request**:
```bash
curl https://www.nitminer.com/api/activity/track
```

**Example Usage (React)**:
```typescript
const getSessionStatus = async () => {
  const response = await fetch('/api/activity/track');
  const status = await response.json();
  
  console.log(`Session active: ${status.isOnline}`);
  console.log(`Inactive for: ${status.inactiveMinutes} minutes`);
  console.log(`Session expired: ${status.sessionExpired}`);
};
```

---

## Admin Analytics Endpoints

### 3. Get User Activity List

**Endpoint**: `GET /admin/users/activity`

**Description**: Retrieve paginated list of user activities with filtering and sorting. Admin only.

**Authentication**: Admin user

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number (1-indexed) |
| limit | number | 20 | Results per page (max 100) |
| sortBy | string | lastActive | Sort field: `lastActive`, `lastLogin`, `activityCount` |
| order | string | desc | Sort order: `asc` or `desc` |
| online | string | - | Filter by status: `true` (online), `false` (offline) |
| search | string | - | Search by email address |

**Response** (Success):
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "userId": "507f1f77bcf86cd799439012",
      "email": "john@example.com",
      "userName": "John Doe",
      "lastLogin": "2024-01-15T08:00:00Z",
      "lastLoginFormatted": "2024-01-15",
      "lastActive": "2024-01-15T10:30:00Z",
      "lastActiveFormatted": "5m ago",
      "lastActivityAction": "page_view",
      "lastActivityPage": "/tools",
      "activityCount": 42,
      "isOnline": true,
      "device": "Desktop",
      "browser": "Chrome",
      "os": "Windows",
      "ipAddress": "123.45.67.89",
      "inactiveMinutes": 5,
      "recentActivities": [
        {
          "action": "page_view",
          "page": "/tools",
          "timestamp": "2024-01-15T10:30:00Z"
        },
        {
          "action": "api_call",
          "page": "/api/tools/execute",
          "timestamp": "2024-01-15T10:25:00Z"
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

**Status Codes**:
- `200` - Success
- `403` - Forbidden (not admin)
- `401` - Unauthorized
- `500` - Server error

**Example Requests**:

Get first page of all active users:
```bash
curl "https://www.nitminer.com/api/admin/users/activity?page=1&limit=20"
```

Get online users sorted by activity count:
```bash
curl "https://www.nitminer.com/api/admin/users/activity?online=true&sortBy=activityCount&order=desc"
```

Search specific user:
```bash
curl "https://www.nitminer.com/api/admin/users/activity?search=john@example.com"
```

**Example Usage (React)**:
```typescript
const fetchUserActivities = async (page = 1, search = '') => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: '20',
    sortBy: 'lastActive',
    order: 'desc',
  });

  if (search) {
    params.append('search', search);
  }

  const response = await fetch(
    `/api/admin/users/activity?${params}`
  );
  const result = await response.json();

  if (result.success) {
    console.log(`Total users: ${result.pagination.total}`);
    result.data.forEach((user) => {
      console.log(`${user.userName}: ${user.inactiveMinutes}m inactive`);
    });
  }
};
```

---

### 4. Get Activity Statistics

**Endpoint**: `GET /admin/users/activity/stats`

**Description**: Get aggregated activity statistics including online users, active users, and activity breakdown. Admin only.

**Authentication**: Admin user

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| timeRange | string | 24h | Time range: `24h`, `7d`, `30d` |

**Response** (Success):
```json
{
  "success": true,
  "data": {
    "timeRange": "24h",
    "stats": {
      "onlineUsers": 23,
      "activeUsers": 156,
      "uniqueUsers": 500,
      "avgActivityCount": 38.5,
      "totalActivityCount": 19000,
      "mostActiveUsers": [
        {
          "email": "user1@example.com",
          "activityCount": 250
        },
        {
          "email": "user2@example.com",
          "activityCount": 198
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
        },
        {
          "_id": "tool_execution",
          "count": 1800
        },
        {
          "_id": "file_download",
          "count": 500
        }
      ]
    }
  }
}
```

**Status Codes**:
- `200` - Success
- `403` - Forbidden (not admin)
- `401` - Unauthorized
- `500` - Server error

**Example Requests**:

Get 24-hour statistics:
```bash
curl "https://www.nitminer.com/api/admin/users/activity/stats?timeRange=24h"
```

Get 7-day statistics:
```bash
curl "https://www.nitminer.com/api/admin/users/activity/stats?timeRange=7d"
```

**Example Usage (React)**:
```typescript
const fetchActivityStats = async () => {
  const response = await fetch(
    '/api/admin/users/activity/stats?timeRange=24h'
  );
  const result = await response.json();

  const stats = result.data.stats;
  console.log(`Online now: ${stats.onlineUsers}`);
  console.log(`Active in 24h: ${stats.activeUsers}`);
  console.log(`Avg activities per user: ${stats.avgActivityCount}`);
  
  // Get most active user
  const topUser = stats.mostActiveUsers[0];
  console.log(`Most active: ${topUser.email} (${topUser.activityCount} activities)`);
};
```

---

## Activity Types Reference

| Action | Description |
|--------|-------------|
| `login` | User logs in |
| `logout` | User logs out |
| `page_view` | Page navigation |
| `api_call` | API request made |
| `tool_execution` | Tool/utility executed |
| `file_upload` | File uploaded |
| `file_download` | File downloaded |
| `chat` | Chat message sent |
| `settings_change` | Settings modified |
| `heartbeat` | Periodic activity update |
| `user_action` | General user interaction |
| `page_navigation` | Page navigation |
| `other` | Other activity |

---

## Error Responses

All error responses follow this format:

```json
{
  "error": "Error message describing what went wrong",
  "details": "Additional context (optional)"
}
```

**Common Error Codes**:

| Code | Error | Cause |
|------|-------|-------|
| 400 | Bad Request | Invalid parameters |
| 401 | Unauthorized | Missing or invalid session |
| 403 | Forbidden | Insufficient permissions (not admin) |
| 404 | Not Found | Resource not found |
| 500 | Server Error | Internal server error |

---

## Rate Limiting

- **Activity Tracking**: No rate limit (called periodically)
- **Admin Endpoints**: 100 requests per minute per user

---

## Data Retention

- **Raw Activities**: Kept for 90 days
- **Aggregated Statistics**: Kept indefinitely
- **Inactive Sessions**: Auto-deleted after 30 days

---

## Performance Considerations

1. **Pagination**: Always use pagination for large datasets
2. **Caching**: Client caches activities in IndexedDB
3. **Indexes**: Server uses database indexes for fast queries
4. **Aggregation**: Statistics use efficient MongoDB aggregation pipeline

---

## Webhook Events (Future)

When implemented, these events will be available:

```javascript
// User went online
user:online { userId, timestamp }

// User went offline
user:offline { userId, timestamp, inactivityMinutes }

// Session about to expire
session:expiring_soon { userId, minutesRemaining }

// Session expired
session:expired { userId, reason }

// High activity detected
activity:spike { userId, activityCount, minutesOfActivity }
```

---

## SDK/Library Integration

### JavaScript/TypeScript
```typescript
import { activityTracker } from '@/lib/activity-tracker';

// Initialize
await activityTracker.initialize(userId);

// Track action
await activityTracker.trackAction('tool_execution', {
  toolName: 'Tracer-X',
  duration: 2500,
});

// Get status
const status = await activityTracker.getSessionInfo();
```

### React Hook
```typescript
import { useActivityTracking } from '@/hooks/useActivityTracking';

const { trackAction, trackPageView, isSessionActive } = useActivityTracking();
```

---

## Best Practices

1. **Track Meaningful Actions**: Don't track every keystroke
2. **Include Details**: Always include relevant context
3. **Handle Expiration**: Show warning before logout
4. **Test Thoroughly**: Test in development first
5. **Monitor**: Check admin dashboard regularly

---

## Support

For issues or questions:
1. Check QUICK_START_ACTIVITY_TRACKING.md
2. Review server logs
3. Check browser console for client errors
4. Verify MongoDB connection

---

**Last Updated**: 2024
**Version**: 1.0
**Status**: Production Ready
