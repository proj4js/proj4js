import adjust_lat from '../common/adjust_lat';
import adjust_lon from '../common/adjust_lon';
import hypot from '../common/hypot';
import pj_enfn from '../common/pj_enfn';
import pj_inv_mlfn from '../common/pj_inv_mlfn';
import pj_mlfn from '../common/pj_mlfn';
import { HALF_PI } from '../constants/values';

/**
 * @typedef {Object} LocalThis
 * @property {number} phi1
 * @property {number} cphi1
 * @property {number} es
 * @property {Array<number>} en
 * @property {number} m1
 * @property {number} am1
 */

var EPS10 = 1e-10;

/** @this {import('../defs.js').ProjectionDefinition & LocalThis} */
export function init() {
  var c;

  this.phi1 = this.lat1;
  if (Math.abs(this.phi1) < EPS10) {
    throw new Error();
  }
  if (this.es) {
    this.en = pj_enfn(this.es);
    this.m1 = pj_mlfn(this.phi1, this.am1 = Math.sin(this.phi1),
      c = Math.cos(this.phi1), this.en);
    this.am1 = c / (Math.sqrt(1 - this.es * this.am1 * this.am1) * this.am1);
    this.inverse = e_inv;
    this.forward = e_fwd;
  } else {
    if (Math.abs(this.phi1) + EPS10 >= HALF_PI) {
      this.cphi1 = 0;
    } else {
      this.cphi1 = 1 / Math.tan(this.phi1);
    }
    this.inverse = s_inv;
    this.forward = s_fwd;
  }
}

function e_fwd(p) {
  var lam = adjust_lon(p.x - (this.long0 || 0));
  var phi = p.y;
  var rh, E, c;
  rh = this.am1 + this.m1 - pj_mlfn(phi, E = Math.sin(phi), c = Math.cos(phi), this.en);
  E = c * lam / (rh * Math.sqrt(1 - this.es * E * E));
  p.x = rh * Math.sin(E);
  p.y = this.am1 - rh * Math.cos(E);

  p.x = this.a * p.x + (this.x0 || 0);
  p.y = this.a * p.y + (this.y0 || 0);
  return p;
}

function e_inv(p) {
  p.x = (p.x - (this.x0 || 0)) / this.a;
  p.y = (p.y - (this.y0 || 0)) / this.a;

  var s, rh, lam, phi;
  rh = hypot(p.x, p.y = this.am1 - p.y);
  phi = pj_inv_mlfn(this.am1 + this.m1 - rh, this.es, this.en);
  if ((s = Math.abs(phi)) < HALF_PI) {
    s = Math.sin(phi);
    lam = rh * Math.atan2(p.x, p.y) * Math.sqrt(1 - this.es * s * s) / Math.cos(phi);
  } else if (Math.abs(s - HALF_PI) <= EPS10) {
    lam = 0;
  } else {
    throw new Error();
  }
  p.x = adjust_lon(lam + (this.long0 || 0));
  p.y = adjust_lat(phi);
  return p;
}

function s_fwd(p) {
  var lam = adjust_lon(p.x - (this.long0 || 0));
  var phi = p.y;
  var E, rh;
  rh = this.cphi1 + this.phi1 - phi;
  if (Math.abs(rh) > EPS10) {
    p.x = rh * Math.sin(E = lam * Math.cos(phi) / rh);
    p.y = this.cphi1 - rh * Math.cos(E);
  } else {
    p.x = p.y = 0;
  }

  p.x = this.a * p.x + (this.x0 || 0);
  p.y = this.a * p.y + (this.y0 || 0);
  return p;
}

function s_inv(p) {
  p.x = (p.x - (this.x0 || 0)) / this.a;
  p.y = (p.y - (this.y0 || 0)) / this.a;

  var lam, phi;
  var rh = hypot(p.x, p.y = this.cphi1 - p.y);
  phi = this.cphi1 + this.phi1 - rh;
  if (Math.abs(phi) > HALF_PI) {
    throw new Error();
  }
  if (Math.abs(Math.abs(phi) - HALF_PI) <= EPS10) {
    lam = 0;
  } else {
    lam = rh * Math.atan2(p.x, p.y) / Math.cos(phi);
  }
  p.x = adjust_lon(lam + (this.long0 || 0));
  p.y = adjust_lat(phi);
  return p;
}

export var names = ['bonne', 'Bonne (Werner lat_1=90)'];
export default {
  init: init,
  names: names
};
