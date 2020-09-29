import fs from 'fs';

export function readNadgrids(path) {
  var data = fs.readFileSync(path);
  // var header = {
  //   numberOfFields: data.readInt32LE(8),
  //   subGridFields: data.readInt32LE(24),
  //   nSubgrids: data.readInt32LE(40),
  //   gsType: data.toString('ascii', 56, 56 + 8).trim(),
  //   fromSemiMajorAxis: data.readDoubleLE(120),
  //   fromSemiMinorAxis: data.readDoubleLE(136),
  //   toSemiMajorAxis: data.readDoubleLE(152),
  //   toSemiMinorAxis: data.readDoubleLE(168),
  // };
  var gridHeaderOffset = 176;
  var gridHeader = {
    test: data.toString('ascii', gridHeaderOffset, gridHeaderOffset + 8),
    name: data.toString('ascii', gridHeaderOffset + 8, gridHeaderOffset + 16).trim(),
    parent: data.toString('ascii', gridHeaderOffset + 24, gridHeaderOffset + 24 + 8).trim(),
    llName: data.toString('ascii', gridHeaderOffset + 64, gridHeaderOffset + 72),
    lowerLatitude: data.readDoubleLE(gridHeaderOffset + 72),
    upperLatitude: data.readDoubleLE(gridHeaderOffset + 88),
    lowerLongitude: data.readDoubleLE(gridHeaderOffset + 104),
    upperLongitude: data.readDoubleLE(gridHeaderOffset + 120),
    latitudeInterval: data.readDoubleLE(gridHeaderOffset + 136),
    longitudeInterval: data.readDoubleLE(gridHeaderOffset + 152),
    gridNodeCountTag: data.toString('ascii', gridHeaderOffset + 160, gridHeaderOffset + 160 + 8),
    gridNodeCount: data.readInt32LE(gridHeaderOffset + 168)
  };
  var gridOffset = 176 * 2;
  var gridRecordLength = 16;
  var gridShiftRecords = [];
  for (var i = 0; i < gridHeader.gridNodeCount; i++) {
    var record = {
      latitudeShift: data.readFloatLE(gridOffset + i * gridRecordLength),
      longitudeShift: data.readFloatLE(gridOffset + i * gridRecordLength + 4),
      latitudeAccuracy: data.readFloatLE(gridOffset + i * gridRecordLength + 8),
      longitudeAccuracy: data.readFloatLE(gridOffset + i * gridRecordLength + 12),
    };
    gridShiftRecords.push(record);
  }
  var lngColumnCount = 1 + (gridHeader.upperLongitude - gridHeader.lowerLongitude) / gridHeader.longitudeInterval;
  var latColumnCount = 1 + (gridHeader.upperLatitude - gridHeader.lowerLatitude) / gridHeader.latitudeInterval;
  return {
    ll: [toRadians(gridHeader.lowerLongitude), toRadians(gridHeader.lowerLatitude)],
    del: [toRadians(gridHeader.longitudeInterval), toRadians(gridHeader.latitudeInterval)],
    lim: [lngColumnCount, latColumnCount],
    count: gridHeader.gridNodeCount,
    cvs: gridShiftRecords.map(function (r) {return [toRadians(r.longitudeShift), toRadians(r.latitudeShift)];})
  };
}

function toRadians(seconds) {
  return (seconds / 3600) * Math.PI / 180;
}


