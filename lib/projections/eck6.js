import { forward as sinuForward, inverse as sinuInverse } from './sinu';

/**
 * Eckert VI projection — spherical sinusoidal variant with m=1, n=1+π/2.
 * Always forces spherical computation regardless of the ellipsoid.
 *
 * @typedef {Object} LocalThis
 * @property {number} m
 * @property {number} n
 * @property {number} C_y
 * @property {number} C_x
 * @property {number} es
 */

/** @this {import('../defs.js').ProjectionDefinition & LocalThis} */
export function init() {
  /* Force spherical handling */
  this.sphere = true;
  this.b = this.a;

  this.m = 1.0;
  this.n = 2.570796326794896619231321691; /* 1 + π/2 */
  this.es = 0;

  this.C_y = Math.sqrt((this.m + 1.0) / this.n);
  this.C_x = this.C_y / (this.m + 1.0);
}

export var forward = sinuForward;
export var inverse = sinuInverse;

export var names = ['Eckert_VI', 'eck6'];
export default {
  init: init,
  forward: forward,
  inverse: inverse,
  names: names
};
