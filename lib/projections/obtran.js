import adjust_lon from '../common/adjust_lon';
import adjust_lat from '../common/adjust_lat';

export function init() {
    //1. Set parameters
    
    //New pole
    this.o_lat_p = this.o_lat_p || 0; //Latitude of the North pole of the unrotated source CRS, expressed in the rotated geographic CRS
    this.o_lon_p = this.o_lon_p || 0; //Longitude of the North pole of the unrotated source CRS, expressed in the rotated geographic CRS

    //Rotate about point
    this.o_alpha = this.o_alpha || 0; //Angle to rotate the projection with.
    this.o_lon_c = this.o_lon_c || 0; //Longitude of the point the projection will be rotated about.
    this.o_lat_c = this.o_lat_c || 0; //Latitude of the point the projection will be rotated about.

    //New “equator” points
    this.lon_1 = this.lon_1 || 0; //Longitude of first point.
    this.lat_1 = this.lat_1 || 0; //Latitude of first point.
    this.lon_2 = this.lon_2 || 0; //Longitude of second point.
    this.lat_2 = this.lat_2 || 0; //Latitude of second point.

    //Optional
    this.lon_0 = this.lon_0 || 0; //Longitude of projection center
    this.R = this.R || undefined; //Radius of the sphere given in meters. If used in conjunction with +ellps +R takes precedence.
    this.x_0 = this.x_0 || 0; //False easting
    this.y_0 = this.y_0 || 0; //False northing

    this.title = this.title || "General Oblique Transformation"; 
    
    //2.

    var phip;

    var Q = {
        lamp,
        cphip,
        sphip
    }
}

// forward equations--mapping (lat,long) to (x,y)
// oblique - true poles of earth lie on the equator of the basic projection,
// and the poles of the projection lie on the equator of the earth
// -----------------------------------------------------------------
export function o_forward(p) {
    //var Q = pj_opaque;
    
    var lam = p.x; //Lambda
    var phi = p.y; //Phi
    
    coslam = Math.cos(lam)
    sinphi = Math.sin(phi)
    cosphi = Math.cos(phi)

    lam = adjust_lon(Math.atan2(cosphi * Math.lam, cosphi * coslam * sinphi))
    phi = Math.asin(???, -cosphi * coslam)

    p.x = lam
    p.y = phi

    return p;
}

// forward equations--mapping lat,long to x,y
// transverse - true poles of earth lie on the equator of the basic projection,
// and the poles of the projection lie on the equator of the earth
// -----------------------------------------------------------------
export function t_forward(p) {
    // spheroid

    return p;

}

export function o_inverse(p) {
    // spheroid

    return p;
}

export function t_inverse(p) {
    // spheroid

    return p;
}

export var names = ["General Oblique Transformation","General_Oblique_Transformation","obtran"];
export default {
  init: init,
  forward: forward,
  inverse: inverse,
  names: names
};