define(function(require) {
  var common = require('proj4/common');
  var datum_transform = require('proj4/datum_transform');
  var adjust_axis = require('proj4/adjust_axis');
  var proj = require('proj4/Proj');
  return function transform(source, dest, point) {
    var wgs84;

    function checkNotWGS(source, dest) {
      return ((source.datum.datum_type === common.PJD_3PARAM || source.datum.datum_type === common.PJD_7PARAM) && dest.datumCode !== "WGS84");
    }

    // Workaround for datum shifts towgs84, if either source or destination projection is not wgs84
    if (source.datum && dest.datum && (checkNotWGS(source, dest) || checkNotWGS(dest, source))) {
      wgs84 = new proj('WGS84');
      transform(source, wgs84, point);
      source = wgs84;
    }
    // DGR, 2010/11/12
    if (source.axis !== "enu") {
      adjust_axis(source, false, point);
    }
    // Transform source points to long/lat, if they aren't already.
    if (source.projName === "longlat") {
      point.x *= common.D2R; // convert degrees to radians
      point.y *= common.D2R;
    }
    else {
      if (source.to_meter) {
        point.x *= source.to_meter;
        point.y *= source.to_meter;
      }
      source.inverse(point); // Convert Cartesian to longlat
    }
    // Adjust for the prime meridian if necessary
    if (source.from_greenwich) {
      point.x += source.from_greenwich;
    }

    // Convert datums if needed, and if possible.
    point = datum_transform(source.datum, dest.datum, point);

    // Adjust for the prime meridian if necessary
    if (dest.from_greenwich) {
      point.x -= dest.from_greenwich;
    }

    if (dest.projName === "longlat") {
      // convert radians to decimal degrees
      point.x *= common.R2D;
      point.y *= common.R2D;
    }
    else { // else project
      dest.forward(point);
      if (dest.to_meter) {
        point.x /= dest.to_meter;
        point.y /= dest.to_meter;
      }
    }

    // DGR, 2010/11/12
    if (dest.axis !== "enu") {
      adjust_axis(dest, true, point);
    }

    return point;
  };
});
