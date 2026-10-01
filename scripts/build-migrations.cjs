/* eslint-disable no-undef, @typescript-eslint/no-require-imports */
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const sourceDir = path.join(root, 'packages', 'core', 'src', 'migrations');
const outputDir = path.join(root, 'dist-migrations');
const migrationFiles = fs.existsSync(sourceDir)
  ? fs.readdirSync(sourceDir).filter(file => /^\d{8}-\d{2}-.+\.ts$/.test(file))
  : [];

if (migrationFiles.length === 0) {
  fs.rmSync(outputDir, { recursive: true, force: true });
  fs.mkdirSync(outputDir, { recursive: true });
  process.exit(0);
}

const vite = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js');
const result = spawnSync(
  process.execPath,
  [vite, 'build', '--config', path.join(root, 'vite.migrations.config.ts'), ...process.argv.slice(2)],
  { cwd: root, stdio: 'inherit' }
);

if (result.error) throw result.error;
process.exit(result.status ?? 1);
