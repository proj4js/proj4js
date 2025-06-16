import tsfnz from '../common/tsfnz';
import adjust_lon from '../common/adjust_lon';
import phi2z from '../common/phi2z';
import { EPSLN, HALF_PI, TWO_PI, FORTPI } from '../constants/values';
import { getNormalizedProjName } from '../projections';

/**
 * @typedef {Object} LocalThis
 * @property {boolean} no_off
 * @property {boolean} no_rot
 * @property {number} rectified_grid_angle
 * @property {number} es
 * @property {number} A
 * @property {number} B
 * @property {number} E
 * @property {number} e
 * @property {number} lam0
 * @property {number} singam
 * @property {number} cosgam
 * @property {number} sinrot
 * @property {number} cosrot
 * @property {number} rB
 * @property {number} ArB
 * @property {number} BrA
 * @property {number} u_0
 * @property {number} v_pole_n
 * @property {number} v_pole_s
 */

var TOL = 1e-7;

function isTypeA(P) {
  var typeAProjections = ['Hotine_Oblique_Mercator', 'Hotine_Oblique_Mercator_variant_A', 'Hotine_Oblique_Mercator_Azimuth_Natural_Origin'];
  var projectionName = typeof P.projName === 'object' ? Object.keys(P.projName)[0] : P.projName;

  return 'no_uoff' in P || 'no_off' in P || typeAProjections.indexOf(projectionName) !== -1 || typeAProjections.indexOf(getNormalizedProjName(projectionName)) !== -1;
}

/**
 * Initialize the Oblique Mercator  projection
 * @this {import('../defs.js').ProjectionDefinition & LocalThis}
 */
export function init() {
  var con, com, cosph0, D, F, H, L, sinph0, p, J, gamma = 0,
    gamma0, lamc = 0, lam1 = 0, lam2 = 0, phi1 = 0, phi2 = 0, alpha_c = 0;

  // only Type A uses the no_off or no_uoff property
  // https://github.com/OSGeo/proj.4/issues/104
  this.no_off = isTypeA(this);
  this.no_rot = 'no_rot' in this;

  var alp = false;
  if ('alpha' in this) {
    alp = true;
  }

  var gam = false;
  if ('rectified_grid_angle' in this) {
    gam = true;
  }

  if (alp) {
    alpha_c = this.alpha;
  }

  if (gam) {
    gamma = this.rectified_grid_angle;
  }

  if (alp || gam) {
    lamc = this.longc;
  } else {
    lam1 = this.long1;
    phi1 = this.lat1;
    lam2 = this.long2;
    phi2 = this.lat2;

    if (Math.abs(phi1 - phi2) <= TOL || (con = Math.abs(phi1)) <= TOL
      || Math.abs(con - HALF_PI) <= TOL || Math.abs(Math.abs(this.lat0) - HALF_PI) <= TOL
      || Math.abs(Math.abs(phi2) - HALF_PI) <= TOL) {
      throw new Error();
    }
  }

  var one_es = 1.0 - this.es;
  com = Math.sqrt(one_es);

  if (Math.abs(this.lat0) > EPSLN) {
    sinph0 = Math.sin(this.lat0);
    cosph0 = Math.cos(this.lat0);
    con = 1 - this.es * sinph0 * sinph0;
    this.B = cosph0 * cosph0;
    this.B = Math.sqrt(1 + this.es * this.B * this.B / one_es);
    this.A = this.B * this.k0 * com / con;
    D = this.B * com / (cosph0 * Math.sqrt(con));
    F = D * D - 1;

    if (F <= 0) {
      F = 0;
    } else {
      F = Math.sqrt(F);
      if (this.lat0 < 0) {
        F = -F;
      }
    }

    this.E = F += D;
    this.E *= Math.pow(tsfnz(this.e, this.lat0, sinph0), this.B);
  } else {
    this.B = 1 / com;
    this.A = this.k0;
    this.E = D = F = 1;
  }

  if (alp || gam) {
    if (alp) {
      gamma0 = Math.asin(Math.sin(alpha_c) / D);
      if (!gam) {
        gamma = alpha_c;
      }
    } else {
      gamma0 = gamma;
      alpha_c = Math.asin(D * Math.sin(gamma0));
    }
    this.lam0 = lamc - Math.asin(0.5 * (F - 1 / F) * Math.tan(gamma0)) / this.B;
  } else {
    H = Math.pow(tsfnz(this.e, phi1, Math.sin(phi1)), this.B);
    L = Math.pow(tsfnz(this.e, phi2, Math.sin(phi2)), this.B);
    F = this.E / H;
    p = (L - H) / (L + H);
    J = this.E * this.E;
    J = (J - L * H) / (J + L * H);
    con = lam1 - lam2;

    if (con < -Math.PI) {
      lam2 -= TWO_PI;
    } else if (con > Math.PI) {
      lam2 += TWO_PI;
    }

    this.lam0 = adjust_lon(0.5 * (lam1 + lam2) - Math.atan(J * Math.tan(0.5 * this.B * (lam1 - lam2)) / p) / this.B);
    gamma0 = Math.atan(2 * Math.sin(this.B * adjust_lon(lam1 - this.lam0)) / (F - 1 / F));
    gamma = alpha_c = Math.asin(D * Math.sin(gamma0));
  }

  this.singam = Math.sin(gamma0);
  this.cosgam = Math.cos(gamma0);
  this.sinrot = Math.sin(gamma);
  this.cosrot = Math.cos(gamma);

  this.rB = 1 / this.B;
  this.ArB = this.A * this.rB;
  this.BrA = 1 / this.ArB;

  if (this.no_off) {
    this.u_0 = 0;
  } else {
    this.u_0 = Math.abs(this.ArB * Math.atan(Math.sqrt(D * D - 1) / Math.cos(alpha_c)));

    if (this.lat0 < 0) {
      this.u_0 = -this.u_0;
    }
  }

  F = 0.5 * gamma0;
  this.v_pole_n = this.ArB * Math.log(Math.tan(FORTPI - F));
  this.v_pole_s = this.ArB * Math.log(Math.tan(FORTPI + F));
}

