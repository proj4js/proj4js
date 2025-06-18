export default proj4;
export type Mgrs = {
    forward: (lonlat: [number, number]) => string;
    inverse: (mgrsString: string) => [number, number, number, number];
    toPoint: (mgrsString: string) => [number, number];
};
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
declare const proj4: typeof core & {
    defaultDatum: string;
    Proj: typeof Proj;
    WGS84: Proj;
    Point: typeof Point;
    toPoint: typeof common;
    defs: typeof defs;
    nadgrid: typeof nadgrid;
    transform: typeof transform;
    mgrs: Mgrs;
    version: string;
};
import core from './core';
import Proj from './Proj';
import Point from './Point';
import common from './common/toPoint';
import defs from './defs';
import nadgrid from './nadgrid';
import transform from './transform';
