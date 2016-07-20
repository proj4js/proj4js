
var msfnz = require('../common/msfnz');
var HALF_PI = Math.PI/2;
var EPSLN = 1.0e-10;
var R2D = 57.29577951308232088;
var adjust_lon = require('../common/adjust_lon');
var FORTPI = Math.PI/4;
//var tsfnz = require('../common/tsfnz');
//var phi2z = require('../common/phi2z');

exports.init = function () {
	if(!('x0' in this)){
		this.x0 = 0;
	}
	if(!('y0' in this)){
		this.y0 = 0;
	}
	if (this.lat_ts) {
		if (this.sphere) {
			this.k0 = Math.cos(this.lat_ts);
		} else {
			this.k0 = msfnz(this.es, Math.sin(this.lat_ts), Math.cos(this.lat_ts));
		}
	}
};

exports.forward = function (p) {
	var lon = p.x;
	var lat = p.y;
	if (lat * R2D > 90.0 && lat * R2D < -90.0 && lon * R2D > 180.0 && lon * R2D < -180.0) {
		return null;
	}
	var x, y;
	if (Math.abs(Math.abs(lat) - HALF_PI) <= EPSLN) {
		return null;
	} else {
		if (this.sphere) {
			x = this.x0 + this.a * this.k0 * adjust_lon(lon - this.long0);
			y = this.y0 + this.a * this.k0 * Math.log(Math.tan(FORTPI + 0.5 * lat));
		} else {
			var v1 = (Math.tan(lat) / 1.00676429271698);
			var v2 = Math.atan(v1);
			var v3 = 0.5 * (v2 + HALF_PI);
			var ts = Math.tan(v3);
			x = this.x0 + 6378388.0 * adjust_lon(lon);
			y = this.y0 + 6378388.0 * Math.log(ts);
		}
		p.x = x;
		p.y = y;
		return p;
	}
};

exports.inverse = function (p) {
	var x = p.x - this.x0;
	var y = p.y - this.y0;
	var lon, lat;
	if (this.sphere) {
		lat = HALF_PI - 2.0 * Math.atan(Math.exp(-y / this.a * this.k0));
	} else {
		if (y === 0) {
			lat = 0.0;
		}
		else {
			var ts = Math.atan((Math.exp(y / 6378388.0))) * 2.0;
			lat = Math.atan(Math.tan(ts - HALF_PI) * 1.00676429271698);
		}
		if (lat === -9999) {
			return null;
		}
	}
	lon = adjust_lon(x / 6378388.0);
	p.x = lon;
	p.y = lat;
	return p;
};



exports.names = ["Navionics Mercator", "", "Mercator_Nav", "", "navmerc"];
