/**
 * Resources for details of NTv2 file formats:
 * - https://web.archive.org/web/20140127204822if_/http://www.mgs.gov.on.ca:80/stdprodconsume/groups/content/@mgs/@iandit/documents/resourcelist/stel02_047447.pdf
 * - http://mimaka.com/help/gs/html/004_NTV2%20Data%20Format.htm
 */

/**
 * @type {Object.<string, Nadgrid>}
 */
export var loadedNadgrids = {};

/**
 * @typedef {Object} Subgrid
 * @property {number[]} ll lower limit (longitude latitude)
 * @property {number[]} del deltas aka intervals
 * @property {number[]} lim - [lngColumnCount, latColumnCount]
 * @property {number} count - total grid count. Kind of pointless
 * @property {Array<Array<number>>} cvs
 */

/**
 * @typedef {Object} Nadgrid
 * @property {Object} header
 * @property {number} header.nFields - Number of fields in the header.
 * @property {number} header.nSubgridFields - Number of subgrid fields.
 * @property {number} header.nSubgrids - Number of subgrids.
 * @property {any} header.shiftType - Type of shift (e.g., grid shift type).
 * @property {number} header.fromSemiMajorAxis - Semi-major axis of the source datum.
 * @property {number} header.fromSemiMinorAxis - Semi-minor axis of the source datum.
 * @property {number} header.toSemiMajorAxis - Semi-major axis of the target datum.
 * @property {number} header.toSemiMinorAxis - Semi-minor axis of the target datum.
 * @property {Array<Subgrid>} subgrids - Array of subgrid objects.
 */

/**
 * Load a binary NTv2 file (.gsb) to a key that can be used in a proj string like +nadgrids=<key>. Pass the NTv2 file
 * as an ArrayBuffer.
 */
export default function nadgrid(key, data, options) {
  var includeErrorFields = true;
  if (options !== undefined && options.includeErrorFields === false) {
    includeErrorFields = false;
  }
  var view = new DataView(data);
  var isLittleEndian = detectLittleEndian(view);
  var header = readHeader(view, isLittleEndian);
  var subgrids = readSubgrids(view, header, isLittleEndian, includeErrorFields);
  var nadgrid = { header: header, subgrids: subgrids };
  loadedNadgrids[key] = nadgrid;
  return nadgrid;
}

/**
 * @param {string} key
 * @param {Array<Float32Array>} data
 * @param {{imageWidth: number, imageHeight:number, extent: [number, number,number,number]}} metadata
 */
export function nadtifgrid(key, data, metadata) {
  const minX = metadata.extent[0];
  const minY = metadata.extent[1];
  const maxX = metadata.extent[2];
  const maxY = metadata.extent[3];

  const dx = (maxX - minX) / (metadata.imageWidth - 1);
  const dy = (maxY - minY) / (metadata.imageHeight - 1);

  const latitudeOffsetBand = data[0];
  const longitudeOffsetBand = data[1];
  const nodes = [];

  for (let i = metadata.imageHeight - 1; i >= 0; i--) {
    for (let j = metadata.imageWidth - 1; j >= 0; j--) {
      const index = i * metadata.imageWidth + j;
      nodes.push([-secondsToRadians(longitudeOffsetBand[index]), secondsToRadians(latitudeOffsetBand[index])]);
    }
  }

  const tifGrid = {
    header: {},
    subgrids: [
      {
        del: [degreesToRadians(dx), degreesToRadians(dy)],
        lim: [metadata.imageWidth, metadata.imageHeight],
        ll: [-degreesToRadians(maxX), degreesToRadians(minY)],
        cvs: nodes
      }] };
  loadedNadgrids[key] = tifGrid;
  return tifGrid;
};

/**
 * Given a proj4 value for nadgrids, return an array of loaded grids
 */
export function getNadgrids(nadgrids) {
  // Format details: http://proj.maptools.org/gen_parms.html
  if (nadgrids === undefined) {
    return null;
  }
  var grids = nadgrids.split(',');
  return grids.map(parseNadgridString);
}

function parseNadgridString(value) {
  if (value.length === 0) {
    return null;
  }
  var optional = value[0] === '@';
  if (optional) {
    value = value.slice(1);
  }
  if (value === 'null') {
    return { name: 'null', mandatory: !optional, grid: null, isNull: true };
  }
  return {
    name: value,
    mandatory: !optional,
    grid: loadedNadgrids[value] || null,
    isNull: false
  };
}

function degreesToRadians(degrees) {
  return (degrees) * Math.PI / 180;
}

