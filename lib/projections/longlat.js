export function init() {
  // no-op for longlat
}

function identity(pt) {
  return pt;
}
export { identity as forward };
export { identity as inverse };
export var names = ['longlat', 'identity'];
export default {
  init: init,
  forward: identity,
  inverse: identity,
  names: names
};
