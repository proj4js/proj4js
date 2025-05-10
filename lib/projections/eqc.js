import adjust_lon from '../common/adjust_lon';
import adjust_lat from '../common/adjust_lat';

export function init() {
  this.x0 = this.x0 || 0;
  this.y0 = this.y0 || 0;
  this.lat0 = this.lat0 || 0;
  this.long0 = this.long0 || 0;
  this.lat_ts = this.lat_ts || 0;
  this.title = this.title || 'Equidistant Cylindrical (Plate Carre)';

  this.rc = Math.cos(this.lat_ts);
}

// forward equations--mapping lat,long to x,y
// -----------------------------------------------------------------
export function forward(p) {
  var lon = p.x;
  var lat = p.y;

  var dlon = adjust_lon(lon - this.long0);
  var dlat = adjust_lat(lat - this.lat0);
  p.x = this.x0 + (this.a * dlon * this.rc);
  p.y = this.y0 + (this.a * dlat);
  return p;
}

// inverse equations--mapping x,y to lat/long
// -----------------------------------------------------------------
export function inverse(p) {
  var x = p.x;
  var y = p.y;

  p.x = adjust_lon(this.long0 + ((x - this.x0) / (this.a * this.rc)));
  p.y = adjust_lat(this.lat0 + ((y - this.y0) / (this.a)));
  return p;
}

export var names = ['Equirectangular', 'Equidistant_Cylindrical', 'Equidistant_Cylindrical_Spherical', 'eqc'];
export default {
  init: init,
  forward: forward,
  inverse: inverse,
  names: names
};
