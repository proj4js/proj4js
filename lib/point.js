goog.provide('Proj4js.Point');

/** point object, nothing fancy, just allows values to be
    passed back and forth by reference rather than by value.
    Other point classes may be used as long as they have
    x and y properties, which will get modified in the transform method.
*/

/**
 * @constructor  Proj4js.Point
 * @param {Object|string|number} x either the first coordinates component or
 *     the full coordinates as an array
 * @param {number|undefined=} y  the second component
 * @param {number|undefined=} z  the third component, optional.
 */
Proj4js.Point = function(x,y,z) {
	
      if (typeof x == 'object') {
        this.x = x[0];
        this.y = x[1];
        this.z = x[2] || 0.0;
      } else if (typeof x == 'string' && typeof y == 'undefined') {
        var coords = x.split(',');
        this.x = parseFloat(coords[0]);
        this.y = parseFloat(coords[1]);
        this.z = parseFloat(coords[2]) || 0.0;
      } else {
        this.x = x;
        this.y = y;
        this.z = z || 0.0;
      }
};

/**
 * Method: clone
 * Build a copy of a Proj4js.Point object.
 *
 * @return {Proj4js.Point} the cloned point.
 */
Proj4js.Point.prototype.clone = function() {
      return new Proj4js.Point(this.x, this.y, this.z);
};

/**
 * Method: toString
 * Return a readable string version of the point
 *
 * @return {string} String representation of the point object. 
 *           (ex. <i>"x=5,y=42"</i>)
 */
Proj4js.Point.prototype.toString = function() {
        return ("x=" + this.x + ",y=" + this.y);
};

/** 
 * Method: toShortString
 * Return a short string version of the point.
 *
 * @return {string} Shortened String representation of the point object. 
 *         (ex. <i>"5, 42"</i>)
 */
Proj4js.Point.prototype.toShortString = function() {
        return (this.x + ", " + this.y);
};

