define(['../common'],function(common) {
  return {

    /* Initialize the Sinusoidal projection
    ------------------------------------*/
    init: function() {
      /* Place parameters in static storage for common use
    -------------------------------------------------*/


      if (!this.sphere) {
        this.en = common.pj_enfn(this.es);
      }
      else {
        this.n = 1;
        this.m = 0;
        this.es = 0;
        this.C_y = Math.sqrt((this.m + 1) / this.n);
        this.C_x = this.C_y / (this.m + 1);
      }

    },

    /* Sinusoidal forward equations--mapping lat,long to x,y
  -----------------------------------------------------*/
    forward: function(p) {
      var x, y;
      var lon = p.x;
      var lat = p.y;
      /* Forward equations
    -----------------*/
      lon = common.adjust_lon(lon - this.long0);

      if (this.sphere) {
        if (!this.m) {
          lat = this.n !== 1 ? Math.asin(this.n * Math.sin(lat)) : lat;
        }
        else {
          var k = this.n * Math.sin(lat);
          for (var i = common.MAX_ITER; i; --i) {
            var V = (this.m * lat + Math.sin(lat) - k) / (this.m + Math.cos(lat));
            lat -= V;
            if (Math.abs(V) < common.EPSLN) {
              break;
            }
          }
        }
        x = this.a * this.C_x * lon * (this.m + Math.cos(lat));
        y = this.a * this.C_y * lat;

      }
      else {

        var s = Math.sin(lat);
        var c = Math.cos(lat);
        y = this.a * common.pj_mlfn(lat, s, c, this.en);
        x = this.a * lon * c / Math.sqrt(1 - this.es * s * s);
      }

      p.x = x;
      p.y = y;
      return p;
    },

    inverse: function(p) {
      var lat, temp, lon;

      /* Inverse equations
    -----------------*/
      p.x -= this.x0;
      p.y -= this.y0;
      lat = p.y / this.a;

      if (this.sphere) {

        p.y /= this.C_y;
        lat = this.m ? Math.asin((this.m * p.y + Math.sin(p.y)) / this.n) : (this.n !== 1 ? Math.asin(Math.sin(p.y) / this.n) : p.y);
        lon = p.x / (this.C_x * (this.m + Math.cos(p.y)));

      }
      else {
        lat = common.pj_inv_mlfn(p.y / this.a, this.es, this.en);
        var s = Math.abs(lat);
        if (s < common.HALF_PI) {
          s = Math.sin(lat);
          temp = this.long0 + p.x * Math.sqrt(1 - this.es * s * s) / (this.a * Math.cos(lat));
          //temp = this.long0 + p.x / (this.a * Math.cos(lat));
          lon = common.adjust_lon(temp);
        }
        else if ((s - common.EPSLN) < common.HALF_PI) {
          lon = this.long0;
        }

      }

      p.x = lon;
      p.y = lat;
      return p;
    }
  };

});
