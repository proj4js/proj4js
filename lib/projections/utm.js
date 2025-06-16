import adjust_zone from '../common/adjust_zone';
import etmerc from './etmerc';
export var dependsOn = 'etmerc';
import { D2R } from '../constants/values';

/** @this {import('../defs.js').ProjectionDefinition} */
export function init() {
  var zone = adjust_zone(this.zone, this.long0);
  if (zone === undefined) {
    throw new Error('unknown utm zone');
  }
  this.lat0 = 0;
  this.long0 = ((6 * Math.abs(zone)) - 183) * D2R;
  this.x0 = 500000;
  this.y0 = this.utmSouth ? 10000000 : 0;
  this.k0 = 0.9996;

  etmerc.init.apply(this);
  this.forward = etmerc.forward;
  this.inverse = etmerc.inverse;
}

export var names = ['Universal Transverse Mercator System', 'utm'];
export default {
  init: init,
  names: names,
  dependsOn: dependsOn
};
