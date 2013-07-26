define(function(require, exports, module) {
  var common = require('./common');
  var constants = require('./constants');
  function wkt(wktStr,self) {
    self = self || {};
    var wktMatch = wktStr.match(/^(\w+)\[(.*)\]$/);
    if (!wktMatch) {
      return;
    }
    var wktObject = wktMatch[1];
    var wktContent = wktMatch[2];
    var wktTemp = wktContent.split(",");
    var wktName;
    if (wktObject.toUpperCase() === "TOWGS84") {
      wktName = wktObject; //no name supplied for the TOWGS84 array
    }
    else {
      wktName = wktTemp.shift();
    }
    wktName = wktName.trim().replace(/^\"/, "").replace(/\"$/, "");

    var wktArray = [];
    var bkCount = 0;
    var obj = "";
    for (var i = 0; i < wktTemp.length; ++i) {
      var token = wktTemp[i];
      for (var j2 = 0; j2 < token.length; ++j2) {
        if (token.charAt(j2) === "[") {
          ++bkCount;
        }
        if (token.charAt(j2) === "]") {
          --bkCount;
        }
      }
      obj += token;
      if (bkCount === 0) {
        wktArray.push(obj);
        obj = "";
      }
      else {
        obj += ",";
      }
    }

    //g is grotesque -cwm
    var name, value;
    switch (wktObject) {
    case 'LOCAL_CS':
      self.projName = 'identity';
      self.localCS = true;
      self.srsCode = wktName;
      break;
    case 'GEOGCS':
      self.projName = 'longlat';
      self.geocsCode = wktName;
      if (!self.srsCode) {
        self.srsCode = wktName;
      }
      break;
    case 'PROJCS':
      self.srsCode = wktName;
      break;
    case 'GEOCCS':
      break;
    case 'PROJECTION':
      self.projName = constants.wktProjections[wktName];
      break;
    case 'DATUM':
      self.datumName = wktName;
      break;
    case 'LOCAL_DATUM':
      self.datumCode = 'none';
      break;
    case 'SPHEROID':
      self.ellps = wktName;
      self.a = parseFloat(wktArray.shift());
      self.rf = parseFloat(wktArray.shift());
      break;
    case 'PRIMEM':
      self.from_greenwich = parseFloat(wktArray.shift()); //to radians?
      break;
    case 'UNIT':
      self.units = wktName;
      self.unitsPerMeter = parseFloat(wktArray.shift());
      break;
    case 'PARAMETER':
      name = wktName.toLowerCase();
      value = parseFloat(wktArray.shift());
      //there may be many variations on the wktName values, add in case
      //statements as required
      switch (name) {
      case 'false_easting':
        self.x0 = value;
        break;
      case 'false_northing':
        self.y0 = value;
        break;
      case 'scale_factor':
        self.k0 = value;
        break;
      case 'central_meridian':
        self.long0 = value * common.D2R;
        break;
      case 'latitude_of_origin':
        self.lat0 = value * common.D2R;
        break;
      case 'more_here':
        break;
      default:
        break;
      }
      break;
    case 'TOWGS84':
      self.datum_params = wktArray;
      break;
      //DGR 2010-11-12: AXIS
    case 'AXIS':
      name = wktName.toLowerCase();
      value = wktArray.shift();
      switch (value) {
      case 'EAST':
        value = 'e';
        break;
      case 'WEST':
        value = 'w';
        break;
      case 'NORTH':
        value = 'n';
        break;
      case 'SOUTH':
        value = 's';
        break;
      case 'UP':
        value = 'u';
        break;
      case 'DOWN':
        value = 'd';
        break;
        //case 'OTHER': 
      default:
        value = ' ';
        break; //FIXME
      }
      if (!self.axis) {
        self.axis = "enu";
      }
      switch (name) {
      case 'x':
        self.axis = value + self.axis.substr(1, 2);
        break;
      case 'y':
        self.axis = self.axis.substr(0, 1) + value + self.axis.substr(2, 1);
        break;
      case 'z':
        self.axis = self.axis.substr(0, 2) + value;
        break;
      default:
        break;
      }
      break;
    case 'MORE_HERE':
      break;
    default:
      break;
    }
    for (var j = 0; j < wktArray.length; ++j) {
      wkt(wktArray[j],self);
    }
    return self;
  }
  module.exports = wkt;
});
