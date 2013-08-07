define(['./Point','./Proj','./transform'],function(point,proj,transform) {
  var wgs84 = proj('WGS84');
  return function(fromProj, toProj, coord) {
    var transformer = function(f, t, c) {
      var transformedArray;
      if (Array.isArray(c)) {
        transformedArray = transform(f, t, point(c));
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