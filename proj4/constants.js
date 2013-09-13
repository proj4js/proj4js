define(function(require,exports) {
  exports.PrimeMeridian = require('proj4/constants/PrimeMeridian');

  exports.Ellipsoid = require('proj4/constants/Ellipsoid');

  exports.Datum = require('proj4/constants/Datum');

  //proj4.WGS84 = Proj('WGS84');
  exports.Datum.OSB36 = exports.Datum.OSGB36; //as returned from spatialreference.org

  exports.grids = require('proj4/constants/grids');
});
