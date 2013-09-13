define(function(require, exports) {
  var common = require('proj4/common');
  exports.init = function() {
    //double temp;      /* temporary variable    */

    /* Place parameters in static storage for common use
      -------------------------------------------------*/
    this.sin_p14 = Math.sin(this.lat0);
    this.cos_p14 = Math.cos(this.lat0);
  };


  /* Orthographic forward equations--mapping lat,long to x,y
    ---------------------------------------------------*/
  exports.forward = function(p) {
    var sinphi, cosphi; /* sin and cos value        */
    var dlon; /* delta longitude value      */
    var coslon; /* cos of longitude        */
    var ksp; /* scale factor          */
    var g, x, y;
    var lon = p.x;
    var lat = p.y;
    /* Forward equations
      -----------------*/
    dlon = common.adjust_lon(lon - this.long0);

    sinphi = Math.sin(lat);
    cosphi = Math.cos(lat);

    coslon = Math.cos(dlon);
    g = this.sin_p14 * sinphi + this.cos_p14 * cosphi * coslon;
    ksp = 1;
    if ((g > 0) || (Math.abs(g) <= common.EPSLN)) {
      x = this.a * ksp * cosphi * Math.sin(dlon);
      y = this.y0 + this.a * ksp * (this.cos_p14 * sinphi - this.sin_p14 * cosphi * coslon);
    }
    else {
      //proj4.reportError("orthoFwdPointError");
    }
    p.x = x;
    p.y = y;
    return p;
  };


  exports.inverse = function(p) {
    var rh; /* height above ellipsoid      */
    var z; /* angle          */
    var sinz, cosz; /* sin of z and cos of z      */
    var con;
    var lon, lat;
    /* Inverse equations
      -----------------*/
    p.x -= this.x0;
    p.y -= this.y0;
    rh = Math.sqrt(p.x * p.x + p.y * p.y);
    if (rh > this.a + 0.0000001) {
      //proj4.reportError("orthoInvDataError");
    }
    z = common.asinz(rh / this.a);

    sinz = Math.sin(z);
    cosz = Math.cos(z);

    lon = this.long0;
    if (Math.abs(rh) <= common.EPSLN) {
      lat = this.lat0;
      p.x = lon;
      p.y = lat;
      return p;
    }
    lat = common.asinz(cosz * this.sin_p14 + (p.y * sinz * this.cos_p14) / rh);
    con = Math.abs(this.lat0) - common.HALF_PI;
    if (Math.abs(con) <= common.EPSLN) {
      if (this.lat0 >= 0) {
        lon = common.adjust_lon(this.long0 + Math.atan2(p.x, - p.y));
      }
      else {
        lon = common.adjust_lon(this.long0 - Math.atan2(-p.x, p.y));
      }
      p.x = lon;
      p.y = lat;
      return p;
    }
    lon = common.adjust_lon(this.long0 + Math.atan2((p.x * sinz), rh * this.cos_p14 * cosz - p.y * this.sin_p14 * sinz));
    p.x = lon;
    p.y = lat;
    return p;
  };
  exports.names = ["ortho"];

});
