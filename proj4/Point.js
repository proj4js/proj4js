define(['./mgrs'],function(mgrs) {
  function Point(x, y, z) {
    if (!(this instanceof Point)) {
      return new Point(x, y, z);
    }
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
    this.clone = function() {
      return new Point(this.x, this.y, this.z);
    };
    this.toString = function() {
      return ("x=" + this.x + ",y=" + this.y);
    };
    /** 
     * APIMethod: toShortString
     * Return a short string version of the point.
     *
     * Return:
     * {String} Shortened String representation of proj4.Point object. 
     *         (ex. <i>"5, 42"</i>)
     */
    this.toShortString = function() {
      return (this.x + ", " + this.y);
    };
  }

  Point.fromMGRS = function(mgrsStr) {
    var llbbox = mgrs.inverse(mgrsStr);
    return new Point((llbbox[2] + llbbox[0]) / 2, (llbbox[3] + llbbox[1]) / 2);
  };
  Point.prototype.toMGRS = function(accuracy) {
      return mgrs.forward({
        lon: this.x,
        lat: this.y
      }, accuracy);
    };
  return Point;
});
