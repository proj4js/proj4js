var adjust_zone = require('../common/adjust_zone');
var tmerc = require('./tmerc');

exports.dependsOn = 'tmerc';

exports.init = function() {
  var zone = adjust_zone(this.zone, this.long0);
  if (zone === undefined) {
    throw new Error('unknown utm zone');
  }

  this.lat0 = 0;
  this.long0 = (zone + 0.5) * Math.PI / 30 - Math.PI;
  this.x0 = 500000;
  this.y0 = this.utmSouth ? 10000000 : 0;
  this.k0 = 0.9996;

  tmerc.init.apply(this);
  this.forward = tmerc.forward;
  this.inverse = tmerc.inverse;
};

exports.names = ["Universal Transverse Mercator System", "utm"];
