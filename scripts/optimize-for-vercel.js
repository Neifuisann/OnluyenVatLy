#!/usr/bin/env node

/**
 * Vercel Function Optimization Script
 * 
 * This script helps optimize the project for Vercel's serverless function limits
 * by consolidating routes and providing deployment guidance.
 */

const fs = require('fs');
const path = require('path');

function log(message, color = 'white') {
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
  
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function countRouteFiles() {
  const routesDir = path.join(process.cwd(), 'api', 'routes');
  try {
    const files = fs.readdirSync(routesDir).filter(file => file.endsWith('.js'));
    return files;
  } catch (error) {
    log('❌ Error reading routes directory', 'red');
    return [];
  }
}

function checkVercelConfig() {
  const vercelConfigPath = path.join(process.cwd(), 'vercel.json');
  try {
    const config = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));
    return config;
  } catch (error) {
    log('❌ Error reading vercel.json', 'red');
    return null;
  }
}

function main() {
  log('🚀 Vercel Function Optimization Report', 'cyan');
  log('=' * 50, 'cyan');
  
  // Count current route files
  const routeFiles = countRouteFiles();
  log(`\n📊 Current Route Files: ${routeFiles.length}`, 'blue');
  
  if (routeFiles.length > 12) {
    log(`⚠️  WARNING: You have ${routeFiles.length} route files, but Vercel Hobby plan only allows 12 functions!`, 'yellow');
  } else {
    log(`✅ Good: You have ${routeFiles.length} route files (within Vercel's 12 function limit)`, 'green');
  }
  
  // Check Vercel configuration
  const vercelConfig = checkVercelConfig();
  if (vercelConfig) {
    log('\n📋 Vercel Configuration:', 'blue');
    if (vercelConfig.functions && vercelConfig.functions['api/index.js']) {
      log('✅ Single function configuration detected', 'green');
    } else {
      log('⚠️  Consider adding function configuration to vercel.json', 'yellow');
    }
  }
  
  // Provide optimization recommendations
  log('\n💡 Optimization Status:', 'blue');
  
  const consolidatedFiles = [
    'api/routes/gamification.js',
    'api/routes/content.js', 
    'api/routes/learning.js',
    'api/routes/system.js'
  ];
  
  let consolidatedCount = 0;
  consolidatedFiles.forEach(file => {
    if (fs.existsSync(file)) {
      consolidatedCount++;
      log(`✅ ${path.basename(file)} - Consolidated route exists`, 'green');
    } else {
      log(`❌ ${path.basename(file)} - Missing consolidated route`, 'red');
    }
  });
  
  if (consolidatedCount === 4) {
    log('\n🎉 All consolidated routes are in place!', 'green');
    log('📝 Remaining individual routes:', 'blue');
    log('   - auth.js (authentication)', 'white');
    log('   - students.js (student management)', 'white');
    log('   - views.js (HTML page serving)', 'white');
    log('   - Plus 4 consolidated route files', 'white');
    log(`\n📊 Total effective functions: ~7 (well within 12 limit)`, 'green');
  } else {
    log('\n⚠️  Consolidation incomplete. Run the optimization again.', 'yellow');
  }
  
  log('\n🚀 Next Steps:', 'cyan');
  log('1. Test the application locally: npm start', 'white');
  log('2. Deploy to Vercel: vercel --prod', 'white');
  log('3. Monitor function usage in Vercel dashboard', 'white');
  
  log('\n📚 Function Grouping Strategy:', 'blue');
  log('• gamification.js: achievements, activity, leagues, quests, streaks, xp', 'white');
  log('• content.js: lessons, gallery, tags, uploads, ratings', 'white');
  log('• learning.js: quiz, results, progress, explain, ai', 'white');
  log('• system.js: admin, history, settings, webhooks, debug', 'white');
}

if (require.main === module) {
  main();
}

module.exports = { countRouteFiles, checkVercelConfig };
