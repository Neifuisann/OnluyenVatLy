# Supabase CSRF Protection Fix

## Problem Description

After database migrations, you may encounter CSRF token validation errors like:

```json
{
    "error": "CSRF token not provided",
    "code": "VALIDATION_ERROR",
    "timestamp": "2025-07-05T13:50:44.626Z"
}
```

This occurs when Supabase database triggers or webhooks make HTTP requests back to your application without the required CSRF tokens.

## Root Cause

The issue happens because:

1. **Database Triggers**: Supabase may have database triggers that make HTTP requests using `pg_net` extension
2. **Webhooks**: Database webhooks configured to call your API endpoints
3. **External Requests**: These requests come from Supabase servers, not your frontend, so they don't have CSRF tokens
4. **CSRF Validation**: Your application's CSRF middleware blocks these requests

## Solution Overview

The fix involves:

1. **Bypass CSRF for Webhook Endpoints**: Add webhook-specific routes that bypass CSRF validation
2. **Configure Safe Webhooks**: Set up proper webhook handling in Supabase
3. **Disable Problematic Triggers**: Remove or modify triggers that cause CSRF issues

## Implementation Steps

### Step 1: Apply Code Changes (Already Done)

The following changes have been made to your application:

1. **Updated CSRF Middleware** (`api/middleware/csrf.js`):
   - Added webhook endpoints to CSRF bypass list
   - Endpoints that bypass CSRF: `/api/webhooks/*`, `/api/supabase/*`, `/api/database/webhooks`

2. **Created Webhook Routes** (`api/routes/webhooks.js`):
   - Dedicated webhook handlers for Supabase callbacks
   - Proper logging and error handling
   - Health check endpoint

3. **Updated Main Application** (`api/index.js`):
   - Added webhook routes to the application

### Step 2: Configure Supabase Database

Run the SQL configuration script in your Supabase SQL Editor:

```bash
# Copy the contents of this file to Supabase SQL Editor
cat scripts/configure-supabase-webhooks.sql
```

This script will:
- Identify and disable problematic HTTP triggers
- Create safe webhook functions
- Set up webhook configuration table
- Provide proper authentication for webhook requests

### Step 3: Update Webhook Configuration

Run the configuration update script:

```bash
# Make sure your .env file has the correct APP_DOMAIN
node scripts/update-supabase-config.js
```

This script will:
- Check current webhook configurations
- Update webhook URLs to use your domain
- Verify CSRF bypass settings
- Provide status report

### Step 4: Update Environment Variables

Make sure your `.env` file includes:

```env
# Your application domain (update with actual domain)
APP_DOMAIN=https://your-actual-domain.com

# Supabase configuration
NEXT_PUBLIC_SUPABASE_URL=https://miojaflixmncmhsgyabd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key
```

## Verification

### 1. Check Webhook Health

Test the webhook endpoint:

```bash
curl https://your-domain.com/api/webhooks/health
```

Expected response:
```json
{
  "success": true,
  "message": "Webhook service is healthy",
  "timestamp": "2025-07-05T13:50:44.626Z",
  "service": "supabase-webhooks"
}
```

### 2. Monitor Application Logs

Watch for webhook activity in your application logs:

```bash
# Look for these log entries
[Webhook] Supabase webhook received
[Handler] Processing database update
```

### 3. Test CSRF Protection

Verify that normal API endpoints still require CSRF tokens:

```bash
# This should still fail with CSRF error (expected)
curl -X POST https://your-domain.com/api/students \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

## Troubleshooting

### Issue: Still Getting CSRF Errors

**Solution**: Check if there are additional triggers making HTTP requests:

1. Run this query in Supabase SQL Editor:
```sql
SELECT schemaname, tablename, triggername, definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE definition ILIKE '%http%';
```

2. Disable problematic triggers:
```sql
DROP TRIGGER IF EXISTS trigger_name ON schema.table_name;
```

### Issue: Webhooks Not Working

**Solution**: 

1. Check webhook configuration:
```sql
SELECT * FROM webhook_config WHERE enabled = true;
```

2. Verify APP_DOMAIN is correct in `.env`
3. Check application logs for webhook errors

### Issue: Database Connection Errors

**Solution**: Verify environment variables:
- `DATABASE_URL` is correct
- `SUPABASE_SERVICE_KEY` is valid
- Network connectivity to Supabase

## Security Considerations

### Webhook Security

1. **Authentication**: Webhooks use service key authentication
2. **Endpoint Isolation**: Webhook endpoints are separate from user-facing APIs
3. **Logging**: All webhook activity is logged for monitoring
4. **Rate Limiting**: Consider adding rate limiting to webhook endpoints

### CSRF Protection Maintained

1. **Selective Bypass**: Only specific webhook endpoints bypass CSRF
2. **User APIs Protected**: All user-facing APIs still require CSRF tokens
3. **Session Security**: Session management remains unchanged

## Monitoring

### Log Monitoring

Watch for these log patterns:

```bash
# Successful webhook processing
[Webhook] Supabase webhook received
[Handler] Processing database update: lessons

# CSRF bypass working
[CSRF] Skipping CSRF validation for /api/webhooks/

# Potential issues
[Webhook] Unknown database event
[Handler] Webhook request failed
```

### Health Checks

Set up monitoring for:
- `/api/webhooks/health` endpoint
- Application error rates
- Database trigger execution

## Maintenance

### Regular Tasks

1. **Review Webhook Logs**: Check for unusual webhook activity
2. **Update URLs**: Update `APP_DOMAIN` when domain changes
3. **Monitor Performance**: Watch for webhook-related performance issues
4. **Security Audit**: Regularly review webhook configurations

### When Adding New Webhooks

1. Add configuration to `webhook_config` table
2. Create appropriate handler in `api/routes/webhooks.js`
3. Test with proper authentication
4. Monitor for CSRF issues

## Support

If you continue to experience CSRF issues after following this guide:

1. Check application logs for specific error details
2. Verify all environment variables are correct
3. Test webhook endpoints individually
4. Review Supabase dashboard for webhook configurations

The fix ensures that Supabase can communicate with your application while maintaining CSRF protection for user-facing endpoints.
