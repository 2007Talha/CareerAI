import fs from 'fs';
import path from 'path';
import ts from 'typescript';

function getTsFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat && stat.isDirectory()) {
      results = results.concat(getTsFiles(full));
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      results.push(full);
    }
  }
  return results;
}

const srcDir = fs.existsSync('src') ? 'src' : 'frontend/src';
const files = getTsFiles(srcDir);
let violations = [];

for (const filePath of files) {
  const code = fs.readFileSync(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(
    filePath,
    code,
    ts.ScriptTarget.Latest,
    true
  );

  function checkNode(node) {
    if (
      ts.isFunctionDeclaration(node) ||
      ts.isFunctionExpression(node) ||
      ts.isArrowFunction(node) ||
      ts.isMethodDeclaration(node)
    ) {
      const start = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
      const end = sourceFile.getLineAndCharacterOfPosition(node.getEnd()).line + 1;
      const lineCount = end - start + 1;

      // Allow 40 lines max
      if (lineCount > 40) {
        let name = 'anonymous';
        if (ts.isFunctionDeclaration(node) && node.name) {
          name = node.name.text;
        } else if (node.parent && ts.isVariableDeclaration(node.parent) && ts.isIdentifier(node.parent.name)) {
          name = node.parent.name.text;
        } else if (ts.isMethodDeclaration(node) && ts.isIdentifier(node.name)) {
          name = node.name.text;
        }

        violations.push({
          file: path.relative('frontend/src', filePath),
          name,
          start,
          end,
          lineCount,
        });
      }
    }
    ts.forEachChild(node, checkNode);
  }

  checkNode(sourceFile);
}

if (violations.length === 0) {
  console.log('✅ ALL functions in frontend/src have 40 or fewer lines of code! (0 violations)');
} else {
  console.log(`⚠️ Found ${violations.length} functions exceeding 40 lines:`);
  for (const v of violations) {
    console.log(`- ${v.file}:${v.start}-${v.end} [${v.name}] (${v.lineCount} lines)`);
  }
}
