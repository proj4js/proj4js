goog.provide('Proj4js.Proj.lcc');


/*******************************************************************************
NAME                            LAMBERT CONFORMAL CONIC

PURPOSE:	Transforms input longitude and latitude to Easting and
		Northing for the Lambert Conformal Conic projection.  The
		longitude and latitude must be in radians.  The Easting
		and Northing values will be returned in meters.


ALGORITHM REFERENCES

1.  Snyder, John P., "Map Projections--A Working Manual", U.S. Geological
    Survey Professional Paper 1395 (Supersedes USGS Bulletin 1532), United
    State Government Printing Office, Washington D.C., 1987.

2.  Snyder, John P. and Voxland, Philip M., "An Album of Map Projections",
    U.S. Geological Survey Professional Paper 1453 , United State Government
*******************************************************************************/


//<2104> +proj=lcc +lat_1=10.16666666666667 +lat_0=10.16666666666667 +lon_0=-71.60561777777777 +k_0=1 +x0=-17044 +x0=-23139.97 +ellps=intl +units=m +no_defs  no_defs

// Initialize the Lambert Conformal conic projection
// -----------------------------------------------------------------



/**
 * @param {Proj4js.Proj} proj
 * @implements {Proj4js.Proj.transform}
 * @constructor
 */
Proj4js.Proj.lcc = function(proj) {

    // array of:  r_maj,r_min,lat1,lat2,c_lon,c_lat,false_east,false_north
    //double c_lat;                   /* center latitude                      */
    //double c_lon;                   /* center longitude                     */
    //double lat1;                    /* first standard parallel              */
    //double lat2;                    /* second standard parallel             */
    //double r_maj;                   /* major axis                           */
    //double r_min;                   /* minor axis                           */
    //double false_east;              /* x offset in meters                   */
    //double false_north;             /* y offset in meters                   */
	  this.proj = proj;
	
      if (!this.proj.lat2) {//if lat2 is not defined set it
       this.proj.lat2 = this.proj.lat0;
      }
      if (!this.proj.k0) {
        this.proj.k0 = 1.0;
      }

    // Standard Parallels cannot be equal and on opposite sides of the equator
      if (Math.abs(this.proj.lat1+this.proj.lat2) < Proj4js.common.EPSLN) {
        Proj4js.reportError("lcc:init: Equal Latitudes");
        return;
      }

      var temp = this.proj.b / this.proj.a;
      this.proj.e = Math.sqrt(1.0 - temp*temp);

      var sin1 = Math.sin(this.proj.lat1);
      var cos1 = Math.cos(this.proj.lat1);
      var ms1 = Proj4js.common.msfnz(this.proj.e, sin1, cos1);
      var ts1 = Proj4js.common.tsfnz(this.proj.e, this.proj.lat1, sin1);

      var sin2 = Math.sin(this.proj.lat2);
      var cos2 = Math.cos(this.proj.lat2);
      var ms2 = Proj4js.common.msfnz(this.proj.e, sin2, cos2);
      var ts2 = Proj4js.common.tsfnz(this.proj.e, this.proj.lat2, sin2);

      var ts0 = Proj4js.common.tsfnz(this.proj.e, this.proj.lat0, Math.sin(this.proj.lat0));

      if (Math.abs(this.proj.lat1 - this.proj.lat2) > Proj4js.common.EPSLN) {
        this.proj.ns = Math.log(ms1/ms2)/Math.log(ts1/ts2);
      } else {
        this.proj.ns = sin1;
      }
      this.proj.f0 = ms1 / (this.proj.ns * Math.pow(ts1, this.proj.ns));
      this.proj.rh = this.proj.a * this.proj.f0 * Math.pow(ts0, this.proj.ns);
      if (!this.proj.title) this.proj.title = "Lambert Conformal Conic";
};


/**
 * Lambert Conformal conic forward equations--mapping lat,long to x,y
 *  -----------------------------------------------------------------
 * @param {!Proj4js.Point|{x: !number,y: !number,z: ?number}} p the lat long input value
 * @return {Proj4js.Point|{x: !number,y: !number,z: ?number}} the point x,y transformed.
 */
Proj4js.Proj.lcc.prototype.forward = function(p) {

      var lon = p.x;
      var lat = p.y;

    // convert to radians done in the transofrm call
      if ( lat <= 90.0 && lat >= -90.0 && lon <= 180.0 && lon >= -180.0) {
        //lon = lon * Proj4js.common.D2R;
        //lat = lat * Proj4js.common.D2R;
      } else {
        Proj4js.reportError("lcc:forward: llInputOutOfRange: "+ lon +" : " + lat);
        return null;
      }

      var con  = Math.abs( Math.abs(lat) - Proj4js.common.HALF_PI);
      var ts, rh1;
      if (con > Proj4js.common.EPSLN) {
        ts = Proj4js.common.tsfnz(this.proj.e, lat, Math.sin(lat) );
        rh1 = this.proj.a * this.proj.f0 * Math.pow(ts, this.proj.ns);
      } else {
        con = lat * this.proj.ns;
        if (con <= 0) {
          Proj4js.reportError("lcc:forward: No Projection");
          return null;
        }
        rh1 = 0;
      }
      var theta = this.proj.ns * Proj4js.common.adjust_lon(lon - this.proj.long0);
      p.x = this.proj.k0 * (rh1 * Math.sin(theta)) + this.proj.x0;
      p.y = this.proj.k0 * (this.proj.rh - rh1 * Math.cos(theta)) + this.proj.y0;

      return p;
};

/**
 * Lambert Conformal Conic inverse equations--mapping x,y to lat/long
 *  -----------------------------------------------------------------
* @param {!Proj4js.Point|{x: !number,y: !number,z: ?number}} p the x,y input value
* @return {Proj4js.Point|{x: !number,y: !number,z: ?number}} the lat long point transformed.
*/
Proj4js.Proj.lcc.prototype.inverse = function(p) {

    var rh1, con, ts;
    var lat, lon;
    var x = (p.x - this.proj.x0)/this.proj.k0;
    var y = (this.proj.rh - (p.y - this.proj.y0)/this.proj.k0);
    if (this.proj.ns > 0) {
      rh1 = Math.sqrt (x * x + y * y);
      con = 1.0;
    } else {
      rh1 = -Math.sqrt (x * x + y * y);
      con = -1.0;
    }
    var theta = 0.0;
    if (rh1 != 0) {
      theta = Math.atan2((con * x),(con * y));
    }
    if ((rh1 != 0) || (this.proj.ns > 0.0)) {
      con = 1.0/this.proj.ns;
      ts = Math.pow((rh1/(this.proj.a * this.proj.f0)), con);
      lat = Proj4js.common.phi2z(this.proj.e, ts);
      if (lat == -9999) return null;
    } else {
      lat = -Proj4js.common.HALF_PI;
    }
    lon = Proj4js.common.adjust_lon(theta/this.proj.ns + this.proj.long0);

    p.x = lon;
    p.y = lat;
    return p;
};




