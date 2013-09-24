define(function(require, exports) {
  var common = require('proj4/common');
  var tmerc = require('proj4/projCode/tmerc');
  exports.dependsOn = 'tmerc';
  exports.init = function() {
    if (!this.zone) {
      //proj4.reportError("utm:init: zone must be specified for UTM");
      return;
    }
    this.lat0 = 0;
    this.long0 = ((6 * Math.abs(this.zone)) - 183) * common.D2R;
    this.x0 = 500000;
    this.y0 = this.utmSouth ? 10000000 : 0;
    this.k0 = 0.9996;

    tmerc.init.apply(this);
    this.forward = tmerc.forward;
    this.inverse = tmerc.inverse;
  };
  exports.names = ["Universal Transverse Mercator System", "utm"];
});
