import pj_enfn from '../common/pj_enfn';
import pj_mlfn from '../common/pj_mlfn';
import pj_inv_mlfn from '../common/pj_inv_mlfn';
import adjust_lon from '../common/adjust_lon';
import adjust_lat from '../common/adjust_lat';
import { HALF_PI, EPSLN } from '../constants/values';
import { getNormalizedProjName } from '../projections';

var C1 = 1 / 6;
var C2 = 1 / 120;
var C3 = 1 / 24;
var C4 = 1 / 3;
var C5 = 1 / 15;

/**
 * @typedef {Object} LocalThis
 * @property {number} es
 * @property {Array<number>} en
 * @property {number} m0
 */

/** @this {import('../defs.js').ProjectionDefinition & LocalThis} */
export function init() {
  this.hyperbolic = Boolean(this.hyperbolic) || getNormalizedProjName(this.projName).toLowerCase() === 'hyperbolic_cassini_soldner';
  if (!this.sphere) {
    this.en = pj_enfn(this.es);
    this.m0 = pj_mlfn(this.lat0, Math.sin(this.lat0), Math.cos(this.lat0), this.en);
  }
}

/**
 * Ellipsoidal forward on a unit semi-major axis, as in PROJ's cass.cpp.
 * @param {number} lam longitude relative to the central meridian
 * @param {number} phi latitude
 * @param {number} es
 * @param {Array<number>} en
 * @param {number} m0
 * @param {boolean} [hyperbolic] EPSG's Hyperbolic Cassini-Soldner (method 9833)
 * @returns {Array<number>} [x, y]
 */
function e_fwd(lam, phi, es, en, m0, hyperbolic) {
  var sinphi = Math.sin(phi);
  var cosphi = Math.cos(phi);
  var M = pj_mlfn(phi, sinphi, cosphi, en);
  var nu = 1 / Math.sqrt(1 - es * sinphi * sinphi);
  var tanphi = Math.tan(phi);
  var T = tanphi * tanphi;
  var A = lam * cosphi;
  var C = es * cosphi * cosphi / (1 - es);
  var A2 = A * A;

  var x = nu * A * (1 - A2 * T * (C1 + (8 - T + 8 * C) * A2 * C2));
  var y = M - m0 + nu * tanphi * A2 * (0.5 + (5 - T + 6 * C) * A2 * C3);
  if (hyperbolic) {
    var rho = nu * nu * nu * (1 - es);
    y -= y * y * y / (6 * rho * nu);
  }
  return [x, y];
}

/**
 * Refines an approximate inverse with Newton-Raphson on a numerical Jacobian
 * of the forward, as PROJ's pj_generic_inverse_2d.
 * @see https://github.com/OSGeo/PROJ/blob/9.8.1/src/generic_inverse.cpp
 * @param {function(number, number): Array<number>} fwd
 * @param {number} x
 * @param {number} y
 * @param {number} lam initial longitude
 * @param {number} phi initial latitude
 * @returns {Array<number>|null} [lam, phi], or null if 15 iterations do not converge
 */
