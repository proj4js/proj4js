import tmerc from './tmerc_approx';
import etmerc from './etmerc';

/** @this {import('../defs.js').ProjectionDefinition & { es: number }} */
export function init() {
  // Exact series by default; tmerc for '+approx', and on a sphere, where its formulas are exact
  var impl = this.approx || this.es === 0 ? tmerc : etmerc;
  impl.init.apply(this);
  this.forward = impl.forward;
  this.inverse = impl.inverse;
}

export var names = ['Transverse_Mercator', 'Transverse Mercator', 'Gauss Kruger', 'Gauss_Kruger', 'tmerc'];
export default {
  init: init,
  names: names
};
