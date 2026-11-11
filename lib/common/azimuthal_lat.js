/**
 * Latitude for the inverse of the spherical azimuthal projections.
 *
 * Same angle as asin(cosc * sinphi0 + y * sinc * cosphi0 / rh), but from
 * atan2() of rh * sin(phi) and rh * cos(phi), so that it keeps full precision
 * close to the poles, where asin() of a value near +/-1 loses half the digits.
 *
 * @param {number} x Easting relative to the centre of the projection
 * @param {number} y Northing relative to the centre of the projection
 * @param {number} rh sqrt(x * x + y * y), not 0
 * @param {number} sinc sin of the angular distance from the centre
 * @param {number} cosc cos of the angular distance from the centre
 * @param {number} sinphi0 sin of the latitude of the centre
 * @param {number} cosphi0 cos of the latitude of the centre
 * @returns {number} latitude in radians
 */
export default function (x, y, rh, sinc, cosc, sinphi0, cosphi0) {
  var n = rh * cosc * sinphi0 + y * sinc * cosphi0;
  var e = x * sinc;
  var d = rh * cosc * cosphi0 - y * sinc * sinphi0;
  return Math.atan2(n, Math.sqrt(e * e + d * d));
}