function generic_inverse_2d(fwd, x, y, lam, phi) {
  var deriv_lam_X = 0;
  var deriv_lam_Y = 0;
  var deriv_phi_X = 0;
  var deriv_phi_Y = 0;
  for (var i = 0; i < 15; i++) {
    var xyApprox = fwd(lam, phi);
    var deltaX = xyApprox[0] - x;
    var deltaY = xyApprox[1] - y;
    if (Math.abs(deltaX) < 1e-12 && Math.abs(deltaY) < 1e-12) {
      return [lam, phi];
    }

    if (i === 0 || Math.abs(deltaX) > 1e-6 || Math.abs(deltaY) > 1e-6) {
      var dLam = lam > 0 ? -1e-6 : 1e-6;
      var xy2 = fwd(lam + dLam, phi);
      var deriv_X_lam = (xy2[0] - xyApprox[0]) / dLam;
      var deriv_Y_lam = (xy2[1] - xyApprox[1]) / dLam;

      var dPhi = phi > 0 ? -1e-6 : 1e-6;
      xy2 = fwd(lam, phi + dPhi);
      var deriv_X_phi = (xy2[0] - xyApprox[0]) / dPhi;
      var deriv_Y_phi = (xy2[1] - xyApprox[1]) / dPhi;

      var det = deriv_X_lam * deriv_Y_phi - deriv_X_phi * deriv_Y_lam;
      if (det !== 0) {
        deriv_lam_X = deriv_Y_phi / det;
        deriv_lam_Y = -deriv_X_phi / det;
        deriv_phi_X = -deriv_Y_lam / det;
        deriv_phi_Y = deriv_X_lam / det;
      }
    }

    lam -= Math.max(Math.min(deltaX * deriv_lam_X + deltaY * deriv_lam_Y, 0.3), -0.3);
    lam = Math.max(Math.min(lam, Math.PI), -Math.PI);
    phi -= Math.max(Math.min(deltaX * deriv_phi_X + deltaY * deriv_phi_Y, 0.3), -0.3);
    phi = Math.max(Math.min(phi, HALF_PI), -HALF_PI);
  }
  return null;
}

/* Cassini forward equations--mapping lat,long to x,y
  ----------------------------------------------------------------------- */
export function forward(p) {
  /* Forward equations
      ----------------- */
  var x, y;
  var lam = p.x;
  var phi = p.y;
  lam = adjust_lon(lam - this.long0, this.over);

  if (this.sphere) {
    x = this.a * Math.asin(Math.cos(phi) * Math.sin(lam));
    y = this.a * (Math.atan2(Math.tan(phi), Math.cos(lam)) - this.lat0);
  } else {
    // ellipsoid
    var xy = e_fwd(lam, phi, this.es, this.en, this.m0, this.hyperbolic);
    x = this.a * xy[0];
    y = this.a * xy[1];
  }

  p.x = x + this.x0;
  p.y = y + this.y0;
  return p;
}

/* Inverse equations
  ----------------- */
export function inverse(p) {
  p.x -= this.x0;
  p.y -= this.y0;
  var x = p.x / this.a;
  var y = p.y / this.a;
  var phi, lam;

  if (this.sphere) {
    var dd = y + this.lat0;
    phi = Math.asin(Math.sin(dd) * Math.cos(x));
    lam = Math.atan2(Math.tan(x), Math.cos(dd));
  } else {
    /* ellipsoid */
    var es = this.es;
    var en = this.en;
    var m0 = this.m0;
    var hyperbolic = this.hyperbolic;
    var phi1 = pj_inv_mlfn(m0 + y, es, en);
    if (Math.abs(Math.abs(phi1) - HALF_PI) <= EPSLN) {
      p.x = this.long0;
      p.y = HALF_PI;
      if (y < 0) {
        p.y *= -1;
      }
      return p;
    }
    var tanphi1 = Math.tan(phi1);
    var T1 = tanphi1 * tanphi1;
    var sinphi1 = Math.sin(phi1);
    var nu1 = 1 / Math.sqrt(1 - es * sinphi1 * sinphi1);
    var rho1 = nu1 * nu1 * nu1 * (1 - es);
    var D = x / nu1;
    var D2 = D * D;
    phi = phi1 - (nu1 * tanphi1 / rho1) * D2 * (0.5 - (1 + 3 * T1) * D2 * C3);
    lam = D * (1 + T1 * D2 * (-C4 + (1 + 3 * T1) * D2 * C5)) / Math.cos(phi1);

    var lp = generic_inverse_2d(function (lamTry, phiTry) {
      return e_fwd(lamTry, phiTry, es, en, m0, hyperbolic);
    }, x, y, lam, phi);
    if (!lp) {
      return null;
    }
    lam = lp[0];
    phi = lp[1];
  }

  p.x = adjust_lon(lam + this.long0, this.over);
  p.y = this.sphere ? adjust_lat(phi) : phi;
  return p;
}

export var names = ['Cassini', 'Cassini_Soldner', 'Hyperbolic_Cassini_Soldner', 'cass'];
export default {
  init: init,
  forward: forward,
  inverse: inverse,
  names: names
};
