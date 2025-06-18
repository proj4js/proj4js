import proj from './Proj';
import transform from './transform';
var wgs84 = proj('WGS84');

/**
 * @typedef {{x: number, y: number, z?: number, m?: number}} InterfaceCoordinates
 */

/**
 * @typedef {Array<number> | InterfaceCoordinates} TemplateCoordinates
 */

/**
 * @typedef {Object} Converter
 * @property {<T extends TemplateCoordinates>(coordinates: T, enforceAxis?: boolean) => T} forward
 * @property {<T extends TemplateCoordinates>(coordinates: T, enforceAxis?: boolean) => T} inverse
 * @property {proj} [oProj]
 */

/**
 * @typedef {Object} PROJJSONDefinition
 * @property {string} [$schema]
 * @property {string} type
 * @property {string} [name]
 * @property {{authority: string, code: number}} [id]
 * @property {string} [scope]
 * @property {string} [area]
 * @property {{south_latitude: number, west_longitude: number, north_latitude: number, east_longitude: number}} [bbox]
 * @property {PROJJSONDefinition[]} [components]
 * @property {{type: string, name: string}} [datum]
 * @property {{
 *   name: string,
 *   members: Array<{
 *     name: string,
 *     id?: {authority: string, code: number}
 *   }>,
 *   ellipsoid?: {
 *     name: string,
 *     semi_major_axis: number,
 *     inverse_flattening?: number
 *   },
 *   accuracy?: string,
 *   id?: {authority: string, code: number}
 * }} [datum_ensemble]
 * @property {{
 *   subtype: string,
 *   axis: Array<{
 *     name: string,
 *     abbreviation?: string,
 *     direction: string,
 *     unit: string
 *   }>
 * }} [coordinate_system]
 * @property {{
 *   name: string,
 *   method: {name: string},
 *   parameters: Array<{
 *     name: string,
 *     value: number,
 *     unit?: string
 *   }>
 * }} [conversion]
 * @property {{
 *   name: string,
 *   method: {name: string},
 *   parameters: Array<{
 *     name: string,
 *     value: number,
 *     unit?: string,
 *     type?: string,
 *     file_name?: string
 *   }>
 * }} [transformation]
 */

/**
 * @template {TemplateCoordinates} T
 * @param {proj} from
 * @param {proj} to
 * @param {T} coords
 * @param {boolean} [enforceAxis]
 * @returns {T}
 */
function transformer(from, to, coords, enforceAxis) {
  var transformedArray, out, keys;
  if (Array.isArray(coords)) {
    transformedArray = transform(from, to, coords, enforceAxis) || { x: NaN, y: NaN };
    if (coords.length > 2) {
      if ((typeof from.name !== 'undefined' && from.name === 'geocent') || (typeof to.name !== 'undefined' && to.name === 'geocent')) {
        if (typeof transformedArray.z === 'number') {
          return /** @type {T} */ ([transformedArray.x, transformedArray.y, transformedArray.z].concat(coords.slice(3)));
        } else {
          return /** @type {T} */ ([transformedArray.x, transformedArray.y, coords[2]].concat(coords.slice(3)));
        }
      } else {
        return /** @type {T} */ ([transformedArray.x, transformedArray.y].concat(coords.slice(2)));
      }
    } else {
      return /** @type {T} */ ([transformedArray.x, transformedArray.y]);
    }
  } else {
    out = transform(from, to, coords, enforceAxis);
    keys = Object.keys(coords);
    if (keys.length === 2) {
      return /** @type {T} */ (out);
    }
    keys.forEach(function (key) {
      if ((typeof from.name !== 'undefined' && from.name === 'geocent') || (typeof to.name !== 'undefined' && to.name === 'geocent')) {
        if (key === 'x' || key === 'y' || key === 'z') {
          return;
        }
      } else {
        if (key === 'x' || key === 'y') {
          return;
        }
      }
      out[key] = coords[key];
    });
    return /** @type {T} */ (out);
  }
}

/**
 * @param {proj | string | PROJJSONDefinition | Converter} item
 * @returns {import('./Proj').default}
 */
function checkProj(item) {
  if (item instanceof proj) {
    return item;
  }
  if (typeof item === 'object' && 'oProj' in item) {
    return item.oProj;
  }
  return proj(/** @type {string | PROJJSONDefinition} */ (item));
}

/**
 * @overload
 * @param {string | PROJJSONDefinition | proj} toProj
 * @returns {Converter}
 */
/**
 * @overload
 * @param {string | PROJJSONDefinition | proj} fromProj
 * @param {string | PROJJSONDefinition | proj} toProj
 * @returns {Converter}
 */
/**
 * @template {TemplateCoordinates} T
 * @overload
 * @param {string | PROJJSONDefinition | proj} toProj
 * @param {T} coord
 * @returns {T}
 */
/**
 * @template {TemplateCoordinates} T
 * @overload
 * @param {string | PROJJSONDefinition | proj} fromProj
 * @param {string | PROJJSONDefinition | proj} toProj
 * @param {T} coord
 * @returns {T}
 */
/**
 * @template {TemplateCoordinates} T
 * @param {string | PROJJSONDefinition | proj} fromProjOrToProj
 * @param {string | PROJJSONDefinition | proj | TemplateCoordinates} [toProjOrCoord]
 * @param {T} [coord]
 * @returns {T|Converter}
 */
function proj4(fromProjOrToProj, toProjOrCoord, coord) {
  /** @type {proj} */
  var fromProj;
  /** @type {proj} */
  var toProj;
  var single = false;
  /** @type {Converter} */
  var obj;
  if (typeof toProjOrCoord === 'undefined') {
    toProj = checkProj(fromProjOrToProj);
    fromProj = wgs84;
    single = true;
  } else if (typeof /** @type {?} */ (toProjOrCoord).x !== 'undefined' || Array.isArray(toProjOrCoord)) {
    coord = /** @type {T} */ (/** @type {?} */ (toProjOrCoord));
    toProj = checkProj(fromProjOrToProj);
    fromProj = wgs84;
    single = true;
  }
  if (!fromProj) {
    fromProj = checkProj(fromProjOrToProj);
  }
  if (!toProj) {
    toProj = checkProj(/** @type {string | PROJJSONDefinition | proj } */ (toProjOrCoord));
  }
  if (coord) {
    return transformer(fromProj, toProj, coord);
  } else {
    obj = {
      /**
       * @template {TemplateCoordinates} T
       * @param {T} coords
       * @param {boolean=} enforceAxis
       * @returns {T}
       */
      forward: function (coords, enforceAxis) {
        return transformer(fromProj, toProj, coords, enforceAxis);
      },
      /**
       * @template {TemplateCoordinates} T
       * @param {T} coords
       * @param {boolean=} enforceAxis
       * @returns {T}
       */
      inverse: function (coords, enforceAxis) {
        return transformer(toProj, fromProj, coords, enforceAxis);
      }
    };
    if (single) {
      obj.oProj = toProj;
    }
    return obj;
  }
}

export default proj4;