/* Oblique Mercator forward equations--mapping lat,long to x,y
    ---------------------------------------------------------- */
export function forward(p) {
  var coords = {};
  var S, T, U, V, W, temp, u, v;
  p.x = p.x - this.lam0;

  if (Math.abs(Math.abs(p.y) - HALF_PI) > EPSLN) {
    W = this.E / Math.pow(tsfnz(this.e, p.y, Math.sin(p.y)), this.B);

    temp = 1 / W;
    S = 0.5 * (W - temp);
    T = 0.5 * (W + temp);
    V = Math.sin(this.B * p.x);
    U = (S * this.singam - V * this.cosgam) / T;

    if (Math.abs(Math.abs(U) - 1.0) < EPSLN) {
      throw new Error();
    }

    v = 0.5 * this.ArB * Math.log((1 - U) / (1 + U));
    temp = Math.cos(this.B * p.x);

    if (Math.abs(temp) < TOL) {
      u = this.A * p.x;
    } else {
      u = this.ArB * Math.atan2((S * this.cosgam + V * this.singam), temp);
    }
  } else {
    v = p.y > 0 ? this.v_pole_n : this.v_pole_s;
    u = this.ArB * p.y;
  }

  if (this.no_rot) {
    coords.x = u;
    coords.y = v;
  } else {
    u -= this.u_0;
    coords.x = v * this.cosrot + u * this.sinrot;
    coords.y = u * this.cosrot - v * this.sinrot;
  }

  coords.x = (this.a * coords.x + this.x0);
  coords.y = (this.a * coords.y + this.y0);

  return coords;
}

export function inverse(p) {
  var u, v, Qp, Sp, Tp, Vp, Up;
  var coords = {};

  p.x = (p.x - this.x0) * (1.0 / this.a);
  p.y = (p.y - this.y0) * (1.0 / this.a);

  if (this.no_rot) {
    v = p.y;
    u = p.x;
  } else {
    v = p.x * this.cosrot - p.y * this.sinrot;
    u = p.y * this.cosrot + p.x * this.sinrot + this.u_0;
  }

  Qp = Math.exp(-this.BrA * v);
  Sp = 0.5 * (Qp - 1 / Qp);
  Tp = 0.5 * (Qp + 1 / Qp);
  Vp = Math.sin(this.BrA * u);
  Up = (Vp * this.cosgam + Sp * this.singam) / Tp;

  if (Math.abs(Math.abs(Up) - 1) < EPSLN) {
    coords.x = 0;
    coords.y = Up < 0 ? -HALF_PI : HALF_PI;
  } else {
    coords.y = this.E / Math.sqrt((1 + Up) / (1 - Up));
    coords.y = phi2z(this.e, Math.pow(coords.y, 1 / this.B));

    if (coords.y === Infinity) {
      throw new Error();
    }

    coords.x = -this.rB * Math.atan2((Sp * this.cosgam - Vp * this.singam), Math.cos(this.BrA * u));
  }

  coords.x += this.lam0;

  return coords;
}

export var names = ['Hotine_Oblique_Mercator', 'Hotine Oblique Mercator', 'Hotine_Oblique_Mercator_variant_A', 'Hotine_Oblique_Mercator_Variant_B', 'Hotine_Oblique_Mercator_Azimuth_Natural_Origin', 'Hotine_Oblique_Mercator_Two_Point_Natural_Origin', 'Hotine_Oblique_Mercator_Azimuth_Center', 'Oblique_Mercator', 'omerc'];
export default {
  init: init,
  forward: forward,
  inverse: inverse,
  names: names
};
