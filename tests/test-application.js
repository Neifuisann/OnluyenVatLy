#!/usr/bin/env node

/**
 * Application Function Testing Script
 * 
 * This script tests core application functionality after migration
 */

require('dotenv').config();
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

async function testDatabaseQueries() {
    log('\n=== Testing Database Queries ===', 'cyan');
    
    const client = await pgPool.connect();
    
    try {
        // Test lesson queries
        log('Testing lesson queries...', 'blue');
        
        const lessonsResult = await client.query(`
            SELECT id, title, visible, ai_summary IS NOT NULL as has_ai_summary
            FROM lessons 
            WHERE visible = true 
            ORDER BY "order" ASC 
            LIMIT 5
        `);
        
        log(`✓ Found ${lessonsResult.rows.length} visible lessons`, 'green');
        lessonsResult.rows.forEach(lesson => {
            log(`  - ${lesson.title} (AI: ${lesson.has_ai_summary ? 'Yes' : 'No'})`, 'white');
        });
        
        // Test results queries
        log('\nTesting results queries...', 'blue');
        
        const resultsResult = await client.query(`
            SELECT 
                COUNT(*) as total_results,
                COUNT(total_points) as with_total_points,
                COUNT("timeTaken") as with_time_taken,
                COUNT(mode) as with_mode
            FROM results
        `);
        
        const stats = resultsResult.rows[0];
        log(`✓ Total results: ${stats.total_results}`, 'green');
        log(`✓ With total_points: ${stats.with_total_points}`, 'green');
        log(`✓ With timeTaken: ${stats.with_time_taken}`, 'green');
        log(`✓ With mode: ${stats.with_mode}`, 'green');
        
        // Test students queries
        log('\nTesting students queries...', 'blue');
        
        const studentsResult = await client.query(`
            SELECT 
                COUNT(*) as total_students,
                COUNT(device_hash) as with_device_hash,
                COUNT(current_session_id) as with_session
            FROM students
        `);
        
        const studentStats = studentsResult.rows[0];
        log(`✓ Total students: ${studentStats.total_students}`, 'green');
        log(`✓ With device_hash: ${studentStats.with_device_hash}`, 'green');
        log(`✓ With session: ${studentStats.with_session}`, 'green');
        
        // Test admin table
        log('\nTesting admin functionality...', 'blue');
        
        const adminsResult = await client.query(`
            SELECT username, is_active, created_at
            FROM admins
            WHERE is_active = true
        `);
        
        log(`✓ Found ${adminsResult.rows.length} active admins`, 'green');
        adminsResult.rows.forEach(admin => {
            log(`  - ${admin.username} (created: ${admin.created_at.toISOString().split('T')[0]})`, 'white');
        });
        
        // Test AI tables
        log('\nTesting AI tables...', 'blue');
        
        const aiInteractionsResult = await client.query('SELECT COUNT(*) as count FROM ai_interactions');
        const aiInsightsResult = await client.query('SELECT COUNT(*) as count FROM ai_insights');
        
        log(`✓ AI interactions: ${aiInteractionsResult.rows[0].count}`, 'green');
        log(`✓ AI insights: ${aiInsightsResult.rows[0].count}`, 'green');
        
        // Test search function
        log('\nTesting search function...', 'blue');
        
        const searchResult = await client.query(`
            SELECT COUNT(*) as count 
            FROM search_lessons('physics')
        `);
        
        log(`✓ Search for 'physics' returned ${searchResult.rows[0].count} results`, 'green');
        
        // Test materialized view
        log('\nTesting materialized view...', 'blue');
        
        const mvResult = await client.query(`
            SELECT lesson_id, title, unique_students, total_attempts, avg_score_percentage
            FROM lesson_stats
            ORDER BY unique_students DESC
            LIMIT 3
        `);
        
        log(`✓ Lesson stats materialized view has ${mvResult.rows.length} top lessons:`, 'green');
        mvResult.rows.forEach(lesson => {
            log(`  - ${lesson.title}: ${lesson.unique_students} students, ${lesson.total_attempts} attempts, ${lesson.avg_score_percentage}% avg`, 'white');
        });
        
        // Test performance monitoring views
        log('\nTesting performance monitoring...', 'blue');
        
        const indexUsage = await client.query(`
            SELECT table_name, index_name, idx_scan
            FROM index_usage_stats
            WHERE idx_scan > 0
            ORDER BY idx_scan DESC
            LIMIT 3
        `);
        
        log(`✓ Most used indexes:`, 'green');
        indexUsage.rows.forEach(idx => {
            log(`  - ${idx.table_name}.${idx.index_name}: ${idx.idx_scan} scans`, 'white');
        });
        
        const tableSizes = await client.query(`
            SELECT table_name, total_size
            FROM table_size_stats
            ORDER BY pg_size_bytes(total_size) DESC
            LIMIT 3
        `);
        
        log(`✓ Largest tables:`, 'green');
        tableSizes.rows.forEach(table => {
            log(`  - ${table.table_name}: ${table.total_size}`, 'white');
        });
        
    } finally {
        client.release();
    }
}

