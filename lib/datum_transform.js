var PJD_3PARAM = 1;
var PJD_7PARAM = 2;
var PJD_NODATUM = 5; // WGS84 or equivalent
var datum = require('./datumUtils');
function checkParams(type) {
  return (type === PJD_3PARAM || type === PJD_7PARAM);
}
module.exports = function(source, dest, point) {
  // Short cut if the datums are identical.
  if (datum.compareDatums(source, dest)) {
    return point; // in this case, zero is sucess,
    // whereas cs_compare_datums returns 1 to indicate TRUE
    // confusing, should fix this
  }

  // Explicitly skip datum transform by setting 'datum=none' as parameter for either source or dest
  if (source.datum_type === PJD_NODATUM || dest.datum_type === PJD_NODATUM) {
    return point;
  }

  // If this datum requires grid shifts, then apply it to geodetic coordinates.

  // Do we need to go through geocentric coordinates?
  if (source.es === dest.es && source.a === dest.a && !checkParams(source.datum_type) &&  !checkParams(dest.datum_type)) {
    return point;
  }

  // Convert to geocentric coordinates.
  point = datum.geodeticToGeocentric(point, source.es, source.a);
  // Convert between datums
  if (checkParams(source.datum_type)) {
    point = datum.geocentricToWgs84(point, source.datum_type, source.datum_params);
  }
  if (checkParams(dest.datum_type)) {
    point = datum.geocentricFromWgs84(point, dest.datum_type, dest.datum_params);
  }
  return datum.geocentricToGeodetic(point, dest.es, dest.a, dest.b);

};
