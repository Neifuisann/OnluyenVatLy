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
  // Count files in api/ directory (these become Vercel functions)
  const apiDir = path.join(process.cwd(), 'api');
  try {
    const apiFiles = fs.readdirSync(apiDir).filter(file => file.endsWith('.js'));

    // Count route files in root routes/ directory (these don't become functions)
    const routesDir = path.join(process.cwd(), 'routes');
    let routeFiles = [];
    try {
      routeFiles = fs.readdirSync(routesDir).filter(file => file.endsWith('.js'));
    } catch (error) {
      // routes directory might not exist
    }

    return { apiFiles, routeFiles };
  } catch (error) {
    log('❌ Error reading directories', 'red');
    return { apiFiles: [], routeFiles: [] };
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

  // Count current files
  const { apiFiles, routeFiles } = countRouteFiles();
  log(`\n📊 Vercel Functions (api/*.js): ${apiFiles.length}`, 'blue');
  log(`📊 Route Files (routes/*.js): ${routeFiles.length}`, 'blue');

  if (apiFiles.length > 12) {
    log(`⚠️  WARNING: You have ${apiFiles.length} files in api/, but Vercel Hobby plan only allows 12 functions!`, 'yellow');
  } else {
    log(`✅ Excellent: You have ${apiFiles.length} Vercel functions (well within 12 function limit)`, 'green');
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
  
  // Provide optimization status
  log('\n💡 Optimization Status:', 'blue');

  if (apiFiles.length === 1 && apiFiles[0] === 'index.js') {
    log('🎉 Perfect! Only api/index.js exists as a Vercel function!', 'green');
    log(`📁 All ${routeFiles.length} route files are in routes/ directory (not counted as functions)`, 'green');
    log('\n📊 Total Vercel Functions: 1 (well within 12 limit)', 'green');
  } else {
    log(`⚠️  Found ${apiFiles.length} files in api/ directory:`, 'yellow');
    apiFiles.forEach(file => {
      log(`   - ${file}`, 'white');
    });
    log('💡 Consider moving route files to routes/ directory to reduce function count', 'yellow');
  }
  
  log('\n🚀 Next Steps:', 'cyan');
  log('1. Test the application locally: npm start', 'white');
  log('2. Deploy to Vercel: vercel --prod', 'white');
  log('3. Monitor function usage in Vercel dashboard', 'white');
  
  log('\n📚 Current Architecture:', 'blue');
  log('• api/index.js: Single Express.js application (1 Vercel function)', 'white');
  log('• routes/*.js: Route modules imported by api/index.js (not functions)', 'white');
  log('• This approach uses only 1 of 12 allowed Vercel functions!', 'green');
}

if (require.main === module) {
  main();
}

module.exports = { countRouteFiles, checkVercelConfig };
