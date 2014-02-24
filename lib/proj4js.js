goog.provide("Proj4js");
goog.provide('Proj4js.defs');

goog.require("Proj4js.Datum");
goog.require("Proj4js.Proj");
goog.require("Proj4js.Point");
goog.require("Proj4js.common");
goog.require("Proj4js.Proj.transform");
goog.require("Proj4js.Proj.lcc");
goog.require("Proj4js.Proj.merc");
goog.require("Proj4js.Proj.somerc");

/*
Author:       Mike Adair madairATdmsolutions.ca
              Richard Greenwood rich@greenwoodmap.com
License:      MIT as per: ../LICENSE

$Id: Proj.js 2956 2007-07-09 12:17:52Z steven $
*/

/**
 * Namespace: Proj4js
 *
 * Proj4js is a JavaScript library to transform point coordinates from one
 * coordinate system to another, including datum transformations.
 *
 * This library is a port of both the Proj.4 and GCTCP C libraries to JavaScript.
 * Enabling these transformations in the browser allows geographic data stored
 * in different projections to be combined in browser-based web mapping
 * applications.
 *
 * Proj4js must have access to coordinate system initialization strings (which
 * are the same as for PROJ.4 command line).  Thes can be included in your
 * application using a <script> tag or you can,load them dynamically from a
 * web service such as spatialreference.org, but it is the application's
 * responsibility to ensure that defs are loaded prioir to instantiating a
 * Proj4js.Proj object.
 *
 * Similarly, Proj4js must have access to projection transform code.  The full
 * build of Proj4js includes all available projection classes.  You can reduce
 * the size of the library by doing a custom build of Proj4js including only
 * the projection classes required.
 *
 * All coordinates are handled as points which have a .x and a .y property
 * which will be modified in place.
 *
 * Override Proj4js.reportError for output of alerts and warnings.
 *
 * See http://trac.osgeo.org/proj4js/wiki/UserGuide for full details.
*/

/**
 * Method: transform(source, dest, point)
 * Transform a point coordinate from one map projection to another.  This is
 * really the only public method you should need to use.
 *
 * @param {Proj4js.Proj} source - source map projection for the transformation
 * @param {Proj4js.Proj} dest - destination map projection for the transform.
 * @param {Proj4js.Point|{x: number,y: number,z: number}} point - the coordinate
 *    to be transformed
 * @return {Proj4js.Point|{x: number,y: number,z: number}} the resulting coord.
*/
Proj4js.transform = function(source, dest, point) {

   // Workaround for datum shifts towgs84, if either source or destination
   // projection is not wgs84
  if (source.datum && dest.datum && (
      ((source.datum.datum_type == Proj4js.common.PJD_3PARAM ||
      source.datum.datum_type == Proj4js.common.PJD_7PARAM)
      && dest.datumCode != "WGS84") ||
      ((dest.datum.datum_type == Proj4js.common.PJD_3PARAM ||
      dest.datum.datum_type == Proj4js.common.PJD_7PARAM)
      && source.datumCode != "WGS84"))) {

    var wgs84 = new Proj4js.Proj('WGS84');
    Proj4js.transform(source, wgs84, point);
    source = wgs84;
  }

   // DGR, 2010/11/12
   if (source.axis!="enu") {
       Proj4js.common.adjust_axis(source,false,point);
   }

   // Transform source points to long/lat, if they aren't already.
   if ( source.projName=="longlat") {
       point.x *= Proj4js.common.D2R;  // convert degrees to radians
       point.y *= Proj4js.common.D2R;
   } else {
       if (source.to_meter) {
           point.x *= source.to_meter;
           point.y *= source.to_meter;
       }
       source.transform.inverse(point); // Convert Cartesian to longlat
   }

   // Adjust for the prime meridian if necessary
   if (source.from_greenwich) {
       point.x += source.from_greenwich;
   }

   // Convert datums if needed, and if possible.
   point = Proj4js.Datum.transform( source.datum, dest.datum, point );

   // Adjust for the prime meridian if necessary
   if (dest.from_greenwich) {
       point.x -= dest.from_greenwich;
   }

   if( dest.projName=="longlat" ) {
       // convert radians to decimal degrees
       point.x *= Proj4js.common.R2D;
       point.y *= Proj4js.common.R2D;
   } else  {               // else project
       dest.transform.forward(point);
       if (dest.to_meter) {
           point.x /= dest.to_meter;
           point.y /= dest.to_meter;
       }
   }

   // DGR, 2010/11/12
   if (dest.axis!="enu") {
       Proj4js.common.adjust_axis(dest,true,point);
   }

   return point;
}; // transform()

