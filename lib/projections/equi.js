

export function init() {
  this.x0 = this.x0 || 0;
  this.y0 = this.y0 || 0;
  this.lat0 = this.lat0 || 0;
  this.long0 = this.long0 || 0;
  ///this.t2;
}

/* Equirectangular forward equations--mapping lat,long to x,y
  ---------------------------------------------------------*/
export function forward(p) {

  var lon = p.x;
  var lat = p.y;

  var dlon = this.adjust_lon(lon - this.long0);
  var x = this.x0 + this.a * dlon * Math.cos(this.lat0);
  var y = this.y0 + this.a * lat;

  this.t1 = x;
  this.t2 = Math.cos(this.lat0);
  p.x = x;
  p.y = y;
  return p;
}

/* Equirectangular inverse equations--mapping x,y to lat/long
  ---------------------------------------------------------*/
export function inverse(p) {

  p.x -= this.x0;
  p.y -= this.y0;
  var lat = p.y / this.a;

  var lon = this.adjust_lon(this.long0 + p.x / (this.a * Math.cos(this.lat0)));
  p.x = lon;
  p.y = lat;
}

export var names = ["equi"];
export default {
  init: init,
  forward: forward,
  inverse: inverse,
  names: names
};
