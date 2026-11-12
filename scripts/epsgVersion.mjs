import fs from 'fs';
import path from 'path';

const HEADER_PATTERN = /^\/\/ Updated from proj\.db with EPSG (v\d+(?:\.\d+)*)/;

function parseVersion(version) {
  return version.slice(1).split('.').map(Number);
}

function isOlder(version, other) {
  const a = parseVersion(version);
  const b = parseVersion(other);
  for (let i = 0; i < Math.max(a.length, b.length); ++i) {
    if ((a[i] || 0) !== (b[i] || 0)) {
      return (a[i] || 0) < (b[i] || 0);
    }
  }
  return false;
}

/**
 * Returns the header line for a file generated from proj.db. Exits if proj.db's
 * EPSG version is older than the one the file was last updated with.
 * @param {import('node:sqlite').DatabaseSync} db The proj.db database.
 * @param {string} filePath The file to update.
 * @return {string} The header line.
 */
export default function epsgHeader(db, filePath) {
  const version = String(db.prepare('SELECT value FROM metadata WHERE key = \'EPSG.VERSION\'').get().value);
  const match = fs.readFileSync(filePath, 'utf-8').match(HEADER_PATTERN);
  if (match && isOlder(version, match[1])) {
    console.error(`proj.db has EPSG ${version}, but ${path.basename(filePath)} was updated with EPSG ${match[1]}. Use a newer proj.db.`);
    process.exit(1);
  }
  return `// Updated from proj.db with EPSG ${version}. Do not use an older version.\n`;
}
