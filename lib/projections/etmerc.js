// Heavily based on this etmerc projection implementation
// https://github.com/mbloch/mapshaper-proj/blob/master/src/projections/etmerc.js

var sinh = require('../common/sinh');
var hypot = require('../common/hypot');
var asinhy = require('../common/asinhy');
var gatg = require('../common/gatg');
var clens = require('../common/clens');
var clens_cmplx = require('../common/clens_cmplx');
var adjust_lon = require('../common/adjust_lon');

var cgb = [];
var cbg = [];
var utg = [];
var gtu = [];
var Qn;
var Zb;

exports.init = function() {
  if (this.es <= 0) {
    return;
  }

  this.x0 = this.x0 !== undefined ? this.x0 : 0;
  this.y0 = this.y0 !== undefined ? this.y0 : 0;
  this.long0 = this.long0 !== undefined ? this.long0 : 0;
  this.lat0 = this.lat0 !== undefined ? this.lat0 : 0;

  var f = this.es / (1 + Math.sqrt(1 - this.es));
  var n = f / (2 - f);
  var np = n;

  cgb[0] = n * (2 + n * (-2 / 3 + n * (-2 + n * (116 / 45 + n * (26 / 45 + n * (-2854 / 675 ))))));
  cbg[0] = n * (-2 + n * ( 2 / 3 + n * ( 4 / 3 + n * (-82 / 45 + n * (32 / 45 + n * (4642 / 4725))))));

  np = np * n;
  cgb[1] = np * (7 / 3 + n * (-8 / 5 + n * (-227 / 45 + n * (2704 / 315 + n * (2323 / 945)))));
  cbg[1] = np * (5 / 3 + n * (-16 / 15 + n * ( -13 / 9 + n * (904 / 315 + n * (-1522 / 945)))));

  np = np * n;
  cgb[2] = np * (56 / 15 + n * (-136 / 35 + n * (-1262 / 105 + n * (73814 / 2835))));
  cbg[2] = np * (-26 / 15 + n * (34 / 21 + n * (8 / 5 + n * (-12686 / 2835))));

  np = np * n;
  cgb[3] = np * (4279 / 630 + n * (-332 / 35 + n * (-399572 / 14175)));
  cbg[3] = np * (1237 / 630 + n * (-12 / 5 + n * ( -24832 / 14175)));

  np = np * n;
  cgb[4] = np * (4174 / 315 + n * (-144838 / 6237));
  cbg[4] = np * (-734 / 315 + n * (109598 / 31185));

  np = np * n;
  cgb[5] = np * (601676 / 22275);
  cbg[5] = np * (444337 / 155925);

  np = Math.pow(n, 2);
  Qn = this.k0 / (1 + n) * (1 + np * (1 / 4 + np * (1 / 64 + np / 256)));

  utg[0] = n * (-0.5 + n * ( 2 / 3 + n * (-37 / 96 + n * ( 1 / 360 + n * (81 / 512 + n * (-96199 / 604800))))));
  gtu[0] = n * (0.5 + n * (-2 / 3 + n * (5 / 16 + n * (41 / 180 + n * (-127 / 288 + n * (7891 / 37800))))));
  utg[1] = np * (-1 / 48 + n * (-1 / 15 + n * (437 / 1440 + n * (-46 / 105 + n * (1118711 / 3870720)))));
  gtu[1] = np * (13 / 48 + n * (-3 / 5 + n * (557 / 1440 + n * (281 / 630 + n * (-1983433 / 1935360)))));

  np = np * n;
  utg[2] = np * (-17 / 480 + n * (37 / 840 + n * (209 / 4480 + n * (-5569 / 90720 ))));
  gtu[2] = np * (61 / 240 + n * (-103 / 140 + n * (15061 / 26880 + n * (167603 / 181440))));

  np = np * n;
  utg[3] = np * (-4397 / 161280 + n * (11 / 504 + n * (830251 / 7257600)));
  gtu[3] = np * (49561 / 161280 + n * (-179 / 168 + n * (6601661 / 7257600)));

  np = np * n;
  utg[4] = np * (-4583 / 161280 + n * (108847 / 3991680));
  gtu[4] = np * (34729 / 80640 + n * (-3418889 / 1995840));

  np = np * n;
  utg[5] = np * (-20648693 / 638668800);
  gtu[5] = np * (212378941 / 319334400);

  var Z = gatg(cbg, this.lat0);
  Zb = -Qn * (Z + clens(gtu, 2 * Z));
};

exports.forward = function(p) {
  var Ce = adjust_lon(p.x - this.long0);
  var Cn = p.y;

  Cn = gatg(cbg, Cn);

  var sin_Cn = Math.sin(Cn);
  var cos_Cn = Math.cos(Cn);
  var sin_Ce = Math.sin(Ce);
  var cos_Ce = Math.cos(Ce);

  Cn = Math.atan2(sin_Cn, cos_Ce * cos_Cn);
  Ce = Math.atan2(sin_Ce * cos_Cn, hypot(sin_Cn, cos_Cn * cos_Ce));
  Ce = asinhy(Math.tan(Ce));

  var tmp = clens_cmplx(gtu, 2 * Cn, 2 * Ce);

  Cn = Cn + tmp[0];
  Ce = Ce + tmp[1];

  var x;
  var y;

  if (Math.abs(Ce) <= 2.623395162778) {
    x = this.a * (Qn * Ce) + this.x0;
    y = this.a * (Qn * Cn + Zb) + this.y0;
  }
  else {
    x = Infinity;
    y = Infinity;
  }

  p.x = x;
  p.y = y;

  return p;
};

exports.inverse = function(p) {
  var Ce = (p.x - this.x0) * (1 / this.a);
  var Cn = (p.y - this.y0) * (1 / this.a);

  Cn = (Cn - Zb) / Qn;
  Ce = Ce / Qn;

  var lon;
  var lat;

  if (Math.abs(Ce) <= 2.623395162778) {
    var tmp = clens_cmplx(utg, 2 * Cn, 2 * Ce);

    Cn = Cn + tmp[0];
    Ce = Ce + tmp[1];
    Ce = Math.atan(sinh(Ce));

    var sin_Cn = Math.sin(Cn);
    var cos_Cn = Math.cos(Cn);
    var sin_Ce = Math.sin(Ce);
    var cos_Ce = Math.cos(Ce);

    Cn = Math.atan2(sin_Cn * cos_Ce, hypot(sin_Ce, cos_Ce * cos_Cn));
    Ce = Math.atan2(sin_Ce, cos_Ce * cos_Cn);

    lon = adjust_lon(Ce + this.long0);
    lat = gatg(cgb, Cn);
  }
  else {
    lon = Infinity;
    lat = Infinity;
  }

  p.x = lon;
  p.y = lat;

  return p;
};

exports.names = ["Extended_Transverse_Mercator", "Extended Transverse Mercator", "etmerc"];
