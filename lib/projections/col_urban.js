/**
 * Colombia Urban (EPSG method 1052), ported from PROJ's col_urban.cpp.
 * Formulas from IOGP Publication 373-7-2, Geomatics Guidance Note 7 part 2.
 */
import adjust_lon from '../common/adjust_lon';

/**
 * @typedef {Object} LocalThis
 * @property {number} es
 * @property {number} A
 * @property {number} B
 * @property {number} C
 * @property {number} D
 * @property {number} rho0
 * @property {number} [projection_plane_origin_height]
 * @property {number} [Height]
 */

/** @this {import('../defs.js').ProjectionDefinition & LocalThis} */
export function init() {
  this.x0 = this.x0 || 0;
  this.y0 = this.y0 || 0;
  this.lat0 = this.lat0 || 0;
  this.long0 = this.long0 || 0;
  if (this.h0 === undefined) {
    this.h0 = this.projection_plane_origin_height || (this.Height || 0) * (this.to_meter || 1);
  }

  var h0 = this.h0 / this.a;
  var sinphi0 = Math.sin(this.lat0);
  var nu0 = 1 / Math.sqrt(1 - this.es * sinphi0 * sinphi0);
  this.A = 1 + h0 / nu0;
  this.rho0 = (1 - this.es) / Math.pow(1 - this.es * sinphi0 * sinphi0, 1.5);
  this.B = Math.tan(this.lat0) / (2 * this.rho0 * nu0);
  this.C = 1 + h0;
  this.D = this.rho0 * (1 + h0 / (1 - this.es));
}

/** @this {import('../defs.js').ProjectionDefinition & LocalThis} */
export function forward(p) {
  var lam = adjust_lon(p.x - this.long0, this.over);
  var phi = p.y;

  var sinphi = Math.sin(phi);
  var nu = 1 / Math.sqrt(1 - this.es * sinphi * sinphi);
  var lamNuCosphi = lam * nu * Math.cos(phi);
  var sinphim = Math.sin(0.5 * (phi + this.lat0));
  var rhom = (1 - this.es) / Math.pow(1 - this.es * sinphim * sinphim, 1.5);
  var g = 1 + this.h0 / (this.a * rhom);

  p.x = this.a * this.A * lamNuCosphi + this.x0;
  p.y = this.a * g * this.rho0 * ((phi - this.lat0) + this.B * lamNuCosphi * lamNuCosphi) + this.y0;
  return p;
}

/** @this {import('../defs.js').ProjectionDefinition & LocalThis} */
export function inverse(p) {
  var x = (p.x - this.x0) / this.a;
  var y = (p.y - this.y0) / this.a;

  var phi = this.lat0 + y / this.D - this.B * (x / this.C) * (x / this.C);
  var sinphi = Math.sin(phi);
  var nu = 1 / Math.sqrt(1 - this.es * sinphi * sinphi);
  var lam = x / (this.C * nu * Math.cos(phi));

  p.x = adjust_lon(lam + this.long0, this.over);
  p.y = phi;
  return p;
}

export var names = ['Colombia Urban', 'IGAC_Plano_Cartesiano', 'col_urban'];
export default {
  init: init,
  forward: forward,
  inverse: inverse,
  names: names
};
