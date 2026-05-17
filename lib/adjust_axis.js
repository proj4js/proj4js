var order = ['x', 'y', 'z'];

/**
 * Convert a point in a given CRS axis order to ENU (east/north/up) order
 * @param {import('./defs').ProjectionDefinition} crs
 * @param {import('./core').InterfaceCoordinates} point
 * @returns {import('./core').InterfaceCoordinates | null}
 */
export function adjustAxisToEnu(crs, point) {
  /** @type {import("./core").InterfaceCoordinates} */
  const out = {};
  for (let i = 0, ii = crs.axis.length; i < ii; i++) {
    if (i === 2 && point.z === undefined) {
      continue;
    }
    let v = point[order[i]];
    switch (crs.axis[i]) {
      case 'e':
        out.x = v;
        break;
      case 'w':
        out.x = -v;
        break;
      case 'n':
        out.y = v;
        break;
      case 's':
        out.y = -v;
        break;
      case 'u':
        out.z = v;
        break;
      case 'd':
        out.z = -v;
        break;
      default:
        // console.log("ERROR: unknown axis ("+crs.axis[i]+") - check definition of "+crs.projName);
        return null;
    }
  }
  return out;
}

/**
 * Convert a point in ENU (east/north/up) order to the given CRS axis order.
 * @param {import('./defs').ProjectionDefinition} crs
 * @param {import('./core').InterfaceCoordinates} point
 * @returns {import('./core').InterfaceCoordinates | null}
 */
export function adjustAxisFromEnu(crs, point) {
  const out = /** @type {import("./core").InterfaceCoordinates} */ ({});
  for (let i = 0, ii = crs.axis.length; i < ii; i++) {
    if (i === 2 && point.z === undefined) {
      continue;
    }
    switch (crs.axis[i]) {
      case 'e':
        out[order[i]] = point.x;
        break;
      case 'w':
        out[order[i]] = -point.x;
        break;
      case 'n':
        out[order[i]] = point.y;
        break;
      case 's':
        out[order[i]] = -point.y;
        break;
      case 'u':
        out[order[i]] = point.z;
        break;
      case 'd':
        out[order[i]] = -point.z;
        break;
      default:
        // console.log("ERROR: unknown axis ("+crs.axis[i]+") - check definition of "+crs.projName);
        return null;
    }
  }
  return out;
}
