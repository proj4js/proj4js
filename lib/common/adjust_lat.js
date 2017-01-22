var HALF_PI = Math.PI/2;
import sign from './sign';

export default function(x) {
  return (Math.abs(x) < HALF_PI) ? x : (x - (sign(x) * Math.PI));
}