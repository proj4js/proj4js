import adjust_lon from '../common/adjust_lon';

/*
  reference
    "New Equal-Area Map Projections for Noncircular Regions", John P. Snyder,
    The American Cartographer, Vol 15, No. 4, October 1988, pp. 341-355.
  */

/* Initialize the Miller Cylindrical projection
  ------------------------------------------- */
export function init() {
  // no-op
}

/* Miller Cylindrical forward equations--mapping lat,long to x,y
    ------------------------------------------------------------ */
export function forward(p) {
  var lon = p.x;
  var lat = p.y;
  /* Forward equations
      ----------------- */
  var dlon = adjust_lon(lon - this.long0);
  var x = this.x0 + this.a * dlon;
  var y = this.y0 + this.a * Math.log(Math.tan((Math.PI / 4) + (lat / 2.5))) * 1.25;

  p.x = x;
  p.y = y;
  return p;
}

/* Miller Cylindrical inverse equations--mapping x,y to lat/long
    ------------------------------------------------------------ */
export function inverse(p) {
  p.x -= this.x0;
  p.y -= this.y0;

  var lon = adjust_lon(this.long0 + p.x / this.a);
  var lat = 2.5 * (Math.atan(Math.exp(0.8 * p.y / this.a)) - Math.PI / 4);

  p.x = lon;
  p.y = lat;
  return p;
}

export var names = ['Miller_Cylindrical', 'mill'];
export default {
  init: init,
  forward: forward,
  inverse: inverse,
  names: names
};
