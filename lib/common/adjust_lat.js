import {HALF_PI} from '../constants/values';
import sign from './sign';

export default function(x) {
  return (Math.abs(x) < HALF_PI) ? x : (x - (sign(x) * Math.PI));
}
