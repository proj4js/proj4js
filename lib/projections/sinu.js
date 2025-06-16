import adjust_lon from '../common/adjust_lon';
import adjust_lat from '../common/adjust_lat';
import pj_enfn from '../common/pj_enfn';
var MAX_ITER = 20;
import pj_mlfn from '../common/pj_mlfn';
import pj_inv_mlfn from '../common/pj_inv_mlfn';
import { EPSLN, HALF_PI } from '../constants/values';

import asinz from '../common/asinz';

/**
 * @typedef {Object} LocalThis
 * @property {Array<number>} en
 * @property {number} n
 * @property {number} m
 * @property {number} C_y
 * @property {number} C_x
 * @property {number} es
 */

/** @this {import('../defs.js').ProjectionDefinition & LocalThis} */
export function init() {
  /* Place parameters in static storage for common use
    ------------------------------------------------- */

  if (!this.sphere) {
    this.en = pj_enfn(this.es);
  } else {
    this.n = 1;
    this.m = 0;
    this.es = 0;
    this.C_y = Math.sqrt((this.m + 1) / this.n);
    this.C_x = this.C_y / (this.m + 1);
  }
}

/* Sinusoidal forward equations--mapping lat,long to x,y
  ----------------------------------------------------- */
export function forward(p) {
  var x, y;
  var lon = p.x;
  var lat = p.y;
  /* Forward equations
    ----------------- */
  lon = adjust_lon(lon - this.long0);

  if (this.sphere) {
    if (!this.m) {
      lat = this.n !== 1 ? Math.asin(this.n * Math.sin(lat)) : lat;
    } else {
      var k = this.n * Math.sin(lat);
      for (var i = MAX_ITER; i; --i) {
        var V = (this.m * lat + Math.sin(lat) - k) / (this.m + Math.cos(lat));
        lat -= V;
        if (Math.abs(V) < EPSLN) {
          break;
        }
      }
    }
    x = this.a * this.C_x * lon * (this.m + Math.cos(lat));
    y = this.a * this.C_y * lat;
  } else {
    var s = Math.sin(lat);
    var c = Math.cos(lat);
    y = this.a * pj_mlfn(lat, s, c, this.en);
    x = this.a * lon * c / Math.sqrt(1 - this.es * s * s);
  }

  p.x = x;
  p.y = y;
  return p;
}

export function inverse(p) {
  var lat, temp, lon, s;

  p.x -= this.x0;
  lon = p.x / this.a;
  p.y -= this.y0;
  lat = p.y / this.a;

  if (this.sphere) {
    lat /= this.C_y;
    lon = lon / (this.C_x * (this.m + Math.cos(lat)));
    if (this.m) {
      lat = asinz((this.m * lat + Math.sin(lat)) / this.n);
    } else if (this.n !== 1) {
      lat = asinz(Math.sin(lat) / this.n);
    }
    lon = adjust_lon(lon + this.long0);
    lat = adjust_lat(lat);
  } else {
    lat = pj_inv_mlfn(p.y / this.a, this.es, this.en);
    s = Math.abs(lat);
    if (s < HALF_PI) {
      s = Math.sin(lat);
      temp = this.long0 + p.x * Math.sqrt(1 - this.es * s * s) / (this.a * Math.cos(lat));
      // temp = this.long0 + p.x / (this.a * Math.cos(lat));
      lon = adjust_lon(temp);
    } else if ((s - EPSLN) < HALF_PI) {
      lon = this.long0;
    }
  }
  p.x = lon;
  p.y = lat;
  return p;
}

export var names = ['Sinusoidal', 'sinu'];
export default {
  init: init,
  forward: forward,
  inverse: inverse,
  names: names
};
