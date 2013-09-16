define(function(require, exports) {
  var common = require('proj4/common');
  exports.init = function() {
    var con = this.b / this.a;
    this.es = 1 - con * con;
    this.e = Math.sqrt(this.es);
    if (this.lat_ts) {
      if (this.sphere) {
        this.k0 = Math.cos(this.lat_ts);
      }
      else {
        this.k0 = common.msfnz(this.e, Math.sin(this.lat_ts), Math.cos(this.lat_ts));
      }
    }
    else {
      if (!this.k0) {
        if (this.k) {
          this.k0 = this.k;
        }
        else {
          this.k0 = 1;
        }
      }
    }
  };

  /* Mercator forward equations--mapping lat,long to x,y
  --------------------------------------------------*/

  exports.forward = function(p) {
    //alert("ll2m coords : "+coords);
    var lon = p.x;
    var lat = p.y;
    // convert to radians
    if (lat * common.R2D > 90 && lat * common.R2D < -90 && lon * common.R2D > 180 && lon * common.R2D < -180) {
      //proj4.reportError("merc:forward: llInputOutOfRange: " + lon + " : " + lat);
      return null;
    }

    var x, y;
    if (Math.abs(Math.abs(lat) - common.HALF_PI) <= common.EPSLN) {
      //proj4.reportError("merc:forward: ll2mAtPoles");
      return null;
    }
    else {
      if (this.sphere) {
        x = this.x0 + this.a * this.k0 * common.adjust_lon(lon - this.long0);
        y = this.y0 + this.a * this.k0 * Math.log(Math.tan(common.FORTPI + 0.5 * lat));
      }
      else {
        var sinphi = Math.sin(lat);
        var ts = common.tsfnz(this.e, lat, sinphi);
        x = this.x0 + this.a * this.k0 * common.adjust_lon(lon - this.long0);
        y = this.y0 - this.a * this.k0 * Math.log(ts);
      }
      p.x = x;
      p.y = y;
      return p;
    }
  };


  /* Mercator inverse equations--mapping x,y to lat/long
  --------------------------------------------------*/
  exports.inverse = function(p) {

    var x = p.x - this.x0;
    var y = p.y - this.y0;
    var lon, lat;

    if (this.sphere) {
      lat = common.HALF_PI - 2 * Math.atan(Math.exp(-y / (this.a * this.k0)));
    }
    else {
      var ts = Math.exp(-y / (this.a * this.k0));
      lat = common.phi2z(this.e, ts);
      if (lat === -9999) {
        //proj4.reportError("merc:inverse: lat = -9999");
        return null;
      }
    }
    lon = common.adjust_lon(this.long0 + x / (this.a * this.k0));

    p.x = lon;
    p.y = lat;
    return p;
  };

  exports.names = ["Mercator", "Popular Visualisation Pseudo Mercator", "Mercator_1SP", "Mercator_Auxiliary_Sphere", "merc"];

});
