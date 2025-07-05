#!/usr/bin/env node

/**
 * Database Migration Runner for OnluyenVatLy
 * 
 * This script safely executes database migration files using the existing
 * database connection configuration.
 */

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const { pgPool } = require('../api/config/database');

// ANSI color codes for console output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
};

function log(message, color = 'white') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function runMigration(migrationFile) {
    const migrationPath = path.join(__dirname, '..', 'database-migrations', migrationFile);
    
    try {
        log(`\n=== Running Migration: ${migrationFile} ===`, 'cyan');
        
        // Check if migration file exists
        try {
            await fs.access(migrationPath);
        } catch (error) {
            throw new Error(`Migration file not found: ${migrationPath}`);
        }
        
        // Read migration SQL
        const migrationSQL = await fs.readFile(migrationPath, 'utf8');
        log(`Migration file loaded: ${migrationPath}`, 'blue');
        
        // Get database client
        const client = await pgPool.connect();
        
        try {
            log('Executing migration...', 'yellow');
            
            // Execute migration
            const result = await client.query(migrationSQL);
            
            log('✓ Migration executed successfully!', 'green');
            
            // Log any notices from PostgreSQL
            if (client.notices && client.notices.length > 0) {
                log('\nDatabase notices:', 'blue');
                client.notices.forEach(notice => {
                    log(`  ${notice.message}`, 'white');
                });
            }
            
            return true;
            
        } finally {
            client.release();
        }
        
    } catch (error) {
        log(`✗ Migration failed: ${error.message}`, 'red');
        
        if (error.detail) {
            log(`Detail: ${error.detail}`, 'red');
        }
        
        if (error.hint) {
            log(`Hint: ${error.hint}`, 'yellow');
        }
        
        throw error;
    }
}

async function validateDatabase() {
    log('\n=== Pre-Migration Database Validation ===', 'cyan');
    
    const client = await pgPool.connect();
    
    try {
        // Check table counts
        const tables = ['students', 'lessons', 'results'];
        
        for (const table of tables) {
            const result = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
            const count = result.rows[0].count;
            log(`${table}: ${count} records`, 'white');
        }
        
        // Check if critical columns exist
        const columnChecks = [
            { table: 'lessons', column: 'visible' },
            { table: 'results', column: 'total_points' },
            { table: 'students', column: 'device_hash' }
        ];
        
        log('\nChecking for missing columns:', 'blue');
        
        for (const check of columnChecks) {
            const result = await client.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = $1 AND column_name = $2
            `, [check.table, check.column]);
            
            const exists = result.rows.length > 0;
            const status = exists ? '✓ EXISTS' : '✗ MISSING';
            const color = exists ? 'green' : 'red';
            
            log(`  ${check.table}.${check.column}: ${status}`, color);
        }
        
    } finally {
        client.release();
    }
}

async function main() {
    const migrationFile = process.argv[2];
    
    if (!migrationFile) {
        log('Usage: node run-migration.js <migration-file>', 'yellow');
        log('Example: node run-migration.js 001-critical-schema-fixes.sql', 'yellow');
        process.exit(1);
    }
    
    try {
        log('OnluyenVatLy Database Migration Runner', 'cyan');
        log('=====================================', 'cyan');
        
        // Validate database connection
        log('Testing database connection...', 'blue');
        const client = await pgPool.connect();
        await client.query('SELECT 1');
        client.release();
        log('✓ Database connection successful', 'green');
        
        // Run pre-migration validation
        await validateDatabase();
        
        // Confirm before proceeding
        log('\nReady to run migration. Press Ctrl+C to cancel, or any key to continue...', 'yellow');
        
        // Run migration
        await runMigration(migrationFile);
        
        // Run post-migration validation
        log('\n=== Post-Migration Validation ===', 'cyan');
        await validateDatabase();
        
        log('\n✓ Migration completed successfully!', 'green');
        
    } catch (error) {
        log(`\n✗ Migration failed: ${error.message}`, 'red');
        process.exit(1);
    } finally {
        // Close database pool
        await pgPool.end();
    }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    log('\nMigration cancelled by user', 'yellow');
    await pgPool.end();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    log('\nMigration terminated', 'yellow');
    await pgPool.end();
    process.exit(0);
});

// Run the migration
main().catch(async (error) => {
    log(`Fatal error: ${error.message}`, 'red');
    await pgPool.end();
    process.exit(1);
});
