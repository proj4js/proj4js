import core from './core';
import Proj from './Proj';
import Point from './Point';
import common from './common/toPoint';
import defs from './defs';
import nadgrid from './nadgrid';
import transform from './transform';
import mgrs from 'mgrs';
import includedProjections from '../projs';

/**
 * @typedef {Object} Mgrs
 * @property {(lonlat: [number, number]) => string} forward
 * @property {(mgrsString: string) => [number, number, number, number]} inverse
 * @property {(mgrsString: string) => [number, number]} toPoint
 */

/**
 * @template {import('./core').TemplateCoordinates} T
 * @type {core<T> & {defaultDatum: string, Proj: typeof Proj, WGS84: Proj, Point: typeof Point, toPoint: typeof common, defs: typeof defs, nadgrid: typeof nadgrid, transform: typeof transform, mgrs: Mgrs, version: string}}
 */
const proj4 = Object.assign(core, {
  defaultDatum: 'WGS84',
  Proj,
  WGS84: new Proj('WGS84'),
  Point,
  toPoint: common,
  defs,
  nadgrid,
  transform,
  mgrs,
  version: '__VERSION__'
});
includedProjections(proj4);
export default proj4;
