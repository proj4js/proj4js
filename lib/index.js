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
 * @typedef {import('./defs').ProjectionDefinition} ProjectionDefinition
 * @typedef {import('./core').TemplateCoordinates} TemplateCoordinates
 * @typedef {import('./core').InterfaceCoordinates} InterfaceCoordinates
 * @typedef {import('./core').Converter} Converter
 * @typedef {import('./Proj').DatumDefinition} DatumDefinition
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

/*
 * Fix importing in typescript after rollup compilation
 * https://github.com/rollup/rollup/issues/1156
 * https://github.com/Microsoft/TypeScript/issues/13017#issuecomment-268657860
 */
proj4.default = proj4;

export default proj4;
