var HALF_PI = Math.PI/2;

export default function(x, L) {
  return 2 * Math.atan(x * Math.exp(L)) - HALF_PI;
};