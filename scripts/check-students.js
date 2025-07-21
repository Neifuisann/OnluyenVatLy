#!/usr/bin/env node

/**
 * Check Students in Supabase Database
 * This script checks what students exist in the Supabase database
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://miojaflixmncmhsgyabd.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m'
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function main() {
  log('🔍 Checking Students in Supabase Database', 'cyan');
  log('==========================================', 'cyan');

  // Validate environment variables
  if (!SUPABASE_SERVICE_KEY) {
    log('❌ ERROR: SUPABASE_SERVICE_KEY environment variable not set', 'red');
    log('Please add your Supabase service key to the .env file', 'yellow');
    process.exit(1);
  }

  // Create Supabase admin client
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    log('\n📊 Step 1: Checking students table...', 'blue');
    
    // Get all students
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false });

    if (studentsError) {
      log(`❌ Error querying students table: ${studentsError.message}`, 'red');
      
      // Check if table exists
      if (studentsError.code === 'PGRST116' || studentsError.message.includes('relation "students" does not exist')) {
        log('💡 The students table does not exist in the database', 'yellow');
        log('You may need to run database migrations to create the table', 'yellow');
      }
      
      process.exit(1);
    }

    if (!students || students.length === 0) {
      log('⚠️  No students found in the database', 'yellow');
      log('The students table exists but is empty', 'white');
      
      // Check table structure
      log('\n🔧 Step 2: Checking table structure...', 'blue');
      const { data: tableInfo, error: tableError } = await supabase
        .rpc('get_table_columns', { table_name: 'students' });
      
      if (tableError) {
        log('Could not check table structure', 'yellow');
      } else if (tableInfo) {
        log('✅ Students table structure exists', 'green');
      }
      
    } else {
      log(`✅ Found ${students.length} students in the database`, 'green');
      
      log('\n📋 Student List:', 'blue');
      students.forEach((student, index) => {
        log(`${index + 1}. ID: ${student.id}`, 'white');
        log(`   Name: ${student.full_name || 'N/A'}`, 'white');
        log(`   Phone: ${student.phone_number || 'N/A'}`, 'white');
        log(`   Approved: ${student.is_approved ? '✅ Yes' : '❌ No'}`, student.is_approved ? 'green' : 'yellow');
        log(`   Created: ${student.created_at || 'N/A'}`, 'white');
        log('', 'white');
      });
    }

    log('\n🔍 Step 3: Checking for specific phone number...', 'blue');
    const testPhone = '0375931007'; // The phone number from the login attempt
    
    const { data: specificStudent, error: specificError } = await supabase
      .from('students')
      .select('*')
      .eq('phone_number', testPhone)
      .maybeSingle();

    if (specificError) {
      log(`❌ Error searching for phone ${testPhone}: ${specificError.message}`, 'red');
    } else if (specificStudent) {
      log(`✅ Found student with phone ${testPhone}:`, 'green');
      log(`   ID: ${specificStudent.id}`, 'white');
      log(`   Name: ${specificStudent.full_name}`, 'white');
      log(`   Approved: ${specificStudent.is_approved ? '✅ Yes' : '❌ No'}`, 'white');
    } else {
      log(`❌ No student found with phone number ${testPhone}`, 'red');
    }

    log('\n📊 Step 4: Database Statistics', 'blue');
    
    // Check other tables
    const tables = ['lessons', 'results', 'ratings'];
    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          log(`   ${table}: ❌ Error (${error.message})`, 'red');
        } else {
          log(`   ${table}: ${count || 0} records`, 'white');
        }
      } catch (e) {
        log(`   ${table}: ❌ Error checking`, 'red');
      }
    }

    log('\n💡 Recommendations:', 'cyan');
    
    if (!students || students.length === 0) {
      log('1. Create test student accounts using the registration endpoint', 'white');
      log('2. Or manually insert student data into the Supabase database', 'white');
      log('3. Make sure to set is_approved = true for students to be able to login', 'white');
      log('4. Ensure password_hash is properly bcrypt hashed', 'white');
    } else {
      log('1. Students exist in the database', 'white');
      log('2. Make sure the phone number format matches exactly', 'white');
      log('3. Check that students have is_approved = true', 'white');
      log('4. Verify password hashes are correct', 'white');
    }

    log('\n✅ Database check completed!', 'green');

  } catch (error) {
    log(`❌ Unexpected error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Run the main function
if (require.main === module) {
  main().catch(error => {
    log(`❌ Script failed: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { main };
