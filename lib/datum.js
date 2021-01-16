import {PJD_3PARAM, PJD_7PARAM, PJD_GRIDSHIFT, PJD_WGS84, PJD_NODATUM, SEC_TO_RAD} from './constants/values';

function datum(datumCode, datum_params, a, b, es, ep2, nadgrids) {
  var out = {};

  if (datumCode === undefined || datumCode === 'none') {
    out.datum_type = PJD_NODATUM;
  } else {
    out.datum_type = PJD_WGS84;
  }

  if (datum_params) {
    out.datum_params = datum_params.map(parseFloat);
    if (out.datum_params[0] !== 0 || out.datum_params[1] !== 0 || out.datum_params[2] !== 0) {
      out.datum_type = PJD_3PARAM;
    }
    if (out.datum_params.length > 3) {
      if (out.datum_params[3] !== 0 || out.datum_params[4] !== 0 || out.datum_params[5] !== 0 || out.datum_params[6] !== 0) {
        out.datum_type = PJD_7PARAM;
        out.datum_params[3] *= SEC_TO_RAD;
        out.datum_params[4] *= SEC_TO_RAD;
        out.datum_params[5] *= SEC_TO_RAD;
        out.datum_params[6] = (out.datum_params[6] / 1000000.0) + 1.0;
      }
    }
  }

  if (nadgrids) {
    out.datum_type = PJD_GRIDSHIFT;
    out.grids = nadgrids;
  }
  out.a = a; //datum object also uses these values
  out.b = b;
  out.es = es;
  out.ep2 = ep2;
  return out;
}

export default datum;
