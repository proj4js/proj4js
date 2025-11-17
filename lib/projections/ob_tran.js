import adjust_lon from '../common/adjust_lon';
import { D2R, R2D, HALF_PI, EPSLN } from '../constants/values';
import Proj from '../Proj';
import { names as longLatNames } from './longlat';

/**
    Original projection implementation:
        https://github.com/OSGeo/PROJ/blob/46c47e9adf6376ae06afabe5d24a0016a05ced82/src/projections/ob_tran.cpp

    Documentation:
        https://proj.org/operations/projections/ob_tran.html

    References/Formulas:
        https://pubs.usgs.gov/pp/1395/report.pdf

    Examples:
        +proj=ob_tran +o_proj=moll +o_lat_p=45 +o_lon_p=-90
        +proj=ob_tran +o_proj=moll +o_lat_p=45 +o_lon_p=-90 +lon_0=60
        +proj=ob_tran +o_proj=moll +o_lat_p=45 +o_lon_p=-90 +lon_0=-90
*/

const projectionType = {
  OBLIQUE: {
    forward: forwardOblique,
    inverse: inverseOblique
  },
  TRANSVERSE: {
    forward: forwardTransverse,
    inverse: inverseTransverse
  }
};

/**
 * @typedef {Object} LocalThis
 * @property {number} lamp
 * @property {number} cphip
 * @property {number} sphip
 * @property {Object} projectionType
 * @property {string | undefined} o_proj
 * @property {string | undefined} o_lon_p
 * @property {string | undefined} o_lat_p
 * @property {string | undefined} o_alpha
 * @property {string | undefined} o_lon_c
 * @property {string | undefined} o_lat_c
 * @property {string | undefined} o_lon_1
 * @property {string | undefined} o_lat_1
 * @property {string | undefined} o_lon_2
 * @property {string | undefined} o_lat_2
 * @property {number | undefined} oLongP
 * @property {number | undefined} oLatP
 * @property {number | undefined} oAlpha
 * @property {number | undefined} oLongC
 * @property {number | undefined} oLatC
 * @property {number | undefined} oLong1
 * @property {number | undefined} oLat1
 * @property {number | undefined} oLong2
 * @property {number | undefined} oLat2
 * @property {boolean} isIdentity
 * @property {import('..').Converter} obliqueProjection
 *
 */

/**
 *    Parameters can be from the following sets:
 *       New pole --> o_lat_p, o_lon_p
 *       Rotate about point --> o_alpha, o_lon_c, o_lat_c
 *       New equator points --> lon_1, lat_1, lon_2, lat_2
 *
 *    Per the original source code, the parameter sets are
 *    checked in the order of the object below.
 */
const paramSets = {
  ROTATE: {
    o_alpha: 'oAlpha',
    o_lon_c: 'oLongC',
    o_lat_c: 'oLatC'
  },
  NEW_POLE: {
    o_lat_p: 'oLatP',
    o_lon_p: 'oLongP'
  },
  NEW_EQUATOR: {
    o_lon_1: 'oLong1',
    o_lat_1: 'oLat1',
    o_lon_2: 'oLong2',
    o_lat_2: 'oLat2'
  }
};

