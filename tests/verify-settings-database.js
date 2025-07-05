#!/usr/bin/env node

/**
 * Database Verification and Setup Script for OnluyenVatLy Student Settings
 * 
 * This script verifies that all required database tables exist and optionally
 * creates missing tables for the student settings functionality.
 * 
 * Usage:
 *   node verify-settings-database.js          # Check only
 *   node verify-settings-database.js --create # Check and create missing tables
 */

const databaseService = require('../api/services/databaseService');
const fs = require('fs').promises;
const path = require('path');

// Required tables for student settings functionality
const REQUIRED_TABLES = [
    'student_settings',
    'student_devices',
    'account_deletion_requests'
];

// Table creation SQL statements
const TABLE_SCHEMAS = {
    student_settings: `
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
    `,
    
    student_devices: `
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
    `,
    
    account_deletion_requests: `
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
    `
};

// Color codes for console output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function checkTableExists(tableName) {
    try {
        const result = await databaseService.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = $1
            );
        `, [tableName]);
        
        return result.rows[0].exists;
    } catch (error) {
        log(`Error checking table ${tableName}: ${error.message}`, 'red');
        return false;
    }
}

async function createTable(tableName) {
    if (!TABLE_SCHEMAS[tableName]) {
        log(`No schema found for table: ${tableName}`, 'red');
        return false;
    }
    
    try {
        await databaseService.query(TABLE_SCHEMAS[tableName]);
        log(`✓ Created table: ${tableName}`, 'green');
        return true;
    } catch (error) {
        log(`✗ Failed to create table ${tableName}: ${error.message}`, 'red');
        return false;
    }
}

async function verifyDatabase() {
    log('\n=== OnluyenVatLy Database Verification ===\n', 'cyan');
    
    const shouldCreate = process.argv.includes('--create');
    
    try {
        // Test database connection
        log('Testing database connection...', 'blue');
        await databaseService.query('SELECT 1');
        log('✓ Database connection successful\n', 'green');
        
        // Check each required table
        log('Checking required tables:', 'blue');
        const missingTables = [];
        
        for (const tableName of REQUIRED_TABLES) {
            const exists = await checkTableExists(tableName);
            
            if (exists) {
                log(`✓ Table '${tableName}' exists`, 'green');
            } else {
                log(`✗ Table '${tableName}' is missing`, 'red');
                missingTables.push(tableName);
            }
        }
        
        // Summary
        log('\n=== Verification Summary ===', 'cyan');
        
        if (missingTables.length === 0) {
            log('✓ All required tables exist!', 'green');
            log('\nThe database is properly configured for student settings.', 'green');
        } else {
            log(`✗ Missing ${missingTables.length} table(s): ${missingTables.join(', ')}`, 'red');
            
            if (shouldCreate) {
                log('\nAttempting to create missing tables...', 'yellow');
                
                let createdCount = 0;
                for (const tableName of missingTables) {
                    const success = await createTable(tableName);
                    if (success) createdCount++;
                }
                
                log(`\n✓ Created ${createdCount} of ${missingTables.length} missing tables`, 
                    createdCount === missingTables.length ? 'green' : 'yellow');
                
                if (createdCount < missingTables.length) {
                    log('\nSome tables could not be created. Please check the error messages above.', 'red');
                    log('You may need to run the SQL manually or check database permissions.', 'yellow');
                }
            } else {
                log('\nTo create missing tables, run:', 'yellow');
                log('  node verify-settings-database.js --create', 'cyan');
                log('\nOr manually run the SQL from database-schema-updates.sql', 'yellow');
            }
        }
        
        // Additional checks
        log('\n=== Additional Checks ===', 'cyan');
        
        // Check if students table exists (dependency)
        const studentsExists = await checkTableExists('students');
        if (!studentsExists) {
            log('✗ Warning: \'students\' table not found. This is a required dependency!', 'red');
        } else {
            log('✓ Dependency table \'students\' exists', 'green');
        }
        
        // Check if admins table exists (for deletion requests)
        const adminsExists = await checkTableExists('admins');
        if (!adminsExists) {
            log('✗ Warning: \'admins\' table not found. This is required for deletion request processing!', 'red');
        } else {
            log('✓ Dependency table \'admins\' exists', 'green');
        }
        
    } catch (error) {
        log(`\n✗ Database verification failed: ${error.message}`, 'red');
        log('\nPlease check:', 'yellow');
        log('1. Database connection settings (SUPABASE_URL, SUPABASE_KEY)', 'yellow');
        log('2. Network connectivity', 'yellow');
        log('3. Database permissions', 'yellow');
        process.exit(1);
    }
}

// Run verification
verifyDatabase()
    .then(() => {
        log('\n=== Verification Complete ===\n', 'cyan');
        process.exit(0);
    })
    .catch(error => {
        log(`\nUnexpected error: ${error.message}`, 'red');
        process.exit(1);
    });