import {
  geodeticToGeocentric,
  geocentricToGeodetic
} from '../datumUtils';

export function init() {
  this.name = 'geocent';

}

export function forward(p) {
  var point = geodeticToGeocentric(p, this.es, this.a);
  return point;
}

export function inverse(p) {
  var point = geocentricToGeodetic(p, this.es, this.a, this.b);
  return point;
}

export var names = ["Geocentric", 'geocentric', "geocent", "Geocent"];
export default {
  init: init,
  forward: forward,
  inverse: inverse,
  names: names
};