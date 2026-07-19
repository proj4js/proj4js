import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';
import datums from '../lib/constants/Datum.js'; // Import datums directly
import ellipsoids from '../lib/constants/Ellipsoid.js'; // Import ellipsoids directly
import { fileURLToPath } from 'url';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Extract ellipsoid keys and ellipseName values from Ellipsoid.js
const ellipsoidKeys = Object.keys(ellipsoids);
const ellipsoidNames = Object.values(ellipsoids).map(ellipsoid => ellipsoid.ellipseName);

// Combine ellipsoid keys and ellipseName values into a single set
const ellipsoidSet = new Set([...ellipsoidKeys, ...ellipsoidNames]);

// Extract ellipse values from Datum.js
const datumEllipses = new Set(Object.values(datums).map(datum => datum.ellipse));

// Find missing ellipses - datums without an `ellipse` fall back to a default,
// so the resulting `undefined` is not a missing ellipsoid
const missingEllipses = [...datumEllipses].filter(ellipse => ellipse && !ellipsoidSet.has(ellipse));

// If no missing ellipses, exit early
if (missingEllipses.length === 0) {
  console.log('No missing ellipses found.');
  process.exit(0);
}

// Open proj.db
const dbPath = path.resolve(__dirname, '../proj.db');
const db = new DatabaseSync(dbPath, { readOnly: true });

// Query the ellipsoid table for missing ellipses
const placeholders = missingEllipses.map(() => '?').join(',');
// An ellipsoid is defined either by its inverse flattening or by its semi-minor
// axis - exactly one of the two columns is populated. Axes are stored in the
// unit given by uom_code, which is not always metre. Some names occur twice
// (once deprecated), in which case only the non-deprecated row is wanted - but
// names that only exist as a deprecated row must still be picked up.
const query = `
  SELECT e.auth_name || ':' || e.code AS key,
         e.semi_major_axis * u.conv_factor AS a,
         e.inv_flattening AS rf,
         e.semi_minor_axis * u.conv_factor AS b,
         e.name AS ellipseName
  FROM ellipsoid e
  JOIN unit_of_measure u
    ON u.auth_name = e.uom_auth_name AND u.code = e.uom_code
  WHERE e.name IN (${placeholders})
    AND e.deprecated = (SELECT MIN(e2.deprecated) FROM ellipsoid e2 WHERE e2.name = e.name)
`;

const rows = db.prepare(query).all(...missingEllipses);
db.close();

// Report names that have no counterpart in proj.db, so they don't go unnoticed
const found = new Set(rows.map(row => row.ellipseName));
const unresolved = missingEllipses.filter(name => !found.has(name));
if (unresolved.length > 0) {
  console.warn(`No proj.db ellipsoid named: ${unresolved.join(', ')}`);
}

if (rows.length === 0) {
  console.log('No ellipsoids to add.');
  process.exit(0);
}

// Add missing ellipsoids to the ellipsoids object
rows.forEach((row) => {
  const key = row.key.replace(/:/g, '_'); // Replace ":" with "_" for valid JavaScript keys
  ellipsoids[key] = row.rf === null
    ? {
        a: row.a,
        b: row.b,
        ellipseName: row.ellipseName
      }
    : {
        a: row.a,
        rf: row.rf,
        ellipseName: row.ellipseName
      };
});

// Write the updated ellipsoids object back to Ellipsoid.js
const ellipsoidFilePath = path.resolve(__dirname, '../lib/constants/Ellipsoid.js');
const ellipsoidContent = `var ellipsoids = ${JSON.stringify(ellipsoids, null, 2)};\n\nexport default ellipsoids;`;
fs.writeFileSync(ellipsoidFilePath, ellipsoidContent, 'utf-8');
console.log(`Ellipsoid.js updated successfully with ${rows.length} missing ellipsoids.`);