/**
 * Function: reportError
 * An internal method to report errors back to user.
 * Override this in applications to report error messages or throw exceptions.
 * @param {string} msg - the error message to be reported
 */
Proj4js.reportError = function(msg) {
  window.console.log(msg);
};

/**
  Proj4js.defs is a collection of coordinate system definition objects in the
  PROJ.4 command line format.
  Generally a def is added by means of a separate .js file for example:

    <SCRIPT type="text/javascript" src="defs/EPSG26912.js"></SCRIPT>

  def is a CS definition in PROJ.4 WKT format, for example:
    +proj="tmerc"   //longlat, etc.
    +a=majorRadius
    +b=minorRadius
    +lat0=somenumber
    +long=somenumber

* @enum {string}
*/
Proj4js.defs = {
  // These are so widely used, we'll go ahead and throw them in
  // without requiring a separate .js file
  'WGS84': "+title=long/lat:WGS84 +proj=longlat +ellps=WGS84 +datum=WGS84 "+
      "+units=degrees",
  'EPSG:4326': "+title=long/lat:WGS84 +proj=longlat +a=6378137.0 "+
      "+b=6356752.31424518 +ellps=WGS84 +datum=WGS84 +units=degrees",
  'EPSG:4269': "+title=long/lat:NAD83 +proj=longlat +a=6378137.0 "+
      "+b=6356752.31414036 +ellps=GRS80 +datum=NAD83 +units=degrees",
  'EPSG:3857': "+title= Google Mercator +proj=merc +a=6378137 +b=6378137 "+
      "+lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null "+
      "+no_defs"
};
Proj4js.defs['GOOGLE'] = Proj4js.defs['EPSG:3857'];
Proj4js.defs['EPSG:900913'] = Proj4js.defs['EPSG:3857'];
Proj4js.defs['EPSG:102113'] = Proj4js.defs['EPSG:3857'];

/**
* Longitude of the prime meridian
*
* @enum {number}
*/
Proj4js.PrimeMeridian = {
    "greenwich": 0.0,               //"0dE",
    "lisbon":     -9.131906111111,   //"9d07'54.862\"W",
    "paris":       2.337229166667,   //"2d20'14.025\"E",
    "bogota":    -74.080916666667,  //"74d04'51.3\"W",
    "madrid":     -3.687938888889,  //"3d41'16.58\"W",
    "rome":       12.452333333333,  //"12d27'8.4\"E",
    "bern":        7.439583333333,  //"7d26'22.5\"E",
    "jakarta":   106.807719444444,  //"106d48'27.79\"E",
    "ferro":     -17.666666666667,  //"17d40'W",
    "brussels":    4.367975,        //"4d22'4.71\"E",
    "stockholm":  18.058277777778,  //"18d3'29.8\"E",
    "athens":     23.7163375,       //"23d42'58.815\"E",
    "oslo":       10.722916666667   //"10d43'22.5\"E"
};

