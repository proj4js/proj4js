import adjust_lon from '../common/adjust_lon';
import asinz from '../common/asinz';
import { EPSLN, HALF_PI } from '../constants/values';

var N_POLE = 1;
var S_POLE = 2;
var EQUIT = 3;
var OBLIQ = 4;

/**
 * @typedef {Object} LocalThis
 * @property {number} sin_p14
 * @property {number} cos_p14
 * @property {number} sinalpha
 * @property {number} cosalpha
 * @property {number} es
 * @property {number} mode
 * @property {number} nu0
 * @property {number} y_shift
 * @property {number} y_scale
 */

/** @this {import('../defs.js').ProjectionDefinition & LocalThis} */
export function init() {
  // double temp;      /* temporary variable    */

  /* Place parameters in static storage for common use
      ------------------------------------------------- */
  var lat0 = this.lat0 || 0;
  this.sin_p14 = Math.sin(lat0);
  this.cos_p14 = Math.cos(lat0);
  this.sinalpha = Math.sin(this.alpha || 0);
  this.cosalpha = Math.cos(this.alpha || 0);

  if (Math.abs(Math.abs(lat0) - HALF_PI) <= EPSLN) {
    this.mode = lat0 < 0 ? S_POLE : N_POLE;
  } else if (Math.abs(lat0) > EPSLN) {
    this.mode = OBLIQ;
  } else {
    this.mode = EQUIT;
  }

  if (this.es !== 0) {
    this.nu0 = 1 / Math.sqrt(1 - this.es * this.sin_p14 * this.sin_p14);
    this.y_shift = this.es * this.nu0 * this.sin_p14 * this.cos_p14;
    this.y_scale = 1 / Math.sqrt(1 - this.es * this.cos_p14 * this.cos_p14);
  }
}

/* Orthographic forward equations--mapping lat,long to x,y
    --------------------------------------------------- */
export function forward(p) {
  var sinphi, cosphi; /* sin and cos value        */
  var dlon; /* delta longitude value      */
  var coslon; /* cos of longitude        */
  var g, x, y, xp, yp, nu, ak;
  var lon = p.x;
  var lat = p.y;
  /* Forward equations
      ----------------- */
  dlon = adjust_lon(lon - (this.long0 || 0), this.over);

  sinphi = Math.sin(lat);
  cosphi = Math.cos(lat);

  coslon = Math.cos(dlon);
  g = this.sin_p14 * sinphi + this.cos_p14 * cosphi * coslon;
  if ((g > 0) || (Math.abs(g) <= EPSLN)) {
    ak = this.a * this.k0;
    if (this.es === 0) {
      xp = ak * cosphi * Math.sin(dlon);
      yp = ak * (this.cos_p14 * sinphi - this.sin_p14 * cosphi * coslon);
    } else {
      // EPSG guidance note 7.2, Orthographic
      nu = 1 / Math.sqrt(1 - this.es * sinphi * sinphi);
      xp = ak * nu * cosphi * Math.sin(dlon);
      yp = ak * (nu * (sinphi * this.cos_p14 - cosphi * this.sin_p14 * coslon)
        + this.es * (this.nu0 * this.sin_p14 - nu * sinphi) * this.cos_p14);
    }
    x = (this.x0 || 0) + this.cosalpha * xp - this.sinalpha * yp;
    y = (this.y0 || 0) + this.sinalpha * xp + this.cosalpha * yp;
  }
  p.x = x;
  p.y = y;
  return p;
}

