define(function(require) {
  var point = require('proj4/Point');
  var proj = require('proj4/Proj');
  var transform = require('proj4/transform');
  var wgs84 = proj('WGS84');
  function transformer(from, to, coords) {
    var transformedArray;
    if (Array.isArray(coords)) {
      transformedArray = transform(from, to, point(coords));
      if (coords.length === 3) {
        return [transformedArray.x, transformedArray.y, transformedArray.z];
      }
      else {
        return [transformedArray.x, transformedArray.y];
      }
    }
    else {
      return transform(from, to, coords);
    }
  }
  function checkProj(item){
    if(item instanceof proj){
      return item;
    }
    if(item.oProj){
      return item.oProj;
    }
    return proj(item);
  }
  return function(fromProj, toProj, coord) {
    fromProj = checkProj(fromProj);
    var single = false;
    var obj;
    if (typeof toProj === 'undefined') {
      toProj = fromProj;
      fromProj = wgs84;
      single = true;
    } else if (typeof toProj.x!=='undefined' || Array.isArray(toProj)) {
      coord = toProj;
      toProj = fromProj;
      fromProj = wgs84;
      single = true;
    }
    toProj = checkProj(toProj);
    if (coord) {
      return transformer(fromProj, toProj, coord);
    }
    else {
      obj = {
        forward: function(coords) {
          return transformer(fromProj, toProj, coords);
        },
        inverse: function(coords) {
          return transformer(toProj, fromProj, coords);
        }
      };
      if(single){
        obj.oProj = toProj;
      }
      return obj;
    }
  };
});