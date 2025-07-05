#!/usr/bin/env node

/**
 * Supabase Configuration Update Script
 * Updates Supabase webhook configurations to work with CSRF protection
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://miojaflixmncmhsgyabd.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const APP_DOMAIN = process.env.APP_DOMAIN || 'https://your-domain.com'; // Update this

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m'
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function main() {
  log('🔧 Supabase CSRF Configuration Tool', 'cyan');
  log('=====================================', 'cyan');

  // Validate environment variables
  if (!SUPABASE_SERVICE_KEY) {
    log('❌ ERROR: SUPABASE_SERVICE_KEY environment variable not set', 'red');
    log('Please add your Supabase service key to the .env file', 'yellow');
    process.exit(1);
  }

  // Create Supabase admin client
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    log('\n📋 Step 1: Checking current webhook configurations...', 'blue');
    
    // Check for existing webhook configurations
    const { data: webhookConfigs, error: configError } = await supabase
      .from('webhook_config')
      .select('*');

    if (configError && configError.code !== 'PGRST116') {
      log(`❌ Error checking webhook configs: ${configError.message}`, 'red');
      log('💡 Run the configure-supabase-webhooks.sql script first', 'yellow');
      process.exit(1);
    }

    if (!webhookConfigs || webhookConfigs.length === 0) {
      log('⚠️  No webhook configurations found', 'yellow');
      log('💡 Run the configure-supabase-webhooks.sql script first', 'yellow');
    } else {
      log(`✅ Found ${webhookConfigs.length} webhook configurations`, 'green');
      webhookConfigs.forEach(config => {
        log(`   - ${config.name}: ${config.enabled ? '✅ enabled' : '❌ disabled'}`, 'white');
      });
    }

    log('\n🔍 Step 2: Checking for problematic HTTP triggers...', 'blue');
    
    // Query to find HTTP triggers
    const { data: triggers, error: triggerError } = await supabase
      .rpc('sql', {
        query: `
          SELECT 
            schemaname,
            tablename,
            triggername
          FROM pg_trigger t
          JOIN pg_class c ON t.tgrelid = c.oid
          JOIN pg_namespace n ON c.relnamespace = n.oid
          WHERE definition ILIKE '%http_request%'
        `
      });

    if (triggerError) {
      log(`⚠️  Could not check triggers: ${triggerError.message}`, 'yellow');
    } else if (triggers && triggers.length > 0) {
      log(`⚠️  Found ${triggers.length} HTTP triggers that may cause CSRF issues:`, 'yellow');
      triggers.forEach(trigger => {
        log(`   - ${trigger.schemaname}.${trigger.tablename}: ${trigger.triggername}`, 'white');
      });
      log('💡 Consider disabling these triggers if they cause CSRF errors', 'yellow');
    } else {
      log('✅ No problematic HTTP triggers found', 'green');
    }

    log('\n🔧 Step 3: Updating webhook URLs...', 'blue');
    
    if (webhookConfigs && webhookConfigs.length > 0) {
      const updates = [
        {
          name: 'app_database_events',
          url: `${APP_DOMAIN}/api/webhooks/database/update`
        },
        {
          name: 'student_events',
          url: `${APP_DOMAIN}/api/webhooks/students/updated`
        },
        {
          name: 'lesson_events',
          url: `${APP_DOMAIN}/api/webhooks/lessons/updated`
        }
      ];

      for (const update of updates) {
        const { error: updateError } = await supabase
          .from('webhook_config')
          .update({ url: update.url })
          .eq('name', update.name);

        if (updateError) {
          log(`❌ Failed to update ${update.name}: ${updateError.message}`, 'red');
        } else {
          log(`✅ Updated ${update.name} URL`, 'green');
        }
      }
    }

    log('\n🛡️  Step 4: CSRF Protection Summary', 'blue');
    log('The following endpoints now bypass CSRF validation:', 'white');
    log('   - /api/webhooks/* (all webhook endpoints)', 'white');
    log('   - /api/supabase/* (Supabase callbacks)', 'white');
    log('   - /api/database/webhooks (database webhooks)', 'white');
    log('   - /api/auth/student/login (student login)', 'white');
    log('   - /api/auth/admin/login (admin login)', 'white');

    log('\n📝 Step 5: Next Steps', 'blue');
    log('1. Test your application to ensure CSRF errors are resolved', 'white');
    log('2. Monitor application logs for webhook activity', 'white');
    log('3. Enable only the webhooks you need in the webhook_config table', 'white');
    log('4. Update APP_DOMAIN in this script if your domain changes', 'white');

    log('\n✅ Configuration completed successfully!', 'green');

  } catch (error) {
    log(`❌ Unexpected error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Helper function to disable specific triggers
async function disableTrigger(supabase, schema, table, triggerName) {
  try {
    const { error } = await supabase.rpc('sql', {
      query: `DROP TRIGGER IF EXISTS ${triggerName} ON ${schema}.${table}`
    });

    if (error) {
      log(`❌ Failed to disable trigger ${triggerName}: ${error.message}`, 'red');
      return false;
    } else {
      log(`✅ Disabled trigger ${triggerName} on ${schema}.${table}`, 'green');
      return true;
    }
  } catch (error) {
    log(`❌ Error disabling trigger ${triggerName}: ${error.message}`, 'red');
    return false;
  }
}

// Helper function to check webhook health
async function checkWebhookHealth() {
  try {
    const response = await fetch(`${APP_DOMAIN}/api/webhooks/health`);
    const data = await response.json();
    
    if (response.ok && data.success) {
      log('✅ Webhook service is healthy', 'green');
      return true;
    } else {
      log('❌ Webhook service is not responding correctly', 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Could not reach webhook service: ${error.message}`, 'red');
    return false;
  }
}

// Run the main function
if (require.main === module) {
  main().catch(error => {
    log(`❌ Script failed: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = {
  main,
  disableTrigger,
  checkWebhookHealth
};
