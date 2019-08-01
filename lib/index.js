import proj4 from './core';
import Proj from "./Proj";
import Point from "./Point";
import common from "./common/toPoint";
import defs from "./defs";
import transform from "./transform";
import mgrs from "mgrs";
import includedProjections from "../projs";

proj4.defaultDatum = 'WGS84'; //default datum
proj4.Proj = Proj;
proj4.WGS84 = new proj4.Proj('WGS84');
proj4.Point = Point;
proj4.toPoint = common;
proj4.defs = defs;
proj4.transform = transform;
proj4.mgrs = mgrs;
proj4.version = '__VERSION__';
includedProjections(proj4);
export default proj4;
