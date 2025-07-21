#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function fixInternalLibPaths() {
  const libDir = path.join(process.cwd(), 'lib');
  const subdirs = ['controllers', 'services', 'middleware', 'utils', 'config'];
  
  subdirs.forEach(subdir => {
    const subdirPath = path.join(libDir, subdir);
    if (!fs.existsSync(subdirPath)) return;
    
    const files = fs.readdirSync(subdirPath, { withFileTypes: true });
    
    files.forEach(file => {
      if (file.isFile() && file.name.endsWith('.js')) {
        const filePath = path.join(subdirPath, file.name);
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Fix relative paths within lib files
        content = content.replace(/require\('\.\.\/controllers\//g, "require('../controllers/");
        content = content.replace(/require\('\.\.\/middleware\//g, "require('../middleware/");
        content = content.replace(/require\('\.\.\/services\//g, "require('../services/");
        content = content.replace(/require\('\.\.\/utils\//g, "require('../utils/");
        content = content.replace(/require\('\.\.\/config\//g, "require('../config/");
        
        // Fix paths that might reference the old api structure
        content = content.replace(/require\('\.\.\/\.\.\/api\//g, "require('../");
        
        fs.writeFileSync(filePath, content);
        console.log(`✅ Fixed internal paths in ${subdir}/${file.name}`);
      } else if (file.isDirectory()) {
        // Handle nested directories like services/ai, services/cache
        const nestedPath = path.join(subdirPath, file.name);
        const nestedFiles = fs.readdirSync(nestedPath).filter(f => f.endsWith('.js'));
        
        nestedFiles.forEach(nestedFile => {
          const nestedFilePath = path.join(nestedPath, nestedFile);
          let content = fs.readFileSync(nestedFilePath, 'utf8');
          
          // Fix paths for nested files (they need one more ../)
          content = content.replace(/require\('\.\.\/\.\.\/controllers\//g, "require('../../controllers/");
          content = content.replace(/require\('\.\.\/\.\.\/middleware\//g, "require('../../middleware/");
          content = content.replace(/require\('\.\.\/\.\.\/services\//g, "require('../../services/");
          content = content.replace(/require\('\.\.\/\.\.\/utils\//g, "require('../../utils/");
          content = content.replace(/require\('\.\.\/\.\.\/config\//g, "require('../../config/");
          
          fs.writeFileSync(nestedFilePath, content);
          console.log(`✅ Fixed internal paths in ${subdir}/${file.name}/${nestedFile}`);
        });
      }
    });
  });
}

fixInternalLibPaths();
console.log('🎉 All internal lib paths fixed!');