/**
* Ellipsoid parameters
*
* @enum {Object}
*/
Proj4js.Ellipsoid = {
  "MERIT": {a:6378137.0, rf:298.257, ellipseName:"MERIT 1983"},
  "SGS85": {a:6378136.0, rf:298.257, ellipseName:"Soviet Geodetic System 85"},
  "GRS80": {a:6378137.0, rf:298.257222101, ellipseName:"GRS 1980(IUGG, 1980)"},
  "IAU76": {a:6378140.0, rf:298.257, ellipseName:"IAU 1976"},
  "airy": {a:6377563.396, b:6356256.910, ellipseName:"Airy 1830"},
  "APL4.": {a:6378137, rf:298.25, ellipseName:"Appl. Physics. 1965"},
  "NWL9D": {a:6378145.0, rf:298.25, ellipseName:"Naval Weapons Lab., 1965"},
  "mod_airy": {a:6377340.189, b:6356034.446, ellipseName:"Modified Airy"},
  "andrae": {a:6377104.43, rf:300.0, ellipseName:"Andrae 1876 (Den., Iclnd.)"},
  "aust_SA": {a:6378160.0, rf:298.25,
      ellipseName:"Australian Natl & S. Amer. 1969"},
  "GRS67": {a:6378160.0, rf:298.2471674270, ellipseName:"GRS 67(IUGG 1967)"},
  "bessel": {a:6377397.155, rf:299.1528128, ellipseName:"Bessel 1841"},
  "bess_nam": {a:6377483.865, rf:299.1528128,
      ellipseName:"Bessel 1841 (Namibia)"},
  "clrk66": {a:6378206.4, b:6356583.8, ellipseName:"Clarke 1866"},
  "clrk80": {a:6378249.145, rf:293.4663, ellipseName:"Clarke 1880 mod."},
  "CPM": {a:6375738.7, rf:334.29,
      ellipseName:"Comm. des Poids et Mesures 1799"},
  "delmbr": {a:6376428.0, rf:311.5, ellipseName:"Delambre 1810 (Belgium)"},
  "engelis": {a:6378136.05, rf:298.2566, ellipseName:"Engelis 1985"},
  "evrst30": {a:6377276.345, rf:300.8017, ellipseName:"Everest 1830"},
  "evrst48": {a:6377304.063, rf:300.8017, ellipseName:"Everest 1948"},
  "evrst56": {a:6377301.243, rf:300.8017, ellipseName:"Everest 1956"},
  "evrst69": {a:6377295.664, rf:300.8017, ellipseName:"Everest 1969"},
  "evrstSS": {a:6377298.556, rf:300.8017,
      ellipseName:"Everest (Sabah & Sarawak)"},
  "fschr60": {a:6378166.0, rf:298.3,
      ellipseName:"Fischer (Mercury Datum) 1960"},
  "fschr60m": {a:6378155.0, rf:298.3, ellipseName:"Fischer 1960"},
  "fschr68": {a:6378150.0, rf:298.3, ellipseName:"Fischer 1968"},
  "helmert": {a:6378200.0, rf:298.3, ellipseName:"Helmert 1906"},
  "hough": {a:6378270.0, rf:297.0, ellipseName:"Hough"},
  "intl": {a:6378388.0, rf:297.0, ellipseName:"International 1909 (Hayford)"},
  "kaula": {a:6378163.0, rf:298.24, ellipseName:"Kaula 1961"},
  "lerch": {a:6378139.0, rf:298.257, ellipseName:"Lerch 1979"},
  "mprts": {a:6397300.0, rf:191.0, ellipseName:"Maupertius 1738"},
  "new_intl": {a:6378157.5, b:6356772.2, ellipseName:"New International 1967"},
  "plessis": {a:6376523.0, rf:6355863.0, ellipseName:"Plessis 1817 (France)"},
  "krass": {a:6378245.0, rf:298.3, ellipseName:"Krassovsky, 1942"},
  "SEasia": {a:6378155.0, b:6356773.3205, ellipseName:"Southeast Asia"},
  "walbeck": {a:6376896.0, b:6355834.8467, ellipseName:"Walbeck"},
  "WGS60": {a:6378165.0, rf:298.3, ellipseName:"WGS 60"},
  "WGS66": {a:6378145.0, rf:298.25, ellipseName:"WGS 66"},
  "WGS72": {a:6378135.0, rf:298.26, ellipseName:"WGS 72"},
  "WGS84": {a:6378137.0, rf:298.257223563, ellipseName:"WGS 84"},
  "sphere": {a:6370997.0, b:6370997.0, ellipseName:"Normal Sphere (r=6370997)"}
};

