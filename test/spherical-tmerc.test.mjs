import { describe, it, assert } from 'vitest';
import proj4 from '../lib/index.js';

describe('spherical tmerc inverse latitude', function () {
  // Forward reference coordinates from PROJ 9.8.1 (pyproj 3.8.0).
  // lat_0, lon_0, k, x_0, y_0, geographic coordinates, projected coordinates.
  var cases = [
    [10, 0, 1, 0, 0, [-9, 8], [-994955.1821726046, -211447.59202745903]],
    [-10, 0, 1, 0, 0, [9, -8], [994955.1821726046, 211447.59202745903]],
    [45, 30, 0.9996, 500000, 10000000, [23, 15], [-253165.2793307763, 6677437.003903323]],
    [-45, -30, 0.9996, -500000, -10000000, [-23, -15], [253165.2793307762, -6677437.003903323]],
    [10, 0, 1, 0, 0, [5, -20], [522953.74880031275, -3343665.801134173]],
    [-10, 0, 1, 0, 0, [-5, 20], [-522953.748800313, 3343665.801134173]],
    [0, -120, 0.8, -400000, -1000000, [-111, -8], [395964.1457380825, -1720401.3395345067]],
    [10, 0, 1, 0, 0, [0, 10], [0, 0]],
    [-10, 0, 1, 0, 0, [0, -10], [0, 0]],
    [10, 0, 1, 0, 0, [0, 0], [0, -1111949.2664455874]]
  ];

  ['', ' +approx'].forEach(function (approx) {
    cases.forEach(function (testCase) {
      it('preserves latitude ' + testCase[5][1] + ' with lat_0=' + testCase[0] + approx, function () {
        var definition = '+proj=tmerc +R=6371000 +units=m'
          + ' +lat_0=' + testCase[0] + ' +lon_0=' + testCase[1]
          + ' +k=' + testCase[2] + ' +x_0=' + testCase[3] + ' +y_0=' + testCase[4]
          + approx;
        var projection = proj4(definition);
        var ll = testCase[5];
        var xy = testCase[6];
        var forward = projection.forward(ll);
        assert.closeTo(forward[0], xy[0], 1e-7, 'reference easting');
        assert.closeTo(forward[1], xy[1], 1e-7, 'reference northing');
        var inverse = projection.inverse(xy);
        assert.closeTo(inverse[0], ll[0], 1e-7, 'reference longitude');
        assert.closeTo(inverse[1], ll[1], 1e-7, 'reference latitude');
        var roundtrip = projection.inverse(forward);
        assert.closeTo(roundtrip[0], ll[0], 1e-7, 'roundtrip longitude');
        assert.closeTo(roundtrip[1], ll[1], 1e-7, 'roundtrip latitude');
      });
    });
  });
});
