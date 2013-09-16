define(function(require, exports) {
  var common = require('proj4/common');
  exports.init = function() {
    this.e0 = common.e0fn(this.es);
    this.e1 = common.e1fn(this.es);
    this.e2 = common.e2fn(this.es);
    this.e3 = common.e3fn(this.es);
    this.ml0 = this.a * common.mlfn(this.e0, this.e1, this.e2, this.e3, this.lat0);
  };

  /**
    Transverse Mercator Forward  - long/lat to x/y
    long/lat in radians
  */
  exports.forward = function(p) {
    var lon = p.x;
    var lat = p.y;

    var delta_lon = common.adjust_lon(lon - this.long0); // Delta longitude
    var con; // cone constant
    var x, y;
    var sin_phi = Math.sin(lat);
    var cos_phi = Math.cos(lat);

    if (this.sphere) { /* spherical form */
      var b = cos_phi * Math.sin(delta_lon);
      if ((Math.abs(Math.abs(b) - 1)) < 0.0000000001) {
        //proj4.reportError("tmerc:forward: Point projects into infinity");
        return (93);
      }
      else {
        x = 0.5 * this.a * this.k0 * Math.log((1 + b) / (1 - b));
        con = Math.acos(cos_phi * Math.cos(delta_lon) / Math.sqrt(1 - b * b));
        if (lat < 0) {
          con = -con;
        }
        y = this.a * this.k0 * (con - this.lat0);
      }
    }
    else {
      var al = cos_phi * delta_lon;
      var als = Math.pow(al, 2);
      var c = this.ep2 * Math.pow(cos_phi, 2);
      var tq = Math.tan(lat);
      var t = Math.pow(tq, 2);
      con = 1 - this.es * Math.pow(sin_phi, 2);
      var n = this.a / Math.sqrt(con);
      var ml = this.a * common.mlfn(this.e0, this.e1, this.e2, this.e3, lat);

      x = this.k0 * n * al * (1 + als / 6 * (1 - t + c + als / 20 * (5 - 18 * t + Math.pow(t, 2) + 72 * c - 58 * this.ep2))) + this.x0;
      y = this.k0 * (ml - this.ml0 + n * tq * (als * (0.5 + als / 24 * (5 - t + 9 * c + 4 * Math.pow(c, 2) + als / 30 * (61 - 58 * t + Math.pow(t, 2) + 600 * c - 330 * this.ep2))))) + this.y0;

    }
    p.x = x;
    p.y = y;
    return p;
  };

  /**
    Transverse Mercator Inverse  -  x/y to long/lat
  */
  exports.inverse = function(p) {
    var con, phi; /* temporary angles       */
    var delta_phi; /* difference between longitudes    */
    var i;
    var max_iter = 6; /* maximun number of iterations */
    var lat, lon;

    if (this.sphere) { /* spherical form */
      var f = Math.exp(p.x / (this.a * this.k0));
      var g = 0.5 * (f - 1 / f);
      var temp = this.lat0 + p.y / (this.a * this.k0);
      var h = Math.cos(temp);
      con = Math.sqrt((1 - h * h) / (1 + g * g));
      lat = common.asinz(con);
      if (temp < 0) {
        lat = -lat;
      }
      if ((g === 0) && (h === 0)) {
        lon = this.long0;
      }
      else {
        lon = common.adjust_lon(Math.atan2(g, h) + this.long0);
      }
    }
    else { // ellipsoidal form
      var x = p.x - this.x0;
      var y = p.y - this.y0;

      con = (this.ml0 + y / this.k0) / this.a;
      phi = con;
      for (i = 0; true; i++) {
        delta_phi = ((con + this.e1 * Math.sin(2 * phi) - this.e2 * Math.sin(4 * phi) + this.e3 * Math.sin(6 * phi)) / this.e0) - phi;
        phi += delta_phi;
        if (Math.abs(delta_phi) <= common.EPSLN) {
          break;
        }
        if (i >= max_iter) {
          //proj4.reportError("tmerc:inverse: Latitude failed to converge");
          return (95);
        }
      } // for()
      if (Math.abs(phi) < common.HALF_PI) {
        // sincos(phi, &sin_phi, &cos_phi);
        var sin_phi = Math.sin(phi);
        var cos_phi = Math.cos(phi);
        var tan_phi = Math.tan(phi);
        var c = this.ep2 * Math.pow(cos_phi, 2);
        var cs = Math.pow(c, 2);
        var t = Math.pow(tan_phi, 2);
        var ts = Math.pow(t, 2);
        con = 1 - this.es * Math.pow(sin_phi, 2);
        var n = this.a / Math.sqrt(con);
        var r = n * (1 - this.es) / con;
        var d = x / (n * this.k0);
        var ds = Math.pow(d, 2);
        lat = phi - (n * tan_phi * ds / r) * (0.5 - ds / 24 * (5 + 3 * t + 10 * c - 4 * cs - 9 * this.ep2 - ds / 30 * (61 + 90 * t + 298 * c + 45 * ts - 252 * this.ep2 - 3 * cs)));
        lon = common.adjust_lon(this.long0 + (d * (1 - ds / 6 * (1 + 2 * t + c - ds / 20 * (5 - 2 * c + 28 * t - 3 * cs + 8 * this.ep2 + 24 * ts))) / cos_phi));
      }
      else {
        lat = common.HALF_PI * common.sign(y);
        lon = this.long0;
      }
    }
    p.x = lon;
    p.y = lat;
    return p;
  };
  exports.names = ["Transverse_Mercator", "Transverse Mercator", "tmerc"];
});
