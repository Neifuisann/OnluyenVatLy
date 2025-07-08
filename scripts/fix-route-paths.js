#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function fixRoutePaths() {
  const routesDir = path.join(process.cwd(), 'routes');
  const files = fs.readdirSync(routesDir).filter(file => file.endsWith('.js'));
  
  files.forEach(file => {
    const filePath = path.join(routesDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix relative paths to point to api/ directory
    content = content.replace(/require\('\.\.\/controllers\//g, "require('../api/controllers/");
    content = content.replace(/require\('\.\.\/middleware\//g, "require('../api/middleware/");
    content = content.replace(/require\('\.\.\/services\//g, "require('../api/services/");
    content = content.replace(/require\('\.\.\/utils\//g, "require('../api/utils/");
    content = content.replace(/require\('\.\.\/config\//g, "require('../api/config/");
    
    // Fix any routes that require other routes
    content = content.replace(/require\('\.\/([^']+)'\)/g, "require('./$1')");
    
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed paths in ${file}`);
  });
}

fixRoutePaths();
console.log('🎉 All route paths fixed!');
