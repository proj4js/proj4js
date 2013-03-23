Proj4js.Proj.aeqd = {

  init : function() {
    this.sin_p12=Math.sin(this.lat0);
    this.cos_p12=Math.cos(this.lat0);
  },

  forward: function(p) {
    var lon=p.x;
    var lat=p.y;
    var sinphi=Math.sin(p.y);
    var cosphi=Math.cos(p.y); 
    var dlon = Proj4js.common.adjust_lon(lon - this.long0);
    
    if (this.sphere){
	if (Math.abs(this.sin_p12-1.0)<=Proj4js.common.EPSLN){
		//North Pole case
		p.x=this.x0 + this.a * (Proj4js.common.HALF_PI-lat) *  Math.sin(dlon);
		p.y=this.y0 - this.a * (Proj4js.common.HALF_PI-lat) *  Math.cos(dlon);
		return p;
	} else if (Math.abs(this.sin_p12+1.0)<=Proj4js.common.EPSLN){
		//South Pole case
		p.x=this.x0 + this.a * (Proj4js.common.HALF_PI+lat) *  Math.sin(dlon);
		p.y=this.y0 + this.a * (Proj4js.common.HALF_PI+lat) *  Math.cos(dlon);
		return p;
	} else {
		//default case
		var cos_c=this.sin_p12*sinphi+this.cos_p12*cosphi*Math.cos(dlon);
		var c = Math.acos(cos_c);
		var kp = c/Math.sin(c);
		p.x=this.x0 + this.a*kp*cosphi*Math.sin(dlon);
		p.y=this.y0 + this.a*kp*(this.cos_p12*sinphi-this.sin_p12*cosphi*Math.cos(dlon));
		return p;
	}
    } else {
	var e0 = Proj4js.common.e0fn(this.es);
	var e1 = Proj4js.common.e1fn(this.es);
	var e2 = Proj4js.common.e2fn(this.es);
	var e3 = Proj4js.common.e3fn(this.es);
	if (Math.abs(this.sin_p12-1.0)<=Proj4js.common.EPSLN){
		//North Pole case
		var Mlp = this.a*Proj4js.common.mlfn(e0,e1,e2,e3,Proj4js.common.HALF_PI);
		var Ml = this.a*Proj4js.common.mlfn(e0,e1,e2,e3,lat);
		p.x = this.x0 + (Mlp-Ml)*Math.sin(dlon);
		p.y = this.y0 - (Mlp-Ml)*Math.cos(dlon);
		return p;
	} else if (Math.abs(this.sin_p12+1.0)<=Proj4js.common.EPSLN){
		//South Pole case
		var Mlp = this.a*Proj4js.common.mlfn(e0,e1,e2,e3,Proj4js.common.HALF_PI);
		var Ml = this.a*Proj4js.common.mlfn(e0,e1,e2,e3,lat);
		p.x = this.x0 + (Mlp+Ml)*Math.sin(dlon);
		p.y = this.y0 + (Mlp+Ml)*Math.cos(dlon);
		return p;
	} else {
		//Default case
		var tanphi=sinphi/cosphi;
		var Nl1 = Proj4js.common.gN(this.a,this.e, this.sin_p12);
		var Nl = Proj4js.common.gN(this.a, this.e, sinphi);
		var psi = Math.atan((1.0-this.es)*tanphi+this.es*Nl1*this.sin_p12/(Nl*cosphi));
		var Az = Math.atan2(Math.sin(dlon),this.cos_p12*Math.tan(psi)-this.sin_p12*Math.cos(dlon));
		var s;
		if (Az==0) {
			s=Math.asin(this.cos_p12*Math.sin(psi)-this.sin_p12*Math.cos(psi));
		} else if (Math.abs(Math.abs(Az)-Proj4js.common.PI)<=Proj4js.common.EPSLN){
			s=-Math.asin(this.cos_p12*Math.sin(psi)-this.sin_p12*Math.cos(psi));
		} else {
			s=Math.asin(Math.sin(dlon)*Math.cos(psi)/Math.sin(Az));
		}
		var G = this.e*this.sin_p12/Math.sqrt(1.0-this.es);
		var H = this.e*this.cos_p12*Math.cos(Az)/Math.sqrt(1.0-this.es);
		var Hs = H*H;
		var c = Nl1*s*(1.0-s*s*Hs*(1.0-Hs)/6.0+s*s*s/8.0*G*H*(1.0-2.0*Hs)+s*s*s*s/120.0*(Hs*(4.0-7.0*Hs)-3.0*G*G*(1.0-7.0*Hs))-s*s*s*s*s/48.0*G*H);
		p.x=this.x0+c*Math.sin(Az);
		p.y=this.y0+c*Math.cos(Az);
		return p;
	}
    }
    
   
  },

  inverse: function(p){
    p.x -= this.x0;
    p.y -= this.y0;
	if (this.sphere){
		var rh = Math.sqrt(p.x * p.x + p.y *p.y);
		if (rh > (2.0 * Proj4js.common.HALF_PI * this.a)) {
			Proj4js.reportError("aeqdInvDataError");
			return;
		}
		var z = rh / this.a;

		var sinz=Math.sin(z);
		var cosz=Math.cos(z);
	
		var lon = this.long0;
		var lat;
		if (Math.abs(rh) <= Proj4js.common.EPSLN) {
			lat = this.lat0;
		} else {
			lat = Proj4js.common.asinz(cosz * this.sin_p12 + (p.y * sinz * this.cos_p12) / rh);
			var con = Math.abs(this.lat0) - Proj4js.common.HALF_PI;
			if (Math.abs(con) <= Proj4js.common.EPSLN) {
				if (this.lat0 >= 0.0) {
					lon = Proj4js.common.adjust_lon(this.long0 + Math.atan2(p.x , -p.y));
				} else {
					lon = Proj4js.common.adjust_lon(this.long0 - Math.atan2(-p.x , p.y));
				}
			} else {
				/*con = cosz - this.sin_p12 * Math.sin(lat);
				if ((Math.abs(con) < Proj4js.common.EPSLN) && (Math.abs(p.x) < Proj4js.common.EPSLN)) {
					//no-op, just keep the lon value as is
				} else {
					var temp = Math.atan2((p.x * sinz * this.cos_p12), (con * rh));
					lon = Proj4js.common.adjust_lon(this.long0 + Math.atan2((p.x * sinz * this.cos_p12), (con * rh)));
				}*/
				lon=Proj4js.common.adjust_lon(this.long0+Math.atan2(p.x*sinz,rh*this.cos_p12*cosz-p.y*this.sin_p12*sinz));
			}
		}

		p.x = lon;
		p.y = lat;
		return p;
	}
	else {
		var e0 = Proj4js.common.e0fn(this.es);
		var e1 = Proj4js.common.e1fn(this.es);
		var e2 = Proj4js.common.e2fn(this.es);
		var e3 = Proj4js.common.e3fn(this.es);
		if (Math.abs(this.sin_p12-1.0)<=Proj4js.common.EPSLN){
			//North pole case
			var Mlp = this.a*Proj4js.common.mlfn(e0,e1,e2,e3,Proj4js.common.HALF_PI);
			var rh = Math.sqrt(p.x*p.x+p.y*p.y);
			var M = Mlp-rh;
			var lat = Proj4js.common.imlfn(M/this.a,e0, e1,e2,e3);
			var lon = Proj4js.common.adjust_lon(this.long0+Math.atan2(p.x,-1.0*p.y));
			p.x=lon,
			p.y=lat;
			return p;
		} else if (Math.abs(this.sin_p12+1.0)<=Proj4js.common.EPSLN){
			//South pole case
			var Mlp = this.a*Proj4js.common.mlfn(e0,e1,e2,e3,Proj4js.common.HALF_PI);
			var rh = Math.sqrt(p.x*p.x+p.y*p.y);
			var M = rh-Mlp;
			
			var lat = Proj4js.common.imlfn(M/this.a,e0, e1,e2,e3);
			var lon = Proj4js.common.adjust_lon(this.long0+Math.atan2(p.x,p.y));
			p.x=lon,
			p.y=lat;
			return p;
		} else {
			//default case
			var rh = Math.sqrt(p.x*p.x+p.y*p.y);
			var Az = Math.atan2(p.x,p.y);
			var N1 = Proj4js.common.gN(this.a, this.e, this.sin_p12);
			var cosAz = Math.cos(Az);
			var tmp = this.e*this.cos_p12*cosAz;
			var A = -tmp*tmp/(1.0 - this.es);
			var B=3.0*this.es*(1.0-A) * this.sin_p12*this.cos_p12*cosAz/(1.0-this.es);
			var D = rh/N1;
			var Ee = D-A*(1.0+A)*Math.pow(D,3.0)/6.0-B*(1+3.0*A)*Math.pow(D,4.0)/24.0;
			var F = 1.0-A*Ee*Ee/2.0-D*Ee*Ee*Ee/6.0;
			var psi = Math.asin(this.sin_p12*Math.cos(Ee)+this.cos_p12*Math.sin(Ee)*cosAz);
			var lon = Proj4js.common.adjust_lon(this.long0+Math.asin(Math.sin(Az)*Math.sin(Ee)/Math.cos(psi)));
			var lat = Math.atan((1.0-this.es*F*this.sin_p12/Math.sin(psi))*Math.tan(psi)/(1.0-this.es));
			p.x=lon;
			p.y=lat;
			return p;
		}
	}
    
  } 
};
