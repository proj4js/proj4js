import {
  PJD_3PARAM,
  PJD_7PARAM,
  PJD_GRIDSHIFT,
  PJD_NODATUM,
  R2D,
  SRS_WGS84_ESQUARED,
  SRS_WGS84_SEMIMAJOR, SRS_WGS84_SEMIMINOR
} from './constants/values';

import {geodeticToGeocentric, geocentricToGeodetic, geocentricToWgs84, geocentricFromWgs84, compareDatums} from './datumUtils';
import adjust_lon from "./common/adjust_lon";
function checkParams(type) {
  return (type === PJD_3PARAM || type === PJD_7PARAM);
}

export default function(source, dest, point) {
  // Short cut if the datums are identical.
  if (compareDatums(source, dest)) {
    return point; // in this case, zero is sucess,
    // whereas cs_compare_datums returns 1 to indicate TRUE
    // confusing, should fix this
  }

  // Explicitly skip datum transform by setting 'datum=none' as parameter for either source or dest
  if (source.datum_type === PJD_NODATUM || dest.datum_type === PJD_NODATUM) {
    return point;
  }

  // If this datum requires grid shifts, then apply it to geodetic coordinates.
  var source_a = source.a;
  var source_es = source.es;
  if (source.datum_type === PJD_GRIDSHIFT) {
    var gridShiftCode = applyGridShift(source, false, point);
    if (gridShiftCode === 0) {
      source_a = SRS_WGS84_SEMIMAJOR;
      source_es = SRS_WGS84_ESQUARED;
    } else {
      console.log('Grid shift failed with code', gridShiftCode); // Replce this with better messaging
    }
  }

  var dest_a = dest.a;
  var dest_b = dest.b;
  var dest_es = dest.es;
  if (dest.datum_type === PJD_GRIDSHIFT) {
    dest_a = SRS_WGS84_SEMIMAJOR;
    dest_b = SRS_WGS84_SEMIMINOR;
    dest_es = SRS_WGS84_ESQUARED;
  }

  // TODO: Dest grid shift
  // TODO: Multiple grids, failout, final attempt without grids
  // TODO: Error if trying to load multiple subgrids
  // TODO: @null
  // TODO: Remove logging
  // TODO: Tests not based on OS datasets? Or check license.
  // TODO: Make it work in the browser too (+ reenable tests)

  // Do we need to go through geocentric coordinates?
  if (source_es === dest_es && source_a === dest_a && !checkParams(source.datum_type) &&  !checkParams(dest.datum_type)) {
    return point;
  }

  // Convert to geocentric coordinates.
  point = geodeticToGeocentric(point, source_es, source_a);
  // Convert between datums
  if (checkParams(source.datum_type)) {
    point = geocentricToWgs84(point, source.datum_type, source.datum_params);
  }
  if (checkParams(dest.datum_type)) {
    point = geocentricFromWgs84(point, dest.datum_type, dest.datum_params);
  }
  point = geocentricToGeodetic(point, dest_es, dest_a, dest_b); // TODO: Dest b?

  if (dest.datum_type === PJD_GRIDSHIFT) {
    var destGridShiftResult = applyGridShift(dest, true, point);
    if (destGridShiftResult !== 0) {
      console.log('Grid shift failed for dest with code', destGridShiftResult);
    }
  }

  return point;
}

export function applyGridShift(source, inverse, point) {
  if (source.grids === null || source.grids.length === 0) {
    return -38;
  }
  var input = {x: -point.x, y: point.y};
  var output = {x: Number.NaN, y: Number.NaN};
  /* keep trying till we find a table that works */
  var onlyMandatoryGrids = false;
  for (var i = 0, l = source.grids.length; i < l; i++) {
    var gi = source.grids[i];
    onlyMandatoryGrids = gi.mandatory;
    var ct = gi.grid;
    if (ct === null) {
      if (gi.mandatory) {
        console.log("unable to find '"+gi.name+"' grid.");
        return -48;
      }
      continue;
    }
    /* skip tables that don't match our point at all.  */
    var epsilon = (Math.abs(ct.del[1]) + Math.abs(ct.del[0])) / 10000.0;
    if(ct.ll[1] - epsilon > input.y || ct.ll[0] - epsilon > input.x ||
      ct.ll[1] + (ct.lim[1] - 1) * ct.del[1] + epsilon < input.y ||
      ct.ll[0] + (ct.lim[0] - 1) * ct.del[0] + epsilon<input.x ) {
      console.log('skipping...');
      continue;
    }
    /* If we have child nodes, check to see if any of them apply. */
    /* TODO : only plain grid has implemented ... */
    /* we found a more refined child node to use */
    /* load the grid shift info if we don't have it. */
    /* TODO : Proj4js.grids pre-loaded (as they can be huge ...) */
    output = nadCvt(input, inverse, ct);
    if (!isNaN(output.x)) {
      break;
    }
  }
  if (isNaN(output.x)) {
    if (!onlyMandatoryGrids) {
      console.log("failed to find a grid shift table for location '"+
        input.x * R2D + " " + input.y * R2D +
        " tried: '" + source.nadgrids + "'");
      return -48;
    }
    return -1;//FIXME: no shift applied ...
  }
  point.x = -output.x;
  point.y = output.y;
  return 0;
}

