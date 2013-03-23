
// Initialize the Stereographic projection

Proj4js.Proj.stere = {
  ssfn_: function(phit, sinphi, eccen) {
  	sinphi *= eccen;
  	return (Math.tan (.5 * (Proj4js.common.HALF_PI + phit)) * Math.pow((1. - sinphi) / (1. + sinphi), .5 * eccen));
  },
 
  init: function() {
  	this.coslat0=Math.cos(this.lat0);
	this.sinlat0=Math.sin(this.lat0);
	if (this.sphere){
		if (this.k0==1.0 && !isNaN(this.lat_ts) && Math.abs(this.coslat0)<=Proj4js.common.EPSLN){
			this.k0=0.5*(1.0+Proj4js.common.sign(this.lat0)*Math.sin(this.lat_ts));
		}
	}
	else {
		if (Math.abs(this.coslat0)<=Proj4js.common.EPSLN) {
			if (this.lat0>0){
				//North pole
				//trace('stere:north pole');
				this.con=1.0;
			} else {
				//South pole
				//trace('stere:south pole');
				this.con=-1.0;
			}
		}
		this.cons=Math.sqrt(Math.pow(1+this.e,1+this.e)*Math.pow(1-this.e,1-this.e));
		if (this.k0==1.0 && !isNaN(this.lat_ts) && Math.abs(this.coslat0)<=Proj4js.common.EPSLN){
			this.k0=0.5*this.cons*Proj4js.common.msfnz(this.e, Math.sin(this.lat_ts), Math.cos(this.lat_ts))/Proj4js.common.tsfnz(this.e, this.con*this.lat_ts, this.con*Math.sin(this.lat_ts));
		}
		this.ms1 = Proj4js.common.msfnz(this.e,this.sinlat0, this.coslat0);
		this.X0 = 2.0*Math.atan(this.ssfn_(this.lat0,this.sinlat0, this.e))-Proj4js.common.HALF_PI;
		this.cosX0=Math.cos(this.X0);
		this.sinX0=Math.sin(this.X0);
	}
  }, 

// Stereographic forward equations--mapping lat,long to x,y
  forward: function(p) {
	var lon=p.x;
	var lat=p.y;
	var sinlat = Math.sin(lat);
	var coslat = Math.cos(lat);
	var x, y, A, X,sinX,cosX;
	var dlon = Proj4js.common.adjust_lon(lon-this.long0);

	if (Math.abs(Math.abs(lon-this.long0)-Proj4js.common.PI)<=Proj4js.common.EPSLN && Math.abs(lat+this.lat0)<=Proj4js.common.EPSLN){
		//case of the origine point
		//trace('stere:this is the origin point');
		p.x=NaN;
		p.y=NaN;
		return p;
	}
	
	if (this.sphere){
		//trace('stere:sphere case');
		A=2*this.k0/(1.0+this.sinlat0*sinlat+this.coslat0*coslat*Math.cos(dlon));
		p.x=this.a*A*coslat*Math.sin(dlon)+this.x0;
		p.y=this.a*A*(this.coslat0*sinlat-this.sinlat0*coslat*Math.cos(dlon))+this.y0;
		return p;
	} else {
		X = 2.0*Math.atan(this.ssfn_(lat,sinlat, this.e))-Proj4js.common.HALF_PI;
		cosX=Math.cos(X);
		sinX=Math.sin(X);
		if (Math.abs(this.coslat0)<=Proj4js.common.EPSLN) {
			var ts = Proj4js.common.tsfnz(this.e, lat*this.con, this.con*sinlat);
			var rh=2.0*this.a*this.k0*ts/this.cons;

			p.x=this.x0+rh*Math.sin(lon-this.long0);
			p.y=this.y0-this.con*rh*Math.cos(lon-this.long0);
			//trace(p.toString());
			return p;
		} else if (Math.abs(this.sinlat0)<Proj4js.common.EPSLN) { 
			//Eq
			//trace('stere:equateur');
			A=2.0*this.a*this.k0/(1.0+cosX*Math.cos(dlon));
			p.y=A*sinX;
		}else {
			//other case
			//trace('stere:normal case');
			A = 2.0*this.a*this.k0*this.ms1/(this.cosX0*(1.0+this.sinX0*sinX+this.cosX0*cosX*Math.cos(dlon)));
			p.y=A*(this.cosX0*sinX-this.sinX0*cosX*Math.cos(dlon))+this.y0;
		}
		p.x=A*cosX*Math.sin(dlon)+this.x0;
		
	}
	
	//trace(p.toString());
	return p;
  },


//* Stereographic inverse equations--mapping x,y to lat/long
  inverse: function(p) {
	p.x-=this.x0;
	p.y-=this.y0;
	var lon, lat;
	var rh = Math.sqrt(p.x*p.x + p.y*p.y);
	if (this.sphere){
		var c=2*Math.atan(rh/(0.5*this.a*this.k0));
		lon=this.long0;
		lat=this.lat0;
		if (rh<=Proj4js.common.EPSLN){
			p.x=lon;
			p.y=lat;
			return p;
		}
		lat=Math.asin(Math.cos(c)*this.sinlat0+p.y*Math.sin(c)*this.coslat0/rh);
		if (Math.abs(this.coslat0)<Proj4js.common.EPSLN){
			if (this.lat0>0.0){
				lon=Proj4js.common.adjust_lon(this.long0+Math.atan2(p.x,-1.0*p.y));
			} else {
				lon=Proj4js.common.adjust_lon(this.long0+Math.atan2(p.x,p.y));
			}
		} else {
			lon=Proj4js.common.adjust_lon(this.long0+Math.atan2(p.x*Math.sin(c),rh*this.coslat0*Math.cos(c)-p.y*this.sinlat0*Math.sin(c)));
		}
		p.x=lon;
		p.y=lat;
		return p;
				
	} else {
		if (Math.abs(this.coslat0)<=Proj4js.common.EPSLN){
			if (rh<=Proj4js.common.EPSLN){
				lat=this.lat0;
				lon=this.long0;
				p.x=lon;
				p.y=lat;
				
				//trace(p.toString());
				return p;
			}
			p.x*=this.con;
			p.y*=this.con;

			var ts = rh*this.cons/(2.0*this.a*this.k0);
			lat=this.con*Proj4js.common.phi2z(this.e,ts);
			lon=this.con*Proj4js.common.adjust_lon(this.con*this.long0+Math.atan2(p.x,-1.0*p.y));
		} else {
			var ce = 2.0*Math.atan(rh*this.cosX0/(2.0*this.a*this.k0*this.ms1));
			lon=this.long0;
			var Chi;
			if (rh<=Proj4js.common.EPSLN){
				Chi=this.X0;
			} else {
				Chi=Math.asin(Math.cos(ce)*this.sinX0+p.y*Math.sin(ce)*this.cosX0/rh);
				lon=Proj4js.common.adjust_lon(this.long0+Math.atan2(p.x*Math.sin(ce),rh*this.cosX0*Math.cos(ce)-p.y*this.sinX0*Math.sin(ce)));
			}
			lat=-1.0*Proj4js.common.phi2z(this.e,Math.tan(0.5*(Proj4js.common.HALF_PI+Chi)));
			
		}
	}
	
			
	p.x=lon;
	p.y=lat;
		
	//trace(p.toString());
	return p;
    
  }
}; 
