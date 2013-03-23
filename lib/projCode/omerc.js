/*******************************************************************************
NAME                       OBLIQUE MERCATOR (HOTINE) 

PURPOSE:	Transforms input longitude and latitude to Easting and
		Northing for the Oblique Mercator projection.  The
		longitude and latitude must be in radians.  The Easting
		and Northing values will be returned in meters.

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

Proj4js.Proj.omerc = {

  /* Initialize the Oblique Mercator  projection
    ------------------------------------------*/
  init: function() {
	 if (this.no_off==null){this.no_off=false;}
	 if (this.no_rot==null){this.no_rot=false;}
	
	if (isNaN(this.k0))
		this.k0=1.0;
	var sinlat = Math.sin(this.lat0);
	var coslat = Math.cos(this.lat0);
	var con = this.e*sinlat;

	this.bl=Math.sqrt(1.0+this.es/(1.0-this.es)*Math.pow(coslat,4.0));
	this.al= this.a*this.bl*this.k0*Math.sqrt(1-this.es)/(1-con*con);
	var t0 = Proj4js.common.tsfnz(this.e,this.lat0,sinlat);
	var dl = this.bl/coslat*Math.sqrt((1-this.es)/(1-con*con));
	if (dl*dl<1.0)
		dl=1.0;
	var fl;
	var gl;
	if (!isNaN(this.longc)){
	//Central point and azimuth method

	if (this.lat0>=0.0){
		fl = dl+Math.sqrt(dl*dl-1.0);
	} else {
		fl = dl-Math.sqrt(dl*dl-1.0);
	}
	this.el = fl*Math.pow(t0,this.bl);
	gl = 0.5*(fl-1.0/fl);
	this.gamma0=Math.asin(Math.sin(this.alpha)/dl);
	this.long0 = this.longc-Math.asin(gl*Math.tan(this.gamma0))/this.bl;

	} else {
		//2 points method
		var t1 = Proj4js.common.tsfnz(this.e,this.lat1,Math.sin(this.lat1));
		var t2 = Proj4js.common.tsfnz(this.e,this.lat2,Math.sin(this.lat2));
		if (this.lat0>=0.0){
			this.el = (dl+Math.sqrt(dl*dl-1.0))*Math.pow(t0,this.bl);
		} else {
			this.el = (dl-Math.sqrt(dl*dl-1.0))*Math.pow(t0,this.bl);
		}
		var hl = Math.pow(t1,this.bl);
		var ll = Math.pow(t2,this.bl);
		fl = this.el/hl;
		gl = 0.5*(fl-1.0/fl);
		var jl = (this.el*this.el-ll*hl)/(this.el*this.el+ll*hl);
		var pl = (ll-hl)/(ll+hl);
		var dlon12=Proj4js.common.adjust_lon(this.long1-this.long2);
		this.long0=0.5*(this.long1+this.long2)-Math.atan(jl*Math.tan(0.5*this.bl*(dlon12))/pl)/this.bl;
		this.long0=Proj4js.common.adjust_lon(this.long0);
		var dlon10=Proj4js.common.adjust_lon(this.long1-this.long0);
		this.gamma0 = Math.atan(Math.sin(this.bl*(dlon10))/gl);
		this.alpha = Math.asin(dl*Math.sin(this.gamma0));
	}
	
	if (this.no_off){
		this.uc=0.0;
	} else {
		if (this.lat0>=0.0) {
			this.uc=this.al/this.bl*Math.atan2(Math.sqrt(dl*dl-1.0),Math.cos(this.alpha));
		} else {
			this.uc=-1.0*this.al/this.bl*Math.atan2(Math.sqrt(dl*dl-1.0),Math.cos(this.alpha));
		}
	}
	
  },


  /* Oblique Mercator forward equations--mapping lat,long to x,y
    ----------------------------------------------------------*/
  forward: function(p) {
	var lon = p.x;
	var lat = p.y;
	var dlon=Proj4js.common.adjust_lon(lon-this.long0);
	var us, vs;
	var con;
	if (Math.abs(Math.abs(lat)-Proj4js.common.HALF_PI)<=Proj4js.common.EPSLN){
		if (lat>0.0){
			con=-1.0;
		} else {
			con=1.0;
		}
		vs=this.al/this.bl*Math.log(Math.tan(Proj4js.common.FORTPI+con*this.gamma0*0.5));
		us=-1.0*con*Proj4js.common.HALF_PI*this.al/this.bl;
	} else {
		var t = Proj4js.common.tsfnz(this.e,lat,Math.sin(lat));
		var ql = this.el/Math.pow(t,this.bl);
		var sl = 0.5*(ql-1.0/ql);
		var tl = 0.5*(ql+1.0/ql);
		var vl=Math.sin(this.bl*(dlon));
		var ul=(sl*Math.sin(this.gamma0)-vl*Math.cos(this.gamma0))/tl;
		if (Math.abs(Math.abs(ul)-1.0)<=Proj4js.common.EPSLN) {
			vs=Number.POSITIVE_INFINITY;
		} else {
			vs=0.5*this.al*Math.log((1.0-ul)/(1.0+ul))/this.bl;
		}
		if (Math.abs(Math.cos(this.bl*(dlon)))<=Proj4js.common.EPSLN) {
			us=this.al*this.bl*(dlon);
		} else {
			us=this.al*Math.atan2(sl*Math.cos(this.gamma0)+vl*Math.sin(this.gamma0),Math.cos(this.bl*dlon))/this.bl;
		}
	}
 
	if (this.no_rot){
		p.x=this.x0+us;
		p.y=this.y0+vs;
	} else {
		
		us-=this.uc;
		p.x=this.x0+vs*Math.cos(this.alpha)+us*Math.sin(this.alpha);
		p.y=this.y0+us*Math.cos(this.alpha)-vs*Math.sin(this.alpha);
	}
	return p;
	  return p;
  },

  inverse: function(p) {
	var us, vs;
	if (this.no_rot){
		vs=p.y-this.y0;
		us=p.x-this.x0;
	} else {
		vs=(p.x-this.x0)*Math.cos(this.alpha)-(p.y-this.y0)*Math.sin(this.alpha);
		us=(p.y-this.y0)*Math.cos(this.alpha)+(p.x-this.x0)*Math.sin(this.alpha);
		us+=this.uc;
	}
	var qp = Math.exp(-1.0*this.bl*vs/this.al);
	var sp=0.5*(qp-1.0/qp);
	var tp = 0.5*(qp+1.0/qp);
	var vp = Math.sin(this.bl*us/this.al);
	var up = (vp*Math.cos(this.gamma0)+sp*Math.sin(this.gamma0))/tp;
	var ts = Math.pow(this.el/Math.sqrt((1.0+up)/(1.0-up)),1.0/this.bl);
	if (Math.abs(up-1.0)<Proj4js.common.EPSLN){
		p.x=this.long0;
		p.y=Proj4js.common.HALF_PI;
	} else if (Math.abs(up+1.0)<Proj4js.common.EPSLN){
		p.x=this.long0;
		p.y=-1.0*Proj4js.common.HALF_PI;
	} else {
		p.y=Proj4js.common.phi2z(this.e, ts);
		p.x=Proj4js.common.adjust_lon(this.long0-Math.atan2(sp*Math.cos(this.gamma0)-vp*Math.sin(this.gamma0),Math.cos(this.bl*us/this.al))/this.bl);
	}
	return p;
  }
};
