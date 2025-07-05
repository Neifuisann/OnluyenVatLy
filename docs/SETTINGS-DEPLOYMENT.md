# Student Settings Deployment Guide

This guide covers the deployment requirements for the OnluyenVatLy student settings functionality, including database setup, environment configuration, and troubleshooting.

## Overview

The student settings feature requires three new database tables and several API endpoints to manage student preferences, device management, and account deletion requests.

## Database Requirements

### Required Tables

The following tables must be created in your PostgreSQL database:

#### 1. student_settings
Stores individual student preferences and settings.

```sql
CREATE TABLE IF NOT EXISTS student_settings (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    settings JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id)
);

-- Index for fast student lookups
CREATE INDEX IF NOT EXISTS idx_student_settings_student_id ON student_settings(student_id);
```

#### 2. student_devices
Tracks devices used by students for authentication and security.

```sql
CREATE TABLE IF NOT EXISTS student_devices (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    device_fingerprint VARCHAR(255) NOT NULL,
    device_name VARCHAR(255),
    last_login TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_trusted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, device_fingerprint)
);

-- Indexes for device management
CREATE INDEX IF NOT EXISTS idx_student_devices_student_id ON student_devices(student_id);
CREATE INDEX IF NOT EXISTS idx_student_devices_fingerprint ON student_devices(device_fingerprint);
```

#### 3. account_deletion_requests
Manages student account deletion requests with admin approval workflow.

```sql
CREATE TABLE IF NOT EXISTS account_deletion_requests (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    reason TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE,
    processed_by INTEGER REFERENCES admins(id),
    admin_notes TEXT,
    UNIQUE(student_id, status)
);

-- Index for pending requests
CREATE INDEX IF NOT EXISTS idx_deletion_requests_status ON account_deletion_requests(status);
CREATE INDEX IF NOT EXISTS idx_deletion_requests_student_id ON account_deletion_requests(student_id);
```

### Database Setup Instructions

#### Option 1: Using the Verification Script (Recommended)

1. **Check database status:**
   ```bash
   node verify-settings-database.js
   ```
   This will report which tables exist and which are missing.

2. **Create missing tables automatically:**
   ```bash
   node verify-settings-database.js --create
   ```
   This will create any missing tables with proper schema and indexes.

#### Option 2: Manual SQL Execution

1. Connect to your Supabase database using the SQL Editor
2. Run each CREATE TABLE statement from the section above
3. Verify tables were created successfully

#### Option 3: Using Migration File

1. Locate the `database-schema-updates.sql` file
2. Execute it in your database:
   ```bash
   psql $DATABASE_URL < database-schema-updates.sql
   ```

## Environment Variables

Ensure the following environment variables are properly configured:

### Required Variables
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_KEY`: Your Supabase anon key
- `SESSION_SECRET`: Express session secret for security
- `NODE_ENV`: Set to 'production' for production deployment

### Optional Variables
- `STRICT_DEVICE_CHECK`: Enable strict device validation (default: false)
- `SESSION_TIMEOUT_HOURS`: Session timeout duration (default: 24)
- `MAX_DEVICES_PER_STUDENT`: Maximum devices per student (default: 3)

## Vercel Deployment

### vercel.json Configuration
Ensure your `vercel.json` includes the new API routes:

```json
{
  "rewrites": [
    { "source": "/api/settings/(.*)", "destination": "/api/routes/settings" },
    { "source": "/api/devices/(.*)", "destination": "/api/routes/devices" },
    { "source": "/api/deletion-requests/(.*)", "destination": "/api/routes/deletionRequests" }
  ]
}
```

### Environment Setup in Vercel
1. Go to your Vercel project settings
2. Navigate to Environment Variables
3. Add all required variables listed above
4. Redeploy the project

## Post-Deployment Verification

### 1. Database Verification
Run the verification script to ensure all tables exist:
```bash
node verify-settings-database.js
```

Expected output:
```
✓ Database connection successful
✓ Table 'student_settings' exists
✓ Table 'student_devices' exists
✓ Table 'account_deletion_requests' exists
✓ All required tables exist!
```

### 2. API Endpoint Testing
Test the following endpoints to ensure they're accessible:

```bash
# Check settings API (requires authentication)
curl -X GET https://your-domain.com/api/settings/

# Check devices API (requires authentication)
curl -X GET https://your-domain.com/api/devices/

