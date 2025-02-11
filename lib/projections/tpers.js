
var mode = {
  N_POLE: 0,
  S_POLE: 1,
  EQUIT: 2,
  OBLIQ: 3
};

import { D2R, HALF_PI, EPSLN } from "../constants/values";
import hypot from "../common/hypot";

var params = {
  h:     { def: 100000, num: true },           // default is Karman line, no default in PROJ.7
  azi:   { def: 0, num: true, degrees: true }, // default is North
  tilt:  { def: 0, num: true, degrees: true }, // default is Nadir
  long0: { def: 0, num: true },                // default is Greenwich, conversion to rad is automatic
  lat0:  { def: 0, num: true }                 // default is Equator, conversion to rad is automatic
};

export function init() {
  Object.keys(params).forEach(function (p) {
    if (typeof this[p] === "undefined") {
      this[p] = params[p].def;
    } else if (params[p].num && isNaN(this[p])) {
      throw new Error("Invalid parameter value, must be numeric " + p + " = " + this[p]);
    } else if (params[p].num) {
      this[p] = parseFloat(this[p]);
    }
    if (params[p].degrees) {
      this[p] = this[p] * D2R;
    }
  }.bind(this));

  if (Math.abs((Math.abs(this.lat0) - HALF_PI)) < EPSLN) {
    this.mode = this.lat0 < 0 ? mode.S_POLE : mode.N_POLE;
  } else if (Math.abs(this.lat0) < EPSLN) {
    this.mode = mode.EQUIT;
  } else {
    this.mode = mode.OBLIQ;
    this.sinph0 = Math.sin(this.lat0);
    this.cosph0 = Math.cos(this.lat0);
  }

  this.pn1 = this.h / this.a;  // Normalize relative to the Earth's radius

  if (this.pn1 <= 0 || this.pn1 > 1e10) {
    throw new Error("Invalid height");
  }
  
  this.p = 1 + this.pn1;
  this.rp = 1 / this.p;
  this.h1 = 1 / this.pn1;
  this.pfact = (this.p + 1) * this.h1;
  this.es = 0;

  var omega = this.tilt;
  var gamma = this.azi;
  this.cg = Math.cos(gamma);
  this.sg = Math.sin(gamma);
  this.cw = Math.cos(omega);
  this.sw = Math.sin(omega);
}

export function forward(p) {
  p.x -= this.long0;
  var sinphi = Math.sin(p.y);
  var cosphi = Math.cos(p.y);
  var coslam = Math.cos(p.x);
  var x, y;
  switch (this.mode) {
  case mode.OBLIQ:
    y = this.sinph0 * sinphi + this.cosph0 * cosphi * coslam;
    break;
  case mode.EQUIT:
    y = cosphi * coslam;
    break;
  case mode.S_POLE:
    y = -sinphi;
    break;
  case mode.N_POLE:
    y = sinphi;
    break;
  }
  y = this.pn1 / (this.p - y);
  x = y * cosphi * Math.sin(p.x);

  switch (this.mode) {
  case mode.OBLIQ:
    y *= this.cosph0 * sinphi - this.sinph0 * cosphi * coslam;
    break;
  case mode.EQUIT:
    y *= sinphi;
    break;
  case mode.N_POLE:
    y *= -(cosphi * coslam);
    break;
  case mode.S_POLE:
    y *= cosphi * coslam;
    break;
  }

  // Tilt 
  var yt, ba;
  yt = y * this.cg + x * this.sg;
  ba = 1 / (yt * this.sw * this.h1 + this.cw);
  x = (x * this.cg - y * this.sg) * this.cw * ba;
  y = yt * ba;

  p.x = x * this.a;
  p.y = y * this.a;
  return p;
}

export function inverse(p) {
  p.x /= this.a;
  p.y /= this.a;
  var r = { x: p.x, y: p.y };

  // Un-Tilt
  var bm, bq, yt;
  yt = 1 / (this.pn1 - p.y * this.sw);
  bm = this.pn1 * p.x * yt;
  bq = this.pn1 * p.y * this.cw * yt;
  p.x = bm * this.cg + bq * this.sg;
  p.y = bq * this.cg - bm * this.sg;

  var rh = hypot(p.x, p.y);
  if (Math.abs(rh) < EPSLN) {
    r.x = 0;
    r.y = p.y;
  } else {
    var cosz, sinz;
    sinz = 1 - rh * rh * this.pfact;
    sinz = (this.p - Math.sqrt(sinz)) / (this.pn1 / rh + rh / this.pn1);
    cosz = Math.sqrt(1 - sinz * sinz);
    switch (this.mode) {
    case mode.OBLIQ:
      r.y = Math.asin(cosz * this.sinph0 + p.y * sinz * this.cosph0 / rh);
      p.y = (cosz - this.sinph0 * Math.sin(r.y)) * rh;
      p.x *= sinz * this.cosph0;
      break;
    case mode.EQUIT:
      r.y = Math.asin(p.y * sinz / rh);
      p.y = cosz * rh;
      p.x *= sinz;
      break;
    case mode.N_POLE:
      r.y = Math.asin(cosz);
      p.y = -p.y;
      break;
    case mode.S_POLE:
      r.y = -Math.asin(cosz);
      break;
    }
    r.x = Math.atan2(p.x, p.y);
  }

  p.x = r.x + this.long0;
  p.y = r.y;
  return p;
}

export var names = ["Tilted_Perspective", "tpers"];
export default {
  init: init,
  forward: forward,
  inverse: inverse,
  names: names
};