function nadCvt(pin, inverse, ct) {
  var val = {x: Number.NaN, y: Number.NaN};
  if (isNaN(pin.x)) { return val; }
  var tb = {x: pin.x, y: pin.y};
  tb.x -= ct.ll[0];
  tb.y -= ct.ll[1];
  tb.x = adjust_lon(tb.x - Math.PI) + Math.PI;
  var t = nadIntr(tb, ct);
  if (inverse) {
    if (isNaN(t.x)) {
      return val;
    }
    t.x = tb.x - t.x;
    t.y = tb.y - t.y;
    var i = 9, tol = 1e-12;
    var dif, del;
    do {
      del = nadIntr(t, ct);
      if (isNaN(del.x)) {
        console.log("Inverse grid shift iteration failed, presumably at grid edge.  Using first approximation.");
        break;
      }
      dif = {x: tb.x - (del.x + t.x), y: tb.y - (del.y + t.y)};
      t.x += dif.x;
      t.y += dif.y;
    } while (i-- && Math.abs(dif.x) > tol && Math.abs(dif.y) > tol);
    if (i < 0) {
      console.log("Inverse grid shift iterator failed to converge.");
      return val;
    }
    val.x = adjust_lon(t.x + ct.ll[0]);
    val.y = t.y + ct.ll[1];
  } else {
    if (!isNaN(t.x)) {
      val.x = pin.x + t.x; // NOTE: This was originally a subtraction
      val.y = pin.y + t.y;
    }
  }
  return val;
}

function nadIntr(pin, ct) {
  // force computation by decreasing by 1e-7 to be as closed as possible
  // from computation under C:C++ by leveraging rounding problems ...
  var t = {x: (pin.x - 1.e-7) / ct.del[0], y: (pin.y - 1e-7) / ct.del[1]};
  var indx = {x: Math.floor(t.x), y: Math.floor(t.y)};
  var frct = {x: t.x - 1.0 * indx.x, y: t.y - 1.0 * indx.y};
  var val= {x: Number.NaN, y: Number.NaN};
  var inx;
  if (indx.x < 0) {
    if (!(indx.x === -1 && frct.x > 0.99999999999)) {
      return val;
    }
    ++indx.x;
    frct.x = 0.0;
  } else {
    inx = indx.x + 1;
    if (inx >= ct.lim[0]) {
      if (!(inx === ct.lim[0] && frct.x<1e-11)) {
        return val;
      }
      --indx.x;
      frct.x= 1.0;
    }
  }
  if (indx.y < 0) {
    if (!(indx.y === -1 && frct.y > 0.99999999999)) {
      return val;
    }
    ++indx.y;
    frct.y = 0.0;
  } else {
    inx = indx.y + 1;
    if (inx >= ct.lim[1]) {
      if (!(inx === ct.lim[1] && frct.y < 1e-11)) {
        return val;
      }
      --indx.y;
      frct.y = 1.0;
    }
  }
  inx = (indx.y * ct.lim[0]) + indx.x;
  var f00 = {x: ct.cvs[inx][0], y: ct.cvs[inx][1]};
  inx++;
  var f10= {x: ct.cvs[inx][0], y: ct.cvs[inx][1]};
  inx += ct.lim[0];
  var f11 = {x: ct.cvs[inx][0], y: ct.cvs[inx][1]};
  inx--;
  var f01 = {x: ct.cvs[inx][0], y: ct.cvs[inx][1]};
  var m11 = frct.x * frct.y, m10 = frct.x * (1.0 - frct.y),
    m00 = (1.0 - frct.x) * (1.0 - frct.y), m01 = (1.0 - frct.x) * frct.y;
  val.x = (m00 * f00.x + m10 * f10.x + m01 * f01.x + m11 * f11.x);
  val.y = (m00 * f00.y + m10 * f10.y + m01 * f01.y + m11 * f11.y);
  return val;
}
