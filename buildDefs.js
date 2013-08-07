var defaultLocals = require('./src/defs/defaultLocals');
var top = "define(function() {return function(defs) {defs(";
var end = ")}});";
var pTop = "define(function(require, exports) {";
var pBottom = "});"
var projes = {
  aea: "exports.aea = require('./projCode/aea');",

  lcc: "exports.lcc = require('./projCode/lcc');",
  utm: "exports.utm = require('./projCode/utm');",
  aeqd: "exports.aeqd = require('./projCode/aeqd');",
  eqdc: "exports.eqdc = require('./projCode/eqdc');",

  merc: "exports.merc = require('./projCode/merc');",
  poly: "exports.poly = require('./projCode/poly');",
  mill: "exports.mill = require('./projCode/mill');",
  cea: "exports.cea = require('./projCode/cea');",
  krovak: "exports.krovak = require('./projCode/krovak');",
  sterea: "exports.sterea = require('./projCode/sterea');",

  laea: "exports.laea = require('./projCode/laea');",
  cass: "exports.cass = require('./projCode/cass');",
  eqc: "exports.eqc = require('./projCode/eqc');",
  tmerc: "exports.tmerc = require('./projCode/tmerc');",
  longlat: "exports.longlat = require('./projCode/longlat');exports.identity=exports.longlat;",
  somerc: "exports.somerc = require('./projCode/somerc');",
  sinu: "exports.sinu = require('./projCode/sinu');",
  stere: "exports.stere = require('./projCode/stere');",
  gnom: "exports.gnom = require('./projCode/gnom');",
  omerc: "exports.omerc = require('./projCode/omerc');",
  nzmg: "exports.nzmg = require('./projCode/nzmg');",
  moll: "exports.moll = require('./projCode/moll');",
  vandg: "exports.vandg = require('./projCode/vandg');"
};

var fs = require('fs');

function buildDefs(defs) {
  if (!defs) {
    return writeDefs(defaultLocals);
  }
  else if (typeof defs === 'string') {
    return writeDefs(defaultLocals.filter(filterString(defs)));
  }
  else {
    return writeDefs(defaultLocals.filter(filterArray(defs)));
  }
}

function writeDefs(defs) {
  writeProjes(defs);
  fs.writeFileSync('./src/defs/local.js', top + JSON.stringify(defs) + end, 'utf8');
}

function writeProjes(defs) {
  var out = {};
  defs.forEach(function(d) {
    if (d.projName && (d.projName in projes)) {
      out[d.projName] = projes[d.projName];
    }
  });
  out.longlat = projes.longlat;
  out.identity = out.longlat;
  var outString = pTop;
  for (var key in out) {
    outString += out[key];
  }
  outString += pBottom;
  fs.writeFileSync('./src/projections.js', outString, 'utf8');
}

function filterString(string) {
  var key = string.split(':')[0];
  var value = string.split(':')[1];
  return function(obj) {
    return (key in obj) && obj[key] === value;
  };
}

function filterArray(array) {
  var funcArray = array.map(filterString);
  return function(obj) {
    return funcArray.some(function(f) {
      return f(obj);
    });
  };
}

exports.defs = buildDefs;
