proj4.Proj.gauss = {

  init: function() {
    var sphi = Math.sin(this.lat0);
    var cphi = Math.cos(this.lat0);
    cphi *= cphi;
    this.rc = Math.sqrt(1.0 - this.es) / (1.0 - this.es * sphi * sphi);
    this.C = Math.sqrt(1.0 + this.es * cphi * cphi / (1.0 - this.es));
    this.phic0 = Math.asin(sphi / this.C);
    this.ratexp = 0.5 * this.C * this.e;
    this.K = Math.tan(0.5 * this.phic0 + proj4.common.FORTPI) / (Math.pow(Math.tan(0.5 * this.lat0 + proj4.common.FORTPI), this.C) * proj4.common.srat(this.e * sphi, this.ratexp));
  },

  forward: function(p) {
    var lon = p.x;
    var lat = p.y;

    p.y = 2.0 * Math.atan(this.K * Math.pow(Math.tan(0.5 * lat + proj4.common.FORTPI), this.C) * proj4.common.srat(this.e * Math.sin(lat), this.ratexp)) - proj4.common.HALF_PI;
    p.x = this.C * lon;
    return p;
  },

  inverse: function(p) {
    var DEL_TOL = 1e-14;
    var lon = p.x / this.C;
    var lat = p.y;
    var num = Math.pow(Math.tan(0.5 * lat + proj4.common.FORTPI) / this.K, 1. / this.C);
    for (var i = proj4.common.MAX_ITER; i > 0; --i) {
      lat = 2.0 * Math.atan(num * proj4.common.srat(this.e * Math.sin(p.y), - 0.5 * this.e)) - proj4.common.HALF_PI;
      if (Math.abs(lat - p.y) < DEL_TOL) break;
      p.y = lat;
    }
    /* convergence failed */
    if (!i) {
      proj4.reportError("gauss:inverse:convergence failed");
      return null;
    }
    p.x = lon;
    p.y = lat;
    return p;
  }
};
