import * as tmerc from "./projections/tmerc";
import * as utm from "./projections/utm";
import * as sterea from "./projections/sterea";
import * as stere from "./projections/stere";
import * as somerc from "./projections/somerc";
import * as omerc from "./projections/omerc";
import * as lcc from "./projections/lcc";
import * as krovak from "./projections/krovak";
import * as cass from "./projections/cass";
import * as laea from "./projections/laea";
import * as aea from "./projections/aea";
import * as gnom from "./projections/gnom";
import * as cea from "./projections/cea";
import * as eqc from "./projections/eqc";
import * as poly from "./projections/poly";
import * as nzmg from "./projections/nzmg";
import * as mill from "./projections/mill";
import * as sinu from "./projections/sinu";
import * as moll from "./projections/moll";
import * as eqdc from "./projections/eqdc";
import * as vandg from "./projections/vandg";
import * as aegd from "./projections/aeqd";

var projs = [
  tmerc,
  utm,
  sterea,
  stere,
  somerc,
  omerc,
  lcc,
  krovak,
  cass,
  laea,
  aea,
  gnom,
  cea,
  eqc,
  poly,
  nzmg,
  mill,
  sinu,
  moll,
  eqdc,
  vandg,
  aegd
];

export default function(proj4){
  projs.forEach(function(proj){
    proj4.Proj.projections.add(proj);
  });
};