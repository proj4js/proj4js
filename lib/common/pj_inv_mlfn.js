import pj_mlfn from './pj_mlfn';
import { EPSLN } from '../constants/values';

var MAX_ITER = 20;

export default function (arg, es, en) {
  var k = 1 / (1 - es);
  var phi = arg;
  for (var i = MAX_ITER; i; --i) { /* rarely goes over 2 iterations */
    var s = Math.sin(phi);
    var t = 1 - es * s * s;
    // t = this.pj_mlfn(phi, s, Math.cos(phi), en) - arg;
    // phi -= t * (t * Math.sqrt(t)) * k;
    t = (pj_mlfn(phi, s, Math.cos(phi), en) - arg) * (t * Math.sqrt(t)) * k;
    phi -= t;
    if (Math.abs(t) < EPSLN) {
      return phi;
    }
  }
  // ..reportError("cass:pj_inv_mlfn: Convergence error");
  return phi;
}
