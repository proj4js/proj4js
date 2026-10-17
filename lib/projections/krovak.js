import adjust_lon from '../common/adjust_lon';

/* Modified Krovak (S-JTSK/05) correction, see
 * https://www.cuzk.cz/Zememerictvi/Geodeticke-zaklady-na-uzemi-CR/GNSS/Nova-realizace-systemu-ETRS89-v-CR/Metodika-prevodu-ETRF2000-vs-S-JTSK-var2(101208).aspx
 */
var X0 = 1089000;
var Y0 = 654000;
var C1 = 2.946529277E-02;
var C2 = 2.515965696E-02;
var C3 = 1.193845912E-07;
var C4 = -4.668270147E-07;
var C5 = 9.233980362E-12;
var C6 = 1.523735715E-12;
var C7 = 1.696780024E-18;
var C8 = 4.408314235E-18;
var C9 = -8.331083518E-24;
var C10 = -3.689471323E-24;

/**
 * @param {number} xr reduced southing in metres
 * @param {number} yr reduced westing in metres
 * @returns {Array<number>} correction to the southing and westing in metres
 */
function modKrovakCorrection(xr, yr) {
  var xr2 = xr * xr;
  var yr2 = yr * yr;
  var xr4 = xr2 * xr2;
  var yr4 = yr2 * yr2;
  return [
    C1 + C3 * xr - C4 * yr - 2 * C6 * xr * yr + C5 * (xr2 - yr2)
    + C7 * xr * (xr2 - 3 * yr2) - C8 * yr * (3 * xr2 - yr2)
    + 4 * C9 * xr * yr * (xr2 - yr2) + C10 * (xr4 + yr4 - 6 * xr2 * yr2),
    C2 + C3 * yr + C4 * xr + 2 * C5 * xr * yr + C6 * (xr2 - yr2)
    + C8 * xr * (xr2 - 3 * yr2) + C7 * yr * (3 * xr2 - yr2)
    - 4 * C10 * xr * yr * (xr2 - yr2) + C9 * (xr4 + yr4 - 6 * xr2 * yr2)
  ];
}

export function init() {
  this.a = 6377397.155;
  this.es = 0.006674372230614;
  this.e = Math.sqrt(this.es);
  if (!this.lat0) {
    this.lat0 = 0.863937979737193;
  }
  if (!this.long0) {
    this.long0 = 0.7417649320975901 - 0.308341501185665; // 42.5° from Ferro = 24.833° from Greenwich
  }
  /* if scale not set default to 0.9999 */
  if (!this.k0) {
    this.k0 = 0.9999;
  }
  this.x0 = this.x0 || 0;
  this.y0 = this.y0 || 0;
  this.modified = false;
  this.s45 = 0.785398163397448; /* 45 */
  this.s90 = 2 * this.s45;
  this.fi0 = this.lat0;
  this.e2 = this.es;
  this.e = Math.sqrt(this.e2);
  this.alfa = Math.sqrt(1 + (this.e2 * Math.pow(Math.cos(this.fi0), 4)) / (1 - this.e2));
  this.uq = 1.04216856380474;
  this.u0 = Math.asin(Math.sin(this.fi0) / this.alfa);
  this.g = Math.pow((1 + this.e * Math.sin(this.fi0)) / (1 - this.e * Math.sin(this.fi0)), this.alfa * this.e / 2);
  this.k = Math.tan(this.u0 / 2 + this.s45) / Math.pow(Math.tan(this.fi0 / 2 + this.s45), this.alfa) * this.g;
  this.k1 = this.k0;
  this.n0 = this.a * Math.sqrt(1 - this.e2) / (1 - this.e2 * Math.pow(Math.sin(this.fi0), 2));
  this.s0 = 1.37008346281555;
  this.n = Math.sin(this.s0);
  this.ro0 = this.k1 * this.n0 / Math.tan(this.s0);
  this.ad = this.s90 - this.uq;
}

/* ellipsoid */
/* calculate xy from lat/lon */
/* Constants, identical to inverse transform function */
export function forward(p) {
  var gfi, u, deltav, s, d, eps, ro, dxy;
  var lon = p.x;
  var lat = p.y;
  var delta_lon = adjust_lon(lon - this.long0, this.over);
  /* Transformation */
  gfi = Math.pow(((1 + this.e * Math.sin(lat)) / (1 - this.e * Math.sin(lat))), (this.alfa * this.e / 2));
  u = 2 * (Math.atan(this.k * Math.pow(Math.tan(lat / 2 + this.s45), this.alfa) / gfi) - this.s45);
  deltav = -delta_lon * this.alfa;
  s = Math.asin(Math.cos(this.ad) * Math.sin(u) + Math.sin(this.ad) * Math.cos(u) * Math.cos(deltav));
  d = Math.asin(Math.cos(u) * Math.sin(deltav) / Math.cos(s));
  eps = this.n * d;
  ro = this.ro0 * Math.pow(Math.tan(this.s0 / 2 + this.s45), this.n) / Math.pow(Math.tan(s / 2 + this.s45), this.n);
  p.y = ro * Math.cos(eps) / 1;
  p.x = ro * Math.sin(eps) / 1;

  if (this.modified) {
    dxy = modKrovakCorrection(p.y - X0, p.x - Y0);
    p.y -= dxy[0];
    p.x -= dxy[1];
  }
  p.y += this.y0;
  p.x += this.x0;

  if (!this.czech) {
    p.y *= -1;
    p.x *= -1;
  }
  return (p);
}

/* calculate lat/lon from xy */
export function inverse(p) {
  var u, deltav, s, d, eps, ro, fi1, dxy;
  var ok;

  /* Transformation */
  /* revert y, x */
  var tmp = p.x;
  p.x = p.y;
  p.y = tmp;
  if (!this.czech) {
    p.y *= -1;
    p.x *= -1;
  }
  p.x -= this.y0;
  p.y -= this.x0;
  if (this.modified) {
    dxy = modKrovakCorrection(p.x - X0, p.y - Y0);
    p.x += dxy[0];
    p.y += dxy[1];
  }
  ro = Math.sqrt(p.x * p.x + p.y * p.y);
  eps = Math.atan2(p.y, p.x);
  d = eps / Math.sin(this.s0);
  s = 2 * (Math.atan(Math.pow(this.ro0 / ro, 1 / this.n) * Math.tan(this.s0 / 2 + this.s45)) - this.s45);
  u = Math.asin(Math.cos(this.ad) * Math.sin(s) - Math.sin(this.ad) * Math.cos(s) * Math.cos(d));
  deltav = Math.asin(Math.cos(s) * Math.sin(d) / Math.cos(u));
  p.x = this.long0 - deltav / this.alfa;
  fi1 = u;
  ok = 0;
  var iter = 0;
  do {
    p.y = 2 * (Math.atan(Math.pow(this.k, -1 / this.alfa) * Math.pow(Math.tan(u / 2 + this.s45), 1 / this.alfa) * Math.pow((1 + this.e * Math.sin(fi1)) / (1 - this.e * Math.sin(fi1)), this.e / 2)) - this.s45);
    if (Math.abs(fi1 - p.y) < 0.0000000001) {
      ok = 1;
    }
    fi1 = p.y;
    iter += 1;
  } while (ok === 0 && iter < 15);
  if (iter >= 15) {
    return null;
  }

  return (p);
}

export var names = ['Krovak', 'Krovak (North Orientated)', 'krovak'];
export default {
  init: init,
  forward: forward,
  inverse: inverse,
  names: names
};
