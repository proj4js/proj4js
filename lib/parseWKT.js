import wkt from 'wkt-parser';
import parser from 'wkt-parser/parser.js';
import { buildPROJJSON } from 'wkt-parser/buildPROJJSON.js';
import { detectWKTVersion } from 'wkt-parser/detectWKTVersion.js';

/**
 * @param {string | import('./core').PROJJSONDefinition | import('./defs').ProjectionDefinition} code
 * @returns {import('./defs').ProjectionDefinition}
 */
export default function parseWKT(code) {
  if (typeof code === 'string' && detectWKTVersion(code) === 'WKT2') {
    code = buildPROJJSON(parser(code));
  }
  var out = wkt(code);
  if (typeof code === 'object' && 'type' in code && code.type === 'BoundCRS' && out.datum_params) {
    var method = code.transformation && code.transformation.method;
    if (method && /^Coordinate Frame rotation(?: \((?:geocentric|geog[23]D) domain\))?$/i.test(method.name)) {
      // The datum transform uses the position-vector rotation convention.
      out.datum_params[3] = -out.datum_params[3];
      out.datum_params[4] = -out.datum_params[4];
      out.datum_params[5] = -out.datum_params[5];
    }
  }
  return out;
}
