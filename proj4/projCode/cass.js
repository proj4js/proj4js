define(function(require, exports) {
  var common = require('proj4/common');
  exports.init = function() {
    if (!this.sphere) {
      this.e0 = common.e0fn(this.es);
      this.e1 = common.e1fn(this.es);
      this.e2 = common.e2fn(this.es);
      this.e3 = common.e3fn(this.es);
      this.ml0 = this.a * common.mlfn(this.e0, this.e1, this.e2, this.e3, this.lat0);
    }
  };



  /* Cassini forward equations--mapping lat,long to x,y
  -----------------------------------------------------------------------*/
  exports.forward = function(p) {

    /* Forward equations
      -----------------*/
    var x, y;
    var lam = p.x;
    var phi = p.y;
    lam = common.adjust_lon(lam - this.long0);

    if (this.sphere) {
      x = this.a * Math.asin(Math.cos(phi) * Math.sin(lam));
      y = this.a * (Math.atan2(Math.tan(phi), Math.cos(lam)) - this.lat0);
    }
    else {
      //ellipsoid
      var sinphi = Math.sin(phi);
      var cosphi = Math.cos(phi);
      var nl = common.gN(this.a, this.e, sinphi);
      var tl = Math.tan(phi) * Math.tan(phi);
      var al = lam * Math.cos(phi);
      var asq = al * al;
      var cl = this.es * cosphi * cosphi / (1 - this.es);
      var ml = this.a * common.mlfn(this.e0, this.e1, this.e2, this.e3, phi);

      x = nl * al * (1 - asq * tl * (1 / 6 - (8 - tl + 8 * cl) * asq / 120));
      y = ml - this.ml0 + nl * sinphi / cosphi * asq * (0.5 + (5 - tl + 6 * cl) * asq / 24);


    }

    p.x = x + this.x0;
    p.y = y + this.y0;
    return p;
  };

  /* Inverse equations
  -----------------*/
  exports.inverse = function(p) {
    p.x -= this.x0;
    p.y -= this.y0;
    var x = p.x / this.a;
    var y = p.y / this.a;
    var phi, lam;

    if (this.sphere) {
      var dd = y + this.lat0;
      phi = Math.asin(Math.sin(dd) * Math.cos(x));
      lam = Math.atan2(Math.tan(x), Math.cos(dd));
    }
    else {
      /* ellipsoid */
      var ml1 = this.ml0 / this.a + y;
      var phi1 = common.imlfn(ml1, this.e0, this.e1, this.e2, this.e3);
      if (Math.abs(Math.abs(phi1) - common.HALF_PI) <= common.EPSLN) {
        p.x = this.long0;
        p.y = common.HALF_PI;
        if (y < 0) {
          p.y *= -1;
        }
        return p;
      }
      var nl1 = common.gN(this.a, this.e, Math.sin(phi1));

      var rl1 = nl1 * nl1 * nl1 / this.a / this.a * (1 - this.es);
      var tl1 = Math.pow(Math.tan(phi1), 2);
      var dl = x * this.a / nl1;
      var dsq = dl * dl;
      phi = phi1 - nl1 * Math.tan(phi1) / rl1 * dl * dl * (0.5 - (1 + 3 * tl1) * dl * dl / 24);
      lam = dl * (1 - dsq * (tl1 / 3 + (1 + 3 * tl1) * tl1 * dsq / 15)) / Math.cos(phi1);

    }

    p.x = common.adjust_lon(lam + this.long0);
    p.y = common.adjust_lat(phi);
    return p;

  };
  exports.names = ["Cassini", "Cassini_Soldner", "cass"];
});
