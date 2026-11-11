import { HALF_PI } from '../constants/values';
import sign from './sign';

export default function (x) {
  // The poles themselves (|x| = HALF_PI) are kept, not sent to the other pole
  return (Math.abs(x) <= HALF_PI) ? x : (x - (sign(x) * Math.PI));
}
