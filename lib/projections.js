import merc from "./projections/merc";
import longlat from "./projections/longlat";
var projs = [merc, longlat];
var names = {};
var projStore = [];

function add(proj, i) {
  var len = projStore.length;
  if (!proj.names) {
    console.log(i);
    return true;
  }
  projStore[len] = proj;
  proj.names.forEach(function(n) {
    names[n.toLowerCase()] = len;
  });
  return this;
}

export {add};

export function get(name) {
  if (!name) {
    return false;
  }
  var n = name.toLowerCase();
  if (typeof names[n] !== 'undefined' && projStore[names[n]]) {
    return projStore[names[n]];
  }
}

export function start() {
  projs.forEach(add);
}
export default {
  start: start,
  add: add,
  get: get
};