/** @this {import('../defs.js').ProjectionDefinition & LocalThis} */
export function init() {
  this.x0 = this.x0 || 0;
  this.y0 = this.y0 || 0;
  this.long0 = this.long0 || 0;
  this.title = this.title || 'General Oblique Transformation';
  this.isIdentity = longLatNames.includes(this.o_proj);

  /** Verify required parameters exist */
  if (!this.o_proj) {
    throw new Error('Missing parameter: o_proj');
  }

  if (this.o_proj === `ob_tran`) {
    throw new Error('Invalid value for o_proj: ' + this.o_proj);
  }

  const newProjStr = this.projStr.replace('+proj=ob_tran', '').replace('+o_proj=', '+proj=').trim();

  /** @type {import('../defs.js').ProjectionDefinition} */
  const oProj = Proj(newProjStr);
  if (!oProj) {
    throw new Error('Invalid parameter: o_proj. Unknown projection ' + this.o_proj);
  }
  oProj.long0 = 0; // we handle long0 before/after forward/inverse
  this.obliqueProjection = oProj;

  let matchedSet;
  const paramSetsKeys = Object.keys(paramSets);

  /**
   * parse strings, convert to radians, throw on NaN
   * @param {string} name
   * @returns {number | undefined}
   */
  const parseParam = (name) => {
    if (typeof this[name] === `undefined`) {
      return undefined;
    }
    const val = parseFloat(this[name]) * D2R;
    if (isNaN(val)) {
      throw new Error('Invalid value for ' + name + ': ' + this[name]);
    }
    return val;
  };

  for (let i = 0; i < paramSetsKeys.length; i++) {
    const setKey = paramSetsKeys[i];
    const set = paramSets[setKey];
    const params = Object.entries(set);
    const setHasParams = params.some(
      ([p]) => typeof this[p] !== 'undefined'
    );
    if (!setHasParams) {
      continue;
    }
    matchedSet = set;
    for (let ii = 0; ii < params.length; ii++) {
      const [inputParam, param] = params[ii];
      const val = parseParam(inputParam);
      if (typeof val === 'undefined') {
        throw new Error('Missing parameter: ' + inputParam + '.');
      }
      this[param] = val;
    }
    break;
  }

  if (!matchedSet) {
    throw new Error('No valid parameters provided for ob_tran projection.');
  }

  const { lamp, phip } = createRotation(this, matchedSet);
  this.lamp = lamp;

  if (Math.abs(phip) > EPSLN) {
    this.cphip = Math.cos(phip);
    this.sphip = Math.sin(phip);
    this.projectionType = projectionType.OBLIQUE;
  } else {
    this.projectionType = projectionType.TRANSVERSE;
  }
}

// ob_tran forward equations--mapping (lat,long) to (x,y)
// transverse (90 degrees from normal orientation) - forwardTransverse
// or oblique (arbitrary angle) used based on parameters - forwardOblique
// -----------------------------------------------------------------
/** @this {import('../defs.js').ProjectionDefinition & LocalThis} */
export function forward(p) {
  return this.projectionType.forward(this, p);
}

// inverse equations--mapping (x,y) to (lat,long)
// transverse: inverseTransverse
// oblique: inverseOblique
// -----------------------------------------------------------------
/** @this {import('../defs.js').ProjectionDefinition & LocalThis} */
export function inverse(p) {
  return this.projectionType.inverse(this, p);
}

/**
 * @param {import('../defs.js').ProjectionDefinition & LocalThis} params - Initialized projection definition
 * @param {Object} how - Transformation method
 * @returns {{phip: number, lamp: number}}
 */
function createRotation(params, how) {
  let phip, lamp;
  if (how === paramSets.ROTATE) {
    let lamc = params.oLongC;
    let phic = params.oLatC;
    let alpha = params.oAlpha;
    if (Math.abs(Math.abs(phic) - HALF_PI) <= EPSLN) {
      throw new Error('Invalid value for o_lat_c: ' + params.o_lat_c + ' should be < 90°');
    }
    lamp = lamc + Math.atan2(-1 * Math.cos(alpha), -1 * Math.sin(alpha) * Math.sin(phic));
    phip = Math.asin(Math.cos(phic) * Math.sin(alpha));
  } else if (how === paramSets.NEW_POLE) {
    lamp = params.oLongP;
    phip = params.oLatP;
  } else {
    let lam1 = params.oLong1;
    let phi1 = params.oLat1;
    let lam2 = params.oLong2;
    let phi2 = params.oLat2;
    let con = Math.abs(phi1);

    if (Math.abs(phi1) > HALF_PI - EPSLN) {
      throw new Error('Invalid value for o_lat_1: ' + params.o_lat_1 + ' should be < 90°');
    }

    if (Math.abs(phi2) > HALF_PI - EPSLN) {
      throw new Error('Invalid value for o_lat_2: ' + params.o_lat_2 + ' should be < 90°');
    }

    if (Math.abs(phi1 - phi2) < EPSLN) {
      throw new Error('Invalid value for o_lat_1 and o_lat_2: o_lat_1 should be different from o_lat_2');
    }
    if (con < EPSLN) {
      throw new Error('Invalid value for o_lat_1: o_lat_1 should be different from zero');
    }

    lamp = Math.atan2(
      (Math.cos(phi1) * Math.sin(phi2) * Math.cos(lam1))
      - (Math.sin(phi1) * Math.cos(phi2) * Math.cos(lam2)),
      (Math.sin(phi1) * Math.cos(phi2) * Math.sin(lam2))
      - (Math.cos(phi1) * Math.sin(phi2) * Math.sin(lam1))
    );

    phip = Math.atan(-1 * Math.cos(lamp - lam1) / Math.tan(phi1));
  }

  return { lamp, phip };
}

