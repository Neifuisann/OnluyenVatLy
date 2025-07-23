# Playwright Test Authentication

This document describes the test authentication bypass mechanism for Playwright tests.

## Overview

The test authentication system allows Playwright tests to bypass the normal login flow by using secure test tokens. This significantly speeds up test execution and makes tests more reliable.

## Security Features

1. **Environment Protection**: Test tokens only work when `NODE_ENV !== 'production'` or when `ALLOW_TEST_AUTH=true` is explicitly set
2. **Token Validation**: Tokens are signed with HMAC-SHA256 and validated on each request
3. **Time-Limited Tokens**: Tokens expire after 1 hour
4. **User Agent Verification**: Requests must include Playwright user agent
5. **Localhost Only**: Test token endpoint only accessible from localhost

## Setup

### 1. Environment Configuration

For local development and testing:
```bash
NODE_ENV=development
```

For staging environments (use with caution):
```bash
NODE_ENV=staging
ALLOW_TEST_AUTH=true
PLAYWRIGHT_TEST_SECRET=your-secret-key  # Optional: use custom secret
```

### 2. Using Test Authentication in Tests

```javascript
const { test, expect } = require('@playwright/test');
const testAuth = require('./helpers/testAuth');

test('authenticated student test', async ({ page }) => {
  // Apply student authentication
  await testAuth.applyAuthToPage(page, 'student');
  
  // Navigate to protected page
  await page.goto('/lessons');
  
  // Page should load without redirect to login
  await expect(page).toHaveURL(/\/lessons/);
});

test('authenticated admin test', async ({ page }) => {
  // Apply admin authentication
  await testAuth.applyAuthToPage(page, 'admin');
  
  // Navigate to admin page
  await page.goto('/admin');
  
  // Should have admin access
  await expect(page).toHaveURL(/\/admin/);
});
```

### 3. Creating Authenticated Contexts

For tests that need to maintain authentication across multiple pages:

```javascript
test('multi-page authenticated test', async ({ browser }) => {
  // Create pre-authenticated context
  const context = await testAuth.createAuthenticatedContext(browser, 'student');
  const page = await context.newPage();
  
  // All pages in this context will be authenticated
  await page.goto('/lessons');
  await page.goto('/lesson/1');
  await page.goto('/progress');
  
  await context.close();
});
```

### 4. Using the authenticatedGoto Helper

For simple navigation with authentication:

```javascript
test('simple authenticated navigation', async ({ page }) => {
  // Navigate with authentication in one step
  await testAuth.authenticatedGoto(page, '/lessons', 'student');
  
  // Verify page loaded
  await expect(page.locator('.hero-section')).toBeVisible();
});
```

## How It Works

1. **Token Generation**: The server generates signed tokens containing user type and optional user data
2. **Header Injection**: Playwright adds test token headers to all requests
3. **Middleware Validation**: Server middleware validates tokens before session middleware
4. **Session Creation**: Valid tokens create temporary test sessions
5. **Normal Flow**: After session creation, requests proceed through normal auth flow

## API Reference

### Test Token Endpoint

```
GET /api/test-tokens
```

Returns:
```json
{
  "success": true,
  "tokens": {
    "admin": "base64-encoded-admin-token",
    "student": "base64-encoded-student-token"
  },
  "usage": {
    "header": "x-playwright-test-token",
    "userAgentHeader": "x-playwright-test-user-agent",
    "userAgentValue": "playwright-test"
  }
}
```

### Required Headers

- `x-playwright-test-token`: The test token
- `x-playwright-test-user-agent`: Set to `playwright-test`
- `User-Agent`: Must contain "Playwright"

## Security Best Practices

1. **Never enable in production**: Always check `NODE_ENV` and `ALLOW_TEST_AUTH`
2. **Use environment-specific secrets**: Different secrets for dev/staging
3. **Monitor token usage**: Log all test token usage for auditing
4. **Restrict access**: Test token endpoint only works from localhost
5. **Regular token rotation**: Change `PLAYWRIGHT_TEST_SECRET` periodically

## Troubleshooting

### Test authentication not working

1. Check environment variables are set correctly
2. Ensure the server is running with the correct NODE_ENV
3. Verify Playwright is sending the correct headers
4. Check server logs for test auth validation errors

### Token expired errors

Tokens expire after 1 hour. The test auth helper automatically fetches new tokens as needed.

### Production environment errors

Test authentication is disabled in production by default. This is intentional for security.