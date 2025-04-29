import tmerc from './projections/tmerc';
import utm from './projections/utm';
import sterea from './projections/sterea';
import stere from './projections/stere';
import somerc from './projections/somerc';
import omerc from './projections/omerc';
import lcc from './projections/lcc';
import krovak from './projections/krovak';
import cass from './projections/cass';
import laea from './projections/laea';
import aea from './projections/aea';
import gnom from './projections/gnom';
import cea from './projections/cea';
import eqc from './projections/eqc';
import poly from './projections/poly';
import nzmg from './projections/nzmg';
import mill from './projections/mill';
import sinu from './projections/sinu';
import moll from './projections/moll';
import eqdc from './projections/eqdc';
import vandg from './projections/vandg';
import aegd from './projections/aeqd';
import etmerc from './projections/etmerc';
import qsc from './projections/qsc';
import robin from './projections/robin';
import geocent from './projections/geocent';
import tpers from './projections/tpers';
import geos from './projections/geos';
import eqearth from './projections/eqearth';
import bonne from './projections/bonne';

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
  aegd,
  etmerc,
  qsc,
  robin,
  geocent,
  tpers,
  geos,
  eqearth,
  bonne
];

export default function (proj4) {
  projs.forEach(function (proj) {
    proj4.Proj.projections.add(proj);
  });
}
