var adjust_zone = require('../common/adjust_zone');
var etmerc = require('./etmerc');

exports.dependsOn = 'etmerc';

exports.init = function() {
  var zone = adjust_zone(this.zone, this.long0);
  if (zone === undefined) {
    return;
  }

  this.lat0 = 0;
  this.long0 = (zone + 0.5) * Math.PI / 30 - Math.PI;
  this.x0 = 500000;
  this.y0 = this.utmSouth ? 10000000 : 0;
  this.k0 = 0.9996;

  etmerc.init.apply(this);
  this.forward = etmerc.forward;
  this.inverse = etmerc.inverse;
};

exports.names = ["Universal Transverse Mercator System", "utm"];
