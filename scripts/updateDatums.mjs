import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import datums from '../lib/constants/Datum.js'; // Import the datums object directly

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Open proj.db
const dbPath = path.resolve(__dirname, '../proj.db');
const db = new sqlite3.Database(dbPath);

// Create a set to track existing datum names (case-insensitive)
const existingDatumNames = new Set(
  Object.values(datums).map(datum => datum.datumName.toLowerCase())
);

// Query proj.db for Helmert transforms with method_code = 9606
db.all(
  `SELECT ht.source_crs_auth_name, 
          ht.source_crs_code, 
          ht.tx, ht.ty, ht.tz, 
          ht.rx, ht.ry, ht.rz, 
          ht.scale_difference, 
          gd.auth_name AS authority, 
          gd.code, 
          ht.accuracy, 
          cv.name AS datum_name,
          e.name AS ellipse_name
   FROM helmert_transformation ht
   JOIN crs_view cv 
     ON ht.source_crs_auth_name = cv.auth_name 
    AND ht.source_crs_code = cv.code
   JOIN geodetic_crs gcrs
     ON cv.table_name = 'geodetic_crs'
    AND cv.auth_name = gcrs.auth_name
    AND cv.code = gcrs.code
   JOIN geodetic_datum gd
     ON gcrs.datum_auth_name = gd.auth_name
    AND gcrs.datum_code = gd.code
   JOIN ellipsoid e
     ON gd.ellipsoid_auth_name = e.auth_name
    AND gd.ellipsoid_code = e.code
   WHERE ht.deprecated = 0 
     AND ht.method_code = 9606 -- Filter by Position Vector transformation
     AND (ht.target_crs_auth_name = 'EPSG' AND ht.target_crs_code IN ('4326', '7019', '4258')) -- WGS84, GRS80, ETRS89
     AND cv.type != 'vertical' -- Exclude vertical datums
   ORDER BY ht.accuracy ASC`, // Assuming lower accuracy values are better
  (err, rows) => {
    if (err) {
      console.error('Error querying proj.db:', err);
      return;
    }

    rows.forEach((row) => {
      const normalizedDatumName = row.datum_name.toLowerCase();

      // Skip if the datumName already exists (case-insensitive)
      if (existingDatumNames.has(normalizedDatumName)) {
        // return;
      }

      // Construct the towgs84 string from tx, ty, tz, rx, ry, rz, and scale_difference
      const towgs84 = `${row.tx},${row.ty},${row.tz},${row.rx || 0},${row.ry || 0},${row.rz || 0},${row.scale_difference || 0}`;

      // Use auth:code as the key for new entries
      const key = `${row.authority}_${row.code}`;
      datums[key] = {
        towgs84,
        ellipse: row.ellipse_name || 'unknown', // Use the retrieved ellipse name
        datumName: row.datum_name
      };

      // Add the normalized datumName to the set to prevent future duplicates
      existingDatumNames.add(normalizedDatumName);
    });

    // Remove duplicates based on datumName
    const uniqueDatums = {};
    const seenDatumNames = new Set();
    for (const [key, datum] of Object.entries(datums)) {
      const normalizedDatumName = datum.datumName.toLowerCase();
      if (!seenDatumNames.has(normalizedDatumName)) {
        uniqueDatums[key] = datum;
        seenDatumNames.add(normalizedDatumName);
      }
    }

    // Write updated datums back to Datum.js
    const datumFilePath = path.resolve(__dirname, '../lib/constants/Datum.js');
    const updatedContent = `var datums = ${JSON.stringify(uniqueDatums, null, 2)};\n\n`
      + `for (var key in datums) {\n`
      + `  var datum = datums[key];\n`
      + `  datums[datum.datumName] = datum;\n`
      + `}\n\n`
      + `export default datums;`;
    fs.writeFileSync(datumFilePath, updatedContent, 'utf-8');
    console.log('Datum.js updated successfully!');
  }
);
