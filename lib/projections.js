import merc from './projections/merc';
import longlat from './projections/longlat';
/** @type {Array<Partial<import('./Proj').default>>} */
var projs = [merc, longlat];
var names = {};
var projStore = [];
var builtinNames = new Set();
var lastNames, lastBuiltin;

/**
 * @param {import('./Proj').default} proj
 * @param {number} i
 */
export function add(proj, i) {
  var len = projStore.length;
  if (!proj.names) {
    console.log(i);
    return true;
  }
  projStore[len] = proj;
  proj.names.forEach(function (n) {
    names[n.toLowerCase()] = len;
  });
  return this;
}

export function getNormalizedProjName(n) {
  return n.replace(/[-\(\)\s]+/g, ' ').trim().replace(/ /g, '_');
}

/**
 * Get a projection by name.
 * @param {string} name
 * @returns {import('./Proj').default|false}
 */
export function get(name) {
  if (!name) {
    return false;
  }
  var n = name.toLowerCase();
  if (typeof names[n] !== 'undefined' && projStore[names[n]]) {
    return projStore[names[n]];
  }
  n = getNormalizedProjName(n);
  if (n in names && projStore[names[n]]) {
    return projStore[names[n]];
  }
}

export function start() {
  projs.forEach(add);
}

/**
 * Record the projections registered so far as proj4's own.
 */
export function markBuiltins() {
  projStore.forEach(function (proj) {
    builtinNames.add(proj.names);
  });
}

/**
 * Whether a projection uses proj4's own implementation, rather than one registered by the user.
 * @param {import('./defs').ProjectionDefinition | import('./Proj').default} proj
 * @returns {boolean}
 */
export function isBuiltin(proj) {
  var names = /** @type {import('./Proj').default} */ (proj).names;
  if (names !== lastNames) {
    lastNames = names;
    lastBuiltin = builtinNames.has(names);
  }
  return lastBuiltin;
}
export default {
  start: start,
  add: add,
  get: get
};
