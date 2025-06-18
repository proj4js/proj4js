import globals from './global';
import parseProj from './projString';
import wkt from 'wkt-parser';

/**
 * @typedef {Object} ProjectionDefinition
 * @property {string} title
 * @property {string} [projName]
 * @property {string} [ellps]
 * @property {import('./Proj.js').DatumDefinition} [datum]
 * @property {string} [datumName]
 * @property {number} [rf]
 * @property {number} [lat0]
 * @property {number} [lat1]
 * @property {number} [lat2]
 * @property {number} [lat_ts]
 * @property {number} [long0]
 * @property {number} [long1]
 * @property {number} [long2]
 * @property {number} [alpha]
 * @property {number} [longc]
 * @property {number} [x0]
 * @property {number} [y0]
 * @property {number} [k0]
 * @property {number} [a]
 * @property {number} [b]
 * @property {true} [R_A]
 * @property {number} [zone]
 * @property {true} [utmSouth]
 * @property {string|Array<number>} [datum_params]
 * @property {number} [to_meter]
 * @property {string} [units]
 * @property {number} [from_greenwich]
 * @property {string} [datumCode]
 * @property {string} [nadgrids]
 * @property {string} [axis]
 * @property {boolean} [sphere]
 * @property {number} [rectified_grid_angle]
 * @property {boolean} [approx]
 * @property {<T extends import('./core').TemplateCoordinates>(coordinates: T, enforceAxis?: boolean) => T} inverse
 * @property {<T extends import('./core').TemplateCoordinates>(coordinates: T, enforceAxis?: boolean) => T} forward
 */

/**
 * @overload
 * @param {string} name
 * @param {string|ProjectionDefinition|import('./core.js').PROJJSONDefinition} projection
 * @returns {void}
 */
/**
 * @overload
 * @param {Array<[string, string]>} name
 * @returns {Array<ProjectionDefinition|undefined>}
 */
/**
 * @overload
 * @param {string} name
 * @returns {ProjectionDefinition}
 */

/**
 * @param {string | Array<Array<string>> | Partial<Record<'EPSG'|'ESRI'|'IAU2000', ProjectionDefinition>>} name
 * @returns {ProjectionDefinition | Array<ProjectionDefinition|undefined> | void}
 */
function defs(name) {
  /* global console */
  var that = this;
  if (arguments.length === 2) {
    var def = arguments[1];
    if (typeof def === 'string') {
      if (def.charAt(0) === '+') {
        defs[/** @type {string} */ (name)] = parseProj(arguments[1]);
      } else {
        defs[/** @type {string} */ (name)] = wkt(arguments[1]);
      }
    } else {
      defs[/** @type {string} */ (name)] = def;
    }
  } else if (arguments.length === 1) {
    if (Array.isArray(name)) {
      return name.map(function (v) {
        if (Array.isArray(v)) {
          return defs.apply(that, v);
        } else {
          return defs(v);
        }
      });
    } else if (typeof name === 'string') {
      if (name in defs) {
        return defs[name];
      }
    } else if ('EPSG' in name) {
      defs['EPSG:' + name.EPSG] = name;
    } else if ('ESRI' in name) {
      defs['ESRI:' + name.ESRI] = name;
    } else if ('IAU2000' in name) {
      defs['IAU2000:' + name.IAU2000] = name;
    } else {
      console.log(name);
    }
    return;
  }
}
globals(defs);
export default defs;
