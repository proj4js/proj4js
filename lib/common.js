exports.PI = 3.141592653589793238; //Math.PI;
exports.HALF_PI = 1.570796326794896619; //Math.PI*0.5;
exports.TWO_PI = 6.283185307179586477; //Math.PI*2;
exports.FORTPI = 0.78539816339744833;
exports.R2D = 57.29577951308232088;
exports.D2R = 0.01745329251994329577;
exports.SEC_TO_RAD = 4.84813681109535993589914102357e-6;
/* SEC_TO_RAD = Pi/180/3600 */
exports.EPSLN = 1.0e-10;
exports.MAX_ITER = 20;
// following constants from geocent.c
exports.COS_67P5 = 0.38268343236508977;
/* cosine of 67.5 degrees */
exports.AD_C = 1.0026000;
/* Toms region 1 constant */

/* datum_type values */
exports.PJD_UNKNOWN = 0;
exports.PJD_3PARAM = 1;
exports.PJD_7PARAM = 2;
exports.PJD_GRIDSHIFT = 3;
exports.PJD_WGS84 = 4; // WGS84 or equivalent
exports.PJD_NODATUM = 5; // WGS84 or equivalent
exports.SRS_WGS84_SEMIMAJOR = 6378137; // only used in grid shift transforms
exports.SRS_WGS84_ESQUARED = 0.006694379990141316; //DGR: 2012-07-29

// ellipoid pj_set_ell.c
exports.SIXTH = 0.1666666666666666667;
/* 1/6 */
exports.RA4 = 0.04722222222222222222;
/* 17/360 */
exports.RA6 = 0.02215608465608465608;
/* 67/3024 */
exports.RV4 = 0.06944444444444444444;
/* 5/72 */
exports.RV6 = 0.04243827160493827160;
/* 55/1296 */

// Function to compute the constant small m which is the radius of
//   a parallel of latitude; phi; divided by the semimajor axis.
// -----------------------------------------------------------------
exports.msfnz = require('./common/msfnz');

// Function to compute the constant small t for use in the forward
//   computations in the Lambert Conformal Conic and the Polar
//   Stereographic projections.
// -----------------------------------------------------------------
exports.tsfnz = require('./common/tsfnz');

// Function to compute the latitude angle; phi2; for the inverse of the
//   Lambert Conformal Conic and Polar Stereographic projections.
// ----------------------------------------------------------------
exports.phi2z = require('./common/phi2z');

/* Function to compute constant small q which is the radius of a 
   parallel of latitude, phi, divided by the semimajor axis. 
------------------------------------------------------------*/
exports.qsfnz = require('./common/qsfnz');

/* Function to compute the inverse of qsfnz
------------------------------------------------------------*/
exports.iqsfnz = require('./common/iqsfnz');

/* Function to eliminate roundoff errors in asin
----------------------------------------------*/
exports.asinz = require('./common/asinz');

// following functions from gctpc cproj.c for transverse mercator projections
exports.e0fn = require('./common/e0fn');
exports.e1fn = require('./common/e1fn');
exports.e2fn = require('./common/e2fn');
exports.e3fn = require('./common/e3fn');
exports.mlfn = require('./common/mlfn');
exports.imlfn = require('./common/imlfn');

exports.srat = require('./common/srat');

// Function to return the sign of an argument
exports.sign = require('./common/sign');

// Function to adjust longitude to -180 to 180; input in radians
exports.adjust_lon = require('./common/adjust_lon');

// IGNF - DGR : algorithms used by IGN France

// Function to adjust latitude to -90 to 90; input in radians
exports.adjust_lat = require('./common/adjust_lat');

// Latitude Isometrique - close to tsfnz ...
exports.latiso = require('./common/latiso');

exports.fL = require('./common/fL');

// Inverse Latitude Isometrique - close to ph2z
exports.invlatiso = require('./common/invlatiso');

// Needed for Gauss Schreiber
// Original:  Denis Makarov (info@binarythings.com)
// Web Site:  http://www.binarythings.com
exports.sinh = require('./common/sinh');

exports.cosh = require('./common/cosh');

exports.tanh = require('./common/tanh');

exports.asinh = require('./common/asinh');

exports.acosh = require('./common/acosh');

exports.atanh = require('./common/atanh');

// Grande Normale
exports.gN = require('./common/gN');

//code from the PROJ.4 pj_mlfn.c file;  this may be useful for other projections
exports.pj_enfn = require('./common/pj_enfn');

exports.pj_mlfn = require('./common/pj_mlfn');

exports.pj_inv_mlfn = require('./common/pj_inv_mlfn');
exports.nadInterBreakout = require('./common/nadInterBreakout');
/**
 * Determine correction values
 * source: nad_intr.c (DGR: 2012-07-29)
 */
exports.nad_intr = require('./common/nad_intr');

/**
 * Correct value
 * source: nad_cvt.c (DGR: 2012-07-29)
 */
exports.inverseNadCvt = require('./common/inverseNadCvt');
exports.nad_cvt = require('./common/nad_cvt');

/* meridinal distance for ellipsoid and inverse
 **    8th degree - accurate to < 1e-5 meters when used in conjuction
 **		with typical major axis values.
 **	Inverse determines phi to EPS (1e-11) radians, about 1e-6 seconds.
 */
exports.C00 = 1;
exports.C02 = 0.25;
exports.C04 = 0.046875;
exports.C06 = 0.01953125;
exports.C08 = 0.01068115234375;
exports.C22 = 0.75;
exports.C44 = 0.46875;
exports.C46 = 0.01302083333333333333;
exports.C48 = 0.00712076822916666666;
exports.C66 = 0.36458333333333333333;
exports.C68 = 0.00569661458333333333;
exports.C88 = 0.3076171875;
