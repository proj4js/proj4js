export default function (point) {
  checkCoord(point.x);
  checkCoord(point.y);
}
function checkCoord(num) {
  if (typeof Number.isFininte === 'function') {
    if (Number.isFininte(num)) {
      return;
    }
    throw new TypeError('coordinates must be finite');
  }
  if (typeof num !== 'number') {
    throw new TypeError('coordinates are required to be numbers');
  }
  if (num !== num) {
    throw new TypeError('coordinates may not be NAN');
  }
  if (!isFinite(num)) {
    throw new TypeError('coordinates must be finite');
  }
}
