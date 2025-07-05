#!/usr/bin/env node

/**
 * Comprehensive Database Migration Validation Script
 * 
 * This script validates that all database migrations were successful
 * and tests core application functionality.
 */

require('dotenv').config();
const { pgPool } = require('../api/config/database');
const databaseService = require('../api/services/databaseService');

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

class MigrationValidator {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.successes = [];
    }

    addError(message) {
        this.errors.push(message);
        log(`✗ ERROR: ${message}`, 'red');
    }

    addWarning(message) {
        this.warnings.push(message);
        log(`⚠ WARNING: ${message}`, 'yellow');
    }

    addSuccess(message) {
        this.successes.push(message);
        log(`✓ ${message}`, 'green');
    }

    async validateTableExists(tableName) {
        try {
            const client = await pgPool.connect();
            const result = await client.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = $1
                )
            `, [tableName]);
            client.release();

            if (result.rows[0].exists) {
                this.addSuccess(`Table '${tableName}' exists`);
                return true;
            } else {
                this.addError(`Table '${tableName}' does not exist`);
                return false;
            }
        } catch (error) {
            this.addError(`Failed to check table '${tableName}': ${error.message}`);
            return false;
        }
    }

    async validateColumnExists(tableName, columnName) {
        try {
            const client = await pgPool.connect();
            const result = await client.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.columns 
                    WHERE table_schema = 'public' 
                    AND table_name = $1 
                    AND column_name = $2
                )
            `, [tableName, columnName]);
            client.release();

            if (result.rows[0].exists) {
                this.addSuccess(`Column '${tableName}.${columnName}' exists`);
                return true;
            } else {
                this.addError(`Column '${tableName}.${columnName}' does not exist`);
                return false;
            }
        } catch (error) {
            this.addError(`Failed to check column '${tableName}.${columnName}': ${error.message}`);
            return false;
        }
    }

    async validateIndexExists(indexName) {
        try {
            const client = await pgPool.connect();
            const result = await client.query(`
                SELECT EXISTS (
                    SELECT FROM pg_indexes 
                    WHERE schemaname = 'public' 
                    AND indexname = $1
                )
            `, [indexName]);
            client.release();

            if (result.rows[0].exists) {
                this.addSuccess(`Index '${indexName}' exists`);
                return true;
            } else {
                this.addError(`Index '${indexName}' does not exist`);
                return false;
            }
        } catch (error) {
            this.addError(`Failed to check index '${indexName}': ${error.message}`);
            return false;
        }
    }

    async validateFunctionExists(functionName) {
        try {
            const client = await pgPool.connect();
            const result = await client.query(`
                SELECT EXISTS (
                    SELECT FROM pg_proc p
                    JOIN pg_namespace n ON p.pronamespace = n.oid
                    WHERE n.nspname = 'public' 
                    AND p.proname = $1
                )
            `, [functionName]);
            client.release();

            if (result.rows[0].exists) {
                this.addSuccess(`Function '${functionName}' exists`);
                return true;
            } else {
                this.addError(`Function '${functionName}' does not exist`);
                return false;
            }
        } catch (error) {
            this.addError(`Failed to check function '${functionName}': ${error.message}`);
            return false;
        }
    }

    async validateDataIntegrity() {
        try {
            const client = await pgPool.connect();
            
            // Check that data was migrated correctly
            const totalPointsSync = await client.query(`
                SELECT COUNT(*) as count 
                FROM results 
                WHERE total_points IS NOT NULL AND "totalPoints" IS NOT NULL
                AND total_points = "totalPoints"
            `);
            
            const visibleLessons = await client.query(`
                SELECT COUNT(*) as count 
                FROM lessons 
                WHERE visible = true
            `);
            
            const deviceHashSync = await client.query(`
                SELECT COUNT(*) as count 
                FROM students 
                WHERE device_hash IS NOT NULL AND approved_device_fingerprint IS NOT NULL
                AND device_hash = approved_device_fingerprint
            `);
            
            client.release();
            
            this.addSuccess(`${totalPointsSync.rows[0].count} results have synced total_points`);
            this.addSuccess(`${visibleLessons.rows[0].count} lessons are marked as visible`);
            this.addSuccess(`${deviceHashSync.rows[0].count} students have synced device_hash`);
            
        } catch (error) {
            this.addError(`Data integrity validation failed: ${error.message}`);
        }
    }

    async testApplicationFunctions() {
        try {
            // Test database service functions
            log('Testing application functions...', 'blue');
            
            // Test lesson retrieval
            const lessons = await databaseService.getLessons({ page: 1, limit: 5 });
            if (lessons && lessons.lessons && lessons.lessons.length > 0) {
                this.addSuccess(`Lesson retrieval works (${lessons.lessons.length} lessons found)`);
            } else {
                this.addWarning('No lessons found or lesson retrieval failed');
            }
            
            // Test student retrieval
            const students = await databaseService.getStudents({ limit: 5 });
            if (students && students.length > 0) {
                this.addSuccess(`Student retrieval works (${students.length} students found)`);
            } else {
                this.addWarning('No students found or student retrieval failed');
            }
            
            // Test search function
            try {
                const client = await pgPool.connect();
                const searchResult = await client.query('SELECT * FROM search_lessons($1) LIMIT 1', ['physics']);
                client.release();
                this.addSuccess('search_lessons function works correctly');
            } catch (error) {
                this.addError(`search_lessons function failed: ${error.message}`);
            }
            
        } catch (error) {
            this.addError(`Application function testing failed: ${error.message}`);
        }
    }

    async validatePerformance() {
        try {
            log('Testing performance...', 'blue');
            
            const client = await pgPool.connect();
            
            // Test materialized view
            const start = Date.now();
            const mvResult = await client.query('SELECT COUNT(*) FROM lesson_stats');
            const mvTime = Date.now() - start;
            
            this.addSuccess(`Materialized view query completed in ${mvTime}ms (${mvResult.rows[0].count} records)`);
            
            // Test index usage
            const indexStats = await client.query('SELECT * FROM index_usage_stats LIMIT 5');
            this.addSuccess(`Index usage stats available (${indexStats.rows.length} indexes monitored)`);
            
            // Test table sizes
            const tableStats = await client.query('SELECT * FROM table_size_stats LIMIT 5');
            this.addSuccess(`Table size stats available (${tableStats.rows.length} tables monitored)`);
            
            client.release();
            
        } catch (error) {
            this.addError(`Performance testing failed: ${error.message}`);
        }
    }

    async runValidation() {
        log('\n=== OnluyenVatLy Migration Validation ===', 'cyan');
        log('=========================================', 'cyan');
        
        try {
            // Phase 1 Validation: Critical Schema Fixes
            log('\n--- Phase 1: Critical Schema Fixes ---', 'blue');
            
            // Validate new columns
            await this.validateColumnExists('lessons', 'visible');
            await this.validateColumnExists('lessons', 'ai_summary');
            await this.validateColumnExists('results', 'total_points');
            await this.validateColumnExists('results', 'timeTaken');
            await this.validateColumnExists('results', 'mode');
            await this.validateColumnExists('students', 'device_hash');
            
            // Validate search function
            await this.validateFunctionExists('search_lessons');
            
            // Phase 2 Validation: Missing Tables
            log('\n--- Phase 2: Missing Tables ---', 'blue');
            
            await this.validateTableExists('admins');
            await this.validateTableExists('ai_interactions');
            await this.validateTableExists('ai_insights');
            
            // Phase 3 Validation: Index Optimization
            log('\n--- Phase 3: Index Optimization ---', 'blue');
            
            await this.validateIndexExists('idx_lessons_visible');
            await this.validateIndexExists('idx_results_total_points');
            await this.validateIndexExists('idx_results_mode');
            await this.validateIndexExists('idx_students_session_device');
            
            // Data Integrity Validation
            log('\n--- Data Integrity ---', 'blue');
            await this.validateDataIntegrity();
            
            // Application Function Testing
            log('\n--- Application Functions ---', 'blue');
            await this.testApplicationFunctions();
            
            // Performance Testing
            log('\n--- Performance Testing ---', 'blue');
            await this.validatePerformance();
            
        } catch (error) {
            this.addError(`Validation failed: ${error.message}`);
        }
    }

    printSummary() {
        log('\n=== Validation Summary ===', 'cyan');
        log(`✓ Successes: ${this.successes.length}`, 'green');
        log(`⚠ Warnings: ${this.warnings.length}`, 'yellow');
        log(`✗ Errors: ${this.errors.length}`, 'red');
        
        if (this.errors.length === 0) {
            log('\n🎉 All validations passed! Migration was successful!', 'green');
            return true;
        } else {
            log('\n❌ Migration validation failed. Please review errors above.', 'red');
            return false;
        }
    }
}

async function main() {
    const validator = new MigrationValidator();
    
    try {
        // Test database connection
        log('Testing database connection...', 'blue');
        const client = await pgPool.connect();
        await client.query('SELECT 1');
        client.release();
        validator.addSuccess('Database connection successful');
        
        // Run validation
        await validator.runValidation();
        
    } catch (error) {
        validator.addError(`Database connection failed: ${error.message}`);
    } finally {
        // Print summary and close pool
        const success = validator.printSummary();
        await pgPool.end();
        
        process.exit(success ? 0 : 1);
    }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    log('\nValidation cancelled by user', 'yellow');
    await pgPool.end();
    process.exit(0);
});

// Run validation
main().catch(async (error) => {
    log(`Fatal error: ${error.message}`, 'red');
    await pgPool.end();
    process.exit(1);
});
