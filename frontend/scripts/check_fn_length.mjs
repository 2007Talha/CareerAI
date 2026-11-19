import fs from 'fs';
import path from 'path';

function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(full));
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      results.push(full);
    }
  }
  return results;
}

const srcDir = fs.existsSync('src') ? 'src' : 'frontend/src';
const files = getFiles(srcDir);
console.log(`Checking ${files.length} TypeScript files for functions over 40 lines...\n`);

const longFiles = [];
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  if (lines.length > 50) {
    longFiles.push({ file: path.relative('frontend/src', file), lineCount: lines.length });
  }
}

longFiles.sort((a, b) => b.lineCount - a.lineCount);
console.log('Top files by total lines:');
for (const item of longFiles) {
  console.log(`- ${item.file}: ${item.lineCount} lines`);
}
