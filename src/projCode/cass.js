/*******************************************************************************
NAME                            CASSINI

PURPOSE:	Transforms input longitude and latitude to Easting and
		Northing for the Cassini projection.  The
		longitude and latitude must be in radians.  The Easting
		and Northing values will be returned in meters.
    Ported from PROJ.4.


ALGORITHM REFERENCES

1.  Snyder, John P., "Map Projections--A Working Manual", U.S. Geological
    Survey Professional Paper 1395 (Supersedes USGS Bulletin 1532), United
    State Government Printing Office, Washington D.C., 1987.

2.  Snyder, John P. and Voxland, Philip M., "An Album of Map Projections",
    U.S. Geological Survey Professional Paper 1453 , United State Government
*******************************************************************************/


//Proj4js.defs["EPSG:28191"] = "+proj=cass +lat_0=31.73409694444445 +lon_0=35.21208055555556 +x_0=170251.555 +y_0=126867.909 +a=6378300.789 +b=6356566.435 +towgs84=-275.722,94.7824,340.894,-8.001,-4.42,-11.821,1 +units=m +no_defs";

// Initialize the Cassini projection
// -----------------------------------------------------------------

Proj4js.Proj.cass = {
  init : function() {
    if (!this.sphere) {
      this.e0 = Proj4js.common.e0fn(this.es);
      this.e1 = Proj4js.common.e1fn(this.es);
      this.e2 = Proj4js.common.e2fn(this.es);
      this.e3 = Proj4js.common.e3fn(this.es);
      this.ml0 = this.a*Proj4js.common.mlfn(this.e0,this.e1,this.e2,this.e3,this.lat0);
    }
  },



/* Cassini forward equations--mapping lat,long to x,y
  -----------------------------------------------------------------------*/
  forward: function(p) {

    /* Forward equations
      -----------------*/
    var x,y;
    var lam=p.x;
    var phi=p.y;
    lam = Proj4js.common.adjust_lon(lam - this.long0);
    
    if (this.sphere) {
      x = this.a*Math.asin(Math.cos(phi) * Math.sin(lam));
      y = this.a*(Math.atan2(Math.tan(phi) , Math.cos(lam)) - this.lat0);
    } else {
        //ellipsoid
      var sinphi = Math.sin(phi);
      var cosphi = Math.cos(phi);
      var nl = Proj4js.common.gN(this.a,this.e,sinphi);
      var tl = Math.tan(phi)*Math.tan(phi);
      var al = lam*Math.cos(phi);
      var asq = al*al;
      var cl = this.es*cosphi*cosphi/(1.0-this.es);
      var ml = this.a*Proj4js.common.mlfn(this.e0,this.e1,this.e2,this.e3,phi);
      
      x = nl*al*(1.0-asq*tl*(1.0/6.0-(8.0-tl+8.0*cl)*asq/120.0));
      y = ml-this.ml0 + nl*sinphi/cosphi*asq*(0.5+(5.0-tl+6.0*cl)*asq/24.0);
      
      
    }
    
    p.x = x + this.x0;
    p.y = y + this.y0;
    return p;
  },//cassFwd()

/* Inverse equations
  -----------------*/
  inverse: function(p) {
    p.x -= this.x0;
    p.y -= this.y0;
    var x = p.x/this.a;
    var y = p.y/this.a;
    var phi, lam;

    if (this.sphere) {
      var dd = y + this.lat0;
      phi = Math.asin(Math.sin(dd) * Math.cos(x));
      lam = Math.atan2(Math.tan(x), Math.cos(dd));
    } else {
      /* ellipsoid */
      var ml1 = this.ml0/this.a + y;
      var phi1 = Proj4js.common.imlfn(ml1, this.e0,this.e1,this.e2,this.e3);
      if (Math.abs(Math.abs(phi1)-Proj4js.common.HALF_PI)<=Proj4js.common.EPSLN){
	p.x=this.long0;
	p.y=Proj4js.common.HALF_PI;
	if (y<0.0){p.y*=-1.0;}
	return p;
      }
      var nl1 = Proj4js.common.gN(this.a,this.e, Math.sin(phi1));
      
      var rl1 = nl1*nl1*nl1/this.a/this.a*(1.0-this.es);
      var tl1 = Math.pow(Math.tan(phi1),2.0);
      var dl = x*this.a/nl1;
      var dsq=dl*dl;
      phi = phi1-nl1*Math.tan(phi1)/rl1*dl*dl*(0.5-(1.0+3.0*tl1)*dl*dl/24.0);
      lam = dl*(1.0-dsq*(tl1/3.0+(1.0+3.0*tl1)*tl1*dsq/15.0))/Math.cos(phi1);
      
    } 
    
    p.x=Proj4js.common.adjust_lon(lam+this.long0);
    p.y=Proj4js.common.adjust_lat(phi);
    return p;
    
   }//cassInv()

};
