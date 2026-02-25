/* eslint-disable no-undef */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { execSync } = require('child_process');

const dbName = process.argv[2];
const container = process.argv[3];
if (!dbName || !container) {
  console.error('Usage: node scripts/remove-db.js <db-file> <container-name>');
  process.exit(1);
}

execSync(`docker exec ${container} rm -f /data/${dbName}`, { stdio: 'inherit' });
