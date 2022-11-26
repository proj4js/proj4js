'use strict';
import {PJD_3PARAM, PJD_7PARAM, HALF_PI} from './constants/values';
export function compareDatums(source, dest) {
  if (source.datum_type !== dest.datum_type) {
    return false; // false, datums are not equal
  } else if (source.a !== dest.a || Math.abs(source.es - dest.es) > 0.000000000050) {
    // the tolerance for es is to ensure that GRS80 and WGS84
    // are considered identical
    return false;
  } else if (source.datum_type === PJD_3PARAM) {
    return (source.datum_params[0] === dest.datum_params[0] && source.datum_params[1] === dest.datum_params[1] && source.datum_params[2] === dest.datum_params[2]);
  } else if (source.datum_type === PJD_7PARAM) {
    return (source.datum_params[0] === dest.datum_params[0] && source.datum_params[1] === dest.datum_params[1] && source.datum_params[2] === dest.datum_params[2] && source.datum_params[3] === dest.datum_params[3] && source.datum_params[4] === dest.datum_params[4] && source.datum_params[5] === dest.datum_params[5] && source.datum_params[6] === dest.datum_params[6]);
  } else {
    return true; // datums are equal
  }
} // cs_compare_datums()

/*
 * The function Convert_Geodetic_To_Geocentric converts geodetic coordinates
 * (latitude, longitude, and height) to geocentric coordinates (X, Y, Z),
 * according to the current ellipsoid parameters.
 *
 *    Latitude  : Geodetic latitude in radians                     (input)
 *    Longitude : Geodetic longitude in radians                    (input)
 *    Height    : Geodetic height, in meters                       (input)
 *    X         : Calculated Geocentric X coordinate, in meters    (output)
 *    Y         : Calculated Geocentric Y coordinate, in meters    (output)
 *    Z         : Calculated Geocentric Z coordinate, in meters    (output)
 *
 */
export function geodeticToGeocentric(p, es, a) {
  var Longitude = p.x;
  var Latitude = p.y;
  var Height = p.z ? p.z : 0; //Z value not always supplied

  var Rn; /*  Earth radius at location  */
  var Sin_Lat; /*  Math.sin(Latitude)  */
  var Sin2_Lat; /*  Square of Math.sin(Latitude)  */
  var Cos_Lat; /*  Math.cos(Latitude)  */

  /*
   ** Don't blow up if Latitude is just a little out of the value
   ** range as it may just be a rounding issue.  Also removed longitude
   ** test, it should be wrapped by Math.cos() and Math.sin().  NFW for PROJ.4, Sep/2001.
   */
  if (Latitude < -HALF_PI && Latitude > -1.001 * HALF_PI) {
    Latitude = -HALF_PI;
  } else if (Latitude > HALF_PI && Latitude < 1.001 * HALF_PI) {
    Latitude = HALF_PI;
  } else if (Latitude < -HALF_PI) {
    /* Latitude out of range */
    //..reportError('geocent:lat out of range:' + Latitude);
    return { x: -Infinity, y: -Infinity, z: p.z };
  } else if (Latitude > HALF_PI) {
    /* Latitude out of range */
    return { x: Infinity, y: Infinity, z: p.z };
  }

  if (Longitude > Math.PI) {
    Longitude -= (2 * Math.PI);
  }
  Sin_Lat = Math.sin(Latitude);
  Cos_Lat = Math.cos(Latitude);
  Sin2_Lat = Sin_Lat * Sin_Lat;
  Rn = a / (Math.sqrt(1.0e0 - es * Sin2_Lat));
  return {
    x: (Rn + Height) * Cos_Lat * Math.cos(Longitude),
    y: (Rn + Height) * Cos_Lat * Math.sin(Longitude),
    z: ((Rn * (1 - es)) + Height) * Sin_Lat
  };
} // cs_geodetic_to_geocentric()

