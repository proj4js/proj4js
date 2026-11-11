import adjust_lon from '../common/adjust_lon';
import { EPSLN } from '../constants/values';

var C_X = 2 * Math.SQRT2 / Math.PI; // 0.9003163161571061
var C_Y = Math.SQRT2;

/* s - sin(s), accurate also for small |s|, where the subtraction would lose
 * most of the digits */
function sMinusSinS(s) {
  if (Math.abs(s) < 0.25) {
    var s2 = s * s;
    return s * s2 * (1 / 6 - s2 * (1 / 120 - s2 * (1 / 5040 - s2 * (1 / 362880
      - s2 * (1 / 39916800 - s2 / 6227020800)))));
  }
  return s - Math.sin(s);
}

/* Close to the poles. With theta = (PI - s) / 2 and chi the colatitude,
 * 2 * theta + sin(2 * theta) = PI * sin(lat) becomes
 * s - sin(s) = 2 * PI * sin(chi / 2)^2, which can be solved accurately where
 * the Newton iteration on theta converges only linearly. */
function polarS(chi) {
  var sh = Math.sin(0.5 * chi);
  var w = 2 * Math.PI * sh * sh;
  var s = Math.cbrt(6 * w); // <= the root, as s - sin(s) <= s^3 / 6
  for (var i = 0; i < 20; i++) {
    var sh2 = Math.sin(0.5 * s);
    var d = 2 * sh2 * sh2; // 1 - cos(s)
    if (d === 0) {
      break;
    }
    var ds = (sMinusSinS(s) - w) / d;
    s -= ds;
    if (Math.abs(ds) <= 1e-12 * s) { // quadratic convergence
      break;
    }
  }
  return s;
}

/** @this {import('../defs.js').ProjectionDefinition} */
export function init() {
  this.x0 = this.x0 !== undefined ? this.x0 : 0;
  this.y0 = this.y0 !== undefined ? this.y0 : 0;
  this.long0 = this.long0 !== undefined ? this.long0 : 0;
}

/* Mollweide forward equations--mapping lat,long to x,y
    ---------------------------------------------------- */
export function forward(p) {
  /* Forward equations
      ----------------- */
  var lon = p.x;
  var lat = p.y;

  var delta_lon = adjust_lon(lon - this.long0, this.over);
  if (Math.abs(lat) > Math.PI / 2 - 0.5) {
    var s = polarS(Math.PI / 2 - Math.abs(lat));
    // cos(theta) = sin(s / 2), sin(theta) = cos(s / 2)
    p.x = C_X * this.a * delta_lon * Math.sin(0.5 * s) + this.x0;
    p.y = (lat < 0 ? -1 : 1) * C_Y * this.a * Math.cos(0.5 * s) + this.y0;
    return p;
  }
  var theta = lat;
  var con = Math.PI * Math.sin(lat);

  /* Iterate using the Newton-Raphson method to find theta
      ----------------------------------------------------- */
  while (true) {
    var delta_theta = -(theta + Math.sin(theta) - con) / (1 + Math.cos(theta));
    theta += delta_theta;
    if (Math.abs(delta_theta) < EPSLN) {
      break;
    }
  }
  theta /= 2;

  var x = C_X * this.a * delta_lon * Math.cos(theta) + this.x0;
  var y = C_Y * this.a * Math.sin(theta) + this.y0;

  p.x = x;
  p.y = y;
  return p;
}

export function inverse(p) {
  var theta;
  var arg;

  /* Inverse equations
      ----------------- */
  p.x -= this.x0;
  p.y -= this.y0;
  arg = p.y / (C_Y * this.a);
  if (Math.abs(arg) > 0.5 && Math.abs(arg) <= 1) {
    // Close to the poles: cos(s / 2) = |arg|, with s as in polarS(), and the
    // colatitude chi from 2 * sin(chi / 2)^2 = (s - sin(s)) / PI
    var halfS = 2 * Math.asin(Math.sqrt(0.5 * (1 - Math.abs(arg))));
    var den = C_X * this.a * Math.sin(halfS);
    var dlon = den === 0 ? 0 : p.x / den; // at the pole x is 0
    var chi = 2 * Math.asin(Math.sqrt(sMinusSinS(2 * halfS) / (2 * Math.PI)));
    p.x = adjust_lon(this.long0 + Math.max(-Math.PI, Math.min(Math.PI, dlon)), this.over);
    p.y = (arg < 0 ? -1 : 1) * (Math.PI / 2 - chi);
    return p;
  }

  /* Because of division by zero problems, 'arg' can not be 1.  Therefore
       a number very close to one is used instead.
       ------------------------------------------------------------------- */
  if (Math.abs(arg) > 0.999999999999) {
    arg = 0.999999999999;
  }
  theta = Math.asin(arg);
  var lon = adjust_lon(this.long0 + (p.x / (C_X * this.a * Math.cos(theta))), this.over);
  if (lon < (-Math.PI)) {
    lon = -Math.PI;
  }
  if (lon > Math.PI) {
    lon = Math.PI;
  }
  arg = (2 * theta + Math.sin(2 * theta)) / Math.PI;
  if (Math.abs(arg) > 1) {
    arg = 1;
  }
  var lat = Math.asin(arg);

  p.x = lon;
  p.y = lat;
  return p;
}

export var names = ['Mollweide', 'moll'];
export default {
  init: init,
  forward: forward,
  inverse: inverse,
  names: names
};