export function inverse(p) {
  var rh; /* height above ellipsoid      */
  var z; /* angle          */
  var sinz, cosz; /* sin of z and cos of z      */
  var con;
  var lon, lat;
  var long0, lat0;
  var xf, yf, yr, rh2, sinphi2, sinphi, cosphi, sinlam, coslam;
  var nu, rho, j11, j12, j21, j22, det, dx, dy, dphi, dlam, i;
  /* Inverse equations
      ----------------- */
  xf = p.x - (this.x0 || 0);
  yf = p.y - (this.y0 || 0);
  p.x = (this.cosalpha * xf + this.sinalpha * yf) / this.k0;
  p.y = (-this.sinalpha * xf + this.cosalpha * yf) / this.k0;

  if (this.es !== 0) {
    xf = p.x / this.a;
    yf = p.y / this.a;
    if (this.mode === N_POLE || this.mode === S_POLE) {
      rh2 = xf * xf + yf * yf;
      if (rh2 >= 1 - 1e-15) {
        if (rh2 - 1 > EPSLN) {
          return null;
        }
        lat = 0;
      } else {
        lat = Math.acos(Math.sqrt(rh2 * (1 - this.es) / (1 - this.es * rh2))) * (this.mode === N_POLE ? 1 : -1);
      }
      lon = Math.atan2(xf, yf * (this.mode === N_POLE ? -1 : 1));
    } else if (this.mode === EQUIT) {
      yr = yf * this.a / this.b;
      if (xf * xf + yr * yr > 1 + 1e-11) {
        return null;
      }
      con = (1 - this.es) / yf;
      sinphi2 = yf === 0 ? 0 : 1 / (con * con + this.es);
      if (sinphi2 > 1 - 1e-11) {
        lat = HALF_PI * (yf > 0 ? 1 : -1);
        lon = 0;
      } else {
        lat = Math.asin(Math.sqrt(sinphi2)) * (yf > 0 ? 1 : -1);
        sinlam = xf * Math.sqrt((1 - this.es * sinphi2) / (1 - sinphi2));
        lon = Math.abs(sinlam) - 1 > -1e-15 ? HALF_PI * (xf > 0 ? 1 : -1) : Math.asin(sinlam);
      }
    } else {
      yr = (yf - this.y_shift) / this.y_scale;
      rh2 = xf * xf + yr * yr;
      if (rh2 > 1 + 1e-11) {
        return null;
      }
      rh = Math.sqrt(rh2);
      // spherical solution as the initial guess, then Newton iteration (EPSG guidance note 7.2)
      // the guess uses xf and yr, which are already corrected for alpha and k
      if (rh <= EPSLN) {
        lat = this.lat0;
        lon = 0;
      } else {
        sinz = Math.min(rh, 1);
        cosz = Math.sqrt(1 - sinz * sinz);
        lat = asinz(cosz * this.sin_p14 + yr * sinz * this.cos_p14 / rh);
        lon = Math.atan2(xf * sinz, rh * this.cos_p14 * cosz - yr * this.sin_p14 * sinz);
      }
      for (i = 0; i < 20; i++) {
        sinphi = Math.sin(lat);
        cosphi = Math.cos(lat);
        sinlam = Math.sin(lon);
        coslam = Math.cos(lon);
        con = 1 - this.es * sinphi * sinphi;
        nu = 1 / Math.sqrt(con);
        rho = (1 - this.es) * nu / con;
        j11 = -rho * sinphi * sinlam;
        j12 = nu * cosphi * coslam;
        j21 = rho * (cosphi * this.cos_p14 + sinphi * this.sin_p14 * coslam);
        j22 = nu * this.sin_p14 * cosphi * sinlam;
        det = j11 * j22 - j12 * j21;
        dx = xf - nu * cosphi * sinlam;
        dy = yf - (nu * (sinphi * this.cos_p14 - cosphi * this.sin_p14 * coslam)
          + this.es * (this.nu0 * this.sin_p14 - nu * sinphi) * this.cos_p14);
        dphi = (j22 * dx - j12 * dy) / det;
        dlam = (-j21 * dx + j11 * dy) / det;
        lat += dphi;
        if (lat > HALF_PI) {
          lat = HALF_PI - (lat - HALF_PI);
          lon = adjust_lon(lon + Math.PI);
        } else if (lat < -HALF_PI) {
          lat = -HALF_PI + (-HALF_PI - lat);
          lon = adjust_lon(lon + Math.PI);
        }
        lon += dlam;
        if (Math.abs(dphi) < 1e-12 && Math.abs(dlam) < 1e-12) {
          break;
        }
        // near the horizon or a pole the steps can stay above 1e-12 while the residual is negligible
        if (Math.abs(dx) < 1e-15 && Math.abs(dy) < 1e-15) {
          break;
        }
      }
      if (i === 20) {
        return null;
      }
    }
    p.x = adjust_lon(lon + (this.long0 || 0), this.over);
    p.y = lat;
    return p;
  }

  rh = Math.sqrt(p.x * p.x + p.y * p.y);
  z = asinz(rh / this.a);

  sinz = Math.sin(z);
  cosz = Math.cos(z);

  long0 = this.long0 || 0;
  lat0 = this.lat0 || 0;
  lon = long0;
  if (Math.abs(rh) <= EPSLN) {
    lat = lat0;
    p.x = lon;
    p.y = lat;
    return p;
  }
  lat = asinz(cosz * this.sin_p14 + (p.y * sinz * this.cos_p14) / rh);
  con = Math.abs(lat0) - HALF_PI;
  if (Math.abs(con) <= EPSLN) {
    if (lat0 >= 0) {
      lon = adjust_lon(long0 + Math.atan2(p.x, -p.y), this.over);
    } else {
      lon = adjust_lon(long0 - Math.atan2(-p.x, p.y), this.over);
    }
    p.x = lon;
    p.y = lat;
    return p;
  }
  lon = adjust_lon(long0 + Math.atan2((p.x * sinz), rh * this.cos_p14 * cosz - p.y * this.sin_p14 * sinz), this.over);
  p.x = lon;
  p.y = lat;
  return p;
}

export var names = ['Orthographic', 'Local_Orthographic', 'ortho'];
export default {
  init: init,
  forward: forward,
  inverse: inverse,
  names: names
};
