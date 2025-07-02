# Authentication Redirect Fix

## Problem
The authentication middleware was returning JSON error responses instead of redirecting users to the appropriate login pages for HTML requests.

**Error Encountered**:
```json
{"error":"Authentication required","message":"Student authentication required"}
```

## Root Cause
The `requireAuthForHTML` helper function was designed to handle authentication failures, but the underlying authentication middleware (`requireStudentAuth` and `requireAdminAuth`) were directly returning JSON responses instead of allowing the helper to handle redirects.

## Solution
Created dedicated HTML-specific authentication middleware that properly handles redirects:

### New Middleware Functions

```javascript
// Middleware specifically for HTML pages that require student authentication
const requireStudentAuthForHTML = (req, res, next) => {
  if (!sessionService.isStudentAuthenticated(req)) {
    // For HTML requests, redirect to student login
    return res.redirect('/student/login?redirect=' + encodeURIComponent(req.originalUrl));
  }
  next();
};

// Middleware specifically for HTML pages that require admin authentication  
const requireAdminAuthForHTML = (req, res, next) => {
  if (!sessionService.isAdminAuthenticated(req)) {
    // For HTML requests, redirect to admin login
    return res.redirect('/admin/login?redirect=' + encodeURIComponent(req.originalUrl));
  }
  next();
};
```

### Routes Updated

**Student Routes** (now use `requireStudentAuthForHTML`):
- `/lessons`, `/lesson/:id`
- `/lythuyet`, `/multiplechoice`, `/truefalse`
- `/leaderboard`, `/gallery`, `/history`
- `/quizgame`, `/profile`, `/profile/:studentId`
- `/result`, `/result/:id`

**Admin Routes** (now use `requireAdminAuthForHTML`):
- `/admin`, `/admin/lessons`, `/admin/new`
- `/admin/lessons/new`, `/admin/lessons/:id/edit`, `/admin/edit/:id`
- `/admin/configure`, `/admin/configure/:id`
- `/admin/students`, `/admin/results`, `/admin/ratings`
- `/admin/uploads`, `/admin/statistics`, `/admin/quiz`
- `/admin/lessons/:id/statistics`

**Public Routes** (no authentication required):
- `/` (landing page)
- `/login`, `/student/login`, `/admin/login`
- `/register`, `/student/register`

## Benefits

1. **Proper User Experience**: Users are now redirected to login pages instead of seeing JSON errors
2. **Redirect Preservation**: Original URL is preserved in redirect parameter for post-login navigation
3. **Role-Based Redirects**: Students go to `/student/login`, admins go to `/admin/login`
4. **Clean Separation**: HTML authentication logic is separate from API authentication logic

## Testing

After applying this fix:
1. Navigate to any protected page without authentication
2. You should be redirected to the appropriate login page
3. After login, you should be redirected back to the original page

## Files Modified

- `api/routes/views.js`: Added new middleware functions and updated all route definitions

This fix resolves the authentication redirect issue and provides a proper user experience for the web application.
