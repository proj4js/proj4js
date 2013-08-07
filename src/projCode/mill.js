define(['../common'],function(common) {
  return {

    /* Initialize the Miller Cylindrical projection
  -------------------------------------------*/
    init: function() {
      //no-op
    },


    /* Miller Cylindrical forward equations--mapping lat,long to x,y
    ------------------------------------------------------------*/
    forward: function(p) {
      var lon = p.x;
      var lat = p.y;
      /* Forward equations
      -----------------*/
      var dlon = common.adjust_lon(lon - this.long0);
      var x = this.x0 + this.a * dlon;
      var y = this.y0 + this.a * Math.log(Math.tan((common.PI / 4) + (lat / 2.5))) * 1.25;

      p.x = x;
      p.y = y;
      return p;
    }, //millFwd()

    /* Miller Cylindrical inverse equations--mapping x,y to lat/long
    ------------------------------------------------------------*/
    inverse: function(p) {
      p.x -= this.x0;
      p.y -= this.y0;

      var lon = common.adjust_lon(this.long0 + p.x / this.a);
      var lat = 2.5 * (Math.atan(Math.exp(0.8 * p.y / this.a)) - common.PI / 4);

      p.x = lon;
      p.y = lat;
      return p;
    } //millInv()
  };

});
