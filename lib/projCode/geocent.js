/*
Author:       Richard Greenwood rich@greenwoodmap.com
License:      LGPL as per: http://www.gnu.org/copyleft/lesser.html
*/

/**
 * convert between geodetic coordinates (longitude, latitude, height)
 * and gecentric coordinates (X, Y, Z)
 * ported from Proj 4.9.9 geocent.c
*/


// following constants #define'd in geocent.h
// var GEOCENT_NO_ERROR  = 0x0000;
var GEOCENT_LAT_ERROR = 0x0001;
// var GEOCENT_LON_ERROR = 0x0002;
// var cs.a_ERROR        = 0x0004;
// var cs.b_ERROR        = 0x0008;
// var cs.a_LESS_B_ERROR = 0x0010;

// following constants from geocent.c
var COS_67P5  = 0.38268343236508977;  /* cosine of 67.5 degrees */
var AD_C      = 1.0026000;            /* Toms region 1 constant */

function cs_geodetic_to_geocentric (cs, p) {

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

  var Longitude = p.x;
  var Latitude = p.y;
  var Height = p.z;
  var X;  // output
  var Y;
  var Z;

  var Error_Code=0;  //  GEOCENT_NO_ERROR;
  var Rn;            /*  Earth radius at location  */
  var Sin_Lat;       /*  Math.sin(Latitude)  */
  var Sin2_Lat;      /*  Square of Math.sin(Latitude)  */
  var Cos_Lat;       /*  Math.cos(Latitude)  */

  /*
  ** Don't blow up if Latitude is just a little out of the value
  ** range as it may just be a rounding issue.  Also removed longitude
  ** test, it should be wrapped by Math.cos() and Math.sin().  NFW for PROJ.4, Sep/2001.
  */
  if( Latitude < -HALF_PI && Latitude > -1.001 * HALF_PI )
      Latitude = -HALF_PI;
  else if( Latitude > HALF_PI && Latitude < 1.001 * HALF_PI )
      Latitude = HALF_PI;
  else if ((Latitude < -HALF_PI) || (Latitude > HALF_PI))
  { /* Latitude out of range */
    Error_Code |= GEOCENT_LAT_ERROR;
  }

  if (!Error_Code)
  { /* no errors */
    if (Longitude > PI)
      Longitude -= (2*PI);
    Sin_Lat = Math.sin(Latitude);
    Cos_Lat = Math.cos(Latitude);
    Sin2_Lat = Sin_Lat * Sin_Lat;
    Rn = cs.a / (Math.sqrt(1.0e0 - cs.es * Sin2_Lat));
    X = (Rn + Height) * Cos_Lat * Math.cos(Longitude);
    Y = (Rn + Height) * Cos_Lat * Math.sin(Longitude);
    Z = ((Rn * (1 - cs.es)) + Height) * Sin_Lat;

  }

  p.x = X;
  p.y = Y;
  p.z = Z;
  return Error_Code;
} // cs_geodetic_to_geocentric()


/** Convert_Geocentric_To_Geodetic
 * The method used here is derived from 'An Improved Algorithm for
 * Geocentric to Geodetic Coordinate Conversion', by Ralph Toms, Feb 1996
 */

