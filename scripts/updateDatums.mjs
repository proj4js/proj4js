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

// Conversion factor from proj.db unit_of_measure: conv_factor is to radians.
// arc-second conv_factor = 4.84813681109535e-06
const ARC_SECOND_IN_RADIANS = 4.84813681109535e-06;

// Rotation unit conversion factors to arcseconds
// key: rotation_uom_code, value: multiply DB value by this to get arcseconds
const ROTATION_TO_ARCSEC = {
  9104: 1, // arc-second (already correct)
  9109: 1e-06 / ARC_SECOND_IN_RADIANS, // microradian
  9101: 1.0 / ARC_SECOND_IN_RADIANS, // radian
  1031: 0.001, // milliarc-second
  9113: 1.57079632679489e-06 / ARC_SECOND_IN_RADIANS // centesimal second
};

// Scale unit conversion factors to parts per million
const SCALE_TO_PPM = {
  9202: 1, // parts per million (already correct)
  1028: 0.001 // parts per billion -> ppm
};

// Translation unit conversion factors to metres
const TRANSLATION_TO_METRE = {
  9001: 1, // metre (already correct)
  1025: 0.001 // millimetre -> metre
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
          ht.method_code,
          ht.rotation_uom_code,
          ht.scale_difference_uom_code,
          ht.translation_uom_code
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

      // Round converted values to 6 decimal places to avoid floating-point artifacts
      const round6 = v => Math.round(v * 1e6) / 1e6;

      // Convert translation values to metres
      const txMetres = round6(row.tx * (TRANSLATION_TO_METRE[row.translation_uom_code] || 1));
      const tyMetres = round6(row.ty * (TRANSLATION_TO_METRE[row.translation_uom_code] || 1));
      const tzMetres = round6(row.tz * (TRANSLATION_TO_METRE[row.translation_uom_code] || 1));

      // Convert rotation values to arcseconds
      let rxArcsec = row.rx ? round6(row.rx * (ROTATION_TO_ARCSEC[row.rotation_uom_code] || 1)) : 0;
      let ryArcsec = row.ry ? round6(row.ry * (ROTATION_TO_ARCSEC[row.rotation_uom_code] || 1)) : 0;
      let rzArcsec = row.rz ? round6(row.rz * (ROTATION_TO_ARCSEC[row.rotation_uom_code] || 1)) : 0;

      // Convert scale difference to ppm
      const scalePpm = round6(row.scale_difference * (SCALE_TO_PPM[row.scale_difference_uom_code] || 1));

      if (row.method_code === 9607 && rxArcsec) {
        rxArcsec = -rxArcsec;
        ryArcsec = -ryArcsec;
        rzArcsec = -rzArcsec;
      }

      // Construct the towgs84 string from tx, ty, tz, rx, ry, rz, and scale_difference
      const towgs84 = rxArcsec ? `${txMetres},${tyMetres},${tzMetres},${rxArcsec},${ryArcsec},${rzArcsec},${scalePpm}` : `${txMetres},${tyMetres},${tzMetres}`;

      // Warn about unknown unit codes so future database changes don't silently produce wrong values
      if (row.rotation_uom_code && !ROTATION_TO_ARCSEC[row.rotation_uom_code]) {
        console.warn(`Unknown rotation UOM code ${row.rotation_uom_code} for ${row.source_crs_auth_name}_${row.source_crs_code}`);
      }
      if (row.scale_difference_uom_code && !SCALE_TO_PPM[row.scale_difference_uom_code]) {
        console.warn(`Unknown scale UOM code ${row.scale_difference_uom_code} for ${row.source_crs_auth_name}_${row.source_crs_code}`);
      }
      if (row.translation_uom_code && !TRANSLATION_TO_METRE[row.translation_uom_code]) {
        console.warn(`Unknown translation UOM code ${row.translation_uom_code} for ${row.source_crs_auth_name}_${row.source_crs_code}`);
      }

      datums[`${row.source_crs_auth_name}_${row.source_crs_code}`] = {
        towgs84
      };

      databaseDatumNames.add(normalizedDatumName);
    });

    Object.assign(datums, DATUM_OVERRIDES);

    // Write updated datums back to Datum.js
    const datumFilePath = path.resolve(__dirname, '../lib/constants/Datum.js');
    // Format the datums object with single quotes and unquoted property names
    const datumEntries = Object.entries(datums).map(([key, value]) => {
      const props = Object.entries(value).map(([pk, pv]) => {
        const formattedValue = typeof pv === 'string' ? `'${pv}'` : JSON.stringify(pv);
        return `    ${pk}: ${formattedValue}`;
      }).join(',\n');
      return `  ${key}: {\n${props}\n  }`;
    }).join(',\n');
    const updatedContent = `var datums = {\n${datumEntries}\n};\n\n`
      + `for (var key in datums) {\n`
      + `  var datum = datums[key];\n`
      + `  if (!datum.datumName) {\n`
      + `    continue;\n`
      + `  }\n`
      + `  datums[datum.datumName] = datum;\n`
      + `}\n\n`
      + `export default datums;\n`;
    fs.writeFileSync(datumFilePath, updatedContent, 'utf-8');
    console.log('Datum.js updated successfully!');
  }
);