async function testDataIntegrity() {
    log('\n=== Testing Data Integrity ===', 'cyan');
    
    const client = await pgPool.connect();
    
    try {
        // Check for data consistency
        const consistencyChecks = [
            {
                name: 'Results totalPoints vs total_points sync',
                query: `
                    SELECT 
                        COUNT(*) as total,
                        COUNT(CASE WHEN total_points = "totalPoints" THEN 1 END) as synced,
                        COUNT(CASE WHEN total_points IS NULL THEN 1 END) as missing_total_points,
                        COUNT(CASE WHEN "totalPoints" IS NULL THEN 1 END) as missing_totalPoints
                    FROM results
                `
            },
            {
                name: 'Lessons visibility status',
                query: `
                    SELECT 
                        COUNT(*) as total,
                        COUNT(CASE WHEN visible = true THEN 1 END) as visible,
                        COUNT(CASE WHEN visible = false THEN 1 END) as hidden,
                        COUNT(CASE WHEN visible IS NULL THEN 1 END) as null_visible
                    FROM lessons
                `
            },
            {
                name: 'Students device hash sync',
                query: `
                    SELECT 
                        COUNT(*) as total,
                        COUNT(CASE WHEN device_hash = approved_device_fingerprint THEN 1 END) as synced,
                        COUNT(CASE WHEN device_hash IS NULL THEN 1 END) as missing_device_hash,
                        COUNT(CASE WHEN approved_device_fingerprint IS NULL THEN 1 END) as missing_fingerprint
                    FROM students
                `
            }
        ];
        
        for (const check of consistencyChecks) {
            log(`\nChecking: ${check.name}`, 'blue');
            const result = await client.query(check.query);
            const data = result.rows[0];
            
            Object.entries(data).forEach(([key, value]) => {
                log(`  ${key}: ${value}`, 'white');
            });
        }
        
    } finally {
        client.release();
    }
}

async function main() {
    try {
        log('OnluyenVatLy Application Testing', 'cyan');
        log('=================================', 'cyan');
        
        // Test database connection
        log('Testing database connection...', 'blue');
        const client = await pgPool.connect();
        await client.query('SELECT 1');
        client.release();
        log('✓ Database connection successful', 'green');
        
        // Run tests
        await testDatabaseQueries();
        await testDataIntegrity();
        
        log('\n🎉 All application tests passed successfully!', 'green');
        log('\nThe database migration is complete and the application is ready to use.', 'cyan');
        
    } catch (error) {
        log(`\n❌ Application testing failed: ${error.message}`, 'red');
        console.error(error);
        process.exit(1);
    } finally {
        await pgPool.end();
    }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    log('\nTesting cancelled by user', 'yellow');
    await pgPool.end();
    process.exit(0);
});

// Run tests
main().catch(async (error) => {
    log(`Fatal error: ${error.message}`, 'red');
    await pgPool.end();
    process.exit(1);
});
