import { describe, it, assert } from 'vitest';
import proj4 from '../lib/index.js';

proj4.defs('vandgSphere', '+proj=vandg +R=6371000 +lon_0=0 +x_0=0 +y_0=0 +units=m +no_defs');

describe('vandg', function () {
  it('should project a point on the central meridian', function () {
    var xy = proj4('WGS84', 'vandgSphere').forward([0, 45]);
    assert.closeTo(xy[0], 0, 0.001, 'x is close');
    assert.closeTo(xy[1], 5363026.34343254, 0.001, 'y is close');
  });
  it('should project a point on the equator', function () {
    var xy = proj4('WGS84', 'vandgSphere').forward([45, 0]);
    assert.closeTo(xy[0], 5003771.699005143, 0.001, 'x is close');
    assert.closeTo(xy[1], 0, 0.001, 'y is close');
  });
});
