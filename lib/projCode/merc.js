goog.provide('Proj4js.Proj.merc');

/*******************************************************************************
NAME                            MERCATOR

PURPOSE:	Transforms input longitude and latitude to Easting and
		Northing for the Mercator projection.  The
		longitude and latitude must be in radians.  The Easting
		and Northing values will be returned in meters.

PROGRAMMER              DATE
----------              ----
D. Steinwand, EROS      Nov, 1991
T. Mittan		Mar, 1993

ALGORITHM REFERENCES

1.  Snyder, John P., "Map Projections--A Working Manual", U.S. Geological
    Survey Professional Paper 1395 (Supersedes USGS Bulletin 1532), United
    State Government Printing Office, Washington D.C., 1987.

2.  Snyder, John P. and Voxland, Philip M., "An Album of Map Projections",
    U.S. Geological Survey Professional Paper 1453 , United State Government
    Printing Office, Washington D.C., 1989.
*******************************************************************************/

//static double r_major = a;		   /* major axis 				*/
//static double r_minor = b;		   /* minor axis 				*/
//static double lon_center = long0;	   /* Center longitude (projection center) */
//static double lat_origin =  lat0;	   /* center latitude			*/
//static double e,es;		           /* eccentricity constants		*/
//static double m1;		               /* small value m			*/
//static double false_northing = y0;   /* y offset in meters			*/
//static double false_easting = x0;	   /* x offset in meters			*/
//scale_fact = k0

/**
 * @param {Proj4js.Proj} proj
 * @implements {Proj4js.Proj.transform}
 * @constructor
 */
Proj4js.Proj.merc = function(proj) {
	//?this.proj.temp = this.proj.r_minor / this.proj.r_major;
	//this.proj.temp = this.proj.b / this.proj.a;
	//this.proj.es = 1.0 - Math.sqrt(this.proj.temp);
	//this.proj.e = Math.sqrt( this.proj.es );
	//?this.proj.m1 = Math.cos(this.proj.lat_origin) / (Math.sqrt( 1.0 - this.proj.es * Math.sin(this.proj.lat_origin) * Math.sin(this.proj.lat_origin)));
	//this.proj.m1 = Math.cos(0.0) / (Math.sqrt( 1.0 - this.proj.es * Math.sin(0.0) * Math.sin(0.0)));
	  this.proj = proj;

    if (this.proj.lat_ts) {
      if (this.proj.sphere) {
        this.proj.k0 = Math.cos(this.proj.lat_ts);
      } else {
        this.proj.k0 = Proj4js.common.msfnz(this.proj.es, Math.sin(this.proj.lat_ts), Math.cos(this.proj.lat_ts));
      }
    }
}

/**
 * Mercator forward equations--mapping lat,long to x,y
 * @param {!Proj4js.Point|{x: !number,y: !number,z: ?number}} p the lat long input value
 * @return {Proj4js.Point|{x: !number,y: !number,z: ?number}} the point x,y transformed.
 */
Proj4js.Proj.merc.prototype.forward = function(p) {
    //alert("ll2m coords : "+coords);
    var lon = p.x;
    var lat = p.y;
    // convert to radians
    if ( lat*Proj4js.common.R2D > 90.0 &&
          lat*Proj4js.common.R2D < -90.0 &&
          lon*Proj4js.common.R2D > 180.0 &&
          lon*Proj4js.common.R2D < -180.0) {
      Proj4js.reportError("merc:forward: llInputOutOfRange: "+ lon +" : " + lat);
      return null;
    }

    var x,y;
    if(Math.abs( Math.abs(lat) - Proj4js.common.HALF_PI)  <= Proj4js.common.EPSLN) {
      Proj4js.reportError("merc:forward: ll2mAtPoles");
      return null;
    } else {
      if (this.proj.sphere) {
        x = this.proj.x0 + this.proj.a * this.proj.k0 * Proj4js.common.adjust_lon(lon - this.proj.long0);
        y = this.proj.y0 + this.proj.a * this.proj.k0 * Math.log(Math.tan(Proj4js.common.FORTPI + 0.5*lat));
      } else {
        var sinphi = Math.sin(lat);
        var ts = Proj4js.common.tsfnz(this.proj.e,lat,sinphi);
        x = this.proj.x0 + this.proj.a * this.proj.k0 * Proj4js.common.adjust_lon(lon - this.proj.long0);
        y = this.proj.y0 - this.proj.a * this.proj.k0 * Math.log(ts);
      }
      p.x = x;
      p.y = y;
      return p;
    }
};


/**
* Mercator inverse equations--mapping x,y to lat/long
* @param {!Proj4js.Point|{x: !number,y: !number,z: ?number}} p the x,y input value
* @return {Proj4js.Point|{x: !number,y: !number,z: ?number}} the lat long point transformed.
*/
Proj4js.Proj.merc.prototype.inverse = function(p) {

    var x = p.x - this.proj.x0;
    var y = p.y - this.proj.y0;
    var lon,lat;

    if (this.proj.sphere) {
      lat = Proj4js.common.HALF_PI - 2.0 * Math.atan(Math.exp(-y / (this.proj.a * this.proj.k0)));
    } else {
      var ts = Math.exp(-y / (this.proj.a * this.proj.k0));
      lat = Proj4js.common.phi2z(this.proj.e,ts);
      if(lat == -9999) {
        Proj4js.reportError("merc:inverse: lat = -9999");
        return null;
      }
    }
    lon = Proj4js.common.adjust_lon(this.proj.long0+ x / (this.proj.a * this.proj.k0));

    p.x = lon;
    p.y = lat;
    return p;
};


