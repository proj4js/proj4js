export default proj4;
export type Mgrs = {
    forward: (lonlat: [number, number]) => string;
    inverse: (mgrsString: string) => [number, number, number, number];
    toPoint: (mgrsString: string) => [number, number];
};
export type ProjectionDefinition = import("./defs").ProjectionDefinition;
export type TemplateCoordinates = import("./core").TemplateCoordinates;
export type InterfaceCoordinates = import("./core").InterfaceCoordinates;
export type Converter = import("./core").Converter;
export type DatumDefinition = import("./Proj").DatumDefinition;
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
