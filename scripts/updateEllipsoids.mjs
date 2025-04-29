import sqlite3 from 'sqlite3';
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

// Find missing ellipses
const missingEllipses = [...datumEllipses].filter(ellipse => !ellipsoidSet.has(ellipse));

// If no missing ellipses, exit early
if (missingEllipses.length === 0) {
  console.log('No missing ellipses found.');
  process.exit(0);
}

// Open proj.db
const dbPath = path.resolve(__dirname, '../proj.db');
const db = new sqlite3.Database(dbPath);

// Query the ellipsoid table for missing ellipses
const placeholders = missingEllipses.map(() => '?').join(',');
const query = `
  SELECT e.auth_name || ':' || e.code AS key,
         e.semi_major_axis AS a,
         e.inv_flattening AS rf,
         e.name AS ellipseName
  FROM ellipsoid e
  WHERE e.name IN (${placeholders})
`;

db.all(query, missingEllipses, (err, rows) => {
  if (err) {
    console.error('Error querying proj.db:', err);
    return;
  }

  // Add missing ellipsoids to the ellipsoids object
  rows.forEach((row) => {
    const key = row.key.replace(/:/g, '_'); // Replace ":" with "_" for valid JavaScript keys
    ellipsoids[key] = {
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
});

// Close the database connection
db.close();
