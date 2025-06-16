import defs from './defs';
import wkt from 'wkt-parser';
import projStr from './projString';
import match from './match';
function testObj(code) {
  return typeof code === 'string';
}
function testDef(code) {
  return code in defs;
}
function testWKT(code) {
  return (code.indexOf('+') !== 0 && code.indexOf('[') !== -1) || (typeof code === 'object' && !('srsCode' in code));
}
var codes = ['3857', '900913', '3785', '102113'];
function checkMercator(item) {
  var auth = match(item, 'authority');
  if (!auth) {
    return;
  }
  var code = match(auth, 'epsg');
  return code && codes.indexOf(code) > -1;
}
function checkProjStr(item) {
  var ext = match(item, 'extension');
  if (!ext) {
    return;
  }
  return match(ext, 'proj4');
}
function testProj(code) {
  return code[0] === '+';
}
/**
 * @param {string | import('./core').PROJJSONDefinition | import('./defs').ProjectionDefinition} code
 * @returns {import('./defs').ProjectionDefinition}
 */
function parse(code) {
  if (testObj(code)) {
    // check to see if this is a WKT string
    if (testDef(code)) {
      return defs[code];
    }
    if (testWKT(code)) {
      var out = wkt(code);
      // test of spetial case, due to this being a very common and often malformed
      if (checkMercator(out)) {
        return defs['EPSG:3857'];
      }
      var maybeProjStr = checkProjStr(out);
      if (maybeProjStr) {
        return projStr(maybeProjStr);
      }
      return out;
    }
    if (testProj(code)) {
      return projStr(code);
    }
  } else if (!('projName' in code)) {
    return wkt(code);
  } else {
    return code;
  }
}

export default parse;
