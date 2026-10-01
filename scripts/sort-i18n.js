import fs from 'fs';
import path from 'path';

function sortObject(obj) {
  if (Array.isArray(obj)) return obj.map(sortObject);
  if (obj && typeof obj === 'object') {
    return Object.keys(obj)
      .sort()
      .reduce((acc, key) => {
        acc[key] = sortObject(obj[key]);
        return acc;
      }, {});
  }
  return obj;
}

const folder = path.resolve('apps/renderer/src/i18n');
const files = fs.readdirSync(folder).filter(f => f.endsWith('.json'));

files.forEach(file => {
  const filePath = path.join(folder, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const sorted = sortObject(data);
  fs.writeFileSync(filePath, JSON.stringify(sorted, null, 2));
});
