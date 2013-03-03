goog.provide('Proj4js.Proj.transform');

/**
 * @interface Proj4js.Proj.transform
 * @param {Proj4js.Proj} proj
 */

Proj4js.Proj.transform = function(proj) {};

/**
 * APIMethod: forward
 * geodetic to projected transform
 *
 * @param {!Proj4js.Point|{x: !number,y: !number,z: ?number}} pt the lat long input value
 * @return {Proj4js.Point|{x: !number,y: !number,z: ?number}} the point x,y transformed.
 */
Proj4js.Proj.transform.prototype.forward = function(pt) {};

/**
 * APIMethod: inverse
 * projected to geodetic transform
 *
 * @param {!Proj4js.Point|{x: !number,y: !number,z: ?number}} pt the x,y input value
 * @return {Proj4js.Point|{x: !number,y: !number,z: ?number}} the lat long point transformed.
 */
Proj4js.Proj.transform.prototype.inverse = function(pt) {};
