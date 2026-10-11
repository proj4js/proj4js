/**
 * @param {Array<number>} pp
 * @param {number} B
 * @param {number} [cos2B] cos(2 * B), if already known
 * @param {number} [sin2B] sin(2 * B), if already known
 * @returns {number}
 */
export default function (pp, B, cos2B, sin2B) {
  var cos_2B = 2 * (cos2B === undefined ? Math.cos(2 * B) : cos2B);
  var i = pp.length - 1;
  var h1 = pp[i];
  var h2 = 0;
  var h;

  while (--i >= 0) {
    h = -h2 + cos_2B * h1 + pp[i];
    h2 = h1;
    h1 = h;
  }

  return (B + h * (sin2B === undefined ? Math.sin(2 * B) : sin2B));
}
