define(function(require, exports, module) {
  var Class = require('./class');
  var mgrs = require('./mgrs');
  var Point = Class({

    /**
     * Constructor: proj4.Point
     *
     * Parameters:
     * - x {float} or {Array} either the first coordinates component or
     *     the full coordinates
     * - y {float} the second component
     * - z {float} the third component, optional.
     */
    initialize: function(x, y, z) {
      if (typeof x === 'object') {
        this.x = x[0];
        this.y = x[1];
        this.z = x[2] || 0.0;
      }
      else if (typeof x === 'string' && typeof y === 'undefined') {
        var coords = x.split(',');
        this.x = parseFloat(coords[0]);
        this.y = parseFloat(coords[1]);
        this.z = parseFloat(coords[2]) || 0.0;
      }
      else {
        this.x = x;
        this.y = y;
        this.z = z || 0.0;
      }
    },
    /**
     * APIMethod: clone
     * Build a copy of a proj4.Point object.
     *
     * Return:
     * {proj4}.Point the cloned point.
     */
    clone: function() {
      return new Point(this.x, this.y, this.z);
    },
    /**
     * APIMethod: toString
     * Return a readable string version of the point
     *
     * Return:
     * {String} String representation of proj4.Point object. 
     *           (ex. <i>"x=5,y=42"</i>)
     */
    toString: function() {
      return ("x=" + this.x + ",y=" + this.y);
    },
    /** 
     * APIMethod: toShortString
     * Return a short string version of the point.
     *
     * Return:
     * {String} Shortened String representation of proj4.Point object. 
     *         (ex. <i>"5, 42"</i>)
     */
    toShortString: function() {
      return (this.x + ", " + this.y);
    }
  });
  Point.fromMGRS = function(mgrsStr) {
    var llbbox = mgrs.inverse(mgrsStr);
    return new Point((llbbox[2] + llbbox[0]) / 2, (llbbox[3] + llbbox[1]) / 2);
  };

  /**
   * Converts a proj4.Point instance to a MGRS reference. The point
   * coordinates are expected to be in WGS84 longitude and latitude.
   *
   * Only available if proj4 is loaded.
   *
   * @param accuracy {int} The accuracy for the MGRS reference in digits (5
   *     for 1 m, 4 for 10 m, 3 for 100 m, 4 for 1000 m or 5 for 10000 m) 
   */
  Point.prototype.toMGRS = function(accuracy) {
    return mgrs.forward({
      lon: this.x,
      lat: this.y
    }, accuracy);
  };
  module.exports = Point;
});
