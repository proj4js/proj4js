define(function(require, exports, module) {
  var Point = require('./Point');
  var Proj = require('./Proj');
  var transform = require('transform');
  var wgs84 = new Proj('WGS84');
  module.exports = function(fromProj, toProj, coord) {
    var transformer = function(f, t, c) {
      var transformedArray;
      if (Array.isArray(c)) {
        transformedArray = transform(f, t, new Point(c));
        if (c.length === 3) {
          return [transformedArray.x, transformedArray.y, transformedArray.z];
        }
        else {
          return [transformedArray.x, transformedArray.y];
        }
      }
      else {
        return transform(fromProj, toProj, c);
      }
    };

    fromProj = fromProj instanceof Proj ? fromProj : new Proj(fromProj);
    if (typeof toProj === 'undefined') {
      toProj = fromProj;
      fromProj = wgs84;
    }
    else if (typeof toProj === 'string') {
      toProj = new Proj(toProj);
    }
    else if (('x' in toProj) || Array.isArray(toProj)) {
      coord = toProj;
      toProj = fromProj;
      fromProj = wgs84;
    }
    else {
      toProj = toProj instanceof Proj ? toProj : new Proj(toProj);
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