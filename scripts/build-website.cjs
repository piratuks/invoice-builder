/* eslint-disable no-undef, @typescript-eslint/no-require-imports */
const { spawnSync } = require('node:child_process');
const fs = require('node:fs/promises');
const path = require('node:path');

const repositoryRoot = path.resolve(__dirname, '..');
const websiteDirectory = path.join(repositoryRoot, 'apps', 'website');
const outputDirectory = path.join(repositoryRoot, 'dist-website');
const stagingDirectory = path.join(outputDirectory, 'site');

const build = async () => {
  await fs.rm(outputDirectory, { recursive: true, force: true });
  await fs.mkdir(outputDirectory, { recursive: true });
  await fs.writeFile(path.join(outputDirectory, 'package.json'), '{ "type": "commonjs" }\n');

  const docusaurusCli = path.join(repositoryRoot, 'node_modules', '@docusaurus', 'core', 'bin', 'docusaurus.mjs');
  const result = spawnSync(process.execPath, [docusaurusCli, 'build', '--out-dir', '../../dist-website/site'], {
    cwd: websiteDirectory,
    stdio: 'inherit'
  });

  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);

  for (const entry of await fs.readdir(stagingDirectory)) {
    await fs.rename(path.join(stagingDirectory, entry), path.join(outputDirectory, entry));
  }
  await fs.rmdir(stagingDirectory);
};

build().catch(error => {
  console.error(error);
  process.exit(1);
});
