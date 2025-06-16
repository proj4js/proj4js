import e0fn from '../common/e0fn';
import e1fn from '../common/e1fn';
import e2fn from '../common/e2fn';
import e3fn from '../common/e3fn';
import msfnz from '../common/msfnz';
import mlfn from '../common/mlfn';
import adjust_lon from '../common/adjust_lon';
import adjust_lat from '../common/adjust_lat';
import imlfn from '../common/imlfn';
import { EPSLN } from '../constants/values';

/**
 * @typedef {Object} LocalThis
 * @property {number} temp
 * @property {number} es
 * @property {number} e
 * @property {number} e0
 * @property {number} e1
 * @property {number} e2
 * @property {number} e3
 * @property {number} sin_phi
 * @property {number} cos_phi
 * @property {number} ms1
 * @property {number} ml1
 * @property {number} ms2
 * @property {number} ml2
 * @property {number} ns
 * @property {number} g
 * @property {number} ml0
 * @property {number} rh
 */

/** @this {import('../defs.js').ProjectionDefinition & LocalThis} */
export function init() {
  /* Place parameters in static storage for common use
      ------------------------------------------------- */
  // Standard Parallels cannot be equal and on opposite sides of the equator
  if (Math.abs(this.lat1 + this.lat2) < EPSLN) {
    return;
  }
  this.lat2 = this.lat2 || this.lat1;
  this.temp = this.b / this.a;
  this.es = 1 - Math.pow(this.temp, 2);
  this.e = Math.sqrt(this.es);
  this.e0 = e0fn(this.es);
  this.e1 = e1fn(this.es);
  this.e2 = e2fn(this.es);
  this.e3 = e3fn(this.es);

  this.sin_phi = Math.sin(this.lat1);
  this.cos_phi = Math.cos(this.lat1);

  this.ms1 = msfnz(this.e, this.sin_phi, this.cos_phi);
  this.ml1 = mlfn(this.e0, this.e1, this.e2, this.e3, this.lat1);

  if (Math.abs(this.lat1 - this.lat2) < EPSLN) {
    this.ns = this.sin_phi;
  } else {
    this.sin_phi = Math.sin(this.lat2);
    this.cos_phi = Math.cos(this.lat2);
    this.ms2 = msfnz(this.e, this.sin_phi, this.cos_phi);
    this.ml2 = mlfn(this.e0, this.e1, this.e2, this.e3, this.lat2);
    this.ns = (this.ms1 - this.ms2) / (this.ml2 - this.ml1);
  }
  this.g = this.ml1 + this.ms1 / this.ns;
  this.ml0 = mlfn(this.e0, this.e1, this.e2, this.e3, this.lat0);
  this.rh = this.a * (this.g - this.ml0);
}

/* Equidistant Conic forward equations--mapping lat,long to x,y
  ----------------------------------------------------------- */
export function forward(p) {
  var lon = p.x;
  var lat = p.y;
  var rh1;

  /* Forward equations
      ----------------- */
  if (this.sphere) {
    rh1 = this.a * (this.g - lat);
  } else {
    var ml = mlfn(this.e0, this.e1, this.e2, this.e3, lat);
    rh1 = this.a * (this.g - ml);
  }
  var theta = this.ns * adjust_lon(lon - this.long0);
  var x = this.x0 + rh1 * Math.sin(theta);
  var y = this.y0 + this.rh - rh1 * Math.cos(theta);
  p.x = x;
  p.y = y;
  return p;
}

/* Inverse equations
  ----------------- */
export function inverse(p) {
  p.x -= this.x0;
  p.y = this.rh - p.y + this.y0;
  var con, rh1, lat, lon;
  if (this.ns >= 0) {
    rh1 = Math.sqrt(p.x * p.x + p.y * p.y);
    con = 1;
  } else {
    rh1 = -Math.sqrt(p.x * p.x + p.y * p.y);
    con = -1;
  }
  var theta = 0;
  if (rh1 !== 0) {
    theta = Math.atan2(con * p.x, con * p.y);
  }

  if (this.sphere) {
    lon = adjust_lon(this.long0 + theta / this.ns);
    lat = adjust_lat(this.g - rh1 / this.a);
    p.x = lon;
    p.y = lat;
    return p;
  } else {
    var ml = this.g - rh1 / this.a;
    lat = imlfn(ml, this.e0, this.e1, this.e2, this.e3);
    lon = adjust_lon(this.long0 + theta / this.ns);
    p.x = lon;
    p.y = lat;
    return p;
  }
}

export var names = ['Equidistant_Conic', 'eqdc'];
export default {
  init: init,
  forward: forward,
  inverse: inverse,
  names: names
};
