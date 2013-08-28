define(['./extend','./constants','./common'],function(extend,constants,common) {
  /*function flatten(a) {
    var out = [];
    a.forEach(function(v) {
      if (Array.isArray(v)) {
        out = out.concat(v);
      }
      else {
        out.push(v);
      }
    });
    if (out.every(function(aa) {
      return !Array.isArray(aa);
    })) {
      return out;
    }
    return flatten(out);
  }*/

  function mapit(obj, key, v) {
    obj[key] = v.map(function(aa) {
      var o = {};
      fromLisp(aa, o);
      return o;
    }).reduce(function(a, b) {
      return extend(a, b);
    }, {});
  }

  function fromLisp(v, obj) {
    var key;
    if (!Array.isArray(v)) {
      obj[v] = true;
      return;
    }
    else {
      key = v.shift();
      if (key === 'PARAMETER') {
        key = v.shift();
      }
      if (v.length === 1) {
        if (Array.isArray(v[0])) {
          obj[key] = {};
          fromLisp(v[0], obj[key]);
        }
        else {
          obj[key] = v[0];
        }
      }
      else if (!v.length) {
        obj[key] = true;
      }
      else if (key === 'TOWGS84') {
        obj[key] = v;
      }
      else {
        obj[key] = {};
        if (['UNIT', 'PRIMEM', 'VERT_DATUM'].indexOf(key) > -1) {
          obj[key] = {
            name: v[0],
            convert: v[1]
          };
          if (v.length === 3) {
            obj[key].auth = v[2];
          }
        }
        else if (key === 'SPHEROID') {
          obj[key] = {
            name: v[0],
            a: v[1],
            rf: v[2]
          };
          if (v.length === 4) {
            obj[key].auth = v[3];
          }
        }
        else if (['GEOGCS', 'GEOCCS', 'DATUM', 'VERT_CS', 'COMPD_CS', 'LOCAL_CS', 'FITTED_CS', 'LOCAL_DATUM'].indexOf(key) > -1) {
          v[0] = ['name', v[0]];
          mapit(obj, key, v);
        }
        else if (v.every(function(aa) {
          return Array.isArray(aa);
        })) {
          mapit(obj, key, v);
        }
        else {
          fromLisp(v, obj[key]);
        }
      }
    }
  }
  function cleanWKT(wkt){
    if(wkt.type === 'GEOGCS'){
      wkt.projName = 'longlat';
    }else if(wkt.type === 'LOCAL_CS'){
      wkt.projName = 'identity';
      wkt.local=true;
    }else{
      wkt.projName = constants.wktProjections[wkt.PROJECTION];
    }
    if(wkt.UNIT){
      wkt.units=wkt.UNIT.name;
      wkt.unitsPerMeter=wkt.UNIT.convert;
    }
    if(wkt.GEOGCS){
      wkt.datumName=wkt.GEOGCS.name;
      if(wkt.GEOGCS.DATUM && wkt.GEOGCS.DATUM.SPHEROID){
        wkt.ellps=wkt.GEOGCS.DATUM.SPHEROID.name.replace('_19','');
        wkt.a = wkt.GEOGCS.DATUM.SPHEROID.a;
        wkt.rf = wkt.GEOGCS.DATUM.SPHEROID.rf;
      }
    }
    wkt.false_easting=wkt.False_Easting;
    wkt.false_northing=wkt.False_Northing;
    wkt.central_meridian=wkt.Central_Meridian;
    wkt.latitude_of_origin = wkt.Latitude_Of_Origin;
    wkt.scale_factor=wkt.Scale_Factor;
    wkt.x0 = parseFloat(wkt.false_easting,10);
    wkt.y0 = parseFloat(wkt.false_northing,10);
    wkt.lat1=wkt.Standard_Parallel_1 * common.D2R;
    wkt.lat2=wkt.Standard_Parallel_2 * common.D2R;
    wkt.k0=wkt.scale_factor;
    if(wkt.central_meridian){
      wkt.long0 = wkt.central_meridian * common.D2R;
    }
    if(wkt.latitude_of_origin){
      wkt.lat0 = wkt.latitude_of_origin * common.D2R;
    }
    wkt.srsCode = wkt.name;
  }
  return function(wkt, self) {
    var lisp = JSON.parse(("," + wkt).replace(/\,([A-Z_0-9]+?)(\[)/g, ',["$1",').slice(1).replace(/\,([A-Z_0-9]+?)\]/g, ',"$1"]'));
    var type = lisp.shift();
    var name = lisp.shift();
    lisp.unshift(['name', name]);
    lisp.unshift(['type', type]);
    lisp.unshift('output');
    var obj = {};
    fromLisp(lisp, obj);
    cleanWKT(obj.output);
    return extend(self,obj.output);
  };
});
