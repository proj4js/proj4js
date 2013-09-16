define(function(require) {
  var proj4 = require('proj4/core');
  proj4.defaultDatum = 'WGS84'; //default datum
  proj4.Proj = require('proj4/Proj');
  proj4.WGS84 = new proj4.Proj('WGS84');
  proj4.Point = require('proj4/Point');
  proj4.defs = require('proj4/defs');
  proj4.transform = require('proj4/transform');
  proj4.mgrs = require('proj4/mgrs');
  proj4.version = require('proj4/version');
  return proj4;
});