# Check deletion requests API (admin only)
curl -X GET https://your-domain.com/api/deletion-requests/
```

### 3. Frontend Functionality
1. Log in as a student
2. Navigate to profile/settings page
3. Verify settings can be saved and loaded
4. Test device management features
5. Test account deletion request workflow

## Troubleshooting

### Common Issues and Solutions

#### 1. Tables Not Creating
**Error:** "permission denied to create table"
**Solution:** Ensure your database user has CREATE TABLE permissions

#### 2. Foreign Key Constraints
**Error:** "relation 'students' does not exist"
**Solution:** Ensure the students and admins tables exist before creating settings tables

#### 3. API Routes Not Found
**Error:** 404 on settings endpoints
**Solution:** 
- Check vercel.json rewrites configuration
- Verify route files exist in api/routes/
- Redeploy the application

#### 4. Database Connection Failed
**Error:** "Database connection failed"
**Solution:**
- Verify SUPABASE_URL and SUPABASE_KEY are correct
- Check network connectivity
- Ensure database is not in maintenance mode

#### 5. Settings Not Persisting
**Error:** Settings reset after page reload
**Solution:**
- Check browser console for API errors
- Verify student_settings table has proper permissions
- Check session authentication is working

### Debug Commands

```bash
# Check if tables exist in database
psql $DATABASE_URL -c "\dt student_*"

# View table structure
psql $DATABASE_URL -c "\d student_settings"

# Check for recent errors in logs
grep -i error logs/*.log | tail -20

# Test database connectivity
node -e "require('./api/services/databaseService').query('SELECT 1').then(() => console.log('DB OK')).catch(e => console.error('DB Error:', e.message))"
```

## Rollback Procedure

If issues occur after deployment:

### 1. Disable Features
Set environment variable to disable new features:
```bash
DISABLE_STUDENT_SETTINGS=true
```

### 2. Remove Tables (if needed)
```sql
-- Remove in reverse order due to foreign keys
DROP TABLE IF EXISTS account_deletion_requests;
DROP TABLE IF EXISTS student_devices;
DROP TABLE IF EXISTS student_settings;
```

### 3. Revert Code
```bash
git revert [commit-hash]
git push origin main
```

## Monitoring

### Key Metrics to Monitor
1. **Database Performance**
   - Query response times for settings operations
   - Table sizes and growth rate
   - Index usage statistics

2. **API Performance**
   - Settings API response times
   - Error rates on settings endpoints
   - Device validation success/failure rates

3. **User Activity**
   - Number of active settings users
   - Frequency of settings updates
   - Device management operations

### Alerts to Configure
- Database table size exceeding thresholds
- High error rates on settings APIs
- Unusual number of deletion requests
- Failed device validations spike

## Security Considerations

1. **Data Privacy**
   - Settings data is encrypted at rest in Supabase
   - Only authenticated users can access their own settings
   - Admin access is logged and audited

2. **Device Security**
   - Device fingerprints are hashed before storage
   - Maximum device limit prevents abuse
   - Trusted device feature for enhanced security

3. **Deletion Workflow**
   - Two-step approval process for account deletion
   - Audit trail for all deletion requests
   - Grace period before actual deletion

## Support and Maintenance

### Regular Maintenance Tasks
1. **Weekly**
   - Review pending deletion requests
   - Check for orphaned device records
   - Monitor settings table growth

2. **Monthly**
   - Analyze settings usage patterns
   - Review and optimize indexes
   - Clean up old device records

3. **Quarterly**
   - Database performance review
   - Security audit of settings data
   - User feedback analysis

### Contact Information
For deployment support or issues:
- Check application logs first
- Review this documentation
- Contact database administrator for permissions issues
- Submit issues to project repository

## Appendix: Complete SQL Schema

For reference, here's the complete SQL to create all required tables:

```sql
-- Complete schema for student settings functionality
BEGIN;

-- Student settings table
CREATE TABLE IF NOT EXISTS student_settings (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    settings JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id)
);

CREATE INDEX IF NOT EXISTS idx_student_settings_student_id ON student_settings(student_id);

-- Student devices table
CREATE TABLE IF NOT EXISTS student_devices (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    device_fingerprint VARCHAR(255) NOT NULL,
    device_name VARCHAR(255),
    last_login TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_trusted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, device_fingerprint)
);

CREATE INDEX IF NOT EXISTS idx_student_devices_student_id ON student_devices(student_id);
CREATE INDEX IF NOT EXISTS idx_student_devices_fingerprint ON student_devices(device_fingerprint);

-- Account deletion requests table
CREATE TABLE IF NOT EXISTS account_deletion_requests (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    reason TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE,
    processed_by INTEGER REFERENCES admins(id),
    admin_notes TEXT,
    UNIQUE(student_id, status)
);

CREATE INDEX IF NOT EXISTS idx_deletion_requests_status ON account_deletion_requests(status);
CREATE INDEX IF NOT EXISTS idx_deletion_requests_student_id ON account_deletion_requests(student_id);

COMMIT;
```

This completes the deployment documentation for the student settings functionality.