define(function(require) {
  var common = require('proj4/common');
  var constants = require('proj4/constants');
  return function(defData) {
    var self = {};

    var paramObj = {};
    defData.split("+").map(function(v) {
      return v.trim();
    }).filter(function(a) {
      return a;
    }).forEach(function(a) {
      var split = a.split("=");
      split.push(true);
      paramObj[split[0].toLowerCase()] = split[1];
    });
    var paramName, paramVal, paramOutname;
    var params = {
      proj: 'projName',
      datum: 'datumCode',
      rf: function(v) {
        self.rf = parseFloat(v, 10);
      },
      lat_0: function(v) {
        self.lat0 = v * common.D2R;
      },
      lat_1: function(v) {
        self.lat1 = v * common.D2R;
      },
      lat_2: function(v) {
        self.lat2 = v * common.D2R;
      },
      lat_ts: function(v) {
        self.lat_ts = v * common.D2R;
      },
      lon_0: function(v) {
        self.long0 = v * common.D2R;
      },
      lon_1: function(v) {
        self.long1 = v * common.D2R;
      },
      lon_2: function(v) {
        self.long2 = v * common.D2R;
      },
      alpha: function(v) {
        self.alpha = parseFloat(v) * common.D2R;
      },
      lonc: function(v) {
        self.longc = v * common.D2R;
      },
      x_0: function(v) {
        self.x0 = parseFloat(v, 10);
      },
      y_0: function(v) {
        self.y0 = parseFloat(v, 10);
      },
      k_0: function(v) {
        self.k0 = parseFloat(v, 10);
      },
      k: function(v) {
        self.k0 = parseFloat(v, 10);
      },
      r_a: function() {
        self.R_A = true;
      },
      zone: function(v) {
        self.zone = parseInt(v, 10);
      },
      south: function() {
        self.utmSouth = true;
      },
      towgs84: function(v) {
        self.datum_params = v.split(",").map(function(a) {
          return parseFloat(a, 10);
        });
      },
      to_meter: function(v) {
        self.to_meter = parseFloat(v, 10);
      },
      from_greenwich: function(v) {
        self.from_greenwich = v * common.D2R;
      },
      pm: function(v) {
        self.from_greenwich = (constants.PrimeMeridian[v] ? constants.PrimeMeridian[v] : parseFloat(v, 10)) * common.D2R;
      },
      nadgrids: function(v) {
        if (v==='@null') {
          self.datumCode = 'none';
        } else {
          self.nadgrids = v;
        }
      },
      axis: function(v) {
        var legalAxis = "ewnsud";
        if (v.length === 3 && legalAxis.indexOf(v.substr(0, 1)) !== -1 && legalAxis.indexOf(v.substr(1, 1)) !== -1 && legalAxis.indexOf(v.substr(2, 1)) !== -1) {
          self.axis = v;
        }
      }
    };
    for (paramName in paramObj) {
      paramVal = paramObj[paramName];
      if (paramName in params) {
        paramOutname = params[paramName];
        if (typeof paramOutname === 'function') {
          paramOutname(paramVal);
        }
        else {
          self[paramOutname] = paramVal;
        }
      }
      else {
        self[paramName] = paramVal;
      }
    }
    return self;
  };
});