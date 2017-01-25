// ellipoid pj_set_ell.c
var SIXTH = 0.1666666666666666667;
/* 1/6 */
var RA4 = 0.04722222222222222222;
/* 17/360 */
var RA6 = 0.02215608465608465608;
var EPSLN = 1.0e-10;
import * as Ellipsoid from './constants/Ellipsoid';
import match from './match';

export function eccentricity(a, b, rf, R_A) {
  var a2 = a * a; // used in geocentric
  var b2 = b * b; // used in geocentric
  var es = (a2 - b2) / a2; // e ^ 2
  var e = 0;
  if (R_A) {
    a *= 1 - es * (SIXTH + es * (RA4 + es * RA6));
    a2 = a * a;
    es = 0;
  } else {
    e = Math.sqrt(es); // eccentricity
  }
  var ep2 = (a2 - b2) / b2; // used in geocentric
  return {
    es: es,
    e: e,
    ep2: ep2
  };
}
var wgs84 = match(Ellipsoid, 'WGS84');
export function sphere(a, b, rf, ellps, sphere) {
  if (!a) { // do we have an ellipsoid?
    var ellipse = match(Ellipsoid, ellps);
    if (!ellipse) {
      ellipse = wgs84;
    }
    a = ellipse.a;
    b = ellipse.b;
    rf = ellipse.rf;
  }

  if (rf && !b) {
    b = (1.0 - 1.0 / rf) * a;
  }
  if (rf === 0 || Math.abs(a - b) < EPSLN) {
    sphere = true;
    b = a;
  }
  return {
    a: a,
    b: b,
    rf: rf,
    sphere: sphere
  };
}
