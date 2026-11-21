import adjust_lon from '../common/adjust_lon';
import { HALF_PI } from '../constants/values';

/**
 * Winkel Tripel projection: the mean of the Aitoff and the equirectangular
 * projection with standard parallel lat_1. Always spherical, like PROJ.
 * The inverse uses Newton's method (Bildirici, 2016), as in PROJ.
 *
 * @typedef {Object} LocalThis
 * @property {number} cosphi1
 * @property {number} es
 */

/** @this {import('../defs.js').ProjectionDefinition & LocalThis} */
export function init() {
  this.sphere = true;
  this.b = this.a;
  this.es = 0;

  if (this.lat1 === undefined) {
    this.cosphi1 = 2 / Math.PI;
  } else {
    this.cosphi1 = Math.cos(this.lat1);
    if (this.cosphi1 === 0) {
      throw new Error('Invalid value for lat_1: ' + this.lat1);
    }
  }
}

function project(lam, phi, cosphi1) {
  var x = 0;
  var y = 0;
  var c = 0.5 * lam;
  var d = Math.acos(Math.cos(phi) * Math.cos(c));
  if (d !== 0) {
    var s = d / Math.sin(d);
    x = 2 * s * Math.cos(phi) * Math.sin(c);
    y = s * Math.sin(phi);
  }
  return [0.5 * (x + lam * cosphi1), 0.5 * (y + phi)];
}

/** @this {import('../defs.js').ProjectionDefinition & LocalThis} */
export function forward(p) {
  var xy = project(adjust_lon(p.x - this.long0, this.over), p.y, this.cosphi1);
  p.x = this.a * xy[0] + this.x0;
  p.y = this.a * xy[1] + this.y0;
  return p;
}

/** @this {import('../defs.js').ProjectionDefinition & LocalThis} */
export function inverse(p) {
  var EPS = 1e-12;
  var x = (p.x - this.x0) / this.a;
  var y = (p.y - this.y0) / this.a;
  var lam = x;
  var phi = y;
  var round = 0;
  var xy, iter, sl, cl, sp, cp, d, c, f1, f2, f1p, f1l, f2p, f2l, det, dp, dl;

  if (Math.abs(x) < EPS && Math.abs(y) < EPS) {
    lam = 0;
    phi = 0;
  } else {
    do {
      iter = 0;
      do {
        sl = Math.sin(0.5 * lam);
        cl = Math.cos(0.5 * lam);
        sp = Math.sin(phi);
        cp = Math.cos(phi);
        d = cp * cl;
        c = 1 - d * d;
        d = Math.acos(d) / Math.pow(c, 1.5);
        f1 = 0.5 * (2 * d * c * cp * sl + lam * this.cosphi1) - x;
        f2 = 0.5 * (d * c * sp + phi) - y;
        f1p = sl * cl * sp * cp / c - d * sp * sl;
        f1l = 0.5 * (cp * cp * sl * sl / c + d * cp * cl * sp * sp + this.cosphi1);
        f2p = 0.5 * (sp * sp * cl / c + d * sl * sl * cp + 1);
        f2l = 0.25 * (sp * cp * sl / c - d * sp * cp * cp * sl * cl);
        det = f1p * f2l - f2p * f1l;
        dl = ((f2 * f1p - f1 * f2p) / det) % Math.PI;
        dp = (f1 * f2l - f2 * f1l) / det;
        phi -= dp;
        lam -= dl;
      } while ((Math.abs(dp) > EPS || Math.abs(dl) > EPS) && iter++ < 10);
      if (phi > HALF_PI) {
        phi -= 2 * (phi - HALF_PI);
      }
      if (phi < -HALF_PI) {
        phi -= 2 * (phi + HALF_PI);
      }
      xy = project(lam, phi, this.cosphi1);
    } while ((Math.abs(x - xy[0]) > EPS || Math.abs(y - xy[1]) > EPS) && round++ < 20);
  }

  p.x = adjust_lon(lam + this.long0, this.over);
  p.y = phi;
  return p;
}

export var names = ['Winkel_Tripel', 'wintri'];
export default {
  init: init,
  forward: forward,
  inverse: inverse,
  names: names
};
