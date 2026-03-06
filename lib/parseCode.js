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
  if (item.title) {
    return item.title.toLowerCase().indexOf('epsg:') === 0 && codes.indexOf(item.title.substr(5)) > -1;
  }
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
  let out;
  if (testObj(code)) {
    // check to see if this is a WKT string
    if (testDef(code)) {
      out = defs[code];
    } else if (testWKT(code)) {
      out = wkt(code);
      var maybeProjStr = checkProjStr(out);
      if (maybeProjStr) {
        out = projStr(maybeProjStr);
      }
    } else if (testProj(code)) {
      out = projStr(code);
    }
  } else if (!('projName' in code)) {
    out = wkt(code);
  } else {
    out = code;
  }
  // test for special Web Mercator case, due to this being a very common and often malformed
  return out && checkMercator(out) ? defs['EPSG:3857'] : out;
}

export default parse;
