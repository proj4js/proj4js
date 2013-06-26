proj4.defs = function(name) {
  /*global console*/
  var defData;
  if(arguments.length === 2){
    defData = arguments[1];
  }else if(arguments.length===1){
    if(Array.isArray(name)){
      return name.map(function(v){
        if(Array.isArray(v)){
          proj4.defs.apply(proj4,v);
        }else{
          proj4.defs(v);
        }
      });
    }else if(typeof name === 'string'){
      
    }else if('EPSG' in name){
      proj4.defs['EPSG:'+name.EPSG]=name;
    }else{
      console.log(name);
    }
    return;
  }
  var self = {};
  var nameSplit;
  if (name.indexOf(":") > -1) {
    nameSplit = name.split(":");
    self[nameSplit[0]] = nameSplit[1];
  }
  var paramObj = {};
  defData.split("+").map(function(v) {
    return v.trim();
  }).filter(function(a) {
    return a;
  }).forEach(function(a) {
    var split = a.split("=");
    if (split[1] === "@null") {
      return;
    }
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
      self.lat0 = v * proj4.common.D2R;
    },
    lat_1: function(v) {
      self.lat1 = v * proj4.common.D2R;
    },
    lat_2: function(v) {
      self.lat2 = v * proj4.common.D2R;
    },
    lat_ts: function(v) {
      self.lat_ts = v * proj4.common.D2R;
    },
    lon_0: function(v) {
      self.long0 = v * proj4.common.D2R;
    },
    lon_1: function(v) {
      self.long1 = v * proj4.common.D2R;
    },
    lon_2: function(v) {
      self.long2 = v * proj4.common.D2R;
    },
    alpha: function(v) {
      self.alpha = parseFloat(v) * proj4.common.D2R;
    },
    lonc: function(v) {
      self.longc = v * proj4.common.D2R;
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
      self.from_greenwich = v * proj4.common.D2R;
    },
    pm: function(v) {
      self.from_greenwich = (proj4.PrimeMeridian[v] ? proj4.PrimeMeridian[v] : parseFloat(v, 10)) * proj4.common.D2R;
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
  proj4.defs[name] = self;
};
proj4.defToJson = function(str){
  return JSON.stringify(proj4.defs[str]);
};
