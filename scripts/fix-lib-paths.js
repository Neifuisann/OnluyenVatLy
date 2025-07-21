#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function fixLibPaths() {
  const routesDir = path.join(process.cwd(), 'routes');
  const files = fs.readdirSync(routesDir).filter(file => file.endsWith('.js'));
  
  files.forEach(file => {
    const filePath = path.join(routesDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix relative paths to point to lib/ directory instead of api/
    content = content.replace(/require\('\.\.\/api\/controllers\//g, "require('../lib/controllers/");
    content = content.replace(/require\('\.\.\/api\/middleware\//g, "require('../lib/middleware/");
    content = content.replace(/require\('\.\.\/api\/services\//g, "require('../lib/services/");
    content = content.replace(/require\('\.\.\/api\/utils\//g, "require('../lib/utils/");
    content = content.replace(/require\('\.\.\/api\/config\//g, "require('../lib/config/");
    
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed lib paths in ${file}`);
  });
}

fixLibPaths();
console.log('🎉 All route lib paths fixed!');
