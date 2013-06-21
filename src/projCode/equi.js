/*******************************************************************************
NAME                             EQUIRECTANGULAR 

PURPOSE:  Transforms input longitude and latitude to Easting and
    Northing for the Equirectangular projection.  The
    longitude and latitude must be in radians.  The Easting
    and Northing values will be returned in meters.

PROGRAMMER              DATE
----------              ----
T. Mittan    Mar, 1993

ALGORITHM REFERENCES

1.  Snyder, John P., "Map Projections--A Working Manual", U.S. Geological
    Survey Professional Paper 1395 (Supersedes USGS Bulletin 1532), United
    State Government Printing Office, Washington D.C., 1987.

2.  Snyder, John P. and Voxland, Philip M., "An Album of Map Projections",
    U.S. Geological Survey Professional Paper 1453 , United State Government
    Printing Office, Washington D.C., 1989.
*******************************************************************************/
proj4.Proj.equi = {

  init: function() {
    this.x0 = this.x0||0;
    this.y0 = this.y0||0;
    this.lat0 = this.lat0||0;
    this.long0 = this.long0||0;
    ///this.t2;
  },



  /* Equirectangular forward equations--mapping lat,long to x,y
  ---------------------------------------------------------*/
  forward: function(p) {

    var lon = p.x;
    var lat = p.y;

    var dlon = proj4.common.adjust_lon(lon - this.long0);
    var x = this.x0 + this.a * dlon * Math.cos(this.lat0);
    var y = this.y0 + this.a * lat;

    this.t1 = x;
    this.t2 = Math.cos(this.lat0);
    p.x = x;
    p.y = y;
    return p;
  }, //equiFwd()



  /* Equirectangular inverse equations--mapping x,y to lat/long
  ---------------------------------------------------------*/
  inverse: function(p) {

    p.x -= this.x0;
    p.y -= this.y0;
    var lat = p.y / this.a;

    if (Math.abs(lat) > proj4.common.HALF_PI) {
      proj4.reportError("equi:Inv:DataError");
    }
    var lon = proj4.common.adjust_lon(this.long0 + p.x / (this.a * Math.cos(this.lat0)));
    p.x = lon;
    p.y = lat;
  } //equiInv()
};
