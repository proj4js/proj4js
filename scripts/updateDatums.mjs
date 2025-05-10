import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import datums from '../lib/constants/Datum.js'; // Import the datums object directly

const DATUM_OVERRIDES = {
  EPSG_4149: {
    towgs84: '674.374,15.056,405.346'
  },
  EPSG_4267: {
    towgs84: '-8.0,160.0,176.0'
  },
  EPSG_4818: {
    towgs84: '589,76,480'
  }
};

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Open proj.db
const dbPath = path.resolve(__dirname, '../proj.db');
const db = new sqlite3.Database(dbPath);

for (const key in datums) {
  if (key === datums[key].datumName && datums[datums[key].datumName] === datums[key]) {
    delete datums[key];
  }
}

const databaseDatumNames = new Set();

// Query proj.db for Helmert transforms with method_code = 9606
db.all(
  `SELECT ht.source_crs_auth_name, 
          ht.source_crs_code, 
          ht.tx, ht.ty, ht.tz, 
          ht.rx, ht.ry, ht.rz, 
          ht.scale_difference,
          ht.accuracy, 
          gd.name AS datum_name,
          cv.name AS datum_code,
          e.name AS ellipse_name,
          ht.method_code
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
     AND ht.method_code IN (9606, 9607, 9603)
     AND (ht.target_crs_auth_name = 'EPSG' AND ht.target_crs_code IN ('4326', '7019', '4258')) -- WGS84, GRS80, ETRS89
     AND cv.type != 'vertical' -- Exclude vertical datums
   ORDER BY
     ht.accuracy ASC,
     CASE ht.method_code 
       WHEN 9606 THEN 1
       WHEN 9607 THEN 2
       WHEN 9603 THEN 3
       ELSE 4
     END ASC`, // Sort by method_code (9606 first, then 9607), then by accuracy`, // Assuming lower accuracy values are better
  (err, rows) => {
    if (err) {
      console.error('Error querying proj.db:', err);
      return;
    }

    rows.forEach((row) => {
      const normalizedDatumName = row.datum_name.toLowerCase();

      // Skip if the datumName already exists (case-insensitive)
      if (databaseDatumNames.has(normalizedDatumName)) {
        return;
      }

      if (row.method_code === 9607 && row.rx) {
        row.rx = -row.rx;
        row.ry = -row.ry;
        row.rz = -row.rz;
      }

      // Construct the towgs84 string from tx, ty, tz, rx, ry, rz, and scale_difference
      const towgs84 = row.rx ? `${row.tx},${row.ty},${row.tz},${row.rx},${row.ry},${row.rz},${row.scale_difference}` : `${row.tx},${row.ty},${row.tz}`;

      datums[`${row.source_crs_auth_name}_${row.source_crs_code}`] = {
        towgs84
      };

      databaseDatumNames.add(normalizedDatumName);
    });

    Object.assign(datums, DATUM_OVERRIDES);

    // Write updated datums back to Datum.js
    const datumFilePath = path.resolve(__dirname, '../lib/constants/Datum.js');
    const updatedContent = `var datums = ${JSON.stringify(datums, null, 2)};\n\n`
      + `for (var key in datums) {\n`
      + `  var datum = datums[key];\n`
      + `  if (!datum.datumName) {\n`
      + `    continue;\n`
      + `  }\n`
      + `  datums[datum.datumName] = datum;\n`
      + `}\n\n`
      + `export default datums;`;
    fs.writeFileSync(datumFilePath, updatedContent, 'utf-8');
    console.log('Datum.js updated successfully!');
  }
);
