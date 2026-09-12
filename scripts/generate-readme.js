#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const readmePath = path.join(root, 'README.md');
const indexPath = path.join(root, 'index.html');

const SKIP_DIRS = new Set(['.git', '.github']);
const SKIP_FILES = new Set(['README.md']);

function listFiles(dir, prefix = '') {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const out = [];

  for (const entry of entries) {
    const relPath = path.posix.join(prefix, entry.name);
    const absPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      out.push(...listFiles(absPath, relPath));
      continue;
    }

    if (SKIP_FILES.has(entry.name) && prefix === '') continue;
    out.push(relPath);
  }

  return out.sort((a, b) => a.localeCompare(b));
}

function getIndexTitle() {
  if (!fs.existsSync(indexPath)) return 'Project Website';
  const html = fs.readFileSync(indexPath, 'utf8');
  const match = html.match(/<title>([\s\S]*?)<\/title>/i);
  return match ? match[1].trim() : 'Project Website';
}

function extSummary(files) {
  const map = new Map();
  for (const file of files) {
    const ext = path.extname(file) || '(no extension)';
    map.set(ext, (map.get(ext) || 0) + 1);
  }
  return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

function buildReadme() {
  const files = listFiles(root);
  const title = getIndexTitle();
  const updated = new Date().toISOString().replace('T', ' ').replace('Z', ' UTC');
  const summary = extSummary(files);

  const fileList = files.map((f) => `- ${f}`).join('\n');
  const typeList = summary.map(([ext, count]) => `- ${ext}: ${count}`).join('\n');

  return `# iain.github.io

Auto-updating README for this repository.

## Site title
${title}

## Repository snapshot
Last updated: ${updated}

### File types
${typeList}

### Files
${fileList}

## How this stays updated
- The script at scripts/generate-readme.js rebuilds this README from the current repository files.
- The workflow at .github/workflows/update-readme.yml runs on pushes to main and commits README changes when needed.
`;
}

const next = buildReadme();
fs.writeFileSync(readmePath, next, 'utf8');
console.log('README.md generated.');