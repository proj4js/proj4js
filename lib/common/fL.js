import {HALF_PI} from '../constants/values';

export default function(x, L) {
  return 2 * Math.atan(x * Math.exp(L)) - HALF_PI;
}
