import adjust_lon from '../common/adjust_lon';
import { D2R, EPSLN, FORTPI } from '../constants/values';

/**
    Original projection implementation:
        https://github.com/OSGeo/PROJ/blob/master/src/projections/labrd.cpp

    Documentation:
        https://proj.org/operations/projections/labrd.html
 */

/**
 * @typedef {Object} LocalThis
 * @property {string} [azi]
 * @property {number} es
 * @property {number} e
 * @property {number} kRg
 * @property {number} p0s
 * @property {number} A
 * @property {number} C
 * @property {number} Ca
 * @property {number} Cb
 * @property {number} Cc
 * @property {number} Cd
 */

/**
 * Initialize the Laborde projection
 * @this {import('../defs.js').ProjectionDefinition & LocalThis}
 */
export function init() {
  if (!this.lat0) {
    throw new Error('Invalid value for lat_0: lat_0 should be different from 0');
  }
  if (!this.k0) {
    this.k0 = 1;
  }
  this.x0 = this.x0 || 0;
  this.y0 = this.y0 || 0;
  this.long0 = this.long0 || 0;

  var az = this.alpha !== undefined ? this.alpha : (parseFloat(this.azi) || 0) * D2R;
  var sinp = Math.sin(this.lat0);
  var t = 1 - this.es * sinp * sinp;
  var N = 1 / Math.sqrt(t);
  var R = (1 - this.es) * N / t;
  this.kRg = this.k0 * Math.sqrt(N * R);
  this.p0s = Math.atan(Math.sqrt(R / N) * Math.tan(this.lat0));
  this.A = sinp / Math.sin(this.p0s);
  t = this.e * sinp;
  this.C = 0.5 * this.e * this.A * Math.log((1 + t) / (1 - t))
    - this.A * Math.log(Math.tan(FORTPI + 0.5 * this.lat0))
    + Math.log(Math.tan(FORTPI + 0.5 * this.p0s));
  t = az + az;
  this.Cb = 1 / (12 * this.kRg * this.kRg);
  this.Ca = (1 - Math.cos(t)) * this.Cb;
  this.Cb *= Math.sin(t);
  this.Cc = 3 * (this.Ca * this.Ca - this.Cb * this.Cb);
  this.Cd = 6 * this.Ca * this.Cb;
}

/** @this {import('../defs.js').ProjectionDefinition & LocalThis} */
export function forward(p) {
  var lam = adjust_lon(p.x - this.long0, this.over);
  var phi = p.y;

  var V1 = this.A * Math.log(Math.tan(FORTPI + 0.5 * phi));
  var t = this.e * Math.sin(phi);
  var V2 = 0.5 * this.e * this.A * Math.log((1 + t) / (1 - t));
  var ps = 2 * (Math.atan(Math.exp(V1 - V2 + this.C)) - FORTPI);
  var I1 = ps - this.p0s;
  var cosps = Math.cos(ps);
  var cosps2 = cosps * cosps;
  var sinps = Math.sin(ps);
  var sinps2 = sinps * sinps;
  var I4 = this.A * cosps;
  var I2 = 0.5 * this.A * I4 * sinps;
  var I3 = I2 * this.A * this.A * (5 * cosps2 - sinps2) / 12;
  var I6 = I4 * this.A * this.A;
  var I5 = I6 * (cosps2 - sinps2) / 6;
  I6 *= this.A * this.A * (5 * cosps2 * cosps2 + sinps2 * (sinps2 - 18 * cosps2)) / 120;
  t = lam * lam;
  var x = this.kRg * lam * (I4 + t * (I5 + t * I6));
  var y = this.kRg * (I1 + t * (I2 + t * I3));
  var x2 = x * x;
  var y2 = y * y;
  V1 = 3 * x * y2 - x * x2;
  V2 = y * y2 - 3 * x2 * y;
  x += this.Ca * V1 + this.Cb * V2;
  y += this.Ca * V2 - this.Cb * V1;

  p.x = this.a * x + this.x0;
  p.y = this.a * y + this.y0;
  return p;
}

/** @this {import('../defs.js').ProjectionDefinition & LocalThis} */
export function inverse(p) {
  var x = (p.x - this.x0) / this.a;
  var y = (p.y - this.y0) / this.a;

  var x2 = x * x;
  var y2 = y * y;
  var V1 = 3 * x * y2 - x * x2;
  var V2 = y * y2 - 3 * x2 * y;
  var V3 = x * (5 * y2 * y2 + x2 * (-10 * y2 + x2));
  var V4 = y * (5 * x2 * x2 + y2 * (-10 * x2 + y2));
  x += -this.Ca * V1 - this.Cb * V2 + this.Cc * V3 + this.Cd * V4;
  y += this.Cb * V1 - this.Ca * V2 - this.Cd * V3 + this.Cc * V4;
  var ps = this.p0s + y / this.kRg;
  var pe = ps + this.lat0 - this.p0s;

  var t, tpe;
  for (var i = 20; i; --i) {
    V1 = this.A * Math.log(Math.tan(FORTPI + 0.5 * pe));
    tpe = this.e * Math.sin(pe);
    V2 = 0.5 * this.e * this.A * Math.log((1 + tpe) / (1 - tpe));
    t = ps - 2 * (Math.atan(Math.exp(V1 - V2 + this.C)) - FORTPI);
    pe += t;
    if (Math.abs(t) < EPSLN) {
      break;
    }
  }

  t = this.e * Math.sin(pe);
  t = 1 - t * t;
  var Re = (1 - this.es) / (t * Math.sqrt(t));
  t = Math.tan(ps);
  var t2 = t * t;
  var s = this.kRg * this.kRg;
  var d = Re * this.k0 * this.kRg;
  var I7 = t / (2 * d);
  var I8 = t * (5 + 3 * t2) / (24 * d * s);
  d = Math.cos(ps) * this.kRg * this.A;
  var I9 = 1 / d;
  d *= s;
  var I10 = (1 + 2 * t2) / (6 * d);
  var I11 = (5 + t2 * (28 + 24 * t2)) / (120 * d * s);
  x2 = x * x;

  p.x = adjust_lon(x * (I9 + x2 * (-I10 + x2 * I11)) + this.long0, this.over);
  p.y = pe + x2 * (-I7 + I8 * x2);
  return p;
}

export var names = ['Laborde_Oblique_Mercator', 'labrd'];
export default {
  init: init,
  forward: forward,
  inverse: inverse,
  names: names
};
