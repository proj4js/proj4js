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
  return function(fromProj, toProj, coord) {
    fromProj = fromProj instanceof proj ? fromProj :proj(fromProj);
    if (typeof toProj === 'undefined') {
      toProj = fromProj;
      fromProj = wgs84;
    }
    else if (typeof toProj === 'string') {
      toProj = proj(toProj);
    }
    else if (('x' in toProj) || Array.isArray(toProj)) {
      coord = toProj;
      toProj = fromProj;
      fromProj = wgs84;
    }
    else {
      toProj = toProj instanceof proj ? toProj : proj(toProj);
    }
    if (coord) {
      return transformer(fromProj, toProj, coord);
    }
    else {
      return {
        forward: function(coords) {
          return transformer(fromProj, toProj, coords);
        },
        inverse: function(coords) {
          return transformer(toProj, fromProj, coords);
        }
      };
    }
  };
});