goog.provide('Proj4js.projCode');

/**
 * @interface {Proj4js.projCode}
 */
 Proj4js.projCode = function() { };
 
/**
 * @param {Proj4js.Point|{x: number,y: number,z: number}} p - the coordinate to be transformed
 * @return {Proj4js.Point|{x: number,y: number,z: number}|null} the resulting coordinate
 */
 Proj4js.projCode.prototype.forward = function(p) {};
/**
 * @param {Proj4js.Point|{x: number,y: number,z: number}} p - the coordinate to be transformed
 * @return {Proj4js.Point|{x: number,y: number,z: number}|null} the resulting coordinate
 */
 Proj4js.projCode.prototype.inverse = function(p) {};

