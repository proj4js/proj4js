import proj4 from './core';
import Proj from "./Proj";
import Point from "./Point";
import common from "./common/toPoint";
import defs from "./defs";
import nadgrid from "./nadgrid";
import transform from "./transform";
import mgrs from "mgrs";
import includedProjections from "../projs";

proj4.defaultDatum = 'WGS84'; //default datum
proj4.Proj = Proj;
proj4.WGS84 = new proj4.Proj('WGS84');
proj4.Point = Point;
proj4.toPoint = common;
proj4.defs = defs;
proj4.nadgrid = nadgrid;
proj4.transform = transform;
proj4.mgrs = mgrs;
proj4.version = '__VERSION__';
includedProjections(proj4);

/*
 * Fix importing in typescript after rollup compilation
 * https://github.com/rollup/rollup/issues/1156
 * https://github.com/Microsoft/TypeScript/issues/13017#issuecomment-268657860
 */
proj4.default = proj4;

export default proj4;
