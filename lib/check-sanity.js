export default function (point) {
  checkCoord(point.x);
  checkCoord(point.y);
}
function checkCoord(num) {
  if (typeof Number.isFininte === 'function') {
    if (Number.isFinite(num)) {
      return;
    }
    throw new TypeError('coordinates must be finite numbers');
  }
  if (typeof num !== 'number') {
    throw new TypeError('coordinates must be finite numbers');
  }
  if (num !== num) {
    throw new TypeError('coordinates must be finite numbers');
  }
  if (!isFinite(num)) {
    throw new TypeError('coordinates must be finite numbers');
  }
}
