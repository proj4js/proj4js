import adjust_lon from '../common/adjust_lon';
import adjust_lat from '../common/adjust_lat';
import pj_enfn from '../common/pj_enfn';
import pj_mlfn from '../common/pj_mlfn';
import pj_inv_mlfn from '../common/pj_inv_mlfn';

/**
 * @typedef {Object} LocalThis
 * @property {number} es
 * @property {number} rc
 * @property {Array<number>} en
 * @property {number} ml0
 */

/** @this {import('../defs.js').ProjectionDefinition & LocalThis} */
export function init() {
  this.x0 = this.x0 || 0;
  this.y0 = this.y0 || 0;
  this.lat0 = this.lat0 || 0;
  this.long0 = this.long0 || 0;
  this.lat_ts = this.lat_ts || 0;
  this.title = this.title || 'Equidistant Cylindrical (Plate Carre)';

  this.rc = Math.cos(this.lat_ts);

  if (this.es) {
    var sinphi1 = Math.sin(this.lat_ts);
    var nu1 = 1 / Math.sqrt(1 - this.es * sinphi1 * sinphi1);
    this.rc *= nu1;
    this.en = pj_enfn(this.es);
    this.ml0 = pj_mlfn(this.lat0, Math.sin(this.lat0), Math.cos(this.lat0), this.en);
  }
}

// forward equations--mapping lat,long to x,y
// -----------------------------------------------------------------
export function forward(p) {
  var lon = p.x;
  var lat = p.y;

  var dlon = adjust_lon(lon - this.long0, this.over);
  p.x = this.x0 + (this.a * dlon * this.rc);
  if (this.es) {
    p.y = this.y0 + (this.a * (pj_mlfn(lat, Math.sin(lat), Math.cos(lat), this.en) - this.ml0));
  } else {
    var dlat = adjust_lat(lat - this.lat0);
    p.y = this.y0 + (this.a * dlat);
  }
  return p;
}

// inverse equations--mapping x,y to lat/long
// -----------------------------------------------------------------
export function inverse(p) {
  var x = p.x;
  var y = p.y;

  p.x = adjust_lon(this.long0 + ((x - this.x0) / (this.a * this.rc)), this.over);
  if (this.es) {
    p.y = pj_inv_mlfn(((y - this.y0) / this.a) + this.ml0, this.es, this.en);
  } else {
    p.y = adjust_lat(this.lat0 + ((y - this.y0) / (this.a)));
  }
  return p;
}

export var names = ['Equirectangular', 'Equidistant_Cylindrical', 'Equidistant_Cylindrical_Spherical', 'Equidistant_Cylindrical_Ellipsoidal', 'Plate_Carree', 'eqc'];
export default {
  init: init,
  forward: forward,
  inverse: inverse,
  names: names
};
