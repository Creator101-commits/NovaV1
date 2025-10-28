const fs = require('fs');
const path = require('path');

// Comprehensive emoji regex pattern
const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F018}-\u{1F270}\u{238C}-\u{2454}\u{20D0}-\u{20FF}\u{FE0F}]/gu;

// Directories to exclude
const excludeDirs = ['node_modules', '.git', 'dist', 'build', '.vscode', 'oracle_wallet'];

// File extensions to process
const includeExts = ['.ts', '.tsx', '.js', '.jsx', '.md'];

let modifiedCount = 0;
let skippedCount = 0;
let totalFiles = 0;

function shouldExclude(filePath) {
  return excludeDirs.some(dir => filePath.includes(path.sep + dir + path.sep) || filePath.includes(path.sep + dir));
}

function processFile(filePath) {
  totalFiles++;
  const ext = path.extname(filePath);
  
  if (!includeExts.includes(ext)) {
    skippedCount++;
    return;
  }
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const newContent = content.replace(emojiRegex, '');
    
    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`[Modified] ${path.relative(process.cwd(), filePath)}`);
      modifiedCount++;
    } else {
      skippedCount++;
    }
  } catch (error) {
    console.error(`[Error] ${filePath}: ${error.message}`);
    skippedCount++;
  }
}

function walkDir(dir) {
  if (shouldExclude(dir)) {
    return;
  }
  
  try {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        walkDir(filePath);
      } else if (stat.isFile()) {
        processFile(filePath);
      }
    }
  } catch (error) {
    console.error(`[Error reading dir] ${dir}: ${error.message}`);
  }
}

console.log('Starting emoji removal...\n');

// Start from current directory
walkDir(process.cwd());

console.log('\n===== Summary =====');
console.log(`Total files processed: ${totalFiles}`);
console.log(`Modified: ${modifiedCount}`);
console.log(`Skipped: ${skippedCount}`);
