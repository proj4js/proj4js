import hypot from '../common/hypot';

/**
 * @typedef {Object} LocalThis
 * @property {1 | 0} flip_axis
 * @property {number} h
 * @property {number} radius_g_1
 * @property {number} radius_g
 * @property {number} radius_p
 * @property {number} radius_p2
 * @property {number} radius_p_inv2
 * @property {'ellipse'|'sphere'} shape
 * @property {number} C
 * @property {string} sweep
 * @property {number} es
 */

/** @this {import('../defs.js').ProjectionDefinition & LocalThis} */
export function init() {
  this.flip_axis = (this.sweep === 'x' ? 1 : 0);
  this.h = Number(this.h);
  this.radius_g_1 = this.h / this.a;

  if (this.radius_g_1 <= 0 || this.radius_g_1 > 1e10) {
    throw new Error();
  }

  this.radius_g = 1.0 + this.radius_g_1;
  this.C = this.radius_g * this.radius_g - 1.0;

  if (this.es !== 0.0) {
    var one_es = 1.0 - this.es;
    var rone_es = 1 / one_es;

    this.radius_p = Math.sqrt(one_es);
    this.radius_p2 = one_es;
    this.radius_p_inv2 = rone_es;

    this.shape = 'ellipse'; // Use as a condition in the forward and inverse functions.
  } else {
    this.radius_p = 1.0;
    this.radius_p2 = 1.0;
    this.radius_p_inv2 = 1.0;

    this.shape = 'sphere'; // Use as a condition in the forward and inverse functions.
  }

  if (!this.title) {
    this.title = 'Geostationary Satellite View';
  }
}

function forward(p) {
  var lon = p.x;
  var lat = p.y;
  var tmp, v_x, v_y, v_z;
  lon = lon - this.long0;

  if (this.shape === 'ellipse') {
    lat = Math.atan(this.radius_p2 * Math.tan(lat));
    var r = this.radius_p / hypot(this.radius_p * Math.cos(lat), Math.sin(lat));

    v_x = r * Math.cos(lon) * Math.cos(lat);
    v_y = r * Math.sin(lon) * Math.cos(lat);
    v_z = r * Math.sin(lat);

    if (((this.radius_g - v_x) * v_x - v_y * v_y - v_z * v_z * this.radius_p_inv2) < 0.0) {
      p.x = Number.NaN;
      p.y = Number.NaN;
      return p;
    }

    tmp = this.radius_g - v_x;
    if (this.flip_axis) {
      p.x = this.radius_g_1 * Math.atan(v_y / hypot(v_z, tmp));
      p.y = this.radius_g_1 * Math.atan(v_z / tmp);
    } else {
      p.x = this.radius_g_1 * Math.atan(v_y / tmp);
      p.y = this.radius_g_1 * Math.atan(v_z / hypot(v_y, tmp));
    }
  } else if (this.shape === 'sphere') {
    tmp = Math.cos(lat);
    v_x = Math.cos(lon) * tmp;
    v_y = Math.sin(lon) * tmp;
    v_z = Math.sin(lat);
    tmp = this.radius_g - v_x;

    if (this.flip_axis) {
      p.x = this.radius_g_1 * Math.atan(v_y / hypot(v_z, tmp));
      p.y = this.radius_g_1 * Math.atan(v_z / tmp);
    } else {
      p.x = this.radius_g_1 * Math.atan(v_y / tmp);
      p.y = this.radius_g_1 * Math.atan(v_z / hypot(v_y, tmp));
    }
  }
  p.x = p.x * this.a;
  p.y = p.y * this.a;
  return p;
}

function inverse(p) {
  var v_x = -1.0;
  var v_y = 0.0;
  var v_z = 0.0;
  var a, b, det, k;

  p.x = p.x / this.a;
  p.y = p.y / this.a;

  if (this.shape === 'ellipse') {
    if (this.flip_axis) {
      v_z = Math.tan(p.y / this.radius_g_1);
      v_y = Math.tan(p.x / this.radius_g_1) * hypot(1.0, v_z);
    } else {
      v_y = Math.tan(p.x / this.radius_g_1);
      v_z = Math.tan(p.y / this.radius_g_1) * hypot(1.0, v_y);
    }

    var v_zp = v_z / this.radius_p;
    a = v_y * v_y + v_zp * v_zp + v_x * v_x;
    b = 2 * this.radius_g * v_x;
    det = (b * b) - 4 * a * this.C;

    if (det < 0.0) {
      p.x = Number.NaN;
      p.y = Number.NaN;
      return p;
    }

    k = (-b - Math.sqrt(det)) / (2.0 * a);
    v_x = this.radius_g + k * v_x;
    v_y *= k;
    v_z *= k;

    p.x = Math.atan2(v_y, v_x);
    p.y = Math.atan(v_z * Math.cos(p.x) / v_x);
    p.y = Math.atan(this.radius_p_inv2 * Math.tan(p.y));
  } else if (this.shape === 'sphere') {
    if (this.flip_axis) {
      v_z = Math.tan(p.y / this.radius_g_1);
      v_y = Math.tan(p.x / this.radius_g_1) * Math.sqrt(1.0 + v_z * v_z);
    } else {
      v_y = Math.tan(p.x / this.radius_g_1);
      v_z = Math.tan(p.y / this.radius_g_1) * Math.sqrt(1.0 + v_y * v_y);
    }

    a = v_y * v_y + v_z * v_z + v_x * v_x;
    b = 2 * this.radius_g * v_x;
    det = (b * b) - 4 * a * this.C;
    if (det < 0.0) {
      p.x = Number.NaN;
      p.y = Number.NaN;
      return p;
    }

    k = (-b - Math.sqrt(det)) / (2.0 * a);
    v_x = this.radius_g + k * v_x;
    v_y *= k;
    v_z *= k;

    p.x = Math.atan2(v_y, v_x);
    p.y = Math.atan(v_z * Math.cos(p.x) / v_x);
  }
  p.x = p.x + this.long0;
  return p;
}

export var names = ['Geostationary Satellite View', 'Geostationary_Satellite', 'geos'];
export default {
  init: init,
  forward: forward,
  inverse: inverse,
  names: names
};
