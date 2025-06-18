import adjust_lon from '../common/adjust_lon';
import { HALF_PI, EPSLN } from '../constants/values';
import mlfn from '../common/mlfn';
import e0fn from '../common/e0fn';
import e1fn from '../common/e1fn';
import e2fn from '../common/e2fn';
import e3fn from '../common/e3fn';
import asinz from '../common/asinz';
import imlfn from '../common/imlfn';
import { vincentyDirect, vincentyInverse } from '../common/vincenty';

/**
 * @typedef {Object} LocalThis
 * @property {number} es
 * @property {number} sin_p12
 * @property {number} cos_p12
 * @property {number} a
 * @property {number} f
 */

/** @this {import('../defs.js').ProjectionDefinition & LocalThis} */
export function init() {
  this.sin_p12 = Math.sin(this.lat0);
  this.cos_p12 = Math.cos(this.lat0);
  // flattening for ellipsoid
  this.f = this.es / (1 + Math.sqrt(1 - this.es));
}

export function forward(p) {
  var lon = p.x;
  var lat = p.y;
  var sinphi = Math.sin(p.y);
  var cosphi = Math.cos(p.y);
  var dlon = adjust_lon(lon - this.long0);
  var e0, e1, e2, e3, Mlp, Ml, c, kp, cos_c, vars, azi1;
  if (this.sphere) {
    if (Math.abs(this.sin_p12 - 1) <= EPSLN) {
      // North Pole case
      p.x = this.x0 + this.a * (HALF_PI - lat) * Math.sin(dlon);
      p.y = this.y0 - this.a * (HALF_PI - lat) * Math.cos(dlon);
      return p;
    } else if (Math.abs(this.sin_p12 + 1) <= EPSLN) {
      // South Pole case
      p.x = this.x0 + this.a * (HALF_PI + lat) * Math.sin(dlon);
      p.y = this.y0 + this.a * (HALF_PI + lat) * Math.cos(dlon);
      return p;
    } else {
      // default case
      cos_c = this.sin_p12 * sinphi + this.cos_p12 * cosphi * Math.cos(dlon);
      c = Math.acos(cos_c);
      kp = c ? c / Math.sin(c) : 1;
      p.x = this.x0 + this.a * kp * cosphi * Math.sin(dlon);
      p.y = this.y0 + this.a * kp * (this.cos_p12 * sinphi - this.sin_p12 * cosphi * Math.cos(dlon));
      return p;
    }
  } else {
    e0 = e0fn(this.es);
    e1 = e1fn(this.es);
    e2 = e2fn(this.es);
    e3 = e3fn(this.es);
    if (Math.abs(this.sin_p12 - 1) <= EPSLN) {
      // North Pole case
      Mlp = this.a * mlfn(e0, e1, e2, e3, HALF_PI);
      Ml = this.a * mlfn(e0, e1, e2, e3, lat);
      p.x = this.x0 + (Mlp - Ml) * Math.sin(dlon);
      p.y = this.y0 - (Mlp - Ml) * Math.cos(dlon);
      return p;
    } else if (Math.abs(this.sin_p12 + 1) <= EPSLN) {
      // South Pole case
      Mlp = this.a * mlfn(e0, e1, e2, e3, HALF_PI);
      Ml = this.a * mlfn(e0, e1, e2, e3, lat);
      p.x = this.x0 + (Mlp + Ml) * Math.sin(dlon);
      p.y = this.y0 + (Mlp + Ml) * Math.cos(dlon);
      return p;
    } else {
      // Default case
      if (Math.abs(lon) < EPSLN && Math.abs(lat - this.lat0) < EPSLN) {
        p.x = p.y = 0;
        return p;
      }
      vars = vincentyInverse(this.lat0, this.long0, lat, lon, this.a, this.f);
      azi1 = vars.azi1;
      p.x = vars.s12 * Math.sin(azi1);
      p.y = vars.s12 * Math.cos(azi1);
      return p;
    }
  }
}

export function inverse(p) {
  p.x -= this.x0;
  p.y -= this.y0;
  var rh, z, sinz, cosz, lon, lat, con, e0, e1, e2, e3, Mlp, M, azi1, s12, vars;
  if (this.sphere) {
    rh = Math.sqrt(p.x * p.x + p.y * p.y);
    if (rh > (2 * HALF_PI * this.a)) {
      return;
    }
    z = rh / this.a;

    sinz = Math.sin(z);
    cosz = Math.cos(z);

    lon = this.long0;
    if (Math.abs(rh) <= EPSLN) {
      lat = this.lat0;
    } else {
      lat = asinz(cosz * this.sin_p12 + (p.y * sinz * this.cos_p12) / rh);
      con = Math.abs(this.lat0) - HALF_PI;
      if (Math.abs(con) <= EPSLN) {
        if (this.lat0 >= 0) {
          lon = adjust_lon(this.long0 + Math.atan2(p.x, -p.y));
        } else {
          lon = adjust_lon(this.long0 - Math.atan2(-p.x, p.y));
        }
      } else {
        lon = adjust_lon(this.long0 + Math.atan2(p.x * sinz, rh * this.cos_p12 * cosz - p.y * this.sin_p12 * sinz));
      }
    }

    p.x = lon;
    p.y = lat;
    return p;
  } else {
    e0 = e0fn(this.es);
    e1 = e1fn(this.es);
    e2 = e2fn(this.es);
    e3 = e3fn(this.es);
    if (Math.abs(this.sin_p12 - 1) <= EPSLN) {
      // North pole case
      Mlp = this.a * mlfn(e0, e1, e2, e3, HALF_PI);
      rh = Math.sqrt(p.x * p.x + p.y * p.y);
      M = Mlp - rh;
      lat = imlfn(M / this.a, e0, e1, e2, e3);
      lon = adjust_lon(this.long0 + Math.atan2(p.x, -1 * p.y));
      p.x = lon;
      p.y = lat;
      return p;
    } else if (Math.abs(this.sin_p12 + 1) <= EPSLN) {
      // South pole case
      Mlp = this.a * mlfn(e0, e1, e2, e3, HALF_PI);
      rh = Math.sqrt(p.x * p.x + p.y * p.y);
      M = rh - Mlp;

      lat = imlfn(M / this.a, e0, e1, e2, e3);
      lon = adjust_lon(this.long0 + Math.atan2(p.x, p.y));
      p.x = lon;
      p.y = lat;
      return p;
    } else {
      // default case
      azi1 = Math.atan2(p.x, p.y);
      s12 = Math.sqrt(p.x * p.x + p.y * p.y);
      vars = vincentyDirect(this.lat0, this.long0, azi1, s12, this.a, this.f);

      p.x = vars.lon2;
      p.y = vars.lat2;
      return p;
    }
  }
}

export var names = ['Azimuthal_Equidistant', 'aeqd'];
export default {
  init: init,
  forward: forward,
  inverse: inverse,
  names: names
};
