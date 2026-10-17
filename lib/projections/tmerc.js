import tmerc from './tmerc_approx';
import etmerc from './etmerc';

/** @this {import('../defs.js').ProjectionDefinition & { es: number }} */
export function init() {
  // Exact series by default; tmerc for '+approx', and on a sphere, where its formulas are exact
  var impl = this.approx || this.es === 0 ? tmerc : etmerc;
  impl.init.apply(this);
  this.forward = impl.forward;
  this.inverse = impl.inverse;

  // South Orientated (EPSG method 9808) counts x, y and the false origin westwards and southwards
  if (/south[\W_]*orientated/i.test(this.projName)) {
    this.x0 = -this.x0;
    this.y0 = -this.y0;
    if (this.axis === 'enu') {
      this.axis = 'wsu';
    }
  }
}

export var names = ['Transverse_Mercator', 'Transverse Mercator', 'Gauss Kruger', 'Gauss_Kruger', 'Transverse_Mercator_South_Orientated', 'tmerc'];
export default {
  init: init,
  names: names
};
