define(function(require,exports) {
  exports.PrimeMeridian = require('./constants/PrimeMeridian');

  exports.Ellipsoid = require('./constants/Ellipsoid');

  exports.Datum = require('./constants/Datum');

  //..WGS84 = Proj('WGS84');
  exports.Datum.OSB36 = exports.Datum.OSGB36; //as returned from spatialreference.org

  exports.grids = require('./constants/grids');
});
