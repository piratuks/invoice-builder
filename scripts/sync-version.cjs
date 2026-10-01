/* eslint-disable no-undef */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { execSync } = require('child_process');

const repositoryRoot = path.resolve(__dirname, '..');

const readFile = filePath => fs.readFileSync(filePath, 'utf8');
const writeFile = (filePath, content) => fs.writeFileSync(filePath, content);

// The changelog's first dated entry (e.g. "## 2026-09-30, version 3.0.4") is the latest
// released version; the template placeholder ("## [Date], version [Version]") is skipped.
const getLatestVersionFromHistory = historyPath => {
  const match = readFile(historyPath).match(/^## \d{4}-\d{2}-\d{2}, version (\d+\.\d+\.\d+)/m);
  if (!match) throw new Error(`Could not find a dated version entry in ${historyPath}`);
  return match[1];
};

const replaceOnce = (filePath, pattern, replacement) => {
  const content = readFile(filePath);
  if (!pattern.test(content)) throw new Error(`Pattern not found in ${filePath}`);
  writeFile(filePath, content.replace(pattern, replacement));
};

const version = getLatestVersionFromHistory(path.join(repositoryRoot, 'docs', 'history.md'));
console.log(`[sync-version] Latest version from docs/history.md: ${version}`);

replaceOnce(path.join(repositoryRoot, 'package.json'), /"version": "[^"]+"/, `"version": "${version}"`);
replaceOnce(
  path.join(repositoryRoot, 'packages', 'core', 'src', 'config.ts'),
  /version: '[^']+'/,
  `version: '${version}'`
);
replaceOnce(
  path.join(repositoryRoot, 'packages', 'core', 'src', '__tests__', 'config.spec.ts'),
  /version: '[^']+'/,
  `version: '${version}'`
);

console.log('[sync-version] Updated package.json, config.ts, and config.spec.ts. Running npm install...');
execSync('npm install', { cwd: repositoryRoot, stdio: 'inherit' });