/**
 * Forward (lng, lat) to (x, y) for oblique case
 * @param {import('../defs.js').ProjectionDefinition & LocalThis} self
 * @param {{x: number, y: number}} lp - lambda, phi
 */
function forwardOblique(self, lp) {
  let { x: lam, y: phi } = lp;
  lam += self.long0;
  const coslam = Math.cos(lam);
  const sinphi = Math.sin(phi);
  const cosphi = Math.cos(phi);

  lp.x = adjust_lon(
    Math.atan2(
      cosphi * Math.sin(lam),
      (self.sphip * cosphi * coslam) + (self.cphip * sinphi)
    ) + self.lamp
  );
  lp.y = Math.asin(
    (self.sphip * sinphi) - (self.cphip * cosphi * coslam)
  );

  const result = self.obliqueProjection.forward(lp);
  if (self.isIdentity) {
    result.x *= R2D;
    result.y *= R2D;
  }
  return result;
}

/**
 * Forward (lng, lat) to (x, y) for transverse case
 * @param {import('../defs.js').ProjectionDefinition & LocalThis} self
 * @param {{x: number, y: number}} lp - lambda, phi
 */
function forwardTransverse(self, lp) {
  let { x: lam, y: phi } = lp;
  lam += self.long0;
  const cosphi = Math.cos(phi);
  const coslam = Math.cos(lam);
  lp.x = adjust_lon(
    Math.atan2(
      cosphi * Math.sin(lam),
      Math.sin(phi)
    ) + self.lamp
  );
  lp.y = Math.asin(-1 * cosphi * coslam);

  const result = self.obliqueProjection.forward(lp);

  if (self.isIdentity) {
    result.x *= R2D;
    result.y *= R2D;
  }
  return result;
}

/**
 * Inverse (x, y) to (lng, lat) for oblique case
 * @param {import('../defs.js').ProjectionDefinition & LocalThis} self
 * @param {{x: number, y: number}} lp - lambda, phi
 */
function inverseOblique(self, lp) {
  if (self.isIdentity) {
    lp.x *= D2R;
    lp.y *= D2R;
  }

  const innerLp = self.obliqueProjection.inverse(lp);
  let { x: lam, y: phi } = innerLp;

  if (lam < Number.MAX_VALUE) {
    lam -= self.lamp;
    const coslam = Math.cos(lam);
    const sinphi = Math.sin(phi);
    const cosphi = Math.cos(phi);
    lp.x = Math.atan2(
      cosphi * Math.sin(lam),
      (self.sphip * cosphi * coslam) - (self.cphip * sinphi)
    );
    lp.y = Math.asin(
      (self.sphip * sinphi) + (self.cphip * cosphi * coslam)
    );
  }

  lp.x = adjust_lon(lp.x + self.long0);
  return lp;
}

/**
 * Inverse (x, y) to (lng, lat) for transverse case
 * @param {import('../defs.js').ProjectionDefinition & LocalThis} self
 * @param {{x: number, y: number}} lp - lambda, phi
 */
function inverseTransverse(self, lp) {
  if (self.isIdentity) {
    lp.x *= D2R;
    lp.y *= D2R;
  }

  const innerLp = self.obliqueProjection.inverse(lp);
  let { x: lam, y: phi } = innerLp;

  if (lam < Number.MAX_VALUE) {
    const cosphi = Math.cos(phi);
    lam -= self.lamp;
    lp.x = Math.atan2(
      cosphi * Math.sin(lam),
      -1 * Math.sin(phi)
    );
    lp.y = Math.asin(
      cosphi * Math.cos(lam)
    );
  }

  lp.x = adjust_lon(lp.x + self.long0);
  return lp;
}

export var names = ['General Oblique Transformation', 'General_Oblique_Transformation', 'ob_tran'];
export default {
  init: init,
  forward: forward,
  inverse: inverse,
  names: names
};
