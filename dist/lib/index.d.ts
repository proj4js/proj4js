export default proj4;
/**
 * @template {import('./core').TemplateCoordinates} T
 * @type {core<T> & {defaultDatum: string, Proj: typeof Proj, WGS84: Proj, Point: typeof Point, toPoint: typeof common, defs: typeof defs, nadgrid: typeof nadgrid, transform: typeof transform, mgrs: typeof mgrs, version: string}}
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
    mgrs: typeof mgrs;
    version: string;
};
import core from './core';
import Proj from './Proj';
import Point from './Point';
import common from './common/toPoint';
import defs from './defs';
import nadgrid from './nadgrid';
import transform from './transform';