export function geocentricToGeodetic(p, es, a, b) {
  /* local defintions and variables */
  /* end-criterium of loop, accuracy of sin(Latitude) */
  var genau = 1e-12;
  var genau2 = (genau * genau);
  var maxiter = 30;

  var P; /* distance between semi-minor axis and location */
  var RR; /* distance between center and location */
  var CT; /* sin of geocentric latitude */
  var ST; /* cos of geocentric latitude */
  var RX;
  var RK;
  var RN; /* Earth radius at location */
  var CPHI0; /* cos of start or old geodetic latitude in iterations */
  var SPHI0; /* sin of start or old geodetic latitude in iterations */
  var CPHI; /* cos of searched geodetic latitude */
  var SPHI; /* sin of searched geodetic latitude */
  var SDPHI; /* end-criterium: addition-theorem of sin(Latitude(iter)-Latitude(iter-1)) */
  var iter; /* # of continous iteration, max. 30 is always enough (s.a.) */

  var X = p.x;
  var Y = p.y;
  var Z = p.z ? p.z : 0.0; //Z value not always supplied
  var Longitude;
  var Latitude;
  var Height;

  P = Math.sqrt(X * X + Y * Y);
  RR = Math.sqrt(X * X + Y * Y + Z * Z);

  /*      special cases for latitude and longitude */
  if (P / a < genau) {

    /*  special case, if P=0. (X=0., Y=0.) */
    Longitude = 0.0;

    /*  if (X,Y,Z)=(0.,0.,0.) then Height becomes semi-minor axis
     *  of ellipsoid (=center of mass), Latitude becomes PI/2 */
    if (RR / a < genau) {
      Latitude = HALF_PI;
      Height = -b;
      return {
        x: p.x,
        y: p.y,
        z: p.z
      };
    }
  } else {
    /*  ellipsoidal (geodetic) longitude
     *  interval: -PI < Longitude <= +PI */
    Longitude = Math.atan2(Y, X);
  }

  /* --------------------------------------------------------------
   * Following iterative algorithm was developped by
   * "Institut for Erdmessung", University of Hannover, July 1988.
   * Internet: www.ife.uni-hannover.de
   * Iterative computation of CPHI,SPHI and Height.
   * Iteration of CPHI and SPHI to 10**-12 radian resp.
   * 2*10**-7 arcsec.
   * --------------------------------------------------------------
   */
  CT = Z / RR;
  ST = P / RR;
  RX = 1.0 / Math.sqrt(1.0 - es * (2.0 - es) * ST * ST);
  CPHI0 = ST * (1.0 - es) * RX;
  SPHI0 = CT * RX;
  iter = 0;

  /* loop to find sin(Latitude) resp. Latitude
   * until |sin(Latitude(iter)-Latitude(iter-1))| < genau */
  do {
    iter++;
    RN = a / Math.sqrt(1.0 - es * SPHI0 * SPHI0);

    /*  ellipsoidal (geodetic) height */
    Height = P * CPHI0 + Z * SPHI0 - RN * (1.0 - es * SPHI0 * SPHI0);

    RK = es * RN / (RN + Height);
    RX = 1.0 / Math.sqrt(1.0 - RK * (2.0 - RK) * ST * ST);
    CPHI = ST * (1.0 - RK) * RX;
    SPHI = CT * RX;
    SDPHI = SPHI * CPHI0 - CPHI * SPHI0;
    CPHI0 = CPHI;
    SPHI0 = SPHI;
  }
  while (SDPHI * SDPHI > genau2 && iter < maxiter);

  /*      ellipsoidal (geodetic) latitude */
  Latitude = Math.atan(SPHI / Math.abs(CPHI));
  return {
    x: Longitude,
    y: Latitude,
    z: Height
  };
} // cs_geocentric_to_geodetic()

/****************************************************************/

export function TransformGeocentric(FromWGS84, p, datum_type, datum_params) {
  // FromWGS84 = 1 if to WGS FromWGS84 = -1
  if (datum_type === PJD_3PARAM) {
    return {
      x: p.x - FromWGS84 * datum_params[0],
      y: p.y - FromWGS84 * datum_params[1],
      z: p.z - FromWGS84 * datum_params[2],
    };
  } else if (datum_type === PJD_7PARAM) {
    var M = datum_params[6];
    if ( FromWGS84 > 0 ) M = 1.0 / M;
      return {
        x: ((M * (p.x - FromWGS84 * datum_params[5] * p.y + FromWGS84 * datum_params[4] * p.z)) - FromWGS84 * datum_params[0]),
        y: ((M * (FromWGS84 * datum_params[5] * p.x + p.y - FromWGS84 * datum_params[3] * p.z)) - FromWGS84 * datum_params[1]),
        z: ((M * (-FromWGS84 * datum_params[4] * p.x + FromWGS84 * datum_params[3] * p.y + p.z)) - FromWGS84 * datum_params[2])
      };
    }
  }
