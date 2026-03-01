/**
 * Calculates the inverse geodesic problem using Vincenty's formulae.
 * Computes the forward azimuth and ellipsoidal distance between two points
 * specified by latitude and longitude on the surface of an ellipsoid.
 *
 * @param {number} lat1 Latitude of the first point in radians.
 * @param {number} lon1 Longitude of the first point in radians.
 * @param {number} lat2 Latitude of the second point in radians.
 * @param {number} lon2 Longitude of the second point in radians.
 * @param {number} a Semi-major axis of the ellipsoid (meters).
 * @param {number} f Flattening of the ellipsoid.
 * @returns {{ azi1: number, s12: number }} An object containing:
 *   - azi1: Forward azimuth from the first point to the second point (radians).
 *   - s12: Ellipsoidal distance between the two points (meters).
 */
export function vincentyInverse(lat1: number, lon1: number, lat2: number, lon2: number, a: number, f: number): {
    azi1: number;
    s12: number;
};
/**
 * Solves the direct geodetic problem using Vincenty's formulae.
 * Given a starting point, initial azimuth, and distance, computes the destination point on the ellipsoid.
 *
 * @param {number} lat1 Latitude of the starting point in radians.
 * @param {number} lon1 Longitude of the starting point in radians.
 * @param {number} azi1 Initial azimuth (forward azimuth) in radians.
 * @param {number} s12 Distance to travel from the starting point in meters.
 * @param {number} a Semi-major axis of the ellipsoid in meters.
 * @param {number} f Flattening of the ellipsoid.
 * @returns {{lat2: number, lon2: number}} The latitude and longitude (in radians) of the destination point.
 */
export function vincentyDirect(lat1: number, lon1: number, azi1: number, s12: number, a: number, f: number): {
    lat2: number;
    lon2: number;
};
