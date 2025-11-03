import adjust_lon from '../common/adjust_lon';
import { D2R, HALF_PI, TOL } from '../constants/values';
import Proj from '../Proj';

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
 * @property {import('..').Converter} obliqueProjection
 *
 */

const paramSets = {
  NEW_POLE: {
    o_lat_p: 'oLatP',
    o_lon_p: 'oLongP'
  },
  ROTATE: {
    o_alpha: 'oAlpha',
    o_lon_c: 'oLongC',
    o_lat_c: 'oLatC'
  },
  NEW_EQUATOR: {
    o_lon_1: 'oLong1',
    o_lat_1: 'oLat1',
    o_lon_2: 'oLong2',
    o_lat_2: 'oLat2'
  }
};

const paramSetsValues = Object.values(paramSets);

/** @this {import('../defs.js').ProjectionDefinition & LocalThis} */
export function init() {
  /** Verify required parameters exist */
  if (!this.o_proj) {
    throw new Error('Missing parameter: o_proj');
  }
  const oProj = Proj('+proj=' + this.o_proj);

  if (!oProj) {
    throw new Error('Invalid parameter: o_proj. Unknown projection ' + this.o_proj);
  }
  this.obliqueProjection = oProj;

  /**
   *    Parameters can be from the following sets:
   *       New pole --> o_lat_p, o_lon_p
   *       Rotate about point --> o_alpha, o_lon_c, o_lat_c
   *       New equator points --> lon_1, lat_1, lon_2, lat_2
   */

  // Try to find which set the user is targeting, -1 = no match
  let matched = -1;

  for (let i = 0; i < paramSetsValues.length; i++) {
    const set = paramSetsValues[i];
    const params = Object.entries(set);
    for (let ii = 0; ii < params.length; ii++) {
      const inputParam = params[ii][0];
      const param = params[ii][1];
      if (typeof this[inputParam] !== 'undefined') {
        this[param] = parseFloat(this[inputParam]) * D2R;

        if (isNaN(this[param])) {
          throw new Error('Invalid value for ' + inputParam + ': ' + this[inputParam]);
        }

        if (matched === -1 || matched === i) {
          matched = i;
        } else if (ii > 0) {
          throw new Error('Provided parameter ' + inputParam + ', but missing other required parameters.');
        } else {
          throw new Error('Invalid parameter: ' + inputParam + '. Conflicts with other provided parameters.');
        }
      } else if (matched === i) {
        throw new Error('Missing parameter: ' + inputParam);
      }
    }
  }
  if (matched === -1) {
    throw new Error('No valid parameter set provided for ob_tran projection.');
  }

  const matchedSet = paramSetsValues[matched];

  this.long0 = this.long0 || 0;
  this.x0 = this.x0 || 0;
  this.y0 = this.y0 || 0;
  this.title = this.title || 'General Oblique Transformation';

  const { lamp, phip } = createRotation(this, matchedSet);
  this.lamp = lamp;

  if (Math.abs(phip) > TOL) {
    this.cphip = Math.cos(phip);
    this.sphip = Math.sin(phip);
    this.projectionType = projectionType.OBLIQUE;
  } else {
    this.projectionType = projectionType.TRANSVERSE;
  }
}

// forward equations--mapping (lat,long) to (x,y)
// oblique - true poles of earth lie on the equator of the basic projection,
//  and the poles of the projection lie on the equator of the earth
// transverse -
//
// -----------------------------------------------------------------

/** @this {import('../defs.js').ProjectionDefinition & LocalThis} */
export function forward(p) {
  return this.projectionType.forward(this, p);
}

// inverse equations--mapping (x,y) to (lat,long)

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

    if (Math.abs(Math.abs(phic) - HALF_PI) <= TOL) {
      throw new Error('Invalid value for o_lat_c: ' + params.oLatC + ' should be < 90°');
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

    if (Math.abs(phi1) > HALF_PI - TOL) {
      throw new Error('Invalid value for o_lat_1: ' + params.oLat1 + ' should be < 90°');
    }

    if (Math.abs(phi2) > HALF_PI - TOL) {
      throw new Error('Invalid value for o_lat_2: ' + params.oLat2 + ' should be < 90°');
    }

    if (Math.abs(phi1 - phi2) < TOL) {
      throw new Error('Invalid value for o_lat_1 and o_lat_2: o_lat_1 should be different from o_lat_2');
    }
    if (con < TOL) {
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
 * @param {import('../defs.js').ProjectionDefinition & LocalThis} self
 * @param {{x: number, y: number}} lp - lambda, phi
 */
function forwardOblique(self, lp) {
  const { x: lam, y: phi } = lp;
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

  return self.obliqueProjection.forward(lp);
}

/**
 * @param {import('../defs.js').ProjectionDefinition & LocalThis} self
 * @param {{x: number, y: number}} lp - lambda, phi
 */
function forwardTransverse(self, lp) {
  const { x: lam, y: phi } = lp;
  const cosphi = Math.cos(phi);
  const coslam = Math.cos(lam);
  lp.x = adjust_lon(
    Math.atan2(
      cosphi * Math.sin(lam),
      Math.sin(phi)
    ) + self.lamp
  );
  lp.y = Math.asin(-1 * cosphi * coslam);

  return self.obliqueProjection.forward(lp);
}

/**
 * @param {import('../defs.js').ProjectionDefinition & LocalThis} self
 * @param {{x: number, y: number}} lp - lambda, phi
 */
function inverseOblique(self, lp) {
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

  return lp;
}

/**
 * @param {import('../defs.js').ProjectionDefinition & LocalThis} self
 * @param {{x: number, y: number}} lp - lambda, phi
 */
function inverseTransverse(self, lp) {
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

  return lp;
}

export var names = ['General Oblique Transformation', 'General_Oblique_Transformation', 'ob_tran'];
export default {
  init: init,
  forward: forward,
  inverse: inverse,
  names: names
};
