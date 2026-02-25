/* eslint-disable no-undef */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { execSync } = require('child_process');

const destPath = process.argv[2];
const container = process.argv[3];
if (!destPath || !container) {
  console.error('Usage: node scripts/backup-data.js <destination-path> <container-name>');
  process.exit(1);
}

try {
  execSync(`docker cp ${container}:/data ${destPath}`, { stdio: 'inherit' });
  console.log(`Data copied to ${destPath}`);
} catch (err) {
  console.error('Error copying data:', err.message);
  process.exit(1);
}
