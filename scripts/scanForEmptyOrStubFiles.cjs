const fs = require('fs');
const path = require('path');

// Config
const SRC_DIR = path.join(__dirname, '../src');
const ALLOWED_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

// Helper: Recursively get all files in src/
function getAllFiles(dir, files = []) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, files);
    } else if (ALLOWED_EXTENSIONS.includes(path.extname(fullPath))) {
      files.push(fullPath);
    }
  });
  return files;
}

// Helper: Check if file is empty or stub
function isEmptyOrStub(content) {
  // Remove whitespace and comments
  const noWhitespace = content.replace(/\s/g, '');
  const noComments = content.replace(/(\/\/.*$)|(\/\*[\s\S]*?\*\/)/gm, '');
  // Check for empty or only comments
  if (!noComments.trim()) return true;
  // Check for only a single export or TODO
  if (/^export\s+\{?\}?;?$/.test(noComments.trim())) return true;
  if (/^\/\/\s*TODO/i.test(content.trim())) return true;
  return false;
}

// Main
const files = getAllFiles(SRC_DIR);
const suspicious = [];

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  if (isEmptyOrStub(content)) {
    suspicious.push(path.relative(process.cwd(), file));
  }
});

if (suspicious.length) {
  console.log('Suspicious empty or stub files found:');
  suspicious.forEach(f => console.log(' -', f));
  process.exit(1);
} else {
  console.log('No empty or stub files found.');
} 