function cs_geocentric_to_geodetic (cs, p) {

  var X =p.x;
  var Y = p.y;
  var Z = p.z;
  var Longitude;
  var Latitude;
  var Height;

  var W;        /* distance from Z axis */
  var W2;       /* square of distance from Z axis */
  var T0;       /* initial estimate of vertical component */
  var T1;       /* corrected estimate of vertical component */
  var S0;       /* initial estimate of horizontal component */
  var S1;       /* corrected estimate of horizontal component */
  var Sin_B0;   /* Math.sin(B0), B0 is estimate of Bowring aux variable */
  var Sin3_B0;  /* cube of Math.sin(B0) */
  var Cos_B0;   /* Math.cos(B0) */
  var Sin_p1;   /* Math.sin(phi1), phi1 is estimated latitude */
  var Cos_p1;   /* Math.cos(phi1) */
  var Rn;       /* Earth radius at location */
  var Sum;      /* numerator of Math.cos(phi1) */
  var At_Pole;  /* indicates location is in polar region */

  X = parseFloat(X);  // cast from string to float
  Y = parseFloat(Y);
  Z = parseFloat(Z);

  At_Pole = false;
  if (X != 0.0)
  {
      Longitude = Math.atan2(Y,X);
  }
  else
  {
      if (Y > 0)
      {
          Longitude = HALF_PI;
      }
      else if (Y < 0)
      {
          Longitude = -HALF_PI;
      }
      else
      {
          At_Pole = true;
          Longitude = 0.0;
          if (Z > 0.0)
          {  /* north pole */
              Latitude = HALF_PI;
          }
          else if (Z < 0.0)
          {  /* south pole */
              Latitude = -HALF_PI;
          }
          else
          {  /* center of earth */
              Latitude = HALF_PI;
              Height = -cs.b;
              return;
          }
      }
  }
  W2 = X*X + Y*Y;
  W = Math.sqrt(W2);
  T0 = Z * AD_C;
  S0 = Math.sqrt(T0 * T0 + W2);
  Sin_B0 = T0 / S0;
  Cos_B0 = W / S0;
  Sin3_B0 = Sin_B0 * Sin_B0 * Sin_B0;
  T1 = Z + cs.b * cs.ep2 * Sin3_B0;
  Sum = W - cs.a * cs.es * Cos_B0 * Cos_B0 * Cos_B0;
  S1 = Math.sqrt(T1*T1 + Sum * Sum);
  Sin_p1 = T1 / S1;
  Cos_p1 = Sum / S1;
  Rn = cs.a / Math.sqrt(1.0 - cs.es * Sin_p1 * Sin_p1);
  if (Cos_p1 >= COS_67P5)
  {
      Height = W / Cos_p1 - Rn;
  }
  else if (Cos_p1 <= -COS_67P5)
  {
      Height = W / -Cos_p1 - Rn;
  }
  else
  {
      Height = Z / Sin_p1 + Rn * (cs.es - 1.0);
  }
  if (At_Pole == false)
  {
      Latitude = Math.atan(Sin_p1 / Cos_p1);
  }

  p.x = Longitude;
  p.y =Latitude;
  p.z = Height;
  return 0;
} // cs_geocentric_to_geodetic()



/****************************************************************/
// pj_geocentic_to_wgs84(defn, p )
//    defn = coordinate system definition,
//  p = point to transform in geocentric coordinates (x,y,z)
function cs_geocentric_to_wgs84( defn, p ) {

  if( defn.datum_type == PJD_3PARAM )
  {
    // if( x[io] == HUGE_VAL )
    //    continue;
    p.x += defn.datum_params[0];
    p.y += defn.datum_params[1];
    p.z += defn.datum_params[2];

  }
  else  // if( defn.datum_type == PJD_7PARAM )
  {
    var Dx_BF =defn.datum_params[0];
    var Dy_BF =defn.datum_params[1];
    var Dz_BF =defn.datum_params[2];
    var Rx_BF =defn.datum_params[3];
    var Ry_BF =defn.datum_params[4];
    var Rz_BF =defn.datum_params[5];
    var M_BF  =defn.datum_params[6];
    // if( x[io] == HUGE_VAL )
    //    continue;
    var x_out = M_BF*(       p.x - Rz_BF*p.y + Ry_BF*p.z) + Dx_BF;
    var y_out = M_BF*( Rz_BF*p.x +       p.y - Rx_BF*p.z) + Dy_BF;
    var z_out = M_BF*(-Ry_BF*p.x + Rx_BF*p.y +       p.z) + Dz_BF;
    p.x = x_out;
    p.y = y_out;
    p.z = z_out;
  }
} // cs_geocentric_to_wgs84

/****************************************************************/
// pj_geocentic_from_wgs84()
//  coordinate system definition,
//  point to transform in geocentric coordinates (x,y,z)
function cs_geocentric_from_wgs84( defn, p ) {

  if( defn.datum_type == PJD_3PARAM )
  {
    //if( x[io] == HUGE_VAL )
    //    continue;
    p.x -= defn.datum_params[0];
    p.y -= defn.datum_params[1];
    p.z -= defn.datum_params[2];

  }
  else // if( defn.datum_type == PJD_7PARAM )
  {
    var Dx_BF =defn.datum_params[0];
    var Dy_BF =defn.datum_params[1];
    var Dz_BF =defn.datum_params[2];
    var Rx_BF =defn.datum_params[3];
    var Ry_BF =defn.datum_params[4];
    var Rz_BF =defn.datum_params[5];
    var M_BF  =defn.datum_params[6];
    var x_tmp = (p.x - Dx_BF) / M_BF;
    var y_tmp = (p.y - Dy_BF) / M_BF;
    var z_tmp = (p.z - Dz_BF) / M_BF;
    //if( x[io] == HUGE_VAL )
    //    continue;

    p.x =        x_tmp + Rz_BF*y_tmp - Ry_BF*z_tmp;
    p.y = -Rz_BF*x_tmp +       y_tmp + Rx_BF*z_tmp;
    p.z =  Ry_BF*x_tmp - Rx_BF*y_tmp +       z_tmp;
  }
} //cs_geocentric_from_wgs84()