/**
* Datum definitions
*
* @enum {Object}
*/
Proj4js.Datum.defs = {
  "WGS84": {towgs84: "0,0,0", ellipse: "WGS84", datumName: "WGS84"},
  "GGRS87": {towgs84: "-199.87,74.79,246.62", ellipse: "GRS80",
      datumName: "Greek_Geodetic_Reference_System_1987"},
  "NAD83": {towgs84: "0,0,0", ellipse: "GRS80",
      datumName: "North_American_Datum_1983"},
  "NAD27": {nadgrids: "@conus,@alaska,@ntv2_0.gsb,@ntv1_can.dat",
      ellipse: "clrk66", datumName: "North_American_Datum_1927"},
  "potsdam": {towgs84: "606.0,23.0,413.0", ellipse: "bessel",
      datumName: "Potsdam Rauenberg 1950 DHDN"},
  "carthage": {towgs84: "-263.0,6.0,431.0", ellipse: "clark80",
      datumName: "Carthage 1934 Tunisia"},
  "hermannskogel": {towgs84: "653.0,-212.0,449.0", ellipse: "bessel",
      datumName: "Hermannskogel"},
  "ire65": {towgs84: "482.530,-130.596,564.557,-1.042,-0.214,-0.631,8.15",
      ellipse: "mod_airy", datumName: "Ireland 1965"},
  "nzgd49": {towgs84: "59.47,-5.04,187.44,0.47,-0.1,1.024,-4.5993",
      ellipse: "intl", datumName: "New Zealand Geodetic Datum 1949"},
  "OSGB36": {towgs84: "446.448,-125.157,542.060,0.1502,0.2470,0.8421,-20.4894",
      ellipse: "airy", datumName: "Airy 1830"}
};

//as returned from spatialreference.org
Proj4js.Datum.defs['OSB36'] = Proj4js.Datum.defs['OSGB36'];

/**
* wktProjections
* lookup table to go from the projection name in WKT to the Proj4js projection
* name build this out as required
*
* @enum {string}
*/
Proj4js.wktProjections = {
  "Lambert Tangential Conformal Conic Projection": "lcc",
  "Mercator": "merc",
  "Popular Visualisation Pseudo Mercator": "merc",
  "Mercator_1SP": "merc",
  "Transverse_Mercator": "tmerc",
  "Transverse Mercator": "tmerc",
  "Lambert Azimuthal Equal Area": "laea",
  "Universal Transverse Mercator System": "utm"
};


goog.exportSymbol('Proj4js.transform', Proj4js.transform );
goog.exportSymbol('Proj4js.reportError', Proj4js.reportError );
goog.exportSymbol('Proj4js.defs', Proj4js.defs);

goog.exportSymbol('Proj4js.Point', Proj4js.Point);
goog.exportSymbol('Proj4js.Point.prototype', Proj4js.Point.prototype);
goog.exportProperty(Proj4js.Point.prototype, 'x', Proj4js.Point.x);
goog.exportProperty(Proj4js.Point.prototype, 'y', Proj4js.Point.y);
goog.exportProperty(Proj4js.Point.prototype, 'z', Proj4js.Point.z);

goog.exportSymbol('Proj4js.Proj', Proj4js.Proj);
goog.exportSymbol('Proj4js.Proj.prototype', Proj4js.Proj.prototype);
goog.exportProperty(Proj4js.Proj.prototype, 'projName', Proj4js.Proj.prototype.projName);
goog.exportProperty(Proj4js.Proj.prototype, 'title', Proj4js.Proj.prototype.title);
goog.exportProperty(Proj4js.Proj.prototype, 'units', Proj4js.Proj.prototype.units);
goog.exportProperty(Proj4js.Proj.prototype, 'srsCode', Proj4js.Proj.prototype.srsCode);
goog.exportProperty(Proj4js.Proj.prototype, 'axis', Proj4js.Proj.prototype.axis);
//goog.exportSymbol('Proj4js.Proj.srsCode', Proj4js.Proj.srsCode);

goog.exportSymbol('Proj4js.Proj.longlat', Proj4js.Proj.longlat);
goog.exportSymbol('Proj4js.Proj.merc', Proj4js.Proj.merc);
goog.exportSymbol('Proj4js.Proj.somerc', Proj4js.Proj.somerc);

