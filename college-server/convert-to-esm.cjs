/**
 * Convert all CommonJS (require/module.exports) to ESM (import/export)
 * in src/modules/**/*.js files
 */

const fs = require('fs');
const path = require('path');

function convertFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  const original = content;

  // Skip if already converted (has import statements and no require)
  if (content.includes('import ') && !content.includes('require(')) {
    console.log(`✅ SKIP (already ESM): ${path.relative(process.cwd(), filePath)}`);
    return;
  }

  // Convert: const db = require("...") → import db from "..."
  content = content.replace(
    /const\s+(\w+)\s*=\s*require\s*\(\s*["']([^"']+)["']\s*\)/g,
    (match, varName, modulePath) => {
      const newPath = modulePath.endsWith('.js') ? modulePath : modulePath + '.js';
      return `import ${varName} from '${newPath}'`;
    }
  );

  // Convert: const { a, b, c } = require("...") → import { a, b, c } from "..."
  content = content.replace(
    /const\s*\{\s*([^}]+)\s*\}\s*=\s*require\s*\(\s*["']([^"']+)["']\s*\)/g,
    (match, vars, modulePath) => {
      const newPath = modulePath.endsWith('.js') ? modulePath : modulePath + '.js';
      return `import { ${vars} } from '${newPath}'`;
    }
  );

  // Convert: const router = require("express").Router() → import express from "express"; const router = express.Router()
  if (content.includes('require("express").Router()')) {
    content = content.replace(
      /const\s+(\w+)\s*=\s*require\s*\(\s*["']express["']\s*\)\.Router\s*\(\s*\)/g,
      'import express from \'express\';\nconst $1 = express.Router()'
    );
  }

  // Convert: exports.functionName = → export const functionName =
  content = content.replace(/exports\.(\w+)\s*=\s*/g, 'export const $1 = ');

  // Convert: module.exports = → export default
  content = content.replace(/module\.exports\s*=\s*/g, 'export default ');

  if (content === original) {
    console.log(`⏭️  NO CHANGES: ${path.relative(process.cwd(), filePath)}`);
    return;
  }

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`✅ CONVERTED: ${path.relative(process.cwd(), filePath)}`);
}

// Find all .js files in src/modules recursively
function findFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);

  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...findFiles(fullPath));
    } else if (item.endsWith('.js')) {
      files.push(fullPath);
    }
  });

  return files;
}

const files = findFiles('src/modules');
console.log(`\n🔄 Converting ${files.length} files to ESM...\n`);

files.forEach(file => {
  try {
    convertFile(file);
  } catch (error) {
    console.error(`❌ ERROR in ${file}:`, error.message);
  }
});

console.log(`\n✅ Conversion complete!\n`);