function secondsToRadians(seconds) {
  return (seconds / 3600) * Math.PI / 180;
}

function detectLittleEndian(view) {
  var nFields = view.getInt32(8, false);
  if (nFields === 11) {
    return false;
  }
  nFields = view.getInt32(8, true);
  if (nFields !== 11) {
    console.warn('Failed to detect nadgrid endian-ness, defaulting to little-endian');
  }
  return true;
}

function readHeader(view, isLittleEndian) {
  return {
    nFields: view.getInt32(8, isLittleEndian),
    nSubgridFields: view.getInt32(24, isLittleEndian),
    nSubgrids: view.getInt32(40, isLittleEndian),
    shiftType: decodeString(view, 56, 56 + 8).trim(),
    fromSemiMajorAxis: view.getFloat64(120, isLittleEndian),
    fromSemiMinorAxis: view.getFloat64(136, isLittleEndian),
    toSemiMajorAxis: view.getFloat64(152, isLittleEndian),
    toSemiMinorAxis: view.getFloat64(168, isLittleEndian)
  };
}

function decodeString(view, start, end) {
  return String.fromCharCode.apply(null, new Uint8Array(view.buffer.slice(start, end)));
}

function readSubgrids(view, header, isLittleEndian, includeErrorFields) {
  var gridOffset = 176;
  var grids = [];
  for (var i = 0; i < header.nSubgrids; i++) {
    var subHeader = readGridHeader(view, gridOffset, isLittleEndian);
    var nodes = readGridNodes(view, gridOffset, subHeader, isLittleEndian, includeErrorFields);
    var lngColumnCount = Math.round(
      1 + (subHeader.upperLongitude - subHeader.lowerLongitude) / subHeader.longitudeInterval);
    var latColumnCount = Math.round(
      1 + (subHeader.upperLatitude - subHeader.lowerLatitude) / subHeader.latitudeInterval);
    // Proj4 operates on radians whereas the coordinates are in seconds in the grid
    grids.push({
      ll: [secondsToRadians(subHeader.lowerLongitude), secondsToRadians(subHeader.lowerLatitude)],
      del: [secondsToRadians(subHeader.longitudeInterval), secondsToRadians(subHeader.latitudeInterval)],
      lim: [lngColumnCount, latColumnCount],
      count: subHeader.gridNodeCount,
      cvs: mapNodes(nodes)
    });
    var rowSize = 16;
    if (includeErrorFields === false) {
      rowSize = 8;
    }
    gridOffset += 176 + subHeader.gridNodeCount * rowSize;
  }
  return grids;
}

/**
 * @param {*} nodes
 * @returns Array<Array<number>>
 */
function mapNodes(nodes) {
  return nodes.map(function (r) {
    return [secondsToRadians(r.longitudeShift), secondsToRadians(r.latitudeShift)];
  });
}

function readGridHeader(view, offset, isLittleEndian) {
  return {
    name: decodeString(view, offset + 8, offset + 16).trim(),
    parent: decodeString(view, offset + 24, offset + 24 + 8).trim(),
    lowerLatitude: view.getFloat64(offset + 72, isLittleEndian),
    upperLatitude: view.getFloat64(offset + 88, isLittleEndian),
    lowerLongitude: view.getFloat64(offset + 104, isLittleEndian),
    upperLongitude: view.getFloat64(offset + 120, isLittleEndian),
    latitudeInterval: view.getFloat64(offset + 136, isLittleEndian),
    longitudeInterval: view.getFloat64(offset + 152, isLittleEndian),
    gridNodeCount: view.getInt32(offset + 168, isLittleEndian)
  };
}

function readGridNodes(view, offset, gridHeader, isLittleEndian, includeErrorFields) {
  var nodesOffset = offset + 176;
  var gridRecordLength = 16;

  if (includeErrorFields === false) {
    gridRecordLength = 8;
  }

  var gridShiftRecords = [];
  for (var i = 0; i < gridHeader.gridNodeCount; i++) {
    var record = {
      latitudeShift: view.getFloat32(nodesOffset + i * gridRecordLength, isLittleEndian),
      longitudeShift: view.getFloat32(nodesOffset + i * gridRecordLength + 4, isLittleEndian)

    };

    if (includeErrorFields !== false) {
      record.latitudeAccuracy = view.getFloat32(nodesOffset + i * gridRecordLength + 8, isLittleEndian);
      record.longitudeAccuracy = view.getFloat32(nodesOffset + i * gridRecordLength + 12, isLittleEndian);
    }

    gridShiftRecords.push(record);
  }
  return gridShiftRecords;
}
