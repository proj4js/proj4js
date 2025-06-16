import latiso from '../common/latiso';
import sinh from '../common/sinh';
import cosh from '../common/cosh';
import invlatiso from '../common/invlatiso';

/**
 * @typedef {Object} LocalThis
 * @property {number} e
 * @property {number} lc
 * @property {number} rs
 * @property {number} cp
 * @property {number} n2
 * @property {number} xs
 * @property {number} ys
*/

/** @this {import('../defs.js').ProjectionDefinition & LocalThis} */
export function init() {
  // array of:  a, b, lon0, lat0, k0, x0, y0
  var temp = this.b / this.a;
  this.e = Math.sqrt(1 - temp * temp);
  this.lc = this.long0;
  this.rs = Math.sqrt(1 + this.e * this.e * Math.pow(Math.cos(this.lat0), 4) / (1 - this.e * this.e));
  var sinz = Math.sin(this.lat0);
  var pc = Math.asin(sinz / this.rs);
  var sinzpc = Math.sin(pc);
  this.cp = latiso(0, pc, sinzpc) - this.rs * latiso(this.e, this.lat0, sinz);
  this.n2 = this.k0 * this.a * Math.sqrt(1 - this.e * this.e) / (1 - this.e * this.e * sinz * sinz);
  this.xs = this.x0;
  this.ys = this.y0 - this.n2 * pc;

  if (!this.title) {
    this.title = 'Gauss Schreiber transverse mercator';
  }
}

// forward equations--mapping lat,long to x,y
// -----------------------------------------------------------------
export function forward(p) {
  var lon = p.x;
  var lat = p.y;

  var L = this.rs * (lon - this.lc);
  var Ls = this.cp + (this.rs * latiso(this.e, lat, Math.sin(lat)));
  var lat1 = Math.asin(Math.sin(L) / cosh(Ls));
  var Ls1 = latiso(0, lat1, Math.sin(lat1));
  p.x = this.xs + (this.n2 * Ls1);
  p.y = this.ys + (this.n2 * Math.atan(sinh(Ls) / Math.cos(L)));
  return p;
}

// inverse equations--mapping x,y to lat/long
// -----------------------------------------------------------------
export function inverse(p) {
  var x = p.x;
  var y = p.y;

  var L = Math.atan(sinh((x - this.xs) / this.n2) / Math.cos((y - this.ys) / this.n2));
  var lat1 = Math.asin(Math.sin((y - this.ys) / this.n2) / cosh((x - this.xs) / this.n2));
  var LC = latiso(0, lat1, Math.sin(lat1));
  p.x = this.lc + L / this.rs;
  p.y = invlatiso(this.e, (LC - this.cp) / this.rs);
  return p;
}

export var names = ['gstmerg', 'gstmerc'];
export default {
  init: init,
  forward: forward,
  inverse: inverse,
  names: names
};
