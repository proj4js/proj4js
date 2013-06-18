/*******************************************************************************
NAME                            EQUIDISTANT CONIC 

PURPOSE:	Transforms input longitude and latitude to Easting and Northing
		for the Equidistant Conic projection.  The longitude and
		latitude must be in radians.  The Easting and Northing values
		will be returned in meters.

PROGRAMMER              DATE
----------              ----
T. Mittan		Mar, 1993

ALGORITHM REFERENCES

1.  Snyder, John P., "Map Projections--A Working Manual", U.S. Geological
    Survey Professional Paper 1395 (Supersedes USGS Bulletin 1532), United
    State Government Printing Office, Washington D.C., 1987.

2.  Snyder, John P. and Voxland, Philip M., "An Album of Map Projections",
    U.S. Geological Survey Professional Paper 1453 , United State Government
    Printing Office, Washington D.C., 1989.
*******************************************************************************/

/* Variables common to all subroutines in this code file
  -----------------------------------------------------*/

Proj4js.Proj.eqdc = {

/* Initialize the Equidistant Conic projection
  ------------------------------------------*/
  init: function() {

    /* Place parameters in static storage for common use
      -------------------------------------------------*/
	// Standard Parallels cannot be equal and on opposite sides of the equator
	if (Math.abs(this.lat1 + this.lat2) < Proj4js.common.EPSLN) {
		Proj4js.common.reportError("eqdc:init: Equal Latitudes");
		return;
	}
	if (this.lat2 == null) {
		this.lat2=this.lat1;
	}
	this.temp = this.b / this.a;
	this.es = 1.0 - Math.pow(this.temp,2);
	this.e = Math.sqrt(this.es);
	this.e0 = Proj4js.common.e0fn(this.es);
	this.e1 = Proj4js.common.e1fn(this.es);
	this.e2 = Proj4js.common.e2fn(this.es);
	this.e3 = Proj4js.common.e3fn(this.es);

	this.sinphi=Math.sin(this.lat1);
	this.cosphi=Math.cos(this.lat1);

	this.ms1 = Proj4js.common.msfnz(this.e,this.sinphi,this.cosphi);
	this.ml1 = Proj4js.common.mlfn(this.e0, this.e1, this.e2,this.e3, this.lat1);

	if (Math.abs(this.lat1 - this.lat2) < Proj4js.common.EPSLN) {
		this.ns = this.sinphi;
		Proj4js.reportError("eqdc:Init:EqualLatitudes");
        } else {
		this.sinphi=Math.sin(this.lat2);
		this.cosphi=Math.cos(this.lat2); 
		this.ms2 = Proj4js.common.msfnz(this.e,this.sinphi,this.cosphi);
		this.ml2 = Proj4js.common.mlfn(this.e0, this.e1, this.e2, this.e3, this.lat2);
		this.ns = (this.ms1 - this.ms2) / (this.ml2 - this.ml1);
	}
	this.g = this.ml1 + this.ms1/this.ns;
	this.ml0 = Proj4js.common.mlfn(this.e0, this.e1,this. e2, this.e3, this.lat0);
	this.rh = this.a * (this.g - this.ml0);
  },


/* Equidistant Conic forward equations--mapping lat,long to x,y
  -----------------------------------------------------------*/
  forward: function(p) {
    var lon=p.x;
    var lat=p.y;
    var rh1;

    /* Forward equations
      -----------------*/
    if (this.sphere){
	rh1 = this.a *(this.g - lat);
    } else {
	var ml = Proj4js.common.mlfn(this.e0, this.e1, this.e2, this.e3, lat);
	rh1 = this.a * (this.g - ml);
    }
    var theta = this.ns * Proj4js.common.adjust_lon(lon - this.long0);
    var x = this.x0  + rh1 * Math.sin(theta);
    var y = this.y0 + this.rh - rh1 * Math.cos(theta);
    p.x=x;
    p.y=y;
    return p;
  },

/* Inverse equations
  -----------------*/
  inverse: function(p) {
    p.x -= this.x0;
    p.y  = this.rh - p.y + this.y0;
    var con, rh1, lat, lon;
    if (this.ns >= 0) {
       rh1 = Math.sqrt(p.x *p.x + p.y * p.y); 
       con = 1.0;
    } else {
       rh1 = -Math.sqrt(p.x *p. x +p. y * p.y); 
       con = -1.0;
    }
    var theta = 0.0;
    if (rh1 != 0.0) {theta = Math.atan2(con *p.x, con *p.y);}
    
    if (this.sphere){
	lon=Proj4js.common.adjust_lon(this.long0+theta/this.ns);
	lat=Proj4js.common.adjust_lat(this.g-rh1/this.a);
	p.x=lon;
	p.y=lat;
	return p;
    } else {
	var ml = this.g - rh1 /this.a;
	lat = Proj4js.common.imlfn(ml,this.e0,this.e1,this.e2,this.e3);
	lon = Proj4js.common.adjust_lon(this.long0 + theta / this.ns);
	p.x=lon;
	p.y=lat;  
	return p;
    }
    
    }
    


    
};