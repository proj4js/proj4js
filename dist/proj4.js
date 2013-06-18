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
 * application using a <script> tag or Proj4js can load CS initialization 
 * strings from a local directory or a web service such as spatialreference.org.
 *
 * Similarly, Proj4js must have access to projection transform code.  These can
 * be included individually using a <script> tag in your page, built into a 
 * custom build of Proj4js or loaded dynamically at run-time.  Using the
 * -combined and -compressed versions of Proj4js includes all projection class
 * code by default.
 *
 * Note that dynamic loading of defs and code happens ascynchrously, check the
 * Proj.readyToUse flag before using the Proj object.  If the defs and code
 * required by your application are loaded through script tags, dynamic loading
 * is not required and the Proj object will be readyToUse on return from the 
 * constructor.
 * 
 * All coordinates are handled as points which have a .x and a .y property
 * which will be modified in place.
 *
 * Override Proj4js.reportError for output of alerts and warnings.
 *
 * See http://trac.osgeo.org/proj4js/wiki/UserGuide for full details.
*/

/**
 * Global namespace object for Proj4js library
 */
var Proj4js = {

    /**
     * Property: defaultDatum
     * The datum to use when no others a specified
     */
    defaultDatum: 'WGS84',                  //default datum

    /** 
    * Method: transform(source, dest, point)
    * Transform a point coordinate from one map projection to another.  This is
    * really the only public method you should need to use.
    *
    * Parameters:
    * source - {Proj4js.Proj} source map projection for the transformation
    * dest - {Proj4js.Proj} destination map projection for the transformation
    * point - {Object} point to transform, may be geodetic (long, lat) or
    *     projected Cartesian (x,y), but should always have x,y properties.
    */
    transform: function(source, dest, point) {
        if (!source.readyToUse) {
            this.reportError("Proj4js initialization for:"+source.srsCode+" not yet complete");
            return point;
        }
        if (!dest.readyToUse) {
            this.reportError("Proj4js initialization for:"+dest.srsCode+" not yet complete");
            return point;
        }
        
        // Workaround for datum shifts towgs84, if either source or destination projection is not wgs84
        if (source.datum && dest.datum && (
            ((source.datum.datum_type == Proj4js.common.PJD_3PARAM || source.datum.datum_type == Proj4js.common.PJD_7PARAM) && dest.datumCode != "WGS84") ||
            ((dest.datum.datum_type == Proj4js.common.PJD_3PARAM || dest.datum.datum_type == Proj4js.common.PJD_7PARAM) && source.datumCode != "WGS84"))) {
            var wgs84 = Proj4js.WGS84;
            this.transform(source, wgs84, point);
            source = wgs84;
        }

        // DGR, 2010/11/12
        if (source.axis!="enu") {
            this.adjust_axis(source,false,point);
        }

        // Transform source points to long/lat, if they aren't already.
        if (source.projName=="longlat") {
            point.x *= Proj4js.common.D2R;  // convert degrees to radians
            point.y *= Proj4js.common.D2R;
        } else {
            if (source.to_meter) {
                point.x *= source.to_meter;
                point.y *= source.to_meter;
            }
            source.inverse(point); // Convert Cartesian to longlat
        }

        // Adjust for the prime meridian if necessary
        if (source.from_greenwich) { 
            point.x += source.from_greenwich; 
        }

        // Convert datums if needed, and if possible.
        point = this.datum_transform( source.datum, dest.datum, point );

        // Adjust for the prime meridian if necessary
        if (dest.from_greenwich) {
            point.x -= dest.from_greenwich;
        }

        if (dest.projName=="longlat") {
            // convert radians to decimal degrees
            point.x *= Proj4js.common.R2D;
            point.y *= Proj4js.common.R2D;
        } else  {               // else project
            dest.forward(point);
            if (dest.to_meter) {
                point.x /= dest.to_meter;
                point.y /= dest.to_meter;
            }
        }

        // DGR, 2010/11/12
        if (dest.axis!="enu") {
            this.adjust_axis(dest,true,point);
        }

        return point;
    }, // transform()

    /** datum_transform()
      source coordinate system definition,
      destination coordinate system definition,
      point to transform in geodetic coordinates (long, lat, height)
    */
    datum_transform : function( source, dest, point ) {

      // Short cut if the datums are identical.
      if( source.compare_datums( dest ) ) {
          return point; // in this case, zero is sucess,
                    // whereas cs_compare_datums returns 1 to indicate TRUE
                    // confusing, should fix this
      }

      // Explicitly skip datum transform by setting 'datum=none' as parameter for either source or dest
      if( source.datum_type == Proj4js.common.PJD_NODATUM
          || dest.datum_type == Proj4js.common.PJD_NODATUM) {
          return point;
      }

      //DGR: 2012-07-29 : add nadgrids support (begin)
      var src_a = source.a;
      var src_es = source.es;

      var dst_a = dest.a;
      var dst_es = dest.es;

      var fallback= source.datum_type;
      // If this datum requires grid shifts, then apply it to geodetic coordinates.
      if( fallback == Proj4js.common.PJD_GRIDSHIFT )
      {
          if (this.apply_gridshift( source, 0, point )==0) {
            source.a = Proj4js.common.SRS_WGS84_SEMIMAJOR;
            source.es = Proj4js.common.SRS_WGS84_ESQUARED;
          } else {

              // try 3 or 7 params transformation or nothing ?
              if (!source.datum_params) {
                  source.a = src_a;
                  source.es = source.es;
                  return point;
              }
              var wp= 1.0;
              for (var i= 0, l= source.datum_params.length; i<l; i++) {
                wp*= source.datum_params[i];
              }
              if (wp==0.0) {
                source.a = src_a;
                source.es = source.es;
                return point;
              }
              fallback= source.datum_params.length>3?
                Proj4js.common.PJD_7PARAM
              : Proj4js.common.PJD_3PARAM;
              // CHECK_RETURN;
          }
      }

      if( dest.datum_type == Proj4js.common.PJD_GRIDSHIFT )
      {
          dest.a = Proj4js.common.SRS_WGS84_SEMIMAJOR;
          dest.es = Proj4js.common.SRS_WGS84_ESQUARED;
      }
      // Do we need to go through geocentric coordinates?
      if (source.es != dest.es || source.a != dest.a
          || fallback == Proj4js.common.PJD_3PARAM
          || fallback == Proj4js.common.PJD_7PARAM
          || dest.datum_type == Proj4js.common.PJD_3PARAM
          || dest.datum_type == Proj4js.common.PJD_7PARAM)
      {
      //DGR: 2012-07-29 : add nadgrids support (end)

        // Convert to geocentric coordinates.
        source.geodetic_to_geocentric( point );
        // CHECK_RETURN;

        // Convert between datums
        if( source.datum_type == Proj4js.common.PJD_3PARAM || source.datum_type == Proj4js.common.PJD_7PARAM ) {
          source.geocentric_to_wgs84(point);
          // CHECK_RETURN;
        }

        if( dest.datum_type == Proj4js.common.PJD_3PARAM || dest.datum_type == Proj4js.common.PJD_7PARAM ) {
          dest.geocentric_from_wgs84(point);
          // CHECK_RETURN;
        }

        // Convert back to geodetic coordinates
        dest.geocentric_to_geodetic( point );
          // CHECK_RETURN;
      }

      // Apply grid shift to destination if required
      if( dest.datum_type == Proj4js.common.PJD_GRIDSHIFT )
      {
          this.apply_gridshift( dest, 1, point);
          // CHECK_RETURN;
      }

      source.a = src_a;
      source.es = src_es;
      dest.a = dst_a;
      dest.es = dst_es;

      return point;
    }, // cs_datum_transform

    /**
     * This is the real workhorse, given a gridlist
     * DGR: 2012-07-29 addition based on proj4 trunk
     */
    apply_gridshift : function(srs,inverse,point) {
        if (srs.grids==null || srs.grids.length==0) {
            return -38;
        }
        var input= {"x":point.x, "y":point.y};
        var output= {"x":Number.NaN, "y":Number.NaN};
        /* keep trying till we find a table that works */
        var onlyMandatoryGrids= false;
        for (var i= 0, l= srs.grids.length; i<l; i++) {
            var gi= srs.grids[i];
            onlyMandatoryGrids= gi.mandatory;
            var ct= gi.grid;
            if (ct==null) {
                if (gi.mandatory) {
                    this.reportError("unable to find '"+gi.name+"' grid.");
                    return -48;
                }
                continue;//optional grid
            } 
            /* skip tables that don't match our point at all.  */
            var epsilon= (Math.abs(ct.del[1])+Math.abs(ct.del[0]))/10000.0;
            if( ct.ll[1]-epsilon>input.y || ct.ll[0]-epsilon>input.x ||
                ct.ll[1]+(ct.lim[1]-1)*ct.del[1]+epsilon<input.y ||
                ct.ll[0]+(ct.lim[0]-1)*ct.del[0]+epsilon<input.x ) {
                continue;
            }
            /* If we have child nodes, check to see if any of them apply. */
            /* TODO : only plain grid has been implemented ... */
            /* we found a more refined child node to use */
            /* load the grid shift info if we don't have it. */
            /* TODO : Proj4js.grids pre-loaded (as they can be huge ...) */
            /* skip numerical computing error when "null" grid (identity grid): */
            if (gi.name=="null") {
                output.x= input.x;
                output.y= input.y;
            } else {
                output= Proj4js.common.nad_cvt(input, inverse, ct);
            }
            if (!isNaN(output.x)) {
                break;
            }
        }
        if (isNaN(output.x)) {
            if (!onlyMandatoryGrids) {
                this.reportError("failed to find a grid shift table for location '"+
                    input.x*Proj4js.common.R2D+" "+input.y*Proj4js.common.R2D+
                    " tried: '"+srs.nadgrids+"'");
                return -48;
            }
            return -1;//FIXME: no shift applied ...
        }
        point.x= output.x;
        point.y= output.y;
        return 0;
    },

    /**
     * Function: adjust_axis
     * Normalize or de-normalized the x/y/z axes.  The normal form is "enu"
     * (easting, northing, up).
     * Parameters:
     * crs {Proj4js.Proj} the coordinate reference system
     * denorm {Boolean} when false, normalize
     * point {Object} the coordinates to adjust
     */
    adjust_axis: function(crs, denorm, point) {
        var xin= point.x, yin= point.y, zin= point.z || 0.0;
        var v, t;
        for (var i= 0; i<3; i++) {
            if (denorm && i==2 && point.z===undefined) { continue; }
                 if (i==0) { v= xin; t= 'x'; }
            else if (i==1) { v= yin; t= 'y'; }
            else           { v= zin; t= 'z'; }
            switch(crs.axis[i]) {
            case 'e':
                point[t]= v;
                break;
            case 'w':
                point[t]= -v;
                break;
            case 'n':
                point[t]= v;
                break;
            case 's':
                point[t]= -v;
                break;
            case 'u':
                if (point[t]!==undefined) { point.z= v; }
                break;
            case 'd':
                if (point[t]!==undefined) { point.z= -v; }
                break;
            default :
                alert("ERROR: unknow axis ("+crs.axis[i]+") - check definition of "+crs.projName);
                return null;
            }
        }
        return point;
    },

    /**
     * Function: reportError
     * An internal method to report errors back to user. 
     * Override this in applications to report error messages or throw exceptions.
     */
    reportError: function(msg) {
      //console.log(msg);
    },

/**
 *
 * Title: Private Methods
 * The following properties and methods are intended for internal use only.
 *
 * This is a minimal implementation of JavaScript inheritance methods so that 
 * Proj4js can be used as a stand-alone library.
 * These are copies of the equivalent OpenLayers methods at v2.7
 */
 
/**
 * Function: extend
 * Copy all properties of a source object to a destination object.  Modifies
 *     the passed in destination object.  Any properties on the source object
 *     that are set to undefined will not be (re)set on the destination object.
 *
 * Parameters:
 * destination - {Object} The object that will be modified
 * source - {Object} The object with properties to be set on the destination
 *
 * Returns:
 * {Object} The destination object.
 */
    extend: function(destination, source) {
      destination = destination || {};
      if(source) {
          for(var property in source) {
              var value = source[property];
              if(value !== undefined) {
                  destination[property] = value;
              }
          }
      }
      return destination;
    },

/**
 * Constructor: Class
 * Base class used to construct all other classes. Includes support for 
 *     multiple inheritance. 
 *  
 */
    Class: function() {
      var Class = function() {
          this.initialize.apply(this, arguments);
      };
  
      var extended = {};
      var parent;
      for(var i=0; i<arguments.length; ++i) {
          if(typeof arguments[i] == "function") {
              // get the prototype of the superclass
              parent = arguments[i].prototype;
          } else {
              // in this case we're extending with the prototype
              parent = arguments[i];
          }
          Proj4js.extend(extended, parent);
      }
      Class.prototype = extended;
      
      return Class;
    },

    /**
     * Function: bind
     * Bind a function to an object.  Method to easily create closures with
     *     'this' altered.
     * 
     * Parameters:
     * func - {Function} Input function.
     * object - {Object} The object to bind to the input function (as this).
     * 
     * Returns:
     * {Function} A closure with 'this' set to the passed in object.
     */
    bind: function(func, object) {
        // create a reference to all arguments past the second one
        var args = Array.prototype.slice.apply(arguments, [2]);
        return function() {
            // Push on any additional arguments from the actual function call.
            // These will come after those sent to the bind call.
            var newArgs = args.concat(
                Array.prototype.slice.apply(arguments, [0])
            );
            return func.apply(object, newArgs);
        };
    }
};


/**
 * Class: Proj4js.Proj
 *
 * Proj objects provide transformation methods for point coordinates
 * between geodetic latitude/longitude and a projected coordinate system. 
 * once they have been initialized with a projection code.
 *
 * Initialization of Proj objects is with a projection code, usually EPSG codes,
 * which is the key that will be used with the Proj4js.defs array.
 * 
 * The code passed in will be stripped of colons and converted to uppercase
 * to locate projection definition files.
 *
 * A projection object has properties for units and title strings.
 */
Proj4js.Proj = Proj4js.Class({

  /**
   * Property: readyToUse
   * Flag to indicate if initialization is complete for this Proj object
   */
  readyToUse: true,   
  
  /**
   * Property: title
   * The title to describe the projection
   */
  title: null,  
  
  /**
   * Property: projName
   * The projection class for this projection, e.g. lcc (lambert conformal conic,
   * or merc for mercator).  These are exactly equivalent to their Proj4 
   * counterparts.
   */
  projName: null,
  /**
   * Property: units
   * The units of the projection.  Values include 'm' and 'degrees'
   */
  units: null,
  /**
   * Property: datum
   * The datum specified for the projection
   */
  datum: null,
  /**
   * Property: x0
   * The x coordinate origin
   */
  x0: 0,
  /**
   * Property: y0
   * The y coordinate origin
   */
  y0: 0,
  /**
   * Property: localCS
   * Flag to indicate if the projection is a local one in which no transforms
   * are required.
   */
  localCS: false,

  /**
  * Property: queue
  * Buffer (FIFO) to hold callbacks waiting to be called when projection loaded.
  */
  queue: null,

  /**
  * Constructor: initialize
  * Constructor for Proj4js.Proj objects
  *
  * Parameters:
  * srsCode - a code for map projection definition parameters.  These are usually
  * (but not always) EPSG codes.
  */
  initialize: function(srsCode, callback) {
      this.srsCodeInput = srsCode;
      
      //Register callbacks prior to attempting to process definition
      this.queue = [];
      if( callback ){
           this.queue.push( callback );
      }
      
      //check to see if this is a WKT string
      if ((srsCode.indexOf('GEOGCS') >= 0) ||
          (srsCode.indexOf('GEOCCS') >= 0) ||
          (srsCode.indexOf('PROJCS') >= 0) ||
          (srsCode.indexOf('LOCAL_CS') >= 0)) {
            this.parseWKT(srsCode);
            this.deriveConstants();
            this.loadProjCode(this.projName);
            return;
      }
      
      // DGR 2008-08-03 : support urn and url
      if (srsCode.indexOf('urn:') == 0) {
          //urn:ORIGINATOR:def:crs:CODESPACE:VERSION:ID
          var urn = srsCode.split(':');
          if ((urn[1] == 'ogc' || urn[1] =='x-ogc') &&
              (urn[2] =='def') &&
              (urn[3] =='crs')) {
              srsCode = urn[4]+':'+urn[urn.length-1];
          }
      } else if (srsCode.indexOf('http://') == 0) {
          //url#ID
          var url = srsCode.split('#');
          if (url[0].match(/epsg.org/)) {
            // http://www.epsg.org/#
            srsCode = 'EPSG:'+url[1];
          } else if (url[0].match(/RIG.xml/)) {
            //http://librairies.ign.fr/geoportail/resources/RIG.xml#
            //http://interop.ign.fr/registers/ign/RIG.xml#
            srsCode = 'IGNF:'+url[1];
          } else if (url[0].indexOf('/def/crs/')!=-1) {
            // http://www.opengis.net/def/crs/EPSG/0/code
            url= srsCode.split('/');
            srsCode = url.pop();//code
            url.pop();//version FIXME
            srsCode = url.pop()+':'+srsCode;//authority
          }
      }
      this.srsCode = srsCode.toUpperCase();
      if (this.srsCode.indexOf("EPSG") == 0) {
          this.srsCode = this.srsCode;
          this.srsAuth = 'epsg';
          this.srsProjNumber = this.srsCode.substring(5);
      // DGR 2007-11-20 : authority IGNF
      } else if (this.srsCode.indexOf("IGNF") == 0) {
          this.srsCode = this.srsCode;
          this.srsAuth = 'IGNF';
          this.srsProjNumber = this.srsCode.substring(5);
      // DGR 2008-06-19 : pseudo-authority CRS for WMS
      } else if (this.srsCode.indexOf("CRS") == 0) {
          this.srsCode = this.srsCode;
          this.srsAuth = 'CRS';
          this.srsProjNumber = this.srsCode.substring(4);
      } else {
          this.srsAuth = '';
          this.srsProjNumber = this.srsCode;
      }
      
      this.parseDefs();
      this.initTransforms();
  },
  
/**
 * Function: initTransforms
 *    Finalize the initialization of the Proj object
 *
 */
    initTransforms: function() {
      Proj4js.extend(this, Proj4js.Proj[this.projName]);
      this.init();
      this.readyToUse = true;
      if( this.queue ) {
        var item;
        while( (item = this.queue.shift()) ) {
          item.call( this, this );
        }
      }
  },

/**
 * Function: parseWKT
 * Parses a WKT string to get initialization parameters
 *
 */
 wktRE: /^(\w+)\[(.*)\]$/,
 parseWKT: function(wkt) {
    var wktMatch = wkt.match(this.wktRE);
    if (!wktMatch) return;
    var wktObject = wktMatch[1];
    var wktContent = wktMatch[2];
    var wktTemp = wktContent.split(",");
    var wktName;
    if (wktObject.toUpperCase() == "TOWGS84") {
      wktName = wktObject;  //no name supplied for the TOWGS84 array
    } else {
      wktName = wktTemp.shift();
    }
    wktName = wktName.replace(/^\"/,"");
    wktName = wktName.replace(/\"$/,"");
    
    /*
    wktContent = wktTemp.join(",");
    var wktArray = wktContent.split("],");
    for (var i=0; i<wktArray.length-1; ++i) {
      wktArray[i] += "]";
    }
    */
    
    var wktArray = new Array();
    var bkCount = 0;
    var obj = "";
    for (var i=0; i<wktTemp.length; ++i) {
      var token = wktTemp[i];
      for (var j=0; j<token.length; ++j) {
        if (token.charAt(j) == "[") ++bkCount;
        if (token.charAt(j) == "]") --bkCount;
      }
      obj += token;
      if (bkCount === 0) {
        wktArray.push(obj);
        obj = "";
      } else {
        obj += ",";
      }
    }
    
    //do something based on the type of the wktObject being parsed
    //add in variations in the spelling as required
    switch (wktObject) {
      case 'LOCAL_CS':
        this.projName = 'identity';
        this.localCS = true;
        this.srsCode = wktName;
        break;
      case 'GEOGCS':
        this.projName = 'longlat';
        this.geocsCode = wktName;
        if (!this.srsCode) this.srsCode = wktName;
        break;
      case 'PROJCS':
        this.srsCode = wktName;
        break;
      case 'GEOCCS':
        break;
      case 'PROJECTION':
        this.projName = Proj4js.wktProjections[wktName];
        break;
      case 'DATUM':
        this.datumName = wktName;
        break;
      case 'LOCAL_DATUM':
        this.datumCode = 'none';
        break;
      case 'SPHEROID':
        this.ellps = wktName;
        this.a = parseFloat(wktArray.shift());
        this.rf = parseFloat(wktArray.shift());
        break;
      case 'PRIMEM':
        this.from_greenwich = parseFloat(wktArray.shift()); //to radians?
        break;
      case 'UNIT':
        this.units = wktName;
        this.unitsPerMeter = parseFloat(wktArray.shift());
        break;
      case 'PARAMETER':
        var name = wktName.toLowerCase();
        var value = parseFloat(wktArray.shift());
        //there may be many variations on the wktName values, add in case
        //statements as required
        switch (name) {
          case 'false_easting':
            this.x0 = value;
            break;
          case 'false_northing':
            this.y0 = value;
            break;
          case 'scale_factor':
            this.k0 = value;
            break;
          case 'central_meridian':
            this.long0 = value*Proj4js.common.D2R;
            break;
          case 'latitude_of_origin':
            this.lat0 = value*Proj4js.common.D2R;
            break;
          case 'more_here':
            break;
          default:
            break;
        }
        break;
      case 'TOWGS84':
        this.datum_params = wktArray;
        break;
      //DGR 2010-11-12: AXIS
      case 'AXIS':
        var name= wktName.toLowerCase();
        var value= wktArray.shift();
        switch (value) {
          case 'EAST' : value= 'e'; break;
          case 'WEST' : value= 'w'; break;
          case 'NORTH': value= 'n'; break;
          case 'SOUTH': value= 's'; break;
          case 'UP'   : value= 'u'; break;
          case 'DOWN' : value= 'd'; break;
          case 'OTHER':
          default     : value= ' '; break;//FIXME
        }
        if (!this.axis) { this.axis= "enu"; }
        switch(name) {
          case 'x': this.axis=                         value + this.axis.substr(1,2); break;
          case 'y': this.axis= this.axis.substr(0,1) + value + this.axis.substr(2,1); break;
          case 'z': this.axis= this.axis.substr(0,2) + value                        ; break;
          default : break;
        }
      case 'MORE_HERE':
        break;
      default:
        break;
    }
    for (var i=0; i<wktArray.length; ++i) {
      this.parseWKT(wktArray[i]);
    }
 },

/**
 * Function: parseDefs
 * Parses the PROJ.4 initialization string and sets the associated properties.
 *
 */
  parseDefs: function() {
      var re= new RegExp('(title|proj|units|datum|nadgrids|'+
                         'ellps|a|b|rf|'+
                         'lat_0|lat_1|lat_2|lat_ts|lon_0|lon_1|lon_2|alpha|lonc|'+
                         'x_0|y_0|k_0|k|r_a|zone|south|'+
                         'towgs84|to_meter|from_greenwich|pm|axis|czech|'+
                         'wktext|no_rot|no_off|no_defs)');
      this.defData = Proj4js.defs[this.srsCode];
      var paramName, paramVal;
      if (!this.defData) {
        return;
      }
      var paramArray=this.defData.split("+");

      for (var prop=0; prop<paramArray.length; prop++) {
          var property = paramArray[prop].split("=");
          paramName = property[0].toLowerCase();
          paramVal = property[1];

          switch (paramName.replace(/\s/gi,"")) {  // trim out spaces
              case "": break;   // throw away nameless parameter
              // DGR 2012-10-13 : + in title (EPSG:2056: CH1903+ / LV95)
              case "title":  this.title = paramVal;
                             while (!paramArray[prop+1].match(re)) {
                               this.title+= '+'+paramArray[++prop];
                             }
                             break;
              case "proj":   this.projName =  paramVal.replace(/\s/gi,""); break;
              case "units":  this.units = paramVal.replace(/\s/gi,""); break;
              case "datum":  this.datumCode = paramVal.replace(/\s/gi,""); break;
              // DGR 2011-03-20 : nagrids -> nadgrids
              case "nadgrids": this.nadgrids = paramVal.replace(/\s/gi,""); break;// DGR 2012-07-29
              case "ellps":  this.ellps = paramVal.replace(/\s/gi,""); break;
              case "a":      this.a =  parseFloat(paramVal); break;  // semi-major radius
              case "b":      this.b =  parseFloat(paramVal); break;  // semi-minor radius
              // DGR 2007-11-20
              case "rf":     this.rf = parseFloat(paramVal); break; // inverse flattening rf= a/(a-b)
              case "lat_0":  this.lat0 = paramVal*Proj4js.common.D2R; break;        // phi0, central latitude
              case "lat_1":  this.lat1 = paramVal*Proj4js.common.D2R; break;        //standard parallel 1
              case "lat_2":  this.lat2 = paramVal*Proj4js.common.D2R; break;        //standard parallel 2
              case "lat_ts": this.lat_ts = paramVal*Proj4js.common.D2R; break;      // used in merc and eqc
              case "lon_0":  this.long0 = paramVal*Proj4js.common.D2R; break;       // lam0, central longitude
              case "lon_1":  this.long1 = paramVal*Proj4js.common.D2R; break;
              case "lon_2":  this.long2 = paramVal*Proj4js.common.D2R; break;
              case "no_rot": this.no_rot = true; break;
              case "no_off": this.no_off = true; break;
              case "alpha":  this.alpha =  parseFloat(paramVal)*Proj4js.common.D2R; break;  //for somerc projection
              case "lonc":   this.longc = paramVal*Proj4js.common.D2R; break;       //for somerc projection
              case "x_0":    this.x0 = parseFloat(paramVal); break;  // false easting
              case "y_0":    this.y0 = parseFloat(paramVal); break;  // false northing
              case "k_0":    this.k0 = parseFloat(paramVal); break;  // projection scale factor
              case "k":      this.k0 = parseFloat(paramVal); break;  // both forms returned
              case "r_a":    this.R_A = true; break;                 // sphere--area of ellipsoid
              case "zone":   this.zone = parseInt(paramVal,10); break;  // UTM Zone
              case "south":   this.utmSouth = true; break;  // UTM north/south
              case "towgs84":this.datum_params = paramVal.split(","); break;
              case "to_meter": this.to_meter = parseFloat(paramVal); break; // cartesian scaling
              case "from_greenwich": this.from_greenwich = paramVal*Proj4js.common.D2R; break;
              case "czech": this.czech = true; break;
              // DGR 2008-07-09 : if pm is not a well-known prime meridian take
              // the value instead of 0.0, then convert to radians
              case "pm":     paramVal = paramVal.replace(/\s/gi,"");
                             this.from_greenwich = Proj4js.PrimeMeridian[paramVal] ?
                                Proj4js.PrimeMeridian[paramVal] : parseFloat(paramVal);
                             this.from_greenwich *= Proj4js.common.D2R; 
                             break;
              // DGR 2010-11-12: axis
              case "axis":   paramVal = paramVal.replace(/\s/gi,"");
                             var legalAxis= "ewnsud";
                             if (paramVal.length==3 &&
                                 legalAxis.indexOf(paramVal.substr(0,1))!=-1 &&
                                 legalAxis.indexOf(paramVal.substr(1,1))!=-1 &&
                                 legalAxis.indexOf(paramVal.substr(2,1))!=-1) {
                                this.axis= paramVal;
                             } //FIXME: be silent ?
                             break;
              case "wktext": break;//DGR 2012-07-29
              case "no_defs": break;
              default: //alert("Unrecognized parameter: " + paramName);
          } // switch()
      } // for paramArray
      this.deriveConstants();
  },

/**
 * Function: deriveConstants
 * Sets several derived constant values and initialization of datum and ellipse
 *     parameters.
 *
 */
  deriveConstants: function() {
      // DGR 2011-03-20 : nagrids -> nadgrids
      if (this.nadgrids && this.nadgrids.length==0) {
          this.nadgrids= null;
      }
      if (this.nadgrids) {
        this.grids= this.nadgrids.split(",");
        var g= null, l= this.grids.length;
        if (l>0) {
          for (var i= 0; i<l; i++) {
            g= this.grids[i];
            var fg= g.split("@");
            if (fg[fg.length-1]=="") {
              Proj4js.reportError("nadgrids syntax error '"+this.nadgrids+"' : empty grid found");
              continue;
            }
            this.grids[i]= {
              mandatory: fg.length==1,//@=> optional grid (no error if not found)
              name:fg[fg.length-1],
              grid: Proj4js.grids[fg[fg.length-1]]//FIXME: grids loading ...
            };
            if (this.grids[i].mandatory && !this.grids[i].grid) {
              Proj4js.reportError("Missing '"+this.grids[i].name+"'");
            }
          }
        }
        // DGR, 2011-03-20: grids is an array of objects that hold
        // the loaded grids, its name and the mandatory informations of it.
      }
      if (this.datumCode && this.datumCode != 'none') {
        var datumDef = Proj4js.Datum[this.datumCode];
        if (datumDef) {
          this.datum_params = datumDef.towgs84 ? datumDef.towgs84.split(',') : null;
          this.ellps = datumDef.ellipse;
          this.datumName = datumDef.datumName ? datumDef.datumName : this.datumCode;
        }
      }
      if (!this.a) {    // do we have an ellipsoid?
          var ellipse = Proj4js.Ellipsoid[this.ellps] ? Proj4js.Ellipsoid[this.ellps] : Proj4js.Ellipsoid['WGS84'];
          Proj4js.extend(this, ellipse);
      }
      if (this.rf && !this.b) this.b = (1.0 - 1.0/this.rf) * this.a;
      if (this.rf === 0 || Math.abs(this.a - this.b)<Proj4js.common.EPSLN) {
        this.sphere = true;
        this.b= this.a;
      }
      this.a2 = this.a * this.a;          // used in geocentric
      this.b2 = this.b * this.b;          // used in geocentric
      this.es = (this.a2-this.b2)/this.a2;  // e ^ 2
      this.e = Math.sqrt(this.es);        // eccentricity
      if (this.R_A) {
        this.a *= 1. - this.es * (Proj4js.common.SIXTH + this.es * (Proj4js.common.RA4 + this.es * Proj4js.common.RA6));
        this.a2 = this.a * this.a;
        this.b2 = this.b * this.b;
        this.es = 0.;
      }
      this.ep2=(this.a2-this.b2)/this.b2; // used in geocentric
      if (!this.k0) this.k0 = 1.0;    //default value
      //DGR 2010-11-12: axis
      if (!this.axis) { this.axis= "enu"; }

      this.datum = new Proj4js.datum(this);
  }
});

Proj4js.Proj.longlat = {
  init: function() {
    //no-op for longlat
  },
  forward: function(pt) {
    //identity transform
    return pt;
  },
  inverse: function(pt) {
    //identity transform
    return pt;
  }
};
Proj4js.Proj.identity = Proj4js.Proj.longlat;

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
*/
Proj4js.defs = {
  // These are so widely used, we'll go ahead and throw them in
  // without requiring a separate .js file
  'WGS84': "+title=WGS 84 (long/lat) +proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees",
  'EPSG:4326': "+title=WGS 84 (long/lat) +proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees",
  'EPSG:4269': "+title=NAD83 (long/lat) +proj=longlat +a=6378137.0 +b=6356752.31414036 +ellps=GRS80 +datum=NAD83 +units=degrees",
  'EPSG:3857': "+title=WGS 84 / Pseudo-Mercator +proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +no_defs"
};
Proj4js.defs['EPSG:3785'] = Proj4js.defs['EPSG:3857'];  //maintain backward compat, official code is 3857
Proj4js.defs['GOOGLE'] = Proj4js.defs['EPSG:3857'];
Proj4js.defs['EPSG:900913'] = Proj4js.defs['EPSG:3857'];
Proj4js.defs['EPSG:102113'] = Proj4js.defs['EPSG:3857'];
Proj4js.common = {
  PI : 3.141592653589793238, //Math.PI,
  HALF_PI : 1.570796326794896619, //Math.PI*0.5,
  TWO_PI : 6.283185307179586477, //Math.PI*2,
  FORTPI : 0.78539816339744833,
  R2D : 57.29577951308232088,
  D2R : 0.01745329251994329577,
  SEC_TO_RAD : 4.84813681109535993589914102357e-6, /* SEC_TO_RAD = Pi/180/3600 */
  EPSLN : 1.0e-10,
  MAX_ITER : 20,
  // following constants from geocent.c
  COS_67P5 : 0.38268343236508977,  /* cosine of 67.5 degrees */
  AD_C : 1.0026000,                /* Toms region 1 constant */

  /* datum_type values */
  PJD_UNKNOWN  : 0,
  PJD_3PARAM   : 1,
  PJD_7PARAM   : 2,
  PJD_GRIDSHIFT: 3,
  PJD_WGS84    : 4,   // WGS84 or equivalent
  PJD_NODATUM  : 5,   // WGS84 or equivalent
  SRS_WGS84_SEMIMAJOR : 6378137.0,  // only used in grid shift transforms
  SRS_WGS84_ESQUARED : 0.006694379990141316, //DGR: 2012-07-29

  // ellipoid pj_set_ell.c
  SIXTH : .1666666666666666667, /* 1/6 */
  RA4   : .04722222222222222222, /* 17/360 */
  RA6   : .02215608465608465608, /* 67/3024 */
  RV4   : .06944444444444444444, /* 5/72 */
  RV6   : .04243827160493827160, /* 55/1296 */

// Function to compute the constant small m which is the radius of
//   a parallel of latitude, phi, divided by the semimajor axis.
// -----------------------------------------------------------------
  msfnz : function(eccent, sinphi, cosphi) {
      var con = eccent * sinphi;
      return cosphi/(Math.sqrt(1.0 - con * con));
  },

// Function to compute the constant small t for use in the forward
//   computations in the Lambert Conformal Conic and the Polar
//   Stereographic projections.
// -----------------------------------------------------------------
  tsfnz : function(eccent, phi, sinphi) {
    var con = eccent * sinphi;
    var com = .5 * eccent;
    con = Math.pow(((1.0 - con) / (1.0 + con)), com);
    return (Math.tan(.5 * (this.HALF_PI - phi))/con);
  },

// Function to compute the latitude angle, phi2, for the inverse of the
//   Lambert Conformal Conic and Polar Stereographic projections.
// ----------------------------------------------------------------
  phi2z : function(eccent, ts) {
    var eccnth = .5 * eccent;
    var con, dphi;
    var phi = this.HALF_PI - 2 * Math.atan(ts);
    for (var i = 0; i <= 15; i++) {
      con = eccent * Math.sin(phi);
      dphi = this.HALF_PI - 2 * Math.atan(ts *(Math.pow(((1.0 - con)/(1.0 + con)),eccnth))) - phi;
      phi += dphi;
      if (Math.abs(dphi) <= .0000000001) return phi;
    }
    alert("phi2z has NoConvergence");
    return (-9999);
  },

/* Function to compute constant small q which is the radius of a 
   parallel of latitude, phi, divided by the semimajor axis. 
------------------------------------------------------------*/
  qsfnz : function(eccent,sinphi) {
    var con;
    if (eccent > 1.0e-7) {
      con = eccent * sinphi;
      return (( 1.0- eccent * eccent) * (sinphi /(1.0 - con * con) - (.5/eccent)*Math.log((1.0 - con)/(1.0 + con))));
    } else {
      return(2.0 * sinphi);
    }
  },

/* Function to compute the inverse of qsfnz
------------------------------------------------------------*/
  iqsfnz : function (eccent, q) {
    var temp = 1.0-(1.0-eccent*eccent)/(2.0*eccent)*Math.log((1-eccent)/(1+eccent));
    if (Math.abs(Math.abs(q)-temp)<1.0E-6) {
      if (q<0.0) {
        return (-1.0*Proj4js.common.HALF_PI);
      } else {
        return Proj4js.common.HALF_PI;
      }
    }
    //var phi = 0.5* q/(1-eccent*eccent);
    var phi = Math.asin(0.5*q);
    var dphi;
    var sin_phi;
    var cos_phi;
    var con;
    for (var i=0;i<30;i++){
      sin_phi = Math.sin(phi);
      cos_phi = Math.cos(phi);
      con = eccent*sin_phi;
      dphi=Math.pow(1.0-con*con,2.0)/(2.0*cos_phi)*(q/(1-eccent*eccent)-sin_phi/(1.0-con*con)+0.5/eccent*Math.log((1.0-con)/(1.0+con)));
      phi+=dphi;
      if (Math.abs(dphi) <= .0000000001) {
        return phi;
      }
    }

    alert("IQSFN-CONV:Latitude failed to converge after 30 iterations");
    return (NaN);
  },

/* Function to eliminate roundoff errors in asin
----------------------------------------------*/
  asinz : function(x) {
    if (Math.abs(x)>1.0) {
      x=(x>1.0)?1.0:-1.0;
    }
    return Math.asin(x);
  },

// following functions from gctpc cproj.c for transverse mercator projections
  e0fn : function(x) {return(1.0-0.25*x*(1.0+x/16.0*(3.0+1.25*x)));},
  e1fn : function(x) {return(0.375*x*(1.0+0.25*x*(1.0+0.46875*x)));},
  e2fn : function(x) {return(0.05859375*x*x*(1.0+0.75*x));},
  e3fn : function(x) {return(x*x*x*(35.0/3072.0));},
  mlfn : function(e0,e1,e2,e3,phi) {return(e0*phi-e1*Math.sin(2.0*phi)+e2*Math.sin(4.0*phi)-e3*Math.sin(6.0*phi));},
  imlfn : function(ml, e0, e1, e2, e3) {
    var phi;
    var dphi;

    phi=ml/e0;
    for (var i=0;i<15;i++){
      dphi=(ml-(e0*phi-e1*Math.sin(2.0*phi)+e2*Math.sin(4.0*phi)-e3*Math.sin(6.0*phi)))/(e0-2.0*e1*Math.cos(2.0*phi)+4.0*e2*Math.cos(4.0*phi)-6.0*e3*Math.cos(6.0*phi));
      phi+=dphi;
      if (Math.abs(dphi) <= .0000000001) {
        return phi;
      }
    }

    Proj4js.reportError("IMLFN-CONV:Latitude failed to converge after 15 iterations");
    return NaN;
  },

  srat : function(esinp, exp) {
    return(Math.pow((1.0-esinp)/(1.0+esinp), exp));
  },

// Function to return the sign of an argument
  sign : function(x) { if (x < 0.0) return(-1); else return(1);},

// Function to adjust longitude to -180 to 180; input in radians
  adjust_lon : function(x) {
    x = (Math.abs(x) < this.PI) ? x: (x - (this.sign(x)*this.TWO_PI) );
    return x;
  },

// IGNF - DGR : algorithms used by IGN France

// Function to adjust latitude to -90 to 90; input in radians
  adjust_lat : function(x) {
    x= (Math.abs(x) < this.HALF_PI) ? x: (x - (this.sign(x)*this.PI) );
    return x;
  },

// Latitude Isometrique - close to tsfnz ...
  latiso : function(eccent, phi, sinphi) {
    if (Math.abs(phi) > this.HALF_PI) return +Number.NaN;
    if (phi==this.HALF_PI) return Number.POSITIVE_INFINITY;
    if (phi==-1.0*this.HALF_PI) return -1.0*Number.POSITIVE_INFINITY;

    var con= eccent*sinphi;
    return Math.log(Math.tan((this.HALF_PI+phi)/2.0))+eccent*Math.log((1.0-con)/(1.0+con))/2.0;
  },

  fL : function(x,L) {
    return 2.0*Math.atan(x*Math.exp(L)) - this.HALF_PI;
  },

// Inverse Latitude Isometrique - close to ph2z
  invlatiso : function(eccent, ts) {
    var phi= this.fL(1.0,ts);
    var Iphi= 0.0;
    var con= 0.0;
    do {
      Iphi= phi;
      con= eccent*Math.sin(Iphi);
      phi= this.fL(Math.exp(eccent*Math.log((1.0+con)/(1.0-con))/2.0),ts);
    } while (Math.abs(phi-Iphi)>1.0e-12);
    return phi;
  },

// Needed for Gauss Schreiber
// Original:  Denis Makarov (info@binarythings.com)
// Web Site:  http://www.binarythings.com
  sinh : function(x)
  {
    var r= Math.exp(x);
    r= (r-1.0/r)/2.0;
    return r;
  },

  cosh : function(x)
  {
    var r= Math.exp(x);
    r= (r+1.0/r)/2.0;
    return r;
  },

  tanh : function(x)
  {
    var r= Math.exp(x);
    r= (r-1.0/r)/(r+1.0/r);
    return r;
  },

  asinh : function(x)
  {
    var s= (x>= 0? 1.0:-1.0);
    return s*(Math.log( Math.abs(x) + Math.sqrt(x*x+1.0) ));
  },

  acosh : function(x)
  {
    return 2.0*Math.log(Math.sqrt((x+1.0)/2.0) + Math.sqrt((x-1.0)/2.0));
  },

  atanh : function(x)
  {
    return Math.log((x-1.0)/(x+1.0))/2.0;
  },

// Grande Normale
  gN : function(a,e,sinphi)
  {
    var temp= e*sinphi;
    return a/Math.sqrt(1.0 - temp*temp);
  },
  
  //code from the PROJ.4 pj_mlfn.c file;  this may be useful for other projections
  pj_enfn: function(es) {
    var en = new Array();
    en[0] = this.C00 - es * (this.C02 + es * (this.C04 + es * (this.C06 + es * this.C08)));
    en[1] = es * (this.C22 - es * (this.C04 + es * (this.C06 + es * this.C08)));
    var t = es * es;
    en[2] = t * (this.C44 - es * (this.C46 + es * this.C48));
    t *= es;
    en[3] = t * (this.C66 - es * this.C68);
    en[4] = t * es * this.C88;
    return en;
  },
  
  pj_mlfn: function(phi, sphi, cphi, en) {
    cphi *= sphi;
    sphi *= sphi;
    return(en[0] * phi - cphi * (en[1] + sphi*(en[2]+ sphi*(en[3] + sphi*en[4]))));
  },
  
  pj_inv_mlfn: function(arg, es, en) {
    var k = 1./(1.-es);
    var phi = arg;
    for (var i = Proj4js.common.MAX_ITER; i ; --i) { /* rarely goes over 2 iterations */
      var s = Math.sin(phi);
      var t = 1. - es * s * s;
      //t = this.pj_mlfn(phi, s, Math.cos(phi), en) - arg;
      //phi -= t * (t * Math.sqrt(t)) * k;
      t = (this.pj_mlfn(phi, s, Math.cos(phi), en) - arg) * (t * Math.sqrt(t)) * k;
      phi -= t;
      if (Math.abs(t) < Proj4js.common.EPSLN)
        return phi;
    }
    Proj4js.reportError("cass:pj_inv_mlfn: Convergence error");
    return phi;
  },

  /**
   * Determine correction values
   * source: nad_intr.c (DGR: 2012-07-29)
   */
  nad_intr: function(pin,ct) {
    // force computation by decreasing by 1e-7 to be as closed as possible
    // from computation under C:C++ by leveraging rounding problems ...
    var t= {"x":(pin.x-1.e-7)/ct.del[0],"y":(pin.y-1e-7)/ct.del[1]};
    var indx= {"x":Math.floor(t.x),"y":Math.floor(t.y)};
    var frct= {"x":t.x-1.0*indx.x,"y":t.y-1.0*indx.y};
    var val= {"x":Number.NaN,"y":Number.NaN};
    var inx;
    if (indx.x<0) {
      if (!(indx.x==-1 && frct.x>0.99999999999)) {
        return val;
      }
      ++indx.x;
      frct.x= 0.0;
    } else {
      inx= indx.x+1;
      if (inx>=ct.lim[0]) {
        if (!(inx==ct.lim[0] && frct.x<1e-11)) {
          return val;
        }
        --indx.x;
        frct.x= 1.0;
      }
    }
    if (indx.y<0) {
      if (!(indx.y==-1 && frct.y>0.99999999999)) {
        return val;
      }
      ++indx.y;
      frct.y= 0.0;
    } else {
      inx= indx.y+1;
      if (inx>=ct.lim[1]) {
        if (!(inx==ct.lim[1] && frct.y<1e-11)) {
          return val;
        }
        --indx.y;
        frct.y= 1.0;
      }
    }
    inx= (indx.y*ct.lim[0])+indx.x;
    var f00= {"x":ct.cvs[inx][0], "y":ct.cvs[inx][1]};
    inx++;
    var f10= {"x":ct.cvs[inx][0], "y":ct.cvs[inx][1]};
    inx+= ct.lim[0];
    var f11= {"x":ct.cvs[inx][0], "y":ct.cvs[inx][1]};
    inx--;
    var f01= {"x":ct.cvs[inx][0], "y":ct.cvs[inx][1]};
    var m11= frct.x*frct.y,             m10= frct.x*(1.0-frct.y),
        m00= (1.0-frct.x)*(1.0-frct.y), m01= (1.0-frct.x)*frct.y;
    val.x= (m00*f00.x + m10*f10.x + m01*f01.x + m11*f11.x);
    val.y= (m00*f00.y + m10*f10.y + m01*f01.y + m11*f11.y);
    return val;
  },

  /**
   * Correct value
   * source: nad_cvt.c (DGR: 2012-07-29)
   */
  nad_cvt: function(pin,inverse,ct) {
    var val= {"x":Number.NaN, "y":Number.NaN};
    if (isNaN(pin.x)) { return val; }
    var tb= {"x":pin.x, "y":pin.y};
    tb.x-= ct.ll[0];
    tb.y-= ct.ll[1];
    tb.x= Proj4js.common.adjust_lon(tb.x - Proj4js.common.PI) + Proj4js.common.PI;
    var t= Proj4js.common.nad_intr(tb,ct);
    if (inverse) {
      if (isNaN(t.x)) {
        return val;
      }
      t.x= tb.x + t.x;
      t.y= tb.y - t.y;
      var i= 9, tol= 1e-12;
      var dif, del;
      do {
        del= Proj4js.common.nad_intr(t,ct);
        if (isNaN(del.x)) {
          this.reportError("Inverse grid shift iteration failed, presumably at grid edge.  Using first approximation.");
          break;
        }
        dif= {"x":t.x-del.x-tb.x, "y":t.y+del.y-tb.y};
        t.x-= dif.x;
        t.y-= dif.y;
      } while (i-- && Math.abs(dif.x)>tol && Math.abs(dif.y)>tol);
      if (i<0) {
        this.reportError("Inverse grid shift iterator failed to converge.");
        return val;
      }
      val.x= Proj4js.common.adjust_lon(t.x+ct.ll[0]);
      val.y= t.y+ct.ll[1];
    } else {
      if (!isNaN(t.x)) {
          val.x= pin.x - t.x;
          val.y= pin.y + t.y;
      }
    }
    return val;
  },

/* meridinal distance for ellipsoid and inverse
**    8th degree - accurate to < 1e-5 meters when used in conjuction
**		with typical major axis values.
**	Inverse determines phi to EPS (1e-11) radians, about 1e-6 seconds.
*/
  C00: 1.0,
  C02: .25,
  C04: .046875,
  C06: .01953125,
  C08: .01068115234375,
  C22: .75,
  C44: .46875,
  C46: .01302083333333333333,
  C48: .00712076822916666666,
  C66: .36458333333333333333,
  C68: .00569661458333333333,
  C88: .3076171875  

};
/** datum object
*/
Proj4js.datum = Proj4js.Class({

  initialize : function(proj) {
    this.datum_type = Proj4js.common.PJD_WGS84;   //default setting
    if (!proj) { return; }
    if (proj.datumCode && proj.datumCode == 'none') {
      this.datum_type = Proj4js.common.PJD_NODATUM;
    }
    if (proj.datum_params) {
      for (var i=0; i<proj.datum_params.length; i++) {
        proj.datum_params[i]=parseFloat(proj.datum_params[i]);
      }
      if (proj.datum_params[0] != 0 || proj.datum_params[1] != 0 || proj.datum_params[2] != 0 ) {
        this.datum_type = Proj4js.common.PJD_3PARAM;
      }
      if (proj.datum_params.length > 3) {
        if (proj.datum_params[3] != 0 || proj.datum_params[4] != 0 ||
            proj.datum_params[5] != 0 || proj.datum_params[6] != 0 ) {
          this.datum_type = Proj4js.common.PJD_7PARAM;
          proj.datum_params[3] *= Proj4js.common.SEC_TO_RAD;
          proj.datum_params[4] *= Proj4js.common.SEC_TO_RAD;
          proj.datum_params[5] *= Proj4js.common.SEC_TO_RAD;
          proj.datum_params[6] = (proj.datum_params[6]/1000000.0) + 1.0;
        }
      }
    }
    // DGR 2011-03-21 : nadgrids support
    this.datum_type = proj.grids?
      Proj4js.common.PJD_GRIDSHIFT
    : this.datum_type;

    this.a = proj.a;    //datum object also uses these values
    this.b = proj.b;
    this.es = proj.es;
    this.ep2 = proj.ep2;
    this.datum_params = proj.datum_params;
    if (this.datum_type==Proj4js.common.PJD_GRIDSHIFT) {
      this.grids= proj.grids;
    }
  },

  /****************************************************************/
  // cs_compare_datums()
  //   Returns TRUE if the two datums match, otherwise FALSE.
  compare_datums : function( dest ) {
    if( this.datum_type != dest.datum_type ) {
      return false; // false, datums are not equal
    } else if( this.a != dest.a || Math.abs(this.es-dest.es) > 0.000000000050 ) {
      // the tolerence for es is to ensure that GRS80 and WGS84
      // are considered identical
      return false;
    } else if( this.datum_type == Proj4js.common.PJD_3PARAM ) {
      return (this.datum_params[0] == dest.datum_params[0]
              && this.datum_params[1] == dest.datum_params[1]
              && this.datum_params[2] == dest.datum_params[2]);
    } else if( this.datum_type == Proj4js.common.PJD_7PARAM ) {
      return (this.datum_params[0] == dest.datum_params[0]
              && this.datum_params[1] == dest.datum_params[1]
              && this.datum_params[2] == dest.datum_params[2]
              && this.datum_params[3] == dest.datum_params[3]
              && this.datum_params[4] == dest.datum_params[4]
              && this.datum_params[5] == dest.datum_params[5]
              && this.datum_params[6] == dest.datum_params[6]);
    } else if ( this.datum_type == Proj4js.common.PJD_GRIDSHIFT ||
                dest.datum_type == Proj4js.common.PJD_GRIDSHIFT ) {
      //alert("ERROR: Grid shift transformations are not implemented.");
      //return false
      //DGR 2012-07-29 lazy ...
      return this.nadgrids == dest.nadgrids;
    } else {
      return true; // datums are equal
    }
  }, // cs_compare_datums()

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
  geodetic_to_geocentric : function(p) {
    var Longitude = p.x;
    var Latitude = p.y;
    var Height = p.z ? p.z : 0;   //Z value not always supplied
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
    if( Latitude < -Proj4js.common.HALF_PI && Latitude > -1.001 * Proj4js.common.HALF_PI ) {
        Latitude = -Proj4js.common.HALF_PI;
    } else if( Latitude > Proj4js.common.HALF_PI && Latitude < 1.001 * Proj4js.common.HALF_PI ) {
        Latitude = Proj4js.common.HALF_PI;
    } else if ((Latitude < -Proj4js.common.HALF_PI) || (Latitude > Proj4js.common.HALF_PI)) {
      /* Latitude out of range */
      Proj4js.reportError('geocent:lat out of range:'+Latitude);
      return null;
    }

    if (Longitude > Proj4js.common.PI) Longitude -= (2*Proj4js.common.PI);
    Sin_Lat = Math.sin(Latitude);
    Cos_Lat = Math.cos(Latitude);
    Sin2_Lat = Sin_Lat * Sin_Lat;
    Rn = this.a / (Math.sqrt(1.0e0 - this.es * Sin2_Lat));
    X = (Rn + Height) * Cos_Lat * Math.cos(Longitude);
    Y = (Rn + Height) * Cos_Lat * Math.sin(Longitude);
    Z = ((Rn * (1 - this.es)) + Height) * Sin_Lat;

    p.x = X;
    p.y = Y;
    p.z = Z;
    return Error_Code;
  }, // cs_geodetic_to_geocentric()


  geocentric_to_geodetic : function (p) {
/* local defintions and variables */
/* end-criterium of loop, accuracy of sin(Latitude) */
var genau = 1.E-12;
var genau2 = (genau*genau);
var maxiter = 30;

    var P;        /* distance between semi-minor axis and location */
    var RR;       /* distance between center and location */
    var CT;       /* sin of geocentric latitude */
    var ST;       /* cos of geocentric latitude */
    var RX;
    var RK;
    var RN;       /* Earth radius at location */
    var CPHI0;    /* cos of start or old geodetic latitude in iterations */
    var SPHI0;    /* sin of start or old geodetic latitude in iterations */
    var CPHI;     /* cos of searched geodetic latitude */
    var SPHI;     /* sin of searched geodetic latitude */
    var SDPHI;    /* end-criterium: addition-theorem of sin(Latitude(iter)-Latitude(iter-1)) */
    var At_Pole;     /* indicates location is in polar region */
    var iter;        /* # of continous iteration, max. 30 is always enough (s.a.) */

    var X = p.x;
    var Y = p.y;
    var Z = p.z ? p.z : 0.0;   //Z value not always supplied
    var Longitude;
    var Latitude;
    var Height;

    At_Pole = false;
    P = Math.sqrt(X*X+Y*Y);
    RR = Math.sqrt(X*X+Y*Y+Z*Z);

/*      special cases for latitude and longitude */
    if (P/this.a < genau) {

/*  special case, if P=0. (X=0., Y=0.) */
        At_Pole = true;
        Longitude = 0.0;

/*  if (X,Y,Z)=(0.,0.,0.) then Height becomes semi-minor axis
 *  of ellipsoid (=center of mass), Latitude becomes PI/2 */
        if (RR/this.a < genau) {
            Latitude = Proj4js.common.HALF_PI;
            Height   = -this.b;
            return;
        }
    } else {
/*  ellipsoidal (geodetic) longitude
 *  interval: -PI < Longitude <= +PI */
        Longitude=Math.atan2(Y,X);
    }

/* --------------------------------------------------------------
 * Following iterative algorithm was developped by
 * "Institut f�r Erdmessung", University of Hannover, July 1988.
 * Internet: www.ife.uni-hannover.de
 * Iterative computation of CPHI,SPHI and Height.
 * Iteration of CPHI and SPHI to 10**-12 radian resp.
 * 2*10**-7 arcsec.
 * --------------------------------------------------------------
 */
    CT = Z/RR;
    ST = P/RR;
    RX = 1.0/Math.sqrt(1.0-this.es*(2.0-this.es)*ST*ST);
    CPHI0 = ST*(1.0-this.es)*RX;
    SPHI0 = CT*RX;
    iter = 0;

/* loop to find sin(Latitude) resp. Latitude
 * until |sin(Latitude(iter)-Latitude(iter-1))| < genau */
    do
    {
        iter++;
        RN = this.a/Math.sqrt(1.0-this.es*SPHI0*SPHI0);

/*  ellipsoidal (geodetic) height */
        Height = P*CPHI0+Z*SPHI0-RN*(1.0-this.es*SPHI0*SPHI0);

        RK = this.es*RN/(RN+Height);
        RX = 1.0/Math.sqrt(1.0-RK*(2.0-RK)*ST*ST);
        CPHI = ST*(1.0-RK)*RX;
        SPHI = CT*RX;
        SDPHI = SPHI*CPHI0-CPHI*SPHI0;
        CPHI0 = CPHI;
        SPHI0 = SPHI;
    }
    while (SDPHI*SDPHI > genau2 && iter < maxiter);

/*      ellipsoidal (geodetic) latitude */
    Latitude=Math.atan(SPHI/Math.abs(CPHI));

    p.x = Longitude;
    p.y = Latitude;
    p.z = Height;
    return p;
  }, // cs_geocentric_to_geodetic()

  /** Convert_Geocentric_To_Geodetic
   * The method used here is derived from 'An Improved Algorithm for
   * Geocentric to Geodetic Coordinate Conversion', by Ralph Toms, Feb 1996
   */
  geocentric_to_geodetic_noniter : function (p) {
    var X = p.x;
    var Y = p.y;
    var Z = p.z ? p.z : 0;   //Z value not always supplied
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
            Longitude = Proj4js.common.HALF_PI;
        }
        else if (Y < 0)
        {
            Longitude = -Proj4js.common.HALF_PI;
        }
        else
        {
            At_Pole = true;
            Longitude = 0.0;
            if (Z > 0.0)
            {  /* north pole */
                Latitude = Proj4js.common.HALF_PI;
            }
            else if (Z < 0.0)
            {  /* south pole */
                Latitude = -Proj4js.common.HALF_PI;
            }
            else
            {  /* center of earth */
                Latitude = Proj4js.common.HALF_PI;
                Height = -this.b;
                return;
            }
        }
    }
    W2 = X*X + Y*Y;
    W = Math.sqrt(W2);
    T0 = Z * Proj4js.common.AD_C;
    S0 = Math.sqrt(T0 * T0 + W2);
    Sin_B0 = T0 / S0;
    Cos_B0 = W / S0;
    Sin3_B0 = Sin_B0 * Sin_B0 * Sin_B0;
    T1 = Z + this.b * this.ep2 * Sin3_B0;
    Sum = W - this.a * this.es * Cos_B0 * Cos_B0 * Cos_B0;
    S1 = Math.sqrt(T1*T1 + Sum * Sum);
    Sin_p1 = T1 / S1;
    Cos_p1 = Sum / S1;
    Rn = this.a / Math.sqrt(1.0 - this.es * Sin_p1 * Sin_p1);
    if (Cos_p1 >= Proj4js.common.COS_67P5)
    {
        Height = W / Cos_p1 - Rn;
    }
    else if (Cos_p1 <= -Proj4js.common.COS_67P5)
    {
        Height = W / -Cos_p1 - Rn;
    }
    else
    {
        Height = Z / Sin_p1 + Rn * (this.es - 1.0);
    }
    if (At_Pole == false)
    {
        Latitude = Math.atan(Sin_p1 / Cos_p1);
    }

    p.x = Longitude;
    p.y = Latitude;
    p.z = Height;
    return p;
  }, // geocentric_to_geodetic_noniter()

  /****************************************************************/
  // pj_geocentic_to_wgs84( p )
  //  p = point to transform in geocentric coordinates (x,y,z)
  geocentric_to_wgs84 : function ( p ) {

    if( this.datum_type == Proj4js.common.PJD_3PARAM )
    {
      // if( x[io] == HUGE_VAL )
      //    continue;
      p.x += this.datum_params[0];
      p.y += this.datum_params[1];
      p.z += this.datum_params[2];

    }
    else if (this.datum_type == Proj4js.common.PJD_7PARAM)
    {
      var Dx_BF =this.datum_params[0];
      var Dy_BF =this.datum_params[1];
      var Dz_BF =this.datum_params[2];
      var Rx_BF =this.datum_params[3];
      var Ry_BF =this.datum_params[4];
      var Rz_BF =this.datum_params[5];
      var M_BF  =this.datum_params[6];
      // if( x[io] == HUGE_VAL )
      //    continue;
      var x_out = M_BF*(       p.x - Rz_BF*p.y + Ry_BF*p.z) + Dx_BF;
      var y_out = M_BF*( Rz_BF*p.x +       p.y - Rx_BF*p.z) + Dy_BF;
      var z_out = M_BF*(-Ry_BF*p.x + Rx_BF*p.y +       p.z) + Dz_BF;
      p.x = x_out;
      p.y = y_out;
      p.z = z_out;
    }
  }, // cs_geocentric_to_wgs84

  /****************************************************************/
  // pj_geocentic_from_wgs84()
  //  coordinate system definition,
  //  point to transform in geocentric coordinates (x,y,z)
  geocentric_from_wgs84 : function( p ) {

    if( this.datum_type == Proj4js.common.PJD_3PARAM )
    {
      //if( x[io] == HUGE_VAL )
      //    continue;
      p.x -= this.datum_params[0];
      p.y -= this.datum_params[1];
      p.z -= this.datum_params[2];

    }
    else if (this.datum_type == Proj4js.common.PJD_7PARAM)
    {
      var Dx_BF =this.datum_params[0];
      var Dy_BF =this.datum_params[1];
      var Dz_BF =this.datum_params[2];
      var Rx_BF =this.datum_params[3];
      var Ry_BF =this.datum_params[4];
      var Rz_BF =this.datum_params[5];
      var M_BF  =this.datum_params[6];
      var x_tmp = (p.x - Dx_BF) / M_BF;
      var y_tmp = (p.y - Dy_BF) / M_BF;
      var z_tmp = (p.z - Dz_BF) / M_BF;
      //if( x[io] == HUGE_VAL )
      //    continue;

      p.x =        x_tmp + Rz_BF*y_tmp - Ry_BF*z_tmp;
      p.y = -Rz_BF*x_tmp +       y_tmp + Rx_BF*z_tmp;
      p.z =  Ry_BF*x_tmp - Rx_BF*y_tmp +       z_tmp;
    } //cs_geocentric_from_wgs84()
  }
});

/** point object, nothing fancy, just allows values to be
    passed back and forth by reference rather than by value.
    Other point classes may be used as long as they have
    x and y properties, which will get modified in the transform method.
*/
Proj4js.Point = Proj4js.Class({

    /**
     * Constructor: Proj4js.Point
     *
     * Parameters:
     * - x {float} or {Array} either the first coordinates component or
     *     the full coordinates
     * - y {float} the second component
     * - z {float} the third component, optional.
     */
    initialize : function(x,y,z) {
      if (typeof x == 'object') {
        this.x = x[0];
        this.y = x[1];
        this.z = x[2] || 0.0;
      } else if (typeof x == 'string' && typeof y == 'undefined') {
        var coords = x.split(',');
        this.x = parseFloat(coords[0]);
        this.y = parseFloat(coords[1]);
        this.z = parseFloat(coords[2]) || 0.0;
      } else {
        this.x = x;
        this.y = y;
        this.z = z || 0.0;
      }
    },

    /**
     * APIMethod: clone
     * Build a copy of a Proj4js.Point object.
     *
     * Return:
     * {Proj4js}.Point the cloned point.
     */
    clone : function() {
      return new Proj4js.Point(this.x, this.y, this.z);
    },

    /**
     * APIMethod: toString
     * Return a readable string version of the point
     *
     * Return:
     * {String} String representation of Proj4js.Point object. 
     *           (ex. <i>"x=5,y=42"</i>)
     */
    toString : function() {
        return ("x=" + this.x + ",y=" + this.y);
    },

    /** 
     * APIMethod: toShortString
     * Return a short string version of the point.
     *
     * Return:
     * {String} Shortened String representation of Proj4js.Point object. 
     *         (ex. <i>"5, 42"</i>)
     */
    toShortString : function() {
        return (this.x + ", " + this.y);
    }
});

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
 * application using a <script> tag or Proj4js can load CS initialization 
 * strings from a local directory or a web service such as spatialreference.org.
 *
 * Similarly, Proj4js must have access to projection transform code.  These can
 * be included individually using a <script> tag in your page, built into a 
 * custom build of Proj4js or loaded dynamically at run-time.  Using the
 * -combined and -compressed versions of Proj4js includes all projection class
 * code by default.
 *
 * Note that dynamic loading of defs and code happens ascynchrously, check the
 * Proj.readyToUse flag before using the Proj object.  If the defs and code
 * required by your application are loaded through script tags, dynamic loading
 * is not required and the Proj object will be readyToUse on return from the 
 * constructor.
 * 
 * All coordinates are handled as points which have a .x and a .y property
 * which will be modified in place.
 *
 * Override Proj4js.reportError for output of alerts and warnings.
 *
 * See http://trac.osgeo.org/proj4js/wiki/UserGuide for full details.
*/

/**
 * Global namespace object for Proj4js library
 */
var Proj4js = {

    /**
     * Property: defaultDatum
     * The datum to use when no others a specified
     */
    defaultDatum: 'WGS84',                  //default datum

    /** 
    * Method: transform(source, dest, point)
    * Transform a point coordinate from one map projection to another.  This is
    * really the only public method you should need to use.
    *
    * Parameters:
    * source - {Proj4js.Proj} source map projection for the transformation
    * dest - {Proj4js.Proj} destination map projection for the transformation
    * point - {Object} point to transform, may be geodetic (long, lat) or
    *     projected Cartesian (x,y), but should always have x,y properties.
    */
    transform: function(source, dest, point) {
        if (!source.readyToUse) {
            this.reportError("Proj4js initialization for:"+source.srsCode+" not yet complete");
            return point;
        }
        if (!dest.readyToUse) {
            this.reportError("Proj4js initialization for:"+dest.srsCode+" not yet complete");
            return point;
        }
        
        // Workaround for datum shifts towgs84, if either source or destination projection is not wgs84
        if (source.datum && dest.datum && (
            ((source.datum.datum_type == Proj4js.common.PJD_3PARAM || source.datum.datum_type == Proj4js.common.PJD_7PARAM) && dest.datumCode != "WGS84") ||
            ((dest.datum.datum_type == Proj4js.common.PJD_3PARAM || dest.datum.datum_type == Proj4js.common.PJD_7PARAM) && source.datumCode != "WGS84"))) {
            var wgs84 = Proj4js.WGS84;
            this.transform(source, wgs84, point);
            source = wgs84;
        }

        // DGR, 2010/11/12
        if (source.axis!="enu") {
            this.adjust_axis(source,false,point);
        }

        // Transform source points to long/lat, if they aren't already.
        if (source.projName=="longlat") {
            point.x *= Proj4js.common.D2R;  // convert degrees to radians
            point.y *= Proj4js.common.D2R;
        } else {
            if (source.to_meter) {
                point.x *= source.to_meter;
                point.y *= source.to_meter;
            }
            source.inverse(point); // Convert Cartesian to longlat
        }

        // Adjust for the prime meridian if necessary
        if (source.from_greenwich) { 
            point.x += source.from_greenwich; 
        }

        // Convert datums if needed, and if possible.
        point = this.datum_transform( source.datum, dest.datum, point );

        // Adjust for the prime meridian if necessary
        if (dest.from_greenwich) {
            point.x -= dest.from_greenwich;
        }

        if (dest.projName=="longlat") {
            // convert radians to decimal degrees
            point.x *= Proj4js.common.R2D;
            point.y *= Proj4js.common.R2D;
        } else  {               // else project
            dest.forward(point);
            if (dest.to_meter) {
                point.x /= dest.to_meter;
                point.y /= dest.to_meter;
            }
        }

        // DGR, 2010/11/12
        if (dest.axis!="enu") {
            this.adjust_axis(dest,true,point);
        }

        return point;
    }, // transform()

    /** datum_transform()
      source coordinate system definition,
      destination coordinate system definition,
      point to transform in geodetic coordinates (long, lat, height)
    */
    datum_transform : function( source, dest, point ) {

      // Short cut if the datums are identical.
      if( source.compare_datums( dest ) ) {
          return point; // in this case, zero is sucess,
                    // whereas cs_compare_datums returns 1 to indicate TRUE
                    // confusing, should fix this
      }

      // Explicitly skip datum transform by setting 'datum=none' as parameter for either source or dest
      if( source.datum_type == Proj4js.common.PJD_NODATUM
          || dest.datum_type == Proj4js.common.PJD_NODATUM) {
          return point;
      }

      //DGR: 2012-07-29 : add nadgrids support (begin)
      var src_a = source.a;
      var src_es = source.es;

      var dst_a = dest.a;
      var dst_es = dest.es;

      var fallback= source.datum_type;
      // If this datum requires grid shifts, then apply it to geodetic coordinates.
      if( fallback == Proj4js.common.PJD_GRIDSHIFT )
      {
          if (this.apply_gridshift( source, 0, point )==0) {
            source.a = Proj4js.common.SRS_WGS84_SEMIMAJOR;
            source.es = Proj4js.common.SRS_WGS84_ESQUARED;
          } else {

              // try 3 or 7 params transformation or nothing ?
              if (!source.datum_params) {
                  source.a = src_a;
                  source.es = source.es;
                  return point;
              }
              var wp= 1.0;
              for (var i= 0, l= source.datum_params.length; i<l; i++) {
                wp*= source.datum_params[i];
              }
              if (wp==0.0) {
                source.a = src_a;
                source.es = source.es;
                return point;
              }
              fallback= source.datum_params.length>3?
                Proj4js.common.PJD_7PARAM
              : Proj4js.common.PJD_3PARAM;
              // CHECK_RETURN;
          }
      }

      if( dest.datum_type == Proj4js.common.PJD_GRIDSHIFT )
      {
          dest.a = Proj4js.common.SRS_WGS84_SEMIMAJOR;
          dest.es = Proj4js.common.SRS_WGS84_ESQUARED;
      }
      // Do we need to go through geocentric coordinates?
      if (source.es != dest.es || source.a != dest.a
          || fallback == Proj4js.common.PJD_3PARAM
          || fallback == Proj4js.common.PJD_7PARAM
          || dest.datum_type == Proj4js.common.PJD_3PARAM
          || dest.datum_type == Proj4js.common.PJD_7PARAM)
      {
      //DGR: 2012-07-29 : add nadgrids support (end)

        // Convert to geocentric coordinates.
        source.geodetic_to_geocentric( point );
        // CHECK_RETURN;

        // Convert between datums
        if( source.datum_type == Proj4js.common.PJD_3PARAM || source.datum_type == Proj4js.common.PJD_7PARAM ) {
          source.geocentric_to_wgs84(point);
          // CHECK_RETURN;
        }

        if( dest.datum_type == Proj4js.common.PJD_3PARAM || dest.datum_type == Proj4js.common.PJD_7PARAM ) {
          dest.geocentric_from_wgs84(point);
          // CHECK_RETURN;
        }

        // Convert back to geodetic coordinates
        dest.geocentric_to_geodetic( point );
          // CHECK_RETURN;
      }

      // Apply grid shift to destination if required
      if( dest.datum_type == Proj4js.common.PJD_GRIDSHIFT )
      {
          this.apply_gridshift( dest, 1, point);
          // CHECK_RETURN;
      }

      source.a = src_a;
      source.es = src_es;
      dest.a = dst_a;
      dest.es = dst_es;

      return point;
    }, // cs_datum_transform

    /**
     * This is the real workhorse, given a gridlist
     * DGR: 2012-07-29 addition based on proj4 trunk
     */
    apply_gridshift : function(srs,inverse,point) {
        if (srs.grids==null || srs.grids.length==0) {
            return -38;
        }
        var input= {"x":point.x, "y":point.y};
        var output= {"x":Number.NaN, "y":Number.NaN};
        /* keep trying till we find a table that works */
        var onlyMandatoryGrids= false;
        for (var i= 0, l= srs.grids.length; i<l; i++) {
            var gi= srs.grids[i];
            onlyMandatoryGrids= gi.mandatory;
            var ct= gi.grid;
            if (ct==null) {
                if (gi.mandatory) {
                    this.reportError("unable to find '"+gi.name+"' grid.");
                    return -48;
                }
                continue;//optional grid
            } 
            /* skip tables that don't match our point at all.  */
            var epsilon= (Math.abs(ct.del[1])+Math.abs(ct.del[0]))/10000.0;
            if( ct.ll[1]-epsilon>input.y || ct.ll[0]-epsilon>input.x ||
                ct.ll[1]+(ct.lim[1]-1)*ct.del[1]+epsilon<input.y ||
                ct.ll[0]+(ct.lim[0]-1)*ct.del[0]+epsilon<input.x ) {
                continue;
            }
            /* If we have child nodes, check to see if any of them apply. */
            /* TODO : only plain grid has been implemented ... */
            /* we found a more refined child node to use */
            /* load the grid shift info if we don't have it. */
            /* TODO : Proj4js.grids pre-loaded (as they can be huge ...) */
            /* skip numerical computing error when "null" grid (identity grid): */
            if (gi.name=="null") {
                output.x= input.x;
                output.y= input.y;
            } else {
                output= Proj4js.common.nad_cvt(input, inverse, ct);
            }
            if (!isNaN(output.x)) {
                break;
            }
        }
        if (isNaN(output.x)) {
            if (!onlyMandatoryGrids) {
                this.reportError("failed to find a grid shift table for location '"+
                    input.x*Proj4js.common.R2D+" "+input.y*Proj4js.common.R2D+
                    " tried: '"+srs.nadgrids+"'");
                return -48;
            }
            return -1;//FIXME: no shift applied ...
        }
        point.x= output.x;
        point.y= output.y;
        return 0;
    },

    /**
     * Function: adjust_axis
     * Normalize or de-normalized the x/y/z axes.  The normal form is "enu"
     * (easting, northing, up).
     * Parameters:
     * crs {Proj4js.Proj} the coordinate reference system
     * denorm {Boolean} when false, normalize
     * point {Object} the coordinates to adjust
     */
    adjust_axis: function(crs, denorm, point) {
        var xin= point.x, yin= point.y, zin= point.z || 0.0;
        var v, t;
        for (var i= 0; i<3; i++) {
            if (denorm && i==2 && point.z===undefined) { continue; }
                 if (i==0) { v= xin; t= 'x'; }
            else if (i==1) { v= yin; t= 'y'; }
            else           { v= zin; t= 'z'; }
            switch(crs.axis[i]) {
            case 'e':
                point[t]= v;
                break;
            case 'w':
                point[t]= -v;
                break;
            case 'n':
                point[t]= v;
                break;
            case 's':
                point[t]= -v;
                break;
            case 'u':
                if (point[t]!==undefined) { point.z= v; }
                break;
            case 'd':
                if (point[t]!==undefined) { point.z= -v; }
                break;
            default :
                alert("ERROR: unknow axis ("+crs.axis[i]+") - check definition of "+crs.projName);
                return null;
            }
        }
        return point;
    },

    /**
     * Function: reportError
     * An internal method to report errors back to user. 
     * Override this in applications to report error messages or throw exceptions.
     */
    reportError: function(msg) {
      //console.log(msg);
    },

/**
 *
 * Title: Private Methods
 * The following properties and methods are intended for internal use only.
 *
 * This is a minimal implementation of JavaScript inheritance methods so that 
 * Proj4js can be used as a stand-alone library.
 * These are copies of the equivalent OpenLayers methods at v2.7
 */
 
/**
 * Function: extend
 * Copy all properties of a source object to a destination object.  Modifies
 *     the passed in destination object.  Any properties on the source object
 *     that are set to undefined will not be (re)set on the destination object.
 *
 * Parameters:
 * destination - {Object} The object that will be modified
 * source - {Object} The object with properties to be set on the destination
 *
 * Returns:
 * {Object} The destination object.
 */
    extend: function(destination, source) {
      destination = destination || {};
      if(source) {
          for(var property in source) {
              var value = source[property];
              if(value !== undefined) {
                  destination[property] = value;
              }
          }
      }
      return destination;
    },

/**
 * Constructor: Class
 * Base class used to construct all other classes. Includes support for 
 *     multiple inheritance. 
 *  
 */
    Class: function() {
      var Class = function() {
          this.initialize.apply(this, arguments);
      };
  
      var extended = {};
      var parent;
      for(var i=0; i<arguments.length; ++i) {
          if(typeof arguments[i] == "function") {
              // get the prototype of the superclass
              parent = arguments[i].prototype;
          } else {
              // in this case we're extending with the prototype
              parent = arguments[i];
          }
          Proj4js.extend(extended, parent);
      }
      Class.prototype = extended;
      
      return Class;
    },

    /**
     * Function: bind
     * Bind a function to an object.  Method to easily create closures with
     *     'this' altered.
     * 
     * Parameters:
     * func - {Function} Input function.
     * object - {Object} The object to bind to the input function (as this).
     * 
     * Returns:
     * {Function} A closure with 'this' set to the passed in object.
     */
    bind: function(func, object) {
        // create a reference to all arguments past the second one
        var args = Array.prototype.slice.apply(arguments, [2]);
        return function() {
            // Push on any additional arguments from the actual function call.
            // These will come after those sent to the bind call.
            var newArgs = args.concat(
                Array.prototype.slice.apply(arguments, [0])
            );
            return func.apply(object, newArgs);
        };
    },
    
/**
 * The following properties and methods handle dynamic loading of JSON objects.
 */
 
    /**
     * Property: scriptName
     * {String} The filename of this script without any path.
     */
    scriptName: "proj4js.js",

    /**
     * Property: defsLookupService
     * AJAX service to retreive projection definition parameters from
     */
    defsLookupService: 'http://spatialreference.org/ref',

    /**
     * Property: libPath
     * internal: http server path to library code.
     */
    libPath: null,

    /**
     * Function: getScriptLocation
     * Return the path to this script.
     *
     * Returns:
     * Path to this script
     */
    getScriptLocation: function () {
        if (this.libPath) return this.libPath;
        var scriptName = this.scriptName;
        var scriptNameLen = scriptName.length;

        var scripts = document.getElementsByTagName('script');
        for (var i = 0; i < scripts.length; i++) {
            var src = scripts[i].getAttribute('src');
            if (src) {
                var index = src.lastIndexOf(scriptName);
                // is it found, at the end of the URL?
                if ((index > -1) && (index + scriptNameLen == src.length)) {
                    this.libPath = src.slice(0, -scriptNameLen);
                    break;
                }
            }
        }
        return this.libPath||"";
    },

    /**
     * Function: loadScript
     * Load a JS file from a URL into a <script> tag in the page.
     * 
     * Parameters:
     * url - {String} The URL containing the script to load
     * onload - {Function} A method to be executed when the script loads successfully
     * onfail - {Function} A method to be executed when there is an error loading the script
     * loadCheck - {Function} A boolean method that checks to see if the script 
     *            has loaded.  Typically this just checks for the existance of
     *            an object in the file just loaded.
     */
    loadScript: function(url, onload, onfail, loadCheck) {
      var script = document.createElement('script');
      script.defer = false;
      script.type = "text/javascript";
      script.id = url;
      script.onload = onload;
      script.onerror = onfail;
      script.loadCheck = loadCheck;
      if (/MSIE/.test(navigator.userAgent)) {
        script.onreadystatechange = this.checkReadyState;
      }
      document.getElementsByTagName('head')[0].appendChild(script);
      script.src = url;
    },
    
    /**
     * Function: checkReadyState
     * IE workaround since there is no onerror handler.  Calls the user defined 
     * loadCheck method to determine if the script is loaded.
     * 
     */
    checkReadyState: function() {
      if (this.readyState == 'loaded') {
        if (!this.loadCheck()) {
          this.onerror();
        } else {
          this.onload();
        }
      }
    }
};

/**
 * Class: Proj4js.Proj
 *
 * Proj objects provide transformation methods for point coordinates
 * between geodetic latitude/longitude and a projected coordinate system. 
 * once they have been initialized with a projection code.
 *
 * Initialization of Proj objects is with a projection code, usually EPSG codes,
 * which is the key that will be used with the Proj4js.defs array.
 * 
 * The code passed in will be stripped of colons and converted to uppercase
 * to locate projection definition files.
 *
 * A projection object has properties for units and title strings.
 */
Proj4js.Proj = Proj4js.Class({

  /**
   * Property: readyToUse
   * Flag to indicate if initialization is complete for this Proj object
   */
  readyToUse: false,   
  
  /**
   * Property: title
   * The title to describe the projection
   */
  title: null,  
  
  /**
   * Property: projName
   * The projection class for this projection, e.g. lcc (lambert conformal conic,
   * or merc for mercator).  These are exactly equivalent to their Proj4 
   * counterparts.
   */
  projName: null,
  /**
   * Property: units
   * The units of the projection.  Values include 'm' and 'degrees'
   */
  units: null,
  /**
   * Property: datum
   * The datum specified for the projection
   */
  datum: null,
  /**
   * Property: x0
   * The x coordinate origin
   */
  x0: 0,
  /**
   * Property: y0
   * The y coordinate origin
   */
  y0: 0,
  /**
   * Property: localCS
   * Flag to indicate if the projection is a local one in which no transforms
   * are required.
   */
  localCS: false,

  /**
  * Property: queue
  * Buffer (FIFO) to hold callbacks waiting to be called when projection loaded.
  */
  queue: null,

  /**
  * Constructor: initialize
  * Constructor for Proj4js.Proj objects
  *
  * Parameters:
  * srsCode - a code for map projection definition parameters.  These are usually
  * (but not always) EPSG codes.
  */
  initialize: function(srsCode, callback) {
      this.srsCodeInput = srsCode;
      
      //Register callbacks prior to attempting to process definition
      this.queue = [];
      if( callback ){
           this.queue.push( callback );
      }
      
      //check to see if this is a WKT string
      if ((srsCode.indexOf('GEOGCS') >= 0) ||
          (srsCode.indexOf('GEOCCS') >= 0) ||
          (srsCode.indexOf('PROJCS') >= 0) ||
          (srsCode.indexOf('LOCAL_CS') >= 0)) {
            this.parseWKT(srsCode);
            this.deriveConstants();
            this.loadProjCode(this.projName);
            return;
      }
      
      // DGR 2008-08-03 : support urn and url
      if (srsCode.indexOf('urn:') == 0) {
          //urn:ORIGINATOR:def:crs:CODESPACE:VERSION:ID
          var urn = srsCode.split(':');
          if ((urn[1] == 'ogc' || urn[1] =='x-ogc') &&
              (urn[2] =='def') &&
              (urn[3] =='crs')) {
              srsCode = urn[4]+':'+urn[urn.length-1];
          }
      } else if (srsCode.indexOf('http://') == 0) {
          //url#ID
          var url = srsCode.split('#');
          if (url[0].match(/epsg.org/)) {
            // http://www.epsg.org/#
            srsCode = 'EPSG:'+url[1];
          } else if (url[0].match(/RIG.xml/)) {
            //http://librairies.ign.fr/geoportail/resources/RIG.xml#
            //http://interop.ign.fr/registers/ign/RIG.xml#
            srsCode = 'IGNF:'+url[1];
          } else if (url[0].indexOf('/def/crs/')!=-1) {
            // http://www.opengis.net/def/crs/EPSG/0/code
            url= srsCode.split('/');
            srsCode = url.pop();//code
            url.pop();//version FIXME
            srsCode = url.pop()+':'+srsCode;//authority
          }
      }
      this.srsCode = srsCode.toUpperCase();
      if (this.srsCode.indexOf("EPSG") == 0) {
          this.srsCode = this.srsCode;
          this.srsAuth = 'epsg';
          this.srsProjNumber = this.srsCode.substring(5);
      // DGR 2007-11-20 : authority IGNF
      } else if (this.srsCode.indexOf("IGNF") == 0) {
          this.srsCode = this.srsCode;
          this.srsAuth = 'IGNF';
          this.srsProjNumber = this.srsCode.substring(5);
      // DGR 2008-06-19 : pseudo-authority CRS for WMS
      } else if (this.srsCode.indexOf("CRS") == 0) {
          this.srsCode = this.srsCode;
          this.srsAuth = 'CRS';
          this.srsProjNumber = this.srsCode.substring(4);
      } else {
          this.srsAuth = '';
          this.srsProjNumber = this.srsCode;
      }
      
      this.loadProjDefinition();
  },
  
/**
 * Function: loadProjDefinition
 *    Loads the coordinate system initialization string if required.
 *    Note that dynamic loading happens asynchronously so an application must 
 *    wait for the readyToUse property is set to true.
 *    To prevent dynamic loading, include the defs through a script tag in
 *    your application.
 *
 */
    loadProjDefinition: function() {
      //check in memory
      if (Proj4js.defs[this.srsCode]) {
        this.defsLoaded();
        return;
      }

      //else check for def on the server
      var url = Proj4js.getScriptLocation() + 'defs/' + this.srsAuth.toUpperCase() + this.srsProjNumber + '.js';
      Proj4js.loadScript(url, 
                Proj4js.bind(this.defsLoaded, this),
                Proj4js.bind(this.loadFromService, this),
                Proj4js.bind(this.checkDefsLoaded, this) );
    },

/**
 * Function: loadFromService
 *    Creates the REST URL for loading the definition from a web service and 
 *    loads it.
 *
 */
    loadFromService: function() {
      //else load from web service
      var url = Proj4js.defsLookupService +'/' + this.srsAuth +'/'+ this.srsProjNumber + '/proj4js/';
      Proj4js.loadScript(url, 
            Proj4js.bind(this.defsLoaded, this),
            Proj4js.bind(this.defsFailed, this),
            Proj4js.bind(this.checkDefsLoaded, this) );
    },

/**
 * Function: defsLoaded
 * Continues the Proj object initilization once the def file is loaded
 *
 */
    defsLoaded: function() {
      this.parseDefs();
      this.loadProjCode(this.projName);
    },
    
/**
 * Function: checkDefsLoaded
 *    This is the loadCheck method to see if the def object exists
 *
 */
    checkDefsLoaded: function() {
      if (Proj4js.defs[this.srsCode]) {
        return true;
      } else {
        return false;
      }
    },

 /**
 * Function: defsFailed
 *    Report an error in loading the defs file, but continue on using WGS84
 *
 */
   defsFailed: function() {
      Proj4js.reportError('failed to load projection definition for: '+this.srsCode);
      Proj4js.defs[this.srsCode] = Proj4js.defs['WGS84'];  //set it to something so it can at least continue
      this.defsLoaded();
    },

/**
 * Function: loadProjCode
 *    Loads projection class code dynamically if required.
 *     Projection code may be included either through a script tag or in
 *     a built version of proj4js
 *
 */
    loadProjCode: function(projName) {
      if (Proj4js.Proj[projName]) {
        this.initTransforms();
        return;
      }

      //the URL for the projection code
      var url = Proj4js.getScriptLocation() + 'projCode/' + projName + '.js';
      Proj4js.loadScript(url, 
              Proj4js.bind(this.loadProjCodeSuccess, this, projName),
              Proj4js.bind(this.loadProjCodeFailure, this, projName), 
              Proj4js.bind(this.checkCodeLoaded, this, projName) );
    },

 /**
 * Function: loadProjCodeSuccess
 *    Loads any proj dependencies or continue on to final initialization.
 *
 */
    loadProjCodeSuccess: function(projName) {
      if (Proj4js.Proj[projName].dependsOn){
        this.loadProjCode(Proj4js.Proj[projName].dependsOn);
      } else {
        this.initTransforms();
      }
    },

 /**
 * Function: defsFailed
 *    Report an error in loading the proj file.  Initialization of the Proj
 *    object has failed and the readyToUse flag will never be set.
 *
 */
    loadProjCodeFailure: function(projName) {
      Proj4js.reportError("failed to find projection file for: " + projName);
      //TBD initialize with identity transforms so proj will still work?
    },
    
/**
 * Function: checkCodeLoaded
 *    This is the loadCheck method to see if the projection code is loaded
 *
 */
    checkCodeLoaded: function(projName) {
      if (Proj4js.Proj[projName]) {
        return true;
      } else {
        return false;
      }
    },

/**
 * Function: initTransforms
 *    Finalize the initialization of the Proj object
 *
 */
    initTransforms: function() {
      Proj4js.extend(this, Proj4js.Proj[this.projName]);
      this.init();
      this.readyToUse = true;
      if( this.queue ) {
        var item;
        while( (item = this.queue.shift()) ) {
          item.call( this, this );
        }
      }
  },

/**
 * Function: parseWKT
 * Parses a WKT string to get initialization parameters
 *
 */
 wktRE: /^(\w+)\[(.*)\]$/,
 parseWKT: function(wkt) {
    var wktMatch = wkt.match(this.wktRE);
    if (!wktMatch) return;
    var wktObject = wktMatch[1];
    var wktContent = wktMatch[2];
    var wktTemp = wktContent.split(",");
    var wktName;
    if (wktObject.toUpperCase() == "TOWGS84") {
      wktName = wktObject;  //no name supplied for the TOWGS84 array
    } else {
      wktName = wktTemp.shift();
    }
    wktName = wktName.replace(/^\"/,"");
    wktName = wktName.replace(/\"$/,"");
    
    /*
    wktContent = wktTemp.join(",");
    var wktArray = wktContent.split("],");
    for (var i=0; i<wktArray.length-1; ++i) {
      wktArray[i] += "]";
    }
    */
    
    var wktArray = new Array();
    var bkCount = 0;
    var obj = "";
    for (var i=0; i<wktTemp.length; ++i) {
      var token = wktTemp[i];
      for (var j=0; j<token.length; ++j) {
        if (token.charAt(j) == "[") ++bkCount;
        if (token.charAt(j) == "]") --bkCount;
      }
      obj += token;
      if (bkCount === 0) {
        wktArray.push(obj);
        obj = "";
      } else {
        obj += ",";
      }
    }
    
    //do something based on the type of the wktObject being parsed
    //add in variations in the spelling as required
    switch (wktObject) {
      case 'LOCAL_CS':
        this.projName = 'identity';
        this.localCS = true;
        this.srsCode = wktName;
        break;
      case 'GEOGCS':
        this.projName = 'longlat';
        this.geocsCode = wktName;
        if (!this.srsCode) this.srsCode = wktName;
        break;
      case 'PROJCS':
        this.srsCode = wktName;
        break;
      case 'GEOCCS':
        break;
      case 'PROJECTION':
        this.projName = Proj4js.wktProjections[wktName];
        break;
      case 'DATUM':
        this.datumName = wktName;
        break;
      case 'LOCAL_DATUM':
        this.datumCode = 'none';
        break;
      case 'SPHEROID':
        this.ellps = wktName;
        this.a = parseFloat(wktArray.shift());
        this.rf = parseFloat(wktArray.shift());
        break;
      case 'PRIMEM':
        this.from_greenwich = parseFloat(wktArray.shift()); //to radians?
        break;
      case 'UNIT':
        this.units = wktName;
        this.unitsPerMeter = parseFloat(wktArray.shift());
        break;
      case 'PARAMETER':
        var name = wktName.toLowerCase();
        var value = parseFloat(wktArray.shift());
        //there may be many variations on the wktName values, add in case
        //statements as required
        switch (name) {
          case 'false_easting':
            this.x0 = value;
            break;
          case 'false_northing':
            this.y0 = value;
            break;
          case 'scale_factor':
            this.k0 = value;
            break;
          case 'central_meridian':
            this.long0 = value*Proj4js.common.D2R;
            break;
          case 'latitude_of_origin':
            this.lat0 = value*Proj4js.common.D2R;
            break;
          case 'more_here':
            break;
          default:
            break;
        }
        break;
      case 'TOWGS84':
        this.datum_params = wktArray;
        break;
      //DGR 2010-11-12: AXIS
      case 'AXIS':
        var name= wktName.toLowerCase();
        var value= wktArray.shift();
        switch (value) {
          case 'EAST' : value= 'e'; break;
          case 'WEST' : value= 'w'; break;
          case 'NORTH': value= 'n'; break;
          case 'SOUTH': value= 's'; break;
          case 'UP'   : value= 'u'; break;
          case 'DOWN' : value= 'd'; break;
          case 'OTHER':
          default     : value= ' '; break;//FIXME
        }
        if (!this.axis) { this.axis= "enu"; }
        switch(name) {
          case 'x': this.axis=                         value + this.axis.substr(1,2); break;
          case 'y': this.axis= this.axis.substr(0,1) + value + this.axis.substr(2,1); break;
          case 'z': this.axis= this.axis.substr(0,2) + value                        ; break;
          default : break;
        }
      case 'MORE_HERE':
        break;
      default:
        break;
    }
    for (var i=0; i<wktArray.length; ++i) {
      this.parseWKT(wktArray[i]);
    }
 },

/**
 * Function: parseDefs
 * Parses the PROJ.4 initialization string and sets the associated properties.
 *
 */
  parseDefs: function() {
      var re= new RegExp('(title|proj|units|datum|nadgrids|'+
                         'ellps|a|b|rf|'+
                         'lat_0|lat_1|lat_2|lat_ts|lon_0|lon_1|lon_2|alpha|lonc|'+
                         'x_0|y_0|k_0|k|r_a|zone|south|'+
                         'towgs84|to_meter|from_greenwich|pm|axis|czech|'+
                         'wktext|no_rot|no_off|no_defs)');
      this.defData = Proj4js.defs[this.srsCode];
      var paramName, paramVal;
      if (!this.defData) {
        return;
      }
      var paramArray=this.defData.split("+");

      for (var prop=0; prop<paramArray.length; prop++) {
          var property = paramArray[prop].split("=");
          paramName = property[0].toLowerCase();
          paramVal = property[1];

          switch (paramName.replace(/\s/gi,"")) {  // trim out spaces
              case "": break;   // throw away nameless parameter
              // DGR 2012-10-13 : + in title (EPSG:2056: CH1903+ / LV95)
              case "title":  this.title = paramVal;
                             while (!paramArray[prop+1].match(re)) {
                               this.title+= '+'+paramArray[++prop];
                             }
                             break;
              case "proj":   this.projName =  paramVal.replace(/\s/gi,""); break;
              case "units":  this.units = paramVal.replace(/\s/gi,""); break;
              case "datum":  this.datumCode = paramVal.replace(/\s/gi,""); break;
              // DGR 2011-03-20 : nagrids -> nadgrids
              case "nadgrids": this.nadgrids = paramVal.replace(/\s/gi,""); break;// DGR 2012-07-29
              case "ellps":  this.ellps = paramVal.replace(/\s/gi,""); break;
              case "a":      this.a =  parseFloat(paramVal); break;  // semi-major radius
              case "b":      this.b =  parseFloat(paramVal); break;  // semi-minor radius
              // DGR 2007-11-20
              case "rf":     this.rf = parseFloat(paramVal); break; // inverse flattening rf= a/(a-b)
              case "lat_0":  this.lat0 = paramVal*Proj4js.common.D2R; break;        // phi0, central latitude
              case "lat_1":  this.lat1 = paramVal*Proj4js.common.D2R; break;        //standard parallel 1
              case "lat_2":  this.lat2 = paramVal*Proj4js.common.D2R; break;        //standard parallel 2
              case "lat_ts": this.lat_ts = paramVal*Proj4js.common.D2R; break;      // used in merc and eqc
              case "lon_0":  this.long0 = paramVal*Proj4js.common.D2R; break;       // lam0, central longitude
              case "lon_1":  this.long1 = paramVal*Proj4js.common.D2R; break;
              case "lon_2":  this.long2 = paramVal*Proj4js.common.D2R; break;
              case "no_rot": this.no_rot = true; break;
              case "no_off": this.no_off = true; break;
              case "alpha":  this.alpha =  parseFloat(paramVal)*Proj4js.common.D2R; break;  //for somerc projection
              case "lonc":   this.longc = paramVal*Proj4js.common.D2R; break;       //for somerc projection
              case "x_0":    this.x0 = parseFloat(paramVal); break;  // false easting
              case "y_0":    this.y0 = parseFloat(paramVal); break;  // false northing
              case "k_0":    this.k0 = parseFloat(paramVal); break;  // projection scale factor
              case "k":      this.k0 = parseFloat(paramVal); break;  // both forms returned
              case "r_a":    this.R_A = true; break;                 // sphere--area of ellipsoid
              case "zone":   this.zone = parseInt(paramVal,10); break;  // UTM Zone
              case "south":   this.utmSouth = true; break;  // UTM north/south
              case "towgs84":this.datum_params = paramVal.split(","); break;
              case "to_meter": this.to_meter = parseFloat(paramVal); break; // cartesian scaling
              case "from_greenwich": this.from_greenwich = paramVal*Proj4js.common.D2R; break;
              case "czech": this.czech = true; break;
              // DGR 2008-07-09 : if pm is not a well-known prime meridian take
              // the value instead of 0.0, then convert to radians
              case "pm":     paramVal = paramVal.replace(/\s/gi,"");
                             this.from_greenwich = Proj4js.PrimeMeridian[paramVal] ?
                                Proj4js.PrimeMeridian[paramVal] : parseFloat(paramVal);
                             this.from_greenwich *= Proj4js.common.D2R; 
                             break;
              // DGR 2010-11-12: axis
              case "axis":   paramVal = paramVal.replace(/\s/gi,"");
                             var legalAxis= "ewnsud";
                             if (paramVal.length==3 &&
                                 legalAxis.indexOf(paramVal.substr(0,1))!=-1 &&
                                 legalAxis.indexOf(paramVal.substr(1,1))!=-1 &&
                                 legalAxis.indexOf(paramVal.substr(2,1))!=-1) {
                                this.axis= paramVal;
                             } //FIXME: be silent ?
                             break;
              case "wktext": break;//DGR 2012-07-29
              case "no_defs": break;
              default: //alert("Unrecognized parameter: " + paramName);
          } // switch()
      } // for paramArray
      this.deriveConstants();
  },

/**
 * Function: deriveConstants
 * Sets several derived constant values and initialization of datum and ellipse
 *     parameters.
 *
 */
  deriveConstants: function() {
      // DGR 2011-03-20 : nagrids -> nadgrids
      if (this.nadgrids && this.nadgrids.length==0) {
          this.nadgrids= null;
      }
      if (this.nadgrids) {
        this.grids= this.nadgrids.split(",");
        var g= null, l= this.grids.length;
        if (l>0) {
          for (var i= 0; i<l; i++) {
            g= this.grids[i];
            var fg= g.split("@");
            if (fg[fg.length-1]=="") {
              Proj4js.reportError("nadgrids syntax error '"+this.nadgrids+"' : empty grid found");
              continue;
            }
            this.grids[i]= {
              mandatory: fg.length==1,//@=> optional grid (no error if not found)
              name:fg[fg.length-1],
              grid: Proj4js.grids[fg[fg.length-1]]//FIXME: grids loading ...
            };
            if (this.grids[i].mandatory && !this.grids[i].grid) {
              Proj4js.reportError("Missing '"+this.grids[i].name+"'");
            }
          }
        }
        // DGR, 2011-03-20: grids is an array of objects that hold
        // the loaded grids, its name and the mandatory informations of it.
      }
      if (this.datumCode && this.datumCode != 'none') {
        var datumDef = Proj4js.Datum[this.datumCode];
        if (datumDef) {
          this.datum_params = datumDef.towgs84 ? datumDef.towgs84.split(',') : null;
          this.ellps = datumDef.ellipse;
          this.datumName = datumDef.datumName ? datumDef.datumName : this.datumCode;
        }
      }
      if (!this.a) {    // do we have an ellipsoid?
          var ellipse = Proj4js.Ellipsoid[this.ellps] ? Proj4js.Ellipsoid[this.ellps] : Proj4js.Ellipsoid['WGS84'];
          Proj4js.extend(this, ellipse);
      }
      if (this.rf && !this.b) this.b = (1.0 - 1.0/this.rf) * this.a;
      if (this.rf === 0 || Math.abs(this.a - this.b)<Proj4js.common.EPSLN) {
        this.sphere = true;
        this.b= this.a;
      }
      this.a2 = this.a * this.a;          // used in geocentric
      this.b2 = this.b * this.b;          // used in geocentric
      this.es = (this.a2-this.b2)/this.a2;  // e ^ 2
      this.e = Math.sqrt(this.es);        // eccentricity
      if (this.R_A) {
        this.a *= 1. - this.es * (Proj4js.common.SIXTH + this.es * (Proj4js.common.RA4 + this.es * Proj4js.common.RA6));
        this.a2 = this.a * this.a;
        this.b2 = this.b * this.b;
        this.es = 0.;
      }
      this.ep2=(this.a2-this.b2)/this.b2; // used in geocentric
      if (!this.k0) this.k0 = 1.0;    //default value
      //DGR 2010-11-12: axis
      if (!this.axis) { this.axis= "enu"; }

      this.datum = new Proj4js.datum(this);
  }
});

Proj4js.Proj.longlat = {
  init: function() {
    //no-op for longlat
  },
  forward: function(pt) {
    //identity transform
    return pt;
  },
  inverse: function(pt) {
    //identity transform
    return pt;
  }
};
Proj4js.Proj.identity = Proj4js.Proj.longlat;

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
*/
Proj4js.defs = {
  // These are so widely used, we'll go ahead and throw them in
  // without requiring a separate .js file
  'WGS84': "+title=WGS 84 (long/lat) +proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees",
  'EPSG:4326': "+title=WGS 84 (long/lat) +proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees",
  'EPSG:4269': "+title=NAD83 (long/lat) +proj=longlat +a=6378137.0 +b=6356752.31414036 +ellps=GRS80 +datum=NAD83 +units=degrees",
  'EPSG:3857': "+title=WGS 84 / Pseudo-Mercator +proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +no_defs"
};
Proj4js.defs['EPSG:3785'] = Proj4js.defs['EPSG:3857'];  //maintain backward compat, official code is 3857
Proj4js.defs['GOOGLE'] = Proj4js.defs['EPSG:3857'];
Proj4js.defs['EPSG:900913'] = Proj4js.defs['EPSG:3857'];
Proj4js.defs['EPSG:102113'] = Proj4js.defs['EPSG:3857'];

Proj4js.common = {
  PI : 3.141592653589793238, //Math.PI,
  HALF_PI : 1.570796326794896619, //Math.PI*0.5,
  TWO_PI : 6.283185307179586477, //Math.PI*2,
  FORTPI : 0.78539816339744833,
  R2D : 57.29577951308232088,
  D2R : 0.01745329251994329577,
  SEC_TO_RAD : 4.84813681109535993589914102357e-6, /* SEC_TO_RAD = Pi/180/3600 */
  EPSLN : 1.0e-10,
  MAX_ITER : 20,
  // following constants from geocent.c
  COS_67P5 : 0.38268343236508977,  /* cosine of 67.5 degrees */
  AD_C : 1.0026000,                /* Toms region 1 constant */

  /* datum_type values */
  PJD_UNKNOWN  : 0,
  PJD_3PARAM   : 1,
  PJD_7PARAM   : 2,
  PJD_GRIDSHIFT: 3,
  PJD_WGS84    : 4,   // WGS84 or equivalent
  PJD_NODATUM  : 5,   // WGS84 or equivalent
  SRS_WGS84_SEMIMAJOR : 6378137.0,  // only used in grid shift transforms
  SRS_WGS84_ESQUARED : 0.006694379990141316, //DGR: 2012-07-29

  // ellipoid pj_set_ell.c
  SIXTH : .1666666666666666667, /* 1/6 */
  RA4   : .04722222222222222222, /* 17/360 */
  RA6   : .02215608465608465608, /* 67/3024 */
  RV4   : .06944444444444444444, /* 5/72 */
  RV6   : .04243827160493827160, /* 55/1296 */

// Function to compute the constant small m which is the radius of
//   a parallel of latitude, phi, divided by the semimajor axis.
// -----------------------------------------------------------------
  msfnz : function(eccent, sinphi, cosphi) {
      var con = eccent * sinphi;
      return cosphi/(Math.sqrt(1.0 - con * con));
  },

// Function to compute the constant small t for use in the forward
//   computations in the Lambert Conformal Conic and the Polar
//   Stereographic projections.
// -----------------------------------------------------------------
  tsfnz : function(eccent, phi, sinphi) {
    var con = eccent * sinphi;
    var com = .5 * eccent;
    con = Math.pow(((1.0 - con) / (1.0 + con)), com);
    return (Math.tan(.5 * (this.HALF_PI - phi))/con);
  },

// Function to compute the latitude angle, phi2, for the inverse of the
//   Lambert Conformal Conic and Polar Stereographic projections.
// ----------------------------------------------------------------
  phi2z : function(eccent, ts) {
    var eccnth = .5 * eccent;
    var con, dphi;
    var phi = this.HALF_PI - 2 * Math.atan(ts);
    for (var i = 0; i <= 15; i++) {
      con = eccent * Math.sin(phi);
      dphi = this.HALF_PI - 2 * Math.atan(ts *(Math.pow(((1.0 - con)/(1.0 + con)),eccnth))) - phi;
      phi += dphi;
      if (Math.abs(dphi) <= .0000000001) return phi;
    }
    alert("phi2z has NoConvergence");
    return (-9999);
  },

/* Function to compute constant small q which is the radius of a 
   parallel of latitude, phi, divided by the semimajor axis. 
------------------------------------------------------------*/
  qsfnz : function(eccent,sinphi) {
    var con;
    if (eccent > 1.0e-7) {
      con = eccent * sinphi;
      return (( 1.0- eccent * eccent) * (sinphi /(1.0 - con * con) - (.5/eccent)*Math.log((1.0 - con)/(1.0 + con))));
    } else {
      return(2.0 * sinphi);
    }
  },

/* Function to compute the inverse of qsfnz
------------------------------------------------------------*/
  iqsfnz : function (eccent, q) {
    var temp = 1.0-(1.0-eccent*eccent)/(2.0*eccent)*Math.log((1-eccent)/(1+eccent));
    if (Math.abs(Math.abs(q)-temp)<1.0E-6) {
      if (q<0.0) {
        return (-1.0*Proj4js.common.HALF_PI);
      } else {
        return Proj4js.common.HALF_PI;
      }
    }
    //var phi = 0.5* q/(1-eccent*eccent);
    var phi = Math.asin(0.5*q);
    var dphi;
    var sin_phi;
    var cos_phi;
    var con;
    for (var i=0;i<30;i++){
      sin_phi = Math.sin(phi);
      cos_phi = Math.cos(phi);
      con = eccent*sin_phi;
      dphi=Math.pow(1.0-con*con,2.0)/(2.0*cos_phi)*(q/(1-eccent*eccent)-sin_phi/(1.0-con*con)+0.5/eccent*Math.log((1.0-con)/(1.0+con)));
      phi+=dphi;
      if (Math.abs(dphi) <= .0000000001) {
        return phi;
      }
    }

    alert("IQSFN-CONV:Latitude failed to converge after 30 iterations");
    return (NaN);
  },

/* Function to eliminate roundoff errors in asin
----------------------------------------------*/
  asinz : function(x) {
    if (Math.abs(x)>1.0) {
      x=(x>1.0)?1.0:-1.0;
    }
    return Math.asin(x);
  },

// following functions from gctpc cproj.c for transverse mercator projections
  e0fn : function(x) {return(1.0-0.25*x*(1.0+x/16.0*(3.0+1.25*x)));},
  e1fn : function(x) {return(0.375*x*(1.0+0.25*x*(1.0+0.46875*x)));},
  e2fn : function(x) {return(0.05859375*x*x*(1.0+0.75*x));},
  e3fn : function(x) {return(x*x*x*(35.0/3072.0));},
  mlfn : function(e0,e1,e2,e3,phi) {return(e0*phi-e1*Math.sin(2.0*phi)+e2*Math.sin(4.0*phi)-e3*Math.sin(6.0*phi));},
  imlfn : function(ml, e0, e1, e2, e3) {
    var phi;
    var dphi;

    phi=ml/e0;
    for (var i=0;i<15;i++){
      dphi=(ml-(e0*phi-e1*Math.sin(2.0*phi)+e2*Math.sin(4.0*phi)-e3*Math.sin(6.0*phi)))/(e0-2.0*e1*Math.cos(2.0*phi)+4.0*e2*Math.cos(4.0*phi)-6.0*e3*Math.cos(6.0*phi));
      phi+=dphi;
      if (Math.abs(dphi) <= .0000000001) {
        return phi;
      }
    }

    Proj4js.reportError("IMLFN-CONV:Latitude failed to converge after 15 iterations");
    return NaN;
  },

  srat : function(esinp, exp) {
    return(Math.pow((1.0-esinp)/(1.0+esinp), exp));
  },

// Function to return the sign of an argument
  sign : function(x) { if (x < 0.0) return(-1); else return(1);},

// Function to adjust longitude to -180 to 180; input in radians
  adjust_lon : function(x) {
    x = (Math.abs(x) < this.PI) ? x: (x - (this.sign(x)*this.TWO_PI) );
    return x;
  },

// IGNF - DGR : algorithms used by IGN France

// Function to adjust latitude to -90 to 90; input in radians
  adjust_lat : function(x) {
    x= (Math.abs(x) < this.HALF_PI) ? x: (x - (this.sign(x)*this.PI) );
    return x;
  },

// Latitude Isometrique - close to tsfnz ...
  latiso : function(eccent, phi, sinphi) {
    if (Math.abs(phi) > this.HALF_PI) return +Number.NaN;
    if (phi==this.HALF_PI) return Number.POSITIVE_INFINITY;
    if (phi==-1.0*this.HALF_PI) return -1.0*Number.POSITIVE_INFINITY;

    var con= eccent*sinphi;
    return Math.log(Math.tan((this.HALF_PI+phi)/2.0))+eccent*Math.log((1.0-con)/(1.0+con))/2.0;
  },

  fL : function(x,L) {
    return 2.0*Math.atan(x*Math.exp(L)) - this.HALF_PI;
  },

// Inverse Latitude Isometrique - close to ph2z
  invlatiso : function(eccent, ts) {
    var phi= this.fL(1.0,ts);
    var Iphi= 0.0;
    var con= 0.0;
    do {
      Iphi= phi;
      con= eccent*Math.sin(Iphi);
      phi= this.fL(Math.exp(eccent*Math.log((1.0+con)/(1.0-con))/2.0),ts);
    } while (Math.abs(phi-Iphi)>1.0e-12);
    return phi;
  },

// Needed for Gauss Schreiber
// Original:  Denis Makarov (info@binarythings.com)
// Web Site:  http://www.binarythings.com
  sinh : function(x)
  {
    var r= Math.exp(x);
    r= (r-1.0/r)/2.0;
    return r;
  },

  cosh : function(x)
  {
    var r= Math.exp(x);
    r= (r+1.0/r)/2.0;
    return r;
  },

  tanh : function(x)
  {
    var r= Math.exp(x);
    r= (r-1.0/r)/(r+1.0/r);
    return r;
  },

  asinh : function(x)
  {
    var s= (x>= 0? 1.0:-1.0);
    return s*(Math.log( Math.abs(x) + Math.sqrt(x*x+1.0) ));
  },

  acosh : function(x)
  {
    return 2.0*Math.log(Math.sqrt((x+1.0)/2.0) + Math.sqrt((x-1.0)/2.0));
  },

  atanh : function(x)
  {
    return Math.log((x-1.0)/(x+1.0))/2.0;
  },

// Grande Normale
  gN : function(a,e,sinphi)
  {
    var temp= e*sinphi;
    return a/Math.sqrt(1.0 - temp*temp);
  },
  
  //code from the PROJ.4 pj_mlfn.c file;  this may be useful for other projections
  pj_enfn: function(es) {
    var en = new Array();
    en[0] = this.C00 - es * (this.C02 + es * (this.C04 + es * (this.C06 + es * this.C08)));
    en[1] = es * (this.C22 - es * (this.C04 + es * (this.C06 + es * this.C08)));
    var t = es * es;
    en[2] = t * (this.C44 - es * (this.C46 + es * this.C48));
    t *= es;
    en[3] = t * (this.C66 - es * this.C68);
    en[4] = t * es * this.C88;
    return en;
  },
  
  pj_mlfn: function(phi, sphi, cphi, en) {
    cphi *= sphi;
    sphi *= sphi;
    return(en[0] * phi - cphi * (en[1] + sphi*(en[2]+ sphi*(en[3] + sphi*en[4]))));
  },
  
  pj_inv_mlfn: function(arg, es, en) {
    var k = 1./(1.-es);
    var phi = arg;
    for (var i = Proj4js.common.MAX_ITER; i ; --i) { /* rarely goes over 2 iterations */
      var s = Math.sin(phi);
      var t = 1. - es * s * s;
      //t = this.pj_mlfn(phi, s, Math.cos(phi), en) - arg;
      //phi -= t * (t * Math.sqrt(t)) * k;
      t = (this.pj_mlfn(phi, s, Math.cos(phi), en) - arg) * (t * Math.sqrt(t)) * k;
      phi -= t;
      if (Math.abs(t) < Proj4js.common.EPSLN)
        return phi;
    }
    Proj4js.reportError("cass:pj_inv_mlfn: Convergence error");
    return phi;
  },

  /**
   * Determine correction values
   * source: nad_intr.c (DGR: 2012-07-29)
   */
  nad_intr: function(pin,ct) {
    // force computation by decreasing by 1e-7 to be as closed as possible
    // from computation under C:C++ by leveraging rounding problems ...
    var t= {"x":(pin.x-1.e-7)/ct.del[0],"y":(pin.y-1e-7)/ct.del[1]};
    var indx= {"x":Math.floor(t.x),"y":Math.floor(t.y)};
    var frct= {"x":t.x-1.0*indx.x,"y":t.y-1.0*indx.y};
    var val= {"x":Number.NaN,"y":Number.NaN};
    var inx;
    if (indx.x<0) {
      if (!(indx.x==-1 && frct.x>0.99999999999)) {
        return val;
      }
      ++indx.x;
      frct.x= 0.0;
    } else {
      inx= indx.x+1;
      if (inx>=ct.lim[0]) {
        if (!(inx==ct.lim[0] && frct.x<1e-11)) {
          return val;
        }
        --indx.x;
        frct.x= 1.0;
      }
    }
    if (indx.y<0) {
      if (!(indx.y==-1 && frct.y>0.99999999999)) {
        return val;
      }
      ++indx.y;
      frct.y= 0.0;
    } else {
      inx= indx.y+1;
      if (inx>=ct.lim[1]) {
        if (!(inx==ct.lim[1] && frct.y<1e-11)) {
          return val;
        }
        --indx.y;
        frct.y= 1.0;
      }
    }
    inx= (indx.y*ct.lim[0])+indx.x;
    var f00= {"x":ct.cvs[inx][0], "y":ct.cvs[inx][1]};
    inx++;
    var f10= {"x":ct.cvs[inx][0], "y":ct.cvs[inx][1]};
    inx+= ct.lim[0];
    var f11= {"x":ct.cvs[inx][0], "y":ct.cvs[inx][1]};
    inx--;
    var f01= {"x":ct.cvs[inx][0], "y":ct.cvs[inx][1]};
    var m11= frct.x*frct.y,             m10= frct.x*(1.0-frct.y),
        m00= (1.0-frct.x)*(1.0-frct.y), m01= (1.0-frct.x)*frct.y;
    val.x= (m00*f00.x + m10*f10.x + m01*f01.x + m11*f11.x);
    val.y= (m00*f00.y + m10*f10.y + m01*f01.y + m11*f11.y);
    return val;
  },

  /**
   * Correct value
   * source: nad_cvt.c (DGR: 2012-07-29)
   */
  nad_cvt: function(pin,inverse,ct) {
    var val= {"x":Number.NaN, "y":Number.NaN};
    if (isNaN(pin.x)) { return val; }
    var tb= {"x":pin.x, "y":pin.y};
    tb.x-= ct.ll[0];
    tb.y-= ct.ll[1];
    tb.x= Proj4js.common.adjust_lon(tb.x - Proj4js.common.PI) + Proj4js.common.PI;
    var t= Proj4js.common.nad_intr(tb,ct);
    if (inverse) {
      if (isNaN(t.x)) {
        return val;
      }
      t.x= tb.x + t.x;
      t.y= tb.y - t.y;
      var i= 9, tol= 1e-12;
      var dif, del;
      do {
        del= Proj4js.common.nad_intr(t,ct);
        if (isNaN(del.x)) {
          this.reportError("Inverse grid shift iteration failed, presumably at grid edge.  Using first approximation.");
          break;
        }
        dif= {"x":t.x-del.x-tb.x, "y":t.y+del.y-tb.y};
        t.x-= dif.x;
        t.y-= dif.y;
      } while (i-- && Math.abs(dif.x)>tol && Math.abs(dif.y)>tol);
      if (i<0) {
        this.reportError("Inverse grid shift iterator failed to converge.");
        return val;
      }
      val.x= Proj4js.common.adjust_lon(t.x+ct.ll[0]);
      val.y= t.y+ct.ll[1];
    } else {
      if (!isNaN(t.x)) {
          val.x= pin.x - t.x;
          val.y= pin.y + t.y;
      }
    }
    return val;
  },

/* meridinal distance for ellipsoid and inverse
**	8th degree - accurate to < 1e-5 meters when used in conjuction
**		with typical major axis values.
**	Inverse determines phi to EPS (1e-11) radians, about 1e-6 seconds.
*/
  C00: 1.0,
  C02: .25,
  C04: .046875,
  C06: .01953125,
  C08: .01068115234375,
  C22: .75,
  C44: .46875,
  C46: .01302083333333333333,
  C48: .00712076822916666666,
  C66: .36458333333333333333,
  C68: .00569661458333333333,
  C88: .3076171875  

};

/** datum object
*/
Proj4js.datum = Proj4js.Class({

  initialize : function(proj) {
    this.datum_type = Proj4js.common.PJD_WGS84;   //default setting
    if (!proj) { return; }
    if (proj.datumCode && proj.datumCode == 'none') {
      this.datum_type = Proj4js.common.PJD_NODATUM;
    }
    if (proj.datum_params) {
      for (var i=0; i<proj.datum_params.length; i++) {
        proj.datum_params[i]=parseFloat(proj.datum_params[i]);
      }
      if (proj.datum_params[0] != 0 || proj.datum_params[1] != 0 || proj.datum_params[2] != 0 ) {
        this.datum_type = Proj4js.common.PJD_3PARAM;
      }
      if (proj.datum_params.length > 3) {
        if (proj.datum_params[3] != 0 || proj.datum_params[4] != 0 ||
            proj.datum_params[5] != 0 || proj.datum_params[6] != 0 ) {
          this.datum_type = Proj4js.common.PJD_7PARAM;
          proj.datum_params[3] *= Proj4js.common.SEC_TO_RAD;
          proj.datum_params[4] *= Proj4js.common.SEC_TO_RAD;
          proj.datum_params[5] *= Proj4js.common.SEC_TO_RAD;
          proj.datum_params[6] = (proj.datum_params[6]/1000000.0) + 1.0;
        }
      }
    }
    // DGR 2011-03-21 : nadgrids support
    this.datum_type = proj.grids?
      Proj4js.common.PJD_GRIDSHIFT
    : this.datum_type;

    this.a = proj.a;    //datum object also uses these values
    this.b = proj.b;
    this.es = proj.es;
    this.ep2 = proj.ep2;
    this.datum_params = proj.datum_params;
    if (this.datum_type==Proj4js.common.PJD_GRIDSHIFT) {
      this.grids= proj.grids;
    }
  },

  /****************************************************************/
  // cs_compare_datums()
  //   Returns TRUE if the two datums match, otherwise FALSE.
  compare_datums : function( dest ) {
    if( this.datum_type != dest.datum_type ) {
      return false; // false, datums are not equal
    } else if( this.a != dest.a || Math.abs(this.es-dest.es) > 0.000000000050 ) {
      // the tolerence for es is to ensure that GRS80 and WGS84
      // are considered identical
      return false;
    } else if( this.datum_type == Proj4js.common.PJD_3PARAM ) {
      return (this.datum_params[0] == dest.datum_params[0]
              && this.datum_params[1] == dest.datum_params[1]
              && this.datum_params[2] == dest.datum_params[2]);
    } else if( this.datum_type == Proj4js.common.PJD_7PARAM ) {
      return (this.datum_params[0] == dest.datum_params[0]
              && this.datum_params[1] == dest.datum_params[1]
              && this.datum_params[2] == dest.datum_params[2]
              && this.datum_params[3] == dest.datum_params[3]
              && this.datum_params[4] == dest.datum_params[4]
              && this.datum_params[5] == dest.datum_params[5]
              && this.datum_params[6] == dest.datum_params[6]);
    } else if ( this.datum_type == Proj4js.common.PJD_GRIDSHIFT ||
                dest.datum_type == Proj4js.common.PJD_GRIDSHIFT ) {
      //alert("ERROR: Grid shift transformations are not implemented.");
      //return false
      //DGR 2012-07-29 lazy ...
      return this.nadgrids == dest.nadgrids;
    } else {
      return true; // datums are equal
    }
  }, // cs_compare_datums()

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
  geodetic_to_geocentric : function(p) {
    var Longitude = p.x;
    var Latitude = p.y;
    var Height = p.z ? p.z : 0;   //Z value not always supplied
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
    if( Latitude < -Proj4js.common.HALF_PI && Latitude > -1.001 * Proj4js.common.HALF_PI ) {
        Latitude = -Proj4js.common.HALF_PI;
    } else if( Latitude > Proj4js.common.HALF_PI && Latitude < 1.001 * Proj4js.common.HALF_PI ) {
        Latitude = Proj4js.common.HALF_PI;
    } else if ((Latitude < -Proj4js.common.HALF_PI) || (Latitude > Proj4js.common.HALF_PI)) {
      /* Latitude out of range */
      Proj4js.reportError('geocent:lat out of range:'+Latitude);
      return null;
    }

    if (Longitude > Proj4js.common.PI) Longitude -= (2*Proj4js.common.PI);
    Sin_Lat = Math.sin(Latitude);
    Cos_Lat = Math.cos(Latitude);
    Sin2_Lat = Sin_Lat * Sin_Lat;
    Rn = this.a / (Math.sqrt(1.0e0 - this.es * Sin2_Lat));
    X = (Rn + Height) * Cos_Lat * Math.cos(Longitude);
    Y = (Rn + Height) * Cos_Lat * Math.sin(Longitude);
    Z = ((Rn * (1 - this.es)) + Height) * Sin_Lat;

    p.x = X;
    p.y = Y;
    p.z = Z;
    return Error_Code;
  }, // cs_geodetic_to_geocentric()


  geocentric_to_geodetic : function (p) {
/* local defintions and variables */
/* end-criterium of loop, accuracy of sin(Latitude) */
var genau = 1.E-12;
var genau2 = (genau*genau);
var maxiter = 30;

    var P;        /* distance between semi-minor axis and location */
    var RR;       /* distance between center and location */
    var CT;       /* sin of geocentric latitude */
    var ST;       /* cos of geocentric latitude */
    var RX;
    var RK;
    var RN;       /* Earth radius at location */
    var CPHI0;    /* cos of start or old geodetic latitude in iterations */
    var SPHI0;    /* sin of start or old geodetic latitude in iterations */
    var CPHI;     /* cos of searched geodetic latitude */
    var SPHI;     /* sin of searched geodetic latitude */
    var SDPHI;    /* end-criterium: addition-theorem of sin(Latitude(iter)-Latitude(iter-1)) */
    var At_Pole;     /* indicates location is in polar region */
    var iter;        /* # of continous iteration, max. 30 is always enough (s.a.) */

    var X = p.x;
    var Y = p.y;
    var Z = p.z ? p.z : 0.0;   //Z value not always supplied
    var Longitude;
    var Latitude;
    var Height;

    At_Pole = false;
    P = Math.sqrt(X*X+Y*Y);
    RR = Math.sqrt(X*X+Y*Y+Z*Z);

/*      special cases for latitude and longitude */
    if (P/this.a < genau) {

/*  special case, if P=0. (X=0., Y=0.) */
        At_Pole = true;
        Longitude = 0.0;

/*  if (X,Y,Z)=(0.,0.,0.) then Height becomes semi-minor axis
 *  of ellipsoid (=center of mass), Latitude becomes PI/2 */
        if (RR/this.a < genau) {
            Latitude = Proj4js.common.HALF_PI;
            Height   = -this.b;
            return;
        }
    } else {
/*  ellipsoidal (geodetic) longitude
 *  interval: -PI < Longitude <= +PI */
        Longitude=Math.atan2(Y,X);
    }

/* --------------------------------------------------------------
 * Following iterative algorithm was developped by
 * "Institut f�r Erdmessung", University of Hannover, July 1988.
 * Internet: www.ife.uni-hannover.de
 * Iterative computation of CPHI,SPHI and Height.
 * Iteration of CPHI and SPHI to 10**-12 radian resp.
 * 2*10**-7 arcsec.
 * --------------------------------------------------------------
 */
    CT = Z/RR;
    ST = P/RR;
    RX = 1.0/Math.sqrt(1.0-this.es*(2.0-this.es)*ST*ST);
    CPHI0 = ST*(1.0-this.es)*RX;
    SPHI0 = CT*RX;
    iter = 0;

/* loop to find sin(Latitude) resp. Latitude
 * until |sin(Latitude(iter)-Latitude(iter-1))| < genau */
    do
    {
        iter++;
        RN = this.a/Math.sqrt(1.0-this.es*SPHI0*SPHI0);

/*  ellipsoidal (geodetic) height */
        Height = P*CPHI0+Z*SPHI0-RN*(1.0-this.es*SPHI0*SPHI0);

        RK = this.es*RN/(RN+Height);
        RX = 1.0/Math.sqrt(1.0-RK*(2.0-RK)*ST*ST);
        CPHI = ST*(1.0-RK)*RX;
        SPHI = CT*RX;
        SDPHI = SPHI*CPHI0-CPHI*SPHI0;
        CPHI0 = CPHI;
        SPHI0 = SPHI;
    }
    while (SDPHI*SDPHI > genau2 && iter < maxiter);

/*      ellipsoidal (geodetic) latitude */
    Latitude=Math.atan(SPHI/Math.abs(CPHI));

    p.x = Longitude;
    p.y = Latitude;
    p.z = Height;
    return p;
  }, // cs_geocentric_to_geodetic()

  /** Convert_Geocentric_To_Geodetic
   * The method used here is derived from 'An Improved Algorithm for
   * Geocentric to Geodetic Coordinate Conversion', by Ralph Toms, Feb 1996
   */
  geocentric_to_geodetic_noniter : function (p) {
    var X = p.x;
    var Y = p.y;
    var Z = p.z ? p.z : 0;   //Z value not always supplied
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
            Longitude = Proj4js.common.HALF_PI;
        }
        else if (Y < 0)
        {
            Longitude = -Proj4js.common.HALF_PI;
        }
        else
        {
            At_Pole = true;
            Longitude = 0.0;
            if (Z > 0.0)
            {  /* north pole */
                Latitude = Proj4js.common.HALF_PI;
            }
            else if (Z < 0.0)
            {  /* south pole */
                Latitude = -Proj4js.common.HALF_PI;
            }
            else
            {  /* center of earth */
                Latitude = Proj4js.common.HALF_PI;
                Height = -this.b;
                return;
            }
        }
    }
    W2 = X*X + Y*Y;
    W = Math.sqrt(W2);
    T0 = Z * Proj4js.common.AD_C;
    S0 = Math.sqrt(T0 * T0 + W2);
    Sin_B0 = T0 / S0;
    Cos_B0 = W / S0;
    Sin3_B0 = Sin_B0 * Sin_B0 * Sin_B0;
    T1 = Z + this.b * this.ep2 * Sin3_B0;
    Sum = W - this.a * this.es * Cos_B0 * Cos_B0 * Cos_B0;
    S1 = Math.sqrt(T1*T1 + Sum * Sum);
    Sin_p1 = T1 / S1;
    Cos_p1 = Sum / S1;
    Rn = this.a / Math.sqrt(1.0 - this.es * Sin_p1 * Sin_p1);
    if (Cos_p1 >= Proj4js.common.COS_67P5)
    {
        Height = W / Cos_p1 - Rn;
    }
    else if (Cos_p1 <= -Proj4js.common.COS_67P5)
    {
        Height = W / -Cos_p1 - Rn;
    }
    else
    {
        Height = Z / Sin_p1 + Rn * (this.es - 1.0);
    }
    if (At_Pole == false)
    {
        Latitude = Math.atan(Sin_p1 / Cos_p1);
    }

    p.x = Longitude;
    p.y = Latitude;
    p.z = Height;
    return p;
  }, // geocentric_to_geodetic_noniter()

  /****************************************************************/
  // pj_geocentic_to_wgs84( p )
  //  p = point to transform in geocentric coordinates (x,y,z)
  geocentric_to_wgs84 : function ( p ) {

    if( this.datum_type == Proj4js.common.PJD_3PARAM )
    {
      // if( x[io] == HUGE_VAL )
      //    continue;
      p.x += this.datum_params[0];
      p.y += this.datum_params[1];
      p.z += this.datum_params[2];

    }
    else if (this.datum_type == Proj4js.common.PJD_7PARAM)
    {
      var Dx_BF =this.datum_params[0];
      var Dy_BF =this.datum_params[1];
      var Dz_BF =this.datum_params[2];
      var Rx_BF =this.datum_params[3];
      var Ry_BF =this.datum_params[4];
      var Rz_BF =this.datum_params[5];
      var M_BF  =this.datum_params[6];
      // if( x[io] == HUGE_VAL )
      //    continue;
      var x_out = M_BF*(       p.x - Rz_BF*p.y + Ry_BF*p.z) + Dx_BF;
      var y_out = M_BF*( Rz_BF*p.x +       p.y - Rx_BF*p.z) + Dy_BF;
      var z_out = M_BF*(-Ry_BF*p.x + Rx_BF*p.y +       p.z) + Dz_BF;
      p.x = x_out;
      p.y = y_out;
      p.z = z_out;
    }
  }, // cs_geocentric_to_wgs84

  /****************************************************************/
  // pj_geocentic_from_wgs84()
  //  coordinate system definition,
  //  point to transform in geocentric coordinates (x,y,z)
  geocentric_from_wgs84 : function( p ) {

    if( this.datum_type == Proj4js.common.PJD_3PARAM )
    {
      //if( x[io] == HUGE_VAL )
      //    continue;
      p.x -= this.datum_params[0];
      p.y -= this.datum_params[1];
      p.z -= this.datum_params[2];

    }
    else if (this.datum_type == Proj4js.common.PJD_7PARAM)
    {
      var Dx_BF =this.datum_params[0];
      var Dy_BF =this.datum_params[1];
      var Dz_BF =this.datum_params[2];
      var Rx_BF =this.datum_params[3];
      var Ry_BF =this.datum_params[4];
      var Rz_BF =this.datum_params[5];
      var M_BF  =this.datum_params[6];
      var x_tmp = (p.x - Dx_BF) / M_BF;
      var y_tmp = (p.y - Dy_BF) / M_BF;
      var z_tmp = (p.z - Dz_BF) / M_BF;
      //if( x[io] == HUGE_VAL )
      //    continue;

      p.x =        x_tmp + Rz_BF*y_tmp - Ry_BF*z_tmp;
      p.y = -Rz_BF*x_tmp +       y_tmp + Rx_BF*z_tmp;
      p.z =  Ry_BF*x_tmp - Rx_BF*y_tmp +       z_tmp;
    } //cs_geocentric_from_wgs84()
  }
});

/** point object, nothing fancy, just allows values to be
    passed back and forth by reference rather than by value.
    Other point classes may be used as long as they have
    x and y properties, which will get modified in the transform method.
*/
Proj4js.Point = Proj4js.Class({

    /**
     * Constructor: Proj4js.Point
     *
     * Parameters:
     * - x {float} or {Array} either the first coordinates component or
     *     the full coordinates
     * - y {float} the second component
     * - z {float} the third component, optional.
     */
    initialize : function(x,y,z) {
      if (typeof x == 'object') {
        this.x = x[0];
        this.y = x[1];
        this.z = x[2] || 0.0;
      } else if (typeof x == 'string' && typeof y == 'undefined') {
        var coords = x.split(',');
        this.x = parseFloat(coords[0]);
        this.y = parseFloat(coords[1]);
        this.z = parseFloat(coords[2]) || 0.0;
      } else {
        this.x = x;
        this.y = y;
        this.z = z || 0.0;
      }
    },

    /**
     * APIMethod: clone
     * Build a copy of a Proj4js.Point object.
     *
     * Return:
     * {Proj4js}.Point the cloned point.
     */
    clone : function() {
      return new Proj4js.Point(this.x, this.y, this.z);
    },

    /**
     * APIMethod: toString
     * Return a readable string version of the point
     *
     * Return:
     * {String} String representation of Proj4js.Point object. 
     *           (ex. <i>"x=5,y=42"</i>)
     */
    toString : function() {
        return ("x=" + this.x + ",y=" + this.y);
    },

    /** 
     * APIMethod: toShortString
     * Return a short string version of the point.
     *
     * Return:
     * {String} Shortened String representation of Proj4js.Point object. 
     *         (ex. <i>"5, 42"</i>)
     */
    toShortString : function() {
        return (this.x + ", " + this.y);
    }
});

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
  "aust_SA": {a:6378160.0, rf:298.25, ellipseName:"Australian Natl & S. Amer. 1969"},
  "GRS67": {a:6378160.0, rf:298.2471674270, ellipseName:"GRS 67(IUGG 1967)"},
  "bessel": {a:6377397.155, rf:299.1528128, ellipseName:"Bessel 1841"},
  "bess_nam": {a:6377483.865, rf:299.1528128, ellipseName:"Bessel 1841 (Namibia)"},
  "clrk66": {a:6378206.4, b:6356583.8, ellipseName:"Clarke 1866"},
  "clrk80": {a:6378249.145, rf:293.4663, ellipseName:"Clarke 1880 mod."},
  "CPM": {a:6375738.7, rf:334.29, ellipseName:"Comm. des Poids et Mesures 1799"},
  "delmbr": {a:6376428.0, rf:311.5, ellipseName:"Delambre 1810 (Belgium)"},
  "engelis": {a:6378136.05, rf:298.2566, ellipseName:"Engelis 1985"},
  "evrst30": {a:6377276.345, rf:300.8017, ellipseName:"Everest 1830"},
  "evrst48": {a:6377304.063, rf:300.8017, ellipseName:"Everest 1948"},
  "evrst56": {a:6377301.243, rf:300.8017, ellipseName:"Everest 1956"},
  "evrst69": {a:6377295.664, rf:300.8017, ellipseName:"Everest 1969"},
  "evrstSS": {a:6377298.556, rf:300.8017, ellipseName:"Everest (Sabah & Sarawak)"},
  "fschr60": {a:6378166.0, rf:298.3, ellipseName:"Fischer (Mercury Datum) 1960"},
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

Proj4js.Datum = {
  "WGS84": {towgs84: "0,0,0", ellipse: "WGS84", datumName: "WGS84"},
  "GGRS87": {towgs84: "-199.87,74.79,246.62", ellipse: "GRS80", datumName: "Greek_Geodetic_Reference_System_1987"},
  "NAD83": {towgs84: "0,0,0", ellipse: "GRS80", datumName: "North_American_Datum_1983"},
  "NAD27": {nadgrids: "@conus,@alaska,@ntv2_0.gsb,@ntv1_can.dat", ellipse: "clrk66", datumName: "North_American_Datum_1927"},
  "potsdam": {towgs84: "606.0,23.0,413.0", ellipse: "bessel", datumName: "Potsdam Rauenberg 1950 DHDN"},
  "carthage": {towgs84: "-263.0,6.0,431.0", ellipse: "clark80", datumName: "Carthage 1934 Tunisia"},
  "hermannskogel": {towgs84: "653.0,-212.0,449.0", ellipse: "bessel", datumName: "Hermannskogel"},
  "ire65": {towgs84: "482.530,-130.596,564.557,-1.042,-0.214,-0.631,8.15", ellipse: "mod_airy", datumName: "Ireland 1965"},
  "nzgd49": {towgs84: "59.47,-5.04,187.44,0.47,-0.1,1.024,-4.5993", ellipse: "intl", datumName: "New Zealand Geodetic Datum 1949"},
  "OSGB36": {towgs84: "446.448,-125.157,542.060,0.1502,0.2470,0.8421,-20.4894", ellipse: "airy", datumName: "Airy 1830"}
};

Proj4js.WGS84 = new Proj4js.Proj('WGS84');
Proj4js.Datum['OSB36'] = Proj4js.Datum['OSGB36']; //as returned from spatialreference.org

//lookup table to go from the projection name in WKT to the Proj4js projection name
//build this out as required
Proj4js.wktProjections = {
  "Lambert Tangential Conformal Conic Projection": "lcc",
  "Lambert_Conformal_Conic": "lcc",
  "Mercator": "merc",
  "Popular Visualisation Pseudo Mercator": "merc",
  "Mercator_1SP": "merc",
  "Transverse_Mercator": "tmerc",
  "Transverse Mercator": "tmerc",
  "Lambert Azimuthal Equal Area": "laea",
  "Universal Transverse Mercator System": "utm"
};

// Based on proj4 CTABLE  structure :
// FIXME: better to have array instead of object holding longitudes, latitudes members
//        In the former case, one has to document index 0 is longitude and
//        1 is latitude ...
//        In the later case, grid object gets bigger !!!!
//        Solution 1 is chosen based on pj_gridinfo.c
Proj4js.grids= {
    "null":{                                // name of grid's file
        "ll": [-3.14159265, -1.57079633],   // lower-left coordinates in radians (longitude, latitude):
        "del":[ 3.14159265,  1.57079633],   // cell's size in radians (longitude, latitude):
        "lim":[ 3, 3],                      // number of nodes in longitude, latitude (including edges):
        "count":9,                          // total number of nodes
        "cvs":[                             // shifts : in ntv2 reverse order : lon, lat in radians ...
            [0.0, 0.0], [0.0, 0.0], [0.0, 0.0], // for (lon= 0; lon<lim[0]; lon++) {
            [0.0, 0.0], [0.0, 0.0], [0.0, 0.0], //   for (lat= 0; lat<lim[1]; lat++) { p= cvs[lat*lim[0]+lon]; }
            [0.0, 0.0], [0.0, 0.0], [0.0, 0.0]  // }
        ]
    }
};


/*******************************************************************************
NAME                     ALBERS CONICAL EQUAL AREA 

PURPOSE:	Transforms input longitude and latitude to Easting and Northing
		for the Albers Conical Equal Area projection.  The longitude
		and latitude must be in radians.  The Easting and Northing
		values will be returned in meters.

PROGRAMMER              DATE
----------              ----
T. Mittan,       	Feb, 1992

ALGORITHM REFERENCES

1.  Snyder, John P., "Map Projections--A Working Manual", U.S. Geological
    Survey Professional Paper 1395 (Supersedes USGS Bulletin 1532), United
    State Government Printing Office, Washington D.C., 1987.

2.  Snyder, John P. and Voxland, Philip M., "An Album of Map Projections",
    U.S. Geological Survey Professional Paper 1453 , United State Government
    Printing Office, Washington D.C., 1989.
*******************************************************************************/


Proj4js.Proj.aea = {
  init : function() {

    if (Math.abs(this.lat1 + this.lat2) < Proj4js.common.EPSLN) {
       Proj4js.reportError("aeaInitEqualLatitudes");
       return;
    }
    this.temp = this.b / this.a;
    this.es = 1.0 - Math.pow(this.temp,2);
    this.e3 = Math.sqrt(this.es);

    this.sin_po=Math.sin(this.lat1);
    this.cos_po=Math.cos(this.lat1);
    this.t1=this.sin_po;
    this.con = this.sin_po;
    this.ms1 = Proj4js.common.msfnz(this.e3,this.sin_po,this.cos_po);
    this.qs1 = Proj4js.common.qsfnz(this.e3,this.sin_po,this.cos_po);

    this.sin_po=Math.sin(this.lat2);
    this.cos_po=Math.cos(this.lat2);
    this.t2=this.sin_po;
    this.ms2 = Proj4js.common.msfnz(this.e3,this.sin_po,this.cos_po);
    this.qs2 = Proj4js.common.qsfnz(this.e3,this.sin_po,this.cos_po);

    this.sin_po=Math.sin(this.lat0);
    this.cos_po=Math.cos(this.lat0);
    this.t3=this.sin_po;
    this.qs0 = Proj4js.common.qsfnz(this.e3,this.sin_po,this.cos_po);

    if (Math.abs(this.lat1 - this.lat2) > Proj4js.common.EPSLN) {
      this.ns0 = (this.ms1 * this.ms1 - this.ms2 *this.ms2)/ (this.qs2 - this.qs1);
    } else {
      this.ns0 = this.con;
    }
    this.c = this.ms1 * this.ms1 + this.ns0 * this.qs1;
    this.rh = this.a * Math.sqrt(this.c - this.ns0 * this.qs0)/this.ns0;
  },

/* Albers Conical Equal Area forward equations--mapping lat,long to x,y
  -------------------------------------------------------------------*/
  forward: function(p){

    var lon=p.x;
    var lat=p.y;

    this.sin_phi=Math.sin(lat);
    this.cos_phi=Math.cos(lat);

    var qs = Proj4js.common.qsfnz(this.e3,this.sin_phi,this.cos_phi);
    var rh1 =this.a * Math.sqrt(this.c - this.ns0 * qs)/this.ns0;
    var theta = this.ns0 * Proj4js.common.adjust_lon(lon - this.long0); 
    var x = rh1 * Math.sin(theta) + this.x0;
    var y = this.rh - rh1 * Math.cos(theta) + this.y0;

    p.x = x; 
    p.y = y;
    return p;
  },


  inverse: function(p) {
    var rh1,qs,con,theta,lon,lat;

    p.x -= this.x0;
    p.y = this.rh - p.y + this.y0;
    if (this.ns0 >= 0) {
      rh1 = Math.sqrt(p.x *p.x + p.y * p.y);
      con = 1.0;
    } else {
      rh1 = -Math.sqrt(p.x * p.x + p.y *p.y);
      con = -1.0;
    }
    theta = 0.0;
    if (rh1 != 0.0) {
      theta = Math.atan2(con * p.x, con * p.y);
    }
    con = rh1 * this.ns0 / this.a;
    if (this.sphere) {
      lat = Math.asin((this.c-con*con)/(2.0*this.ns0));
    } else {
      qs = (this.c - con * con) / this.ns0;
      lat = this.phi1z(this.e3,qs);
    }

    lon = Proj4js.common.adjust_lon(theta/this.ns0 + this.long0);
    p.x = lon;
    p.y = lat;
    return p;
  },
  
/* Function to compute phi1, the latitude for the inverse of the
   Albers Conical Equal-Area projection.
-------------------------------------------*/
  phi1z: function (eccent,qs) {
    var sinphi, cosphi, con, com, dphi;
    var phi = Proj4js.common.asinz(.5 * qs);
    if (eccent < Proj4js.common.EPSLN) return phi;
    
    var eccnts = eccent * eccent; 
    for (var i = 1; i <= 25; i++) {
        sinphi = Math.sin(phi);
        cosphi = Math.cos(phi);
        con = eccent * sinphi; 
        com = 1.0 - con * con;
        dphi = .5 * com * com / cosphi * (qs / (1.0 - eccnts) - sinphi / com + .5 / eccent * Math.log((1.0 - con) / (1.0 + con)));
        phi = phi + dphi;
        if (Math.abs(dphi) <= 1e-7) return phi;
    }
    Proj4js.reportError("aea:phi1z:Convergence error");
    return null;
  }
  
};




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

/*******************************************************************************
NAME                            CASSINI

PURPOSE:	Transforms input longitude and latitude to Easting and
		Northing for the Cassini projection.  The
		longitude and latitude must be in radians.  The Easting
		and Northing values will be returned in meters.
    Ported from PROJ.4.


ALGORITHM REFERENCES

1.  Snyder, John P., "Map Projections--A Working Manual", U.S. Geological
    Survey Professional Paper 1395 (Supersedes USGS Bulletin 1532), United
    State Government Printing Office, Washington D.C., 1987.

2.  Snyder, John P. and Voxland, Philip M., "An Album of Map Projections",
    U.S. Geological Survey Professional Paper 1453 , United State Government
*******************************************************************************/


//Proj4js.defs["EPSG:28191"] = "+proj=cass +lat_0=31.73409694444445 +lon_0=35.21208055555556 +x_0=170251.555 +y_0=126867.909 +a=6378300.789 +b=6356566.435 +towgs84=-275.722,94.7824,340.894,-8.001,-4.42,-11.821,1 +units=m +no_defs";

// Initialize the Cassini projection
// -----------------------------------------------------------------

Proj4js.Proj.cass = {
  init : function() {
    if (!this.sphere) {
      this.e0 = Proj4js.common.e0fn(this.es);
      this.e1 = Proj4js.common.e1fn(this.es);
      this.e2 = Proj4js.common.e2fn(this.es);
      this.e3 = Proj4js.common.e3fn(this.es);
      this.ml0 = this.a*Proj4js.common.mlfn(this.e0,this.e1,this.e2,this.e3,this.lat0);
    }
  },



/* Cassini forward equations--mapping lat,long to x,y
  -----------------------------------------------------------------------*/
  forward: function(p) {

    /* Forward equations
      -----------------*/
    var x,y;
    var lam=p.x;
    var phi=p.y;
    lam = Proj4js.common.adjust_lon(lam - this.long0);
    
    if (this.sphere) {
      x = this.a*Math.asin(Math.cos(phi) * Math.sin(lam));
      y = this.a*(Math.atan2(Math.tan(phi) , Math.cos(lam)) - this.lat0);
    } else {
        //ellipsoid
      var sinphi = Math.sin(phi);
      var cosphi = Math.cos(phi);
      var nl = Proj4js.common.gN(this.a,this.e,sinphi);
      var tl = Math.tan(phi)*Math.tan(phi);
      var al = lam*Math.cos(phi);
      var asq = al*al;
      var cl = this.es*cosphi*cosphi/(1.0-this.es);
      var ml = this.a*Proj4js.common.mlfn(this.e0,this.e1,this.e2,this.e3,phi);
      
      x = nl*al*(1.0-asq*tl*(1.0/6.0-(8.0-tl+8.0*cl)*asq/120.0));
      y = ml-this.ml0 + nl*sinphi/cosphi*asq*(0.5+(5.0-tl+6.0*cl)*asq/24.0);
      
      
    }
    
    p.x = x + this.x0;
    p.y = y + this.y0;
    return p;
  },//cassFwd()

/* Inverse equations
  -----------------*/
  inverse: function(p) {
    p.x -= this.x0;
    p.y -= this.y0;
    var x = p.x/this.a;
    var y = p.y/this.a;
    var phi, lam;

    if (this.sphere) {
      var dd = y + this.lat0;
      phi = Math.asin(Math.sin(dd) * Math.cos(x));
      lam = Math.atan2(Math.tan(x), Math.cos(dd));
    } else {
      /* ellipsoid */
      var ml1 = this.ml0/this.a + y;
      var phi1 = Proj4js.common.imlfn(ml1, this.e0,this.e1,this.e2,this.e3);
      if (Math.abs(Math.abs(phi1)-Proj4js.common.HALF_PI)<=Proj4js.common.EPSLN){
	p.x=this.long0;
	p.y=Proj4js.common.HALF_PI;
	if (y<0.0){p.y*=-1.0;}
	return p;
      }
      var nl1 = Proj4js.common.gN(this.a,this.e, Math.sin(phi1));
      
      var rl1 = nl1*nl1*nl1/this.a/this.a*(1.0-this.es);
      var tl1 = Math.pow(Math.tan(phi1),2.0);
      var dl = x*this.a/nl1;
      var dsq=dl*dl;
      phi = phi1-nl1*Math.tan(phi1)/rl1*dl*dl*(0.5-(1.0+3.0*tl1)*dl*dl/24.0);
      lam = dl*(1.0-dsq*(tl1/3.0+(1.0+3.0*tl1)*tl1*dsq/15.0))/Math.cos(phi1);
      
    } 
    
    p.x=Proj4js.common.adjust_lon(lam+this.long0);
    p.y=Proj4js.common.adjust_lat(phi);
    return p;
    
   }//cassInv()

};

/*******************************************************************************
NAME                    LAMBERT CYLINDRICAL EQUAL AREA

PURPOSE:	Transforms input longitude and latitude to Easting and
		Northing for the Lambert Cylindrical Equal Area projection.
                This class of projection includes the Behrmann and 
                Gall-Peters Projections.  The
		longitude and latitude must be in radians.  The Easting
		and Northing values will be returned in meters.

PROGRAMMER              DATE            
----------              ----
R. Marsden              August 2009
Winwaed Software Tech LLC, http://www.winwaed.com

This function was adapted from the Miller Cylindrical Projection in the Proj4JS
library.

Note: This implementation assumes a Spherical Earth. The (commented) code 
has been included for the ellipsoidal forward transform, but derivation of 
the ellispoidal inverse transform is beyond me. Note that most of the 
Proj4JS implementations do NOT currently support ellipsoidal figures. 
Therefore this is not seen as a problem - especially this lack of support 
is explicitly stated here.
 
ALGORITHM REFERENCES

1.  "Cartographic Projection Procedures for the UNIX Environment - 
     A User's Manual" by Gerald I. Evenden, USGS Open File Report 90-284
    and Release 4 Interim Reports (2003)

2.  Snyder, John P., "Flattening the Earth - Two Thousand Years of Map 
    Projections", Univ. Chicago Press, 1993
*******************************************************************************/

Proj4js.Proj.cea = {

/* Initialize the Cylindrical Equal Area projection
  -------------------------------------------*/
  init: function() {
    //no-op
    if (!this.sphere){
	    this.k0 = Proj4js.common.msfnz(this.e, Math.sin(this.lat_ts), Math.cos(this.lat_ts));
    }
  },


  /* Cylindrical Equal Area forward equations--mapping lat,long to x,y
    ------------------------------------------------------------*/
  forward: function(p) {
    var lon=p.x;
    var lat=p.y;
    var x,y;
    /* Forward equations
      -----------------*/
    var dlon = Proj4js.common.adjust_lon(lon -this.long0);
    if (this.sphere){
	x = this.x0 + this.a * dlon * Math.cos(this.lat_ts);
	y = this.y0 + this.a * Math.sin(lat) / Math.cos(this.lat_ts);
    } else {
	var qs = Proj4js.common.qsfnz(this.e,Math.sin(lat));
	x = this.x0 + this.a*this.k0*dlon;
	y = this.y0 + this.a*qs*0.5/this.k0;
    }

    p.x=x;
    p.y=y;
    return p;
  },//ceaFwd()

  /* Cylindrical Equal Area inverse equations--mapping x,y to lat/long
    ------------------------------------------------------------*/
  inverse: function(p) {
    p.x -= this.x0;
    p.y -= this.y0;
    var lon, lat;
    
    if (this.sphere){
	lon = Proj4js.common.adjust_lon( this.long0 + (p.x / this.a) / Math.cos(this.lat_ts) );
        lat = Math.asin( (p.y/this.a) * Math.cos(this.lat_ts) );
    } else {
	lat=Proj4js.common.iqsfnz(this.e,2.0*p.y*this.k0/this.a);
	lon = Proj4js.common.adjust_lon( this.long0 + p.x/(this.a*this.k0));
    }

    p.x=lon;
    p.y=lat;
    return p;
  }//ceaInv()
};

/* similar to equi.js FIXME proj4 uses eqc */
Proj4js.Proj.eqc = {
  init : function() {

      if(!this.x0) this.x0=0;
      if(!this.y0) this.y0=0;
      if(!this.lat0) this.lat0=0;
      if(!this.long0) this.long0=0;
      if(!this.lat_ts) this.lat_ts=0;
      if (!this.title) this.title = "Equidistant Cylindrical (Plate Carre)";

      this.rc= Math.cos(this.lat_ts);
    },


    // forward equations--mapping lat,long to x,y
    // -----------------------------------------------------------------
    forward : function(p) {

      var lon= p.x;
      var lat= p.y;

      var dlon = Proj4js.common.adjust_lon(lon - this.long0);
      var dlat = Proj4js.common.adjust_lat(lat - this.lat0 );
      p.x= this.x0 + (this.a*dlon*this.rc);
      p.y= this.y0 + (this.a*dlat        );
      return p;
    },

  // inverse equations--mapping x,y to lat/long
  // -----------------------------------------------------------------
  inverse : function(p) {

    var x= p.x;
    var y= p.y;

    p.x= Proj4js.common.adjust_lon(this.long0 + ((x - this.x0)/(this.a*this.rc)));
    p.y= Proj4js.common.adjust_lat(this.lat0  + ((y - this.y0)/(this.a        )));
    return p;
  }

};

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
/*******************************************************************************
NAME                             EQUIRECTANGULAR 

PURPOSE:	Transforms input longitude and latitude to Easting and
		Northing for the Equirectangular projection.  The
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
Proj4js.Proj.equi = {

  init: function() {
    if(!this.x0) this.x0=0;
    if(!this.y0) this.y0=0;
    if(!this.lat0) this.lat0=0;
    if(!this.long0) this.long0=0;
    ///this.t2;
  },



/* Equirectangular forward equations--mapping lat,long to x,y
  ---------------------------------------------------------*/
  forward: function(p) {

    var lon=p.x;				
    var lat=p.y;			

    var dlon = Proj4js.common.adjust_lon(lon - this.long0);
    var x = this.x0 +this. a * dlon *Math.cos(this.lat0);
    var y = this.y0 + this.a * lat;

    this.t1=x;
    this.t2=Math.cos(this.lat0);
    p.x=x;
    p.y=y;
    return p;
  },  //equiFwd()



/* Equirectangular inverse equations--mapping x,y to lat/long
  ---------------------------------------------------------*/
  inverse: function(p) {

    p.x -= this.x0;
    p.y -= this.y0;
    var lat = p.y /this. a;

    if ( Math.abs(lat) > Proj4js.common.HALF_PI) {
        Proj4js.reportError("equi:Inv:DataError");
    }
    var lon = Proj4js.common.adjust_lon(this.long0 + p.x / (this.a * Math.cos(this.lat0)));
    p.x=lon;
    p.y=lat;
  }//equiInv()
};




Proj4js.Proj.gauss = {

  init : function() {
    var sphi = Math.sin(this.lat0);
    var cphi = Math.cos(this.lat0);  
    cphi *= cphi;
    this.rc = Math.sqrt(1.0 - this.es) / (1.0 - this.es * sphi * sphi);
    this.C = Math.sqrt(1.0 + this.es * cphi * cphi / (1.0 - this.es));
    this.phic0 = Math.asin(sphi / this.C);
    this.ratexp = 0.5 * this.C * this.e;
    this.K = Math.tan(0.5 * this.phic0 + Proj4js.common.FORTPI) / (Math.pow(Math.tan(0.5*this.lat0 + Proj4js.common.FORTPI), this.C) * Proj4js.common.srat(this.e*sphi, this.ratexp));
  },

  forward : function(p) {
    var lon = p.x;
    var lat = p.y;

    p.y = 2.0 * Math.atan( this.K * Math.pow(Math.tan(0.5 * lat + Proj4js.common.FORTPI), this.C) * Proj4js.common.srat(this.e * Math.sin(lat), this.ratexp) ) - Proj4js.common.HALF_PI;
    p.x = this.C * lon;
    return p;
  },

  inverse : function(p) {
    var DEL_TOL = 1e-14;
    var lon = p.x / this.C;
    var lat = p.y;
    var num = Math.pow(Math.tan(0.5 * lat + Proj4js.common.FORTPI)/this.K, 1./this.C);
    for (var i = Proj4js.common.MAX_ITER; i>0; --i) {
      lat = 2.0 * Math.atan(num * Proj4js.common.srat(this.e * Math.sin(p.y), -0.5 * this.e)) - Proj4js.common.HALF_PI;
      if (Math.abs(lat - p.y) < DEL_TOL) break;
      p.y = lat;
    }	
    /* convergence failed */
    if (!i) {
      Proj4js.reportError("gauss:inverse:convergence failed");
      return null;
    }
    p.x = lon;
    p.y = lat;
    return p;
  }
};


/*****************************************************************************
NAME                             GNOMONIC

PURPOSE:	Transforms input longitude and latitude to Easting and
		Northing for the Gnomonic Projection.
                Implementation based on the existing sterea and ortho
                implementations.

PROGRAMMER              DATE
----------              ----
Richard Marsden         November 2009

ALGORITHM REFERENCES

1.  Snyder, John P., "Flattening the Earth - Two Thousand Years of Map 
    Projections", University of Chicago Press 1993

2.  Wolfram Mathworld "Gnomonic Projection"
    http://mathworld.wolfram.com/GnomonicProjection.html
    Accessed: 12th November 2009
******************************************************************************/

Proj4js.Proj.gnom = {

  /* Initialize the Gnomonic projection
    -------------------------------------*/
  init: function(def) {

    /* Place parameters in static storage for common use
      -------------------------------------------------*/
    this.sin_p14=Math.sin(this.lat0);
    this.cos_p14=Math.cos(this.lat0);
    // Approximation for projecting points to the horizon (infinity)
    this.infinity_dist = 1000 * this.a;
    this.rc = 1;
  },


  /* Gnomonic forward equations--mapping lat,long to x,y
    ---------------------------------------------------*/
  forward: function(p) {
    var sinphi, cosphi;	/* sin and cos value				*/
    var dlon;		/* delta longitude value			*/
    var coslon;		/* cos of longitude				*/
    var ksp;		/* scale factor					*/
    var g;		
    var x, y;
    var lon=p.x;
    var lat=p.y;	
    /* Forward equations
      -----------------*/
    dlon = Proj4js.common.adjust_lon(lon - this.long0);

    sinphi=Math.sin(lat);
    cosphi=Math.cos(lat);	

    coslon = Math.cos(dlon);
    g = this.sin_p14 * sinphi + this.cos_p14 * cosphi * coslon;
    ksp = 1.0;
    if ((g > 0) || (Math.abs(g) <= Proj4js.common.EPSLN)) {
      x = this.x0 + this.a * ksp * cosphi * Math.sin(dlon) / g;
      y = this.y0 + this.a * ksp * (this.cos_p14 * sinphi - this.sin_p14 * cosphi * coslon) / g;
    } else {
      Proj4js.reportError("orthoFwdPointError");

      // Point is in the opposing hemisphere and is unprojectable
      // We still need to return a reasonable point, so we project 
      // to infinity, on a bearing 
      // equivalent to the northern hemisphere equivalent
      // This is a reasonable approximation for short shapes and lines that 
      // straddle the horizon.

      x = this.x0 + this.infinity_dist * cosphi * Math.sin(dlon);
      y = this.y0 + this.infinity_dist * (this.cos_p14 * sinphi - this.sin_p14 * cosphi * coslon);

    }
    p.x=x;
    p.y=y;
    return p;
  },


  inverse: function(p) {
    var rh;		/* Rho */
    var z;		/* angle */
    var sinc, cosc;
    var c;
    var lon , lat;

    /* Inverse equations
      -----------------*/
    p.x = (p.x - this.x0) / this.a;
    p.y = (p.y - this.y0) / this.a;

    p.x /= this.k0;
    p.y /= this.k0;

    if ( (rh = Math.sqrt(p.x * p.x + p.y * p.y)) ) {
      c = Math.atan2(rh, this.rc);
      sinc = Math.sin(c);
      cosc = Math.cos(c);

      lat = Proj4js.common.asinz(cosc*this.sin_p14 + (p.y*sinc*this.cos_p14) / rh);
      lon = Math.atan2(p.x*sinc, rh*this.cos_p14*cosc - p.y*this.sin_p14*sinc);
      lon = Proj4js.common.adjust_lon(this.long0+lon);
    } else {
      lat = this.phic0;
      lon = 0.0;
    }
 
    p.x=lon;
    p.y=lat;
    return p;
  }
};



Proj4js.Proj.gstmerc = {
  init : function() {

    // array of:  a, b, lon0, lat0, k0, x0, y0
      var temp= this.b / this.a;
      this.e= Math.sqrt(1.0 - temp*temp);
      this.lc= this.long0;
      this.rs= Math.sqrt(1.0+this.e*this.e*Math.pow(Math.cos(this.lat0),4.0)/(1.0-this.e*this.e));
      var sinz= Math.sin(this.lat0);
      var pc= Math.asin(sinz/this.rs);
      var sinzpc= Math.sin(pc);
      this.cp= Proj4js.common.latiso(0.0,pc,sinzpc)-this.rs*Proj4js.common.latiso(this.e,this.lat0,sinz);
      this.n2= this.k0*this.a*Math.sqrt(1.0-this.e*this.e)/(1.0-this.e*this.e*sinz*sinz);
      this.xs= this.x0;
      this.ys= this.y0-this.n2*pc;

      if (!this.title) this.title = "Gauss Schreiber transverse mercator";
    },


    // forward equations--mapping lat,long to x,y
    // -----------------------------------------------------------------
    forward : function(p) {

      var lon= p.x;
      var lat= p.y;

      var L= this.rs*(lon-this.lc);
      var Ls= this.cp+(this.rs*Proj4js.common.latiso(this.e,lat,Math.sin(lat)));
      var lat1= Math.asin(Math.sin(L)/Proj4js.common.cosh(Ls));
      var Ls1= Proj4js.common.latiso(0.0,lat1,Math.sin(lat1));
      p.x= this.xs+(this.n2*Ls1);
      p.y= this.ys+(this.n2*Math.atan(Proj4js.common.sinh(Ls)/Math.cos(L)));
      return p;
    },

  // inverse equations--mapping x,y to lat/long
  // -----------------------------------------------------------------
  inverse : function(p) {

    var x= p.x;
    var y= p.y;

    var L= Math.atan(Proj4js.common.sinh((x-this.xs)/this.n2)/Math.cos((y-this.ys)/this.n2));
    var lat1= Math.asin(Math.sin((y-this.ys)/this.n2)/Proj4js.common.cosh((x-this.xs)/this.n2));
    var LC= Proj4js.common.latiso(0.0,lat1,Math.sin(lat1));
    p.x= this.lc+L/this.rs;
    p.y= Proj4js.common.invlatiso(this.e,(LC-this.cp)/this.rs);
    return p;
  }

};

/**
   NOTES: According to EPSG the full Krovak projection method should have
          the following parameters.  Within PROJ.4 the azimuth, and pseudo
          standard parallel are hardcoded in the algorithm and can't be 
          altered from outside.  The others all have defaults to match the
          common usage with Krovak projection.

  lat_0 = latitude of centre of the projection
         
  lon_0 = longitude of centre of the projection
  
  ** = azimuth (true) of the centre line passing through the centre of the projection

  ** = latitude of pseudo standard parallel
   
  k  = scale factor on the pseudo standard parallel
  
  x_0 = False Easting of the centre of the projection at the apex of the cone
  
  y_0 = False Northing of the centre of the projection at the apex of the cone

 **/

Proj4js.Proj.krovak = {

	init: function() {
		/* we want Bessel as fixed ellipsoid */
		this.a =  6377397.155;
		this.es = 0.006674372230614;
		this.e = Math.sqrt(this.es);
		/* if latitude of projection center is not set, use 49d30'N */
		if (!this.lat0) {
			this.lat0 = 0.863937979737193;
		}
		if (!this.long0) {
			this.long0 = 0.7417649320975901 - 0.308341501185665;
		}
		/* if scale not set default to 0.9999 */
		if (!this.k0) {
			this.k0 = 0.9999;
		}
		this.s45 = 0.785398163397448;    /* 45� */
		this.s90 = 2 * this.s45;
		this.fi0 = this.lat0;    /* Latitude of projection centre 49� 30' */
      		/*  Ellipsoid Bessel 1841 a = 6377397.155m 1/f = 299.1528128,
      					 e2=0.006674372230614;
		 */
		this.e2 = this.es;       /* 0.006674372230614; */
		this.e = Math.sqrt(this.e2);
		this.alfa = Math.sqrt(1. + (this.e2 * Math.pow(Math.cos(this.fi0), 4)) / (1. - this.e2));
		this.uq = 1.04216856380474;      /* DU(2, 59, 42, 42.69689) */
		this.u0 = Math.asin(Math.sin(this.fi0) / this.alfa);
		this.g = Math.pow(   (1. + this.e * Math.sin(this.fi0)) / (1. - this.e * Math.sin(this.fi0)) , this.alfa * this.e / 2.  );
		this.k = Math.tan( this.u0 / 2. + this.s45) / Math.pow  (Math.tan(this.fi0 / 2. + this.s45) , this.alfa) * this.g;
		this.k1 = this.k0;
		this.n0 = this.a * Math.sqrt(1. - this.e2) / (1. - this.e2 * Math.pow(Math.sin(this.fi0), 2));
		this.s0 = 1.37008346281555;       /* Latitude of pseudo standard parallel 78� 30'00" N */
		this.n = Math.sin(this.s0);
		this.ro0 = this.k1 * this.n0 / Math.tan(this.s0);
		this.ad = this.s90 - this.uq;
	},
	
	/* ellipsoid */
	/* calculate xy from lat/lon */
	/* Constants, identical to inverse transform function */
	forward: function(p) {
		var gfi, u, deltav, s, d, eps, ro;
		var lon = p.x;
		var lat = p.y;
		var delta_lon = Proj4js.common.adjust_lon(lon - this.long0); // Delta longitude
		/* Transformation */
		gfi = Math.pow ( ((1. + this.e * Math.sin(lat)) / (1. - this.e * Math.sin(lat))) , (this.alfa * this.e / 2.));
		u= 2. * (Math.atan(this.k * Math.pow( Math.tan(lat / 2. + this.s45), this.alfa) / gfi)-this.s45);
		deltav = - delta_lon * this.alfa;
		s = Math.asin(Math.cos(this.ad) * Math.sin(u) + Math.sin(this.ad) * Math.cos(u) * Math.cos(deltav));
		d = Math.asin(Math.cos(u) * Math.sin(deltav) / Math.cos(s));
		eps = this.n * d;
		ro = this.ro0 * Math.pow(Math.tan(this.s0 / 2. + this.s45) , this.n) / Math.pow(Math.tan(s / 2. + this.s45) , this.n);
		/* x and y are reverted! */
		//p.y = ro * Math.cos(eps) / a;
		//p.x = ro * Math.sin(eps) / a;
		p.y = ro * Math.cos(eps) / 1.0;
		p.x = ro * Math.sin(eps) / 1.0;

		if(!this.czech) {
	    		p.y *= -1.0;
	    		p.x *= -1.0;
		}
		return (p);
	},

	/* calculate lat/lon from xy */
	inverse: function(p) {
		/* Constants, identisch wie in der Umkehrfunktion */
		var u, deltav, s, d, eps, ro, fi1;
		var ok;

		/* Transformation */
		/* revert y, x*/
		var tmp = p.x;
		p.x=p.y;
		p.y=tmp;
		if(!this.czech) {
	    		p.y *= -1.0;
	    		p.x *= -1.0;
		}
		ro = Math.sqrt(p.x * p.x + p.y * p.y);
		eps = Math.atan2(p.y, p.x);
		d = eps / Math.sin(this.s0);
		s = 2. * (Math.atan(  Math.pow(this.ro0 / ro, 1. / this.n) * Math.tan(this.s0 / 2. + this.s45)) - this.s45);
		u = Math.asin(Math.cos(this.ad) * Math.sin(s) - Math.sin(this.ad) * Math.cos(s) * Math.cos(d));
		deltav = Math.asin(Math.cos(s) * Math.sin(d) / Math.cos(u));
		p.x = this.long0 - deltav / this.alfa;
		/* ITERATION FOR lat */
		fi1 = u;
		ok = 0;
		var iter = 0;
		do {
			p.y = 2. * ( Math.atan( Math.pow( this.k, -1. / this.alfa)  *
                            Math.pow( Math.tan(u / 2. + this.s45) , 1. / this.alfa)  *
                            Math.pow( (1. + this.e * Math.sin(fi1)) / (1. - this.e * Math.sin(fi1)) , this.e / 2.)
                           )  - this.s45);
      			if (Math.abs(fi1 - p.y) < 0.0000000001) ok=1;
			fi1 = p.y;
			iter += 1;
		} while (ok==0 && iter < 15);
		if (iter >= 15) {
			Proj4js.reportError("PHI3Z-CONV:Latitude failed to converge after 15 iterations");
			//console.log('iter:', iter);
			return null;
		}
   		
		return (p);
	}
};

/*******************************************************************************
NAME                  LAMBERT AZIMUTHAL EQUAL-AREA
 
PURPOSE:	Transforms input longitude and latitude to Easting and
		Northing for the Lambert Azimuthal Equal-Area projection.  The
		longitude and latitude must be in radians.  The Easting
		and Northing values will be returned in meters.

PROGRAMMER              DATE            
----------              ----           
D. Steinwand, EROS      March, 1991   

This function was adapted from the Lambert Azimuthal Equal Area projection
code (FORTRAN) in the General Cartographic Transformation Package software
which is available from the U.S. Geological Survey National Mapping Division.
 
ALGORITHM REFERENCES

1.  "New Equal-Area Map Projections for Noncircular Regions", John P. Snyder,
    The American Cartographer, Vol 15, No. 4, October 1988, pp. 341-355.

2.  Snyder, John P., "Map Projections--A Working Manual", U.S. Geological
    Survey Professional Paper 1395 (Supersedes USGS Bulletin 1532), United
    State Government Printing Office, Washington D.C., 1987.

3.  "Software Documentation for GCTP General Cartographic Transformation
    Package", U.S. Geological Survey National Mapping Division, May 1982.
*******************************************************************************/

Proj4js.Proj.laea = {
  S_POLE: 1,
  N_POLE: 2,
  EQUIT: 3,
  OBLIQ: 4,


/* Initialize the Lambert Azimuthal Equal Area projection
  ------------------------------------------------------*/
  init: function() {
    var t = Math.abs(this.lat0);
    if (Math.abs(t - Proj4js.common.HALF_PI) < Proj4js.common.EPSLN) {
      this.mode = this.lat0 < 0. ? this.S_POLE : this.N_POLE;
    } else if (Math.abs(t) < Proj4js.common.EPSLN) {
      this.mode = this.EQUIT;
    } else {
      this.mode = this.OBLIQ;
    }
    if (this.es > 0) {
      var sinphi;
  
      this.qp = Proj4js.common.qsfnz(this.e, 1.0);
      this.mmf = .5 / (1. - this.es);
      this.apa = this.authset(this.es);
      switch (this.mode) {
        case this.N_POLE:
        case this.S_POLE:
          this.dd = 1.;
          break;
        case this.EQUIT:
          this.rq = Math.sqrt(.5 * this.qp);
          this.dd = 1. / this.rq;
          this.xmf = 1.;
          this.ymf = .5 * this.qp;
          break;
        case this.OBLIQ:
          this.rq = Math.sqrt(.5 * this.qp);
          sinphi = Math.sin(this.lat0);
          this.sinb1 = Proj4js.common.qsfnz(this.e, sinphi) / this.qp;
          this.cosb1 = Math.sqrt(1. - this.sinb1 * this.sinb1);
          this.dd = Math.cos(this.lat0) / (Math.sqrt(1. - this.es * sinphi * sinphi) * this.rq * this.cosb1);
          this.ymf = (this.xmf = this.rq) / this.dd;
          this.xmf *= this.dd;
          break;
      }
    } else {
      if (this.mode == this.OBLIQ) {
        this.sinph0 = Math.sin(this.lat0);
        this.cosph0 = Math.cos(this.lat0);
      }
    }
  },

/* Lambert Azimuthal Equal Area forward equations--mapping lat,long to x,y
  -----------------------------------------------------------------------*/
  forward: function(p) {

    /* Forward equations
      -----------------*/
    var x,y;
    var lam=p.x;
    var phi=p.y;
    lam = Proj4js.common.adjust_lon(lam - this.long0);
    
    if (this.sphere) {
        var coslam, cosphi, sinphi;
      
        sinphi = Math.sin(phi);
        cosphi = Math.cos(phi);
        coslam = Math.cos(lam);
        switch (this.mode) {
          case this.OBLIQ:
          case this.EQUIT:
            y = (this.mode == this.EQUIT) ? 1. + cosphi * coslam : 1. + this.sinph0 * sinphi + this.cosph0 * cosphi * coslam;
            if (y <= Proj4js.common.EPSLN) {
              Proj4js.reportError("laea:fwd:y less than eps");
              return null;
            }
            y = Math.sqrt(2. / y);
            x = y * cosphi * Math.sin(lam);
            y *= (this.mode == this.EQUIT) ? sinphi : this.cosph0 * sinphi - this.sinph0 * cosphi * coslam;
            break;
          case this.N_POLE:
            coslam = -coslam;
          case this.S_POLE:
            if (Math.abs(phi + this.phi0) < Proj4js.common.EPSLN) {
              Proj4js.reportError("laea:fwd:phi < eps");
              return null;
            }
            y = Proj4js.common.FORTPI - phi * .5;
            y = 2. * ((this.mode == this.S_POLE) ? Math.cos(y) : Math.sin(y));
            x = y * Math.sin(lam);
            y *= coslam;
            break;
        }
    } else {
        var coslam, sinlam, sinphi, q, sinb=0.0, cosb=0.0, b=0.0;
      
        coslam = Math.cos(lam);
        sinlam = Math.sin(lam);
        sinphi = Math.sin(phi);
        q = Proj4js.common.qsfnz(this.e, sinphi);
        if (this.mode == this.OBLIQ || this.mode == this.EQUIT) {
          sinb = q / this.qp;
          cosb = Math.sqrt(1. - sinb * sinb);
        }
        switch (this.mode) {
          case this.OBLIQ:
            b = 1. + this.sinb1 * sinb + this.cosb1 * cosb * coslam;
            break;
          case this.EQUIT:
            b = 1. + cosb * coslam;
            break;
          case this.N_POLE:
            b = Proj4js.common.HALF_PI + phi;
            q = this.qp - q;
            break;
          case this.S_POLE:
            b = phi - Proj4js.common.HALF_PI;
            q = this.qp + q;
            break;
        }
        if (Math.abs(b) < Proj4js.common.EPSLN) {
            Proj4js.reportError("laea:fwd:b < eps");
            return null;
        }
        switch (this.mode) {
          case this.OBLIQ:
          case this.EQUIT:
            b = Math.sqrt(2. / b);
            if (this.mode == this.OBLIQ) {
              y = this.ymf * b * (this.cosb1 * sinb - this.sinb1 * cosb * coslam);
            } else {
              y = (b = Math.sqrt(2. / (1. + cosb * coslam))) * sinb * this.ymf;
            }
            x = this.xmf * b * cosb * sinlam;
            break;
          case this.N_POLE:
          case this.S_POLE:
            if (q >= 0.) {
              x = (b = Math.sqrt(q)) * sinlam;
              y = coslam * ((this.mode == this.S_POLE) ? b : -b);
            } else {
              x = y = 0.;
            }
            break;
        }
    }

    //v 1.0
    /*
    var sin_lat=Math.sin(lat);
    var cos_lat=Math.cos(lat);

    var sin_delta_lon=Math.sin(delta_lon);
    var cos_delta_lon=Math.cos(delta_lon);

    var g =this.sin_lat_o * sin_lat +this.cos_lat_o * cos_lat * cos_delta_lon;
    if (g == -1.0) {
      Proj4js.reportError("laea:fwd:Point projects to a circle of radius "+ 2.0 * R);
      return null;
    }
    var ksp = this.a * Math.sqrt(2.0 / (1.0 + g));
    var x = ksp * cos_lat * sin_delta_lon + this.x0;
    var y = ksp * (this.cos_lat_o * sin_lat - this.sin_lat_o * cos_lat * cos_delta_lon) + this.y0;
    */
    p.x = this.a*x + this.x0;
    p.y = this.a*y + this.y0;
    return p;
  },//lamazFwd()

/* Inverse equations
  -----------------*/
  inverse: function(p) {
    p.x -= this.x0;
    p.y -= this.y0;
    var x = p.x/this.a;
    var y = p.y/this.a;
    var lam, phi;

    if (this.sphere) {
        var  cosz=0.0, rh, sinz=0.0;
      
        rh = Math.sqrt(x*x + y*y);
        phi = rh * .5;
        if (phi > 1.) {
          Proj4js.reportError("laea:Inv:DataError");
          return null;
        }
        phi = 2. * Math.asin(phi);
        if (this.mode == this.OBLIQ || this.mode == this.EQUIT) {
          sinz = Math.sin(phi);
          cosz = Math.cos(phi);
        }
        switch (this.mode) {
        case this.EQUIT:
          phi = (Math.abs(rh) <= Proj4js.common.EPSLN) ? 0. : Math.asin(y * sinz / rh);
          x *= sinz;
          y = cosz * rh;
          break;
        case this.OBLIQ:
          phi = (Math.abs(rh) <= Proj4js.common.EPSLN) ? this.phi0 : Math.asin(cosz * this.sinph0 + y * sinz * this.cosph0 / rh);
          x *= sinz * this.cosph0;
          y = (cosz - Math.sin(phi) * this.sinph0) * rh;
          break;
        case this.N_POLE:
          y = -y;
          phi = Proj4js.common.HALF_PI - phi;
          break;
        case this.S_POLE:
          phi -= Proj4js.common.HALF_PI;
          break;
        }
        lam = (y == 0. && (this.mode == this.EQUIT || this.mode == this.OBLIQ)) ? 0. : Math.atan2(x, y);
    } else {
        var cCe, sCe, q, rho, ab=0.0;
      
        switch (this.mode) {
          case this.EQUIT:
          case this.OBLIQ:
            x /= this.dd;
            y *=  this.dd;
            rho = Math.sqrt(x*x + y*y);
            if (rho < Proj4js.common.EPSLN) {
              p.x = 0.;
              p.y = this.phi0;
              return p;
            }
            sCe = 2. * Math.asin(.5 * rho / this.rq);
            cCe = Math.cos(sCe);
            x *= (sCe = Math.sin(sCe));
            if (this.mode == this.OBLIQ) {
              ab = cCe * this.sinb1 + y * sCe * this.cosb1 / rho;
              q = this.qp * ab;
              y = rho * this.cosb1 * cCe - y * this.sinb1 * sCe;
            } else {
              ab = y * sCe / rho;
              q = this.qp * ab;
              y = rho * cCe;
            }
            break;
          case this.N_POLE:
            y = -y;
          case this.S_POLE:
            q = (x * x + y * y);
            if (!q ) {
              p.x = 0.;
              p.y = this.phi0;
              return p;
            }
            /*
            q = this.qp - q;
            */
            ab = 1. - q / this.qp;
            if (this.mode == this.S_POLE) {
              ab = - ab;
            }
            break;
        }
        lam = Math.atan2(x, y);
        phi = this.authlat(Math.asin(ab), this.apa);
    }

    /*
    var Rh = Math.Math.sqrt(p.x *p.x +p.y * p.y);
    var temp = Rh / (2.0 * this.a);

    if (temp > 1) {
      Proj4js.reportError("laea:Inv:DataError");
      return null;
    }

    var z = 2.0 * Proj4js.common.asinz(temp);
    var sin_z=Math.sin(z);
    var cos_z=Math.cos(z);

    var lon =this.long0;
    if (Math.abs(Rh) > Proj4js.common.EPSLN) {
       var lat = Proj4js.common.asinz(this.sin_lat_o * cos_z +this. cos_lat_o * sin_z *p.y / Rh);
       var temp =Math.abs(this.lat0) - Proj4js.common.HALF_PI;
       if (Math.abs(temp) > Proj4js.common.EPSLN) {
          temp = cos_z -this.sin_lat_o * Math.sin(lat);
          if(temp!=0.0) lon=Proj4js.common.adjust_lon(this.long0+Math.atan2(p.x*sin_z*this.cos_lat_o,temp*Rh));
       } else if (this.lat0 < 0.0) {
          lon = Proj4js.common.adjust_lon(this.long0 - Math.atan2(-p.x,p.y));
       } else {
          lon = Proj4js.common.adjust_lon(this.long0 + Math.atan2(p.x, -p.y));
       }
    } else {
      lat = this.lat0;
    }
    */
    //return(OK);
    p.x = Proj4js.common.adjust_lon(this.long0+lam);
    p.y = phi;
    return p;
  },//lamazInv()
  
/* determine latitude from authalic latitude */
  P00: .33333333333333333333,
  P01: .17222222222222222222,
  P02: .10257936507936507936,
  P10: .06388888888888888888,
  P11: .06640211640211640211,
  P20: .01641501294219154443,
  
  authset: function(es) {
    var t;
    var APA = new Array();
    APA[0] = es * this.P00;
    t = es * es;
    APA[0] += t * this.P01;
    APA[1] = t * this.P10;
    t *= es;
    APA[0] += t * this.P02;
    APA[1] += t * this.P11;
    APA[2] = t * this.P20;
    return APA;
  },
  
  authlat: function(beta, APA) {
    var t = beta+beta;
    return(beta + APA[0] * Math.sin(t) + APA[1] * Math.sin(t+t) + APA[2] * Math.sin(t+t+t));
  }
  
};




/*******************************************************************************
NAME                            LAMBERT CONFORMAL CONIC

PURPOSE:	Transforms input longitude and latitude to Easting and
		Northing for the Lambert Conformal Conic projection.  The
		longitude and latitude must be in radians.  The Easting
		and Northing values will be returned in meters.


ALGORITHM REFERENCES

1.  Snyder, John P., "Map Projections--A Working Manual", U.S. Geological
    Survey Professional Paper 1395 (Supersedes USGS Bulletin 1532), United
    State Government Printing Office, Washington D.C., 1987.

2.  Snyder, John P. and Voxland, Philip M., "An Album of Map Projections",
    U.S. Geological Survey Professional Paper 1453 , United State Government
*******************************************************************************/


//<2104> +proj=lcc +lat_1=10.16666666666667 +lat_0=10.16666666666667 +lon_0=-71.60561777777777 +k_0=1 +x0=-17044 +x0=-23139.97 +ellps=intl +units=m +no_defs  no_defs

// Initialize the Lambert Conformal conic projection
// -----------------------------------------------------------------

//Proj4js.Proj.lcc = Class.create();
Proj4js.Proj.lcc = {
  init : function() {

    // array of:  r_maj,r_min,lat1,lat2,c_lon,c_lat,false_east,false_north
    //double c_lat;                   /* center latitude                      */
    //double c_lon;                   /* center longitude                     */
    //double lat1;                    /* first standard parallel              */
    //double lat2;                    /* second standard parallel             */
    //double r_maj;                   /* major axis                           */
    //double r_min;                   /* minor axis                           */
    //double false_east;              /* x offset in meters                   */
    //double false_north;             /* y offset in meters                   */

      if (!this.lat2){this.lat2=this.lat1;}//if lat2 is not defined
      if (!this.k0) this.k0 = 1.0;

    // Standard Parallels cannot be equal and on opposite sides of the equator
      if (Math.abs(this.lat1+this.lat2) < Proj4js.common.EPSLN) {
        Proj4js.reportError("lcc:init: Equal Latitudes");
        return;
      }

      var temp = this.b / this.a;
      this.e = Math.sqrt(1.0 - temp*temp);

      var sin1 = Math.sin(this.lat1);
      var cos1 = Math.cos(this.lat1);
      var ms1 = Proj4js.common.msfnz(this.e, sin1, cos1);
      var ts1 = Proj4js.common.tsfnz(this.e, this.lat1, sin1);

      var sin2 = Math.sin(this.lat2);
      var cos2 = Math.cos(this.lat2);
      var ms2 = Proj4js.common.msfnz(this.e, sin2, cos2);
      var ts2 = Proj4js.common.tsfnz(this.e, this.lat2, sin2);

      var ts0 = Proj4js.common.tsfnz(this.e, this.lat0, Math.sin(this.lat0));

      if (Math.abs(this.lat1 - this.lat2) > Proj4js.common.EPSLN) {
        this.ns = Math.log(ms1/ms2)/Math.log(ts1/ts2);
      } else {
        this.ns = sin1;
      }
      this.f0 = ms1 / (this.ns * Math.pow(ts1, this.ns));
      this.rh = this.a * this.f0 * Math.pow(ts0, this.ns);
      if (!this.title) this.title = "Lambert Conformal Conic";
    },


    // Lambert Conformal conic forward equations--mapping lat,long to x,y
    // -----------------------------------------------------------------
    forward : function(p) {

      var lon = p.x;
      var lat = p.y;

      // singular cases :
      if (Math.abs(2*Math.abs(lat)-Proj4js.common.PI)<=Proj4js.common.EPSLN) {
          lat= Proj4js.common.sign(lat)*(Proj4js.common.HALF_PI - 2*Proj4js.common.EPSLN);
      }

      var con  = Math.abs( Math.abs(lat) - Proj4js.common.HALF_PI);
      var ts, rh1;
      if (con > Proj4js.common.EPSLN) {
        ts = Proj4js.common.tsfnz(this.e, lat, Math.sin(lat) );
        rh1 = this.a * this.f0 * Math.pow(ts, this.ns);
      } else {
        con = lat * this.ns;
        if (con <= 0) {
          Proj4js.reportError("lcc:forward: No Projection");
          return null;
        }
        rh1 = 0;
      }
      var theta = this.ns * Proj4js.common.adjust_lon(lon - this.long0);
      p.x = this.k0 * (rh1 * Math.sin(theta)) + this.x0;
      p.y = this.k0 * (this.rh - rh1 * Math.cos(theta)) + this.y0;

      return p;
    },

  // Lambert Conformal Conic inverse equations--mapping x,y to lat/long
  // -----------------------------------------------------------------
  inverse : function(p) {

    var rh1, con, ts;
    var lat, lon;
    var x = (p.x - this.x0)/this.k0;
    var y = (this.rh - (p.y - this.y0)/this.k0);
    if (this.ns > 0) {
      rh1 = Math.sqrt (x * x + y * y);
      con = 1.0;
    } else {
      rh1 = -Math.sqrt (x * x + y * y);
      con = -1.0;
    }
    var theta = 0.0;
    if (rh1 != 0) {
      theta = Math.atan2((con * x),(con * y));
    }
    if ((rh1 != 0) || (this.ns > 0.0)) {
      con = 1.0/this.ns;
      ts = Math.pow((rh1/(this.a * this.f0)), con);
      lat = Proj4js.common.phi2z(this.e, ts);
      if (lat == -9999) return null;
    } else {
      lat = -Proj4js.common.HALF_PI;
    }
    lon = Proj4js.common.adjust_lon(theta/this.ns + this.long0);

    p.x = lon;
    p.y = lat;
    return p;
  }
};





/*******************************************************************************
NAME                            MERCATOR

PURPOSE:	Transforms input longitude and latitude to Easting and
		Northing for the Mercator projection.  The
		longitude and latitude must be in radians.  The Easting
		and Northing values will be returned in meters.

PROGRAMMER              DATE
----------              ----
D. Steinwand, EROS      Nov, 1991
T. Mittan		Mar, 1993

ALGORITHM REFERENCES

1.  Snyder, John P., "Map Projections--A Working Manual", U.S. Geological
    Survey Professional Paper 1395 (Supersedes USGS Bulletin 1532), United
    State Government Printing Office, Washington D.C., 1987.

2.  Snyder, John P. and Voxland, Philip M., "An Album of Map Projections",
    U.S. Geological Survey Professional Paper 1453 , United State Government
    Printing Office, Washington D.C., 1989.
*******************************************************************************/

//static double r_major = a;		   /* major axis 				*/
//static double r_minor = b;		   /* minor axis 				*/
//static double lon_center = long0;	   /* Center longitude (projection center) */
//static double lat_origin =  lat0;	   /* center latitude			*/
//static double e,es;		           /* eccentricity constants		*/
//static double m1;		               /* small value m			*/
//static double false_northing = y0;   /* y offset in meters			*/
//static double false_easting = x0;	   /* x offset in meters			*/
//scale_fact = k0 

Proj4js.Proj.merc = {
  init : function() {
	var con= this.b / this.a;
	this.es = 1.0 - con*con;
	this.e = Math.sqrt( this.es );
	if (this.lat_ts) {
		if (this.sphere) {
			this.k0=Math.cos(this.lat_ts);
		} else {
			this.k0=Proj4js.common.msfnz(this.e, Math.sin(this.lat_ts), Math.cos(this.lat_ts));
		}
	} else {
		if (!this.k0){
			if (this.k){
				this.k0=this.k;
			} else {
				this.k0=1.0;
			}
		}
	}
  },

/* Mercator forward equations--mapping lat,long to x,y
  --------------------------------------------------*/

  forward : function(p) {	
    //alert("ll2m coords : "+coords);
    var lon = p.x;
    var lat = p.y;
    // convert to radians
    if ( lat*Proj4js.common.R2D > 90.0 && 
          lat*Proj4js.common.R2D < -90.0 && 
          lon*Proj4js.common.R2D > 180.0 && 
          lon*Proj4js.common.R2D < -180.0) {
      Proj4js.reportError("merc:forward: llInputOutOfRange: "+ lon +" : " + lat);
      return null;
    }

    var x,y;
    if(Math.abs( Math.abs(lat) - Proj4js.common.HALF_PI)  <= Proj4js.common.EPSLN) {
      Proj4js.reportError("merc:forward: ll2mAtPoles");
      return null;
    } else {
      if (this.sphere) {
        x = this.x0 + this.a * this.k0 * Proj4js.common.adjust_lon(lon - this.long0);
        y = this.y0 + this.a * this.k0 * Math.log(Math.tan(Proj4js.common.FORTPI + 0.5*lat));
      } else {
        var sinphi = Math.sin(lat);
        var ts = Proj4js.common.tsfnz(this.e,lat,sinphi);
        x = this.x0 + this.a * this.k0 * Proj4js.common.adjust_lon(lon - this.long0);
        y = this.y0 - this.a * this.k0 * Math.log(ts);
      }
      p.x = x; 
      p.y = y;
      return p;
    }
  },


  /* Mercator inverse equations--mapping x,y to lat/long
  --------------------------------------------------*/
  inverse : function(p) {	

    var x = p.x - this.x0;
    var y = p.y - this.y0;
    var lon,lat;

    if (this.sphere) {
      lat = Proj4js.common.HALF_PI - 2.0 * Math.atan(Math.exp(-y / (this.a * this.k0)));
    } else {
      var ts = Math.exp(-y / (this.a * this.k0));
      lat = Proj4js.common.phi2z(this.e,ts);
      if(lat == -9999) {
        Proj4js.reportError("merc:inverse: lat = -9999");
        return null;
      }
    }
    lon = Proj4js.common.adjust_lon(this.long0+ x / (this.a * this.k0));

    p.x = lon;
    p.y = lat;
    return p;
  }
};

/*******************************************************************************
NAME                    MILLER CYLINDRICAL 

PURPOSE:	Transforms input longitude and latitude to Easting and
		Northing for the Miller Cylindrical projection.  The
		longitude and latitude must be in radians.  The Easting
		and Northing values will be returned in meters.

PROGRAMMER              DATE            
----------              ----           
T. Mittan		March, 1993

This function was adapted from the Lambert Azimuthal Equal Area projection
code (FORTRAN) in the General Cartographic Transformation Package software
which is available from the U.S. Geological Survey National Mapping Division.
 
ALGORITHM REFERENCES

1.  "New Equal-Area Map Projections for Noncircular Regions", John P. Snyder,
    The American Cartographer, Vol 15, No. 4, October 1988, pp. 341-355.

2.  Snyder, John P., "Map Projections--A Working Manual", U.S. Geological
    Survey Professional Paper 1395 (Supersedes USGS Bulletin 1532), United
    State Government Printing Office, Washington D.C., 1987.

3.  "Software Documentation for GCTP General Cartographic Transformation
    Package", U.S. Geological Survey National Mapping Division, May 1982.
*******************************************************************************/

Proj4js.Proj.mill = {

/* Initialize the Miller Cylindrical projection
  -------------------------------------------*/
  init: function() {
    //no-op
  },


  /* Miller Cylindrical forward equations--mapping lat,long to x,y
    ------------------------------------------------------------*/
  forward: function(p) {
    var lon=p.x;
    var lat=p.y;
    /* Forward equations
      -----------------*/
    var dlon = Proj4js.common.adjust_lon(lon -this.long0);
    var x = this.x0 + this.a * dlon;
    var y = this.y0 + this.a * Math.log(Math.tan((Proj4js.common.PI / 4.0) + (lat / 2.5))) * 1.25;

    p.x=x;
    p.y=y;
    return p;
  },//millFwd()

  /* Miller Cylindrical inverse equations--mapping x,y to lat/long
    ------------------------------------------------------------*/
  inverse: function(p) {
    p.x -= this.x0;
    p.y -= this.y0;

    var lon = Proj4js.common.adjust_lon(this.long0 + p.x /this.a);
    var lat = 2.5 * (Math.atan(Math.exp(0.8*p.y/this.a)) - Proj4js.common.PI / 4.0);

    p.x=lon;
    p.y=lat;
    return p;
  }//millInv()
};

/*******************************************************************************
NAME                            MOLLWEIDE

PURPOSE:	Transforms input longitude and latitude to Easting and
		Northing for the MOllweide projection.  The
		longitude and latitude must be in radians.  The Easting
		and Northing values will be returned in meters.

PROGRAMMER              DATE
----------              ----
D. Steinwand, EROS      May, 1991;  Updated Sept, 1992; Updated Feb, 1993
S. Nelson, EDC		Jun, 2993;	Made corrections in precision and
					number of iterations.

ALGORITHM REFERENCES

1.  Snyder, John P. and Voxland, Philip M., "An Album of Map Projections",
    U.S. Geological Survey Professional Paper 1453 , United State Government
    Printing Office, Washington D.C., 1989.

2.  Snyder, John P., "Map Projections--A Working Manual", U.S. Geological
    Survey Professional Paper 1395 (Supersedes USGS Bulletin 1532), United
    State Government Printing Office, Washington D.C., 1987.
*******************************************************************************/

Proj4js.Proj.moll = {

  /* Initialize the Mollweide projection
    ------------------------------------*/
  init: function(){
    //no-op
  },

  /* Mollweide forward equations--mapping lat,long to x,y
    ----------------------------------------------------*/
  forward: function(p) {

    /* Forward equations
      -----------------*/
    var lon=p.x;
    var lat=p.y;

    var delta_lon = Proj4js.common.adjust_lon(lon - this.long0);
    var theta = lat;
    var con = Proj4js.common.PI * Math.sin(lat);

    /* Iterate using the Newton-Raphson method to find theta
      -----------------------------------------------------*/
    for (var i=0;true;i++) {
       var delta_theta = -(theta + Math.sin(theta) - con)/ (1.0 + Math.cos(theta));
       theta += delta_theta;
       if (Math.abs(delta_theta) < Proj4js.common.EPSLN) break;
       if (i >= 50) {
          Proj4js.reportError("moll:Fwd:IterationError");
         //return(241);
       }
    }
    theta /= 2.0;

    /* If the latitude is 90 deg, force the x coordinate to be "0 + false easting"
       this is done here because of precision problems with "cos(theta)"
       --------------------------------------------------------------------------*/
    if (Proj4js.common.PI/2 - Math.abs(lat) < Proj4js.common.EPSLN) delta_lon =0;
    var x = 0.900316316158 * this.a * delta_lon * Math.cos(theta) + this.x0;
    var y = 1.4142135623731 * this.a * Math.sin(theta) + this.y0;

    p.x=x;
    p.y=y;
    return p;
  },

  inverse: function(p){
    var theta;
    var arg;

    /* Inverse equations
      -----------------*/
    p.x-= this.x0;
    p.y -= this.y0;
    var arg = p.y /  (1.4142135623731 * this.a);

    /* Because of division by zero problems, 'arg' can not be 1.0.  Therefore
       a number very close to one is used instead.
       -------------------------------------------------------------------*/
    if(Math.abs(arg) > 0.999999999999) arg=0.999999999999;
    var theta =Math.asin(arg);
    var lon = Proj4js.common.adjust_lon(this.long0 + (p.x / (0.900316316158 * this.a * Math.cos(theta))));
    if(lon < (-Proj4js.common.PI)) lon= -Proj4js.common.PI;
    if(lon > Proj4js.common.PI) lon= Proj4js.common.PI;
    arg = (2.0 * theta + Math.sin(2.0 * theta)) / Proj4js.common.PI;
    if(Math.abs(arg) > 1.0)arg=1.0;
    var lat = Math.asin(arg);
    //return(OK);

    p.x=lon;
    p.y=lat;
    return p;
  }
};


/*******************************************************************************
NAME                            NEW ZEALAND MAP GRID

PURPOSE:	Transforms input longitude and latitude to Easting and
		Northing for the New Zealand Map Grid projection.  The
		longitude and latitude must be in radians.  The Easting
		and Northing values will be returned in meters.


ALGORITHM REFERENCES

1.  Department of Land and Survey Technical Circular 1973/32
      http://www.linz.govt.nz/docs/miscellaneous/nz-map-definition.pdf

2.  OSG Technical Report 4.1
      http://www.linz.govt.nz/docs/miscellaneous/nzmg.pdf


IMPLEMENTATION NOTES

The two references use different symbols for the calculated values. This
implementation uses the variable names similar to the symbols in reference [1].

The alogrithm uses different units for delta latitude and delta longitude.
The delta latitude is assumed to be in units of seconds of arc x 10^-5.
The delta longitude is the usual radians. Look out for these conversions.

The algorithm is described using complex arithmetic. There were three
options:
   * find and use a Javascript library for complex arithmetic
   * write my own complex library
   * expand the complex arithmetic by hand to simple arithmetic

This implementation has expanded the complex multiplication operations
into parallel simple arithmetic operations for the real and imaginary parts.
The imaginary part is way over to the right of the display; this probably
violates every coding standard in the world, but, to me, it makes it much
more obvious what is going on.

The following complex operations are used:
   - addition
   - multiplication
   - division
   - complex number raised to integer power
   - summation

A summary of complex arithmetic operations:
   (from http://en.wikipedia.org/wiki/Complex_arithmetic)
   addition:       (a + bi) + (c + di) = (a + c) + (b + d)i
   subtraction:    (a + bi) - (c + di) = (a - c) + (b - d)i
   multiplication: (a + bi) x (c + di) = (ac - bd) + (bc + ad)i
   division:       (a + bi) / (c + di) = [(ac + bd)/(cc + dd)] + [(bc - ad)/(cc + dd)]i

The algorithm needs to calculate summations of simple and complex numbers. This is
implemented using a for-loop, pre-loading the summed value to zero.

The algorithm needs to calculate theta^2, theta^3, etc while doing a summation.
There are three possible implementations:
   - use Math.pow in the summation loop - except for complex numbers
   - precalculate the values before running the loop
   - calculate theta^n = theta^(n-1) * theta during the loop
This implementation uses the third option for both real and complex arithmetic.

For example
   psi_n = 1;
   sum = 0;
   for (n = 1; n <=6; n++) {
      psi_n1 = psi_n * psi;       // calculate psi^(n+1)
      psi_n = psi_n1;
      sum = sum + A[n] * psi_n;
   }


TEST VECTORS

NZMG E, N:         2487100.638      6751049.719     metres
NZGD49 long, lat:      172.739194       -34.444066  degrees

NZMG E, N:         2486533.395      6077263.661     metres
NZGD49 long, lat:      172.723106       -40.512409  degrees

NZMG E, N:         2216746.425      5388508.765     metres
NZGD49 long, lat:      169.172062       -46.651295  degrees

Note that these test vectors convert from NZMG metres to lat/long referenced
to NZGD49, not the more usual WGS84. The difference is about 70m N/S and about
10m E/W.

These test vectors are provided in reference [1]. Many more test
vectors are available in
   http://www.linz.govt.nz/docs/topography/topographicdata/placenamesdatabase/nznamesmar08.zip
which is a catalog of names on the 260-series maps.


EPSG CODES

NZMG     EPSG:27200
NZGD49   EPSG:4272

http://spatialreference.org/ defines these as
  Proj4js.defs["EPSG:4272"] = "+proj=longlat +ellps=intl +datum=nzgd49 +no_defs ";
  Proj4js.defs["EPSG:27200"] = "+proj=nzmg +lat_0=-41 +lon_0=173 +x_0=2510000 +y_0=6023150 +ellps=intl +datum=nzgd49 +units=m +no_defs ";


LICENSE
  Copyright: Stephen Irons 2008
  Released under terms of the LGPL as per: http://www.gnu.org/copyleft/lesser.html

*******************************************************************************/


/**
  Initialize New Zealand Map Grip projection
*/

Proj4js.Proj.nzmg = {

  /**
   * iterations: Number of iterations to refine inverse transform.
   *     0 -> km accuracy
   *     1 -> m accuracy -- suitable for most mapping applications
   *     2 -> mm accuracy
   */
  iterations: 1,

  init : function() {
    this.A = new Array();
    this.A[1]  = +0.6399175073;
    this.A[2]  = -0.1358797613;
    this.A[3]  = +0.063294409;
    this.A[4]  = -0.02526853;
    this.A[5]  = +0.0117879;
    this.A[6]  = -0.0055161;
    this.A[7]  = +0.0026906;
    this.A[8]  = -0.001333;
    this.A[9]  = +0.00067;
    this.A[10] = -0.00034;

    this.B_re = new Array();        this.B_im = new Array();
    this.B_re[1] = +0.7557853228;   this.B_im[1] =  0.0;
    this.B_re[2] = +0.249204646;    this.B_im[2] = +0.003371507;
    this.B_re[3] = -0.001541739;    this.B_im[3] = +0.041058560;
    this.B_re[4] = -0.10162907;     this.B_im[4] = +0.01727609;
    this.B_re[5] = -0.26623489;     this.B_im[5] = -0.36249218;
    this.B_re[6] = -0.6870983;      this.B_im[6] = -1.1651967;

    this.C_re = new Array();        this.C_im = new Array();
    this.C_re[1] = +1.3231270439;   this.C_im[1] =  0.0;
    this.C_re[2] = -0.577245789;    this.C_im[2] = -0.007809598;
    this.C_re[3] = +0.508307513;    this.C_im[3] = -0.112208952;
    this.C_re[4] = -0.15094762;     this.C_im[4] = +0.18200602;
    this.C_re[5] = +1.01418179;     this.C_im[5] = +1.64497696;
    this.C_re[6] = +1.9660549;      this.C_im[6] = +2.5127645;

    this.D = new Array();
    this.D[1] = +1.5627014243;
    this.D[2] = +0.5185406398;
    this.D[3] = -0.03333098;
    this.D[4] = -0.1052906;
    this.D[5] = -0.0368594;
    this.D[6] = +0.007317;
    this.D[7] = +0.01220;
    this.D[8] = +0.00394;
    this.D[9] = -0.0013;
  },

  /**
    New Zealand Map Grid Forward  - long/lat to x/y
    long/lat in radians
  */
  forward : function(p) {
    var lon = p.x;
    var lat = p.y;

    var delta_lat = lat - this.lat0;
    var delta_lon = lon - this.long0;

    // 1. Calculate d_phi and d_psi    ...                          // and d_lambda
    // For this algorithm, delta_latitude is in seconds of arc x 10-5, so we need to scale to those units. Longitude is radians.
    var d_phi = delta_lat / Proj4js.common.SEC_TO_RAD * 1E-5;       var d_lambda = delta_lon;
    var d_phi_n = 1;  // d_phi^0

    var d_psi = 0;
    for (var n = 1; n <= 10; n++) {
      d_phi_n = d_phi_n * d_phi;
      d_psi = d_psi + this.A[n] * d_phi_n;
    }

    // 2. Calculate theta
    var th_re = d_psi;                                              var th_im = d_lambda;

    // 3. Calculate z
    var th_n_re = 1;                                                var th_n_im = 0;  // theta^0
    var th_n_re1;                                                   var th_n_im1;

    var z_re = 0;                                                   var z_im = 0;
    for (var n = 1; n <= 6; n++) {
      th_n_re1 = th_n_re*th_re - th_n_im*th_im;                     th_n_im1 = th_n_im*th_re + th_n_re*th_im;
      th_n_re = th_n_re1;                                           th_n_im = th_n_im1;
      z_re = z_re + this.B_re[n]*th_n_re - this.B_im[n]*th_n_im;    z_im = z_im + this.B_im[n]*th_n_re + this.B_re[n]*th_n_im;
    }

    // 4. Calculate easting and northing
    p.x = (z_im * this.a) + this.x0; 
    p.y = (z_re * this.a) + this.y0;

    return p;
  },


  /**
    New Zealand Map Grid Inverse  -  x/y to long/lat
  */
  inverse : function(p) {

    var x = p.x;
    var y = p.y;

    var delta_x = x - this.x0;
    var delta_y = y - this.y0;

    // 1. Calculate z
    var z_re = delta_y / this.a;                                              var z_im = delta_x / this.a;

    // 2a. Calculate theta - first approximation gives km accuracy
    var z_n_re = 1;                                                           var z_n_im = 0;  // z^0
    var z_n_re1;                                                              var z_n_im1;

    var th_re = 0;                                                            var th_im = 0;
    for (var n = 1; n <= 6; n++) {
      z_n_re1 = z_n_re*z_re - z_n_im*z_im;                                    z_n_im1 = z_n_im*z_re + z_n_re*z_im;
      z_n_re = z_n_re1;                                                       z_n_im = z_n_im1;
      th_re = th_re + this.C_re[n]*z_n_re - this.C_im[n]*z_n_im;              th_im = th_im + this.C_im[n]*z_n_re + this.C_re[n]*z_n_im;
    }

    // 2b. Iterate to refine the accuracy of the calculation
    //        0 iterations gives km accuracy
    //        1 iteration gives m accuracy -- good enough for most mapping applications
    //        2 iterations bives mm accuracy
    for (var i = 0; i < this.iterations; i++) {
       var th_n_re = th_re;                                                      var th_n_im = th_im;
       var th_n_re1;                                                             var th_n_im1;

       var num_re = z_re;                                                        var num_im = z_im;
       for (var n = 2; n <= 6; n++) {
         th_n_re1 = th_n_re*th_re - th_n_im*th_im;                               th_n_im1 = th_n_im*th_re + th_n_re*th_im;
         th_n_re = th_n_re1;                                                     th_n_im = th_n_im1;
         num_re = num_re + (n-1)*(this.B_re[n]*th_n_re - this.B_im[n]*th_n_im);  num_im = num_im + (n-1)*(this.B_im[n]*th_n_re + this.B_re[n]*th_n_im);
       }

       th_n_re = 1;                                                              th_n_im = 0;
       var den_re = this.B_re[1];                                                var den_im = this.B_im[1];
       for (var n = 2; n <= 6; n++) {
         th_n_re1 = th_n_re*th_re - th_n_im*th_im;                               th_n_im1 = th_n_im*th_re + th_n_re*th_im;
         th_n_re = th_n_re1;                                                     th_n_im = th_n_im1;
         den_re = den_re + n * (this.B_re[n]*th_n_re - this.B_im[n]*th_n_im);    den_im = den_im + n * (this.B_im[n]*th_n_re + this.B_re[n]*th_n_im);
       }

       // Complex division
       var den2 = den_re*den_re + den_im*den_im;
       th_re = (num_re*den_re + num_im*den_im) / den2;                           th_im = (num_im*den_re - num_re*den_im) / den2;
    }

    // 3. Calculate d_phi              ...                                    // and d_lambda
    var d_psi = th_re;                                                        var d_lambda = th_im;
    var d_psi_n = 1;  // d_psi^0

    var d_phi = 0;
    for (var n = 1; n <= 9; n++) {
       d_psi_n = d_psi_n * d_psi;
       d_phi = d_phi + this.D[n] * d_psi_n;
    }

    // 4. Calculate latitude and longitude
    // d_phi is calcuated in second of arc * 10^-5, so we need to scale back to radians. d_lambda is in radians.
    var lat = this.lat0 + (d_phi * Proj4js.common.SEC_TO_RAD * 1E5);
    var lon = this.long0 +  d_lambda;

    p.x = lon;
    p.y = lat;

    return p;
  }
};

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

/*******************************************************************************
NAME                             ORTHOGRAPHIC 

PURPOSE:	Transforms input longitude and latitude to Easting and
		Northing for the Orthographic projection.  The
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

Proj4js.Proj.ortho = {

  /* Initialize the Orthographic projection
    -------------------------------------*/
  init: function(def) {
    //double temp;			/* temporary variable		*/

    /* Place parameters in static storage for common use
      -------------------------------------------------*/;
    this.sin_p14=Math.sin(this.lat0);
    this.cos_p14=Math.cos(this.lat0);	
  },


  /* Orthographic forward equations--mapping lat,long to x,y
    ---------------------------------------------------*/
  forward: function(p) {
    var sinphi, cosphi;	/* sin and cos value				*/
    var dlon;		/* delta longitude value			*/
    var coslon;		/* cos of longitude				*/
    var ksp;		/* scale factor					*/
    var g;		
    var lon=p.x;
    var lat=p.y;	
    /* Forward equations
      -----------------*/
    dlon = Proj4js.common.adjust_lon(lon - this.long0);

    sinphi=Math.sin(lat);
    cosphi=Math.cos(lat);	

    coslon = Math.cos(dlon);
    g = this.sin_p14 * sinphi + this.cos_p14 * cosphi * coslon;
    ksp = 1.0;
    if ((g > 0) || (Math.abs(g) <= Proj4js.common.EPSLN)) {
      var x = this.a * ksp * cosphi * Math.sin(dlon);
      var y = this.y0 + this.a * ksp * (this.cos_p14 * sinphi - this.sin_p14 * cosphi * coslon);
    } else {
      Proj4js.reportError("orthoFwdPointError");
    }
    p.x=x;
    p.y=y;
    return p;
  },


  inverse: function(p) {
    var rh;		/* height above ellipsoid			*/
    var z;		/* angle					*/
    var sinz,cosz;	/* sin of z and cos of z			*/
    var temp;
    var con;
    var lon , lat;
    /* Inverse equations
      -----------------*/
    p.x -= this.x0;
    p.y -= this.y0;
    rh = Math.sqrt(p.x * p.x + p.y * p.y);
    if (rh > this.a + .0000001) {
      Proj4js.reportError("orthoInvDataError");
    }
    z = Proj4js.common.asinz(rh / this.a);

    sinz=Math.sin(z);
    cosz=Math.cos(z);

    lon = this.long0;
    if (Math.abs(rh) <= Proj4js.common.EPSLN) {
      lat = this.lat0; 
       p.x=lon;
       p.y=lat;
    return p;
    }
    lat = Proj4js.common.asinz(cosz * this.sin_p14 + (p.y * sinz * this.cos_p14)/rh);
    con = Math.abs(this.lat0) - Proj4js.common.HALF_PI;
    if (Math.abs(con) <= Proj4js.common.EPSLN) {
       if (this.lat0 >= 0) {
          lon = Proj4js.common.adjust_lon(this.long0 + Math.atan2(p.x, -p.y));
       } else {
          lon = Proj4js.common.adjust_lon(this.long0 -Math.atan2(-p.x, p.y));
       }
        p.x=lon;
        p.y=lat;
        return p;
    }
    lon=Proj4js.common.adjust_lon(this.long0 + Math.atan2((p.x * sinz ), rh*this.cos_p14*cosz-p.y*this.sin_p14*sinz));
    p.x=lon;
    p.y=lat;
    return p;
  }
};



/* Function to compute, phi4, the latitude for the inverse of the
   Polyconic projection.
------------------------------------------------------------*/
/*
function phi4z (eccent,e0,e1,e2,e3,a,b,c,phi) {
	var sinphi, sin2ph, tanphi, ml, mlp, con1, con2, con3, dphi, i;

	phi = a;
	for (i = 1; i <= 15; i++) {
		sinphi = Math.sin(phi);
		tanphi = Math.tan(phi);
		c = tanphi * Math.sqrt (1.0 - eccent * sinphi * sinphi);
		sin2ph = Math.sin (2.0 * phi);
		/*
		ml = e0 * *phi - e1 * sin2ph + e2 * sin (4.0 *  *phi);
		mlp = e0 - 2.0 * e1 * cos (2.0 *  *phi) + 4.0 * e2 *  cos (4.0 *  *phi);
		*/
		/*
		ml = e0 * phi - e1 * sin2ph + e2 * Math.sin (4.0 *  phi) - e3 * Math.sin (6.0 * phi);
		mlp = e0 - 2.0 * e1 * Math.cos (2.0 *  phi) + 4.0 * e2 * Math.cos (4.0 *  phi) - 6.0 * e3 * Math.cos (6.0 *  phi);
		con1 = 2.0 * ml + c * (ml * ml + b) - 2.0 * a *  (c * ml + 1.0);
		con2 = eccent * sin2ph * (ml * ml + b - 2.0 * a * ml) / (2.0 *c);
		con3 = 2.0 * (a - ml) * (c * mlp - 2.0 / sin2ph) - 2.0 * mlp;
		dphi = con1 / (con2 + con3);
		phi += dphi;
		if (Math.abs(dphi) <= .0000000001 ) return(phi);   
	}
	Proj4js.reportError("phi4z: No convergence");
	return null;
}
/*


/* Function to compute the constant e4 from the input of the eccentricity
   of the spheroid, x.  This constant is used in the Polar Stereographic
   projection.
--------------------------------------------------------------------*/
function e4fn(x) {
	var con, com;
	con = 1.0 + x;
	com = 1.0 - x;
	return (Math.sqrt((Math.pow(con,con))*(Math.pow(com,com))));
}





/*******************************************************************************
NAME                             POLYCONIC 

PURPOSE:	Transforms input longitude and latitude to Easting and
		Northing for the Polyconic projection.  The
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

Proj4js.Proj.poly = {

	/* Initialize the POLYCONIC projection
	  ----------------------------------*/
	init: function() {
		/* Place parameters in static storage for common use
		  -------------------------------------------------*/
		this.temp = this.b / this.a;
		this.es = 1.0 - Math.pow(this.temp,2);// devait etre dans tmerc.js mais n y est pas donc je commente sinon retour de valeurs nulles
		this.e = Math.sqrt(this.es);
		this.e0 = Proj4js.common.e0fn(this.es);
		this.e1 = Proj4js.common.e1fn(this.es);
		this.e2 = Proj4js.common.e2fn(this.es);
		this.e3 = Proj4js.common.e3fn(this.es);
		this.ml0 = this.a*Proj4js.common.mlfn(this.e0, this.e1,this.e2, this.e3, this.lat0);//si que des zeros le calcul ne se fait pas
	},


	/* Polyconic forward equations--mapping lat,long to x,y
	  ---------------------------------------------------*/
	forward: function(p) {
		var lon=p.x;
		var lat=p.y;
		var x,y,el;
		var dlon=Proj4js.common.adjust_lon(lon-this.long0);
		el=dlon*Math.sin(lat);
		if (this.sphere){
			if (Math.abs(lat)<=Proj4js.common.EPSLN){
				x=this.a*dlon;
				y=-1.0*this.a*this.lat0;
			} else {
				x=this.a*Math.sin(el)/Math.tan(lat);
				y=this.a*(Proj4js.common.adjust_lat(lat-this.lat0)+(1.0-Math.cos(el))/Math.tan(lat));
			}
		} else {
			if (Math.abs(lat)<=Proj4js.common.EPSLN){
				x=this.a*dlon;
				y=-1.0*this.ml0;
			} else {
				var nl =Proj4js.common.gN(this.a, this.e,Math.sin(lat))/Math.tan(lat);
				x=nl*Math.sin(el);
				y=this.a*Proj4js.common.mlfn(this.e0, this.e1,this.e2, this.e3, lat)-this.ml0+nl*(1.0-Math.cos(el));
			}
			
		}
		p.x=x+this.x0;
		p.y=y+this.y0;   
		return p;
	},


	/* Inverse equations
	-----------------*/
	inverse: function(p) {
		var lon,lat,x,y;
		var al,bl;
		var phi,dphi;
		x=p.x-this.x0;
		y=p.y-this.y0;
		
		if (this.sphere){
			if (Math.abs(y+this.a*this.lat0)<=Proj4js.common.EPSLN){
				lon=Proj4js.common.adjust_lon(x/this.a+this.long0);
				lat=0;
			} else {
				al = this.lat0 + y/this.a;
				bl = x*x/this.a/this.a+al*al;
				phi = al;
				var tanphi;
				for (var i = Proj4js.common.MAX_ITER; i ; --i){
					tanphi = Math.tan(phi);
					dphi = -1.0*(al*(phi*tanphi+1.0)-phi-0.5*(phi*phi+bl)*tanphi)/((phi-al)/tanphi-1.0);
					phi+=dphi;
					if (Math.abs(dphi)<=Proj4js.common.EPSLN){
						lat=phi;
						break;
					}
				}
				lon=Proj4js.common.adjust_lon(this.long0+(Math.asin(x*Math.tan(phi)/this.a))/Math.sin(lat));
			}
		} else {
			if (Math.abs(y+this.ml0)<=Proj4js.common.EPSLN){
				lat=0;
				lon=Proj4js.common.adjust_lon(this.long0+x/this.a);
			} else {
				
				al=(this.ml0+y)/this.a;
				bl=x*x/this.a/this.a+al*al;
				phi=al;
				var cl,mln,mlnp,ma;
				var con;
				for (var i = Proj4js.common.MAX_ITER; i ; --i){
					con = this.e*Math.sin(phi);
					cl = Math.sqrt(1.0-con*con)*Math.tan(phi);
					mln = this.a*Proj4js.common.mlfn(this.e0, this.e1,this.e2, this.e3, phi);
					mlnp = this.e0-2.0*this.e1*Math.cos(2.0*phi)+4.0*this.e2*Math.cos(4.0*phi)-6.0*this.e3*Math.cos(6.0*phi);
					ma=mln/this.a;
					dphi=(al*(cl*ma+1.0)-ma-0.5*cl*(ma*ma+bl))/(this.es*Math.sin(2.0*phi)*(ma*ma+bl-2.0*al*ma)/(4.0*cl)+(al-ma)*(cl*mlnp-2.0/Math.sin(2.0*phi))-mlnp);
					phi-=dphi;
					if (Math.abs(dphi)<=Proj4js.common.EPSLN){
						lat=phi;
						break;
					}
				}
				
				//lat=phi4z(this.e,this.e0,this.e1,this.e2,this.e3,al,bl,0,0);
				cl=Math.sqrt(1-this.es*Math.pow(Math.sin(lat),2.0))*Math.tan(lat);
				lon=Proj4js.common.adjust_lon(this.long0+Math.asin(x*cl/this.a)/Math.sin(lat));
			}
		}
		
		p.x=lon;
		p.y=lat;
		return p;
	}
};




/*******************************************************************************
NAME                  		SINUSOIDAL

PURPOSE:	Transforms input longitude and latitude to Easting and
		Northing for the Sinusoidal projection.  The
		longitude and latitude must be in radians.  The Easting
		and Northing values will be returned in meters.

PROGRAMMER              DATE            
----------              ----           
D. Steinwand, EROS      May, 1991     

This function was adapted from the Sinusoidal projection code (FORTRAN) in the 
General Cartographic Transformation Package software which is available from 
the U.S. Geological Survey National Mapping Division.
 
ALGORITHM REFERENCES

1.  Snyder, John P., "Map Projections--A Working Manual", U.S. Geological
    Survey Professional Paper 1395 (Supersedes USGS Bulletin 1532), United
    State Government Printing Office, Washington D.C., 1987.

2.  "Software Documentation for GCTP General Cartographic Transformation
    Package", U.S. Geological Survey National Mapping Division, May 1982.
*******************************************************************************/

Proj4js.Proj.sinu = {

	/* Initialize the Sinusoidal projection
	  ------------------------------------*/
	init: function() {
		/* Place parameters in static storage for common use
		  -------------------------------------------------*/
		  

		if (!this.sphere) {
		  this.en = Proj4js.common.pj_enfn(this.es);
    } else {
      this.n = 1.;
      this.m = 0.;
      this.es = 0;
      this.C_y = Math.sqrt((this.m + 1.) / this.n);
      this.C_x = this.C_y/(this.m + 1.);
    }
		  
	},

	/* Sinusoidal forward equations--mapping lat,long to x,y
	-----------------------------------------------------*/
	forward: function(p) {
		var x,y,delta_lon;	
		var lon=p.x;
		var lat=p.y;	
		/* Forward equations
		-----------------*/
		lon = Proj4js.common.adjust_lon(lon - this.long0);
		
		if (this.sphere) {
      if (!this.m) {
        lat = this.n != 1. ? Math.asin(this.n * Math.sin(lat)): lat;
      } else {
        var k = this.n * Math.sin(lat);
        for (var i = Proj4js.common.MAX_ITER; i ; --i) {
          var V = (this.m * lat + Math.sin(lat) - k) / (this.m + Math.cos(lat));
          lat -= V;
          if (Math.abs(V) < Proj4js.common.EPSLN) break;
        }
      }
      x = this.a * this.C_x * lon * (this.m + Math.cos(lat));
      y = this.a * this.C_y * lat;

		} else {
		  
		  var s = Math.sin(lat);
		  var c = Math.cos(lat);
      y = this.a * Proj4js.common.pj_mlfn(lat, s, c, this.en);
      x = this.a * lon * c / Math.sqrt(1. - this.es * s * s);
		}

		p.x=x;
		p.y=y;	
		return p;
	},

	inverse: function(p) {
		var lat,temp,lon;	
		
		/* Inverse equations
		  -----------------*/
		p.x -= this.x0;
		p.y -= this.y0;
		lat = p.y / this.a;
		
		if (this.sphere) {
		  
      p.y /= this.C_y;
      lat = this.m ? Math.asin((this.m * p.y + Math.sin(p.y)) / this.n) :
        ( this.n != 1. ? Math.asin(Math.sin(p.y) / this.n) : p.y );
      lon = p.x / (this.C_x * (this.m + Math.cos(p.y)));
		  
		} else {
		  lat = Proj4js.common.pj_inv_mlfn(p.y/this.a, this.es, this.en);
		  var s = Math.abs(lat);
      if (s < Proj4js.common.HALF_PI) {
        s = Math.sin(lat);
        temp = this.long0 + p.x * Math.sqrt(1. - this.es * s * s) /(this.a * Math.cos(lat));
        //temp = this.long0 + p.x / (this.a * Math.cos(lat));
        lon = Proj4js.common.adjust_lon(temp);
      } else if ((s - Proj4js.common.EPSLN) < Proj4js.common.HALF_PI) {
        lon = this.long0;
      }
		  
		}
		  
		p.x=lon;
		p.y=lat;
		return p;
	}
};



/*******************************************************************************
NAME                       SWISS OBLIQUE MERCATOR

PURPOSE:	Swiss projection.
WARNING:  X and Y are inverted (weird) in the swiss coordinate system. Not
   here, since we want X to be horizontal and Y vertical.

ALGORITHM REFERENCES
1. "Formules et constantes pour le Calcul pour la
 projection cylindrique conforme à axe oblique et pour la transformation entre
 des systèmes de référence".
 http://www.swisstopo.admin.ch/internet/swisstopo/fr/home/topics/survey/sys/refsys/switzerland.parsysrelated1.31216.downloadList.77004.DownloadFile.tmp/swissprojectionfr.pdf

*******************************************************************************/

Proj4js.Proj.somerc = {

  init: function() {
    var phy0 = this.lat0;
    this.lambda0 = this.long0;
    var sinPhy0 = Math.sin(phy0);
    var semiMajorAxis = this.a;
    var invF = this.rf;
    var flattening = 1 / invF;
    var e2 = 2 * flattening - Math.pow(flattening, 2);
    var e = this.e = Math.sqrt(e2);
    this.R = this.k0 * semiMajorAxis * Math.sqrt(1 - e2) / (1 - e2 * Math.pow(sinPhy0, 2.0));
    this.alpha = Math.sqrt(1 + e2 / (1 - e2) * Math.pow(Math.cos(phy0), 4.0));
    this.b0 = Math.asin(sinPhy0 / this.alpha);
    this.K = Math.log(Math.tan(Math.PI / 4.0 + this.b0 / 2.0))
            - this.alpha
            * Math.log(Math.tan(Math.PI / 4.0 + phy0 / 2.0))
            + this.alpha
            * e / 2
            * Math.log((1 + e * sinPhy0)
            / (1 - e * sinPhy0));
  },


  forward: function(p) {
    var Sa1 = Math.log(Math.tan(Math.PI / 4.0 - p.y / 2.0));
    var Sa2 = this.e / 2.0
            * Math.log((1 + this.e * Math.sin(p.y))
            / (1 - this.e * Math.sin(p.y)));
    var S = -this.alpha * (Sa1 + Sa2) + this.K;

        // spheric latitude
    var b = 2.0 * (Math.atan(Math.exp(S)) - Math.PI / 4.0);

        // spheric longitude
    var I = this.alpha * (p.x - this.lambda0);

        // psoeudo equatorial rotation
    var rotI = Math.atan(Math.sin(I)
            / (Math.sin(this.b0) * Math.tan(b) +
               Math.cos(this.b0) * Math.cos(I)));

    var rotB = Math.asin(Math.cos(this.b0) * Math.sin(b) -
                         Math.sin(this.b0) * Math.cos(b) * Math.cos(I));

    p.y = this.R / 2.0
            * Math.log((1 + Math.sin(rotB)) / (1 - Math.sin(rotB)))
            + this.y0;
    p.x = this.R * rotI + this.x0;
    return p;
  },

  inverse: function(p) {
    var Y = p.x - this.x0;
    var X = p.y - this.y0;

    var rotI = Y / this.R;
    var rotB = 2 * (Math.atan(Math.exp(X / this.R)) - Math.PI / 4.0);

    var b = Math.asin(Math.cos(this.b0) * Math.sin(rotB)
            + Math.sin(this.b0) * Math.cos(rotB) * Math.cos(rotI));
    var I = Math.atan(Math.sin(rotI)
            / (Math.cos(this.b0) * Math.cos(rotI) - Math.sin(this.b0)
            * Math.tan(rotB)));

    var lambda = this.lambda0 + I / this.alpha;

    var S = 0.0;
    var phy = b;
    var prevPhy = -1000.0;
    var iteration = 0;
    while (Math.abs(phy - prevPhy) > 0.0000001)
    {
      if (++iteration > 20)
      {
        Proj4js.reportError("omercFwdInfinity");
        return;
      }
      //S = Math.log(Math.tan(Math.PI / 4.0 + phy / 2.0));
      S = 1.0
              / this.alpha
              * (Math.log(Math.tan(Math.PI / 4.0 + b / 2.0)) - this.K)
              + this.e
              * Math.log(Math.tan(Math.PI / 4.0
              + Math.asin(this.e * Math.sin(phy))
              / 2.0));
      prevPhy = phy;
      phy = 2.0 * Math.atan(Math.exp(S)) - Math.PI / 2.0;
    }

    p.x = lambda;
    p.y = phy;
    return p;
  }
};


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


Proj4js.Proj.sterea = {
  dependsOn : 'gauss',

  init : function() {
    Proj4js.Proj['gauss'].init.apply(this);
    if (!this.rc) {
      Proj4js.reportError("sterea:init:E_ERROR_0");
      return;
    }
    this.sinc0 = Math.sin(this.phic0);
    this.cosc0 = Math.cos(this.phic0);
    this.R2 = 2.0 * this.rc;
    if (!this.title) this.title = "Oblique Stereographic Alternative";
  },

  forward : function(p) {
    var sinc, cosc, cosl, k;
    p.x = Proj4js.common.adjust_lon(p.x-this.long0); /* adjust del longitude */
    Proj4js.Proj['gauss'].forward.apply(this, [p]);
    sinc = Math.sin(p.y);
    cosc = Math.cos(p.y);
    cosl = Math.cos(p.x);
    k = this.k0 * this.R2 / (1.0 + this.sinc0 * sinc + this.cosc0 * cosc * cosl);
    p.x = k * cosc * Math.sin(p.x);
    p.y = k * (this.cosc0 * sinc - this.sinc0 * cosc * cosl);
    p.x = this.a * p.x + this.x0;
    p.y = this.a * p.y + this.y0;
    return p;
  },

  inverse : function(p) {
    var sinc, cosc, lon, lat, rho;
    p.x = (p.x - this.x0) / this.a; /* descale and de-offset */
    p.y = (p.y - this.y0) / this.a;

    p.x /= this.k0;
    p.y /= this.k0;
    if ( (rho = Math.sqrt(p.x*p.x + p.y*p.y)) ) {
      var c = 2.0 * Math.atan2(rho, this.R2);
      sinc = Math.sin(c);
      cosc = Math.cos(c);
      lat = Math.asin(cosc * this.sinc0 + p.y * sinc * this.cosc0 / rho);
      lon = Math.atan2(p.x * sinc, rho * this.cosc0 * cosc - p.y * this.sinc0 * sinc);
    } else {
      lat = this.phic0;
      lon = 0.;
    }

    p.x = lon;
    p.y = lat;
    Proj4js.Proj['gauss'].inverse.apply(this,[p]);
    p.x = Proj4js.common.adjust_lon(p.x + this.long0); /* adjust longitude to CM */
    return p;
  }
};


/*******************************************************************************
NAME                            TRANSVERSE MERCATOR

PURPOSE:	Transforms input longitude and latitude to Easting and
		Northing for the Transverse Mercator projection.  The
		longitude and latitude must be in radians.  The Easting
		and Northing values will be returned in meters.

ALGORITHM REFERENCES

1.  Snyder, John P., "Map Projections--A Working Manual", U.S. Geological
    Survey Professional Paper 1395 (Supersedes USGS Bulletin 1532), United
    State Government Printing Office, Washington D.C., 1987.

2.  Snyder, John P. and Voxland, Philip M., "An Album of Map Projections",
    U.S. Geological Survey Professional Paper 1453 , United State Government
    Printing Office, Washington D.C., 1989.
*******************************************************************************/


/**
  Initialize Transverse Mercator projection
*/

Proj4js.Proj.tmerc = {
  init : function() {
    this.e0 = Proj4js.common.e0fn(this.es);
    this.e1 = Proj4js.common.e1fn(this.es);
    this.e2 = Proj4js.common.e2fn(this.es);
    this.e3 = Proj4js.common.e3fn(this.es);
    this.ml0 = this.a * Proj4js.common.mlfn(this.e0, this.e1, this.e2, this.e3, this.lat0);
  },

  /**
    Transverse Mercator Forward  - long/lat to x/y
    long/lat in radians
  */
  forward : function(p) {
    var lon = p.x;
    var lat = p.y;

    var delta_lon = Proj4js.common.adjust_lon(lon - this.long0); // Delta longitude
    var con;    // cone constant
    var x, y;
    var sin_phi=Math.sin(lat);
    var cos_phi=Math.cos(lat);

    if (this.sphere) {  /* spherical form */
      var b = cos_phi * Math.sin(delta_lon);
      if ((Math.abs(Math.abs(b) - 1.0)) < .0000000001)  {
        Proj4js.reportError("tmerc:forward: Point projects into infinity");
        return(93);
      } else {
        x = .5 * this.a * this.k0 * Math.log((1.0 + b)/(1.0 - b));
        con = Math.acos(cos_phi * Math.cos(delta_lon)/Math.sqrt(1.0 - b*b));
        if (lat < 0) con = - con;
        y = this.a * this.k0 * (con - this.lat0);
      }
    } else {
      var al  = cos_phi * delta_lon;
      var als = Math.pow(al,2);
      var c   = this.ep2 * Math.pow(cos_phi,2);
      var tq  = Math.tan(lat);
      var t   = Math.pow(tq,2);
      con = 1.0 - this.es * Math.pow(sin_phi,2);
      var n   = this.a / Math.sqrt(con);
      var ml  = this.a * Proj4js.common.mlfn(this.e0, this.e1, this.e2, this.e3, lat);

      x = this.k0 * n * al * (1.0 + als / 6.0 * (1.0 - t + c + als / 20.0 * (5.0 - 18.0 * t + Math.pow(t,2) + 72.0 * c - 58.0 * this.ep2))) + this.x0;
      y = this.k0 * (ml - this.ml0 + n * tq * (als * (0.5 + als / 24.0 * (5.0 - t + 9.0 * c + 4.0 * Math.pow(c,2) + als / 30.0 * (61.0 - 58.0 * t + Math.pow(t,2) + 600.0 * c - 330.0 * this.ep2))))) + this.y0;

    }
    p.x = x; p.y = y;
    return p;
  }, // tmercFwd()

  /**
    Transverse Mercator Inverse  -  x/y to long/lat
  */
  inverse : function(p) {
    var con, phi;  /* temporary angles       */
    var delta_phi; /* difference between longitudes    */
    var i;
    var max_iter = 6;      /* maximun number of iterations */
    var lat, lon;

    if (this.sphere) {   /* spherical form */
      var f = Math.exp(p.x/(this.a * this.k0));
      var g = .5 * (f - 1/f);
      var temp = this.lat0 + p.y/(this.a * this.k0);
      var h = Math.cos(temp);
      con = Math.sqrt((1.0 - h * h)/(1.0 + g * g));
      lat = Proj4js.common.asinz(con);
      if (temp < 0)
        lat = -lat;
      if ((g == 0) && (h == 0)) {
        lon = this.long0;
      } else {
        lon = Proj4js.common.adjust_lon(Math.atan2(g,h) + this.long0);
      }
    } else {    // ellipsoidal form
      var x = p.x - this.x0;
      var y = p.y - this.y0;

      con = (this.ml0 + y / this.k0) / this.a;
      phi = con;
      for (i=0;true;i++) {
        delta_phi=((con + this.e1 * Math.sin(2.0*phi) - this.e2 * Math.sin(4.0*phi) + this.e3 * Math.sin(6.0*phi)) / this.e0) - phi;
        phi += delta_phi;
        if (Math.abs(delta_phi) <= Proj4js.common.EPSLN) break;
        if (i >= max_iter) {
          Proj4js.reportError("tmerc:inverse: Latitude failed to converge");
          return(95);
        }
      } // for()
      if (Math.abs(phi) < Proj4js.common.HALF_PI) {
        // sincos(phi, &sin_phi, &cos_phi);
        var sin_phi=Math.sin(phi);
        var cos_phi=Math.cos(phi);
        var tan_phi = Math.tan(phi);
        var c = this.ep2 * Math.pow(cos_phi,2);
        var cs = Math.pow(c,2);
        var t = Math.pow(tan_phi,2);
        var ts = Math.pow(t,2);
        con = 1.0 - this.es * Math.pow(sin_phi,2);
        var n = this.a / Math.sqrt(con);
        var r = n * (1.0 - this.es) / con;
        var d = x / (n * this.k0);
        var ds = Math.pow(d,2);
        lat = phi - (n * tan_phi * ds / r) * (0.5 - ds / 24.0 * (5.0 + 3.0 * t + 10.0 * c - 4.0 * cs - 9.0 * this.ep2 - ds / 30.0 * (61.0 + 90.0 * t + 298.0 * c + 45.0 * ts - 252.0 * this.ep2 - 3.0 * cs)));
        lon = Proj4js.common.adjust_lon(this.long0 + (d * (1.0 - ds / 6.0 * (1.0 + 2.0 * t + c - ds / 20.0 * (5.0 - 2.0 * c + 28.0 * t - 3.0 * cs + 8.0 * this.ep2 + 24.0 * ts))) / cos_phi));
      } else {
        lat = Proj4js.common.HALF_PI * Proj4js.common.sign(y);
        lon = this.long0;
      }
    }
    p.x = lon;
    p.y = lat;
    return p;
  } // tmercInv()
};
/*******************************************************************************
NAME                            TRANSVERSE MERCATOR

PURPOSE:	Transforms input longitude and latitude to Easting and
		Northing for the Transverse Mercator projection.  The
		longitude and latitude must be in radians.  The Easting
		and Northing values will be returned in meters.

ALGORITHM REFERENCES

1.  Snyder, John P., "Map Projections--A Working Manual", U.S. Geological
    Survey Professional Paper 1395 (Supersedes USGS Bulletin 1532), United
    State Government Printing Office, Washington D.C., 1987.

2.  Snyder, John P. and Voxland, Philip M., "An Album of Map Projections",
    U.S. Geological Survey Professional Paper 1453 , United State Government
    Printing Office, Washington D.C., 1989.
*******************************************************************************/


/**
  Initialize Transverse Mercator projection
*/

Proj4js.Proj.utm = {
  dependsOn : 'tmerc',

  init : function() {
    if (!this.zone) {
      Proj4js.reportError("utm:init: zone must be specified for UTM");
      return;
    }
    this.lat0 = 0.0;
    this.long0 = ((6 * Math.abs(this.zone)) - 183) * Proj4js.common.D2R;
    this.x0 = 500000.0;
    this.y0 = this.utmSouth ? 10000000.0 : 0.0;
    this.k0 = 0.9996;

    Proj4js.Proj['tmerc'].init.apply(this);
    this.forward = Proj4js.Proj['tmerc'].forward;
    this.inverse = Proj4js.Proj['tmerc'].inverse;
  }
};
/*******************************************************************************
NAME                    VAN DER GRINTEN 

PURPOSE:	Transforms input Easting and Northing to longitude and
		latitude for the Van der Grinten projection.  The
		Easting and Northing must be in meters.  The longitude
		and latitude values will be returned in radians.

PROGRAMMER              DATE            
----------              ----           
T. Mittan		March, 1993

This function was adapted from the Van Der Grinten projection code
(FORTRAN) in the General Cartographic Transformation Package software
which is available from the U.S. Geological Survey National Mapping Division.
 
ALGORITHM REFERENCES

1.  "New Equal-Area Map Projections for Noncircular Regions", John P. Snyder,
    The American Cartographer, Vol 15, No. 4, October 1988, pp. 341-355.

2.  Snyder, John P., "Map Projections--A Working Manual", U.S. Geological
    Survey Professional Paper 1395 (Supersedes USGS Bulletin 1532), United
    State Government Printing Office, Washington D.C., 1987.

3.  "Software Documentation for GCTP General Cartographic Transformation
    Package", U.S. Geological Survey National Mapping Division, May 1982.
*******************************************************************************/

Proj4js.Proj.vandg = {

/* Initialize the Van Der Grinten projection
  ----------------------------------------*/
	init: function() {
		//this.R = 6370997.0; //Radius of earth
		this.R = this.a;
	},

	forward: function(p) {

		var lon=p.x;
		var lat=p.y;	

		/* Forward equations
		-----------------*/
		var dlon = Proj4js.common.adjust_lon(lon - this.long0);
		var x,y;

		if (Math.abs(lat) <= Proj4js.common.EPSLN) {
			x = this.x0  + this.R * dlon;
			y = this.y0;
		}
		var theta = Proj4js.common.asinz(2.0 * Math.abs(lat / Proj4js.common.PI));
		if ((Math.abs(dlon) <= Proj4js.common.EPSLN) || (Math.abs(Math.abs(lat) - Proj4js.common.HALF_PI) <= Proj4js.common.EPSLN)) {
			x = this.x0;
			if (lat >= 0) {
				y = this.y0 + Proj4js.common.PI * this.R * Math.tan(.5 * theta);
			} else {
				y = this.y0 + Proj4js.common.PI * this.R * - Math.tan(.5 * theta);
			}
			//  return(OK);
		}
		var al = .5 * Math.abs((Proj4js.common.PI / dlon) - (dlon / Proj4js.common.PI));
		var asq = al * al;
		var sinth = Math.sin(theta);
		var costh = Math.cos(theta);

		var g = costh / (sinth + costh - 1.0);
		var gsq = g * g;
		var m = g * (2.0 / sinth - 1.0);
		var msq = m * m;
		var con = Proj4js.common.PI * this.R * (al * (g - msq) + Math.sqrt(asq * (g - msq) * (g - msq) - (msq + asq) * (gsq - msq))) / (msq + asq);
		if (dlon < 0) {
		 con = -con;
		}
		x = this.x0 + con;
		//con = Math.abs(con / (Proj4js.common.PI * this.R));
		var q =asq+g;
		con=Proj4js.common.PI*this.R*(m*q-al*Math.sqrt((msq+asq)*(asq+1.0)-q*q))/(msq+asq);
		if (lat >= 0) {
		 //y = this.y0 + Proj4js.common.PI * this.R * Math.sqrt(1.0 - con * con - 2.0 * al * con);
		 y=this.y0 + con;
		} else {
		 //y = this.y0 - Proj4js.common.PI * this.R * Math.sqrt(1.0 - con * con - 2.0 * al * con);
		 y=this.y0 - con;
		}
		p.x = x;
		p.y = y;
		return p;
	},

/* Van Der Grinten inverse equations--mapping x,y to lat/long
  ---------------------------------------------------------*/
	inverse: function(p) {
		var lon, lat;
		var xx,yy,xys,c1,c2,c3;
		var al,asq;
		var a1;
		var m1;
		var con;
		var th1;
		var d;

		/* inverse equations
		-----------------*/
		p.x -= this.x0;
		p.y -= this.y0;
		con = Proj4js.common.PI * this.R;
		xx = p.x / con;
		yy =p.y / con;
		xys = xx * xx + yy * yy;
		c1 = -Math.abs(yy) * (1.0 + xys);
		c2 = c1 - 2.0 * yy * yy + xx * xx;
		c3 = -2.0 * c1 + 1.0 + 2.0 * yy * yy + xys * xys;
		d = yy * yy / c3 + (2.0 * c2 * c2 * c2 / c3 / c3 / c3 - 9.0 * c1 * c2 / c3 /c3) / 27.0;
		a1 = (c1 - c2 * c2 / 3.0 / c3) / c3;
		m1 = 2.0 * Math.sqrt( -a1 / 3.0);
		con = ((3.0 * d) / a1) / m1;
		if (Math.abs(con) > 1.0) {
			if (con >= 0.0) {
				con = 1.0;
			} else {
				con = -1.0;
			}
		}
		th1 = Math.acos(con) / 3.0;
		if (p.y >= 0) {
			lat = (-m1 *Math.cos(th1 + Proj4js.common.PI / 3.0) - c2 / 3.0 / c3) * Proj4js.common.PI;
		} else {
			lat = -(-m1 * Math.cos(th1 + Proj4js.common.PI / 3.0) - c2 / 3.0 / c3) * Proj4js.common.PI;
		}

		if (Math.abs(xx) < Proj4js.common.EPSLN) {
			lon = this.long0;
		} else {
			lon = Proj4js.common.adjust_lon(this.long0 + Proj4js.common.PI * (xys - 1.0 + Math.sqrt(1.0 + 2.0 * (xx * xx - yy * yy) + xys * xys)) / 2.0 / xx);
		}

		p.x=lon;
		p.y=lat;
		return p;
	}
};

Proj4js.defs["EPSG:102757"] = "+title=NAD 1983 StatePlane Wyoming West Central FIPS 4903 Feet +proj=tmerc +lat_0=40.5 +lon_0=-108.75 +x_0=600000.0 +y_0=0 +k=0.999938 +a=6378137.0  +b=6356752.3141403 +to_meter=0.3048006096012192";

Proj4js.defs["EPSG:102758"] = "+title=NAD 1983 StatePlane Wyoming West FIPS 4904 Feet +proj=tmerc +lat_0=40.5  +lon_0=-110.0833333333333 +x_0=800000  +y_0=100000  +k=0.999938 +a=6378137.0 +b=6356752.3141403 +to_meter=0.3048006096012192";

Proj4js.defs["EPSG:21781"] = "+title=CH1903 / LV03 +proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 +x_0=600000 +y_0=200000 +ellps=bessel +towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs";

Proj4js.defs["EPSG:26591"] = "+title= Monte Mario (Rome) / Italy zone 1 EPSG:26591 +proj=tmerc +lat_0=0 +lon_0=-3.45233333333333 +from_greenwich=12.45233333333333 +k=0.999600 +x_0=1500000 +y_0=0 +a=6378388.0, +b=6356911.94612795 +units=m";

Proj4js.defs["EPSG26912"] = "+title=NAD83 / UTM zone 12N +proj=utm +zone=12 +a=6378137.0 +b=6356752.3141403";

Proj4js.defs["EPSG:27200"] = "+title=New Zealand Map Grid\
  +proj=nzmg \
  +lat_0=-41 +lon_0=173 \
  +x_0=2510000 +y_0=6023150 \
  +ellps=intl +datum=nzgd49 +units=m +no_defs"

Proj4js.defs["EPSG:27563"]="+title=NTF (Paris)/Lambert Sud France +proj=lcc +lat_1=44.10000000000001 +lat_0=44.10000000000001 +lon_0=0 +k_0=0.9998774990000001 +x_0=600000 +y_0=200000 +a=6378249.2 +b=6356515 +towgs84=-168,-60,320,0,0,0,0 +pm=paris +units=m +no_defs ";

Proj4js.defs["EPSG:41001"] = "+title=simple mercator EPSG:41001 +proj=merc +lat_ts=0 +lon_0=0 +k=1.000000 +x_0=0 +y_0=0 +ellps=WGS84 +datum=WGS84 +units=m";

Proj4js.defs["EPSG:4139"] = "+title=Puerto Rico EPSG:4139 (3 param datum shift) +proj=longlat +towgs84 = 11,72,-101,0,0,0,0 +a=6378206.4 +b=6356583.8";

Proj4js.defs["EPSG:4181"] = "+title=Luxembourg 1930 EPSG:4181 (7 param datum shift) +proj=longlat +towgs84=-193,13.7,-39.3,-0.41,-2.933,2.688,0.43 +a=6378388.0, +b=6356911.94612795";

Proj4js.defs["EPSG:42304"]="+title=Atlas of Canada, LCC +proj=lcc +lat_1=49 +lat_2=77 +lat_0=49 +lon_0=-95 +x_0=0 +y_0=0 +ellps=GRS80 +datum=NAD83 +units=m +no_defs";
Proj4js.defs["EPSG:4272"] = "+title=NZGD49 +proj=longlat +ellps=intl +datum=nzgd49 +no_defs ";

Proj4js.defs["EPSG:4302"] = "+title=Trinidad 1903 EPSG:4302 (7 param datum shift) +proj=longlat +a=6378293.63683822 +b=6356617.979337744 +towgs84=-61.702,284.488,472.052,0,0,0,0";
  

// Google Mercator projection
// Used in combination with GoogleMercator layer type in OpenLayers
//+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +no_defs

Proj4js.defs["EPSG:900913"]= "+title=GoogleMercator +proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +no_defs";

Proj4js.defs["GOOGLE"]="+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +no_defs";
Proj4js.defs["EPSG:900913"]=Proj4js.defs["GOOGLE"];

Proj4js.grids["ntf_r93.gsb"]={"ll":[-0.0959931089,0.715584993],"del":[0.00174532925,0.00174532925],"lim":[156,111],"count":17316,"cvs":[[0.000017136,-0.000000637],[0.000017055,-0.000000618],[0.000016974,-0.000000599],[0.000016892,-0.000000580],[0.000016811,-0.000000561],[0.000016729,-0.000000542],[0.000016647,-0.000000523],[0.000016565,-0.000000505],[0.000016483,-0.000000486],[0.000016401,-0.000000468],[0.000016319,-0.000000450],[0.000016237,-0.000000433],[0.000016155,-0.000000415],[0.000016073,-0.000000398],[0.000015990,-0.000000380],[0.000015908,-0.000000364],[0.000015826,-0.000000347],[0.000015743,-0.000000331],[0.000015660,-0.000000315],[0.000015578,-0.000000299],[0.000015495,-0.000000284],[0.000015412,-0.000000269],[0.000015328,-0.000000255],[0.000015245,-0.000000241],[0.000015161,-0.000000227],[0.000015078,-0.000000213],[0.000014994,-0.000000200],[0.000014909,-0.000000187],[0.000014825,-0.000000174],[0.000014740,-0.000000162],[0.000014655,-0.000000149],[0.000014569,-0.000000137],[0.000014483,-0.000000125],[0.000014397,-0.000000112],[0.000014310,-0.000000100],[0.000014222,-0.000000087],[0.000014134,-0.000000074],[0.000014046,-0.000000061],[0.000013957,-0.000000048],[0.000013867,-0.000000033],[0.000013777,-0.000000019],[0.000013686,-0.000000004],[0.000013595,0.000000012],[0.000013504,0.000000029],[0.000013412,0.000000046],[0.000013319,0.000000064],[0.000013226,0.000000083],[0.000013133,0.000000103],[0.000013040,0.000000124],[0.000012947,0.000000145],[0.000012854,0.000000168],[0.000012760,0.000000191],[0.000012667,0.000000215],[0.000012574,0.000000241],[0.000012482,0.000000267],[0.000012390,0.000000294],[0.000012298,0.000000322],[0.000012207,0.000000350],[0.000012116,0.000000380],[0.000012027,0.000000410],[0.000011938,0.000000440],[0.000011850,0.000000471],[0.000011763,0.000000503],[0.000011676,0.000000535],[0.000011591,0.000000567],[0.000011507,0.000000599],[0.000011424,0.000000631],[0.000011341,0.000000663],[0.000011259,0.000000695],[0.000011178,0.000000727],[0.000011098,0.000000758],[0.000011019,0.000000789],[0.000010940,0.000000820],[0.000010863,0.000000850],[0.000010786,0.000000880],[0.000010709,0.000000910],[0.000010634,0.000000939],[0.000010560,0.000000968],[0.000010486,0.000000996],[0.000010414,0.000001024],[0.000010344,0.000001052],[0.000010274,0.000001079],[0.000010206,0.000001106],[0.000010140,0.000001133],[0.000010075,0.000001159],[0.000010011,0.000001184],[0.000009949,0.000001209],[0.000009889,0.000001233],[0.000009830,0.000001257],[0.000009772,0.000001280],[0.000009715,0.000001302],[0.000009660,0.000001324],[0.000009605,0.000001346],[0.000009551,0.000001367],[0.000009498,0.000001388],[0.000009445,0.000001408],[0.000009393,0.000001428],[0.000009341,0.000001448],[0.000009290,0.000001468],[0.000009239,0.000001488],[0.000009187,0.000001508],[0.000009136,0.000001528],[0.000009085,0.000001548],[0.000009034,0.000001568],[0.000008983,0.000001587],[0.000008932,0.000001607],[0.000008881,0.000001626],[0.000008830,0.000001645],[0.000008779,0.000001664],[0.000008728,0.000001683],[0.000008677,0.000001702],[0.000008626,0.000001720],[0.000008575,0.000001738],[0.000008524,0.000001756],[0.000008474,0.000001773],[0.000008424,0.000001789],[0.000008374,0.000001806],[0.000008324,0.000001821],[0.000008275,0.000001837],[0.000008226,0.000001851],[0.000008178,0.000001866],[0.000008130,0.000001879],[0.000008082,0.000001892],[0.000008035,0.000001905],[0.000007988,0.000001916],[0.000007942,0.000001927],[0.000007896,0.000001938],[0.000007851,0.000001947],[0.000007806,0.000001956],[0.000007761,0.000001964],[0.000007716,0.000001971],[0.000007671,0.000001977],[0.000007625,0.000001982],[0.000007580,0.000001987],[0.000007534,0.000001989],[0.000007487,0.000001991],[0.000007439,0.000001991],[0.000007389,0.000001989],[0.000007338,0.000001986],[0.000007283,0.000001981],[0.000007226,0.000001974],[0.000007165,0.000001964],[0.000007101,0.000001953],[0.000007034,0.000001940],[0.000006965,0.000001927],[0.000006895,0.000001913],[0.000006824,0.000001900],[0.000006753,0.000001888],[0.000006681,0.000001876],[0.000006610,0.000001866],[0.000006541,0.000001859],[0.000006473,0.000001853],[0.000006406,0.000001848],[0.000006340,0.000001844],[0.000006274,0.000001840],[0.000006209,0.000001837],[0.000017134,-0.000000649],[0.000017053,-0.000000631],[0.000016972,-0.000000612],[0.000016891,-0.000000594],[0.000016809,-0.000000576],[0.000016728,-0.000000558],[0.000016646,-0.000000541],[0.000016565,-0.000000523],[0.000016483,-0.000000505],[0.000016402,-0.000000488],[0.000016320,-0.000000471],[0.000016238,-0.000000454],[0.000016157,-0.000000437],[0.000016075,-0.000000421],[0.000015993,-0.000000404],[0.000015911,-0.000000388],[0.000015829,-0.000000372],[0.000015747,-0.000000357],[0.000015665,-0.000000341],[0.000015582,-0.000000326],[0.000015500,-0.000000312],[0.000015418,-0.000000297],[0.000015335,-0.000000283],[0.000015252,-0.000000269],[0.000015169,-0.000000256],[0.000015086,-0.000000243],[0.000015003,-0.000000229],[0.000014919,-0.000000217],[0.000014835,-0.000000204],[0.000014751,-0.000000192],[0.000014667,-0.000000179],[0.000014582,-0.000000167],[0.000014497,-0.000000155],[0.000014411,-0.000000143],[0.000014325,-0.000000131],[0.000014239,-0.000000118],[0.000014152,-0.000000106],[0.000014065,-0.000000093],[0.000013977,-0.000000079],[0.000013888,-0.000000065],[0.000013800,-0.000000051],[0.000013710,-0.000000036],[0.000013620,-0.000000021],[0.000013530,-0.000000005],[0.000013439,0.000000012],[0.000013347,0.000000029],[0.000013256,0.000000047],[0.000013164,0.000000067],[0.000013071,0.000000087],[0.000012979,0.000000107],[0.000012886,0.000000129],[0.000012794,0.000000152],[0.000012701,0.000000175],[0.000012609,0.000000199],[0.000012516,0.000000225],[0.000012424,0.000000251],[0.000012333,0.000000278],[0.000012241,0.000000305],[0.000012151,0.000000334],[0.000012061,0.000000363],[0.000011971,0.000000393],[0.000011882,0.000000424],[0.000011795,0.000000455],[0.000011707,0.000000486],[0.000011621,0.000000518],[0.000011536,0.000000550],[0.000011452,0.000000582],[0.000011369,0.000000614],[0.000011286,0.000000646],[0.000011205,0.000000677],[0.000011125,0.000000709],[0.000011046,0.000000740],[0.000010967,0.000000771],[0.000010890,0.000000801],[0.000010814,0.000000831],[0.000010738,0.000000861],[0.000010664,0.000000890],[0.000010591,0.000000919],[0.000010519,0.000000947],[0.000010448,0.000000975],[0.000010379,0.000001002],[0.000010311,0.000001029],[0.000010244,0.000001056],[0.000010179,0.000001081],[0.000010114,0.000001107],[0.000010052,0.000001131],[0.000009990,0.000001155],[0.000009930,0.000001179],[0.000009871,0.000001202],[0.000009813,0.000001224],[0.000009756,0.000001246],[0.000009700,0.000001267],[0.000009644,0.000001288],[0.000009590,0.000001309],[0.000009535,0.000001329],[0.000009481,0.000001349],[0.000009428,0.000001369],[0.000009375,0.000001389],[0.000009322,0.000001408],[0.000009269,0.000001428],[0.000009217,0.000001448],[0.000009165,0.000001467],[0.000009113,0.000001487],[0.000009060,0.000001507],[0.000009008,0.000001526],[0.000008956,0.000001546],[0.000008904,0.000001565],[0.000008853,0.000001585],[0.000008801,0.000001604],[0.000008749,0.000001622],[0.000008698,0.000001641],[0.000008646,0.000001659],[0.000008595,0.000001677],[0.000008544,0.000001695],[0.000008493,0.000001712],[0.000008443,0.000001729],[0.000008393,0.000001745],[0.000008343,0.000001761],[0.000008294,0.000001776],[0.000008245,0.000001791],[0.000008197,0.000001805],[0.000008148,0.000001819],[0.000008101,0.000001832],[0.000008053,0.000001844],[0.000008006,0.000001856],[0.000007960,0.000001867],[0.000007914,0.000001878],[0.000007867,0.000001887],[0.000007821,0.000001896],[0.000007776,0.000001904],[0.000007730,0.000001911],[0.000007684,0.000001917],[0.000007637,0.000001923],[0.000007591,0.000001927],[0.000007543,0.000001930],[0.000007495,0.000001932],[0.000007446,0.000001932],[0.000007396,0.000001932],[0.000007344,0.000001930],[0.000007290,0.000001926],[0.000007233,0.000001920],[0.000007174,0.000001913],[0.000007112,0.000001904],[0.000007046,0.000001893],[0.000006978,0.000001881],[0.000006907,0.000001868],[0.000006835,0.000001856],[0.000006764,0.000001844],[0.000006693,0.000001835],[0.000006624,0.000001828],[0.000006556,0.000001822],[0.000006489,0.000001818],[0.000006422,0.000001814],[0.000006355,0.000001810],[0.000006288,0.000001806],[0.000006222,0.000001801],[0.000017131,-0.000000661],[0.000017051,-0.000000643],[0.000016970,-0.000000626],[0.000016889,-0.000000609],[0.000016808,-0.000000591],[0.000016727,-0.000000574],[0.000016646,-0.000000557],[0.000016565,-0.000000541],[0.000016483,-0.000000524],[0.000016402,-0.000000507],[0.000016321,-0.000000491],[0.000016240,-0.000000475],[0.000016158,-0.000000459],[0.000016077,-0.000000443],[0.000015995,-0.000000427],[0.000015914,-0.000000412],[0.000015832,-0.000000397],[0.000015751,-0.000000382],[0.000015669,-0.000000367],[0.000015587,-0.000000353],[0.000015505,-0.000000339],[0.000015424,-0.000000325],[0.000015341,-0.000000311],[0.000015259,-0.000000297],[0.000015177,-0.000000284],[0.000015095,-0.000000271],[0.000015012,-0.000000258],[0.000014929,-0.000000246],[0.000014846,-0.000000233],[0.000014763,-0.000000221],[0.000014679,-0.000000209],[0.000014595,-0.000000197],[0.000014511,-0.000000185],[0.000014426,-0.000000173],[0.000014341,-0.000000161],[0.000014256,-0.000000149],[0.000014170,-0.000000136],[0.000014084,-0.000000123],[0.000013997,-0.000000110],[0.000013910,-0.000000097],[0.000013822,-0.000000083],[0.000013734,-0.000000069],[0.000013645,-0.000000054],[0.000013555,-0.000000038],[0.000013466,-0.000000022],[0.000013376,-0.000000005],[0.000013285,0.000000012],[0.000013194,0.000000031],[0.000013103,0.000000050],[0.000013011,0.000000070],[0.000012919,0.000000091],[0.000012827,0.000000112],[0.000012735,0.000000135],[0.000012643,0.000000159],[0.000012551,0.000000183],[0.000012459,0.000000208],[0.000012367,0.000000234],[0.000012276,0.000000261],[0.000012185,0.000000289],[0.000012095,0.000000318],[0.000012005,0.000000347],[0.000011915,0.000000377],[0.000011827,0.000000407],[0.000011739,0.000000438],[0.000011652,0.000000469],[0.000011566,0.000000501],[0.000011481,0.000000533],[0.000011397,0.000000565],[0.000011314,0.000000597],[0.000011232,0.000000628],[0.000011152,0.000000660],[0.000011073,0.000000691],[0.000010995,0.000000722],[0.000010918,0.000000753],[0.000010842,0.000000783],[0.000010768,0.000000813],[0.000010695,0.000000842],[0.000010623,0.000000870],[0.000010552,0.000000899],[0.000010483,0.000000926],[0.000010414,0.000000953],[0.000010348,0.000000979],[0.000010282,0.000001005],[0.000010217,0.000001030],[0.000010154,0.000001055],[0.000010092,0.000001079],[0.000010031,0.000001102],[0.000009971,0.000001125],[0.000009913,0.000001147],[0.000009854,0.000001169],[0.000009797,0.000001190],[0.000009740,0.000001211],[0.000009684,0.000001231],[0.000009628,0.000001251],[0.000009573,0.000001271],[0.000009518,0.000001290],[0.000009463,0.000001310],[0.000009409,0.000001329],[0.000009354,0.000001349],[0.000009301,0.000001368],[0.000009247,0.000001388],[0.000009193,0.000001407],[0.000009140,0.000001427],[0.000009086,0.000001446],[0.000009033,0.000001466],[0.000008980,0.000001485],[0.000008928,0.000001505],[0.000008875,0.000001524],[0.000008823,0.000001543],[0.000008771,0.000001562],[0.000008719,0.000001581],[0.000008667,0.000001599],[0.000008615,0.000001617],[0.000008564,0.000001635],[0.000008513,0.000001652],[0.000008463,0.000001669],[0.000008413,0.000001685],[0.000008363,0.000001701],[0.000008313,0.000001716],[0.000008264,0.000001731],[0.000008216,0.000001745],[0.000008167,0.000001759],[0.000008120,0.000001772],[0.000008072,0.000001784],[0.000008025,0.000001796],[0.000007978,0.000001807],[0.000007931,0.000001818],[0.000007884,0.000001828],[0.000007838,0.000001837],[0.000007791,0.000001845],[0.000007744,0.000001852],[0.000007697,0.000001858],[0.000007649,0.000001863],[0.000007601,0.000001868],[0.000007553,0.000001871],[0.000007504,0.000001873],[0.000007453,0.000001874],[0.000007402,0.000001874],[0.000007350,0.000001873],[0.000007296,0.000001871],[0.000007241,0.000001868],[0.000007183,0.000001862],[0.000007123,0.000001856],[0.000007059,0.000001847],[0.000006991,0.000001836],[0.000006920,0.000001823],[0.000006847,0.000001811],[0.000006775,0.000001801],[0.000006706,0.000001795],[0.000006638,0.000001790],[0.000006571,0.000001787],[0.000006504,0.000001783],[0.000006437,0.000001780],[0.000006370,0.000001775],[0.000006302,0.000001771],[0.000006234,0.000001767],[0.000017129,-0.000000672],[0.000017049,-0.000000655],[0.000016968,-0.000000639],[0.000016887,-0.000000622],[0.000016807,-0.000000606],[0.000016726,-0.000000590],[0.000016645,-0.000000574],[0.000016564,-0.000000558],[0.000016483,-0.000000542],[0.000016403,-0.000000526],[0.000016322,-0.000000511],[0.000016241,-0.000000495],[0.000016160,-0.000000480],[0.000016079,-0.000000465],[0.000015998,-0.000000450],[0.000015917,-0.000000435],[0.000015836,-0.000000421],[0.000015755,-0.000000407],[0.000015673,-0.000000392],[0.000015592,-0.000000379],[0.000015511,-0.000000365],[0.000015430,-0.000000351],[0.000015348,-0.000000338],[0.000015267,-0.000000325],[0.000015185,-0.000000312],[0.000015103,-0.000000299],[0.000015021,-0.000000287],[0.000014939,-0.000000274],[0.000014857,-0.000000262],[0.000014774,-0.000000250],[0.000014691,-0.000000238],[0.000014608,-0.000000226],[0.000014525,-0.000000214],[0.000014441,-0.000000202],[0.000014357,-0.000000190],[0.000014273,-0.000000179],[0.000014188,-0.000000166],[0.000014103,-0.000000154],[0.000014017,-0.000000141],[0.000013931,-0.000000128],[0.000013844,-0.000000115],[0.000013758,-0.000000101],[0.000013670,-0.000000086],[0.000013582,-0.000000071],[0.000013493,-0.000000056],[0.000013404,-0.000000039],[0.000013314,-0.000000022],[0.000013224,-0.000000005],[0.000013134,0.000000014],[0.000013043,0.000000033],[0.000012952,0.000000053],[0.000012861,0.000000074],[0.000012769,0.000000096],[0.000012678,0.000000118],[0.000012586,0.000000142],[0.000012494,0.000000166],[0.000012403,0.000000192],[0.000012311,0.000000218],[0.000012220,0.000000245],[0.000012129,0.000000272],[0.000012038,0.000000301],[0.000011948,0.000000330],[0.000011859,0.000000360],[0.000011770,0.000000390],[0.000011682,0.000000421],[0.000011595,0.000000453],[0.000011509,0.000000484],[0.000011425,0.000000516],[0.000011341,0.000000548],[0.000011259,0.000000580],[0.000011178,0.000000612],[0.000011099,0.000000643],[0.000011022,0.000000674],[0.000010945,0.000000705],[0.000010870,0.000000735],[0.000010797,0.000000765],[0.000010725,0.000000794],[0.000010654,0.000000823],[0.000010585,0.000000850],[0.000010517,0.000000878],[0.000010450,0.000000904],[0.000010384,0.000000930],[0.000010320,0.000000955],[0.000010257,0.000000980],[0.000010195,0.000001004],[0.000010133,0.000001027],[0.000010073,0.000001050],[0.000010013,0.000001071],[0.000009955,0.000001093],[0.000009896,0.000001114],[0.000009838,0.000001134],[0.000009781,0.000001154],[0.000009724,0.000001174],[0.000009667,0.000001194],[0.000009611,0.000001213],[0.000009554,0.000001232],[0.000009498,0.000001251],[0.000009442,0.000001270],[0.000009387,0.000001290],[0.000009332,0.000001309],[0.000009277,0.000001328],[0.000009222,0.000001347],[0.000009167,0.000001367],[0.000009113,0.000001386],[0.000009058,0.000001406],[0.000009005,0.000001425],[0.000008951,0.000001445],[0.000008898,0.000001464],[0.000008845,0.000001483],[0.000008792,0.000001502],[0.000008740,0.000001521],[0.000008688,0.000001539],[0.000008636,0.000001557],[0.000008584,0.000001575],[0.000008533,0.000001592],[0.000008483,0.000001609],[0.000008432,0.000001625],[0.000008382,0.000001641],[0.000008333,0.000001657],[0.000008284,0.000001672],[0.000008235,0.000001686],[0.000008187,0.000001700],[0.000008139,0.000001713],[0.000008091,0.000001725],[0.000008043,0.000001737],[0.000007996,0.000001748],[0.000007948,0.000001759],[0.000007901,0.000001769],[0.000007854,0.000001777],[0.000007806,0.000001786],[0.000007758,0.000001793],[0.000007710,0.000001799],[0.000007662,0.000001805],[0.000007613,0.000001809],[0.000007563,0.000001813],[0.000007512,0.000001815],[0.000007461,0.000001817],[0.000007409,0.000001818],[0.000007356,0.000001818],[0.000007302,0.000001817],[0.000007247,0.000001815],[0.000007191,0.000001812],[0.000007133,0.000001807],[0.000007071,0.000001801],[0.000007005,0.000001792],[0.000006933,0.000001780],[0.000006858,0.000001767],[0.000006787,0.000001759],[0.000006719,0.000001756],[0.000006654,0.000001755],[0.000006588,0.000001753],[0.000006521,0.000001749],[0.000006453,0.000001745],[0.000006384,0.000001741],[0.000006315,0.000001737],[0.000006246,0.000001732],[0.000017126,-0.000000682],[0.000017046,-0.000000666],[0.000016966,-0.000000651],[0.000016886,-0.000000635],[0.000016805,-0.000000620],[0.000016725,-0.000000605],[0.000016645,-0.000000589],[0.000016564,-0.000000574],[0.000016484,-0.000000559],[0.000016403,-0.000000545],[0.000016323,-0.000000530],[0.000016242,-0.000000515],[0.000016162,-0.000000501],[0.000016081,-0.000000487],[0.000016000,-0.000000472],[0.000015920,-0.000000458],[0.000015839,-0.000000445],[0.000015759,-0.000000431],[0.000015678,-0.000000417],[0.000015597,-0.000000404],[0.000015516,-0.000000391],[0.000015436,-0.000000378],[0.000015355,-0.000000365],[0.000015274,-0.000000352],[0.000015193,-0.000000339],[0.000015112,-0.000000327],[0.000015031,-0.000000315],[0.000014949,-0.000000303],[0.000014867,-0.000000290],[0.000014786,-0.000000279],[0.000014704,-0.000000267],[0.000014622,-0.000000255],[0.000014539,-0.000000243],[0.000014456,-0.000000231],[0.000014373,-0.000000220],[0.000014290,-0.000000208],[0.000014206,-0.000000196],[0.000014122,-0.000000184],[0.000014037,-0.000000171],[0.000013952,-0.000000159],[0.000013867,-0.000000146],[0.000013781,-0.000000132],[0.000013695,-0.000000118],[0.000013608,-0.000000104],[0.000013520,-0.000000089],[0.000013432,-0.000000073],[0.000013344,-0.000000057],[0.000013255,-0.000000040],[0.000013165,-0.000000022],[0.000013076,-0.000000003],[0.000012985,0.000000016],[0.000012895,0.000000036],[0.000012804,0.000000057],[0.000012712,0.000000079],[0.000012621,0.000000101],[0.000012529,0.000000125],[0.000012438,0.000000149],[0.000012346,0.000000175],[0.000012254,0.000000201],[0.000012163,0.000000228],[0.000012072,0.000000255],[0.000011981,0.000000284],[0.000011891,0.000000313],[0.000011802,0.000000343],[0.000011713,0.000000374],[0.000011625,0.000000405],[0.000011538,0.000000436],[0.000011453,0.000000468],[0.000011369,0.000000500],[0.000011286,0.000000532],[0.000011205,0.000000564],[0.000011126,0.000000595],[0.000011049,0.000000627],[0.000010973,0.000000657],[0.000010899,0.000000688],[0.000010826,0.000000718],[0.000010755,0.000000747],[0.000010686,0.000000775],[0.000010618,0.000000803],[0.000010551,0.000000830],[0.000010486,0.000000856],[0.000010422,0.000000881],[0.000010359,0.000000906],[0.000010296,0.000000930],[0.000010235,0.000000953],[0.000010174,0.000000975],[0.000010115,0.000000997],[0.000010055,0.000001018],[0.000009996,0.000001039],[0.000009938,0.000001059],[0.000009880,0.000001079],[0.000009822,0.000001099],[0.000009764,0.000001118],[0.000009706,0.000001137],[0.000009648,0.000001156],[0.000009591,0.000001175],[0.000009534,0.000001193],[0.000009476,0.000001212],[0.000009420,0.000001231],[0.000009363,0.000001250],[0.000009306,0.000001269],[0.000009250,0.000001288],[0.000009194,0.000001308],[0.000009139,0.000001327],[0.000009084,0.000001347],[0.000009029,0.000001366],[0.000008975,0.000001386],[0.000008920,0.000001405],[0.000008867,0.000001424],[0.000008814,0.000001443],[0.000008761,0.000001462],[0.000008708,0.000001480],[0.000008656,0.000001498],[0.000008605,0.000001516],[0.000008553,0.000001533],[0.000008502,0.000001550],[0.000008452,0.000001566],[0.000008402,0.000001582],[0.000008352,0.000001598],[0.000008303,0.000001613],[0.000008254,0.000001627],[0.000008206,0.000001641],[0.000008158,0.000001654],[0.000008110,0.000001667],[0.000008062,0.000001678],[0.000008014,0.000001690],[0.000007966,0.000001700],[0.000007918,0.000001710],[0.000007870,0.000001719],[0.000007822,0.000001727],[0.000007773,0.000001734],[0.000007724,0.000001741],[0.000007674,0.000001746],[0.000007624,0.000001751],[0.000007573,0.000001755],[0.000007522,0.000001758],[0.000007469,0.000001760],[0.000007416,0.000001762],[0.000007362,0.000001762],[0.000007308,0.000001762],[0.000007252,0.000001762],[0.000007197,0.000001760],[0.000007140,0.000001758],[0.000007082,0.000001754],[0.000007018,0.000001748],[0.000006947,0.000001737],[0.000006871,0.000001724],[0.000006800,0.000001719],[0.000006735,0.000001721],[0.000006670,0.000001721],[0.000006604,0.000001719],[0.000006537,0.000001715],[0.000006468,0.000001711],[0.000006399,0.000001706],[0.000006328,0.000001702],[0.000006258,0.000001698],[0.000017124,-0.000000692],[0.000017044,-0.000000677],[0.000016964,-0.000000663],[0.000016884,-0.000000648],[0.000016804,-0.000000634],[0.000016724,-0.000000619],[0.000016644,-0.000000605],[0.000016564,-0.000000591],[0.000016484,-0.000000577],[0.000016404,-0.000000562],[0.000016324,-0.000000549],[0.000016243,-0.000000535],[0.000016163,-0.000000521],[0.000016083,-0.000000508],[0.000016003,-0.000000494],[0.000015923,-0.000000481],[0.000015843,-0.000000468],[0.000015763,-0.000000455],[0.000015682,-0.000000442],[0.000015602,-0.000000429],[0.000015522,-0.000000416],[0.000015442,-0.000000403],[0.000015362,-0.000000391],[0.000015281,-0.000000379],[0.000015201,-0.000000366],[0.000015121,-0.000000354],[0.000015040,-0.000000342],[0.000014959,-0.000000330],[0.000014878,-0.000000318],[0.000014798,-0.000000307],[0.000014716,-0.000000295],[0.000014635,-0.000000283],[0.000014553,-0.000000272],[0.000014471,-0.000000260],[0.000014389,-0.000000248],[0.000014307,-0.000000237],[0.000014224,-0.000000225],[0.000014141,-0.000000213],[0.000014058,-0.000000201],[0.000013974,-0.000000189],[0.000013890,-0.000000176],[0.000013805,-0.000000163],[0.000013720,-0.000000149],[0.000013634,-0.000000136],[0.000013548,-0.000000121],[0.000013461,-0.000000106],[0.000013374,-0.000000090],[0.000013286,-0.000000074],[0.000013197,-0.000000057],[0.000013108,-0.000000039],[0.000013019,-0.000000021],[0.000012929,-0.000000002],[0.000012838,0.000000019],[0.000012747,0.000000040],[0.000012656,0.000000061],[0.000012565,0.000000084],[0.000012473,0.000000108],[0.000012381,0.000000132],[0.000012289,0.000000157],[0.000012198,0.000000184],[0.000012106,0.000000211],[0.000012015,0.000000239],[0.000011924,0.000000267],[0.000011833,0.000000297],[0.000011744,0.000000327],[0.000011655,0.000000358],[0.000011567,0.000000389],[0.000011481,0.000000420],[0.000011397,0.000000452],[0.000011314,0.000000484],[0.000011232,0.000000516],[0.000011153,0.000000548],[0.000011076,0.000000579],[0.000011001,0.000000610],[0.000010927,0.000000641],[0.000010856,0.000000671],[0.000010786,0.000000700],[0.000010718,0.000000728],[0.000010651,0.000000756],[0.000010586,0.000000783],[0.000010522,0.000000808],[0.000010459,0.000000833],[0.000010397,0.000000857],[0.000010336,0.000000880],[0.000010276,0.000000902],[0.000010216,0.000000924],[0.000010157,0.000000945],[0.000010098,0.000000966],[0.000010039,0.000000986],[0.000009980,0.000001005],[0.000009921,0.000001024],[0.000009863,0.000001043],[0.000009804,0.000001062],[0.000009745,0.000001081],[0.000009686,0.000001099],[0.000009628,0.000001118],[0.000009569,0.000001136],[0.000009511,0.000001155],[0.000009452,0.000001173],[0.000009394,0.000001192],[0.000009336,0.000001211],[0.000009279,0.000001230],[0.000009222,0.000001249],[0.000009165,0.000001268],[0.000009109,0.000001288],[0.000009053,0.000001307],[0.000008998,0.000001327],[0.000008943,0.000001346],[0.000008889,0.000001365],[0.000008835,0.000001384],[0.000008782,0.000001403],[0.000008729,0.000001421],[0.000008677,0.000001440],[0.000008625,0.000001457],[0.000008573,0.000001475],[0.000008522,0.000001491],[0.000008472,0.000001508],[0.000008422,0.000001524],[0.000008372,0.000001539],[0.000008323,0.000001554],[0.000008274,0.000001569],[0.000008225,0.000001582],[0.000008177,0.000001596],[0.000008128,0.000001608],[0.000008080,0.000001620],[0.000008032,0.000001632],[0.000007984,0.000001642],[0.000007935,0.000001652],[0.000007886,0.000001661],[0.000007837,0.000001669],[0.000007788,0.000001676],[0.000007738,0.000001683],[0.000007687,0.000001689],[0.000007636,0.000001694],[0.000007584,0.000001698],[0.000007531,0.000001701],[0.000007478,0.000001704],[0.000007423,0.000001706],[0.000007369,0.000001707],[0.000007313,0.000001708],[0.000007257,0.000001708],[0.000007201,0.000001708],[0.000007144,0.000001707],[0.000007087,0.000001705],[0.000007028,0.000001702],[0.000006958,0.000001692],[0.000006885,0.000001684],[0.000006818,0.000001686],[0.000006754,0.000001690],[0.000006688,0.000001689],[0.000006621,0.000001684],[0.000006553,0.000001679],[0.000006483,0.000001675],[0.000006412,0.000001671],[0.000006341,0.000001668],[0.000006270,0.000001665],[0.000017121,-0.000000701],[0.000017042,-0.000000688],[0.000016963,-0.000000674],[0.000016883,-0.000000660],[0.000016803,-0.000000646],[0.000016723,-0.000000633],[0.000016644,-0.000000619],[0.000016564,-0.000000606],[0.000016484,-0.000000593],[0.000016405,-0.000000580],[0.000016325,-0.000000567],[0.000016245,-0.000000554],[0.000016165,-0.000000541],[0.000016086,-0.000000528],[0.000016006,-0.000000515],[0.000015926,-0.000000503],[0.000015846,-0.000000490],[0.000015767,-0.000000478],[0.000015687,-0.000000466],[0.000015607,-0.000000453],[0.000015528,-0.000000441],[0.000015448,-0.000000429],[0.000015369,-0.000000417],[0.000015289,-0.000000405],[0.000015209,-0.000000393],[0.000015129,-0.000000381],[0.000015049,-0.000000369],[0.000014970,-0.000000358],[0.000014889,-0.000000346],[0.000014809,-0.000000334],[0.000014729,-0.000000323],[0.000014648,-0.000000311],[0.000014567,-0.000000300],[0.000014487,-0.000000288],[0.000014405,-0.000000277],[0.000014324,-0.000000265],[0.000014242,-0.000000254],[0.000014161,-0.000000242],[0.000014078,-0.000000230],[0.000013995,-0.000000218],[0.000013912,-0.000000206],[0.000013829,-0.000000193],[0.000013745,-0.000000180],[0.000013660,-0.000000167],[0.000013575,-0.000000153],[0.000013490,-0.000000138],[0.000013403,-0.000000123],[0.000013316,-0.000000108],[0.000013229,-0.000000091],[0.000013141,-0.000000074],[0.000013052,-0.000000057],[0.000012963,-0.000000038],[0.000012873,-0.000000019],[0.000012782,0.000000001],[0.000012691,0.000000022],[0.000012600,0.000000044],[0.000012509,0.000000067],[0.000012417,0.000000090],[0.000012324,0.000000115],[0.000012232,0.000000140],[0.000012140,0.000000167],[0.000012048,0.000000194],[0.000011957,0.000000222],[0.000011865,0.000000251],[0.000011775,0.000000281],[0.000011685,0.000000311],[0.000011597,0.000000342],[0.000011510,0.000000373],[0.000011425,0.000000405],[0.000011341,0.000000437],[0.000011259,0.000000469],[0.000011180,0.000000501],[0.000011103,0.000000532],[0.000011028,0.000000564],[0.000010955,0.000000594],[0.000010885,0.000000625],[0.000010816,0.000000654],[0.000010750,0.000000682],[0.000010685,0.000000710],[0.000010621,0.000000736],[0.000010559,0.000000761],[0.000010497,0.000000785],[0.000010437,0.000000809],[0.000010377,0.000000831],[0.000010317,0.000000852],[0.000010258,0.000000873],[0.000010199,0.000000893],[0.000010140,0.000000913],[0.000010081,0.000000932],[0.000010022,0.000000951],[0.000009963,0.000000970],[0.000009903,0.000000989],[0.000009844,0.000001007],[0.000009784,0.000001025],[0.000009724,0.000001043],[0.000009664,0.000001061],[0.000009604,0.000001079],[0.000009545,0.000001098],[0.000009485,0.000001116],[0.000009425,0.000001134],[0.000009366,0.000001153],[0.000009307,0.000001172],[0.000009249,0.000001191],[0.000009191,0.000001210],[0.000009134,0.000001229],[0.000009077,0.000001249],[0.000009021,0.000001268],[0.000008966,0.000001288],[0.000008911,0.000001307],[0.000008857,0.000001326],[0.000008803,0.000001345],[0.000008750,0.000001363],[0.000008697,0.000001381],[0.000008645,0.000001399],[0.000008594,0.000001416],[0.000008543,0.000001433],[0.000008492,0.000001450],[0.000008442,0.000001466],[0.000008392,0.000001481],[0.000008343,0.000001496],[0.000008294,0.000001511],[0.000008245,0.000001525],[0.000008196,0.000001538],[0.000008148,0.000001551],[0.000008099,0.000001563],[0.000008051,0.000001574],[0.000008002,0.000001585],[0.000007953,0.000001594],[0.000007903,0.000001603],[0.000007853,0.000001612],[0.000007803,0.000001619],[0.000007752,0.000001626],[0.000007700,0.000001632],[0.000007648,0.000001637],[0.000007595,0.000001641],[0.000007541,0.000001645],[0.000007487,0.000001648],[0.000007432,0.000001651],[0.000007376,0.000001653],[0.000007319,0.000001654],[0.000007262,0.000001655],[0.000007204,0.000001655],[0.000007145,0.000001654],[0.000007085,0.000001651],[0.000007024,0.000001645],[0.000006958,0.000001638],[0.000006895,0.000001642],[0.000006834,0.000001653],[0.000006772,0.000001658],[0.000006705,0.000001653],[0.000006637,0.000001647],[0.000006567,0.000001642],[0.000006496,0.000001639],[0.000006425,0.000001637],[0.000006354,0.000001634],[0.000006282,0.000001631],[0.000017119,-0.000000710],[0.000017040,-0.000000697],[0.000016961,-0.000000685],[0.000016881,-0.000000672],[0.000016802,-0.000000659],[0.000016723,-0.000000646],[0.000016643,-0.000000634],[0.000016564,-0.000000621],[0.000016485,-0.000000609],[0.000016405,-0.000000596],[0.000016326,-0.000000584],[0.000016246,-0.000000572],[0.000016167,-0.000000560],[0.000016088,-0.000000548],[0.000016009,-0.000000536],[0.000015929,-0.000000524],[0.000015850,-0.000000512],[0.000015771,-0.000000501],[0.000015692,-0.000000489],[0.000015613,-0.000000477],[0.000015534,-0.000000466],[0.000015455,-0.000000454],[0.000015376,-0.000000442],[0.000015296,-0.000000431],[0.000015217,-0.000000419],[0.000015138,-0.000000408],[0.000015059,-0.000000396],[0.000014980,-0.000000385],[0.000014901,-0.000000373],[0.000014821,-0.000000362],[0.000014742,-0.000000350],[0.000014662,-0.000000339],[0.000014582,-0.000000327],[0.000014502,-0.000000316],[0.000014422,-0.000000305],[0.000014341,-0.000000293],[0.000014261,-0.000000282],[0.000014180,-0.000000270],[0.000014099,-0.000000259],[0.000014017,-0.000000247],[0.000013935,-0.000000235],[0.000013853,-0.000000223],[0.000013770,-0.000000210],[0.000013686,-0.000000198],[0.000013603,-0.000000184],[0.000013518,-0.000000170],[0.000013433,-0.000000156],[0.000013347,-0.000000141],[0.000013260,-0.000000125],[0.000013173,-0.000000109],[0.000013085,-0.000000092],[0.000012997,-0.000000075],[0.000012907,-0.000000056],[0.000012817,-0.000000037],[0.000012727,-0.000000017],[0.000012636,0.000000004],[0.000012544,0.000000026],[0.000012452,0.000000049],[0.000012360,0.000000073],[0.000012267,0.000000098],[0.000012174,0.000000123],[0.000012082,0.000000150],[0.000011990,0.000000177],[0.000011898,0.000000206],[0.000011806,0.000000235],[0.000011716,0.000000264],[0.000011627,0.000000295],[0.000011539,0.000000326],[0.000011453,0.000000358],[0.000011369,0.000000390],[0.000011287,0.000000422],[0.000011207,0.000000454],[0.000011130,0.000000486],[0.000011056,0.000000517],[0.000010984,0.000000548],[0.000010914,0.000000579],[0.000010847,0.000000608],[0.000010782,0.000000636],[0.000010718,0.000000664],[0.000010657,0.000000690],[0.000010596,0.000000715],[0.000010536,0.000000738],[0.000010477,0.000000761],[0.000010418,0.000000782],[0.000010359,0.000000803],[0.000010300,0.000000823],[0.000010242,0.000000842],[0.000010183,0.000000861],[0.000010124,0.000000880],[0.000010065,0.000000898],[0.000010005,0.000000916],[0.000009944,0.000000934],[0.000009884,0.000000952],[0.000009823,0.000000970],[0.000009762,0.000000988],[0.000009701,0.000001005],[0.000009640,0.000001023],[0.000009578,0.000001041],[0.000009517,0.000001059],[0.000009457,0.000001078],[0.000009396,0.000001096],[0.000009336,0.000001115],[0.000009277,0.000001134],[0.000009218,0.000001153],[0.000009159,0.000001172],[0.000009102,0.000001191],[0.000009045,0.000001210],[0.000008989,0.000001230],[0.000008933,0.000001249],[0.000008878,0.000001268],[0.000008824,0.000001287],[0.000008771,0.000001305],[0.000008718,0.000001323],[0.000008666,0.000001341],[0.000008614,0.000001359],[0.000008563,0.000001376],[0.000008512,0.000001392],[0.000008462,0.000001408],[0.000008412,0.000001424],[0.000008363,0.000001439],[0.000008314,0.000001453],[0.000008265,0.000001467],[0.000008216,0.000001481],[0.000008167,0.000001494],[0.000008119,0.000001506],[0.000008070,0.000001517],[0.000008020,0.000001527],[0.000007970,0.000001537],[0.000007920,0.000001546],[0.000007870,0.000001555],[0.000007818,0.000001562],[0.000007766,0.000001569],[0.000007714,0.000001575],[0.000007661,0.000001581],[0.000007607,0.000001585],[0.000007552,0.000001590],[0.000007497,0.000001593],[0.000007440,0.000001596],[0.000007383,0.000001599],[0.000007325,0.000001601],[0.000007267,0.000001602],[0.000007207,0.000001603],[0.000007145,0.000001602],[0.000007083,0.000001599],[0.000007020,0.000001592],[0.000006957,0.000001589],[0.000006904,0.000001607],[0.000006844,0.000001614],[0.000006783,0.000001614],[0.000006718,0.000001610],[0.000006650,0.000001607],[0.000006579,0.000001605],[0.000006508,0.000001604],[0.000006437,0.000001602],[0.000006366,0.000001599],[0.000006295,0.000001597],[0.000017117,-0.000000719],[0.000017038,-0.000000707],[0.000016959,-0.000000695],[0.000016880,-0.000000683],[0.000016801,-0.000000671],[0.000016722,-0.000000659],[0.000016643,-0.000000647],[0.000016564,-0.000000636],[0.000016485,-0.000000624],[0.000016406,-0.000000613],[0.000016327,-0.000000601],[0.000016248,-0.000000590],[0.000016169,-0.000000579],[0.000016090,-0.000000567],[0.000016012,-0.000000556],[0.000015933,-0.000000545],[0.000015854,-0.000000534],[0.000015775,-0.000000523],[0.000015697,-0.000000512],[0.000015618,-0.000000501],[0.000015540,-0.000000490],[0.000015461,-0.000000479],[0.000015383,-0.000000467],[0.000015304,-0.000000456],[0.000015226,-0.000000445],[0.000015147,-0.000000434],[0.000015069,-0.000000422],[0.000014990,-0.000000411],[0.000014912,-0.000000400],[0.000014833,-0.000000388],[0.000014754,-0.000000377],[0.000014675,-0.000000366],[0.000014596,-0.000000354],[0.000014517,-0.000000343],[0.000014438,-0.000000332],[0.000014358,-0.000000321],[0.000014279,-0.000000309],[0.000014199,-0.000000298],[0.000014119,-0.000000287],[0.000014038,-0.000000275],[0.000013957,-0.000000264],[0.000013876,-0.000000252],[0.000013795,-0.000000240],[0.000013712,-0.000000227],[0.000013630,-0.000000215],[0.000013546,-0.000000201],[0.000013462,-0.000000188],[0.000013378,-0.000000173],[0.000013292,-0.000000159],[0.000013206,-0.000000143],[0.000013119,-0.000000127],[0.000013031,-0.000000110],[0.000012942,-0.000000092],[0.000012853,-0.000000074],[0.000012762,-0.000000055],[0.000012672,-0.000000035],[0.000012580,-0.000000013],[0.000012488,0.000000009],[0.000012395,0.000000032],[0.000012302,0.000000056],[0.000012209,0.000000081],[0.000012116,0.000000106],[0.000012023,0.000000133],[0.000011930,0.000000161],[0.000011838,0.000000189],[0.000011747,0.000000219],[0.000011657,0.000000249],[0.000011569,0.000000280],[0.000011482,0.000000311],[0.000011397,0.000000343],[0.000011315,0.000000375],[0.000011235,0.000000407],[0.000011158,0.000000439],[0.000011084,0.000000471],[0.000011012,0.000000502],[0.000010944,0.000000533],[0.000010877,0.000000562],[0.000010814,0.000000591],[0.000010752,0.000000618],[0.000010692,0.000000644],[0.000010633,0.000000669],[0.000010575,0.000000691],[0.000010517,0.000000713],[0.000010459,0.000000734],[0.000010401,0.000000753],[0.000010343,0.000000772],[0.000010285,0.000000791],[0.000010226,0.000000809],[0.000010167,0.000000827],[0.000010107,0.000000845],[0.000010046,0.000000862],[0.000009985,0.000000880],[0.000009924,0.000000897],[0.000009862,0.000000915],[0.000009800,0.000000933],[0.000009737,0.000000950],[0.000009675,0.000000968],[0.000009612,0.000000986],[0.000009550,0.000001004],[0.000009488,0.000001022],[0.000009426,0.000001040],[0.000009365,0.000001058],[0.000009304,0.000001077],[0.000009244,0.000001096],[0.000009185,0.000001115],[0.000009126,0.000001134],[0.000009068,0.000001153],[0.000009011,0.000001172],[0.000008955,0.000001191],[0.000008900,0.000001210],[0.000008846,0.000001229],[0.000008792,0.000001248],[0.000008739,0.000001266],[0.000008686,0.000001284],[0.000008634,0.000001301],[0.000008583,0.000001318],[0.000008533,0.000001335],[0.000008482,0.000001351],[0.000008433,0.000001367],[0.000008383,0.000001382],[0.000008334,0.000001397],[0.000008285,0.000001411],[0.000008236,0.000001424],[0.000008187,0.000001437],[0.000008138,0.000001449],[0.000008089,0.000001460],[0.000008039,0.000001471],[0.000007988,0.000001481],[0.000007937,0.000001490],[0.000007886,0.000001498],[0.000007834,0.000001506],[0.000007781,0.000001513],[0.000007728,0.000001519],[0.000007674,0.000001525],[0.000007619,0.000001530],[0.000007563,0.000001535],[0.000007507,0.000001539],[0.000007450,0.000001542],[0.000007391,0.000001545],[0.000007332,0.000001548],[0.000007272,0.000001549],[0.000007211,0.000001551],[0.000007148,0.000001552],[0.000007085,0.000001552],[0.000007022,0.000001551],[0.000006961,0.000001555],[0.000006905,0.000001567],[0.000006847,0.000001570],[0.000006789,0.000001568],[0.000006727,0.000001564],[0.000006659,0.000001566],[0.000006589,0.000001568],[0.000006518,0.000001568],[0.000006448,0.000001567],[0.000006379,0.000001565],[0.000006310,0.000001562],[0.000017114,-0.000000726],[0.000017036,-0.000000715],[0.000016957,-0.000000704],[0.000016879,-0.000000693],[0.000016800,-0.000000682],[0.000016721,-0.000000671],[0.000016643,-0.000000661],[0.000016564,-0.000000650],[0.000016486,-0.000000639],[0.000016407,-0.000000629],[0.000016328,-0.000000618],[0.000016250,-0.000000607],[0.000016171,-0.000000597],[0.000016093,-0.000000587],[0.000016015,-0.000000576],[0.000015936,-0.000000566],[0.000015858,-0.000000555],[0.000015780,-0.000000545],[0.000015702,-0.000000534],[0.000015624,-0.000000524],[0.000015546,-0.000000513],[0.000015468,-0.000000503],[0.000015390,-0.000000492],[0.000015312,-0.000000481],[0.000015234,-0.000000470],[0.000015157,-0.000000459],[0.000015079,-0.000000449],[0.000015001,-0.000000437],[0.000014923,-0.000000426],[0.000014845,-0.000000415],[0.000014767,-0.000000404],[0.000014689,-0.000000392],[0.000014611,-0.000000381],[0.000014533,-0.000000370],[0.000014454,-0.000000359],[0.000014376,-0.000000348],[0.000014297,-0.000000337],[0.000014218,-0.000000325],[0.000014139,-0.000000314],[0.000014059,-0.000000303],[0.000013980,-0.000000292],[0.000013900,-0.000000280],[0.000013819,-0.000000269],[0.000013738,-0.000000257],[0.000013657,-0.000000245],[0.000013575,-0.000000232],[0.000013492,-0.000000219],[0.000013408,-0.000000205],[0.000013324,-0.000000191],[0.000013238,-0.000000176],[0.000013152,-0.000000161],[0.000013065,-0.000000145],[0.000012977,-0.000000128],[0.000012888,-0.000000110],[0.000012798,-0.000000092],[0.000012707,-0.000000072],[0.000012616,-0.000000052],[0.000012523,-0.000000031],[0.000012431,-0.000000009],[0.000012337,0.000000015],[0.000012244,0.000000039],[0.000012150,0.000000064],[0.000012056,0.000000090],[0.000011963,0.000000117],[0.000011870,0.000000145],[0.000011778,0.000000174],[0.000011688,0.000000203],[0.000011599,0.000000234],[0.000011511,0.000000264],[0.000011426,0.000000296],[0.000011343,0.000000328],[0.000011263,0.000000361],[0.000011186,0.000000393],[0.000011112,0.000000425],[0.000011041,0.000000457],[0.000010973,0.000000488],[0.000010908,0.000000517],[0.000010846,0.000000546],[0.000010786,0.000000573],[0.000010728,0.000000599],[0.000010671,0.000000623],[0.000010615,0.000000645],[0.000010558,0.000000666],[0.000010502,0.000000685],[0.000010445,0.000000704],[0.000010387,0.000000722],[0.000010329,0.000000740],[0.000010270,0.000000757],[0.000010210,0.000000774],[0.000010149,0.000000792],[0.000010088,0.000000809],[0.000010026,0.000000826],[0.000009963,0.000000844],[0.000009900,0.000000861],[0.000009837,0.000000878],[0.000009774,0.000000896],[0.000009710,0.000000913],[0.000009646,0.000000931],[0.000009583,0.000000949],[0.000009519,0.000000967],[0.000009456,0.000000985],[0.000009394,0.000001003],[0.000009332,0.000001021],[0.000009270,0.000001040],[0.000009210,0.000001059],[0.000009150,0.000001077],[0.000009092,0.000001096],[0.000009034,0.000001115],[0.000008977,0.000001134],[0.000008922,0.000001153],[0.000008867,0.000001172],[0.000008813,0.000001190],[0.000008760,0.000001209],[0.000008707,0.000001227],[0.000008655,0.000001244],[0.000008604,0.000001261],[0.000008553,0.000001278],[0.000008503,0.000001294],[0.000008453,0.000001310],[0.000008404,0.000001326],[0.000008355,0.000001341],[0.000008306,0.000001355],[0.000008257,0.000001368],[0.000008208,0.000001381],[0.000008158,0.000001393],[0.000008108,0.000001404],[0.000008058,0.000001415],[0.000008007,0.000001425],[0.000007955,0.000001434],[0.000007903,0.000001442],[0.000007850,0.000001450],[0.000007797,0.000001457],[0.000007743,0.000001464],[0.000007688,0.000001470],[0.000007632,0.000001475],[0.000007576,0.000001481],[0.000007518,0.000001485],[0.000007460,0.000001489],[0.000007401,0.000001493],[0.000007340,0.000001495],[0.000007279,0.000001498],[0.000007217,0.000001499],[0.000007155,0.000001502],[0.000007094,0.000001508],[0.000007030,0.000001512],[0.000006966,0.000001517],[0.000006903,0.000001522],[0.000006848,0.000001525],[0.000006791,0.000001525],[0.000006731,0.000001524],[0.000006663,0.000001530],[0.000006594,0.000001533],[0.000006526,0.000001533],[0.000006459,0.000001531],[0.000006392,0.000001529],[0.000006326,0.000001526],[0.000017112,-0.000000734],[0.000017034,-0.000000723],[0.000016956,-0.000000713],[0.000016877,-0.000000703],[0.000016799,-0.000000693],[0.000016721,-0.000000683],[0.000016643,-0.000000673],[0.000016564,-0.000000663],[0.000016486,-0.000000653],[0.000016408,-0.000000644],[0.000016330,-0.000000634],[0.000016252,-0.000000624],[0.000016174,-0.000000615],[0.000016095,-0.000000605],[0.000016018,-0.000000595],[0.000015940,-0.000000586],[0.000015862,-0.000000576],[0.000015784,-0.000000566],[0.000015707,-0.000000556],[0.000015629,-0.000000547],[0.000015552,-0.000000537],[0.000015475,-0.000000527],[0.000015397,-0.000000516],[0.000015320,-0.000000506],[0.000015243,-0.000000496],[0.000015166,-0.000000485],[0.000015089,-0.000000474],[0.000015012,-0.000000463],[0.000014935,-0.000000452],[0.000014857,-0.000000441],[0.000014780,-0.000000430],[0.000014703,-0.000000419],[0.000014626,-0.000000408],[0.000014548,-0.000000397],[0.000014470,-0.000000385],[0.000014393,-0.000000374],[0.000014315,-0.000000363],[0.000014237,-0.000000352],[0.000014159,-0.000000341],[0.000014081,-0.000000330],[0.000014002,-0.000000319],[0.000013923,-0.000000308],[0.000013844,-0.000000297],[0.000013764,-0.000000286],[0.000013684,-0.000000274],[0.000013603,-0.000000262],[0.000013521,-0.000000249],[0.000013439,-0.000000237],[0.000013355,-0.000000223],[0.000013271,-0.000000209],[0.000013186,-0.000000194],[0.000013099,-0.000000179],[0.000013012,-0.000000163],[0.000012923,-0.000000146],[0.000012834,-0.000000128],[0.000012743,-0.000000110],[0.000012652,-0.000000090],[0.000012559,-0.000000070],[0.000012466,-0.000000048],[0.000012372,-0.000000026],[0.000012278,-0.000000002],[0.000012184,0.000000022],[0.000012090,0.000000048],[0.000011996,0.000000074],[0.000011902,0.000000101],[0.000011810,0.000000129],[0.000011719,0.000000158],[0.000011629,0.000000188],[0.000011542,0.000000218],[0.000011456,0.000000249],[0.000011373,0.000000282],[0.000011292,0.000000314],[0.000011215,0.000000347],[0.000011140,0.000000379],[0.000011070,0.000000411],[0.000011003,0.000000442],[0.000010939,0.000000472],[0.000010878,0.000000501],[0.000010820,0.000000528],[0.000010764,0.000000554],[0.000010709,0.000000577],[0.000010655,0.000000599],[0.000010600,0.000000619],[0.000010545,0.000000637],[0.000010488,0.000000655],[0.000010431,0.000000672],[0.000010373,0.000000689],[0.000010313,0.000000705],[0.000010253,0.000000722],[0.000010191,0.000000739],[0.000010129,0.000000756],[0.000010066,0.000000773],[0.000010003,0.000000790],[0.000009939,0.000000808],[0.000009874,0.000000825],[0.000009810,0.000000842],[0.000009745,0.000000860],[0.000009680,0.000000877],[0.000009615,0.000000895],[0.000009551,0.000000913],[0.000009486,0.000000931],[0.000009423,0.000000949],[0.000009359,0.000000967],[0.000009297,0.000000985],[0.000009236,0.000001003],[0.000009175,0.000001022],[0.000009115,0.000001040],[0.000009057,0.000001059],[0.000009000,0.000001078],[0.000008943,0.000001097],[0.000008888,0.000001115],[0.000008834,0.000001134],[0.000008780,0.000001152],[0.000008728,0.000001170],[0.000008676,0.000001188],[0.000008625,0.000001205],[0.000008574,0.000001222],[0.000008524,0.000001238],[0.000008475,0.000001254],[0.000008426,0.000001270],[0.000008377,0.000001285],[0.000008327,0.000001299],[0.000008278,0.000001313],[0.000008229,0.000001326],[0.000008179,0.000001338],[0.000008128,0.000001349],[0.000008077,0.000001359],[0.000008025,0.000001369],[0.000007973,0.000001378],[0.000007920,0.000001386],[0.000007867,0.000001394],[0.000007812,0.000001402],[0.000007758,0.000001409],[0.000007702,0.000001415],[0.000007646,0.000001422],[0.000007588,0.000001427],[0.000007530,0.000001432],[0.000007471,0.000001437],[0.000007411,0.000001441],[0.000007350,0.000001445],[0.000007288,0.000001448],[0.000007225,0.000001451],[0.000007163,0.000001455],[0.000007102,0.000001464],[0.000007038,0.000001471],[0.000006974,0.000001477],[0.000006911,0.000001480],[0.000006852,0.000001483],[0.000006793,0.000001487],[0.000006730,0.000001492],[0.000006663,0.000001498],[0.000006597,0.000001499],[0.000006533,0.000001497],[0.000006470,0.000001494],[0.000006407,0.000001492],[0.000006344,0.000001491],[0.000017109,-0.000000740],[0.000017032,-0.000000731],[0.000016954,-0.000000721],[0.000016876,-0.000000712],[0.000016798,-0.000000703],[0.000016720,-0.000000694],[0.000016643,-0.000000685],[0.000016565,-0.000000676],[0.000016487,-0.000000667],[0.000016409,-0.000000658],[0.000016331,-0.000000650],[0.000016254,-0.000000641],[0.000016176,-0.000000632],[0.000016098,-0.000000623],[0.000016021,-0.000000614],[0.000015943,-0.000000605],[0.000015866,-0.000000596],[0.000015789,-0.000000587],[0.000015712,-0.000000578],[0.000015635,-0.000000569],[0.000015558,-0.000000560],[0.000015482,-0.000000550],[0.000015405,-0.000000540],[0.000015328,-0.000000530],[0.000015252,-0.000000520],[0.000015175,-0.000000510],[0.000015099,-0.000000500],[0.000015023,-0.000000489],[0.000014946,-0.000000478],[0.000014870,-0.000000467],[0.000014793,-0.000000457],[0.000014717,-0.000000445],[0.000014640,-0.000000434],[0.000014564,-0.000000423],[0.000014487,-0.000000412],[0.000014410,-0.000000401],[0.000014333,-0.000000390],[0.000014256,-0.000000379],[0.000014179,-0.000000368],[0.000014101,-0.000000357],[0.000014024,-0.000000346],[0.000013946,-0.000000335],[0.000013868,-0.000000325],[0.000013789,-0.000000314],[0.000013710,-0.000000302],[0.000013630,-0.000000291],[0.000013550,-0.000000279],[0.000013468,-0.000000267],[0.000013386,-0.000000254],[0.000013303,-0.000000241],[0.000013219,-0.000000227],[0.000013133,-0.000000212],[0.000013047,-0.000000197],[0.000012958,-0.000000181],[0.000012869,-0.000000164],[0.000012779,-0.000000146],[0.000012688,-0.000000127],[0.000012595,-0.000000107],[0.000012502,-0.000000086],[0.000012408,-0.000000065],[0.000012313,-0.000000042],[0.000012218,-0.000000018],[0.000012123,0.000000007],[0.000012029,0.000000032],[0.000011935,0.000000059],[0.000011842,0.000000086],[0.000011751,0.000000114],[0.000011661,0.000000143],[0.000011573,0.000000172],[0.000011487,0.000000203],[0.000011403,0.000000235],[0.000011323,0.000000267],[0.000011245,0.000000300],[0.000011170,0.000000334],[0.000011100,0.000000366],[0.000011033,0.000000397],[0.000010970,0.000000427],[0.000010911,0.000000456],[0.000010854,0.000000483],[0.000010800,0.000000508],[0.000010748,0.000000531],[0.000010695,0.000000553],[0.000010643,0.000000572],[0.000010588,0.000000590],[0.000010533,0.000000606],[0.000010476,0.000000622],[0.000010417,0.000000638],[0.000010357,0.000000654],[0.000010295,0.000000670],[0.000010233,0.000000686],[0.000010170,0.000000703],[0.000010106,0.000000720],[0.000010041,0.000000737],[0.000009976,0.000000755],[0.000009911,0.000000772],[0.000009845,0.000000790],[0.000009779,0.000000807],[0.000009713,0.000000825],[0.000009647,0.000000842],[0.000009582,0.000000860],[0.000009516,0.000000878],[0.000009452,0.000000895],[0.000009387,0.000000913],[0.000009324,0.000000931],[0.000009261,0.000000949],[0.000009199,0.000000967],[0.000009139,0.000000985],[0.000009080,0.000001003],[0.000009022,0.000001021],[0.000008965,0.000001040],[0.000008909,0.000001058],[0.000008855,0.000001077],[0.000008801,0.000001095],[0.000008749,0.000001113],[0.000008697,0.000001131],[0.000008646,0.000001149],[0.000008596,0.000001166],[0.000008546,0.000001183],[0.000008497,0.000001199],[0.000008448,0.000001215],[0.000008399,0.000001230],[0.000008349,0.000001245],[0.000008300,0.000001258],[0.000008250,0.000001271],[0.000008200,0.000001283],[0.000008148,0.000001294],[0.000008097,0.000001304],[0.000008044,0.000001314],[0.000007991,0.000001323],[0.000007938,0.000001331],[0.000007884,0.000001340],[0.000007829,0.000001347],[0.000007773,0.000001355],[0.000007717,0.000001362],[0.000007660,0.000001368],[0.000007602,0.000001374],[0.000007543,0.000001380],[0.000007484,0.000001386],[0.000007423,0.000001391],[0.000007361,0.000001395],[0.000007299,0.000001400],[0.000007236,0.000001406],[0.000007174,0.000001412],[0.000007111,0.000001421],[0.000007048,0.000001430],[0.000006984,0.000001437],[0.000006921,0.000001442],[0.000006858,0.000001446],[0.000006796,0.000001451],[0.000006730,0.000001458],[0.000006663,0.000001467],[0.000006601,0.000001462],[0.000006542,0.000001458],[0.000006482,0.000001457],[0.000006423,0.000001456],[0.000006364,0.000001455],[0.000017107,-0.000000746],[0.000017030,-0.000000738],[0.000016952,-0.000000729],[0.000016875,-0.000000721],[0.000016797,-0.000000713],[0.000016720,-0.000000705],[0.000016642,-0.000000697],[0.000016565,-0.000000689],[0.000016487,-0.000000681],[0.000016410,-0.000000673],[0.000016333,-0.000000665],[0.000016256,-0.000000657],[0.000016178,-0.000000649],[0.000016101,-0.000000641],[0.000016024,-0.000000633],[0.000015947,-0.000000624],[0.000015871,-0.000000616],[0.000015794,-0.000000608],[0.000015717,-0.000000599],[0.000015641,-0.000000591],[0.000015565,-0.000000582],[0.000015489,-0.000000573],[0.000015413,-0.000000564],[0.000015337,-0.000000554],[0.000015261,-0.000000545],[0.000015185,-0.000000535],[0.000015109,-0.000000525],[0.000015033,-0.000000514],[0.000014958,-0.000000504],[0.000014882,-0.000000493],[0.000014806,-0.000000482],[0.000014731,-0.000000471],[0.000014655,-0.000000460],[0.000014579,-0.000000449],[0.000014503,-0.000000438],[0.000014427,-0.000000427],[0.000014351,-0.000000416],[0.000014275,-0.000000405],[0.000014199,-0.000000394],[0.000014122,-0.000000383],[0.000014046,-0.000000372],[0.000013969,-0.000000362],[0.000013892,-0.000000351],[0.000013814,-0.000000341],[0.000013736,-0.000000330],[0.000013658,-0.000000319],[0.000013579,-0.000000308],[0.000013498,-0.000000297],[0.000013417,-0.000000285],[0.000013335,-0.000000272],[0.000013252,-0.000000259],[0.000013167,-0.000000245],[0.000013081,-0.000000230],[0.000012994,-0.000000215],[0.000012905,-0.000000198],[0.000012815,-0.000000181],[0.000012723,-0.000000163],[0.000012630,-0.000000144],[0.000012537,-0.000000124],[0.000012442,-0.000000102],[0.000012347,-0.000000080],[0.000012252,-0.000000057],[0.000012157,-0.000000034],[0.000012062,-0.000000009],[0.000011968,0.000000017],[0.000011875,0.000000043],[0.000011783,0.000000070],[0.000011693,0.000000098],[0.000011605,0.000000127],[0.000011519,0.000000157],[0.000011436,0.000000188],[0.000011355,0.000000220],[0.000011276,0.000000254],[0.000011201,0.000000287],[0.000011131,0.000000321],[0.000011064,0.000000352],[0.000011003,0.000000383],[0.000010944,0.000000411],[0.000010890,0.000000438],[0.000010837,0.000000462],[0.000010786,0.000000485],[0.000010735,0.000000506],[0.000010685,0.000000525],[0.000010633,0.000000543],[0.000010578,0.000000558],[0.000010521,0.000000573],[0.000010462,0.000000588],[0.000010400,0.000000602],[0.000010337,0.000000618],[0.000010274,0.000000634],[0.000010210,0.000000651],[0.000010145,0.000000668],[0.000010080,0.000000685],[0.000010014,0.000000703],[0.000009947,0.000000720],[0.000009881,0.000000738],[0.000009813,0.000000756],[0.000009746,0.000000773],[0.000009680,0.000000791],[0.000009613,0.000000808],[0.000009547,0.000000826],[0.000009481,0.000000843],[0.000009415,0.000000861],[0.000009351,0.000000878],[0.000009287,0.000000895],[0.000009224,0.000000913],[0.000009163,0.000000930],[0.000009102,0.000000948],[0.000009044,0.000000965],[0.000008986,0.000000984],[0.000008930,0.000001002],[0.000008876,0.000001020],[0.000008822,0.000001039],[0.000008770,0.000001057],[0.000008719,0.000001075],[0.000008668,0.000001093],[0.000008618,0.000001111],[0.000008568,0.000001128],[0.000008519,0.000001145],[0.000008470,0.000001161],[0.000008422,0.000001176],[0.000008372,0.000001190],[0.000008323,0.000001204],[0.000008272,0.000001216],[0.000008221,0.000001228],[0.000008169,0.000001239],[0.000008117,0.000001249],[0.000008064,0.000001259],[0.000008010,0.000001268],[0.000007956,0.000001277],[0.000007901,0.000001285],[0.000007846,0.000001293],[0.000007790,0.000001301],[0.000007733,0.000001308],[0.000007675,0.000001315],[0.000007617,0.000001322],[0.000007557,0.000001329],[0.000007497,0.000001335],[0.000007436,0.000001341],[0.000007374,0.000001348],[0.000007312,0.000001354],[0.000007249,0.000001362],[0.000007186,0.000001370],[0.000007123,0.000001379],[0.000007060,0.000001388],[0.000006996,0.000001397],[0.000006931,0.000001405],[0.000006866,0.000001412],[0.000006801,0.000001417],[0.000006735,0.000001420],[0.000006671,0.000001418],[0.000006611,0.000001417],[0.000006553,0.000001418],[0.000006497,0.000001419],[0.000006441,0.000001419],[0.000006385,0.000001419],[0.000017104,-0.000000751],[0.000017028,-0.000000744],[0.000016951,-0.000000736],[0.000016874,-0.000000729],[0.000016797,-0.000000722],[0.000016719,-0.000000715],[0.000016642,-0.000000708],[0.000016565,-0.000000700],[0.000016488,-0.000000693],[0.000016411,-0.000000686],[0.000016335,-0.000000679],[0.000016258,-0.000000672],[0.000016181,-0.000000665],[0.000016104,-0.000000658],[0.000016028,-0.000000651],[0.000015952,-0.000000643],[0.000015875,-0.000000636],[0.000015799,-0.000000628],[0.000015723,-0.000000620],[0.000015647,-0.000000612],[0.000015572,-0.000000604],[0.000015496,-0.000000595],[0.000015420,-0.000000587],[0.000015345,-0.000000578],[0.000015270,-0.000000569],[0.000015195,-0.000000559],[0.000015120,-0.000000550],[0.000015045,-0.000000540],[0.000014970,-0.000000529],[0.000014895,-0.000000519],[0.000014820,-0.000000508],[0.000014745,-0.000000497],[0.000014670,-0.000000486],[0.000014595,-0.000000475],[0.000014520,-0.000000464],[0.000014445,-0.000000452],[0.000014369,-0.000000441],[0.000014294,-0.000000430],[0.000014219,-0.000000419],[0.000014143,-0.000000409],[0.000014067,-0.000000398],[0.000013991,-0.000000388],[0.000013915,-0.000000378],[0.000013839,-0.000000367],[0.000013762,-0.000000357],[0.000013685,-0.000000347],[0.000013607,-0.000000336],[0.000013528,-0.000000325],[0.000013448,-0.000000314],[0.000013367,-0.000000302],[0.000013284,-0.000000290],[0.000013201,-0.000000277],[0.000013115,-0.000000263],[0.000013028,-0.000000248],[0.000012940,-0.000000232],[0.000012850,-0.000000215],[0.000012758,-0.000000198],[0.000012665,-0.000000179],[0.000012572,-0.000000159],[0.000012477,-0.000000139],[0.000012381,-0.000000118],[0.000012286,-0.000000096],[0.000012190,-0.000000073],[0.000012095,-0.000000049],[0.000012001,-0.000000024],[0.000011908,0.000000001],[0.000011816,0.000000028],[0.000011726,0.000000055],[0.000011639,0.000000083],[0.000011553,0.000000112],[0.000011470,0.000000142],[0.000011389,0.000000173],[0.000011310,0.000000206],[0.000011235,0.000000241],[0.000011164,0.000000275],[0.000011098,0.000000308],[0.000011036,0.000000339],[0.000010980,0.000000366],[0.000010926,0.000000390],[0.000010874,0.000000414],[0.000010823,0.000000436],[0.000010774,0.000000458],[0.000010726,0.000000478],[0.000010677,0.000000496],[0.000010625,0.000000511],[0.000010567,0.000000525],[0.000010506,0.000000538],[0.000010442,0.000000551],[0.000010378,0.000000566],[0.000010314,0.000000582],[0.000010249,0.000000599],[0.000010184,0.000000616],[0.000010118,0.000000633],[0.000010051,0.000000651],[0.000009983,0.000000669],[0.000009915,0.000000687],[0.000009847,0.000000705],[0.000009779,0.000000723],[0.000009712,0.000000741],[0.000009644,0.000000758],[0.000009577,0.000000776],[0.000009510,0.000000793],[0.000009444,0.000000810],[0.000009378,0.000000827],[0.000009314,0.000000843],[0.000009250,0.000000859],[0.000009187,0.000000876],[0.000009126,0.000000893],[0.000009066,0.000000910],[0.000009008,0.000000927],[0.000008951,0.000000945],[0.000008897,0.000000964],[0.000008844,0.000000982],[0.000008792,0.000001001],[0.000008740,0.000001020],[0.000008690,0.000001038],[0.000008641,0.000001056],[0.000008592,0.000001074],[0.000008543,0.000001091],[0.000008494,0.000001107],[0.000008445,0.000001122],[0.000008396,0.000001137],[0.000008345,0.000001150],[0.000008295,0.000001162],[0.000008243,0.000001173],[0.000008190,0.000001184],[0.000008137,0.000001194],[0.000008084,0.000001204],[0.000008029,0.000001214],[0.000007975,0.000001222],[0.000007919,0.000001231],[0.000007863,0.000001240],[0.000007807,0.000001248],[0.000007749,0.000001256],[0.000007691,0.000001263],[0.000007632,0.000001271],[0.000007572,0.000001278],[0.000007511,0.000001285],[0.000007450,0.000001293],[0.000007388,0.000001301],[0.000007326,0.000001309],[0.000007263,0.000001318],[0.000007200,0.000001327],[0.000007137,0.000001337],[0.000007073,0.000001347],[0.000007008,0.000001357],[0.000006943,0.000001368],[0.000006876,0.000001378],[0.000006806,0.000001385],[0.000006739,0.000001387],[0.000006677,0.000001381],[0.000006621,0.000001379],[0.000006567,0.000001382],[0.000006514,0.000001383],[0.000006461,0.000001383],[0.000006408,0.000001383],[0.000017102,-0.000000756],[0.000017025,-0.000000749],[0.000016949,-0.000000743],[0.000016872,-0.000000737],[0.000016796,-0.000000730],[0.000016719,-0.000000724],[0.000016642,-0.000000718],[0.000016566,-0.000000712],[0.000016489,-0.000000706],[0.000016413,-0.000000700],[0.000016337,-0.000000693],[0.000016260,-0.000000687],[0.000016184,-0.000000681],[0.000016108,-0.000000674],[0.000016032,-0.000000668],[0.000015956,-0.000000661],[0.000015880,-0.000000655],[0.000015805,-0.000000648],[0.000015729,-0.000000640],[0.000015654,-0.000000633],[0.000015579,-0.000000626],[0.000015503,-0.000000618],[0.000015429,-0.000000610],[0.000015354,-0.000000601],[0.000015279,-0.000000593],[0.000015205,-0.000000584],[0.000015130,-0.000000574],[0.000015056,-0.000000565],[0.000014982,-0.000000555],[0.000014907,-0.000000545],[0.000014833,-0.000000534],[0.000014759,-0.000000523],[0.000014685,-0.000000512],[0.000014611,-0.000000501],[0.000014536,-0.000000490],[0.000014462,-0.000000478],[0.000014388,-0.000000467],[0.000014313,-0.000000456],[0.000014238,-0.000000444],[0.000014164,-0.000000434],[0.000014089,-0.000000423],[0.000014014,-0.000000413],[0.000013938,-0.000000403],[0.000013863,-0.000000393],[0.000013787,-0.000000383],[0.000013711,-0.000000373],[0.000013634,-0.000000364],[0.000013556,-0.000000353],[0.000013478,-0.000000343],[0.000013398,-0.000000332],[0.000013316,-0.000000320],[0.000013234,-0.000000307],[0.000013149,-0.000000294],[0.000013063,-0.000000280],[0.000012975,-0.000000265],[0.000012885,-0.000000248],[0.000012793,-0.000000231],[0.000012700,-0.000000213],[0.000012606,-0.000000193],[0.000012511,-0.000000174],[0.000012415,-0.000000153],[0.000012319,-0.000000132],[0.000012223,-0.000000110],[0.000012128,-0.000000088],[0.000012034,-0.000000064],[0.000011941,-0.000000040],[0.000011850,-0.000000014],[0.000011761,0.000000013],[0.000011674,0.000000040],[0.000011588,0.000000069],[0.000011506,0.000000097],[0.000011425,0.000000127],[0.000011347,0.000000158],[0.000011272,0.000000192],[0.000011200,0.000000228],[0.000011134,0.000000264],[0.000011073,0.000000295],[0.000011017,0.000000320],[0.000010963,0.000000342],[0.000010911,0.000000364],[0.000010860,0.000000386],[0.000010811,0.000000409],[0.000010765,0.000000429],[0.000010721,0.000000448],[0.000010672,0.000000465],[0.000010614,0.000000478],[0.000010549,0.000000488],[0.000010483,0.000000500],[0.000010418,0.000000515],[0.000010354,0.000000531],[0.000010288,0.000000548],[0.000010222,0.000000565],[0.000010155,0.000000582],[0.000010087,0.000000600],[0.000010018,0.000000618],[0.000009949,0.000000636],[0.000009880,0.000000655],[0.000009812,0.000000673],[0.000009743,0.000000692],[0.000009675,0.000000709],[0.000009607,0.000000727],[0.000009540,0.000000744],[0.000009473,0.000000760],[0.000009406,0.000000776],[0.000009341,0.000000792],[0.000009276,0.000000807],[0.000009212,0.000000823],[0.000009149,0.000000838],[0.000009089,0.000000855],[0.000009030,0.000000871],[0.000008973,0.000000889],[0.000008918,0.000000907],[0.000008865,0.000000926],[0.000008813,0.000000945],[0.000008763,0.000000964],[0.000008713,0.000000983],[0.000008664,0.000001002],[0.000008616,0.000001020],[0.000008568,0.000001038],[0.000008519,0.000001054],[0.000008470,0.000001069],[0.000008420,0.000001083],[0.000008369,0.000001096],[0.000008317,0.000001108],[0.000008265,0.000001119],[0.000008211,0.000001130],[0.000008158,0.000001140],[0.000008103,0.000001150],[0.000008049,0.000001159],[0.000007994,0.000001169],[0.000007938,0.000001178],[0.000007882,0.000001187],[0.000007825,0.000001195],[0.000007767,0.000001204],[0.000007708,0.000001212],[0.000007648,0.000001220],[0.000007588,0.000001228],[0.000007527,0.000001236],[0.000007466,0.000001245],[0.000007403,0.000001254],[0.000007341,0.000001264],[0.000007279,0.000001274],[0.000007215,0.000001284],[0.000007152,0.000001294],[0.000007088,0.000001304],[0.000007022,0.000001317],[0.000006956,0.000001330],[0.000006889,0.000001342],[0.000006819,0.000001353],[0.000006748,0.000001361],[0.000006685,0.000001360],[0.000006635,0.000001354],[0.000006586,0.000001350],[0.000006535,0.000001349],[0.000006483,0.000001347],[0.000006430,0.000001346],[0.000017099,-0.000000760],[0.000017023,-0.000000754],[0.000016947,-0.000000749],[0.000016871,-0.000000744],[0.000016795,-0.000000738],[0.000016719,-0.000000733],[0.000016643,-0.000000728],[0.000016566,-0.000000723],[0.000016490,-0.000000717],[0.000016414,-0.000000712],[0.000016338,-0.000000707],[0.000016263,-0.000000702],[0.000016187,-0.000000696],[0.000016111,-0.000000691],[0.000016036,-0.000000685],[0.000015960,-0.000000679],[0.000015885,-0.000000673],[0.000015810,-0.000000667],[0.000015735,-0.000000660],[0.000015660,-0.000000654],[0.000015586,-0.000000647],[0.000015511,-0.000000640],[0.000015437,-0.000000632],[0.000015363,-0.000000624],[0.000015289,-0.000000616],[0.000015215,-0.000000608],[0.000015141,-0.000000599],[0.000015067,-0.000000590],[0.000014994,-0.000000580],[0.000014920,-0.000000570],[0.000014847,-0.000000560],[0.000014773,-0.000000549],[0.000014700,-0.000000538],[0.000014626,-0.000000527],[0.000014553,-0.000000515],[0.000014479,-0.000000504],[0.000014406,-0.000000492],[0.000014332,-0.000000481],[0.000014258,-0.000000469],[0.000014184,-0.000000458],[0.000014110,-0.000000448],[0.000014036,-0.000000437],[0.000013961,-0.000000428],[0.000013887,-0.000000418],[0.000013812,-0.000000409],[0.000013737,-0.000000399],[0.000013661,-0.000000390],[0.000013585,-0.000000380],[0.000013507,-0.000000370],[0.000013428,-0.000000360],[0.000013348,-0.000000349],[0.000013266,-0.000000337],[0.000013182,-0.000000324],[0.000013096,-0.000000311],[0.000013009,-0.000000296],[0.000012919,-0.000000280],[0.000012827,-0.000000263],[0.000012734,-0.000000245],[0.000012639,-0.000000226],[0.000012543,-0.000000207],[0.000012447,-0.000000187],[0.000012351,-0.000000167],[0.000012256,-0.000000147],[0.000012161,-0.000000125],[0.000012067,-0.000000103],[0.000011975,-0.000000080],[0.000011885,-0.000000055],[0.000011797,-0.000000029],[0.000011710,-0.000000002],[0.000011625,0.000000027],[0.000011543,0.000000055],[0.000011463,0.000000083],[0.000011387,0.000000111],[0.000011313,0.000000141],[0.000011243,0.000000176],[0.000011176,0.000000217],[0.000011115,0.000000248],[0.000011058,0.000000271],[0.000011002,0.000000291],[0.000010948,0.000000311],[0.000010896,0.000000334],[0.000010846,0.000000358],[0.000010802,0.000000379],[0.000010761,0.000000399],[0.000010717,0.000000419],[0.000010661,0.000000433],[0.000010590,0.000000440],[0.000010523,0.000000451],[0.000010458,0.000000466],[0.000010393,0.000000481],[0.000010327,0.000000497],[0.000010259,0.000000514],[0.000010191,0.000000531],[0.000010121,0.000000549],[0.000010052,0.000000568],[0.000009982,0.000000587],[0.000009913,0.000000606],[0.000009844,0.000000625],[0.000009775,0.000000644],[0.000009706,0.000000662],[0.000009638,0.000000680],[0.000009570,0.000000697],[0.000009502,0.000000712],[0.000009435,0.000000728],[0.000009368,0.000000742],[0.000009302,0.000000756],[0.000009237,0.000000771],[0.000009174,0.000000785],[0.000009112,0.000000800],[0.000009052,0.000000815],[0.000008994,0.000000832],[0.000008939,0.000000850],[0.000008886,0.000000869],[0.000008835,0.000000889],[0.000008785,0.000000909],[0.000008737,0.000000929],[0.000008689,0.000000949],[0.000008641,0.000000968],[0.000008593,0.000000986],[0.000008545,0.000001002],[0.000008496,0.000001017],[0.000008445,0.000001030],[0.000008393,0.000001043],[0.000008340,0.000001054],[0.000008287,0.000001065],[0.000008233,0.000001076],[0.000008178,0.000001086],[0.000008124,0.000001096],[0.000008069,0.000001106],[0.000008014,0.000001116],[0.000007958,0.000001125],[0.000007901,0.000001134],[0.000007843,0.000001143],[0.000007785,0.000001152],[0.000007725,0.000001161],[0.000007665,0.000001170],[0.000007605,0.000001179],[0.000007544,0.000001188],[0.000007482,0.000001198],[0.000007420,0.000001207],[0.000007357,0.000001218],[0.000007295,0.000001228],[0.000007232,0.000001239],[0.000007168,0.000001249],[0.000007104,0.000001260],[0.000007037,0.000001274],[0.000006970,0.000001290],[0.000006905,0.000001304],[0.000006842,0.000001317],[0.000006777,0.000001329],[0.000006712,0.000001332],[0.000006661,0.000001325],[0.000006611,0.000001319],[0.000006559,0.000001315],[0.000006506,0.000001312],[0.000006453,0.000001310],[0.000017096,-0.000000764],[0.000017021,-0.000000759],[0.000016945,-0.000000754],[0.000016869,-0.000000750],[0.000016794,-0.000000746],[0.000016718,-0.000000742],[0.000016643,-0.000000737],[0.000016567,-0.000000733],[0.000016492,-0.000000729],[0.000016416,-0.000000724],[0.000016341,-0.000000720],[0.000016266,-0.000000716],[0.000016190,-0.000000711],[0.000016115,-0.000000706],[0.000016040,-0.000000701],[0.000015965,-0.000000696],[0.000015890,-0.000000691],[0.000015816,-0.000000686],[0.000015741,-0.000000680],[0.000015667,-0.000000674],[0.000015593,-0.000000668],[0.000015519,-0.000000661],[0.000015445,-0.000000654],[0.000015372,-0.000000647],[0.000015298,-0.000000639],[0.000015225,-0.000000631],[0.000015152,-0.000000623],[0.000015079,-0.000000614],[0.000015006,-0.000000605],[0.000014933,-0.000000595],[0.000014860,-0.000000585],[0.000014788,-0.000000575],[0.000014715,-0.000000564],[0.000014642,-0.000000553],[0.000014570,-0.000000541],[0.000014497,-0.000000529],[0.000014424,-0.000000518],[0.000014351,-0.000000506],[0.000014278,-0.000000494],[0.000014204,-0.000000483],[0.000014131,-0.000000472],[0.000014057,-0.000000461],[0.000013984,-0.000000451],[0.000013910,-0.000000442],[0.000013836,-0.000000433],[0.000013762,-0.000000424],[0.000013688,-0.000000415],[0.000013612,-0.000000406],[0.000013535,-0.000000397],[0.000013457,-0.000000388],[0.000013378,-0.000000377],[0.000013297,-0.000000366],[0.000013214,-0.000000354],[0.000013129,-0.000000340],[0.000013042,-0.000000326],[0.000012952,-0.000000310],[0.000012860,-0.000000293],[0.000012766,-0.000000275],[0.000012671,-0.000000257],[0.000012575,-0.000000238],[0.000012479,-0.000000220],[0.000012383,-0.000000201],[0.000012288,-0.000000182],[0.000012194,-0.000000162],[0.000012101,-0.000000141],[0.000012011,-0.000000119],[0.000011922,-0.000000095],[0.000011835,-0.000000070],[0.000011748,-0.000000043],[0.000011664,-0.000000014],[0.000011582,0.000000015],[0.000011503,0.000000042],[0.000011429,0.000000067],[0.000011360,0.000000089],[0.000011294,0.000000119],[0.000011228,0.000000158],[0.000011163,0.000000193],[0.000011100,0.000000220],[0.000011041,0.000000241],[0.000010985,0.000000259],[0.000010933,0.000000281],[0.000010882,0.000000304],[0.000010838,0.000000325],[0.000010798,0.000000348],[0.000010754,0.000000370],[0.000010703,0.000000389],[0.000010637,0.000000399],[0.000010567,0.000000407],[0.000010499,0.000000418],[0.000010432,0.000000432],[0.000010364,0.000000447],[0.000010295,0.000000463],[0.000010225,0.000000480],[0.000010155,0.000000499],[0.000010085,0.000000519],[0.000010015,0.000000539],[0.000009945,0.000000559],[0.000009875,0.000000579],[0.000009806,0.000000598],[0.000009737,0.000000617],[0.000009668,0.000000634],[0.000009600,0.000000651],[0.000009531,0.000000666],[0.000009464,0.000000680],[0.000009396,0.000000694],[0.000009329,0.000000707],[0.000009264,0.000000719],[0.000009199,0.000000732],[0.000009136,0.000000746],[0.000009075,0.000000760],[0.000009016,0.000000776],[0.000008960,0.000000793],[0.000008907,0.000000812],[0.000008856,0.000000833],[0.000008808,0.000000854],[0.000008761,0.000000875],[0.000008715,0.000000896],[0.000008668,0.000000916],[0.000008621,0.000000934],[0.000008572,0.000000950],[0.000008522,0.000000964],[0.000008470,0.000000977],[0.000008417,0.000000989],[0.000008363,0.000001000],[0.000008309,0.000001011],[0.000008254,0.000001022],[0.000008200,0.000001032],[0.000008145,0.000001043],[0.000008090,0.000001053],[0.000008034,0.000001063],[0.000007978,0.000001073],[0.000007921,0.000001083],[0.000007863,0.000001092],[0.000007804,0.000001102],[0.000007744,0.000001111],[0.000007683,0.000001120],[0.000007622,0.000001130],[0.000007561,0.000001140],[0.000007499,0.000001150],[0.000007437,0.000001161],[0.000007375,0.000001171],[0.000007312,0.000001182],[0.000007249,0.000001193],[0.000007185,0.000001204],[0.000007121,0.000001216],[0.000007052,0.000001231],[0.000006985,0.000001248],[0.000006924,0.000001262],[0.000006869,0.000001275],[0.000006821,0.000001284],[0.000006760,0.000001289],[0.000006698,0.000001287],[0.000006640,0.000001283],[0.000006585,0.000001280],[0.000006530,0.000001277],[0.000006475,0.000001275],[0.000017093,-0.000000766],[0.000017018,-0.000000763],[0.000016943,-0.000000759],[0.000016868,-0.000000756],[0.000016793,-0.000000753],[0.000016718,-0.000000749],[0.000016643,-0.000000746],[0.000016568,-0.000000743],[0.000016493,-0.000000740],[0.000016418,-0.000000736],[0.000016343,-0.000000733],[0.000016268,-0.000000729],[0.000016194,-0.000000726],[0.000016119,-0.000000722],[0.000016045,-0.000000718],[0.000015970,-0.000000713],[0.000015896,-0.000000709],[0.000015822,-0.000000704],[0.000015748,-0.000000699],[0.000015674,-0.000000694],[0.000015601,-0.000000688],[0.000015527,-0.000000682],[0.000015454,-0.000000676],[0.000015381,-0.000000669],[0.000015308,-0.000000662],[0.000015236,-0.000000655],[0.000015163,-0.000000647],[0.000015091,-0.000000638],[0.000015019,-0.000000630],[0.000014946,-0.000000620],[0.000014874,-0.000000611],[0.000014802,-0.000000600],[0.000014730,-0.000000590],[0.000014658,-0.000000579],[0.000014586,-0.000000567],[0.000014514,-0.000000555],[0.000014442,-0.000000543],[0.000014370,-0.000000531],[0.000014297,-0.000000519],[0.000014225,-0.000000507],[0.000014152,-0.000000496],[0.000014079,-0.000000485],[0.000014006,-0.000000475],[0.000013933,-0.000000465],[0.000013860,-0.000000456],[0.000013787,-0.000000448],[0.000013713,-0.000000439],[0.000013639,-0.000000431],[0.000013563,-0.000000423],[0.000013486,-0.000000414],[0.000013407,-0.000000404],[0.000013327,-0.000000394],[0.000013245,-0.000000382],[0.000013160,-0.000000368],[0.000013073,-0.000000354],[0.000012985,-0.000000338],[0.000012893,-0.000000322],[0.000012798,-0.000000304],[0.000012701,-0.000000286],[0.000012604,-0.000000268],[0.000012507,-0.000000251],[0.000012413,-0.000000233],[0.000012319,-0.000000215],[0.000012227,-0.000000197],[0.000012136,-0.000000177],[0.000012048,-0.000000156],[0.000011960,-0.000000134],[0.000011874,-0.000000110],[0.000011788,-0.000000083],[0.000011704,-0.000000054],[0.000011623,-0.000000024],[0.000011546,0.000000005],[0.000011474,0.000000029],[0.000011413,0.000000044],[0.000011353,0.000000067],[0.000011285,0.000000104],[0.000011211,0.000000140],[0.000011141,0.000000170],[0.000011077,0.000000193],[0.000011020,0.000000212],[0.000010968,0.000000232],[0.000010919,0.000000257],[0.000010874,0.000000278],[0.000010832,0.000000299],[0.000010787,0.000000319],[0.000010735,0.000000338],[0.000010674,0.000000351],[0.000010607,0.000000361],[0.000010538,0.000000371],[0.000010469,0.000000382],[0.000010399,0.000000396],[0.000010328,0.000000412],[0.000010258,0.000000430],[0.000010187,0.000000449],[0.000010117,0.000000470],[0.000010046,0.000000491],[0.000009976,0.000000512],[0.000009907,0.000000533],[0.000009838,0.000000554],[0.000009768,0.000000573],[0.000009699,0.000000590],[0.000009630,0.000000607],[0.000009561,0.000000621],[0.000009493,0.000000634],[0.000009425,0.000000647],[0.000009358,0.000000658],[0.000009291,0.000000669],[0.000009226,0.000000681],[0.000009161,0.000000693],[0.000009099,0.000000706],[0.000009039,0.000000720],[0.000008981,0.000000737],[0.000008928,0.000000755],[0.000008878,0.000000776],[0.000008832,0.000000799],[0.000008787,0.000000822],[0.000008743,0.000000845],[0.000008697,0.000000865],[0.000008650,0.000000883],[0.000008600,0.000000899],[0.000008548,0.000000912],[0.000008495,0.000000924],[0.000008440,0.000000935],[0.000008385,0.000000946],[0.000008331,0.000000957],[0.000008276,0.000000968],[0.000008222,0.000000979],[0.000008167,0.000000990],[0.000008112,0.000001000],[0.000008056,0.000001011],[0.000007999,0.000001021],[0.000007941,0.000001031],[0.000007883,0.000001041],[0.000007823,0.000001051],[0.000007763,0.000001061],[0.000007702,0.000001071],[0.000007641,0.000001082],[0.000007579,0.000001092],[0.000007517,0.000001103],[0.000007455,0.000001114],[0.000007392,0.000001125],[0.000007330,0.000001136],[0.000007266,0.000001148],[0.000007202,0.000001159],[0.000007137,0.000001173],[0.000007069,0.000001188],[0.000007003,0.000001204],[0.000006944,0.000001217],[0.000006890,0.000001227],[0.000006837,0.000001234],[0.000006792,0.000001240],[0.000006732,0.000001243],[0.000006671,0.000001244],[0.000006612,0.000001243],[0.000006555,0.000001242],[0.000006498,0.000001241],[0.000017090,-0.000000768],[0.000017015,-0.000000766],[0.000016941,-0.000000764],[0.000016867,-0.000000761],[0.000016792,-0.000000759],[0.000016718,-0.000000757],[0.000016643,-0.000000754],[0.000016569,-0.000000752],[0.000016495,-0.000000750],[0.000016420,-0.000000747],[0.000016346,-0.000000745],[0.000016272,-0.000000742],[0.000016198,-0.000000739],[0.000016124,-0.000000737],[0.000016050,-0.000000733],[0.000015976,-0.000000730],[0.000015902,-0.000000726],[0.000015828,-0.000000722],[0.000015755,-0.000000718],[0.000015682,-0.000000713],[0.000015609,-0.000000708],[0.000015536,-0.000000703],[0.000015463,-0.000000697],[0.000015391,-0.000000691],[0.000015319,-0.000000685],[0.000015246,-0.000000678],[0.000015175,-0.000000670],[0.000015103,-0.000000663],[0.000015031,-0.000000654],[0.000014960,-0.000000645],[0.000014888,-0.000000636],[0.000014817,-0.000000626],[0.000014746,-0.000000615],[0.000014674,-0.000000605],[0.000014603,-0.000000593],[0.000014532,-0.000000581],[0.000014460,-0.000000569],[0.000014389,-0.000000556],[0.000014317,-0.000000544],[0.000014245,-0.000000532],[0.000014173,-0.000000520],[0.000014101,-0.000000508],[0.000014028,-0.000000498],[0.000013956,-0.000000488],[0.000013883,-0.000000479],[0.000013810,-0.000000470],[0.000013738,-0.000000463],[0.000013665,-0.000000455],[0.000013590,-0.000000448],[0.000013514,-0.000000440],[0.000013436,-0.000000431],[0.000013355,-0.000000420],[0.000013273,-0.000000408],[0.000013189,-0.000000395],[0.000013103,-0.000000380],[0.000013015,-0.000000364],[0.000012924,-0.000000348],[0.000012828,-0.000000331],[0.000012730,-0.000000314],[0.000012631,-0.000000297],[0.000012534,-0.000000280],[0.000012440,-0.000000264],[0.000012350,-0.000000248],[0.000012261,-0.000000230],[0.000012173,-0.000000211],[0.000012086,-0.000000191],[0.000012000,-0.000000170],[0.000011914,-0.000000148],[0.000011829,-0.000000122],[0.000011746,-0.000000093],[0.000011666,-0.000000062],[0.000011590,-0.000000033],[0.000011523,-0.000000010],[0.000011467,0.000000008],[0.000011414,0.000000029],[0.000011335,0.000000059],[0.000011253,0.000000092],[0.000011178,0.000000122],[0.000011110,0.000000149],[0.000011051,0.000000172],[0.000011000,0.000000192],[0.000010955,0.000000213],[0.000010910,0.000000232],[0.000010864,0.000000250],[0.000010817,0.000000268],[0.000010765,0.000000287],[0.000010707,0.000000302],[0.000010642,0.000000313],[0.000010573,0.000000322],[0.000010502,0.000000332],[0.000010431,0.000000345],[0.000010359,0.000000361],[0.000010288,0.000000380],[0.000010218,0.000000401],[0.000010147,0.000000422],[0.000010077,0.000000445],[0.000010008,0.000000467],[0.000009938,0.000000489],[0.000009869,0.000000510],[0.000009799,0.000000530],[0.000009730,0.000000548],[0.000009661,0.000000564],[0.000009592,0.000000578],[0.000009522,0.000000590],[0.000009454,0.000000601],[0.000009386,0.000000611],[0.000009320,0.000000620],[0.000009254,0.000000630],[0.000009189,0.000000641],[0.000009125,0.000000652],[0.000009063,0.000000666],[0.000009004,0.000000681],[0.000008950,0.000000699],[0.000008900,0.000000720],[0.000008855,0.000000744],[0.000008814,0.000000769],[0.000008772,0.000000794],[0.000008728,0.000000815],[0.000008681,0.000000833],[0.000008629,0.000000846],[0.000008575,0.000000858],[0.000008519,0.000000869],[0.000008463,0.000000880],[0.000008408,0.000000892],[0.000008353,0.000000903],[0.000008299,0.000000915],[0.000008245,0.000000926],[0.000008190,0.000000937],[0.000008135,0.000000948],[0.000008078,0.000000959],[0.000008021,0.000000970],[0.000007962,0.000000981],[0.000007903,0.000000991],[0.000007843,0.000001002],[0.000007782,0.000001012],[0.000007721,0.000001023],[0.000007660,0.000001034],[0.000007598,0.000001044],[0.000007536,0.000001056],[0.000007474,0.000001067],[0.000007411,0.000001079],[0.000007348,0.000001090],[0.000007284,0.000001102],[0.000007220,0.000001115],[0.000007155,0.000001129],[0.000007089,0.000001143],[0.000007026,0.000001157],[0.000006968,0.000001168],[0.000006913,0.000001177],[0.000006861,0.000001184],[0.000006813,0.000001191],[0.000006758,0.000001197],[0.000006699,0.000001201],[0.000006639,0.000001204],[0.000006580,0.000001206],[0.000006522,0.000001207],[0.000017086,-0.000000770],[0.000017013,-0.000000768],[0.000016939,-0.000000767],[0.000016865,-0.000000766],[0.000016791,-0.000000765],[0.000016718,-0.000000763],[0.000016644,-0.000000762],[0.000016570,-0.000000761],[0.000016496,-0.000000760],[0.000016422,-0.000000758],[0.000016349,-0.000000757],[0.000016275,-0.000000755],[0.000016202,-0.000000753],[0.000016128,-0.000000751],[0.000016055,-0.000000749],[0.000015982,-0.000000746],[0.000015908,-0.000000743],[0.000015835,-0.000000740],[0.000015763,-0.000000736],[0.000015690,-0.000000732],[0.000015617,-0.000000728],[0.000015545,-0.000000723],[0.000015473,-0.000000718],[0.000015401,-0.000000713],[0.000015329,-0.000000707],[0.000015258,-0.000000701],[0.000015186,-0.000000694],[0.000015115,-0.000000686],[0.000015044,-0.000000678],[0.000014973,-0.000000670],[0.000014903,-0.000000661],[0.000014832,-0.000000651],[0.000014761,-0.000000641],[0.000014691,-0.000000630],[0.000014620,-0.000000619],[0.000014549,-0.000000607],[0.000014479,-0.000000595],[0.000014408,-0.000000582],[0.000014337,-0.000000569],[0.000014266,-0.000000556],[0.000014194,-0.000000544],[0.000014123,-0.000000532],[0.000014051,-0.000000520],[0.000013978,-0.000000510],[0.000013906,-0.000000500],[0.000013833,-0.000000492],[0.000013761,-0.000000485],[0.000013689,-0.000000478],[0.000013616,-0.000000471],[0.000013540,-0.000000464],[0.000013463,-0.000000455],[0.000013382,-0.000000445],[0.000013299,-0.000000433],[0.000013215,-0.000000419],[0.000013129,-0.000000404],[0.000013042,-0.000000388],[0.000012952,-0.000000371],[0.000012857,-0.000000355],[0.000012756,-0.000000340],[0.000012656,-0.000000325],[0.000012559,-0.000000309],[0.000012466,-0.000000292],[0.000012380,-0.000000277],[0.000012298,-0.000000262],[0.000012215,-0.000000245],[0.000012128,-0.000000225],[0.000012040,-0.000000203],[0.000011954,-0.000000182],[0.000011871,-0.000000158],[0.000011789,-0.000000129],[0.000011711,-0.000000100],[0.000011636,-0.000000071],[0.000011568,-0.000000047],[0.000011507,-0.000000026],[0.000011443,-0.000000005],[0.000011367,0.000000021],[0.000011286,0.000000050],[0.000011211,0.000000078],[0.000011143,0.000000105],[0.000011083,0.000000130],[0.000011036,0.000000147],[0.000010995,0.000000163],[0.000010948,0.000000182],[0.000010894,0.000000200],[0.000010844,0.000000220],[0.000010794,0.000000240],[0.000010737,0.000000254],[0.000010673,0.000000263],[0.000010603,0.000000270],[0.000010531,0.000000279],[0.000010458,0.000000292],[0.000010386,0.000000310],[0.000010316,0.000000330],[0.000010246,0.000000353],[0.000010177,0.000000376],[0.000010108,0.000000400],[0.000010039,0.000000423],[0.000009970,0.000000446],[0.000009900,0.000000468],[0.000009830,0.000000489],[0.000009760,0.000000507],[0.000009691,0.000000522],[0.000009622,0.000000535],[0.000009552,0.000000546],[0.000009484,0.000000556],[0.000009416,0.000000565],[0.000009349,0.000000572],[0.000009283,0.000000581],[0.000009218,0.000000590],[0.000009154,0.000000601],[0.000009091,0.000000613],[0.000009030,0.000000627],[0.000008974,0.000000643],[0.000008923,0.000000663],[0.000008879,0.000000688],[0.000008841,0.000000716],[0.000008803,0.000000744],[0.000008761,0.000000766],[0.000008712,0.000000781],[0.000008657,0.000000792],[0.000008600,0.000000803],[0.000008542,0.000000814],[0.000008485,0.000000825],[0.000008430,0.000000838],[0.000008376,0.000000850],[0.000008323,0.000000862],[0.000008269,0.000000874],[0.000008214,0.000000886],[0.000008158,0.000000897],[0.000008101,0.000000908],[0.000008043,0.000000920],[0.000007984,0.000000931],[0.000007924,0.000000942],[0.000007864,0.000000953],[0.000007803,0.000000963],[0.000007741,0.000000975],[0.000007679,0.000000986],[0.000007617,0.000000997],[0.000007555,0.000001009],[0.000007493,0.000001021],[0.000007430,0.000001033],[0.000007367,0.000001045],[0.000007303,0.000001058],[0.000007239,0.000001071],[0.000007175,0.000001084],[0.000007112,0.000001097],[0.000007051,0.000001108],[0.000006993,0.000001118],[0.000006939,0.000001126],[0.000006886,0.000001133],[0.000006834,0.000001141],[0.000006780,0.000001149],[0.000006723,0.000001157],[0.000006664,0.000001163],[0.000006605,0.000001168],[0.000006545,0.000001173],[0.000017082,-0.000000771],[0.000017009,-0.000000770],[0.000016936,-0.000000770],[0.000016863,-0.000000770],[0.000016790,-0.000000770],[0.000016717,-0.000000770],[0.000016644,-0.000000769],[0.000016571,-0.000000769],[0.000016498,-0.000000769],[0.000016425,-0.000000768],[0.000016352,-0.000000768],[0.000016279,-0.000000767],[0.000016206,-0.000000766],[0.000016133,-0.000000765],[0.000016060,-0.000000763],[0.000015988,-0.000000762],[0.000015915,-0.000000759],[0.000015843,-0.000000757],[0.000015770,-0.000000754],[0.000015698,-0.000000751],[0.000015626,-0.000000747],[0.000015554,-0.000000743],[0.000015483,-0.000000739],[0.000015411,-0.000000734],[0.000015340,-0.000000729],[0.000015269,-0.000000723],[0.000015198,-0.000000716],[0.000015128,-0.000000710],[0.000015057,-0.000000702],[0.000014987,-0.000000694],[0.000014917,-0.000000686],[0.000014847,-0.000000677],[0.000014777,-0.000000667],[0.000014707,-0.000000657],[0.000014637,-0.000000645],[0.000014567,-0.000000634],[0.000014497,-0.000000621],[0.000014427,-0.000000608],[0.000014356,-0.000000595],[0.000014286,-0.000000582],[0.000014216,-0.000000568],[0.000014145,-0.000000555],[0.000014073,-0.000000543],[0.000014001,-0.000000532],[0.000013929,-0.000000522],[0.000013856,-0.000000513],[0.000013784,-0.000000506],[0.000013712,-0.000000499],[0.000013639,-0.000000493],[0.000013565,-0.000000487],[0.000013488,-0.000000479],[0.000013407,-0.000000468],[0.000013323,-0.000000456],[0.000013238,-0.000000442],[0.000013152,-0.000000425],[0.000013065,-0.000000408],[0.000012976,-0.000000392],[0.000012880,-0.000000378],[0.000012780,-0.000000365],[0.000012681,-0.000000353],[0.000012583,-0.000000338],[0.000012490,-0.000000320],[0.000012406,-0.000000304],[0.000012335,-0.000000292],[0.000012262,-0.000000280],[0.000012172,-0.000000256],[0.000012080,-0.000000231],[0.000011993,-0.000000209],[0.000011911,-0.000000188],[0.000011832,-0.000000163],[0.000011756,-0.000000137],[0.000011682,-0.000000109],[0.000011610,-0.000000082],[0.000011542,-0.000000061],[0.000011470,-0.000000039],[0.000011392,-0.000000016],[0.000011314,0.000000009],[0.000011243,0.000000033],[0.000011179,0.000000056],[0.000011125,0.000000075],[0.000011083,0.000000086],[0.000011041,0.000000097],[0.000010986,0.000000119],[0.000010921,0.000000145],[0.000010870,0.000000171],[0.000010823,0.000000194],[0.000010765,0.000000204],[0.000010699,0.000000209],[0.000010627,0.000000215],[0.000010554,0.000000226],[0.000010481,0.000000241],[0.000010409,0.000000260],[0.000010340,0.000000282],[0.000010273,0.000000305],[0.000010206,0.000000330],[0.000010139,0.000000355],[0.000010071,0.000000380],[0.000010002,0.000000405],[0.000009931,0.000000428],[0.000009861,0.000000448],[0.000009791,0.000000466],[0.000009721,0.000000481],[0.000009651,0.000000493],[0.000009583,0.000000504],[0.000009514,0.000000512],[0.000009447,0.000000519],[0.000009380,0.000000526],[0.000009314,0.000000533],[0.000009249,0.000000541],[0.000009185,0.000000551],[0.000009122,0.000000562],[0.000009061,0.000000575],[0.000009002,0.000000591],[0.000008948,0.000000609],[0.000008904,0.000000633],[0.000008869,0.000000663],[0.000008835,0.000000692],[0.000008795,0.000000714],[0.000008743,0.000000725],[0.000008684,0.000000735],[0.000008623,0.000000746],[0.000008564,0.000000758],[0.000008507,0.000000771],[0.000008453,0.000000785],[0.000008401,0.000000798],[0.000008348,0.000000810],[0.000008294,0.000000822],[0.000008239,0.000000834],[0.000008183,0.000000846],[0.000008125,0.000000858],[0.000008066,0.000000870],[0.000008006,0.000000881],[0.000007945,0.000000893],[0.000007884,0.000000904],[0.000007823,0.000000915],[0.000007761,0.000000926],[0.000007700,0.000000938],[0.000007638,0.000000950],[0.000007576,0.000000962],[0.000007513,0.000000974],[0.000007450,0.000000987],[0.000007387,0.000001000],[0.000007323,0.000001013],[0.000007260,0.000001026],[0.000007198,0.000001038],[0.000007136,0.000001050],[0.000007076,0.000001060],[0.000007019,0.000001069],[0.000006963,0.000001077],[0.000006909,0.000001084],[0.000006855,0.000001094],[0.000006800,0.000001104],[0.000006744,0.000001113],[0.000006687,0.000001122],[0.000006628,0.000001130],[0.000006569,0.000001137],[0.000017078,-0.000000771],[0.000017006,-0.000000772],[0.000016934,-0.000000773],[0.000016861,-0.000000774],[0.000016789,-0.000000774],[0.000016717,-0.000000775],[0.000016644,-0.000000776],[0.000016572,-0.000000777],[0.000016500,-0.000000778],[0.000016428,-0.000000778],[0.000016355,-0.000000779],[0.000016283,-0.000000779],[0.000016211,-0.000000779],[0.000016139,-0.000000778],[0.000016066,-0.000000778],[0.000015994,-0.000000777],[0.000015922,-0.000000776],[0.000015851,-0.000000774],[0.000015779,-0.000000772],[0.000015707,-0.000000769],[0.000015636,-0.000000766],[0.000015564,-0.000000763],[0.000015493,-0.000000759],[0.000015422,-0.000000755],[0.000015351,-0.000000750],[0.000015281,-0.000000745],[0.000015211,-0.000000739],[0.000015140,-0.000000733],[0.000015071,-0.000000726],[0.000015001,-0.000000719],[0.000014931,-0.000000710],[0.000014862,-0.000000702],[0.000014793,-0.000000692],[0.000014723,-0.000000682],[0.000014654,-0.000000672],[0.000014585,-0.000000660],[0.000014515,-0.000000648],[0.000014446,-0.000000635],[0.000014376,-0.000000622],[0.000014307,-0.000000607],[0.000014237,-0.000000593],[0.000014167,-0.000000579],[0.000014097,-0.000000565],[0.000014025,-0.000000553],[0.000013953,-0.000000543],[0.000013880,-0.000000534],[0.000013806,-0.000000526],[0.000013733,-0.000000520],[0.000013660,-0.000000514],[0.000013587,-0.000000508],[0.000013511,-0.000000500],[0.000013429,-0.000000489],[0.000013344,-0.000000476],[0.000013258,-0.000000461],[0.000013172,-0.000000443],[0.000013086,-0.000000424],[0.000012996,-0.000000409],[0.000012902,-0.000000398],[0.000012804,-0.000000389],[0.000012706,-0.000000381],[0.000012611,-0.000000369],[0.000012519,-0.000000350],[0.000012431,-0.000000325],[0.000012369,-0.000000316],[0.000012317,-0.000000316],[0.000012217,-0.000000285],[0.000012120,-0.000000257],[0.000012033,-0.000000235],[0.000011949,-0.000000214],[0.000011872,-0.000000194],[0.000011800,-0.000000174],[0.000011730,-0.000000150],[0.000011654,-0.000000121],[0.000011580,-0.000000097],[0.000011502,-0.000000075],[0.000011422,-0.000000055],[0.000011346,-0.000000034],[0.000011278,-0.000000014],[0.000011218,0.000000004],[0.000011169,0.000000017],[0.000011132,0.000000021],[0.000011093,0.000000024],[0.000011027,0.000000054],[0.000010957,0.000000088],[0.000010902,0.000000117],[0.000010851,0.000000137],[0.000010789,0.000000148],[0.000010719,0.000000153],[0.000010645,0.000000160],[0.000010571,0.000000173],[0.000010498,0.000000191],[0.000010428,0.000000212],[0.000010361,0.000000234],[0.000010297,0.000000259],[0.000010234,0.000000285],[0.000010170,0.000000312],[0.000010103,0.000000339],[0.000010034,0.000000364],[0.000009963,0.000000387],[0.000009891,0.000000408],[0.000009820,0.000000425],[0.000009749,0.000000440],[0.000009680,0.000000452],[0.000009612,0.000000462],[0.000009546,0.000000470],[0.000009479,0.000000476],[0.000009412,0.000000481],[0.000009346,0.000000487],[0.000009281,0.000000494],[0.000009218,0.000000503],[0.000009157,0.000000515],[0.000009098,0.000000528],[0.000009038,0.000000543],[0.000008981,0.000000560],[0.000008934,0.000000582],[0.000008898,0.000000609],[0.000008863,0.000000636],[0.000008822,0.000000654],[0.000008769,0.000000664],[0.000008709,0.000000675],[0.000008645,0.000000689],[0.000008584,0.000000704],[0.000008529,0.000000718],[0.000008478,0.000000733],[0.000008427,0.000000746],[0.000008375,0.000000759],[0.000008321,0.000000771],[0.000008265,0.000000784],[0.000008208,0.000000796],[0.000008149,0.000000808],[0.000008089,0.000000820],[0.000008028,0.000000832],[0.000007967,0.000000844],[0.000007906,0.000000855],[0.000007844,0.000000867],[0.000007782,0.000000878],[0.000007721,0.000000890],[0.000007659,0.000000903],[0.000007597,0.000000916],[0.000007534,0.000000929],[0.000007471,0.000000942],[0.000007408,0.000000955],[0.000007345,0.000000968],[0.000007283,0.000000980],[0.000007221,0.000000992],[0.000007161,0.000001003],[0.000007102,0.000001013],[0.000007044,0.000001022],[0.000006988,0.000001030],[0.000006932,0.000001039],[0.000006877,0.000001049],[0.000006821,0.000001059],[0.000006765,0.000001070],[0.000006708,0.000001081],[0.000006650,0.000001091],[0.000006592,0.000001101],[0.000017073,-0.000000771],[0.000017002,-0.000000773],[0.000016931,-0.000000775],[0.000016859,-0.000000777],[0.000016788,-0.000000779],[0.000016716,-0.000000781],[0.000016645,-0.000000782],[0.000016573,-0.000000784],[0.000016502,-0.000000786],[0.000016430,-0.000000788],[0.000016359,-0.000000789],[0.000016287,-0.000000790],[0.000016216,-0.000000791],[0.000016144,-0.000000792],[0.000016073,-0.000000792],[0.000016001,-0.000000792],[0.000015930,-0.000000791],[0.000015859,-0.000000790],[0.000015788,-0.000000789],[0.000015716,-0.000000787],[0.000015645,-0.000000785],[0.000015574,-0.000000782],[0.000015504,-0.000000779],[0.000015433,-0.000000775],[0.000015363,-0.000000771],[0.000015293,-0.000000767],[0.000015223,-0.000000761],[0.000015154,-0.000000756],[0.000015084,-0.000000749],[0.000015015,-0.000000742],[0.000014946,-0.000000735],[0.000014877,-0.000000727],[0.000014808,-0.000000718],[0.000014740,-0.000000708],[0.000014671,-0.000000698],[0.000014603,-0.000000687],[0.000014534,-0.000000675],[0.000014465,-0.000000662],[0.000014396,-0.000000649],[0.000014327,-0.000000634],[0.000014258,-0.000000619],[0.000014189,-0.000000604],[0.000014120,-0.000000589],[0.000014050,-0.000000576],[0.000013979,-0.000000564],[0.000013905,-0.000000555],[0.000013829,-0.000000547],[0.000013753,-0.000000539],[0.000013677,-0.000000533],[0.000013604,-0.000000526],[0.000013529,-0.000000518],[0.000013448,-0.000000507],[0.000013364,-0.000000492],[0.000013277,-0.000000476],[0.000013192,-0.000000456],[0.000013106,-0.000000436],[0.000013018,-0.000000423],[0.000012927,-0.000000416],[0.000012831,-0.000000411],[0.000012733,-0.000000406],[0.000012641,-0.000000399],[0.000012560,-0.000000385],[0.000012471,-0.000000353],[0.000012401,-0.000000336],[0.000012344,-0.000000332],[0.000012258,-0.000000312],[0.000012166,-0.000000287],[0.000012072,-0.000000261],[0.000011984,-0.000000239],[0.000011908,-0.000000223],[0.000011839,-0.000000209],[0.000011776,-0.000000193],[0.000011703,-0.000000165],[0.000011624,-0.000000134],[0.000011542,-0.000000110],[0.000011460,-0.000000093],[0.000011385,-0.000000076],[0.000011316,-0.000000062],[0.000011256,-0.000000047],[0.000011206,-0.000000032],[0.000011165,-0.000000025],[0.000011130,-0.000000031],[0.000011060,0.000000002],[0.000010993,0.000000036],[0.000010937,0.000000063],[0.000010879,0.000000082],[0.000010809,0.000000095],[0.000010735,0.000000100],[0.000010660,0.000000108],[0.000010584,0.000000126],[0.000010511,0.000000146],[0.000010443,0.000000166],[0.000010380,0.000000187],[0.000010320,0.000000211],[0.000010261,0.000000239],[0.000010199,0.000000270],[0.000010134,0.000000299],[0.000010066,0.000000325],[0.000009995,0.000000347],[0.000009921,0.000000366],[0.000009848,0.000000383],[0.000009777,0.000000397],[0.000009708,0.000000409],[0.000009642,0.000000419],[0.000009578,0.000000426],[0.000009513,0.000000434],[0.000009447,0.000000439],[0.000009378,0.000000444],[0.000009309,0.000000449],[0.000009253,0.000000458],[0.000009199,0.000000470],[0.000009141,0.000000485],[0.000009079,0.000000501],[0.000009021,0.000000517],[0.000008971,0.000000536],[0.000008929,0.000000558],[0.000008888,0.000000578],[0.000008843,0.000000593],[0.000008792,0.000000602],[0.000008732,0.000000617],[0.000008667,0.000000635],[0.000008606,0.000000652],[0.000008556,0.000000667],[0.000008507,0.000000681],[0.000008457,0.000000694],[0.000008404,0.000000707],[0.000008349,0.000000720],[0.000008292,0.000000734],[0.000008233,0.000000747],[0.000008173,0.000000759],[0.000008112,0.000000772],[0.000008050,0.000000783],[0.000007989,0.000000795],[0.000007927,0.000000806],[0.000007866,0.000000818],[0.000007804,0.000000831],[0.000007742,0.000000843],[0.000007680,0.000000856],[0.000007618,0.000000870],[0.000007556,0.000000883],[0.000007493,0.000000897],[0.000007431,0.000000910],[0.000007368,0.000000923],[0.000007306,0.000000935],[0.000007245,0.000000947],[0.000007185,0.000000957],[0.000007126,0.000000967],[0.000007069,0.000000976],[0.000007011,0.000000985],[0.000006955,0.000000995],[0.000006898,0.000001005],[0.000006842,0.000001017],[0.000006785,0.000001028],[0.000006729,0.000001040],[0.000006671,0.000001051],[0.000006614,0.000001063],[0.000017068,-0.000000771],[0.000016998,-0.000000773],[0.000016927,-0.000000776],[0.000016857,-0.000000779],[0.000016786,-0.000000782],[0.000016716,-0.000000785],[0.000016645,-0.000000788],[0.000016575,-0.000000791],[0.000016504,-0.000000794],[0.000016433,-0.000000797],[0.000016363,-0.000000799],[0.000016292,-0.000000801],[0.000016221,-0.000000803],[0.000016151,-0.000000804],[0.000016080,-0.000000805],[0.000016009,-0.000000806],[0.000015938,-0.000000807],[0.000015868,-0.000000806],[0.000015797,-0.000000806],[0.000015726,-0.000000805],[0.000015656,-0.000000803],[0.000015585,-0.000000801],[0.000015515,-0.000000799],[0.000015445,-0.000000795],[0.000015375,-0.000000792],[0.000015306,-0.000000788],[0.000015236,-0.000000783],[0.000015167,-0.000000778],[0.000015098,-0.000000772],[0.000015029,-0.000000766],[0.000014961,-0.000000759],[0.000014892,-0.000000751],[0.000014824,-0.000000743],[0.000014756,-0.000000734],[0.000014689,-0.000000724],[0.000014621,-0.000000713],[0.000014553,-0.000000702],[0.000014485,-0.000000689],[0.000014416,-0.000000676],[0.000014348,-0.000000662],[0.000014280,-0.000000646],[0.000014211,-0.000000630],[0.000014143,-0.000000614],[0.000014076,-0.000000599],[0.000014007,-0.000000587],[0.000013933,-0.000000577],[0.000013854,-0.000000568],[0.000013771,-0.000000558],[0.000013692,-0.000000550],[0.000013616,-0.000000542],[0.000013542,-0.000000533],[0.000013463,-0.000000521],[0.000013382,-0.000000505],[0.000013298,-0.000000487],[0.000013215,-0.000000465],[0.000013128,-0.000000445],[0.000013044,-0.000000438],[0.000012957,-0.000000435],[0.000012866,-0.000000433],[0.000012769,-0.000000429],[0.000012672,-0.000000420],[0.000012599,-0.000000403],[0.000012520,-0.000000378],[0.000012443,-0.000000361],[0.000012369,-0.000000349],[0.000012288,-0.000000332],[0.000012199,-0.000000310],[0.000012106,-0.000000286],[0.000012019,-0.000000265],[0.000011943,-0.000000253],[0.000011872,-0.000000240],[0.000011801,-0.000000221],[0.000011738,-0.000000197],[0.000011666,-0.000000166],[0.000011588,-0.000000144],[0.000011508,-0.000000130],[0.000011430,-0.000000117],[0.000011359,-0.000000104],[0.000011296,-0.000000092],[0.000011238,-0.000000076],[0.000011178,-0.000000052],[0.000011123,-0.000000036],[0.000011071,-0.000000028],[0.000011016,-0.000000008],[0.000010960,0.000000016],[0.000010898,0.000000037],[0.000010823,0.000000052],[0.000010750,0.000000057],[0.000010673,0.000000067],[0.000010594,0.000000089],[0.000010520,0.000000108],[0.000010456,0.000000123],[0.000010399,0.000000139],[0.000010342,0.000000163],[0.000010285,0.000000195],[0.000010226,0.000000229],[0.000010165,0.000000261],[0.000010098,0.000000286],[0.000010026,0.000000305],[0.000009952,0.000000321],[0.000009877,0.000000337],[0.000009804,0.000000353],[0.000009735,0.000000366],[0.000009672,0.000000375],[0.000009610,0.000000382],[0.000009548,0.000000391],[0.000009483,0.000000401],[0.000009414,0.000000405],[0.000009330,0.000000407],[0.000009292,0.000000416],[0.000009248,0.000000429],[0.000009186,0.000000444],[0.000009119,0.000000461],[0.000009060,0.000000477],[0.000009008,0.000000493],[0.000008961,0.000000511],[0.000008912,0.000000526],[0.000008862,0.000000539],[0.000008808,0.000000550],[0.000008750,0.000000565],[0.000008692,0.000000584],[0.000008639,0.000000603],[0.000008589,0.000000618],[0.000008539,0.000000630],[0.000008487,0.000000643],[0.000008433,0.000000656],[0.000008377,0.000000670],[0.000008318,0.000000684],[0.000008258,0.000000698],[0.000008196,0.000000711],[0.000008134,0.000000723],[0.000008072,0.000000735],[0.000008010,0.000000746],[0.000007949,0.000000758],[0.000007888,0.000000770],[0.000007826,0.000000783],[0.000007765,0.000000797],[0.000007703,0.000000810],[0.000007641,0.000000824],[0.000007579,0.000000838],[0.000007516,0.000000852],[0.000007454,0.000000865],[0.000007392,0.000000878],[0.000007330,0.000000890],[0.000007269,0.000000902],[0.000007210,0.000000912],[0.000007151,0.000000922],[0.000007092,0.000000932],[0.000007034,0.000000942],[0.000006977,0.000000953],[0.000006920,0.000000964],[0.000006863,0.000000975],[0.000006806,0.000000987],[0.000006749,0.000000999],[0.000006691,0.000001012],[0.000006634,0.000001025],[0.000017063,-0.000000769],[0.000016993,-0.000000773],[0.000016924,-0.000000777],[0.000016854,-0.000000782],[0.000016785,-0.000000786],[0.000016715,-0.000000790],[0.000016646,-0.000000794],[0.000016576,-0.000000798],[0.000016506,-0.000000801],[0.000016437,-0.000000805],[0.000016367,-0.000000808],[0.000016297,-0.000000812],[0.000016227,-0.000000814],[0.000016157,-0.000000817],[0.000016087,-0.000000819],[0.000016017,-0.000000820],[0.000015947,-0.000000821],[0.000015877,-0.000000822],[0.000015807,-0.000000822],[0.000015737,-0.000000822],[0.000015667,-0.000000821],[0.000015597,-0.000000820],[0.000015527,-0.000000818],[0.000015457,-0.000000815],[0.000015388,-0.000000812],[0.000015319,-0.000000809],[0.000015250,-0.000000805],[0.000015181,-0.000000800],[0.000015112,-0.000000795],[0.000015044,-0.000000789],[0.000014976,-0.000000782],[0.000014908,-0.000000775],[0.000014840,-0.000000768],[0.000014773,-0.000000759],[0.000014706,-0.000000750],[0.000014639,-0.000000740],[0.000014571,-0.000000729],[0.000014504,-0.000000717],[0.000014437,-0.000000704],[0.000014369,-0.000000690],[0.000014301,-0.000000675],[0.000014234,-0.000000658],[0.000014167,-0.000000640],[0.000014100,-0.000000625],[0.000014035,-0.000000613],[0.000013966,-0.000000602],[0.000013883,-0.000000590],[0.000013791,-0.000000578],[0.000013706,-0.000000567],[0.000013629,-0.000000557],[0.000013554,-0.000000546],[0.000013478,-0.000000534],[0.000013399,-0.000000518],[0.000013318,-0.000000499],[0.000013237,-0.000000479],[0.000013155,-0.000000463],[0.000013075,-0.000000458],[0.000012993,-0.000000457],[0.000012907,-0.000000454],[0.000012819,-0.000000449],[0.000012731,-0.000000437],[0.000012647,-0.000000418],[0.000012565,-0.000000398],[0.000012483,-0.000000381],[0.000012400,-0.000000368],[0.000012315,-0.000000350],[0.000012227,-0.000000331],[0.000012140,-0.000000312],[0.000012057,-0.000000296],[0.000011981,-0.000000285],[0.000011909,-0.000000273],[0.000011838,-0.000000254],[0.000011772,-0.000000230],[0.000011705,-0.000000200],[0.000011632,-0.000000181],[0.000011554,-0.000000171],[0.000011475,-0.000000157],[0.000011399,-0.000000140],[0.000011331,-0.000000126],[0.000011271,-0.000000119],[0.000011209,-0.000000105],[0.000011141,-0.000000078],[0.000011081,-0.000000062],[0.000011029,-0.000000045],[0.000010972,-0.000000023],[0.000010904,0.000000002],[0.000010837,0.000000015],[0.000010769,0.000000024],[0.000010688,0.000000039],[0.000010604,0.000000060],[0.000010530,0.000000076],[0.000010472,0.000000082],[0.000010419,0.000000091],[0.000010363,0.000000116],[0.000010305,0.000000152],[0.000010248,0.000000191],[0.000010192,0.000000224],[0.000010129,0.000000246],[0.000010059,0.000000260],[0.000009983,0.000000273],[0.000009905,0.000000288],[0.000009830,0.000000306],[0.000009762,0.000000322],[0.000009702,0.000000329],[0.000009643,0.000000336],[0.000009582,0.000000348],[0.000009517,0.000000364],[0.000009444,0.000000372],[0.000009362,0.000000371],[0.000009338,0.000000380],[0.000009293,0.000000391],[0.000009224,0.000000404],[0.000009156,0.000000419],[0.000009095,0.000000436],[0.000009041,0.000000452],[0.000008989,0.000000467],[0.000008935,0.000000481],[0.000008881,0.000000492],[0.000008826,0.000000503],[0.000008771,0.000000517],[0.000008717,0.000000534],[0.000008675,0.000000555],[0.000008624,0.000000568],[0.000008571,0.000000579],[0.000008518,0.000000592],[0.000008462,0.000000607],[0.000008404,0.000000622],[0.000008344,0.000000636],[0.000008282,0.000000650],[0.000008219,0.000000663],[0.000008156,0.000000675],[0.000008094,0.000000686],[0.000008033,0.000000697],[0.000007971,0.000000709],[0.000007910,0.000000722],[0.000007849,0.000000736],[0.000007788,0.000000750],[0.000007726,0.000000765],[0.000007664,0.000000780],[0.000007602,0.000000794],[0.000007540,0.000000808],[0.000007477,0.000000821],[0.000007416,0.000000834],[0.000007354,0.000000846],[0.000007294,0.000000857],[0.000007234,0.000000868],[0.000007174,0.000000879],[0.000007115,0.000000890],[0.000007057,0.000000900],[0.000006999,0.000000911],[0.000006941,0.000000923],[0.000006883,0.000000935],[0.000006826,0.000000947],[0.000006768,0.000000960],[0.000006711,0.000000973],[0.000006654,0.000000986],[0.000017057,-0.000000768],[0.000016988,-0.000000773],[0.000016920,-0.000000778],[0.000016852,-0.000000783],[0.000016783,-0.000000789],[0.000016714,-0.000000794],[0.000016646,-0.000000799],[0.000016577,-0.000000804],[0.000016509,-0.000000809],[0.000016440,-0.000000813],[0.000016371,-0.000000818],[0.000016302,-0.000000822],[0.000016233,-0.000000825],[0.000016164,-0.000000829],[0.000016095,-0.000000831],[0.000016026,-0.000000834],[0.000015956,-0.000000836],[0.000015887,-0.000000837],[0.000015817,-0.000000838],[0.000015748,-0.000000839],[0.000015678,-0.000000839],[0.000015609,-0.000000838],[0.000015540,-0.000000836],[0.000015470,-0.000000835],[0.000015401,-0.000000832],[0.000015332,-0.000000829],[0.000015264,-0.000000825],[0.000015195,-0.000000821],[0.000015127,-0.000000817],[0.000015059,-0.000000811],[0.000014991,-0.000000805],[0.000014924,-0.000000799],[0.000014857,-0.000000792],[0.000014790,-0.000000784],[0.000014723,-0.000000775],[0.000014657,-0.000000766],[0.000014590,-0.000000756],[0.000014524,-0.000000744],[0.000014458,-0.000000732],[0.000014391,-0.000000718],[0.000014324,-0.000000703],[0.000014258,-0.000000687],[0.000014191,-0.000000670],[0.000014125,-0.000000655],[0.000014062,-0.000000642],[0.000013999,-0.000000629],[0.000013916,-0.000000614],[0.000013817,-0.000000599],[0.000013727,-0.000000584],[0.000013647,-0.000000571],[0.000013570,-0.000000559],[0.000013494,-0.000000547],[0.000013416,-0.000000532],[0.000013339,-0.000000516],[0.000013262,-0.000000502],[0.000013185,-0.000000490],[0.000013109,-0.000000483],[0.000013031,-0.000000480],[0.000012950,-0.000000475],[0.000012869,-0.000000468],[0.000012787,-0.000000456],[0.000012691,-0.000000437],[0.000012601,-0.000000417],[0.000012518,-0.000000399],[0.000012430,-0.000000385],[0.000012342,-0.000000370],[0.000012255,-0.000000353],[0.000012171,-0.000000337],[0.000012092,-0.000000324],[0.000012018,-0.000000315],[0.000011948,-0.000000305],[0.000011876,-0.000000288],[0.000011806,-0.000000268],[0.000011736,-0.000000246],[0.000011666,-0.000000228],[0.000011594,-0.000000214],[0.000011515,-0.000000195],[0.000011434,-0.000000171],[0.000011358,-0.000000149],[0.000011294,-0.000000142],[0.000011233,-0.000000137],[0.000011166,-0.000000118],[0.000011103,-0.000000098],[0.000011047,-0.000000079],[0.000010990,-0.000000060],[0.000010929,-0.000000041],[0.000010869,-0.000000027],[0.000010798,-0.000000012],[0.000010704,0.000000010],[0.000010619,0.000000028],[0.000010554,0.000000038],[0.000010498,0.000000042],[0.000010441,0.000000051],[0.000010380,0.000000077],[0.000010319,0.000000113],[0.000010263,0.000000149],[0.000010212,0.000000183],[0.000010154,0.000000200],[0.000010090,0.000000212],[0.000010017,0.000000224],[0.000009936,0.000000237],[0.000009858,0.000000252],[0.000009793,0.000000270],[0.000009734,0.000000282],[0.000009677,0.000000293],[0.000009615,0.000000306],[0.000009549,0.000000322],[0.000009479,0.000000336],[0.000009412,0.000000339],[0.000009362,0.000000347],[0.000009307,0.000000357],[0.000009246,0.000000368],[0.000009186,0.000000381],[0.000009128,0.000000396],[0.000009070,0.000000412],[0.000009013,0.000000428],[0.000008957,0.000000440],[0.000008903,0.000000449],[0.000008850,0.000000458],[0.000008797,0.000000470],[0.000008746,0.000000484],[0.000008701,0.000000501],[0.000008652,0.000000515],[0.000008600,0.000000527],[0.000008545,0.000000543],[0.000008489,0.000000559],[0.000008431,0.000000574],[0.000008369,0.000000589],[0.000008305,0.000000603],[0.000008240,0.000000615],[0.000008178,0.000000626],[0.000008116,0.000000636],[0.000008055,0.000000648],[0.000007995,0.000000660],[0.000007934,0.000000675],[0.000007873,0.000000690],[0.000007812,0.000000705],[0.000007750,0.000000721],[0.000007688,0.000000736],[0.000007626,0.000000750],[0.000007564,0.000000764],[0.000007501,0.000000778],[0.000007440,0.000000790],[0.000007378,0.000000802],[0.000007317,0.000000814],[0.000007257,0.000000825],[0.000007197,0.000000837],[0.000007138,0.000000848],[0.000007079,0.000000859],[0.000007020,0.000000871],[0.000006962,0.000000883],[0.000006904,0.000000895],[0.000006846,0.000000908],[0.000006788,0.000000920],[0.000006731,0.000000934],[0.000006673,0.000000947],[0.000017050,-0.000000766],[0.000016983,-0.000000772],[0.000016916,-0.000000779],[0.000016848,-0.000000785],[0.000016781,-0.000000791],[0.000016714,-0.000000797],[0.000016646,-0.000000803],[0.000016579,-0.000000809],[0.000016511,-0.000000815],[0.000016444,-0.000000821],[0.000016376,-0.000000826],[0.000016308,-0.000000831],[0.000016240,-0.000000836],[0.000016172,-0.000000840],[0.000016103,-0.000000844],[0.000016035,-0.000000847],[0.000015966,-0.000000850],[0.000015897,-0.000000852],[0.000015828,-0.000000854],[0.000015760,-0.000000855],[0.000015691,-0.000000856],[0.000015622,-0.000000855],[0.000015553,-0.000000855],[0.000015484,-0.000000853],[0.000015415,-0.000000852],[0.000015347,-0.000000849],[0.000015278,-0.000000846],[0.000015210,-0.000000843],[0.000015142,-0.000000838],[0.000015074,-0.000000834],[0.000015007,-0.000000828],[0.000014939,-0.000000822],[0.000014873,-0.000000816],[0.000014806,-0.000000808],[0.000014740,-0.000000800],[0.000014674,-0.000000792],[0.000014609,-0.000000782],[0.000014543,-0.000000771],[0.000014478,-0.000000760],[0.000014413,-0.000000746],[0.000014348,-0.000000732],[0.000014283,-0.000000716],[0.000014217,-0.000000701],[0.000014150,-0.000000686],[0.000014083,-0.000000672],[0.000014021,-0.000000655],[0.000013934,-0.000000638],[0.000013837,-0.000000620],[0.000013751,-0.000000603],[0.000013670,-0.000000587],[0.000013589,-0.000000573],[0.000013509,-0.000000561],[0.000013434,-0.000000549],[0.000013362,-0.000000538],[0.000013290,-0.000000528],[0.000013217,-0.000000519],[0.000013143,-0.000000511],[0.000013068,-0.000000504],[0.000012987,-0.000000497],[0.000012904,-0.000000487],[0.000012817,-0.000000474],[0.000012716,-0.000000456],[0.000012624,-0.000000437],[0.000012541,-0.000000420],[0.000012456,-0.000000406],[0.000012370,-0.000000393],[0.000012284,-0.000000378],[0.000012202,-0.000000361],[0.000012124,-0.000000348],[0.000012054,-0.000000340],[0.000011985,-0.000000332],[0.000011911,-0.000000318],[0.000011836,-0.000000303],[0.000011761,-0.000000285],[0.000011688,-0.000000261],[0.000011618,-0.000000245],[0.000011543,-0.000000227],[0.000011464,-0.000000202],[0.000011387,-0.000000178],[0.000011320,-0.000000168],[0.000011258,-0.000000163],[0.000011194,-0.000000150],[0.000011130,-0.000000132],[0.000011071,-0.000000113],[0.000011014,-0.000000096],[0.000010957,-0.000000081],[0.000010898,-0.000000067],[0.000010824,-0.000000049],[0.000010722,-0.000000024],[0.000010645,-0.000000011],[0.000010599,-0.000000010],[0.000010535,0.000000004],[0.000010459,0.000000030],[0.000010393,0.000000053],[0.000010332,0.000000079],[0.000010273,0.000000103],[0.000010214,0.000000121],[0.000010166,0.000000141],[0.000010120,0.000000162],[0.000010050,0.000000179],[0.000009970,0.000000191],[0.000009892,0.000000202],[0.000009827,0.000000220],[0.000009768,0.000000237],[0.000009709,0.000000254],[0.000009646,0.000000264],[0.000009580,0.000000270],[0.000009515,0.000000287],[0.000009450,0.000000302],[0.000009386,0.000000314],[0.000009321,0.000000324],[0.000009265,0.000000334],[0.000009215,0.000000345],[0.000009160,0.000000357],[0.000009101,0.000000371],[0.000009040,0.000000387],[0.000008982,0.000000400],[0.000008931,0.000000406],[0.000008880,0.000000413],[0.000008828,0.000000423],[0.000008777,0.000000435],[0.000008727,0.000000449],[0.000008676,0.000000465],[0.000008622,0.000000480],[0.000008567,0.000000497],[0.000008512,0.000000513],[0.000008456,0.000000527],[0.000008392,0.000000543],[0.000008325,0.000000556],[0.000008261,0.000000566],[0.000008199,0.000000575],[0.000008139,0.000000585],[0.000008079,0.000000598],[0.000008019,0.000000612],[0.000007959,0.000000628],[0.000007898,0.000000645],[0.000007837,0.000000661],[0.000007775,0.000000677],[0.000007712,0.000000692],[0.000007650,0.000000707],[0.000007587,0.000000721],[0.000007525,0.000000734],[0.000007463,0.000000747],[0.000007402,0.000000760],[0.000007341,0.000000772],[0.000007280,0.000000783],[0.000007220,0.000000795],[0.000007160,0.000000807],[0.000007101,0.000000819],[0.000007042,0.000000831],[0.000006983,0.000000843],[0.000006924,0.000000856],[0.000006866,0.000000869],[0.000006808,0.000000882],[0.000006750,0.000000895],[0.000006691,0.000000908],[0.000017043,-0.000000764],[0.000016977,-0.000000771],[0.000016911,-0.000000779],[0.000016845,-0.000000786],[0.000016779,-0.000000793],[0.000016713,-0.000000800],[0.000016647,-0.000000808],[0.000016580,-0.000000815],[0.000016514,-0.000000821],[0.000016447,-0.000000828],[0.000016381,-0.000000834],[0.000016314,-0.000000840],[0.000016247,-0.000000846],[0.000016180,-0.000000851],[0.000016112,-0.000000856],[0.000016045,-0.000000860],[0.000015977,-0.000000864],[0.000015909,-0.000000866],[0.000015841,-0.000000869],[0.000015772,-0.000000871],[0.000015704,-0.000000872],[0.000015635,-0.000000873],[0.000015567,-0.000000873],[0.000015498,-0.000000872],[0.000015430,-0.000000871],[0.000015361,-0.000000869],[0.000015293,-0.000000866],[0.000015225,-0.000000863],[0.000015157,-0.000000860],[0.000015090,-0.000000855],[0.000015023,-0.000000850],[0.000014956,-0.000000845],[0.000014889,-0.000000839],[0.000014823,-0.000000832],[0.000014758,-0.000000825],[0.000014692,-0.000000817],[0.000014627,-0.000000808],[0.000014563,-0.000000798],[0.000014499,-0.000000787],[0.000014435,-0.000000775],[0.000014371,-0.000000761],[0.000014307,-0.000000747],[0.000014243,-0.000000731],[0.000014177,-0.000000715],[0.000014110,-0.000000698],[0.000014037,-0.000000680],[0.000013950,-0.000000661],[0.000013861,-0.000000641],[0.000013778,-0.000000623],[0.000013698,-0.000000606],[0.000013615,-0.000000592],[0.000013530,-0.000000579],[0.000013459,-0.000000570],[0.000013390,-0.000000562],[0.000013320,-0.000000555],[0.000013249,-0.000000547],[0.000013175,-0.000000538],[0.000013097,-0.000000529],[0.000013013,-0.000000517],[0.000012923,-0.000000505],[0.000012827,-0.000000491],[0.000012726,-0.000000475],[0.000012639,-0.000000458],[0.000012561,-0.000000443],[0.000012482,-0.000000431],[0.000012399,-0.000000420],[0.000012316,-0.000000405],[0.000012234,-0.000000387],[0.000012156,-0.000000369],[0.000012087,-0.000000361],[0.000012017,-0.000000352],[0.000011941,-0.000000338],[0.000011862,-0.000000322],[0.000011779,-0.000000300],[0.000011699,-0.000000274],[0.000011626,-0.000000258],[0.000011559,-0.000000248],[0.000011490,-0.000000235],[0.000011421,-0.000000219],[0.000011354,-0.000000206],[0.000011289,-0.000000196],[0.000011223,-0.000000179],[0.000011156,-0.000000162],[0.000011095,-0.000000145],[0.000011040,-0.000000130],[0.000010983,-0.000000115],[0.000010915,-0.000000101],[0.000010837,-0.000000086],[0.000010761,-0.000000074],[0.000010709,-0.000000070],[0.000010666,-0.000000067],[0.000010582,-0.000000037],[0.000010492,-0.000000002],[0.000010415,0.000000024],[0.000010352,0.000000044],[0.000010295,0.000000059],[0.000010241,0.000000073],[0.000010190,0.000000096],[0.000010138,0.000000121],[0.000010076,0.000000140],[0.000010005,0.000000153],[0.000009932,0.000000162],[0.000009864,0.000000175],[0.000009797,0.000000194],[0.000009735,0.000000213],[0.000009672,0.000000223],[0.000009609,0.000000230],[0.000009544,0.000000248],[0.000009478,0.000000264],[0.000009413,0.000000277],[0.000009352,0.000000289],[0.000009300,0.000000301],[0.000009250,0.000000312],[0.000009195,0.000000320],[0.000009136,0.000000328],[0.000009077,0.000000342],[0.000009021,0.000000353],[0.000008967,0.000000360],[0.000008913,0.000000368],[0.000008860,0.000000377],[0.000008807,0.000000388],[0.000008754,0.000000400],[0.000008699,0.000000416],[0.000008643,0.000000434],[0.000008586,0.000000452],[0.000008532,0.000000467],[0.000008476,0.000000482],[0.000008411,0.000000497],[0.000008345,0.000000508],[0.000008283,0.000000515],[0.000008223,0.000000523],[0.000008163,0.000000534],[0.000008104,0.000000549],[0.000008045,0.000000566],[0.000007985,0.000000584],[0.000007924,0.000000601],[0.000007862,0.000000618],[0.000007799,0.000000635],[0.000007737,0.000000650],[0.000007674,0.000000665],[0.000007611,0.000000679],[0.000007549,0.000000692],[0.000007487,0.000000705],[0.000007425,0.000000718],[0.000007364,0.000000730],[0.000007303,0.000000742],[0.000007242,0.000000754],[0.000007182,0.000000767],[0.000007122,0.000000779],[0.000007063,0.000000791],[0.000007004,0.000000804],[0.000006945,0.000000817],[0.000006886,0.000000830],[0.000006827,0.000000843],[0.000006769,0.000000857],[0.000006710,0.000000870],[0.000017035,-0.000000762],[0.000016971,-0.000000770],[0.000016906,-0.000000778],[0.000016841,-0.000000787],[0.000016776,-0.000000795],[0.000016712,-0.000000803],[0.000016647,-0.000000811],[0.000016582,-0.000000819],[0.000016517,-0.000000827],[0.000016451,-0.000000835],[0.000016386,-0.000000842],[0.000016320,-0.000000849],[0.000016254,-0.000000856],[0.000016188,-0.000000862],[0.000016121,-0.000000867],[0.000016055,-0.000000872],[0.000015988,-0.000000877],[0.000015921,-0.000000880],[0.000015853,-0.000000884],[0.000015785,-0.000000886],[0.000015718,-0.000000888],[0.000015650,-0.000000890],[0.000015581,-0.000000890],[0.000015513,-0.000000890],[0.000015445,-0.000000890],[0.000015377,-0.000000888],[0.000015309,-0.000000886],[0.000015241,-0.000000884],[0.000015174,-0.000000880],[0.000015106,-0.000000877],[0.000015039,-0.000000872],[0.000014972,-0.000000867],[0.000014906,-0.000000862],[0.000014840,-0.000000856],[0.000014775,-0.000000849],[0.000014710,-0.000000842],[0.000014646,-0.000000833],[0.000014582,-0.000000825],[0.000014518,-0.000000815],[0.000014456,-0.000000803],[0.000014393,-0.000000791],[0.000014330,-0.000000777],[0.000014268,-0.000000761],[0.000014204,-0.000000743],[0.000014136,-0.000000724],[0.000014060,-0.000000705],[0.000013974,-0.000000686],[0.000013886,-0.000000666],[0.000013803,-0.000000648],[0.000013725,-0.000000631],[0.000013645,-0.000000621],[0.000013565,-0.000000608],[0.000013494,-0.000000597],[0.000013423,-0.000000588],[0.000013353,-0.000000580],[0.000013280,-0.000000572],[0.000013205,-0.000000563],[0.000013123,-0.000000551],[0.000013034,-0.000000538],[0.000012939,-0.000000524],[0.000012842,-0.000000511],[0.000012746,-0.000000496],[0.000012665,-0.000000480],[0.000012591,-0.000000466],[0.000012513,-0.000000456],[0.000012432,-0.000000447],[0.000012350,-0.000000436],[0.000012271,-0.000000419],[0.000012197,-0.000000401],[0.000012124,-0.000000387],[0.000012049,-0.000000373],[0.000011969,-0.000000356],[0.000011888,-0.000000335],[0.000011801,-0.000000310],[0.000011707,-0.000000284],[0.000011634,-0.000000273],[0.000011577,-0.000000273],[0.000011519,-0.000000268],[0.000011456,-0.000000257],[0.000011390,-0.000000244],[0.000011324,-0.000000231],[0.000011255,-0.000000209],[0.000011180,-0.000000192],[0.000011116,-0.000000175],[0.000011061,-0.000000159],[0.000011009,-0.000000145],[0.000010937,-0.000000133],[0.000010855,-0.000000121],[0.000010791,-0.000000115],[0.000010749,-0.000000114],[0.000010703,-0.000000105],[0.000010618,-0.000000072],[0.000010524,-0.000000035],[0.000010440,-0.000000007],[0.000010382,0.000000006],[0.000010333,0.000000014],[0.000010281,0.000000028],[0.000010221,0.000000053],[0.000010157,0.000000081],[0.000010095,0.000000099],[0.000010033,0.000000116],[0.000009965,0.000000124],[0.000009900,0.000000134],[0.000009820,0.000000159],[0.000009752,0.000000174],[0.000009698,0.000000182],[0.000009636,0.000000197],[0.000009567,0.000000217],[0.000009496,0.000000222],[0.000009438,0.000000234],[0.000009392,0.000000252],[0.000009345,0.000000268],[0.000009291,0.000000278],[0.000009232,0.000000285],[0.000009173,0.000000289],[0.000009117,0.000000296],[0.000009066,0.000000303],[0.000009005,0.000000315],[0.000008946,0.000000326],[0.000008890,0.000000334],[0.000008835,0.000000342],[0.000008779,0.000000353],[0.000008722,0.000000368],[0.000008665,0.000000386],[0.000008608,0.000000405],[0.000008557,0.000000420],[0.000008502,0.000000433],[0.000008437,0.000000446],[0.000008369,0.000000455],[0.000008308,0.000000459],[0.000008248,0.000000468],[0.000008189,0.000000483],[0.000008131,0.000000502],[0.000008071,0.000000522],[0.000008011,0.000000541],[0.000007949,0.000000559],[0.000007887,0.000000577],[0.000007824,0.000000593],[0.000007761,0.000000608],[0.000007698,0.000000623],[0.000007635,0.000000637],[0.000007572,0.000000650],[0.000007510,0.000000663],[0.000007448,0.000000676],[0.000007386,0.000000689],[0.000007325,0.000000702],[0.000007264,0.000000714],[0.000007204,0.000000727],[0.000007144,0.000000740],[0.000007084,0.000000753],[0.000007024,0.000000766],[0.000006965,0.000000779],[0.000006906,0.000000792],[0.000006847,0.000000805],[0.000006788,0.000000819],[0.000006729,0.000000832],[0.000017027,-0.000000760],[0.000016964,-0.000000769],[0.000016900,-0.000000778],[0.000016837,-0.000000787],[0.000016774,-0.000000797],[0.000016710,-0.000000806],[0.000016647,-0.000000815],[0.000016583,-0.000000824],[0.000016519,-0.000000833],[0.000016455,-0.000000841],[0.000016391,-0.000000849],[0.000016327,-0.000000857],[0.000016262,-0.000000865],[0.000016197,-0.000000872],[0.000016131,-0.000000878],[0.000016066,-0.000000884],[0.000016000,-0.000000889],[0.000015933,-0.000000894],[0.000015867,-0.000000898],[0.000015799,-0.000000901],[0.000015732,-0.000000904],[0.000015665,-0.000000906],[0.000015597,-0.000000907],[0.000015529,-0.000000908],[0.000015461,-0.000000908],[0.000015394,-0.000000907],[0.000015326,-0.000000906],[0.000015258,-0.000000904],[0.000015190,-0.000000901],[0.000015123,-0.000000898],[0.000015056,-0.000000893],[0.000014989,-0.000000889],[0.000014923,-0.000000884],[0.000014857,-0.000000878],[0.000014792,-0.000000872],[0.000014728,-0.000000865],[0.000014663,-0.000000858],[0.000014600,-0.000000850],[0.000014537,-0.000000841],[0.000014475,-0.000000831],[0.000014413,-0.000000820],[0.000014351,-0.000000807],[0.000014289,-0.000000791],[0.000014225,-0.000000773],[0.000014159,-0.000000752],[0.000014086,-0.000000733],[0.000013999,-0.000000719],[0.000013907,-0.000000699],[0.000013821,-0.000000681],[0.000013741,-0.000000667],[0.000013664,-0.000000658],[0.000013597,-0.000000640],[0.000013531,-0.000000626],[0.000013457,-0.000000614],[0.000013382,-0.000000602],[0.000013309,-0.000000593],[0.000013235,-0.000000584],[0.000013150,-0.000000570],[0.000013055,-0.000000558],[0.000012958,-0.000000546],[0.000012871,-0.000000535],[0.000012791,-0.000000521],[0.000012713,-0.000000503],[0.000012632,-0.000000490],[0.000012549,-0.000000482],[0.000012467,-0.000000475],[0.000012386,-0.000000467],[0.000012311,-0.000000452],[0.000012239,-0.000000435],[0.000012164,-0.000000417],[0.000012080,-0.000000399],[0.000011996,-0.000000377],[0.000011917,-0.000000355],[0.000011834,-0.000000333],[0.000011734,-0.000000327],[0.000011663,-0.000000314],[0.000011608,-0.000000307],[0.000011554,-0.000000301],[0.000011493,-0.000000291],[0.000011423,-0.000000277],[0.000011357,-0.000000261],[0.000011287,-0.000000244],[0.000011205,-0.000000225],[0.000011137,-0.000000202],[0.000011079,-0.000000184],[0.000011026,-0.000000172],[0.000010963,-0.000000162],[0.000010886,-0.000000151],[0.000010815,-0.000000143],[0.000010762,-0.000000136],[0.000010709,-0.000000124],[0.000010639,-0.000000099],[0.000010553,-0.000000068],[0.000010471,-0.000000042],[0.000010419,-0.000000033],[0.000010376,-0.000000028],[0.000010325,-0.000000016],[0.000010254,0.000000007],[0.000010181,0.000000029],[0.000010112,0.000000047],[0.000010045,0.000000066],[0.000009984,0.000000087],[0.000009920,0.000000111],[0.000009836,0.000000140],[0.000009766,0.000000140],[0.000009733,0.000000135],[0.000009663,0.000000142],[0.000009578,0.000000152],[0.000009506,0.000000166],[0.000009458,0.000000188],[0.000009422,0.000000211],[0.000009384,0.000000231],[0.000009329,0.000000242],[0.000009266,0.000000248],[0.000009204,0.000000250],[0.000009148,0.000000253],[0.000009095,0.000000263],[0.000009036,0.000000276],[0.000008977,0.000000286],[0.000008918,0.000000292],[0.000008861,0.000000298],[0.000008804,0.000000306],[0.000008746,0.000000319],[0.000008690,0.000000336],[0.000008635,0.000000355],[0.000008584,0.000000371],[0.000008533,0.000000382],[0.000008472,0.000000391],[0.000008402,0.000000396],[0.000008336,0.000000401],[0.000008276,0.000000414],[0.000008217,0.000000436],[0.000008159,0.000000459],[0.000008099,0.000000481],[0.000008037,0.000000501],[0.000007975,0.000000519],[0.000007912,0.000000535],[0.000007848,0.000000551],[0.000007784,0.000000566],[0.000007721,0.000000581],[0.000007658,0.000000595],[0.000007594,0.000000609],[0.000007532,0.000000622],[0.000007470,0.000000636],[0.000007408,0.000000649],[0.000007347,0.000000662],[0.000007286,0.000000675],[0.000007225,0.000000688],[0.000007165,0.000000701],[0.000007105,0.000000714],[0.000007045,0.000000727],[0.000006985,0.000000741],[0.000006926,0.000000754],[0.000006866,0.000000768],[0.000006807,0.000000781],[0.000006747,0.000000795],[0.000017018,-0.000000758],[0.000016956,-0.000000768],[0.000016894,-0.000000778],[0.000016833,-0.000000788],[0.000016771,-0.000000798],[0.000016709,-0.000000808],[0.000016647,-0.000000818],[0.000016585,-0.000000828],[0.000016522,-0.000000838],[0.000016460,-0.000000847],[0.000016397,-0.000000856],[0.000016334,-0.000000865],[0.000016270,-0.000000873],[0.000016206,-0.000000881],[0.000016142,-0.000000888],[0.000016077,-0.000000895],[0.000016012,-0.000000901],[0.000015947,-0.000000907],[0.000015881,-0.000000912],[0.000015814,-0.000000916],[0.000015748,-0.000000919],[0.000015681,-0.000000922],[0.000015614,-0.000000924],[0.000015546,-0.000000925],[0.000015479,-0.000000926],[0.000015411,-0.000000926],[0.000015343,-0.000000925],[0.000015276,-0.000000923],[0.000015208,-0.000000921],[0.000015141,-0.000000918],[0.000015074,-0.000000915],[0.000015007,-0.000000911],[0.000014941,-0.000000906],[0.000014875,-0.000000901],[0.000014810,-0.000000895],[0.000014745,-0.000000889],[0.000014681,-0.000000882],[0.000014618,-0.000000874],[0.000014555,-0.000000866],[0.000014493,-0.000000858],[0.000014432,-0.000000848],[0.000014370,-0.000000836],[0.000014307,-0.000000823],[0.000014242,-0.000000805],[0.000014173,-0.000000786],[0.000014100,-0.000000768],[0.000014021,-0.000000756],[0.000013923,-0.000000735],[0.000013837,-0.000000712],[0.000013756,-0.000000693],[0.000013680,-0.000000676],[0.000013620,-0.000000665],[0.000013561,-0.000000656],[0.000013485,-0.000000639],[0.000013407,-0.000000623],[0.000013333,-0.000000611],[0.000013261,-0.000000599],[0.000013177,-0.000000585],[0.000013082,-0.000000579],[0.000012992,-0.000000572],[0.000012917,-0.000000565],[0.000012847,-0.000000554],[0.000012766,-0.000000535],[0.000012677,-0.000000520],[0.000012588,-0.000000509],[0.000012505,-0.000000500],[0.000012426,-0.000000491],[0.000012350,-0.000000480],[0.000012274,-0.000000467],[0.000012195,-0.000000452],[0.000012111,-0.000000432],[0.000012027,-0.000000410],[0.000011948,-0.000000391],[0.000011864,-0.000000378],[0.000011775,-0.000000372],[0.000011706,-0.000000357],[0.000011649,-0.000000344],[0.000011595,-0.000000334],[0.000011532,-0.000000323],[0.000011453,-0.000000305],[0.000011390,-0.000000290],[0.000011329,-0.000000273],[0.000011249,-0.000000250],[0.000011170,-0.000000226],[0.000011103,-0.000000207],[0.000011049,-0.000000196],[0.000010990,-0.000000187],[0.000010913,-0.000000172],[0.000010832,-0.000000157],[0.000010772,-0.000000148],[0.000010721,-0.000000141],[0.000010659,-0.000000128],[0.000010586,-0.000000106],[0.000010515,-0.000000084],[0.000010457,-0.000000070],[0.000010407,-0.000000061],[0.000010350,-0.000000049],[0.000010276,-0.000000031],[0.000010201,-0.000000017],[0.000010131,-0.000000008],[0.000010065,0.000000006],[0.000009999,0.000000043],[0.000009929,0.000000088],[0.000009856,0.000000118],[0.000009803,0.000000107],[0.000009770,0.000000093],[0.000009694,0.000000089],[0.000009599,0.000000092],[0.000009524,0.000000116],[0.000009478,0.000000143],[0.000009445,0.000000166],[0.000009410,0.000000187],[0.000009358,0.000000200],[0.000009293,0.000000206],[0.000009228,0.000000210],[0.000009172,0.000000215],[0.000009119,0.000000229],[0.000009062,0.000000242],[0.000009003,0.000000251],[0.000008943,0.000000253],[0.000008885,0.000000253],[0.000008827,0.000000258],[0.000008771,0.000000269],[0.000008714,0.000000287],[0.000008660,0.000000307],[0.000008608,0.000000325],[0.000008555,0.000000338],[0.000008496,0.000000344],[0.000008431,0.000000345],[0.000008366,0.000000347],[0.000008306,0.000000368],[0.000008248,0.000000396],[0.000008188,0.000000421],[0.000008126,0.000000442],[0.000008063,0.000000461],[0.000008000,0.000000478],[0.000007936,0.000000495],[0.000007871,0.000000510],[0.000007807,0.000000525],[0.000007743,0.000000540],[0.000007680,0.000000554],[0.000007617,0.000000568],[0.000007554,0.000000582],[0.000007491,0.000000595],[0.000007430,0.000000609],[0.000007368,0.000000622],[0.000007307,0.000000636],[0.000007246,0.000000649],[0.000007186,0.000000663],[0.000007125,0.000000676],[0.000007065,0.000000690],[0.000007006,0.000000703],[0.000006946,0.000000717],[0.000006886,0.000000731],[0.000006826,0.000000744],[0.000006767,0.000000758],[0.000017008,-0.000000756],[0.000016948,-0.000000767],[0.000016888,-0.000000778],[0.000016828,-0.000000789],[0.000016767,-0.000000800],[0.000016707,-0.000000811],[0.000016647,-0.000000821],[0.000016586,-0.000000832],[0.000016525,-0.000000842],[0.000016464,-0.000000853],[0.000016403,-0.000000862],[0.000016341,-0.000000872],[0.000016279,-0.000000881],[0.000016216,-0.000000890],[0.000016153,-0.000000898],[0.000016089,-0.000000906],[0.000016025,-0.000000913],[0.000015961,-0.000000919],[0.000015896,-0.000000925],[0.000015830,-0.000000930],[0.000015764,-0.000000934],[0.000015698,-0.000000937],[0.000015631,-0.000000940],[0.000015564,-0.000000942],[0.000015497,-0.000000943],[0.000015429,-0.000000944],[0.000015362,-0.000000943],[0.000015294,-0.000000942],[0.000015227,-0.000000940],[0.000015159,-0.000000938],[0.000015092,-0.000000935],[0.000015025,-0.000000931],[0.000014959,-0.000000927],[0.000014893,-0.000000922],[0.000014827,-0.000000917],[0.000014762,-0.000000911],[0.000014698,-0.000000905],[0.000014635,-0.000000898],[0.000014572,-0.000000891],[0.000014510,-0.000000883],[0.000014448,-0.000000874],[0.000014386,-0.000000864],[0.000014322,-0.000000853],[0.000014255,-0.000000839],[0.000014183,-0.000000822],[0.000014106,-0.000000798],[0.000014032,-0.000000778],[0.000013943,-0.000000758],[0.000013857,-0.000000737],[0.000013776,-0.000000718],[0.000013702,-0.000000703],[0.000013639,-0.000000696],[0.000013576,-0.000000688],[0.000013505,-0.000000664],[0.000013428,-0.000000645],[0.000013356,-0.000000635],[0.000013287,-0.000000626],[0.000013206,-0.000000615],[0.000013113,-0.000000606],[0.000013032,-0.000000600],[0.000012966,-0.000000596],[0.000012903,-0.000000591],[0.000012814,-0.000000571],[0.000012718,-0.000000552],[0.000012626,-0.000000538],[0.000012547,-0.000000524],[0.000012469,-0.000000513],[0.000012388,-0.000000503],[0.000012303,-0.000000496],[0.000012217,-0.000000488],[0.000012141,-0.000000468],[0.000012064,-0.000000449],[0.000011984,-0.000000435],[0.000011904,-0.000000423],[0.000011825,-0.000000409],[0.000011755,-0.000000391],[0.000011692,-0.000000375],[0.000011631,-0.000000363],[0.000011564,-0.000000350],[0.000011491,-0.000000335],[0.000011427,-0.000000316],[0.000011366,-0.000000293],[0.000011293,-0.000000270],[0.000011214,-0.000000249],[0.000011142,-0.000000233],[0.000011077,-0.000000220],[0.000011012,-0.000000206],[0.000010939,-0.000000188],[0.000010863,-0.000000168],[0.000010806,-0.000000156],[0.000010751,-0.000000158],[0.000010685,-0.000000159],[0.000010616,-0.000000141],[0.000010550,-0.000000120],[0.000010487,-0.000000102],[0.000010426,-0.000000087],[0.000010360,-0.000000072],[0.000010287,-0.000000058],[0.000010215,-0.000000051],[0.000010151,-0.000000052],[0.000010088,-0.000000043],[0.000010022,-0.000000009],[0.000009953,0.000000031],[0.000009890,0.000000059],[0.000009839,0.000000065],[0.000009790,0.000000060],[0.000009727,0.000000056],[0.000009651,0.000000066],[0.000009571,0.000000094],[0.000009508,0.000000103],[0.000009471,0.000000119],[0.000009436,0.000000141],[0.000009386,0.000000157],[0.000009320,0.000000166],[0.000009248,0.000000172],[0.000009196,0.000000186],[0.000009146,0.000000195],[0.000009090,0.000000206],[0.000009025,0.000000216],[0.000008964,0.000000213],[0.000008906,0.000000210],[0.000008849,0.000000214],[0.000008793,0.000000223],[0.000008735,0.000000243],[0.000008680,0.000000263],[0.000008627,0.000000281],[0.000008574,0.000000295],[0.000008517,0.000000301],[0.000008458,0.000000306],[0.000008397,0.000000316],[0.000008339,0.000000339],[0.000008279,0.000000365],[0.000008216,0.000000386],[0.000008153,0.000000405],[0.000008088,0.000000422],[0.000008024,0.000000438],[0.000007959,0.000000454],[0.000007894,0.000000470],[0.000007829,0.000000484],[0.000007765,0.000000499],[0.000007701,0.000000514],[0.000007638,0.000000528],[0.000007575,0.000000542],[0.000007512,0.000000556],[0.000007451,0.000000569],[0.000007389,0.000000583],[0.000007328,0.000000597],[0.000007267,0.000000611],[0.000007206,0.000000625],[0.000007146,0.000000638],[0.000007086,0.000000652],[0.000007026,0.000000666],[0.000006966,0.000000680],[0.000006906,0.000000694],[0.000006846,0.000000707],[0.000006786,0.000000721],[0.000016998,-0.000000755],[0.000016939,-0.000000766],[0.000016881,-0.000000778],[0.000016822,-0.000000789],[0.000016764,-0.000000801],[0.000016705,-0.000000813],[0.000016646,-0.000000824],[0.000016587,-0.000000835],[0.000016528,-0.000000847],[0.000016468,-0.000000858],[0.000016409,-0.000000868],[0.000016348,-0.000000879],[0.000016288,-0.000000889],[0.000016226,-0.000000898],[0.000016164,-0.000000907],[0.000016102,-0.000000916],[0.000016039,-0.000000924],[0.000015976,-0.000000931],[0.000015911,-0.000000937],[0.000015847,-0.000000943],[0.000015781,-0.000000948],[0.000015716,-0.000000952],[0.000015649,-0.000000956],[0.000015583,-0.000000958],[0.000015516,-0.000000960],[0.000015449,-0.000000961],[0.000015381,-0.000000961],[0.000015313,-0.000000961],[0.000015246,-0.000000960],[0.000015178,-0.000000958],[0.000015111,-0.000000955],[0.000015044,-0.000000952],[0.000014977,-0.000000948],[0.000014911,-0.000000943],[0.000014845,-0.000000939],[0.000014780,-0.000000933],[0.000014715,-0.000000927],[0.000014652,-0.000000920],[0.000014588,-0.000000913],[0.000014525,-0.000000906],[0.000014462,-0.000000898],[0.000014399,-0.000000890],[0.000014335,-0.000000880],[0.000014268,-0.000000869],[0.000014197,-0.000000855],[0.000014123,-0.000000827],[0.000014046,-0.000000793],[0.000013963,-0.000000775],[0.000013880,-0.000000759],[0.000013801,-0.000000744],[0.000013727,-0.000000733],[0.000013659,-0.000000727],[0.000013592,-0.000000721],[0.000013523,-0.000000689],[0.000013454,-0.000000674],[0.000013387,-0.000000670],[0.000013315,-0.000000658],[0.000013235,-0.000000644],[0.000013150,-0.000000632],[0.000013072,-0.000000624],[0.000013002,-0.000000619],[0.000012934,-0.000000614],[0.000012844,-0.000000596],[0.000012754,-0.000000579],[0.000012670,-0.000000563],[0.000012593,-0.000000547],[0.000012511,-0.000000534],[0.000012425,-0.000000524],[0.000012338,-0.000000515],[0.000012254,-0.000000507],[0.000012178,-0.000000498],[0.000012103,-0.000000487],[0.000012025,-0.000000473],[0.000011949,-0.000000460],[0.000011873,-0.000000440],[0.000011802,-0.000000419],[0.000011735,-0.000000402],[0.000011667,-0.000000387],[0.000011596,-0.000000373],[0.000011525,-0.000000357],[0.000011458,-0.000000334],[0.000011396,-0.000000306],[0.000011329,-0.000000287],[0.000011256,-0.000000272],[0.000011181,-0.000000259],[0.000011108,-0.000000245],[0.000011038,-0.000000228],[0.000010972,-0.000000209],[0.000010914,-0.000000187],[0.000010864,-0.000000170],[0.000010794,-0.000000172],[0.000010713,-0.000000178],[0.000010640,-0.000000168],[0.000010572,-0.000000149],[0.000010508,-0.000000128],[0.000010441,-0.000000111],[0.000010370,-0.000000096],[0.000010298,-0.000000084],[0.000010231,-0.000000080],[0.000010177,-0.000000089],[0.000010117,-0.000000084],[0.000010052,-0.000000062],[0.000009985,-0.000000032],[0.000009923,-0.000000002],[0.000009867,0.000000021],[0.000009810,0.000000032],[0.000009750,0.000000037],[0.000009685,0.000000052],[0.000009616,0.000000069],[0.000009554,0.000000062],[0.000009511,0.000000077],[0.000009473,0.000000101],[0.000009423,0.000000120],[0.000009355,0.000000130],[0.000009282,0.000000135],[0.000009225,0.000000143],[0.000009176,0.000000151],[0.000009122,0.000000160],[0.000009046,0.000000166],[0.000008984,0.000000166],[0.000008927,0.000000167],[0.000008869,0.000000174],[0.000008810,0.000000188],[0.000008751,0.000000206],[0.000008697,0.000000223],[0.000008645,0.000000237],[0.000008592,0.000000250],[0.000008538,0.000000260],[0.000008482,0.000000270],[0.000008425,0.000000286],[0.000008367,0.000000309],[0.000008306,0.000000332],[0.000008242,0.000000350],[0.000008177,0.000000366],[0.000008112,0.000000382],[0.000008046,0.000000398],[0.000007980,0.000000414],[0.000007915,0.000000429],[0.000007850,0.000000444],[0.000007786,0.000000459],[0.000007722,0.000000473],[0.000007659,0.000000488],[0.000007596,0.000000502],[0.000007533,0.000000517],[0.000007471,0.000000531],[0.000007409,0.000000545],[0.000007348,0.000000559],[0.000007287,0.000000573],[0.000007227,0.000000587],[0.000007167,0.000000601],[0.000007106,0.000000615],[0.000007046,0.000000629],[0.000006986,0.000000643],[0.000006926,0.000000657],[0.000006866,0.000000671],[0.000006806,0.000000685],[0.000016987,-0.000000754],[0.000016930,-0.000000766],[0.000016873,-0.000000778],[0.000016817,-0.000000790],[0.000016760,-0.000000802],[0.000016703,-0.000000815],[0.000016646,-0.000000827],[0.000016589,-0.000000839],[0.000016531,-0.000000851],[0.000016473,-0.000000862],[0.000016415,-0.000000874],[0.000016356,-0.000000885],[0.000016297,-0.000000896],[0.000016237,-0.000000906],[0.000016176,-0.000000916],[0.000016115,-0.000000925],[0.000016053,-0.000000934],[0.000015991,-0.000000942],[0.000015928,-0.000000949],[0.000015864,-0.000000956],[0.000015800,-0.000000962],[0.000015734,-0.000000967],[0.000015669,-0.000000971],[0.000015602,-0.000000974],[0.000015536,-0.000000977],[0.000015469,-0.000000978],[0.000015402,-0.000000979],[0.000015334,-0.000000979],[0.000015266,-0.000000979],[0.000015199,-0.000000977],[0.000015131,-0.000000975],[0.000015064,-0.000000972],[0.000014996,-0.000000968],[0.000014930,-0.000000964],[0.000014864,-0.000000959],[0.000014798,-0.000000954],[0.000014732,-0.000000948],[0.000014668,-0.000000942],[0.000014603,-0.000000935],[0.000014539,-0.000000927],[0.000014475,-0.000000920],[0.000014411,-0.000000912],[0.000014346,-0.000000903],[0.000014280,-0.000000891],[0.000014211,-0.000000874],[0.000014138,-0.000000848],[0.000014062,-0.000000818],[0.000013984,-0.000000798],[0.000013905,-0.000000783],[0.000013828,-0.000000769],[0.000013753,-0.000000759],[0.000013680,-0.000000749],[0.000013608,-0.000000733],[0.000013540,-0.000000715],[0.000013475,-0.000000704],[0.000013410,-0.000000696],[0.000013341,-0.000000683],[0.000013266,-0.000000669],[0.000013187,-0.000000656],[0.000013107,-0.000000647],[0.000013027,-0.000000638],[0.000012947,-0.000000628],[0.000012862,-0.000000614],[0.000012784,-0.000000605],[0.000012712,-0.000000590],[0.000012638,-0.000000571],[0.000012549,-0.000000559],[0.000012459,-0.000000546],[0.000012373,-0.000000532],[0.000012293,-0.000000523],[0.000012217,-0.000000523],[0.000012142,-0.000000518],[0.000012064,-0.000000501],[0.000011988,-0.000000480],[0.000011915,-0.000000460],[0.000011845,-0.000000442],[0.000011774,-0.000000427],[0.000011703,-0.000000411],[0.000011628,-0.000000392],[0.000011554,-0.000000369],[0.000011484,-0.000000342],[0.000011420,-0.000000317],[0.000011359,-0.000000305],[0.000011293,-0.000000296],[0.000011216,-0.000000285],[0.000011138,-0.000000272],[0.000011067,-0.000000255],[0.000011008,-0.000000236],[0.000010955,-0.000000216],[0.000010897,-0.000000202],[0.000010821,-0.000000199],[0.000010736,-0.000000199],[0.000010655,-0.000000192],[0.000010584,-0.000000175],[0.000010523,-0.000000152],[0.000010455,-0.000000137],[0.000010386,-0.000000126],[0.000010320,-0.000000121],[0.000010262,-0.000000122],[0.000010210,-0.000000130],[0.000010150,-0.000000124],[0.000010083,-0.000000105],[0.000010015,-0.000000079],[0.000009951,-0.000000049],[0.000009890,-0.000000018],[0.000009830,0.000000001],[0.000009770,0.000000008],[0.000009710,0.000000011],[0.000009651,0.000000006],[0.000009598,0.000000013],[0.000009555,0.000000038],[0.000009516,0.000000067],[0.000009467,0.000000089],[0.000009393,0.000000094],[0.000009316,0.000000093],[0.000009252,0.000000095],[0.000009200,0.000000100],[0.000009149,0.000000107],[0.000009074,0.000000108],[0.000009010,0.000000116],[0.000008953,0.000000124],[0.000008893,0.000000135],[0.000008830,0.000000153],[0.000008765,0.000000173],[0.000008716,0.000000183],[0.000008664,0.000000194],[0.000008611,0.000000206],[0.000008558,0.000000218],[0.000008504,0.000000233],[0.000008448,0.000000251],[0.000008390,0.000000272],[0.000008329,0.000000292],[0.000008265,0.000000310],[0.000008199,0.000000326],[0.000008133,0.000000342],[0.000008067,0.000000358],[0.000008001,0.000000373],[0.000007935,0.000000389],[0.000007870,0.000000404],[0.000007806,0.000000419],[0.000007742,0.000000434],[0.000007678,0.000000449],[0.000007616,0.000000463],[0.000007553,0.000000478],[0.000007491,0.000000492],[0.000007430,0.000000507],[0.000007369,0.000000521],[0.000007308,0.000000536],[0.000007247,0.000000550],[0.000007187,0.000000564],[0.000007127,0.000000578],[0.000007066,0.000000593],[0.000007006,0.000000607],[0.000006946,0.000000621],[0.000006886,0.000000635],[0.000006826,0.000000649],[0.000016976,-0.000000754],[0.000016921,-0.000000766],[0.000016866,-0.000000779],[0.000016811,-0.000000791],[0.000016756,-0.000000804],[0.000016700,-0.000000817],[0.000016645,-0.000000829],[0.000016590,-0.000000842],[0.000016534,-0.000000854],[0.000016478,-0.000000866],[0.000016421,-0.000000879],[0.000016364,-0.000000890],[0.000016306,-0.000000902],[0.000016248,-0.000000913],[0.000016189,-0.000000924],[0.000016129,-0.000000934],[0.000016069,-0.000000943],[0.000016007,-0.000000952],[0.000015945,-0.000000961],[0.000015882,-0.000000968],[0.000015819,-0.000000975],[0.000015754,-0.000000981],[0.000015689,-0.000000986],[0.000015623,-0.000000990],[0.000015557,-0.000000993],[0.000015490,-0.000000995],[0.000015423,-0.000000997],[0.000015355,-0.000000997],[0.000015288,-0.000000997],[0.000015220,-0.000000996],[0.000015152,-0.000000994],[0.000015084,-0.000000992],[0.000015017,-0.000000988],[0.000014949,-0.000000984],[0.000014882,-0.000000980],[0.000014816,-0.000000975],[0.000014750,-0.000000969],[0.000014684,-0.000000962],[0.000014618,-0.000000955],[0.000014553,-0.000000947],[0.000014487,-0.000000939],[0.000014422,-0.000000930],[0.000014357,-0.000000920],[0.000014292,-0.000000907],[0.000014225,-0.000000890],[0.000014156,-0.000000869],[0.000014082,-0.000000846],[0.000014006,-0.000000826],[0.000013931,-0.000000809],[0.000013855,-0.000000795],[0.000013779,-0.000000783],[0.000013702,-0.000000771],[0.000013629,-0.000000757],[0.000013559,-0.000000746],[0.000013493,-0.000000736],[0.000013429,-0.000000724],[0.000013365,-0.000000707],[0.000013298,-0.000000690],[0.000013221,-0.000000679],[0.000013138,-0.000000671],[0.000013055,-0.000000663],[0.000012972,-0.000000652],[0.000012888,-0.000000644],[0.000012808,-0.000000639],[0.000012734,-0.000000627],[0.000012658,-0.000000607],[0.000012574,-0.000000589],[0.000012488,-0.000000572],[0.000012405,-0.000000557],[0.000012326,-0.000000547],[0.000012250,-0.000000543],[0.000012174,-0.000000536],[0.000012097,-0.000000519],[0.000012022,-0.000000496],[0.000011952,-0.000000477],[0.000011883,-0.000000463],[0.000011810,-0.000000451],[0.000011734,-0.000000435],[0.000011656,-0.000000413],[0.000011581,-0.000000387],[0.000011509,-0.000000364],[0.000011444,-0.000000342],[0.000011385,-0.000000332],[0.000011322,-0.000000323],[0.000011245,-0.000000311],[0.000011165,-0.000000299],[0.000011092,-0.000000286],[0.000011038,-0.000000266],[0.000010988,-0.000000249],[0.000010926,-0.000000238],[0.000010846,-0.000000231],[0.000010758,-0.000000225],[0.000010666,-0.000000216],[0.000010588,-0.000000201],[0.000010529,-0.000000182],[0.000010471,-0.000000168],[0.000010409,-0.000000161],[0.000010348,-0.000000159],[0.000010293,-0.000000159],[0.000010238,-0.000000160],[0.000010177,-0.000000153],[0.000010110,-0.000000137],[0.000010042,-0.000000114],[0.000009976,-0.000000088],[0.000009911,-0.000000061],[0.000009848,-0.000000041],[0.000009788,-0.000000034],[0.000009732,-0.000000033],[0.000009679,-0.000000032],[0.000009631,-0.000000020],[0.000009587,0.000000004],[0.000009547,0.000000031],[0.000009498,0.000000053],[0.000009417,0.000000053],[0.000009342,0.000000049],[0.000009274,0.000000046],[0.000009216,0.000000050],[0.000009161,0.000000061],[0.000009099,0.000000068],[0.000009038,0.000000074],[0.000008980,0.000000082],[0.000008924,0.000000095],[0.000008862,0.000000114],[0.000008793,0.000000131],[0.000008735,0.000000142],[0.000008681,0.000000151],[0.000008629,0.000000162],[0.000008577,0.000000176],[0.000008523,0.000000193],[0.000008467,0.000000212],[0.000008408,0.000000231],[0.000008347,0.000000250],[0.000008283,0.000000268],[0.000008218,0.000000285],[0.000008152,0.000000302],[0.000008086,0.000000317],[0.000008020,0.000000333],[0.000007954,0.000000349],[0.000007889,0.000000364],[0.000007825,0.000000379],[0.000007761,0.000000395],[0.000007698,0.000000410],[0.000007635,0.000000425],[0.000007573,0.000000440],[0.000007511,0.000000454],[0.000007450,0.000000469],[0.000007389,0.000000484],[0.000007328,0.000000498],[0.000007268,0.000000513],[0.000007207,0.000000528],[0.000007147,0.000000542],[0.000007087,0.000000556],[0.000007027,0.000000571],[0.000006967,0.000000585],[0.000006907,0.000000599],[0.000006847,0.000000613],[0.000016964,-0.000000754],[0.000016911,-0.000000767],[0.000016857,-0.000000780],[0.000016804,-0.000000793],[0.000016751,-0.000000806],[0.000016698,-0.000000819],[0.000016644,-0.000000832],[0.000016590,-0.000000845],[0.000016536,-0.000000857],[0.000016482,-0.000000870],[0.000016427,-0.000000883],[0.000016372,-0.000000895],[0.000016316,-0.000000908],[0.000016259,-0.000000919],[0.000016202,-0.000000931],[0.000016143,-0.000000942],[0.000016084,-0.000000952],[0.000016024,-0.000000962],[0.000015963,-0.000000971],[0.000015901,-0.000000979],[0.000015839,-0.000000987],[0.000015775,-0.000000994],[0.000015711,-0.000000999],[0.000015645,-0.000001004],[0.000015579,-0.000001008],[0.000015513,-0.000001011],[0.000015446,-0.000001013],[0.000015378,-0.000001015],[0.000015310,-0.000001015],[0.000015242,-0.000001015],[0.000015174,-0.000001013],[0.000015106,-0.000001011],[0.000015037,-0.000001008],[0.000014969,-0.000001004],[0.000014902,-0.000001000],[0.000014834,-0.000000995],[0.000014767,-0.000000989],[0.000014700,-0.000000982],[0.000014633,-0.000000974],[0.000014567,-0.000000966],[0.000014500,-0.000000956],[0.000014434,-0.000000946],[0.000014369,-0.000000934],[0.000014306,-0.000000921],[0.000014243,-0.000000906],[0.000014178,-0.000000889],[0.000014108,-0.000000872],[0.000014033,-0.000000853],[0.000013960,-0.000000836],[0.000013883,-0.000000821],[0.000013803,-0.000000808],[0.000013725,-0.000000797],[0.000013650,-0.000000786],[0.000013579,-0.000000777],[0.000013512,-0.000000768],[0.000013447,-0.000000756],[0.000013386,-0.000000736],[0.000013325,-0.000000715],[0.000013250,-0.000000703],[0.000013162,-0.000000701],[0.000013084,-0.000000691],[0.000013003,-0.000000679],[0.000012915,-0.000000672],[0.000012827,-0.000000674],[0.000012746,-0.000000665],[0.000012670,-0.000000642],[0.000012591,-0.000000620],[0.000012511,-0.000000601],[0.000012431,-0.000000586],[0.000012354,-0.000000573],[0.000012278,-0.000000563],[0.000012202,-0.000000553],[0.000012126,-0.000000538],[0.000012054,-0.000000519],[0.000011985,-0.000000502],[0.000011916,-0.000000487],[0.000011840,-0.000000477],[0.000011761,-0.000000465],[0.000011683,-0.000000444],[0.000011609,-0.000000418],[0.000011537,-0.000000403],[0.000011470,-0.000000385],[0.000011410,-0.000000366],[0.000011344,-0.000000350],[0.000011269,-0.000000337],[0.000011192,-0.000000324],[0.000011121,-0.000000310],[0.000011065,-0.000000293],[0.000011017,-0.000000278],[0.000010955,-0.000000272],[0.000010877,-0.000000269],[0.000010788,-0.000000250],[0.000010687,-0.000000238],[0.000010600,-0.000000226],[0.000010549,-0.000000211],[0.000010498,-0.000000200],[0.000010441,-0.000000195],[0.000010381,-0.000000192],[0.000010322,-0.000000189],[0.000010261,-0.000000183],[0.000010197,-0.000000174],[0.000010130,-0.000000161],[0.000010064,-0.000000144],[0.000009998,-0.000000124],[0.000009932,-0.000000105],[0.000009867,-0.000000090],[0.000009806,-0.000000081],[0.000009751,-0.000000073],[0.000009702,-0.000000064],[0.000009655,-0.000000049],[0.000009606,-0.000000032],[0.000009551,-0.000000015],[0.000009486,-0.000000004],[0.000009422,0.000000003],[0.000009364,0.000000008],[0.000009300,0.000000008],[0.000009236,0.000000016],[0.000009179,0.000000032],[0.000009119,0.000000036],[0.000009058,0.000000037],[0.000009003,0.000000043],[0.000008953,0.000000056],[0.000008892,0.000000072],[0.000008819,0.000000086],[0.000008755,0.000000097],[0.000008701,0.000000107],[0.000008649,0.000000118],[0.000008596,0.000000132],[0.000008541,0.000000150],[0.000008484,0.000000169],[0.000008424,0.000000188],[0.000008363,0.000000207],[0.000008299,0.000000226],[0.000008234,0.000000243],[0.000008168,0.000000260],[0.000008103,0.000000277],[0.000008037,0.000000293],[0.000007972,0.000000309],[0.000007907,0.000000325],[0.000007843,0.000000340],[0.000007779,0.000000356],[0.000007716,0.000000371],[0.000007654,0.000000386],[0.000007592,0.000000402],[0.000007531,0.000000417],[0.000007469,0.000000432],[0.000007409,0.000000447],[0.000007348,0.000000462],[0.000007288,0.000000476],[0.000007228,0.000000491],[0.000007168,0.000000506],[0.000007108,0.000000520],[0.000007048,0.000000535],[0.000006988,0.000000549],[0.000006928,0.000000564],[0.000006868,0.000000578],[0.000016952,-0.000000756],[0.000016900,-0.000000769],[0.000016849,-0.000000782],[0.000016798,-0.000000795],[0.000016746,-0.000000808],[0.000016695,-0.000000821],[0.000016643,-0.000000834],[0.000016591,-0.000000847],[0.000016539,-0.000000860],[0.000016486,-0.000000874],[0.000016434,-0.000000887],[0.000016380,-0.000000900],[0.000016325,-0.000000912],[0.000016270,-0.000000925],[0.000016215,-0.000000937],[0.000016158,-0.000000949],[0.000016100,-0.000000960],[0.000016042,-0.000000971],[0.000015982,-0.000000981],[0.000015921,-0.000000990],[0.000015859,-0.000000998],[0.000015797,-0.000001006],[0.000015733,-0.000001013],[0.000015668,-0.000001019],[0.000015603,-0.000001023],[0.000015537,-0.000001027],[0.000015470,-0.000001030],[0.000015402,-0.000001032],[0.000015334,-0.000001033],[0.000015266,-0.000001033],[0.000015197,-0.000001032],[0.000015128,-0.000001030],[0.000015059,-0.000001027],[0.000014990,-0.000001024],[0.000014922,-0.000001019],[0.000014853,-0.000001014],[0.000014785,-0.000001008],[0.000014717,-0.000001001],[0.000014649,-0.000000993],[0.000014582,-0.000000983],[0.000014514,-0.000000973],[0.000014448,-0.000000960],[0.000014383,-0.000000946],[0.000014322,-0.000000932],[0.000014265,-0.000000919],[0.000014204,-0.000000908],[0.000014140,-0.000000896],[0.000014070,-0.000000879],[0.000013993,-0.000000859],[0.000013908,-0.000000844],[0.000013824,-0.000000835],[0.000013744,-0.000000826],[0.000013670,-0.000000817],[0.000013600,-0.000000808],[0.000013534,-0.000000799],[0.000013467,-0.000000789],[0.000013403,-0.000000772],[0.000013335,-0.000000754],[0.000013265,-0.000000739],[0.000013188,-0.000000730],[0.000013113,-0.000000718],[0.000013032,-0.000000705],[0.000012943,-0.000000694],[0.000012851,-0.000000691],[0.000012765,-0.000000687],[0.000012686,-0.000000666],[0.000012610,-0.000000646],[0.000012532,-0.000000630],[0.000012453,-0.000000617],[0.000012375,-0.000000604],[0.000012301,-0.000000589],[0.000012226,-0.000000574],[0.000012153,-0.000000561],[0.000012079,-0.000000546],[0.000012008,-0.000000531],[0.000011937,-0.000000518],[0.000011864,-0.000000508],[0.000011789,-0.000000501],[0.000011712,-0.000000494],[0.000011641,-0.000000472],[0.000011576,-0.000000441],[0.000011507,-0.000000417],[0.000011440,-0.000000396],[0.000011369,-0.000000379],[0.000011294,-0.000000364],[0.000011218,-0.000000349],[0.000011147,-0.000000334],[0.000011085,-0.000000319],[0.000011030,-0.000000304],[0.000010964,-0.000000295],[0.000010894,-0.000000287],[0.000010826,-0.000000268],[0.000010742,-0.000000251],[0.000010657,-0.000000236],[0.000010597,-0.000000235],[0.000010540,-0.000000231],[0.000010479,-0.000000225],[0.000010415,-0.000000221],[0.000010350,-0.000000215],[0.000010283,-0.000000206],[0.000010215,-0.000000194],[0.000010147,-0.000000183],[0.000010083,-0.000000172],[0.000010020,-0.000000160],[0.000009956,-0.000000148],[0.000009890,-0.000000136],[0.000009825,-0.000000125],[0.000009772,-0.000000110],[0.000009724,-0.000000094],[0.000009674,-0.000000080],[0.000009617,-0.000000070],[0.000009553,-0.000000062],[0.000009487,-0.000000055],[0.000009435,-0.000000043],[0.000009393,-0.000000026],[0.000009336,-0.000000012],[0.000009271,0.000000005],[0.000009205,0.000000013],[0.000009137,0.000000001],[0.000009073,-0.000000001],[0.000009014,0.000000005],[0.000008955,0.000000015],[0.000008894,0.000000028],[0.000008831,0.000000041],[0.000008775,0.000000050],[0.000008723,0.000000059],[0.000008669,0.000000071],[0.000008614,0.000000087],[0.000008557,0.000000106],[0.000008498,0.000000125],[0.000008438,0.000000145],[0.000008375,0.000000164],[0.000008312,0.000000183],[0.000008248,0.000000201],[0.000008183,0.000000219],[0.000008118,0.000000236],[0.000008053,0.000000253],[0.000007988,0.000000269],[0.000007924,0.000000286],[0.000007860,0.000000302],[0.000007797,0.000000317],[0.000007734,0.000000333],[0.000007672,0.000000349],[0.000007611,0.000000364],[0.000007550,0.000000379],[0.000007489,0.000000395],[0.000007429,0.000000410],[0.000007368,0.000000425],[0.000007308,0.000000440],[0.000007248,0.000000455],[0.000007188,0.000000470],[0.000007129,0.000000485],[0.000007069,0.000000499],[0.000007009,0.000000514],[0.000006949,0.000000529],[0.000006889,0.000000543],[0.000016939,-0.000000759],[0.000016889,-0.000000771],[0.000016840,-0.000000784],[0.000016790,-0.000000797],[0.000016741,-0.000000810],[0.000016692,-0.000000823],[0.000016642,-0.000000837],[0.000016592,-0.000000850],[0.000016541,-0.000000863],[0.000016491,-0.000000877],[0.000016440,-0.000000890],[0.000016388,-0.000000903],[0.000016335,-0.000000917],[0.000016282,-0.000000930],[0.000016228,-0.000000942],[0.000016173,-0.000000955],[0.000016117,-0.000000967],[0.000016060,-0.000000978],[0.000016001,-0.000000989],[0.000015942,-0.000001000],[0.000015881,-0.000001009],[0.000015820,-0.000001018],[0.000015757,-0.000001025],[0.000015693,-0.000001032],[0.000015628,-0.000001038],[0.000015562,-0.000001042],[0.000015495,-0.000001046],[0.000015427,-0.000001049],[0.000015359,-0.000001050],[0.000015290,-0.000001051],[0.000015221,-0.000001050],[0.000015152,-0.000001049],[0.000015082,-0.000001046],[0.000015012,-0.000001043],[0.000014943,-0.000001038],[0.000014873,-0.000001033],[0.000014804,-0.000001027],[0.000014735,-0.000001019],[0.000014666,-0.000001011],[0.000014598,-0.000001001],[0.000014531,-0.000000989],[0.000014465,-0.000000975],[0.000014402,-0.000000959],[0.000014345,-0.000000943],[0.000014291,-0.000000929],[0.000014233,-0.000000921],[0.000014170,-0.000000917],[0.000014102,-0.000000908],[0.000014018,-0.000000878],[0.000013925,-0.000000868],[0.000013840,-0.000000863],[0.000013762,-0.000000855],[0.000013688,-0.000000846],[0.000013620,-0.000000837],[0.000013558,-0.000000828],[0.000013498,-0.000000817],[0.000013421,-0.000000811],[0.000013339,-0.000000803],[0.000013274,-0.000000780],[0.000013205,-0.000000760],[0.000013131,-0.000000745],[0.000013052,-0.000000733],[0.000012967,-0.000000724],[0.000012880,-0.000000716],[0.000012795,-0.000000703],[0.000012711,-0.000000683],[0.000012634,-0.000000668],[0.000012555,-0.000000656],[0.000012474,-0.000000646],[0.000012395,-0.000000635],[0.000012322,-0.000000616],[0.000012250,-0.000000599],[0.000012177,-0.000000586],[0.000012101,-0.000000573],[0.000012025,-0.000000560],[0.000011953,-0.000000548],[0.000011889,-0.000000538],[0.000011823,-0.000000530],[0.000011754,-0.000000520],[0.000011686,-0.000000497],[0.000011619,-0.000000465],[0.000011544,-0.000000442],[0.000011471,-0.000000423],[0.000011399,-0.000000407],[0.000011322,-0.000000392],[0.000011245,-0.000000378],[0.000011171,-0.000000362],[0.000011104,-0.000000347],[0.000011037,-0.000000333],[0.000010962,-0.000000318],[0.000010905,-0.000000307],[0.000010856,-0.000000296],[0.000010798,-0.000000282],[0.000010730,-0.000000269],[0.000010660,-0.000000263],[0.000010587,-0.000000257],[0.000010514,-0.000000250],[0.000010444,-0.000000246],[0.000010375,-0.000000241],[0.000010305,-0.000000232],[0.000010232,-0.000000219],[0.000010162,-0.000000208],[0.000010102,-0.000000202],[0.000010043,-0.000000196],[0.000009981,-0.000000187],[0.000009917,-0.000000175],[0.000009854,-0.000000160],[0.000009798,-0.000000142],[0.000009745,-0.000000124],[0.000009688,-0.000000114],[0.000009627,-0.000000110],[0.000009564,-0.000000106],[0.000009506,-0.000000100],[0.000009458,-0.000000087],[0.000009415,-0.000000067],[0.000009361,-0.000000049],[0.000009298,-0.000000034],[0.000009226,-0.000000033],[0.000009152,-0.000000044],[0.000009088,-0.000000037],[0.000009025,-0.000000028],[0.000008957,-0.000000023],[0.000008895,-0.000000016],[0.000008836,-0.000000005],[0.000008795,-0.000000001],[0.000008745,0.000000009],[0.000008689,0.000000024],[0.000008631,0.000000042],[0.000008571,0.000000061],[0.000008510,0.000000081],[0.000008449,0.000000101],[0.000008386,0.000000121],[0.000008323,0.000000141],[0.000008259,0.000000159],[0.000008195,0.000000178],[0.000008131,0.000000196],[0.000008067,0.000000213],[0.000008003,0.000000230],[0.000007939,0.000000247],[0.000007876,0.000000263],[0.000007814,0.000000279],[0.000007752,0.000000295],[0.000007691,0.000000311],[0.000007629,0.000000327],[0.000007569,0.000000343],[0.000007509,0.000000358],[0.000007448,0.000000373],[0.000007388,0.000000389],[0.000007329,0.000000404],[0.000007269,0.000000419],[0.000007209,0.000000434],[0.000007150,0.000000449],[0.000007090,0.000000464],[0.000007031,0.000000479],[0.000006971,0.000000494],[0.000006911,0.000000508],[0.000016926,-0.000000763],[0.000016878,-0.000000775],[0.000016831,-0.000000788],[0.000016783,-0.000000800],[0.000016736,-0.000000813],[0.000016688,-0.000000826],[0.000016640,-0.000000839],[0.000016592,-0.000000853],[0.000016544,-0.000000866],[0.000016495,-0.000000879],[0.000016446,-0.000000893],[0.000016396,-0.000000906],[0.000016345,-0.000000920],[0.000016294,-0.000000933],[0.000016241,-0.000000947],[0.000016188,-0.000000960],[0.000016134,-0.000000973],[0.000016078,-0.000000985],[0.000016021,-0.000000997],[0.000015963,-0.000001008],[0.000015904,-0.000001018],[0.000015843,-0.000001028],[0.000015781,-0.000001037],[0.000015718,-0.000001045],[0.000015654,-0.000001051],[0.000015588,-0.000001057],[0.000015522,-0.000001061],[0.000015454,-0.000001065],[0.000015386,-0.000001067],[0.000015317,-0.000001068],[0.000015247,-0.000001068],[0.000015177,-0.000001067],[0.000015106,-0.000001065],[0.000015036,-0.000001061],[0.000014965,-0.000001057],[0.000014894,-0.000001052],[0.000014824,-0.000001045],[0.000014754,-0.000001037],[0.000014685,-0.000001028],[0.000014616,-0.000001018],[0.000014550,-0.000001005],[0.000014485,-0.000000991],[0.000014425,-0.000000974],[0.000014370,-0.000000956],[0.000014318,-0.000000939],[0.000014262,-0.000000928],[0.000014192,-0.000000931],[0.000014109,-0.000000932],[0.000014019,-0.000000909],[0.000013931,-0.000000894],[0.000013853,-0.000000889],[0.000013779,-0.000000884],[0.000013707,-0.000000876],[0.000013637,-0.000000867],[0.000013575,-0.000000861],[0.000013512,-0.000000856],[0.000013438,-0.000000855],[0.000013361,-0.000000845],[0.000013292,-0.000000815],[0.000013219,-0.000000786],[0.000013142,-0.000000771],[0.000013061,-0.000000766],[0.000012981,-0.000000759],[0.000012905,-0.000000745],[0.000012830,-0.000000727],[0.000012750,-0.000000706],[0.000012667,-0.000000689],[0.000012583,-0.000000676],[0.000012501,-0.000000666],[0.000012423,-0.000000655],[0.000012347,-0.000000641],[0.000012273,-0.000000625],[0.000012199,-0.000000610],[0.000012121,-0.000000597],[0.000012046,-0.000000584],[0.000011978,-0.000000573],[0.000011918,-0.000000562],[0.000011860,-0.000000551],[0.000011798,-0.000000536],[0.000011723,-0.000000512],[0.000011647,-0.000000484],[0.000011570,-0.000000464],[0.000011498,-0.000000448],[0.000011430,-0.000000435],[0.000011350,-0.000000423],[0.000011275,-0.000000410],[0.000011205,-0.000000396],[0.000011139,-0.000000383],[0.000011073,-0.000000370],[0.000011001,-0.000000355],[0.000010943,-0.000000343],[0.000010897,-0.000000334],[0.000010858,-0.000000321],[0.000010801,-0.000000306],[0.000010718,-0.000000293],[0.000010626,-0.000000281],[0.000010541,-0.000000273],[0.000010465,-0.000000269],[0.000010396,-0.000000267],[0.000010328,-0.000000263],[0.000010253,-0.000000249],[0.000010184,-0.000000238],[0.000010123,-0.000000234],[0.000010066,-0.000000231],[0.000010006,-0.000000224],[0.000009941,-0.000000210],[0.000009880,-0.000000192],[0.000009823,-0.000000174],[0.000009763,-0.000000160],[0.000009700,-0.000000153],[0.000009638,-0.000000152],[0.000009580,-0.000000150],[0.000009528,-0.000000144],[0.000009479,-0.000000132],[0.000009431,-0.000000116],[0.000009378,-0.000000100],[0.000009316,-0.000000089],[0.000009246,-0.000000085],[0.000009175,-0.000000081],[0.000009109,-0.000000066],[0.000009043,-0.000000054],[0.000008973,-0.000000059],[0.000008909,-0.000000063],[0.000008858,-0.000000057],[0.000008819,-0.000000053],[0.000008764,-0.000000039],[0.000008704,-0.000000022],[0.000008643,-0.000000003],[0.000008582,0.000000017],[0.000008520,0.000000037],[0.000008457,0.000000058],[0.000008395,0.000000078],[0.000008332,0.000000099],[0.000008269,0.000000118],[0.000008206,0.000000137],[0.000008142,0.000000156],[0.000008079,0.000000174],[0.000008016,0.000000191],[0.000007954,0.000000209],[0.000007892,0.000000225],[0.000007830,0.000000242],[0.000007769,0.000000258],[0.000007708,0.000000274],[0.000007648,0.000000290],[0.000007588,0.000000306],[0.000007528,0.000000322],[0.000007468,0.000000337],[0.000007408,0.000000353],[0.000007349,0.000000368],[0.000007290,0.000000383],[0.000007230,0.000000399],[0.000007171,0.000000414],[0.000007112,0.000000429],[0.000007052,0.000000444],[0.000006993,0.000000459],[0.000006934,0.000000474],[0.000016913,-0.000000768],[0.000016867,-0.000000780],[0.000016822,-0.000000792],[0.000016776,-0.000000805],[0.000016730,-0.000000817],[0.000016684,-0.000000830],[0.000016639,-0.000000842],[0.000016592,-0.000000855],[0.000016546,-0.000000868],[0.000016499,-0.000000882],[0.000016452,-0.000000895],[0.000016404,-0.000000909],[0.000016355,-0.000000923],[0.000016305,-0.000000936],[0.000016255,-0.000000950],[0.000016203,-0.000000964],[0.000016151,-0.000000978],[0.000016097,-0.000000991],[0.000016041,-0.000001003],[0.000015985,-0.000001016],[0.000015927,-0.000001027],[0.000015868,-0.000001038],[0.000015807,-0.000001048],[0.000015744,-0.000001057],[0.000015681,-0.000001064],[0.000015616,-0.000001071],[0.000015550,-0.000001076],[0.000015482,-0.000001081],[0.000015414,-0.000001084],[0.000015345,-0.000001086],[0.000015274,-0.000001086],[0.000015204,-0.000001085],[0.000015132,-0.000001083],[0.000015060,-0.000001080],[0.000014989,-0.000001076],[0.000014917,-0.000001070],[0.000014846,-0.000001063],[0.000014775,-0.000001055],[0.000014705,-0.000001046],[0.000014637,-0.000001035],[0.000014570,-0.000001022],[0.000014507,-0.000001008],[0.000014448,-0.000000992],[0.000014392,-0.000000974],[0.000014340,-0.000000954],[0.000014284,-0.000000937],[0.000014208,-0.000000941],[0.000014121,-0.000000941],[0.000014028,-0.000000930],[0.000013942,-0.000000919],[0.000013869,-0.000000914],[0.000013798,-0.000000910],[0.000013728,-0.000000905],[0.000013657,-0.000000899],[0.000013586,-0.000000894],[0.000013520,-0.000000893],[0.000013452,-0.000000897],[0.000013382,-0.000000890],[0.000013309,-0.000000846],[0.000013233,-0.000000806],[0.000013154,-0.000000795],[0.000013072,-0.000000793],[0.000012994,-0.000000787],[0.000012924,-0.000000773],[0.000012856,-0.000000755],[0.000012785,-0.000000736],[0.000012697,-0.000000712],[0.000012613,-0.000000693],[0.000012534,-0.000000683],[0.000012455,-0.000000674],[0.000012376,-0.000000662],[0.000012298,-0.000000648],[0.000012224,-0.000000632],[0.000012149,-0.000000618],[0.000012072,-0.000000605],[0.000012007,-0.000000594],[0.000011951,-0.000000581],[0.000011894,-0.000000565],[0.000011830,-0.000000547],[0.000011747,-0.000000521],[0.000011665,-0.000000499],[0.000011589,-0.000000483],[0.000011521,-0.000000471],[0.000011453,-0.000000462],[0.000011377,-0.000000454],[0.000011312,-0.000000444],[0.000011250,-0.000000432],[0.000011190,-0.000000422],[0.000011134,-0.000000413],[0.000011073,-0.000000402],[0.000011006,-0.000000386],[0.000010952,-0.000000373],[0.000010918,-0.000000359],[0.000010861,-0.000000345],[0.000010755,-0.000000328],[0.000010648,-0.000000310],[0.000010555,-0.000000298],[0.000010477,-0.000000295],[0.000010409,-0.000000293],[0.000010344,-0.000000290],[0.000010270,-0.000000274],[0.000010201,-0.000000265],[0.000010141,-0.000000264],[0.000010085,-0.000000263],[0.000010027,-0.000000258],[0.000009951,-0.000000242],[0.000009892,-0.000000223],[0.000009845,-0.000000207],[0.000009781,-0.000000199],[0.000009712,-0.000000195],[0.000009652,-0.000000194],[0.000009598,-0.000000193],[0.000009548,-0.000000189],[0.000009499,-0.000000180],[0.000009448,-0.000000168],[0.000009393,-0.000000156],[0.000009331,-0.000000146],[0.000009265,-0.000000137],[0.000009198,-0.000000123],[0.000009132,-0.000000103],[0.000009066,-0.000000089],[0.000008995,-0.000000098],[0.000008930,-0.000000106],[0.000008877,-0.000000103],[0.000008828,-0.000000095],[0.000008773,-0.000000082],[0.000008713,-0.000000065],[0.000008652,-0.000000046],[0.000008589,-0.000000026],[0.000008527,-0.000000005],[0.000008465,0.000000016],[0.000008402,0.000000037],[0.000008340,0.000000058],[0.000008277,0.000000078],[0.000008215,0.000000097],[0.000008153,0.000000116],[0.000008091,0.000000135],[0.000008029,0.000000153],[0.000007968,0.000000171],[0.000007907,0.000000188],[0.000007846,0.000000205],[0.000007786,0.000000221],[0.000007726,0.000000238],[0.000007666,0.000000254],[0.000007606,0.000000270],[0.000007547,0.000000286],[0.000007488,0.000000301],[0.000007428,0.000000317],[0.000007369,0.000000333],[0.000007311,0.000000348],[0.000007252,0.000000363],[0.000007193,0.000000379],[0.000007134,0.000000394],[0.000007074,0.000000409],[0.000007016,0.000000424],[0.000006956,0.000000439],[0.000016900,-0.000000775],[0.000016856,-0.000000787],[0.000016812,-0.000000798],[0.000016768,-0.000000810],[0.000016725,-0.000000822],[0.000016681,-0.000000834],[0.000016637,-0.000000846],[0.000016592,-0.000000858],[0.000016548,-0.000000871],[0.000016503,-0.000000884],[0.000016457,-0.000000897],[0.000016411,-0.000000911],[0.000016365,-0.000000924],[0.000016317,-0.000000938],[0.000016269,-0.000000953],[0.000016219,-0.000000967],[0.000016168,-0.000000981],[0.000016116,-0.000000995],[0.000016062,-0.000001009],[0.000016007,-0.000001022],[0.000015951,-0.000001035],[0.000015893,-0.000001046],[0.000015833,-0.000001057],[0.000015772,-0.000001067],[0.000015709,-0.000001076],[0.000015645,-0.000001084],[0.000015579,-0.000001091],[0.000015512,-0.000001096],[0.000015443,-0.000001100],[0.000015374,-0.000001102],[0.000015303,-0.000001104],[0.000015232,-0.000001103],[0.000015160,-0.000001102],[0.000015087,-0.000001099],[0.000015014,-0.000001094],[0.000014941,-0.000001088],[0.000014869,-0.000001081],[0.000014797,-0.000001073],[0.000014727,-0.000001063],[0.000014659,-0.000001052],[0.000014592,-0.000001040],[0.000014529,-0.000001026],[0.000014468,-0.000001012],[0.000014409,-0.000000996],[0.000014350,-0.000000981],[0.000014289,-0.000000966],[0.000014219,-0.000000958],[0.000014139,-0.000000953],[0.000014050,-0.000000947],[0.000013965,-0.000000940],[0.000013888,-0.000000936],[0.000013817,-0.000000934],[0.000013749,-0.000000933],[0.000013676,-0.000000929],[0.000013596,-0.000000919],[0.000013531,-0.000000917],[0.000013470,-0.000000922],[0.000013403,-0.000000918],[0.000013328,-0.000000874],[0.000013249,-0.000000834],[0.000013168,-0.000000826],[0.000013087,-0.000000824],[0.000013007,-0.000000815],[0.000012936,-0.000000799],[0.000012863,-0.000000778],[0.000012787,-0.000000755],[0.000012712,-0.000000735],[0.000012640,-0.000000717],[0.000012567,-0.000000705],[0.000012489,-0.000000693],[0.000012408,-0.000000682],[0.000012330,-0.000000668],[0.000012257,-0.000000652],[0.000012185,-0.000000636],[0.000012111,-0.000000624],[0.000012044,-0.000000612],[0.000011984,-0.000000597],[0.000011924,-0.000000578],[0.000011850,-0.000000554],[0.000011759,-0.000000529],[0.000011681,-0.000000513],[0.000011613,-0.000000503],[0.000011551,-0.000000494],[0.000011488,-0.000000487],[0.000011424,-0.000000483],[0.000011360,-0.000000475],[0.000011296,-0.000000465],[0.000011241,-0.000000456],[0.000011193,-0.000000450],[0.000011139,-0.000000442],[0.000011063,-0.000000423],[0.000010996,-0.000000406],[0.000010942,-0.000000392],[0.000010872,-0.000000383],[0.000010764,-0.000000368],[0.000010657,-0.000000348],[0.000010561,-0.000000335],[0.000010482,-0.000000329],[0.000010414,-0.000000319],[0.000010347,-0.000000309],[0.000010277,-0.000000297],[0.000010211,-0.000000291],[0.000010150,-0.000000290],[0.000010091,-0.000000287],[0.000010027,-0.000000283],[0.000009947,-0.000000272],[0.000009890,-0.000000259],[0.000009850,-0.000000247],[0.000009797,-0.000000239],[0.000009732,-0.000000235],[0.000009672,-0.000000235],[0.000009617,-0.000000235],[0.000009566,-0.000000233],[0.000009517,-0.000000227],[0.000009467,-0.000000216],[0.000009410,-0.000000206],[0.000009346,-0.000000198],[0.000009278,-0.000000190],[0.000009213,-0.000000175],[0.000009150,-0.000000156],[0.000009086,-0.000000141],[0.000009018,-0.000000138],[0.000008952,-0.000000140],[0.000008892,-0.000000139],[0.000008834,-0.000000133],[0.000008777,-0.000000121],[0.000008718,-0.000000105],[0.000008657,-0.000000087],[0.000008595,-0.000000067],[0.000008532,-0.000000046],[0.000008470,-0.000000024],[0.000008408,-0.000000003],[0.000008346,0.000000018],[0.000008284,0.000000038],[0.000008223,0.000000058],[0.000008162,0.000000078],[0.000008102,0.000000097],[0.000008041,0.000000115],[0.000007981,0.000000133],[0.000007921,0.000000151],[0.000007862,0.000000168],[0.000007802,0.000000185],[0.000007743,0.000000201],[0.000007684,0.000000218],[0.000007625,0.000000234],[0.000007566,0.000000250],[0.000007507,0.000000266],[0.000007449,0.000000282],[0.000007390,0.000000297],[0.000007331,0.000000313],[0.000007273,0.000000328],[0.000007214,0.000000344],[0.000007156,0.000000359],[0.000007097,0.000000374],[0.000007038,0.000000390],[0.000006980,0.000000405],[0.000016888,-0.000000785],[0.000016845,-0.000000795],[0.000016803,-0.000000805],[0.000016761,-0.000000816],[0.000016719,-0.000000827],[0.000016677,-0.000000838],[0.000016634,-0.000000849],[0.000016592,-0.000000861],[0.000016549,-0.000000873],[0.000016506,-0.000000886],[0.000016463,-0.000000898],[0.000016419,-0.000000912],[0.000016374,-0.000000926],[0.000016328,-0.000000940],[0.000016282,-0.000000954],[0.000016234,-0.000000969],[0.000016185,-0.000000984],[0.000016135,-0.000000998],[0.000016083,-0.000001013],[0.000016030,-0.000001027],[0.000015975,-0.000001041],[0.000015918,-0.000001054],[0.000015860,-0.000001066],[0.000015800,-0.000001077],[0.000015738,-0.000001087],[0.000015675,-0.000001096],[0.000015609,-0.000001104],[0.000015543,-0.000001111],[0.000015475,-0.000001116],[0.000015405,-0.000001119],[0.000015334,-0.000001121],[0.000015262,-0.000001121],[0.000015189,-0.000001120],[0.000015116,-0.000001117],[0.000015042,-0.000001113],[0.000014968,-0.000001107],[0.000014894,-0.000001099],[0.000014821,-0.000001090],[0.000014750,-0.000001081],[0.000014681,-0.000001070],[0.000014614,-0.000001058],[0.000014549,-0.000001045],[0.000014486,-0.000001033],[0.000014421,-0.000001021],[0.000014356,-0.000001009],[0.000014291,-0.000000994],[0.000014226,-0.000000978],[0.000014156,-0.000000968],[0.000014073,-0.000000963],[0.000013989,-0.000000959],[0.000013908,-0.000000956],[0.000013834,-0.000000954],[0.000013763,-0.000000952],[0.000013690,-0.000000947],[0.000013615,-0.000000938],[0.000013548,-0.000000929],[0.000013492,-0.000000933],[0.000013424,-0.000000927],[0.000013346,-0.000000903],[0.000013264,-0.000000878],[0.000013184,-0.000000866],[0.000013106,-0.000000860],[0.000013027,-0.000000846],[0.000012947,-0.000000824],[0.000012860,-0.000000796],[0.000012780,-0.000000773],[0.000012725,-0.000000762],[0.000012665,-0.000000749],[0.000012596,-0.000000731],[0.000012519,-0.000000714],[0.000012437,-0.000000702],[0.000012361,-0.000000689],[0.000012292,-0.000000673],[0.000012226,-0.000000655],[0.000012151,-0.000000644],[0.000012079,-0.000000631],[0.000012014,-0.000000615],[0.000011949,-0.000000593],[0.000011874,-0.000000569],[0.000011781,-0.000000547],[0.000011707,-0.000000534],[0.000011648,-0.000000525],[0.000011592,-0.000000517],[0.000011533,-0.000000509],[0.000011483,-0.000000506],[0.000011411,-0.000000500],[0.000011336,-0.000000493],[0.000011278,-0.000000481],[0.000011225,-0.000000474],[0.000011168,-0.000000465],[0.000011098,-0.000000451],[0.000011019,-0.000000434],[0.000010940,-0.000000421],[0.000010866,-0.000000415],[0.000010770,-0.000000406],[0.000010664,-0.000000395],[0.000010564,-0.000000386],[0.000010483,-0.000000375],[0.000010418,-0.000000359],[0.000010353,-0.000000345],[0.000010285,-0.000000334],[0.000010219,-0.000000327],[0.000010155,-0.000000319],[0.000010091,-0.000000309],[0.000010026,-0.000000305],[0.000009960,-0.000000304],[0.000009902,-0.000000299],[0.000009854,-0.000000290],[0.000009812,-0.000000280],[0.000009761,-0.000000273],[0.000009694,-0.000000272],[0.000009634,-0.000000273],[0.000009582,-0.000000273],[0.000009535,-0.000000267],[0.000009489,-0.000000254],[0.000009428,-0.000000246],[0.000009358,-0.000000241],[0.000009286,-0.000000240],[0.000009219,-0.000000233],[0.000009161,-0.000000212],[0.000009104,-0.000000188],[0.000009036,-0.000000177],[0.000008967,-0.000000175],[0.000008901,-0.000000173],[0.000008839,-0.000000167],[0.000008779,-0.000000157],[0.000008719,-0.000000142],[0.000008659,-0.000000125],[0.000008598,-0.000000105],[0.000008536,-0.000000084],[0.000008474,-0.000000063],[0.000008412,-0.000000042],[0.000008351,-0.000000021],[0.000008291,-0.000000000],[0.000008231,0.000000020],[0.000008171,0.000000040],[0.000008112,0.000000059],[0.000008053,0.000000078],[0.000007994,0.000000096],[0.000007936,0.000000114],[0.000007877,0.000000131],[0.000007819,0.000000148],[0.000007760,0.000000165],[0.000007702,0.000000182],[0.000007643,0.000000198],[0.000007585,0.000000215],[0.000007527,0.000000231],[0.000007469,0.000000246],[0.000007411,0.000000262],[0.000007353,0.000000278],[0.000007294,0.000000294],[0.000007236,0.000000309],[0.000007178,0.000000325],[0.000007120,0.000000340],[0.000007061,0.000000355],[0.000007003,0.000000371],[0.000016875,-0.000000795],[0.000016834,-0.000000805],[0.000016794,-0.000000814],[0.000016754,-0.000000824],[0.000016713,-0.000000833],[0.000016673,-0.000000844],[0.000016632,-0.000000854],[0.000016592,-0.000000864],[0.000016550,-0.000000876],[0.000016509,-0.000000887],[0.000016468,-0.000000900],[0.000016426,-0.000000913],[0.000016383,-0.000000926],[0.000016339,-0.000000940],[0.000016295,-0.000000955],[0.000016249,-0.000000969],[0.000016203,-0.000000985],[0.000016154,-0.000001000],[0.000016104,-0.000001015],[0.000016053,-0.000001031],[0.000016000,-0.000001045],[0.000015945,-0.000001060],[0.000015888,-0.000001073],[0.000015829,-0.000001086],[0.000015769,-0.000001097],[0.000015706,-0.000001108],[0.000015641,-0.000001117],[0.000015575,-0.000001125],[0.000015507,-0.000001131],[0.000015438,-0.000001135],[0.000015367,-0.000001138],[0.000015294,-0.000001139],[0.000015221,-0.000001139],[0.000015146,-0.000001136],[0.000015071,-0.000001132],[0.000014996,-0.000001126],[0.000014921,-0.000001118],[0.000014847,-0.000001109],[0.000014775,-0.000001099],[0.000014704,-0.000001087],[0.000014635,-0.000001076],[0.000014569,-0.000001064],[0.000014502,-0.000001053],[0.000014435,-0.000001041],[0.000014367,-0.000001028],[0.000014300,-0.000001010],[0.000014235,-0.000000991],[0.000014170,-0.000000984],[0.000014094,-0.000000981],[0.000014009,-0.000000977],[0.000013926,-0.000000971],[0.000013849,-0.000000969],[0.000013777,-0.000000968],[0.000013706,-0.000000964],[0.000013635,-0.000000956],[0.000013570,-0.000000947],[0.000013515,-0.000000947],[0.000013442,-0.000000940],[0.000013359,-0.000000928],[0.000013277,-0.000000914],[0.000013199,-0.000000901],[0.000013123,-0.000000889],[0.000013046,-0.000000872],[0.000012962,-0.000000848],[0.000012873,-0.000000820],[0.000012797,-0.000000800],[0.000012751,-0.000000795],[0.000012691,-0.000000781],[0.000012613,-0.000000758],[0.000012536,-0.000000738],[0.000012460,-0.000000725],[0.000012388,-0.000000713],[0.000012319,-0.000000700],[0.000012254,-0.000000684],[0.000012182,-0.000000669],[0.000012109,-0.000000654],[0.000012036,-0.000000636],[0.000011962,-0.000000616],[0.000011886,-0.000000595],[0.000011810,-0.000000575],[0.000011744,-0.000000561],[0.000011690,-0.000000551],[0.000011641,-0.000000543],[0.000011585,-0.000000532],[0.000011526,-0.000000523],[0.000011454,-0.000000516],[0.000011371,-0.000000509],[0.000011301,-0.000000501],[0.000011241,-0.000000492],[0.000011183,-0.000000483],[0.000011120,-0.000000473],[0.000011048,-0.000000462],[0.000010966,-0.000000453],[0.000010879,-0.000000447],[0.000010781,-0.000000442],[0.000010675,-0.000000438],[0.000010571,-0.000000435],[0.000010491,-0.000000423],[0.000010432,-0.000000405],[0.000010369,-0.000000392],[0.000010299,-0.000000384],[0.000010228,-0.000000376],[0.000010161,-0.000000360],[0.000010098,-0.000000340],[0.000010041,-0.000000341],[0.000009982,-0.000000344],[0.000009919,-0.000000341],[0.000009859,-0.000000333],[0.000009810,-0.000000322],[0.000009760,-0.000000314],[0.000009702,-0.000000309],[0.000009646,-0.000000305],[0.000009598,-0.000000300],[0.000009557,-0.000000292],[0.000009510,-0.000000282],[0.000009440,-0.000000277],[0.000009365,-0.000000275],[0.000009291,-0.000000277],[0.000009219,-0.000000282],[0.000009164,-0.000000259],[0.000009111,-0.000000229],[0.000009043,-0.000000217],[0.000008973,-0.000000212],[0.000008905,-0.000000208],[0.000008842,-0.000000202],[0.000008781,-0.000000191],[0.000008721,-0.000000177],[0.000008660,-0.000000160],[0.000008599,-0.000000141],[0.000008538,-0.000000120],[0.000008476,-0.000000100],[0.000008416,-0.000000079],[0.000008356,-0.000000058],[0.000008297,-0.000000037],[0.000008238,-0.000000017],[0.000008180,0.000000003],[0.000008122,0.000000022],[0.000008065,0.000000041],[0.000008007,0.000000060],[0.000007949,0.000000078],[0.000007892,0.000000095],[0.000007835,0.000000113],[0.000007777,0.000000130],[0.000007720,0.000000147],[0.000007662,0.000000163],[0.000007604,0.000000179],[0.000007547,0.000000196],[0.000007489,0.000000212],[0.000007431,0.000000227],[0.000007374,0.000000243],[0.000007316,0.000000259],[0.000007258,0.000000274],[0.000007200,0.000000290],[0.000007143,0.000000305],[0.000007085,0.000000321],[0.000007027,0.000000336],[0.000016863,-0.000000808],[0.000016824,-0.000000816],[0.000016785,-0.000000824],[0.000016747,-0.000000833],[0.000016708,-0.000000841],[0.000016669,-0.000000850],[0.000016630,-0.000000859],[0.000016591,-0.000000868],[0.000016552,-0.000000878],[0.000016512,-0.000000889],[0.000016472,-0.000000901],[0.000016432,-0.000000913],[0.000016391,-0.000000926],[0.000016350,-0.000000939],[0.000016308,-0.000000954],[0.000016264,-0.000000969],[0.000016219,-0.000000985],[0.000016173,-0.000001000],[0.000016125,-0.000001016],[0.000016076,-0.000001033],[0.000016025,-0.000001049],[0.000015972,-0.000001064],[0.000015917,-0.000001079],[0.000015859,-0.000001093],[0.000015800,-0.000001106],[0.000015738,-0.000001118],[0.000015675,-0.000001129],[0.000015609,-0.000001138],[0.000015542,-0.000001145],[0.000015472,-0.000001151],[0.000015401,-0.000001155],[0.000015328,-0.000001157],[0.000015254,-0.000001157],[0.000015179,-0.000001155],[0.000015103,-0.000001151],[0.000015027,-0.000001145],[0.000014950,-0.000001137],[0.000014875,-0.000001128],[0.000014800,-0.000001117],[0.000014727,-0.000001106],[0.000014656,-0.000001094],[0.000014587,-0.000001083],[0.000014519,-0.000001071],[0.000014452,-0.000001059],[0.000014384,-0.000001043],[0.000014317,-0.000001022],[0.000014249,-0.000001002],[0.000014194,-0.000001007],[0.000014117,-0.000001003],[0.000014029,-0.000000993],[0.000013943,-0.000000984],[0.000013867,-0.000000982],[0.000013795,-0.000000983],[0.000013726,-0.000000982],[0.000013658,-0.000000978],[0.000013589,-0.000000970],[0.000013519,-0.000000960],[0.000013446,-0.000000953],[0.000013368,-0.000000947],[0.000013288,-0.000000940],[0.000013213,-0.000000927],[0.000013139,-0.000000912],[0.000013066,-0.000000894],[0.000012989,-0.000000873],[0.000012910,-0.000000852],[0.000012844,-0.000000837],[0.000012779,-0.000000820],[0.000012709,-0.000000801],[0.000012626,-0.000000778],[0.000012552,-0.000000761],[0.000012484,-0.000000749],[0.000012414,-0.000000740],[0.000012344,-0.000000730],[0.000012278,-0.000000715],[0.000012208,-0.000000698],[0.000012134,-0.000000679],[0.000012057,-0.000000659],[0.000011980,-0.000000641],[0.000011905,-0.000000624],[0.000011840,-0.000000605],[0.000011781,-0.000000589],[0.000011729,-0.000000577],[0.000011682,-0.000000567],[0.000011628,-0.000000554],[0.000011569,-0.000000540],[0.000011497,-0.000000529],[0.000011398,-0.000000524],[0.000011319,-0.000000519],[0.000011253,-0.000000511],[0.000011192,-0.000000501],[0.000011134,-0.000000494],[0.000011072,-0.000000487],[0.000011002,-0.000000483],[0.000010904,-0.000000476],[0.000010802,-0.000000472],[0.000010700,-0.000000470],[0.000010604,-0.000000466],[0.000010525,-0.000000455],[0.000010460,-0.000000442],[0.000010395,-0.000000434],[0.000010317,-0.000000433],[0.000010236,-0.000000428],[0.000010175,-0.000000407],[0.000010123,-0.000000394],[0.000010073,-0.000000397],[0.000010011,-0.000000387],[0.000009941,-0.000000377],[0.000009869,-0.000000368],[0.000009811,-0.000000357],[0.000009755,-0.000000349],[0.000009700,-0.000000342],[0.000009651,-0.000000333],[0.000009606,-0.000000323],[0.000009561,-0.000000313],[0.000009507,-0.000000305],[0.000009440,-0.000000303],[0.000009367,-0.000000302],[0.000009296,-0.000000297],[0.000009232,-0.000000284],[0.000009170,-0.000000270],[0.000009106,-0.000000262],[0.000009038,-0.000000257],[0.000008971,-0.000000252],[0.000008906,-0.000000245],[0.000008844,-0.000000236],[0.000008783,-0.000000223],[0.000008722,-0.000000209],[0.000008660,-0.000000192],[0.000008599,-0.000000174],[0.000008538,-0.000000154],[0.000008478,-0.000000134],[0.000008418,-0.000000114],[0.000008360,-0.000000093],[0.000008302,-0.000000073],[0.000008246,-0.000000053],[0.000008189,-0.000000033],[0.000008133,-0.000000014],[0.000008076,0.000000005],[0.000008020,0.000000024],[0.000007964,0.000000042],[0.000007907,0.000000060],[0.000007851,0.000000077],[0.000007794,0.000000094],[0.000007737,0.000000111],[0.000007681,0.000000128],[0.000007624,0.000000144],[0.000007567,0.000000161],[0.000007509,0.000000177],[0.000007452,0.000000193],[0.000007395,0.000000209],[0.000007338,0.000000224],[0.000007280,0.000000240],[0.000007223,0.000000256],[0.000007166,0.000000271],[0.000007108,0.000000287],[0.000007051,0.000000302],[0.000016852,-0.000000823],[0.000016815,-0.000000830],[0.000016777,-0.000000836],[0.000016740,-0.000000843],[0.000016702,-0.000000850],[0.000016665,-0.000000857],[0.000016627,-0.000000865],[0.000016590,-0.000000873],[0.000016552,-0.000000882],[0.000016515,-0.000000891],[0.000016477,-0.000000901],[0.000016438,-0.000000913],[0.000016399,-0.000000925],[0.000016360,-0.000000938],[0.000016320,-0.000000952],[0.000016278,-0.000000967],[0.000016236,-0.000000983],[0.000016192,-0.000000999],[0.000016146,-0.000001016],[0.000016099,-0.000001033],[0.000016050,-0.000001050],[0.000015999,-0.000001067],[0.000015945,-0.000001083],[0.000015890,-0.000001099],[0.000015832,-0.000001114],[0.000015772,-0.000001127],[0.000015709,-0.000001139],[0.000015645,-0.000001150],[0.000015577,-0.000001159],[0.000015508,-0.000001166],[0.000015437,-0.000001171],[0.000015365,-0.000001175],[0.000015290,-0.000001176],[0.000015214,-0.000001175],[0.000015137,-0.000001171],[0.000015060,-0.000001166],[0.000014982,-0.000001158],[0.000014904,-0.000001148],[0.000014827,-0.000001137],[0.000014750,-0.000001125],[0.000014676,-0.000001112],[0.000014604,-0.000001100],[0.000014535,-0.000001088],[0.000014469,-0.000001075],[0.000014405,-0.000001060],[0.000014342,-0.000001044],[0.000014285,-0.000001036],[0.000014223,-0.000001039],[0.000014135,-0.000001027],[0.000014048,-0.000001014],[0.000013967,-0.000001002],[0.000013892,-0.000000999],[0.000013817,-0.000000998],[0.000013746,-0.000000999],[0.000013680,-0.000000999],[0.000013608,-0.000000992],[0.000013522,-0.000000973],[0.000013452,-0.000000964],[0.000013380,-0.000000960],[0.000013305,-0.000000955],[0.000013231,-0.000000944],[0.000013157,-0.000000929],[0.000013086,-0.000000913],[0.000013019,-0.000000896],[0.000012941,-0.000000876],[0.000012868,-0.000000857],[0.000012799,-0.000000837],[0.000012736,-0.000000818],[0.000012659,-0.000000800],[0.000012584,-0.000000785],[0.000012514,-0.000000773],[0.000012444,-0.000000764],[0.000012374,-0.000000755],[0.000012304,-0.000000744],[0.000012234,-0.000000727],[0.000012162,-0.000000705],[0.000012086,-0.000000684],[0.000012010,-0.000000665],[0.000011941,-0.000000650],[0.000011878,-0.000000634],[0.000011817,-0.000000617],[0.000011761,-0.000000601],[0.000011712,-0.000000588],[0.000011659,-0.000000574],[0.000011599,-0.000000560],[0.000011529,-0.000000549],[0.000011435,-0.000000545],[0.000011350,-0.000000542],[0.000011272,-0.000000535],[0.000011203,-0.000000525],[0.000011146,-0.000000513],[0.000011085,-0.000000506],[0.000011014,-0.000000502],[0.000010924,-0.000000497],[0.000010829,-0.000000496],[0.000010735,-0.000000495],[0.000010646,-0.000000491],[0.000010565,-0.000000480],[0.000010492,-0.000000468],[0.000010416,-0.000000463],[0.000010336,-0.000000463],[0.000010254,-0.000000457],[0.000010197,-0.000000435],[0.000010147,-0.000000430],[0.000010100,-0.000000436],[0.000010038,-0.000000418],[0.000009971,-0.000000402],[0.000009900,-0.000000390],[0.000009828,-0.000000381],[0.000009757,-0.000000374],[0.000009700,-0.000000366],[0.000009654,-0.000000357],[0.000009609,-0.000000346],[0.000009559,-0.000000335],[0.000009500,-0.000000327],[0.000009435,-0.000000327],[0.000009366,-0.000000328],[0.000009297,-0.000000320],[0.000009234,-0.000000300],[0.000009170,-0.000000291],[0.000009101,-0.000000294],[0.000009031,-0.000000295],[0.000008967,-0.000000291],[0.000008907,-0.000000281],[0.000008847,-0.000000268],[0.000008785,-0.000000254],[0.000008722,-0.000000239],[0.000008660,-0.000000222],[0.000008598,-0.000000205],[0.000008538,-0.000000186],[0.000008479,-0.000000167],[0.000008421,-0.000000147],[0.000008365,-0.000000127],[0.000008309,-0.000000107],[0.000008253,-0.000000088],[0.000008198,-0.000000068],[0.000008143,-0.000000049],[0.000008089,-0.000000030],[0.000008033,-0.000000011],[0.000007978,0.000000007],[0.000007923,0.000000025],[0.000007867,0.000000042],[0.000007811,0.000000060],[0.000007755,0.000000077],[0.000007699,0.000000093],[0.000007643,0.000000110],[0.000007586,0.000000126],[0.000007530,0.000000142],[0.000007473,0.000000158],[0.000007417,0.000000174],[0.000007360,0.000000190],[0.000007303,0.000000206],[0.000007246,0.000000221],[0.000007189,0.000000237],[0.000007132,0.000000252],[0.000007075,0.000000268],[0.000016842,-0.000000840],[0.000016806,-0.000000845],[0.000016770,-0.000000850],[0.000016733,-0.000000855],[0.000016697,-0.000000860],[0.000016661,-0.000000866],[0.000016625,-0.000000872],[0.000016589,-0.000000878],[0.000016553,-0.000000885],[0.000016517,-0.000000893],[0.000016481,-0.000000902],[0.000016444,-0.000000913],[0.000016407,-0.000000924],[0.000016369,-0.000000936],[0.000016331,-0.000000949],[0.000016292,-0.000000964],[0.000016251,-0.000000980],[0.000016210,-0.000000996],[0.000016166,-0.000001014],[0.000016122,-0.000001032],[0.000016075,-0.000001050],[0.000016026,-0.000001068],[0.000015975,-0.000001086],[0.000015921,-0.000001103],[0.000015865,-0.000001120],[0.000015806,-0.000001135],[0.000015745,-0.000001149],[0.000015681,-0.000001161],[0.000015615,-0.000001172],[0.000015546,-0.000001181],[0.000015476,-0.000001188],[0.000015403,-0.000001192],[0.000015328,-0.000001195],[0.000015252,-0.000001194],[0.000015174,-0.000001192],[0.000015095,-0.000001187],[0.000015015,-0.000001179],[0.000014935,-0.000001169],[0.000014855,-0.000001157],[0.000014775,-0.000001144],[0.000014697,-0.000001130],[0.000014622,-0.000001116],[0.000014551,-0.000001103],[0.000014486,-0.000001092],[0.000014425,-0.000001081],[0.000014361,-0.000001068],[0.000014291,-0.000001053],[0.000014220,-0.000001051],[0.000014141,-0.000001049],[0.000014064,-0.000001041],[0.000014000,-0.000001029],[0.000013925,-0.000001021],[0.000013841,-0.000001016],[0.000013765,-0.000001012],[0.000013700,-0.000001009],[0.000013628,-0.000001001],[0.000013545,-0.000000987],[0.000013472,-0.000000978],[0.000013401,-0.000000972],[0.000013328,-0.000000965],[0.000013254,-0.000000955],[0.000013178,-0.000000942],[0.000013101,-0.000000927],[0.000013029,-0.000000908],[0.000012955,-0.000000888],[0.000012884,-0.000000870],[0.000012815,-0.000000853],[0.000012759,-0.000000838],[0.000012692,-0.000000823],[0.000012621,-0.000000809],[0.000012549,-0.000000796],[0.000012479,-0.000000786],[0.000012407,-0.000000777],[0.000012334,-0.000000767],[0.000012262,-0.000000750],[0.000012193,-0.000000729],[0.000012127,-0.000000713],[0.000012054,-0.000000694],[0.000011986,-0.000000678],[0.000011921,-0.000000662],[0.000011857,-0.000000645],[0.000011796,-0.000000628],[0.000011738,-0.000000611],[0.000011679,-0.000000595],[0.000011616,-0.000000581],[0.000011547,-0.000000573],[0.000011471,-0.000000570],[0.000011391,-0.000000565],[0.000011309,-0.000000550],[0.000011232,-0.000000537],[0.000011161,-0.000000528],[0.000011091,-0.000000522],[0.000011018,-0.000000517],[0.000010938,-0.000000513],[0.000010856,-0.000000513],[0.000010774,-0.000000516],[0.000010690,-0.000000515],[0.000010603,-0.000000507],[0.000010514,-0.000000489],[0.000010433,-0.000000479],[0.000010371,-0.000000467],[0.000010295,-0.000000441],[0.000010224,-0.000000437],[0.000010162,-0.000000440],[0.000010107,-0.000000440],[0.000010051,-0.000000430],[0.000009995,-0.000000417],[0.000009932,-0.000000406],[0.000009852,-0.000000399],[0.000009776,-0.000000394],[0.000009712,-0.000000388],[0.000009660,-0.000000380],[0.000009612,-0.000000370],[0.000009560,-0.000000361],[0.000009499,-0.000000354],[0.000009435,-0.000000355],[0.000009365,-0.000000356],[0.000009293,-0.000000353],[0.000009227,-0.000000341],[0.000009167,-0.000000329],[0.000009102,-0.000000327],[0.000009031,-0.000000330],[0.000008969,-0.000000325],[0.000008913,-0.000000312],[0.000008852,-0.000000298],[0.000008787,-0.000000283],[0.000008722,-0.000000267],[0.000008658,-0.000000251],[0.000008597,-0.000000234],[0.000008537,-0.000000216],[0.000008480,-0.000000198],[0.000008425,-0.000000179],[0.000008370,-0.000000160],[0.000008316,-0.000000140],[0.000008262,-0.000000121],[0.000008209,-0.000000102],[0.000008155,-0.000000083],[0.000008101,-0.000000064],[0.000008047,-0.000000046],[0.000007993,-0.000000028],[0.000007938,-0.000000010],[0.000007884,0.000000008],[0.000007829,0.000000025],[0.000007773,0.000000042],[0.000007718,0.000000059],[0.000007662,0.000000075],[0.000007606,0.000000092],[0.000007550,0.000000108],[0.000007494,0.000000124],[0.000007438,0.000000140],[0.000007382,0.000000156],[0.000007325,0.000000171],[0.000007269,0.000000187],[0.000007212,0.000000203],[0.000007156,0.000000218],[0.000007099,0.000000234],[0.000016833,-0.000000860],[0.000016798,-0.000000863],[0.000016763,-0.000000865],[0.000016728,-0.000000869],[0.000016693,-0.000000872],[0.000016658,-0.000000876],[0.000016623,-0.000000880],[0.000016588,-0.000000884],[0.000016554,-0.000000890],[0.000016519,-0.000000896],[0.000016484,-0.000000904],[0.000016449,-0.000000912],[0.000016414,-0.000000922],[0.000016378,-0.000000933],[0.000016341,-0.000000946],[0.000016304,-0.000000960],[0.000016266,-0.000000976],[0.000016227,-0.000000992],[0.000016186,-0.000001010],[0.000016144,-0.000001028],[0.000016099,-0.000001048],[0.000016053,-0.000001067],[0.000016004,-0.000001086],[0.000015952,-0.000001106],[0.000015898,-0.000001124],[0.000015841,-0.000001141],[0.000015781,-0.000001157],[0.000015719,-0.000001172],[0.000015654,-0.000001184],[0.000015586,-0.000001195],[0.000015515,-0.000001203],[0.000015443,-0.000001210],[0.000015368,-0.000001213],[0.000015291,-0.000001214],[0.000015212,-0.000001213],[0.000015132,-0.000001208],[0.000015050,-0.000001201],[0.000014968,-0.000001191],[0.000014886,-0.000001179],[0.000014803,-0.000001165],[0.000014721,-0.000001150],[0.000014642,-0.000001134],[0.000014567,-0.000001119],[0.000014499,-0.000001108],[0.000014438,-0.000001101],[0.000014372,-0.000001091],[0.000014297,-0.000001077],[0.000014223,-0.000001071],[0.000014149,-0.000001071],[0.000014074,-0.000001070],[0.000014018,-0.000001059],[0.000013951,-0.000001047],[0.000013871,-0.000001036],[0.000013796,-0.000001023],[0.000013727,-0.000001018],[0.000013655,-0.000001010],[0.000013577,-0.000001001],[0.000013500,-0.000000993],[0.000013427,-0.000000985],[0.000013356,-0.000000976],[0.000013283,-0.000000966],[0.000013205,-0.000000955],[0.000013124,-0.000000939],[0.000013044,-0.000000918],[0.000012968,-0.000000897],[0.000012907,-0.000000886],[0.000012847,-0.000000874],[0.000012788,-0.000000861],[0.000012724,-0.000000847],[0.000012655,-0.000000832],[0.000012585,-0.000000819],[0.000012515,-0.000000806],[0.000012444,-0.000000797],[0.000012370,-0.000000786],[0.000012295,-0.000000767],[0.000012225,-0.000000747],[0.000012174,-0.000000741],[0.000012105,-0.000000726],[0.000012033,-0.000000706],[0.000011965,-0.000000689],[0.000011899,-0.000000673],[0.000011831,-0.000000654],[0.000011762,-0.000000634],[0.000011694,-0.000000616],[0.000011626,-0.000000602],[0.000011558,-0.000000593],[0.000011488,-0.000000587],[0.000011414,-0.000000579],[0.000011336,-0.000000566],[0.000011255,-0.000000553],[0.000011173,-0.000000546],[0.000011097,-0.000000541],[0.000011024,-0.000000536],[0.000010951,-0.000000530],[0.000010881,-0.000000529],[0.000010810,-0.000000532],[0.000010734,-0.000000537],[0.000010645,-0.000000535],[0.000010525,-0.000000511],[0.000010445,-0.000000490],[0.000010389,-0.000000472],[0.000010321,-0.000000448],[0.000010244,-0.000000447],[0.000010172,-0.000000449],[0.000010110,-0.000000442],[0.000010056,-0.000000437],[0.000010004,-0.000000431],[0.000009945,-0.000000421],[0.000009874,-0.000000414],[0.000009799,-0.000000410],[0.000009730,-0.000000409],[0.000009673,-0.000000404],[0.000009623,-0.000000397],[0.000009568,-0.000000391],[0.000009507,-0.000000389],[0.000009439,-0.000000389],[0.000009367,-0.000000385],[0.000009298,-0.000000380],[0.000009234,-0.000000372],[0.000009175,-0.000000362],[0.000009114,-0.000000357],[0.000009051,-0.000000354],[0.000008991,-0.000000348],[0.000008926,-0.000000337],[0.000008858,-0.000000324],[0.000008788,-0.000000309],[0.000008720,-0.000000294],[0.000008656,-0.000000278],[0.000008596,-0.000000262],[0.000008538,-0.000000245],[0.000008483,-0.000000227],[0.000008430,-0.000000209],[0.000008377,-0.000000191],[0.000008324,-0.000000172],[0.000008272,-0.000000153],[0.000008220,-0.000000135],[0.000008167,-0.000000116],[0.000008114,-0.000000098],[0.000008061,-0.000000079],[0.000008008,-0.000000061],[0.000007954,-0.000000044],[0.000007900,-0.000000026],[0.000007846,-0.000000009],[0.000007792,0.000000008],[0.000007737,0.000000025],[0.000007682,0.000000041],[0.000007626,0.000000058],[0.000007571,0.000000074],[0.000007516,0.000000090],[0.000007460,0.000000106],[0.000007404,0.000000122],[0.000007348,0.000000137],[0.000007292,0.000000153],[0.000007236,0.000000168],[0.000007180,0.000000184],[0.000007123,0.000000199],[0.000016825,-0.000000881],[0.000016791,-0.000000882],[0.000016757,-0.000000883],[0.000016723,-0.000000884],[0.000016689,-0.000000885],[0.000016655,-0.000000887],[0.000016622,-0.000000889],[0.000016588,-0.000000892],[0.000016554,-0.000000895],[0.000016521,-0.000000900],[0.000016487,-0.000000905],[0.000016453,-0.000000912],[0.000016420,-0.000000921],[0.000016386,-0.000000931],[0.000016351,-0.000000942],[0.000016316,-0.000000955],[0.000016280,-0.000000970],[0.000016243,-0.000000986],[0.000016205,-0.000001004],[0.000016165,-0.000001023],[0.000016123,-0.000001043],[0.000016079,-0.000001064],[0.000016033,-0.000001085],[0.000015984,-0.000001106],[0.000015932,-0.000001126],[0.000015877,-0.000001146],[0.000015819,-0.000001164],[0.000015758,-0.000001181],[0.000015694,-0.000001196],[0.000015627,-0.000001208],[0.000015557,-0.000001219],[0.000015485,-0.000001227],[0.000015410,-0.000001232],[0.000015332,-0.000001234],[0.000015252,-0.000001234],[0.000015171,-0.000001230],[0.000015088,-0.000001224],[0.000015004,-0.000001214],[0.000014919,-0.000001202],[0.000014833,-0.000001187],[0.000014748,-0.000001171],[0.000014665,-0.000001154],[0.000014585,-0.000001137],[0.000014513,-0.000001126],[0.000014450,-0.000001122],[0.000014383,-0.000001116],[0.000014311,-0.000001108],[0.000014240,-0.000001099],[0.000014171,-0.000001093],[0.000014105,-0.000001087],[0.000014041,-0.000001080],[0.000013974,-0.000001072],[0.000013902,-0.000001063],[0.000013830,-0.000001049],[0.000013757,-0.000001038],[0.000013684,-0.000001025],[0.000013605,-0.000001017],[0.000013527,-0.000001010],[0.000013453,-0.000001001],[0.000013384,-0.000000991],[0.000013313,-0.000000981],[0.000013238,-0.000000970],[0.000013157,-0.000000955],[0.000013075,-0.000000935],[0.000013000,-0.000000916],[0.000012945,-0.000000909],[0.000012887,-0.000000901],[0.000012823,-0.000000887],[0.000012756,-0.000000871],[0.000012688,-0.000000855],[0.000012619,-0.000000841],[0.000012550,-0.000000829],[0.000012480,-0.000000819],[0.000012409,-0.000000807],[0.000012336,-0.000000789],[0.000012266,-0.000000771],[0.000012204,-0.000000759],[0.000012139,-0.000000745],[0.000012069,-0.000000727],[0.000012001,-0.000000709],[0.000011932,-0.000000692],[0.000011859,-0.000000673],[0.000011785,-0.000000653],[0.000011709,-0.000000636],[0.000011635,-0.000000623],[0.000011563,-0.000000614],[0.000011495,-0.000000606],[0.000011426,-0.000000599],[0.000011351,-0.000000589],[0.000011268,-0.000000579],[0.000011181,-0.000000572],[0.000011104,-0.000000569],[0.000011033,-0.000000562],[0.000010967,-0.000000553],[0.000010904,-0.000000546],[0.000010841,-0.000000545],[0.000010770,-0.000000550],[0.000010685,-0.000000552],[0.000010579,-0.000000536],[0.000010487,-0.000000513],[0.000010412,-0.000000493],[0.000010339,-0.000000480],[0.000010260,-0.000000475],[0.000010185,-0.000000473],[0.000010119,-0.000000467],[0.000010061,-0.000000461],[0.000010006,-0.000000451],[0.000009951,-0.000000438],[0.000009891,-0.000000428],[0.000009823,-0.000000427],[0.000009754,-0.000000429],[0.000009694,-0.000000430],[0.000009639,-0.000000427],[0.000009582,-0.000000423],[0.000009515,-0.000000420],[0.000009442,-0.000000414],[0.000009372,-0.000000407],[0.000009309,-0.000000403],[0.000009250,-0.000000396],[0.000009193,-0.000000387],[0.000009131,-0.000000382],[0.000009069,-0.000000377],[0.000009012,-0.000000369],[0.000008939,-0.000000358],[0.000008861,-0.000000346],[0.000008786,-0.000000333],[0.000008718,-0.000000318],[0.000008655,-0.000000304],[0.000008597,-0.000000288],[0.000008542,-0.000000272],[0.000008488,-0.000000256],[0.000008436,-0.000000238],[0.000008385,-0.000000221],[0.000008334,-0.000000203],[0.000008283,-0.000000185],[0.000008232,-0.000000167],[0.000008180,-0.000000148],[0.000008129,-0.000000130],[0.000008076,-0.000000112],[0.000008024,-0.000000095],[0.000007971,-0.000000077],[0.000007918,-0.000000060],[0.000007864,-0.000000043],[0.000007810,-0.000000026],[0.000007756,-0.000000009],[0.000007701,0.000000007],[0.000007647,0.000000024],[0.000007592,0.000000040],[0.000007537,0.000000056],[0.000007482,0.000000072],[0.000007426,0.000000088],[0.000007371,0.000000103],[0.000007315,0.000000119],[0.000007260,0.000000134],[0.000007204,0.000000150],[0.000007148,0.000000165],[0.000016819,-0.000000904],[0.000016786,-0.000000903],[0.000016753,-0.000000902],[0.000016719,-0.000000901],[0.000016686,-0.000000900],[0.000016653,-0.000000900],[0.000016620,-0.000000900],[0.000016588,-0.000000900],[0.000016555,-0.000000902],[0.000016522,-0.000000904],[0.000016490,-0.000000908],[0.000016457,-0.000000913],[0.000016425,-0.000000919],[0.000016393,-0.000000927],[0.000016360,-0.000000938],[0.000016327,-0.000000949],[0.000016293,-0.000000963],[0.000016258,-0.000000979],[0.000016222,-0.000000997],[0.000016185,-0.000001016],[0.000016146,-0.000001037],[0.000016105,-0.000001059],[0.000016061,-0.000001081],[0.000016015,-0.000001104],[0.000015966,-0.000001127],[0.000015913,-0.000001148],[0.000015857,-0.000001169],[0.000015798,-0.000001188],[0.000015735,-0.000001206],[0.000015669,-0.000001221],[0.000015600,-0.000001233],[0.000015528,-0.000001243],[0.000015453,-0.000001250],[0.000015375,-0.000001254],[0.000015295,-0.000001255],[0.000015212,-0.000001252],[0.000015127,-0.000001246],[0.000015041,-0.000001237],[0.000014954,-0.000001225],[0.000014867,-0.000001210],[0.000014780,-0.000001194],[0.000014694,-0.000001178],[0.000014612,-0.000001164],[0.000014537,-0.000001154],[0.000014468,-0.000001149],[0.000014400,-0.000001144],[0.000014333,-0.000001136],[0.000014266,-0.000001125],[0.000014200,-0.000001113],[0.000014135,-0.000001103],[0.000014065,-0.000001098],[0.000013996,-0.000001095],[0.000013927,-0.000001092],[0.000013857,-0.000001089],[0.000013782,-0.000001066],[0.000013705,-0.000001047],[0.000013626,-0.000001037],[0.000013549,-0.000001030],[0.000013477,-0.000001021],[0.000013411,-0.000001009],[0.000013345,-0.000000997],[0.000013274,-0.000000989],[0.000013196,-0.000000978],[0.000013119,-0.000000961],[0.000013050,-0.000000947],[0.000012993,-0.000000939],[0.000012930,-0.000000929],[0.000012861,-0.000000914],[0.000012788,-0.000000896],[0.000012719,-0.000000878],[0.000012650,-0.000000862],[0.000012582,-0.000000850],[0.000012515,-0.000000840],[0.000012447,-0.000000830],[0.000012375,-0.000000812],[0.000012304,-0.000000793],[0.000012235,-0.000000776],[0.000012166,-0.000000761],[0.000012095,-0.000000744],[0.000012024,-0.000000725],[0.000011954,-0.000000706],[0.000011883,-0.000000687],[0.000011808,-0.000000670],[0.000011729,-0.000000657],[0.000011647,-0.000000647],[0.000011567,-0.000000637],[0.000011498,-0.000000630],[0.000011435,-0.000000625],[0.000011367,-0.000000620],[0.000011287,-0.000000614],[0.000011199,-0.000000608],[0.000011118,-0.000000604],[0.000011046,-0.000000596],[0.000010983,-0.000000581],[0.000010924,-0.000000567],[0.000010864,-0.000000559],[0.000010795,-0.000000558],[0.000010713,-0.000000558],[0.000010622,-0.000000551],[0.000010530,-0.000000537],[0.000010444,-0.000000524],[0.000010364,-0.000000517],[0.000010287,-0.000000513],[0.000010215,-0.000000511],[0.000010145,-0.000000510],[0.000010078,-0.000000499],[0.000010016,-0.000000479],[0.000009959,-0.000000460],[0.000009904,-0.000000449],[0.000009844,-0.000000448],[0.000009781,-0.000000451],[0.000009718,-0.000000457],[0.000009656,-0.000000461],[0.000009592,-0.000000457],[0.000009518,-0.000000445],[0.000009441,-0.000000427],[0.000009381,-0.000000428],[0.000009324,-0.000000426],[0.000009268,-0.000000420],[0.000009212,-0.000000410],[0.000009142,-0.000000408],[0.000009074,-0.000000402],[0.000009011,-0.000000391],[0.000008938,-0.000000379],[0.000008859,-0.000000367],[0.000008783,-0.000000355],[0.000008717,-0.000000342],[0.000008657,-0.000000328],[0.000008601,-0.000000314],[0.000008548,-0.000000299],[0.000008497,-0.000000283],[0.000008446,-0.000000266],[0.000008396,-0.000000250],[0.000008346,-0.000000233],[0.000008296,-0.000000215],[0.000008245,-0.000000198],[0.000008195,-0.000000180],[0.000008144,-0.000000162],[0.000008092,-0.000000145],[0.000008040,-0.000000127],[0.000007988,-0.000000110],[0.000007935,-0.000000093],[0.000007882,-0.000000076],[0.000007829,-0.000000059],[0.000007775,-0.000000042],[0.000007721,-0.000000026],[0.000007667,-0.000000010],[0.000007613,0.000000006],[0.000007558,0.000000022],[0.000007503,0.000000038],[0.000007449,0.000000054],[0.000007394,0.000000069],[0.000007338,0.000000085],[0.000007283,0.000000100],[0.000007228,0.000000116],[0.000007173,0.000000131],[0.000016815,-0.000000929],[0.000016782,-0.000000926],[0.000016749,-0.000000923],[0.000016717,-0.000000920],[0.000016684,-0.000000917],[0.000016652,-0.000000914],[0.000016620,-0.000000912],[0.000016588,-0.000000910],[0.000016556,-0.000000910],[0.000016524,-0.000000910],[0.000016492,-0.000000911],[0.000016461,-0.000000914],[0.000016430,-0.000000918],[0.000016399,-0.000000924],[0.000016367,-0.000000933],[0.000016336,-0.000000943],[0.000016304,-0.000000956],[0.000016272,-0.000000971],[0.000016238,-0.000000988],[0.000016204,-0.000001007],[0.000016167,-0.000001028],[0.000016129,-0.000001051],[0.000016089,-0.000001075],[0.000016045,-0.000001100],[0.000015999,-0.000001124],[0.000015949,-0.000001149],[0.000015896,-0.000001172],[0.000015838,-0.000001194],[0.000015778,-0.000001214],[0.000015713,-0.000001232],[0.000015645,-0.000001247],[0.000015573,-0.000001259],[0.000015498,-0.000001268],[0.000015420,-0.000001274],[0.000015338,-0.000001276],[0.000015254,-0.000001274],[0.000015167,-0.000001269],[0.000015079,-0.000001260],[0.000014990,-0.000001248],[0.000014902,-0.000001233],[0.000014814,-0.000001218],[0.000014728,-0.000001203],[0.000014645,-0.000001191],[0.000014565,-0.000001184],[0.000014491,-0.000001179],[0.000014422,-0.000001172],[0.000014358,-0.000001161],[0.000014296,-0.000001147],[0.000014226,-0.000001133],[0.000014155,-0.000001123],[0.000014084,-0.000001117],[0.000014017,-0.000001113],[0.000013950,-0.000001111],[0.000013879,-0.000001104],[0.000013803,-0.000001086],[0.000013723,-0.000001068],[0.000013642,-0.000001060],[0.000013567,-0.000001052],[0.000013497,-0.000001040],[0.000013435,-0.000001025],[0.000013375,-0.000001012],[0.000013306,-0.000001009],[0.000013234,-0.000001002],[0.000013160,-0.000000988],[0.000013092,-0.000000974],[0.000013030,-0.000000964],[0.000012965,-0.000000952],[0.000012895,-0.000000938],[0.000012822,-0.000000919],[0.000012750,-0.000000900],[0.000012679,-0.000000882],[0.000012610,-0.000000869],[0.000012543,-0.000000858],[0.000012476,-0.000000846],[0.000012407,-0.000000829],[0.000012337,-0.000000811],[0.000012265,-0.000000793],[0.000012192,-0.000000777],[0.000012117,-0.000000759],[0.000012043,-0.000000740],[0.000011974,-0.000000720],[0.000011906,-0.000000702],[0.000011834,-0.000000687],[0.000011755,-0.000000680],[0.000011669,-0.000000675],[0.000011580,-0.000000667],[0.000011508,-0.000000660],[0.000011448,-0.000000656],[0.000011388,-0.000000654],[0.000011314,-0.000000651],[0.000011225,-0.000000646],[0.000011137,-0.000000641],[0.000011059,-0.000000633],[0.000011001,-0.000000613],[0.000010938,-0.000000596],[0.000010875,-0.000000580],[0.000010808,-0.000000573],[0.000010734,-0.000000571],[0.000010657,-0.000000567],[0.000010570,-0.000000560],[0.000010479,-0.000000555],[0.000010394,-0.000000554],[0.000010324,-0.000000549],[0.000010261,-0.000000546],[0.000010194,-0.000000548],[0.000010121,-0.000000535],[0.000010045,-0.000000509],[0.000009974,-0.000000490],[0.000009916,-0.000000482],[0.000009859,-0.000000480],[0.000009801,-0.000000481],[0.000009738,-0.000000488],[0.000009672,-0.000000495],[0.000009600,-0.000000493],[0.000009526,-0.000000480],[0.000009458,-0.000000465],[0.000009397,-0.000000458],[0.000009340,-0.000000451],[0.000009280,-0.000000446],[0.000009212,-0.000000445],[0.000009140,-0.000000440],[0.000009072,-0.000000426],[0.000009004,-0.000000411],[0.000008933,-0.000000399],[0.000008855,-0.000000388],[0.000008782,-0.000000377],[0.000008720,-0.000000365],[0.000008663,-0.000000352],[0.000008610,-0.000000338],[0.000008559,-0.000000324],[0.000008508,-0.000000309],[0.000008458,-0.000000294],[0.000008409,-0.000000278],[0.000008360,-0.000000261],[0.000008310,-0.000000245],[0.000008260,-0.000000228],[0.000008210,-0.000000210],[0.000008160,-0.000000193],[0.000008109,-0.000000176],[0.000008057,-0.000000159],[0.000008006,-0.000000142],[0.000007954,-0.000000125],[0.000007901,-0.000000108],[0.000007848,-0.000000092],[0.000007795,-0.000000075],[0.000007742,-0.000000059],[0.000007688,-0.000000043],[0.000007634,-0.000000027],[0.000007580,-0.000000012],[0.000007526,0.000000004],[0.000007471,0.000000020],[0.000007417,0.000000035],[0.000007362,0.000000051],[0.000007307,0.000000066],[0.000007252,0.000000082],[0.000007197,0.000000097],[0.000016812,-0.000000956],[0.000016779,-0.000000950],[0.000016748,-0.000000945],[0.000016715,-0.000000940],[0.000016684,-0.000000935],[0.000016652,-0.000000930],[0.000016620,-0.000000926],[0.000016588,-0.000000922],[0.000016557,-0.000000919],[0.000016526,-0.000000917],[0.000016495,-0.000000916],[0.000016464,-0.000000916],[0.000016434,-0.000000918],[0.000016404,-0.000000922],[0.000016374,-0.000000928],[0.000016344,-0.000000936],[0.000016314,-0.000000948],[0.000016284,-0.000000961],[0.000016253,-0.000000977],[0.000016221,-0.000000996],[0.000016187,-0.000001018],[0.000016152,-0.000001041],[0.000016115,-0.000001066],[0.000016075,-0.000001092],[0.000016032,-0.000001120],[0.000015985,-0.000001147],[0.000015934,-0.000001173],[0.000015880,-0.000001198],[0.000015821,-0.000001222],[0.000015758,-0.000001242],[0.000015691,-0.000001260],[0.000015620,-0.000001274],[0.000015545,-0.000001286],[0.000015466,-0.000001293],[0.000015383,-0.000001296],[0.000015298,-0.000001295],[0.000015209,-0.000001290],[0.000015119,-0.000001282],[0.000015028,-0.000001270],[0.000014939,-0.000001257],[0.000014851,-0.000001241],[0.000014765,-0.000001227],[0.000014681,-0.000001215],[0.000014597,-0.000001209],[0.000014515,-0.000001205],[0.000014443,-0.000001200],[0.000014384,-0.000001187],[0.000014323,-0.000001169],[0.000014247,-0.000001154],[0.000014169,-0.000001142],[0.000014098,-0.000001134],[0.000014036,-0.000001129],[0.000013971,-0.000001123],[0.000013896,-0.000001114],[0.000013821,-0.000001103],[0.000013745,-0.000001092],[0.000013660,-0.000001086],[0.000013585,-0.000001072],[0.000013516,-0.000001055],[0.000013452,-0.000001039],[0.000013390,-0.000001028],[0.000013325,-0.000001022],[0.000013257,-0.000001016],[0.000013188,-0.000001006],[0.000013122,-0.000000995],[0.000013057,-0.000000982],[0.000012991,-0.000000969],[0.000012921,-0.000000954],[0.000012850,-0.000000938],[0.000012778,-0.000000921],[0.000012705,-0.000000902],[0.000012634,-0.000000887],[0.000012566,-0.000000875],[0.000012499,-0.000000862],[0.000012432,-0.000000845],[0.000012365,-0.000000827],[0.000012293,-0.000000810],[0.000012218,-0.000000793],[0.000012141,-0.000000776],[0.000012065,-0.000000758],[0.000011998,-0.000000741],[0.000011935,-0.000000723],[0.000011866,-0.000000709],[0.000011789,-0.000000708],[0.000011706,-0.000000710],[0.000011623,-0.000000710],[0.000011538,-0.000000699],[0.000011468,-0.000000692],[0.000011408,-0.000000690],[0.000011337,-0.000000685],[0.000011250,-0.000000679],[0.000011162,-0.000000672],[0.000011082,-0.000000663],[0.000011018,-0.000000646],[0.000010945,-0.000000632],[0.000010866,-0.000000621],[0.000010796,-0.000000610],[0.000010747,-0.000000597],[0.000010688,-0.000000587],[0.000010604,-0.000000584],[0.000010512,-0.000000583],[0.000010426,-0.000000583],[0.000010363,-0.000000574],[0.000010313,-0.000000569],[0.000010264,-0.000000566],[0.000010196,-0.000000555],[0.000010104,-0.000000541],[0.000010013,-0.000000529],[0.000009937,-0.000000523],[0.000009872,-0.000000521],[0.000009813,-0.000000522],[0.000009753,-0.000000523],[0.000009686,-0.000000523],[0.000009609,-0.000000522],[0.000009540,-0.000000512],[0.000009477,-0.000000500],[0.000009414,-0.000000489],[0.000009352,-0.000000477],[0.000009292,-0.000000466],[0.000009228,-0.000000460],[0.000009155,-0.000000456],[0.000009086,-0.000000443],[0.000009014,-0.000000430],[0.000008939,-0.000000418],[0.000008863,-0.000000408],[0.000008792,-0.000000398],[0.000008732,-0.000000387],[0.000008677,-0.000000375],[0.000008624,-0.000000363],[0.000008573,-0.000000349],[0.000008523,-0.000000335],[0.000008474,-0.000000320],[0.000008425,-0.000000305],[0.000008376,-0.000000289],[0.000008326,-0.000000273],[0.000008277,-0.000000257],[0.000008227,-0.000000240],[0.000008177,-0.000000224],[0.000008126,-0.000000207],[0.000008075,-0.000000190],[0.000008024,-0.000000174],[0.000007972,-0.000000157],[0.000007920,-0.000000141],[0.000007868,-0.000000124],[0.000007815,-0.000000108],[0.000007762,-0.000000092],[0.000007709,-0.000000077],[0.000007655,-0.000000061],[0.000007602,-0.000000045],[0.000007548,-0.000000029],[0.000007494,-0.000000014],[0.000007440,0.000000001],[0.000007385,0.000000017],[0.000007331,0.000000032],[0.000007277,0.000000047],[0.000007222,0.000000063],[0.000016811,-0.000000984],[0.000016779,-0.000000977],[0.000016747,-0.000000969],[0.000016716,-0.000000962],[0.000016684,-0.000000955],[0.000016652,-0.000000948],[0.000016621,-0.000000942],[0.000016590,-0.000000935],[0.000016558,-0.000000930],[0.000016528,-0.000000925],[0.000016497,-0.000000922],[0.000016467,-0.000000919],[0.000016438,-0.000000919],[0.000016408,-0.000000920],[0.000016379,-0.000000924],[0.000016351,-0.000000930],[0.000016322,-0.000000939],[0.000016294,-0.000000951],[0.000016265,-0.000000966],[0.000016236,-0.000000984],[0.000016205,-0.000001005],[0.000016173,-0.000001028],[0.000016139,-0.000001054],[0.000016103,-0.000001082],[0.000016063,-0.000001112],[0.000016020,-0.000001142],[0.000015973,-0.000001171],[0.000015921,-0.000001200],[0.000015865,-0.000001227],[0.000015803,-0.000001251],[0.000015737,-0.000001272],[0.000015667,-0.000001289],[0.000015592,-0.000001302],[0.000015513,-0.000001311],[0.000015429,-0.000001315],[0.000015342,-0.000001314],[0.000015252,-0.000001310],[0.000015160,-0.000001302],[0.000015067,-0.000001291],[0.000014975,-0.000001278],[0.000014887,-0.000001263],[0.000014803,-0.000001248],[0.000014720,-0.000001235],[0.000014634,-0.000001229],[0.000014547,-0.000001229],[0.000014472,-0.000001227],[0.000014410,-0.000001211],[0.000014342,-0.000001191],[0.000014261,-0.000001174],[0.000014184,-0.000001161],[0.000014113,-0.000001151],[0.000014056,-0.000001144],[0.000013988,-0.000001134],[0.000013906,-0.000001123],[0.000013836,-0.000001116],[0.000013766,-0.000001109],[0.000013687,-0.000001100],[0.000013606,-0.000001084],[0.000013534,-0.000001067],[0.000013466,-0.000001052],[0.000013401,-0.000001042],[0.000013335,-0.000001035],[0.000013270,-0.000001027],[0.000013207,-0.000001020],[0.000013143,-0.000001010],[0.000013078,-0.000000997],[0.000013010,-0.000000982],[0.000012941,-0.000000966],[0.000012871,-0.000000952],[0.000012800,-0.000000939],[0.000012727,-0.000000922],[0.000012655,-0.000000906],[0.000012585,-0.000000893],[0.000012517,-0.000000879],[0.000012451,-0.000000864],[0.000012386,-0.000000846],[0.000012318,-0.000000829],[0.000012247,-0.000000811],[0.000012172,-0.000000795],[0.000012099,-0.000000781],[0.000012032,-0.000000769],[0.000011969,-0.000000757],[0.000011901,-0.000000747],[0.000011824,-0.000000743],[0.000011745,-0.000000742],[0.000011666,-0.000000743],[0.000011579,-0.000000736],[0.000011500,-0.000000731],[0.000011428,-0.000000725],[0.000011353,-0.000000715],[0.000011270,-0.000000705],[0.000011185,-0.000000698],[0.000011105,-0.000000690],[0.000011032,-0.000000679],[0.000010957,-0.000000669],[0.000010881,-0.000000658],[0.000010815,-0.000000644],[0.000010763,-0.000000628],[0.000010711,-0.000000615],[0.000010627,-0.000000614],[0.000010539,-0.000000610],[0.000010465,-0.000000595],[0.000010404,-0.000000583],[0.000010350,-0.000000588],[0.000010316,-0.000000586],[0.000010264,-0.000000577],[0.000010158,-0.000000573],[0.000010053,-0.000000569],[0.000009961,-0.000000566],[0.000009889,-0.000000563],[0.000009828,-0.000000564],[0.000009769,-0.000000561],[0.000009710,-0.000000546],[0.000009639,-0.000000537],[0.000009568,-0.000000533],[0.000009500,-0.000000528],[0.000009429,-0.000000518],[0.000009358,-0.000000504],[0.000009299,-0.000000485],[0.000009256,-0.000000463],[0.000009192,-0.000000455],[0.000009116,-0.000000451],[0.000009037,-0.000000445],[0.000008959,-0.000000438],[0.000008884,-0.000000429],[0.000008815,-0.000000420],[0.000008754,-0.000000409],[0.000008697,-0.000000398],[0.000008644,-0.000000386],[0.000008592,-0.000000373],[0.000008542,-0.000000360],[0.000008492,-0.000000346],[0.000008443,-0.000000331],[0.000008394,-0.000000316],[0.000008345,-0.000000301],[0.000008295,-0.000000285],[0.000008245,-0.000000269],[0.000008195,-0.000000253],[0.000008145,-0.000000237],[0.000008094,-0.000000221],[0.000008043,-0.000000205],[0.000007992,-0.000000189],[0.000007940,-0.000000173],[0.000007888,-0.000000157],[0.000007836,-0.000000141],[0.000007783,-0.000000125],[0.000007730,-0.000000109],[0.000007677,-0.000000094],[0.000007624,-0.000000078],[0.000007570,-0.000000063],[0.000007517,-0.000000048],[0.000007463,-0.000000032],[0.000007409,-0.000000017],[0.000007355,-0.000000002],[0.000007301,0.000000013],[0.000007247,0.000000029],[0.000016813,-0.000001014],[0.000016781,-0.000001004],[0.000016749,-0.000000995],[0.000016717,-0.000000986],[0.000016686,-0.000000977],[0.000016654,-0.000000968],[0.000016623,-0.000000959],[0.000016592,-0.000000951],[0.000016561,-0.000000943],[0.000016530,-0.000000935],[0.000016500,-0.000000929],[0.000016470,-0.000000924],[0.000016441,-0.000000921],[0.000016412,-0.000000920],[0.000016384,-0.000000921],[0.000016356,-0.000000924],[0.000016329,-0.000000931],[0.000016302,-0.000000940],[0.000016275,-0.000000953],[0.000016248,-0.000000970],[0.000016221,-0.000000990],[0.000016192,-0.000001014],[0.000016161,-0.000001040],[0.000016129,-0.000001069],[0.000016093,-0.000001101],[0.000016054,-0.000001134],[0.000016010,-0.000001167],[0.000015962,-0.000001200],[0.000015908,-0.000001230],[0.000015849,-0.000001258],[0.000015785,-0.000001283],[0.000015715,-0.000001302],[0.000015640,-0.000001317],[0.000015560,-0.000001327],[0.000015475,-0.000001331],[0.000015387,-0.000001331],[0.000015295,-0.000001327],[0.000015201,-0.000001318],[0.000015106,-0.000001307],[0.000015012,-0.000001295],[0.000014924,-0.000001280],[0.000014841,-0.000001265],[0.000014758,-0.000001253],[0.000014672,-0.000001246],[0.000014579,-0.000001249],[0.000014500,-0.000001243],[0.000014435,-0.000001224],[0.000014366,-0.000001207],[0.000014276,-0.000001191],[0.000014207,-0.000001180],[0.000014144,-0.000001170],[0.000014077,-0.000001159],[0.000014000,-0.000001147],[0.000013920,-0.000001136],[0.000013848,-0.000001129],[0.000013776,-0.000001120],[0.000013700,-0.000001108],[0.000013622,-0.000001094],[0.000013549,-0.000001078],[0.000013480,-0.000001065],[0.000013411,-0.000001057],[0.000013343,-0.000001049],[0.000013278,-0.000001039],[0.000013219,-0.000001032],[0.000013159,-0.000001023],[0.000013093,-0.000001010],[0.000013025,-0.000000994],[0.000012955,-0.000000977],[0.000012885,-0.000000961],[0.000012815,-0.000000951],[0.000012744,-0.000000938],[0.000012672,-0.000000924],[0.000012602,-0.000000911],[0.000012533,-0.000000898],[0.000012467,-0.000000885],[0.000012405,-0.000000869],[0.000012342,-0.000000850],[0.000012276,-0.000000831],[0.000012204,-0.000000816],[0.000012132,-0.000000806],[0.000012065,-0.000000800],[0.000012001,-0.000000798],[0.000011934,-0.000000792],[0.000011857,-0.000000778],[0.000011777,-0.000000767],[0.000011695,-0.000000758],[0.000011611,-0.000000756],[0.000011535,-0.000000768],[0.000011453,-0.000000759],[0.000011370,-0.000000744],[0.000011286,-0.000000730],[0.000011202,-0.000000723],[0.000011123,-0.000000718],[0.000011050,-0.000000712],[0.000010978,-0.000000705],[0.000010908,-0.000000694],[0.000010839,-0.000000679],[0.000010776,-0.000000663],[0.000010714,-0.000000653],[0.000010639,-0.000000648],[0.000010557,-0.000000646],[0.000010478,-0.000000643],[0.000010421,-0.000000624],[0.000010363,-0.000000616],[0.000010289,-0.000000623],[0.000010260,-0.000000613],[0.000010186,-0.000000610],[0.000010087,-0.000000607],[0.000009988,-0.000000604],[0.000009916,-0.000000596],[0.000009851,-0.000000601],[0.000009787,-0.000000604],[0.000009741,-0.000000566],[0.000009676,-0.000000548],[0.000009599,-0.000000549],[0.000009524,-0.000000549],[0.000009446,-0.000000543],[0.000009366,-0.000000531],[0.000009295,-0.000000511],[0.000009261,-0.000000479],[0.000009221,-0.000000461],[0.000009146,-0.000000462],[0.000009066,-0.000000462],[0.000008988,-0.000000458],[0.000008914,-0.000000451],[0.000008845,-0.000000442],[0.000008782,-0.000000432],[0.000008724,-0.000000421],[0.000008668,-0.000000409],[0.000008616,-0.000000397],[0.000008564,-0.000000384],[0.000008514,-0.000000371],[0.000008464,-0.000000357],[0.000008414,-0.000000343],[0.000008364,-0.000000328],[0.000008315,-0.000000313],[0.000008265,-0.000000298],[0.000008215,-0.000000282],[0.000008164,-0.000000267],[0.000008114,-0.000000251],[0.000008063,-0.000000236],[0.000008012,-0.000000220],[0.000007960,-0.000000204],[0.000007909,-0.000000189],[0.000007857,-0.000000173],[0.000007804,-0.000000158],[0.000007752,-0.000000142],[0.000007699,-0.000000127],[0.000007646,-0.000000111],[0.000007593,-0.000000096],[0.000007540,-0.000000081],[0.000007486,-0.000000066],[0.000007433,-0.000000051],[0.000007379,-0.000000036],[0.000007325,-0.000000021],[0.000007271,-0.000000006],[0.000016816,-0.000001044],[0.000016784,-0.000001033],[0.000016753,-0.000001022],[0.000016721,-0.000001011],[0.000016689,-0.000001000],[0.000016658,-0.000000989],[0.000016626,-0.000000978],[0.000016595,-0.000000968],[0.000016564,-0.000000957],[0.000016533,-0.000000948],[0.000016503,-0.000000939],[0.000016473,-0.000000931],[0.000016444,-0.000000925],[0.000016416,-0.000000921],[0.000016388,-0.000000919],[0.000016361,-0.000000919],[0.000016334,-0.000000923],[0.000016309,-0.000000930],[0.000016284,-0.000000941],[0.000016259,-0.000000955],[0.000016233,-0.000000974],[0.000016208,-0.000000997],[0.000016181,-0.000001023],[0.000016152,-0.000001053],[0.000016120,-0.000001086],[0.000016085,-0.000001122],[0.000016046,-0.000001158],[0.000016002,-0.000001195],[0.000015952,-0.000001231],[0.000015896,-0.000001264],[0.000015833,-0.000001292],[0.000015763,-0.000001314],[0.000015688,-0.000001330],[0.000015607,-0.000001341],[0.000015520,-0.000001345],[0.000015430,-0.000001344],[0.000015337,-0.000001339],[0.000015241,-0.000001330],[0.000015145,-0.000001318],[0.000015051,-0.000001305],[0.000014962,-0.000001289],[0.000014875,-0.000001277],[0.000014786,-0.000001272],[0.000014692,-0.000001275],[0.000014600,-0.000001270],[0.000014519,-0.000001250],[0.000014444,-0.000001224],[0.000014388,-0.000001217],[0.000014309,-0.000001207],[0.000014235,-0.000001196],[0.000014163,-0.000001184],[0.000014089,-0.000001173],[0.000014012,-0.000001162],[0.000013937,-0.000001151],[0.000013862,-0.000001141],[0.000013786,-0.000001131],[0.000013707,-0.000001118],[0.000013634,-0.000001104],[0.000013565,-0.000001090],[0.000013495,-0.000001079],[0.000013424,-0.000001072],[0.000013353,-0.000001066],[0.000013290,-0.000001055],[0.000013232,-0.000001045],[0.000013172,-0.000001035],[0.000013105,-0.000001023],[0.000013034,-0.000001009],[0.000012963,-0.000000993],[0.000012894,-0.000000978],[0.000012826,-0.000000966],[0.000012757,-0.000000954],[0.000012687,-0.000000942],[0.000012617,-0.000000929],[0.000012549,-0.000000916],[0.000012485,-0.000000905],[0.000012425,-0.000000892],[0.000012364,-0.000000872],[0.000012301,-0.000000853],[0.000012230,-0.000000840],[0.000012158,-0.000000832],[0.000012088,-0.000000827],[0.000012022,-0.000000826],[0.000011955,-0.000000821],[0.000011881,-0.000000806],[0.000011805,-0.000000792],[0.000011727,-0.000000780],[0.000011648,-0.000000777],[0.000011570,-0.000000787],[0.000011481,-0.000000786],[0.000011385,-0.000000775],[0.000011294,-0.000000762],[0.000011215,-0.000000752],[0.000011141,-0.000000746],[0.000011073,-0.000000743],[0.000011006,-0.000000739],[0.000010938,-0.000000730],[0.000010868,-0.000000716],[0.000010793,-0.000000701],[0.000010727,-0.000000694],[0.000010655,-0.000000684],[0.000010577,-0.000000677],[0.000010507,-0.000000671],[0.000010450,-0.000000655],[0.000010397,-0.000000638],[0.000010334,-0.000000638],[0.000010274,-0.000000643],[0.000010203,-0.000000646],[0.000010117,-0.000000640],[0.000010033,-0.000000630],[0.000009964,-0.000000618],[0.000009885,-0.000000627],[0.000009815,-0.000000621],[0.000009757,-0.000000599],[0.000009694,-0.000000579],[0.000009622,-0.000000573],[0.000009547,-0.000000570],[0.000009469,-0.000000565],[0.000009386,-0.000000554],[0.000009310,-0.000000537],[0.000009261,-0.000000513],[0.000009222,-0.000000493],[0.000009164,-0.000000486],[0.000009094,-0.000000484],[0.000009020,-0.000000479],[0.000008948,-0.000000472],[0.000008880,-0.000000463],[0.000008815,-0.000000454],[0.000008755,-0.000000443],[0.000008698,-0.000000432],[0.000008643,-0.000000421],[0.000008590,-0.000000408],[0.000008538,-0.000000396],[0.000008487,-0.000000382],[0.000008436,-0.000000369],[0.000008386,-0.000000355],[0.000008336,-0.000000340],[0.000008285,-0.000000326],[0.000008235,-0.000000311],[0.000008185,-0.000000296],[0.000008134,-0.000000281],[0.000008084,-0.000000266],[0.000008033,-0.000000251],[0.000007981,-0.000000235],[0.000007930,-0.000000220],[0.000007878,-0.000000205],[0.000007826,-0.000000190],[0.000007774,-0.000000175],[0.000007721,-0.000000160],[0.000007669,-0.000000144],[0.000007616,-0.000000129],[0.000007563,-0.000000114],[0.000007510,-0.000000099],[0.000007456,-0.000000084],[0.000007403,-0.000000069],[0.000007350,-0.000000055],[0.000007296,-0.000000040],[0.000016822,-0.000001076],[0.000016790,-0.000001063],[0.000016758,-0.000001050],[0.000016727,-0.000001038],[0.000016695,-0.000001025],[0.000016663,-0.000001012],[0.000016631,-0.000000999],[0.000016600,-0.000000987],[0.000016568,-0.000000974],[0.000016537,-0.000000962],[0.000016506,-0.000000951],[0.000016477,-0.000000941],[0.000016447,-0.000000931],[0.000016419,-0.000000924],[0.000016391,-0.000000919],[0.000016364,-0.000000916],[0.000016338,-0.000000916],[0.000016313,-0.000000920],[0.000016290,-0.000000928],[0.000016266,-0.000000940],[0.000016244,-0.000000957],[0.000016220,-0.000000978],[0.000016197,-0.000001004],[0.000016172,-0.000001035],[0.000016145,-0.000001069],[0.000016115,-0.000001106],[0.000016080,-0.000001146],[0.000016041,-0.000001188],[0.000015995,-0.000001228],[0.000015942,-0.000001266],[0.000015881,-0.000001299],[0.000015812,-0.000001324],[0.000015735,-0.000001342],[0.000015652,-0.000001351],[0.000015563,-0.000001354],[0.000015471,-0.000001351],[0.000015375,-0.000001345],[0.000015279,-0.000001336],[0.000015183,-0.000001323],[0.000015089,-0.000001308],[0.000014998,-0.000001292],[0.000014906,-0.000001281],[0.000014805,-0.000001287],[0.000014697,-0.000001305],[0.000014617,-0.000001286],[0.000014543,-0.000001259],[0.000014472,-0.000001236],[0.000014417,-0.000001232],[0.000014340,-0.000001220],[0.000014258,-0.000001207],[0.000014178,-0.000001196],[0.000014099,-0.000001185],[0.000014022,-0.000001176],[0.000013948,-0.000001166],[0.000013875,-0.000001156],[0.000013798,-0.000001144],[0.000013715,-0.000001131],[0.000013646,-0.000001117],[0.000013582,-0.000001104],[0.000013512,-0.000001093],[0.000013438,-0.000001086],[0.000013368,-0.000001080],[0.000013305,-0.000001069],[0.000013245,-0.000001058],[0.000013181,-0.000001047],[0.000013112,-0.000001036],[0.000013040,-0.000001026],[0.000012967,-0.000001015],[0.000012900,-0.000001000],[0.000012834,-0.000000986],[0.000012767,-0.000000973],[0.000012698,-0.000000961],[0.000012629,-0.000000947],[0.000012565,-0.000000933],[0.000012504,-0.000000919],[0.000012444,-0.000000909],[0.000012382,-0.000000895],[0.000012317,-0.000000880],[0.000012247,-0.000000868],[0.000012175,-0.000000859],[0.000012103,-0.000000851],[0.000012035,-0.000000847],[0.000011968,-0.000000841],[0.000011900,-0.000000830],[0.000011831,-0.000000820],[0.000011762,-0.000000812],[0.000011691,-0.000000811],[0.000011613,-0.000000814],[0.000011515,-0.000000813],[0.000011407,-0.000000805],[0.000011312,-0.000000794],[0.000011237,-0.000000782],[0.000011165,-0.000000776],[0.000011099,-0.000000777],[0.000011034,-0.000000776],[0.000010968,-0.000000767],[0.000010903,-0.000000754],[0.000010835,-0.000000749],[0.000010763,-0.000000732],[0.000010680,-0.000000719],[0.000010599,-0.000000708],[0.000010539,-0.000000700],[0.000010484,-0.000000689],[0.000010425,-0.000000675],[0.000010373,-0.000000669],[0.000010302,-0.000000673],[0.000010221,-0.000000676],[0.000010138,-0.000000668],[0.000010062,-0.000000655],[0.000009993,-0.000000649],[0.000009914,-0.000000658],[0.000009844,-0.000000642],[0.000009776,-0.000000625],[0.000009709,-0.000000610],[0.000009640,-0.000000600],[0.000009568,-0.000000593],[0.000009494,-0.000000587],[0.000009416,-0.000000576],[0.000009344,-0.000000561],[0.000009285,-0.000000544],[0.000009235,-0.000000527],[0.000009182,-0.000000515],[0.000009120,-0.000000508],[0.000009053,-0.000000501],[0.000008984,-0.000000493],[0.000008917,-0.000000485],[0.000008852,-0.000000476],[0.000008789,-0.000000466],[0.000008730,-0.000000455],[0.000008673,-0.000000444],[0.000008618,-0.000000432],[0.000008565,-0.000000420],[0.000008512,-0.000000408],[0.000008461,-0.000000395],[0.000008409,-0.000000381],[0.000008358,-0.000000367],[0.000008308,-0.000000353],[0.000008257,-0.000000339],[0.000008207,-0.000000325],[0.000008156,-0.000000310],[0.000008105,-0.000000296],[0.000008054,-0.000000281],[0.000008003,-0.000000266],[0.000007952,-0.000000252],[0.000007900,-0.000000237],[0.000007848,-0.000000222],[0.000007796,-0.000000207],[0.000007744,-0.000000192],[0.000007691,-0.000000177],[0.000007639,-0.000000162],[0.000007586,-0.000000148],[0.000007533,-0.000000133],[0.000007480,-0.000000118],[0.000007427,-0.000000103],[0.000007374,-0.000000088],[0.000007321,-0.000000074],[0.000016831,-0.000001108],[0.000016798,-0.000001094],[0.000016766,-0.000001080],[0.000016734,-0.000001065],[0.000016702,-0.000001051],[0.000016670,-0.000001037],[0.000016637,-0.000001022],[0.000016605,-0.000001007],[0.000016574,-0.000000993],[0.000016542,-0.000000979],[0.000016511,-0.000000965],[0.000016480,-0.000000952],[0.000016451,-0.000000940],[0.000016422,-0.000000929],[0.000016394,-0.000000921],[0.000016367,-0.000000914],[0.000016341,-0.000000911],[0.000016317,-0.000000911],[0.000016293,-0.000000916],[0.000016272,-0.000000925],[0.000016250,-0.000000939],[0.000016230,-0.000000959],[0.000016210,-0.000000983],[0.000016188,-0.000001013],[0.000016166,-0.000001048],[0.000016140,-0.000001088],[0.000016111,-0.000001130],[0.000016077,-0.000001175],[0.000016036,-0.000001221],[0.000015987,-0.000001264],[0.000015928,-0.000001302],[0.000015860,-0.000001332],[0.000015781,-0.000001351],[0.000015695,-0.000001358],[0.000015602,-0.000001357],[0.000015507,-0.000001351],[0.000015409,-0.000001343],[0.000015313,-0.000001335],[0.000015216,-0.000001324],[0.000015120,-0.000001308],[0.000015025,-0.000001292],[0.000014930,-0.000001282],[0.000014829,-0.000001286],[0.000014730,-0.000001293],[0.000014646,-0.000001283],[0.000014575,-0.000001265],[0.000014517,-0.000001255],[0.000014443,-0.000001240],[0.000014356,-0.000001224],[0.000014272,-0.000001214],[0.000014189,-0.000001206],[0.000014107,-0.000001198],[0.000014028,-0.000001189],[0.000013952,-0.000001180],[0.000013879,-0.000001171],[0.000013807,-0.000001161],[0.000013730,-0.000001149],[0.000013662,-0.000001135],[0.000013599,-0.000001120],[0.000013527,-0.000001108],[0.000013450,-0.000001100],[0.000013384,-0.000001093],[0.000013322,-0.000001083],[0.000013258,-0.000001071],[0.000013191,-0.000001060],[0.000013119,-0.000001050],[0.000013045,-0.000001040],[0.000012972,-0.000001033],[0.000012905,-0.000001021],[0.000012840,-0.000001009],[0.000012774,-0.000000997],[0.000012706,-0.000000984],[0.000012638,-0.000000968],[0.000012575,-0.000000950],[0.000012518,-0.000000932],[0.000012460,-0.000000924],[0.000012397,-0.000000917],[0.000012329,-0.000000906],[0.000012259,-0.000000895],[0.000012186,-0.000000886],[0.000012114,-0.000000878],[0.000012047,-0.000000871],[0.000011982,-0.000000865],[0.000011918,-0.000000858],[0.000011855,-0.000000851],[0.000011792,-0.000000846],[0.000011726,-0.000000845],[0.000011653,-0.000000846],[0.000011546,-0.000000840],[0.000011435,-0.000000830],[0.000011342,-0.000000819],[0.000011274,-0.000000812],[0.000011200,-0.000000810],[0.000011127,-0.000000814],[0.000011059,-0.000000815],[0.000010994,-0.000000807],[0.000010933,-0.000000785],[0.000010874,-0.000000750],[0.000010800,-0.000000739],[0.000010713,-0.000000756],[0.000010629,-0.000000747],[0.000010572,-0.000000737],[0.000010524,-0.000000726],[0.000010467,-0.000000714],[0.000010415,-0.000000705],[0.000010327,-0.000000702],[0.000010238,-0.000000699],[0.000010152,-0.000000690],[0.000010075,-0.000000677],[0.000010022,-0.000000665],[0.000009949,-0.000000666],[0.000009876,-0.000000658],[0.000009802,-0.000000647],[0.000009728,-0.000000636],[0.000009658,-0.000000626],[0.000009589,-0.000000617],[0.000009520,-0.000000609],[0.000009449,-0.000000599],[0.000009382,-0.000000587],[0.000009320,-0.000000572],[0.000009263,-0.000000558],[0.000009207,-0.000000545],[0.000009148,-0.000000534],[0.000009085,-0.000000525],[0.000009020,-0.000000516],[0.000008954,-0.000000507],[0.000008889,-0.000000498],[0.000008826,-0.000000488],[0.000008765,-0.000000478],[0.000008706,-0.000000467],[0.000008649,-0.000000456],[0.000008594,-0.000000445],[0.000008540,-0.000000432],[0.000008487,-0.000000420],[0.000008434,-0.000000407],[0.000008383,-0.000000394],[0.000008331,-0.000000381],[0.000008280,-0.000000367],[0.000008229,-0.000000353],[0.000008179,-0.000000339],[0.000008128,-0.000000325],[0.000008077,-0.000000311],[0.000008026,-0.000000297],[0.000007974,-0.000000283],[0.000007923,-0.000000268],[0.000007871,-0.000000254],[0.000007819,-0.000000239],[0.000007767,-0.000000224],[0.000007714,-0.000000210],[0.000007662,-0.000000195],[0.000007609,-0.000000181],[0.000007557,-0.000000166],[0.000007504,-0.000000151],[0.000007451,-0.000000137],[0.000007398,-0.000000122],[0.000007345,-0.000000108],[0.000016842,-0.000001141],[0.000016809,-0.000001126],[0.000016777,-0.000001110],[0.000016744,-0.000001094],[0.000016711,-0.000001078],[0.000016678,-0.000001062],[0.000016645,-0.000001046],[0.000016613,-0.000001030],[0.000016580,-0.000001014],[0.000016548,-0.000000998],[0.000016516,-0.000000982],[0.000016485,-0.000000966],[0.000016455,-0.000000952],[0.000016425,-0.000000938],[0.000016396,-0.000000926],[0.000016369,-0.000000916],[0.000016343,-0.000000908],[0.000016318,-0.000000905],[0.000016296,-0.000000905],[0.000016274,-0.000000911],[0.000016255,-0.000000922],[0.000016236,-0.000000939],[0.000016218,-0.000000962],[0.000016201,-0.000000991],[0.000016182,-0.000001026],[0.000016162,-0.000001066],[0.000016138,-0.000001111],[0.000016109,-0.000001159],[0.000016073,-0.000001208],[0.000016029,-0.000001256],[0.000015974,-0.000001301],[0.000015907,-0.000001336],[0.000015826,-0.000001356],[0.000015735,-0.000001359],[0.000015636,-0.000001352],[0.000015536,-0.000001342],[0.000015436,-0.000001333],[0.000015338,-0.000001327],[0.000015242,-0.000001319],[0.000015143,-0.000001303],[0.000015044,-0.000001289],[0.000014947,-0.000001281],[0.000014852,-0.000001279],[0.000014763,-0.000001278],[0.000014678,-0.000001271],[0.000014598,-0.000001257],[0.000014514,-0.000001235],[0.000014432,-0.000001221],[0.000014359,-0.000001222],[0.000014280,-0.000001220],[0.000014198,-0.000001216],[0.000014114,-0.000001209],[0.000014030,-0.000001202],[0.000013949,-0.000001194],[0.000013875,-0.000001187],[0.000013806,-0.000001180],[0.000013738,-0.000001170],[0.000013670,-0.000001157],[0.000013602,-0.000001143],[0.000013529,-0.000001130],[0.000013460,-0.000001120],[0.000013400,-0.000001109],[0.000013338,-0.000001096],[0.000013272,-0.000001083],[0.000013201,-0.000001073],[0.000013126,-0.000001064],[0.000013052,-0.000001053],[0.000012979,-0.000001043],[0.000012911,-0.000001036],[0.000012846,-0.000001031],[0.000012781,-0.000001023],[0.000012715,-0.000001008],[0.000012647,-0.000000990],[0.000012580,-0.000000972],[0.000012522,-0.000000958],[0.000012470,-0.000000952],[0.000012407,-0.000000939],[0.000012339,-0.000000927],[0.000012268,-0.000000919],[0.000012197,-0.000000914],[0.000012128,-0.000000911],[0.000012062,-0.000000901],[0.000011998,-0.000000894],[0.000011937,-0.000000888],[0.000011875,-0.000000881],[0.000011811,-0.000000877],[0.000011741,-0.000000874],[0.000011659,-0.000000871],[0.000011558,-0.000000865],[0.000011455,-0.000000856],[0.000011367,-0.000000847],[0.000011311,-0.000000843],[0.000011230,-0.000000843],[0.000011150,-0.000000846],[0.000011076,-0.000000849],[0.000011010,-0.000000847],[0.000010950,-0.000000825],[0.000010887,-0.000000795],[0.000010809,-0.000000783],[0.000010725,-0.000000788],[0.000010651,-0.000000783],[0.000010598,-0.000000774],[0.000010552,-0.000000764],[0.000010473,-0.000000752],[0.000010399,-0.000000740],[0.000010335,-0.000000731],[0.000010260,-0.000000723],[0.000010171,-0.000000712],[0.000010083,-0.000000699],[0.000010028,-0.000000688],[0.000009973,-0.000000681],[0.000009909,-0.000000674],[0.000009836,-0.000000665],[0.000009754,-0.000000657],[0.000009682,-0.000000648],[0.000009615,-0.000000641],[0.000009550,-0.000000634],[0.000009484,-0.000000624],[0.000009421,-0.000000613],[0.000009358,-0.000000600],[0.000009298,-0.000000587],[0.000009240,-0.000000573],[0.000009180,-0.000000561],[0.000009119,-0.000000550],[0.000009056,-0.000000540],[0.000008991,-0.000000531],[0.000008926,-0.000000521],[0.000008863,-0.000000511],[0.000008801,-0.000000501],[0.000008740,-0.000000491],[0.000008682,-0.000000480],[0.000008624,-0.000000469],[0.000008569,-0.000000457],[0.000008514,-0.000000445],[0.000008461,-0.000000433],[0.000008408,-0.000000420],[0.000008356,-0.000000408],[0.000008305,-0.000000395],[0.000008254,-0.000000382],[0.000008202,-0.000000368],[0.000008151,-0.000000355],[0.000008100,-0.000000341],[0.000008049,-0.000000327],[0.000007997,-0.000000313],[0.000007946,-0.000000299],[0.000007894,-0.000000285],[0.000007842,-0.000000271],[0.000007790,-0.000000257],[0.000007738,-0.000000242],[0.000007686,-0.000000228],[0.000007633,-0.000000213],[0.000007581,-0.000000199],[0.000007528,-0.000000185],[0.000007475,-0.000000170],[0.000007423,-0.000000156],[0.000007370,-0.000000142],[0.000016857,-0.000001174],[0.000016823,-0.000001158],[0.000016789,-0.000001141],[0.000016756,-0.000001124],[0.000016722,-0.000001107],[0.000016689,-0.000001090],[0.000016655,-0.000001072],[0.000016622,-0.000001055],[0.000016588,-0.000001037],[0.000016556,-0.000001019],[0.000016523,-0.000001001],[0.000016491,-0.000000983],[0.000016460,-0.000000966],[0.000016429,-0.000000950],[0.000016399,-0.000000934],[0.000016371,-0.000000921],[0.000016344,-0.000000909],[0.000016319,-0.000000901],[0.000016296,-0.000000897],[0.000016275,-0.000000899],[0.000016256,-0.000000906],[0.000016239,-0.000000920],[0.000016223,-0.000000940],[0.000016209,-0.000000968],[0.000016194,-0.000001002],[0.000016178,-0.000001042],[0.000016160,-0.000001088],[0.000016136,-0.000001138],[0.000016106,-0.000001190],[0.000016066,-0.000001242],[0.000016014,-0.000001290],[0.000015949,-0.000001329],[0.000015868,-0.000001351],[0.000015769,-0.000001350],[0.000015664,-0.000001339],[0.000015558,-0.000001326],[0.000015455,-0.000001315],[0.000015354,-0.000001309],[0.000015256,-0.000001302],[0.000015157,-0.000001289],[0.000015056,-0.000001282],[0.000014960,-0.000001277],[0.000014871,-0.000001270],[0.000014789,-0.000001263],[0.000014705,-0.000001259],[0.000014622,-0.000001254],[0.000014536,-0.000001243],[0.000014448,-0.000001231],[0.000014366,-0.000001228],[0.000014286,-0.000001228],[0.000014205,-0.000001225],[0.000014118,-0.000001221],[0.000014031,-0.000001214],[0.000013946,-0.000001207],[0.000013871,-0.000001202],[0.000013809,-0.000001199],[0.000013744,-0.000001192],[0.000013675,-0.000001178],[0.000013600,-0.000001163],[0.000013524,-0.000001150],[0.000013465,-0.000001137],[0.000013414,-0.000001124],[0.000013350,-0.000001109],[0.000013283,-0.000001097],[0.000013210,-0.000001088],[0.000013135,-0.000001080],[0.000013060,-0.000001068],[0.000012988,-0.000001056],[0.000012919,-0.000001052],[0.000012853,-0.000001052],[0.000012789,-0.000001048],[0.000012727,-0.000001030],[0.000012659,-0.000001011],[0.000012584,-0.000000995],[0.000012521,-0.000000980],[0.000012471,-0.000000966],[0.000012413,-0.000000953],[0.000012348,-0.000000943],[0.000012277,-0.000000939],[0.000012208,-0.000000937],[0.000012142,-0.000000935],[0.000012077,-0.000000927],[0.000012014,-0.000000919],[0.000011953,-0.000000912],[0.000011890,-0.000000907],[0.000011823,-0.000000904],[0.000011746,-0.000000900],[0.000011657,-0.000000895],[0.000011560,-0.000000889],[0.000011471,-0.000000885],[0.000011391,-0.000000881],[0.000011320,-0.000000879],[0.000011241,-0.000000873],[0.000011159,-0.000000867],[0.000011081,-0.000000867],[0.000011015,-0.000000872],[0.000010958,-0.000000860],[0.000010895,-0.000000839],[0.000010816,-0.000000826],[0.000010725,-0.000000821],[0.000010658,-0.000000814],[0.000010607,-0.000000804],[0.000010549,-0.000000794],[0.000010470,-0.000000783],[0.000010400,-0.000000771],[0.000010348,-0.000000760],[0.000010288,-0.000000747],[0.000010201,-0.000000730],[0.000010116,-0.000000718],[0.000010050,-0.000000711],[0.000009996,-0.000000704],[0.000009941,-0.000000695],[0.000009881,-0.000000682],[0.000009796,-0.000000674],[0.000009717,-0.000000668],[0.000009649,-0.000000665],[0.000009584,-0.000000659],[0.000009521,-0.000000650],[0.000009460,-0.000000639],[0.000009399,-0.000000627],[0.000009338,-0.000000614],[0.000009277,-0.000000601],[0.000009216,-0.000000588],[0.000009154,-0.000000576],[0.000009091,-0.000000565],[0.000009027,-0.000000555],[0.000008963,-0.000000545],[0.000008900,-0.000000535],[0.000008837,-0.000000525],[0.000008775,-0.000000515],[0.000008715,-0.000000504],[0.000008656,-0.000000493],[0.000008599,-0.000000482],[0.000008543,-0.000000470],[0.000008489,-0.000000459],[0.000008435,-0.000000447],[0.000008383,-0.000000435],[0.000008330,-0.000000422],[0.000008279,-0.000000410],[0.000008227,-0.000000397],[0.000008176,-0.000000384],[0.000008124,-0.000000371],[0.000008073,-0.000000357],[0.000008021,-0.000000344],[0.000007970,-0.000000330],[0.000007918,-0.000000317],[0.000007866,-0.000000303],[0.000007814,-0.000000289],[0.000007762,-0.000000275],[0.000007710,-0.000000260],[0.000007657,-0.000000246],[0.000007605,-0.000000232],[0.000007552,-0.000000218],[0.000007500,-0.000000204],[0.000007447,-0.000000190],[0.000007394,-0.000000175],[0.000016874,-0.000001208],[0.000016839,-0.000001190],[0.000016804,-0.000001172],[0.000016770,-0.000001154],[0.000016736,-0.000001136],[0.000016701,-0.000001118],[0.000016667,-0.000001099],[0.000016633,-0.000001081],[0.000016598,-0.000001061],[0.000016564,-0.000001042],[0.000016531,-0.000001023],[0.000016498,-0.000001003],[0.000016466,-0.000000984],[0.000016434,-0.000000964],[0.000016403,-0.000000946],[0.000016374,-0.000000929],[0.000016346,-0.000000914],[0.000016320,-0.000000901],[0.000016295,-0.000000893],[0.000016274,-0.000000889],[0.000016254,-0.000000892],[0.000016238,-0.000000902],[0.000016224,-0.000000919],[0.000016212,-0.000000945],[0.000016201,-0.000000978],[0.000016190,-0.000001018],[0.000016176,-0.000001064],[0.000016158,-0.000001115],[0.000016132,-0.000001168],[0.000016096,-0.000001221],[0.000016048,-0.000001269],[0.000015984,-0.000001307],[0.000015901,-0.000001328],[0.000015800,-0.000001330],[0.000015687,-0.000001321],[0.000015573,-0.000001307],[0.000015466,-0.000001295],[0.000015364,-0.000001287],[0.000015263,-0.000001280],[0.000015163,-0.000001274],[0.000015065,-0.000001273],[0.000014971,-0.000001272],[0.000014882,-0.000001266],[0.000014802,-0.000001251],[0.000014723,-0.000001250],[0.000014643,-0.000001255],[0.000014558,-0.000001254],[0.000014466,-0.000001243],[0.000014377,-0.000001237],[0.000014292,-0.000001236],[0.000014209,-0.000001234],[0.000014119,-0.000001232],[0.000014032,-0.000001226],[0.000013951,-0.000001220],[0.000013885,-0.000001216],[0.000013821,-0.000001213],[0.000013752,-0.000001207],[0.000013681,-0.000001193],[0.000013604,-0.000001171],[0.000013529,-0.000001155],[0.000013469,-0.000001143],[0.000013415,-0.000001133],[0.000013353,-0.000001122],[0.000013287,-0.000001112],[0.000013218,-0.000001105],[0.000013145,-0.000001098],[0.000013070,-0.000001089],[0.000012997,-0.000001078],[0.000012927,-0.000001071],[0.000012861,-0.000001066],[0.000012798,-0.000001061],[0.000012741,-0.000001044],[0.000012677,-0.000001029],[0.000012607,-0.000001015],[0.000012534,-0.000000997],[0.000012478,-0.000000977],[0.000012422,-0.000000962],[0.000012358,-0.000000956],[0.000012290,-0.000000955],[0.000012222,-0.000000954],[0.000012157,-0.000000952],[0.000012092,-0.000000946],[0.000012028,-0.000000939],[0.000011964,-0.000000934],[0.000011898,-0.000000930],[0.000011829,-0.000000928],[0.000011751,-0.000000926],[0.000011663,-0.000000923],[0.000011567,-0.000000917],[0.000011484,-0.000000916],[0.000011404,-0.000000915],[0.000011324,-0.000000912],[0.000011242,-0.000000898],[0.000011159,-0.000000882],[0.000011079,-0.000000869],[0.000011015,-0.000000870],[0.000010962,-0.000000873],[0.000010906,-0.000000869],[0.000010832,-0.000000861],[0.000010742,-0.000000852],[0.000010674,-0.000000841],[0.000010617,-0.000000830],[0.000010554,-0.000000820],[0.000010485,-0.000000811],[0.000010420,-0.000000800],[0.000010365,-0.000000786],[0.000010309,-0.000000768],[0.000010221,-0.000000744],[0.000010145,-0.000000737],[0.000010080,-0.000000736],[0.000010023,-0.000000733],[0.000009967,-0.000000726],[0.000009911,-0.000000710],[0.000009837,-0.000000697],[0.000009761,-0.000000690],[0.000009688,-0.000000688],[0.000009621,-0.000000684],[0.000009559,-0.000000676],[0.000009499,-0.000000666],[0.000009440,-0.000000653],[0.000009379,-0.000000640],[0.000009316,-0.000000627],[0.000009253,-0.000000615],[0.000009190,-0.000000603],[0.000009127,-0.000000592],[0.000009064,-0.000000581],[0.000009000,-0.000000570],[0.000008936,-0.000000560],[0.000008873,-0.000000550],[0.000008810,-0.000000539],[0.000008748,-0.000000529],[0.000008689,-0.000000518],[0.000008630,-0.000000507],[0.000008573,-0.000000496],[0.000008518,-0.000000484],[0.000008463,-0.000000473],[0.000008410,-0.000000461],[0.000008357,-0.000000450],[0.000008305,-0.000000438],[0.000008253,-0.000000425],[0.000008201,-0.000000413],[0.000008149,-0.000000400],[0.000008097,-0.000000388],[0.000008046,-0.000000374],[0.000007994,-0.000000361],[0.000007942,-0.000000348],[0.000007890,-0.000000334],[0.000007838,-0.000000320],[0.000007786,-0.000000307],[0.000007734,-0.000000293],[0.000007681,-0.000000279],[0.000007629,-0.000000265],[0.000007576,-0.000000251],[0.000007524,-0.000000237],[0.000007471,-0.000000223],[0.000007419,-0.000000209],[0.000016894,-0.000001241],[0.000016858,-0.000001222],[0.000016822,-0.000001204],[0.000016787,-0.000001185],[0.000016752,-0.000001166],[0.000016716,-0.000001147],[0.000016681,-0.000001128],[0.000016645,-0.000001108],[0.000016610,-0.000001088],[0.000016575,-0.000001067],[0.000016540,-0.000001047],[0.000016507,-0.000001025],[0.000016473,-0.000001004],[0.000016440,-0.000000983],[0.000016408,-0.000000962],[0.000016377,-0.000000942],[0.000016348,-0.000000923],[0.000016320,-0.000000906],[0.000016294,-0.000000893],[0.000016271,-0.000000885],[0.000016251,-0.000000882],[0.000016235,-0.000000887],[0.000016222,-0.000000901],[0.000016212,-0.000000924],[0.000016204,-0.000000955],[0.000016196,-0.000000995],[0.000016187,-0.000001041],[0.000016172,-0.000001092],[0.000016150,-0.000001144],[0.000016117,-0.000001195],[0.000016072,-0.000001240],[0.000016011,-0.000001276],[0.000015931,-0.000001299],[0.000015829,-0.000001305],[0.000015708,-0.000001298],[0.000015582,-0.000001285],[0.000015478,-0.000001274],[0.000015378,-0.000001266],[0.000015274,-0.000001260],[0.000015171,-0.000001259],[0.000015077,-0.000001264],[0.000014984,-0.000001268],[0.000014892,-0.000001265],[0.000014811,-0.000001244],[0.000014735,-0.000001251],[0.000014655,-0.000001258],[0.000014568,-0.000001255],[0.000014476,-0.000001247],[0.000014389,-0.000001243],[0.000014298,-0.000001243],[0.000014207,-0.000001244],[0.000014116,-0.000001242],[0.000014031,-0.000001236],[0.000013958,-0.000001231],[0.000013898,-0.000001228],[0.000013825,-0.000001221],[0.000013753,-0.000001212],[0.000013686,-0.000001199],[0.000013615,-0.000001162],[0.000013542,-0.000001147],[0.000013475,-0.000001143],[0.000013412,-0.000001139],[0.000013349,-0.000001133],[0.000013290,-0.000001126],[0.000013227,-0.000001119],[0.000013157,-0.000001114],[0.000013082,-0.000001109],[0.000013007,-0.000001097],[0.000012936,-0.000001084],[0.000012868,-0.000001073],[0.000012806,-0.000001063],[0.000012747,-0.000001053],[0.000012682,-0.000001044],[0.000012615,-0.000001033],[0.000012550,-0.000001014],[0.000012492,-0.000000991],[0.000012434,-0.000000972],[0.000012369,-0.000000969],[0.000012302,-0.000000970],[0.000012236,-0.000000970],[0.000012170,-0.000000967],[0.000012105,-0.000000962],[0.000012038,-0.000000957],[0.000011970,-0.000000953],[0.000011899,-0.000000950],[0.000011830,-0.000000949],[0.000011760,-0.000000953],[0.000011679,-0.000000954],[0.000011587,-0.000000950],[0.000011497,-0.000000947],[0.000011410,-0.000000942],[0.000011326,-0.000000933],[0.000011243,-0.000000917],[0.000011162,-0.000000898],[0.000011086,-0.000000883],[0.000011022,-0.000000880],[0.000010967,-0.000000885],[0.000010910,-0.000000887],[0.000010842,-0.000000884],[0.000010766,-0.000000876],[0.000010697,-0.000000865],[0.000010634,-0.000000854],[0.000010571,-0.000000844],[0.000010505,-0.000000838],[0.000010440,-0.000000829],[0.000010376,-0.000000812],[0.000010305,-0.000000786],[0.000010231,-0.000000765],[0.000010169,-0.000000764],[0.000010111,-0.000000765],[0.000010053,-0.000000764],[0.000009992,-0.000000756],[0.000009932,-0.000000740],[0.000009871,-0.000000722],[0.000009803,-0.000000711],[0.000009729,-0.000000711],[0.000009659,-0.000000710],[0.000009596,-0.000000703],[0.000009538,-0.000000692],[0.000009480,-0.000000679],[0.000009418,-0.000000666],[0.000009354,-0.000000654],[0.000009290,-0.000000642],[0.000009226,-0.000000630],[0.000009163,-0.000000619],[0.000009100,-0.000000608],[0.000009036,-0.000000597],[0.000008972,-0.000000586],[0.000008908,-0.000000575],[0.000008844,-0.000000565],[0.000008782,-0.000000554],[0.000008721,-0.000000543],[0.000008662,-0.000000532],[0.000008604,-0.000000521],[0.000008548,-0.000000510],[0.000008493,-0.000000499],[0.000008439,-0.000000488],[0.000008385,-0.000000477],[0.000008332,-0.000000466],[0.000008280,-0.000000454],[0.000008227,-0.000000442],[0.000008175,-0.000000430],[0.000008123,-0.000000417],[0.000008071,-0.000000405],[0.000008019,-0.000000392],[0.000007967,-0.000000379],[0.000007915,-0.000000365],[0.000007863,-0.000000352],[0.000007810,-0.000000339],[0.000007758,-0.000000325],[0.000007706,-0.000000311],[0.000007653,-0.000000298],[0.000007601,-0.000000284],[0.000007548,-0.000000270],[0.000007496,-0.000000256],[0.000007443,-0.000000243],[0.000016917,-0.000001274],[0.000016880,-0.000001255],[0.000016843,-0.000001236],[0.000016806,-0.000001216],[0.000016770,-0.000001197],[0.000016733,-0.000001177],[0.000016697,-0.000001157],[0.000016660,-0.000001136],[0.000016624,-0.000001116],[0.000016588,-0.000001094],[0.000016552,-0.000001073],[0.000016516,-0.000001050],[0.000016482,-0.000001028],[0.000016447,-0.000001005],[0.000016414,-0.000000982],[0.000016382,-0.000000959],[0.000016351,-0.000000937],[0.000016321,-0.000000917],[0.000016294,-0.000000899],[0.000016269,-0.000000885],[0.000016247,-0.000000877],[0.000016230,-0.000000877],[0.000016217,-0.000000886],[0.000016208,-0.000000906],[0.000016203,-0.000000937],[0.000016198,-0.000000976],[0.000016191,-0.000001022],[0.000016178,-0.000001071],[0.000016157,-0.000001120],[0.000016126,-0.000001166],[0.000016084,-0.000001208],[0.000016028,-0.000001243],[0.000015956,-0.000001269],[0.000015860,-0.000001282],[0.000015732,-0.000001277],[0.000015602,-0.000001264],[0.000015495,-0.000001256],[0.000015401,-0.000001250],[0.000015301,-0.000001247],[0.000015194,-0.000001249],[0.000015096,-0.000001257],[0.000015002,-0.000001262],[0.000014915,-0.000001260],[0.000014832,-0.000001258],[0.000014752,-0.000001275],[0.000014663,-0.000001264],[0.000014572,-0.000001253],[0.000014480,-0.000001245],[0.000014397,-0.000001245],[0.000014303,-0.000001248],[0.000014206,-0.000001251],[0.000014112,-0.000001247],[0.000014025,-0.000001240],[0.000013950,-0.000001234],[0.000013881,-0.000001229],[0.000013808,-0.000001220],[0.000013738,-0.000001206],[0.000013679,-0.000001180],[0.000013621,-0.000001143],[0.000013554,-0.000001143],[0.000013482,-0.000001147],[0.000013411,-0.000001147],[0.000013348,-0.000001144],[0.000013294,-0.000001138],[0.000013237,-0.000001130],[0.000013170,-0.000001121],[0.000013096,-0.000001115],[0.000013021,-0.000001105],[0.000012946,-0.000001090],[0.000012875,-0.000001074],[0.000012812,-0.000001064],[0.000012750,-0.000001060],[0.000012684,-0.000001057],[0.000012617,-0.000001050],[0.000012558,-0.000001035],[0.000012500,-0.000001015],[0.000012441,-0.000000996],[0.000012377,-0.000000989],[0.000012311,-0.000000987],[0.000012246,-0.000000984],[0.000012181,-0.000000981],[0.000012115,-0.000000977],[0.000012045,-0.000000975],[0.000011972,-0.000000973],[0.000011897,-0.000000971],[0.000011825,-0.000000971],[0.000011767,-0.000000980],[0.000011694,-0.000000985],[0.000011601,-0.000000981],[0.000011506,-0.000000974],[0.000011414,-0.000000964],[0.000011328,-0.000000951],[0.000011248,-0.000000935],[0.000011171,-0.000000919],[0.000011100,-0.000000906],[0.000011036,-0.000000901],[0.000010976,-0.000000903],[0.000010916,-0.000000904],[0.000010851,-0.000000903],[0.000010784,-0.000000897],[0.000010717,-0.000000888],[0.000010652,-0.000000880],[0.000010588,-0.000000873],[0.000010523,-0.000000868],[0.000010457,-0.000000860],[0.000010389,-0.000000845],[0.000010321,-0.000000830],[0.000010257,-0.000000815],[0.000010195,-0.000000802],[0.000010137,-0.000000795],[0.000010078,-0.000000791],[0.000010016,-0.000000782],[0.000009954,-0.000000768],[0.000009896,-0.000000751],[0.000009836,-0.000000740],[0.000009764,-0.000000741],[0.000009695,-0.000000740],[0.000009634,-0.000000731],[0.000009575,-0.000000718],[0.000009515,-0.000000704],[0.000009452,-0.000000692],[0.000009387,-0.000000681],[0.000009324,-0.000000670],[0.000009262,-0.000000659],[0.000009199,-0.000000647],[0.000009136,-0.000000636],[0.000009072,-0.000000624],[0.000009007,-0.000000613],[0.000008942,-0.000000601],[0.000008878,-0.000000590],[0.000008815,-0.000000579],[0.000008753,-0.000000568],[0.000008693,-0.000000558],[0.000008635,-0.000000547],[0.000008579,-0.000000537],[0.000008523,-0.000000526],[0.000008468,-0.000000516],[0.000008414,-0.000000505],[0.000008360,-0.000000494],[0.000008307,-0.000000483],[0.000008254,-0.000000471],[0.000008201,-0.000000460],[0.000008149,-0.000000447],[0.000008097,-0.000000435],[0.000008044,-0.000000422],[0.000007992,-0.000000410],[0.000007940,-0.000000397],[0.000007888,-0.000000384],[0.000007835,-0.000000370],[0.000007783,-0.000000357],[0.000007731,-0.000000344],[0.000007678,-0.000000330],[0.000007626,-0.000000317],[0.000007573,-0.000000303],[0.000007521,-0.000000290],[0.000007468,-0.000000276],[0.000016943,-0.000001307],[0.000016905,-0.000001287],[0.000016867,-0.000001267],[0.000016829,-0.000001247],[0.000016791,-0.000001228],[0.000016753,-0.000001207],[0.000016715,-0.000001187],[0.000016677,-0.000001166],[0.000016639,-0.000001145],[0.000016602,-0.000001123],[0.000016565,-0.000001100],[0.000016528,-0.000001077],[0.000016492,-0.000001054],[0.000016456,-0.000001030],[0.000016422,-0.000001005],[0.000016388,-0.000000981],[0.000016355,-0.000000957],[0.000016324,-0.000000934],[0.000016295,-0.000000912],[0.000016267,-0.000000894],[0.000016243,-0.000000880],[0.000016223,-0.000000873],[0.000016210,-0.000000878],[0.000016203,-0.000000895],[0.000016200,-0.000000925],[0.000016197,-0.000000965],[0.000016189,-0.000001009],[0.000016174,-0.000001054],[0.000016153,-0.000001099],[0.000016123,-0.000001140],[0.000016083,-0.000001177],[0.000016031,-0.000001210],[0.000015965,-0.000001238],[0.000015886,-0.000001262],[0.000015747,-0.000001255],[0.000015612,-0.000001244],[0.000015510,-0.000001242],[0.000015425,-0.000001241],[0.000015342,-0.000001241],[0.000015232,-0.000001243],[0.000015119,-0.000001250],[0.000015018,-0.000001256],[0.000014936,-0.000001252],[0.000014848,-0.000001254],[0.000014756,-0.000001259],[0.000014663,-0.000001253],[0.000014572,-0.000001246],[0.000014485,-0.000001243],[0.000014399,-0.000001246],[0.000014306,-0.000001249],[0.000014206,-0.000001248],[0.000014105,-0.000001243],[0.000014015,-0.000001236],[0.000013937,-0.000001230],[0.000013862,-0.000001225],[0.000013786,-0.000001215],[0.000013716,-0.000001200],[0.000013666,-0.000001182],[0.000013625,-0.000001165],[0.000013563,-0.000001158],[0.000013488,-0.000001156],[0.000013412,-0.000001156],[0.000013345,-0.000001154],[0.000013295,-0.000001148],[0.000013249,-0.000001137],[0.000013178,-0.000001121],[0.000013105,-0.000001113],[0.000013036,-0.000001110],[0.000012960,-0.000001093],[0.000012885,-0.000001073],[0.000012821,-0.000001066],[0.000012757,-0.000001064],[0.000012691,-0.000001064],[0.000012625,-0.000001061],[0.000012562,-0.000001053],[0.000012500,-0.000001043],[0.000012437,-0.000001025],[0.000012378,-0.000001011],[0.000012316,-0.000001004],[0.000012251,-0.000001000],[0.000012186,-0.000000997],[0.000012119,-0.000000995],[0.000012047,-0.000000995],[0.000011971,-0.000000995],[0.000011895,-0.000000997],[0.000011825,-0.000001000],[0.000011764,-0.000001006],[0.000011693,-0.000001007],[0.000011605,-0.000001004],[0.000011510,-0.000000997],[0.000011419,-0.000000985],[0.000011335,-0.000000969],[0.000011257,-0.000000954],[0.000011185,-0.000000941],[0.000011117,-0.000000933],[0.000011053,-0.000000928],[0.000010990,-0.000000926],[0.000010926,-0.000000925],[0.000010862,-0.000000922],[0.000010796,-0.000000917],[0.000010730,-0.000000912],[0.000010664,-0.000000906],[0.000010601,-0.000000902],[0.000010538,-0.000000899],[0.000010473,-0.000000891],[0.000010405,-0.000000878],[0.000010340,-0.000000864],[0.000010279,-0.000000849],[0.000010219,-0.000000836],[0.000010158,-0.000000827],[0.000010097,-0.000000818],[0.000010034,-0.000000808],[0.000009972,-0.000000797],[0.000009911,-0.000000788],[0.000009857,-0.000000780],[0.000009798,-0.000000777],[0.000009732,-0.000000773],[0.000009673,-0.000000761],[0.000009610,-0.000000746],[0.000009544,-0.000000731],[0.000009478,-0.000000720],[0.000009415,-0.000000710],[0.000009355,-0.000000700],[0.000009296,-0.000000689],[0.000009235,-0.000000677],[0.000009171,-0.000000665],[0.000009106,-0.000000652],[0.000009040,-0.000000640],[0.000008975,-0.000000628],[0.000008910,-0.000000616],[0.000008847,-0.000000605],[0.000008785,-0.000000594],[0.000008726,-0.000000584],[0.000008667,-0.000000573],[0.000008610,-0.000000564],[0.000008554,-0.000000554],[0.000008499,-0.000000543],[0.000008444,-0.000000533],[0.000008389,-0.000000522],[0.000008335,-0.000000512],[0.000008282,-0.000000501],[0.000008229,-0.000000489],[0.000008176,-0.000000477],[0.000008123,-0.000000465],[0.000008070,-0.000000453],[0.000008018,-0.000000440],[0.000007965,-0.000000428],[0.000007913,-0.000000415],[0.000007861,-0.000000402],[0.000007808,-0.000000389],[0.000007756,-0.000000376],[0.000007703,-0.000000363],[0.000007651,-0.000000349],[0.000007598,-0.000000336],[0.000007545,-0.000000323],[0.000007493,-0.000000310],[0.000016973,-0.000001340],[0.000016933,-0.000001319],[0.000016893,-0.000001299],[0.000016854,-0.000001279],[0.000016814,-0.000001258],[0.000016774,-0.000001238],[0.000016735,-0.000001217],[0.000016696,-0.000001196],[0.000016657,-0.000001175],[0.000016618,-0.000001152],[0.000016580,-0.000001130],[0.000016542,-0.000001106],[0.000016504,-0.000001082],[0.000016467,-0.000001058],[0.000016431,-0.000001033],[0.000016395,-0.000001007],[0.000016361,-0.000000981],[0.000016328,-0.000000956],[0.000016297,-0.000000932],[0.000016268,-0.000000911],[0.000016241,-0.000000892],[0.000016218,-0.000000881],[0.000016203,-0.000000879],[0.000016198,-0.000000894],[0.000016198,-0.000000925],[0.000016192,-0.000000964],[0.000016178,-0.000001005],[0.000016158,-0.000001045],[0.000016135,-0.000001084],[0.000016106,-0.000001119],[0.000016069,-0.000001151],[0.000016018,-0.000001181],[0.000015949,-0.000001208],[0.000015865,-0.000001231],[0.000015740,-0.000001232],[0.000015616,-0.000001230],[0.000015515,-0.000001233],[0.000015433,-0.000001238],[0.000015359,-0.000001239],[0.000015248,-0.000001238],[0.000015131,-0.000001238],[0.000015027,-0.000001239],[0.000014941,-0.000001237],[0.000014848,-0.000001237],[0.000014750,-0.000001237],[0.000014655,-0.000001234],[0.000014567,-0.000001234],[0.000014483,-0.000001238],[0.000014400,-0.000001244],[0.000014312,-0.000001247],[0.000014213,-0.000001244],[0.000014106,-0.000001234],[0.000014014,-0.000001227],[0.000013933,-0.000001224],[0.000013854,-0.000001219],[0.000013776,-0.000001211],[0.000013708,-0.000001203],[0.000013670,-0.000001199],[0.000013636,-0.000001192],[0.000013569,-0.000001177],[0.000013491,-0.000001168],[0.000013411,-0.000001164],[0.000013340,-0.000001162],[0.000013286,-0.000001156],[0.000013244,-0.000001142],[0.000013176,-0.000001119],[0.000013109,-0.000001110],[0.000013047,-0.000001113],[0.000012977,-0.000001096],[0.000012905,-0.000001078],[0.000012835,-0.000001072],[0.000012769,-0.000001071],[0.000012703,-0.000001071],[0.000012634,-0.000001070],[0.000012563,-0.000001066],[0.000012492,-0.000001057],[0.000012424,-0.000001043],[0.000012372,-0.000001031],[0.000012313,-0.000001022],[0.000012250,-0.000001016],[0.000012185,-0.000001014],[0.000012117,-0.000001014],[0.000012043,-0.000001015],[0.000011965,-0.000001017],[0.000011892,-0.000001023],[0.000011828,-0.000001031],[0.000011760,-0.000001029],[0.000011688,-0.000001025],[0.000011605,-0.000001021],[0.000011514,-0.000001017],[0.000011430,-0.000001006],[0.000011349,-0.000000990],[0.000011270,-0.000000974],[0.000011201,-0.000000965],[0.000011137,-0.000000961],[0.000011072,-0.000000958],[0.000011006,-0.000000955],[0.000010938,-0.000000950],[0.000010870,-0.000000945],[0.000010803,-0.000000939],[0.000010735,-0.000000936],[0.000010671,-0.000000933],[0.000010610,-0.000000929],[0.000010550,-0.000000924],[0.000010488,-0.000000917],[0.000010423,-0.000000906],[0.000010361,-0.000000891],[0.000010299,-0.000000876],[0.000010238,-0.000000866],[0.000010177,-0.000000858],[0.000010114,-0.000000849],[0.000010049,-0.000000839],[0.000009986,-0.000000829],[0.000009920,-0.000000827],[0.000009879,-0.000000817],[0.000009838,-0.000000809],[0.000009785,-0.000000802],[0.000009714,-0.000000789],[0.000009639,-0.000000774],[0.000009567,-0.000000760],[0.000009498,-0.000000750],[0.000009437,-0.000000741],[0.000009382,-0.000000731],[0.000009328,-0.000000720],[0.000009269,-0.000000707],[0.000009205,-0.000000695],[0.000009138,-0.000000682],[0.000009071,-0.000000669],[0.000009005,-0.000000656],[0.000008941,-0.000000643],[0.000008878,-0.000000631],[0.000008817,-0.000000621],[0.000008758,-0.000000610],[0.000008700,-0.000000601],[0.000008642,-0.000000591],[0.000008586,-0.000000581],[0.000008529,-0.000000572],[0.000008474,-0.000000562],[0.000008419,-0.000000551],[0.000008364,-0.000000541],[0.000008310,-0.000000530],[0.000008257,-0.000000519],[0.000008203,-0.000000507],[0.000008150,-0.000000495],[0.000008097,-0.000000483],[0.000008044,-0.000000471],[0.000007991,-0.000000459],[0.000007939,-0.000000446],[0.000007886,-0.000000433],[0.000007834,-0.000000421],[0.000007781,-0.000000408],[0.000007728,-0.000000395],[0.000007676,-0.000000382],[0.000007623,-0.000000369],[0.000007570,-0.000000356],[0.000007517,-0.000000343],[0.000017005,-0.000001372],[0.000016964,-0.000001351],[0.000016923,-0.000001330],[0.000016881,-0.000001310],[0.000016840,-0.000001289],[0.000016799,-0.000001268],[0.000016758,-0.000001248],[0.000016717,-0.000001226],[0.000016677,-0.000001205],[0.000016637,-0.000001183],[0.000016597,-0.000001160],[0.000016558,-0.000001137],[0.000016519,-0.000001113],[0.000016480,-0.000001088],[0.000016442,-0.000001063],[0.000016405,-0.000001037],[0.000016368,-0.000001011],[0.000016334,-0.000000985],[0.000016301,-0.000000960],[0.000016271,-0.000000937],[0.000016243,-0.000000917],[0.000016219,-0.000000902],[0.000016200,-0.000000896],[0.000016200,-0.000000908],[0.000016201,-0.000000942],[0.000016182,-0.000000977],[0.000016155,-0.000001012],[0.000016129,-0.000001045],[0.000016103,-0.000001078],[0.000016075,-0.000001108],[0.000016039,-0.000001134],[0.000015987,-0.000001159],[0.000015911,-0.000001183],[0.000015816,-0.000001201],[0.000015706,-0.000001209],[0.000015602,-0.000001218],[0.000015507,-0.000001227],[0.000015417,-0.000001235],[0.000015328,-0.000001237],[0.000015229,-0.000001230],[0.000015122,-0.000001223],[0.000015019,-0.000001219],[0.000014924,-0.000001219],[0.000014829,-0.000001220],[0.000014735,-0.000001218],[0.000014644,-0.000001218],[0.000014557,-0.000001222],[0.000014474,-0.000001228],[0.000014395,-0.000001236],[0.000014318,-0.000001244],[0.000014228,-0.000001238],[0.000014132,-0.000001229],[0.000014036,-0.000001222],[0.000013945,-0.000001219],[0.000013859,-0.000001215],[0.000013782,-0.000001211],[0.000013721,-0.000001209],[0.000013678,-0.000001208],[0.000013633,-0.000001201],[0.000013566,-0.000001187],[0.000013490,-0.000001176],[0.000013413,-0.000001170],[0.000013342,-0.000001166],[0.000013284,-0.000001159],[0.000013234,-0.000001148],[0.000013178,-0.000001137],[0.000013120,-0.000001131],[0.000013056,-0.000001117],[0.000012989,-0.000001100],[0.000012919,-0.000001087],[0.000012848,-0.000001083],[0.000012780,-0.000001082],[0.000012714,-0.000001080],[0.000012641,-0.000001080],[0.000012564,-0.000001077],[0.000012488,-0.000001070],[0.000012417,-0.000001059],[0.000012360,-0.000001048],[0.000012303,-0.000001039],[0.000012242,-0.000001032],[0.000012177,-0.000001028],[0.000012109,-0.000001028],[0.000012032,-0.000001029],[0.000011954,-0.000001034],[0.000011879,-0.000001043],[0.000011812,-0.000001048],[0.000011750,-0.000001044],[0.000011682,-0.000001039],[0.000011607,-0.000001035],[0.000011530,-0.000001031],[0.000011455,-0.000001026],[0.000011374,-0.000001016],[0.000011286,-0.000000996],[0.000011221,-0.000000991],[0.000011159,-0.000000991],[0.000011094,-0.000000990],[0.000011023,-0.000000986],[0.000010949,-0.000000980],[0.000010875,-0.000000973],[0.000010803,-0.000000967],[0.000010735,-0.000000963],[0.000010673,-0.000000959],[0.000010616,-0.000000953],[0.000010560,-0.000000947],[0.000010504,-0.000000939],[0.000010446,-0.000000928],[0.000010387,-0.000000912],[0.000010318,-0.000000903],[0.000010252,-0.000000896],[0.000010191,-0.000000889],[0.000010129,-0.000000881],[0.000010062,-0.000000872],[0.000009995,-0.000000867],[0.000009947,-0.000000861],[0.000009906,-0.000000846],[0.000009867,-0.000000836],[0.000009818,-0.000000829],[0.000009740,-0.000000820],[0.000009660,-0.000000805],[0.000009586,-0.000000789],[0.000009518,-0.000000780],[0.000009457,-0.000000774],[0.000009405,-0.000000765],[0.000009355,-0.000000753],[0.000009299,-0.000000739],[0.000009235,-0.000000726],[0.000009167,-0.000000712],[0.000009100,-0.000000698],[0.000009034,-0.000000684],[0.000008971,-0.000000670],[0.000008909,-0.000000659],[0.000008850,-0.000000648],[0.000008791,-0.000000638],[0.000008733,-0.000000629],[0.000008675,-0.000000619],[0.000008618,-0.000000610],[0.000008561,-0.000000600],[0.000008505,-0.000000591],[0.000008449,-0.000000580],[0.000008394,-0.000000570],[0.000008339,-0.000000559],[0.000008285,-0.000000548],[0.000008231,-0.000000537],[0.000008177,-0.000000526],[0.000008124,-0.000000514],[0.000008071,-0.000000502],[0.000008018,-0.000000490],[0.000007965,-0.000000477],[0.000007912,-0.000000465],[0.000007860,-0.000000452],[0.000007807,-0.000000440],[0.000007754,-0.000000427],[0.000007701,-0.000000414],[0.000007648,-0.000000402],[0.000007595,-0.000000389],[0.000007542,-0.000000377],[0.000017042,-0.000001404],[0.000016998,-0.000001383],[0.000016955,-0.000001361],[0.000016912,-0.000001340],[0.000016868,-0.000001319],[0.000016826,-0.000001299],[0.000016783,-0.000001278],[0.000016740,-0.000001257],[0.000016699,-0.000001236],[0.000016657,-0.000001214],[0.000016616,-0.000001192],[0.000016575,-0.000001169],[0.000016535,-0.000001145],[0.000016495,-0.000001120],[0.000016455,-0.000001095],[0.000016416,-0.000001070],[0.000016378,-0.000001044],[0.000016342,-0.000001019],[0.000016307,-0.000000994],[0.000016275,-0.000000972],[0.000016248,-0.000000953],[0.000016227,-0.000000941],[0.000016216,-0.000000940],[0.000016219,-0.000000955],[0.000016198,-0.000000978],[0.000016160,-0.000001004],[0.000016121,-0.000001030],[0.000016087,-0.000001056],[0.000016060,-0.000001083],[0.000016030,-0.000001107],[0.000015989,-0.000001130],[0.000015931,-0.000001151],[0.000015853,-0.000001170],[0.000015762,-0.000001186],[0.000015667,-0.000001198],[0.000015576,-0.000001211],[0.000015487,-0.000001222],[0.000015396,-0.000001229],[0.000015301,-0.000001229],[0.000015202,-0.000001220],[0.000015098,-0.000001209],[0.000014998,-0.000001204],[0.000014905,-0.000001207],[0.000014809,-0.000001209],[0.000014719,-0.000001207],[0.000014631,-0.000001207],[0.000014545,-0.000001213],[0.000014460,-0.000001219],[0.000014380,-0.000001224],[0.000014309,-0.000001228],[0.000014237,-0.000001227],[0.000014158,-0.000001223],[0.000014066,-0.000001219],[0.000013967,-0.000001216],[0.000013874,-0.000001214],[0.000013795,-0.000001213],[0.000013729,-0.000001211],[0.000013674,-0.000001208],[0.000013618,-0.000001200],[0.000013556,-0.000001190],[0.000013488,-0.000001181],[0.000013419,-0.000001173],[0.000013352,-0.000001166],[0.000013291,-0.000001159],[0.000013235,-0.000001153],[0.000013181,-0.000001146],[0.000013124,-0.000001137],[0.000013060,-0.000001123],[0.000012994,-0.000001110],[0.000012925,-0.000001102],[0.000012854,-0.000001099],[0.000012786,-0.000001096],[0.000012717,-0.000001093],[0.000012644,-0.000001091],[0.000012567,-0.000001088],[0.000012489,-0.000001082],[0.000012417,-0.000001073],[0.000012353,-0.000001064],[0.000012294,-0.000001055],[0.000012233,-0.000001047],[0.000012167,-0.000001041],[0.000012095,-0.000001036],[0.000012017,-0.000001037],[0.000011939,-0.000001048],[0.000011860,-0.000001060],[0.000011786,-0.000001065],[0.000011734,-0.000001056],[0.000011669,-0.000001053],[0.000011601,-0.000001051],[0.000011543,-0.000001045],[0.000011479,-0.000001044],[0.000011404,-0.000001049],[0.000011318,-0.000001032],[0.000011243,-0.000001019],[0.000011179,-0.000001021],[0.000011113,-0.000001023],[0.000011037,-0.000001018],[0.000010958,-0.000001010],[0.000010879,-0.000001003],[0.000010801,-0.000000997],[0.000010732,-0.000000991],[0.000010673,-0.000000985],[0.000010621,-0.000000978],[0.000010570,-0.000000969],[0.000010517,-0.000000962],[0.000010460,-0.000000954],[0.000010398,-0.000000943],[0.000010328,-0.000000933],[0.000010259,-0.000000925],[0.000010197,-0.000000920],[0.000010143,-0.000000914],[0.000010077,-0.000000901],[0.000010024,-0.000000894],[0.000009987,-0.000000888],[0.000009925,-0.000000870],[0.000009874,-0.000000864],[0.000009819,-0.000000861],[0.000009749,-0.000000854],[0.000009674,-0.000000840],[0.000009605,-0.000000823],[0.000009539,-0.000000812],[0.000009479,-0.000000806],[0.000009425,-0.000000798],[0.000009375,-0.000000786],[0.000009322,-0.000000772],[0.000009261,-0.000000758],[0.000009194,-0.000000743],[0.000009126,-0.000000728],[0.000009061,-0.000000713],[0.000009000,-0.000000699],[0.000008941,-0.000000687],[0.000008882,-0.000000677],[0.000008824,-0.000000667],[0.000008766,-0.000000658],[0.000008708,-0.000000649],[0.000008650,-0.000000639],[0.000008592,-0.000000630],[0.000008535,-0.000000620],[0.000008479,-0.000000610],[0.000008423,-0.000000600],[0.000008368,-0.000000589],[0.000008313,-0.000000578],[0.000008259,-0.000000567],[0.000008205,-0.000000556],[0.000008152,-0.000000544],[0.000008098,-0.000000532],[0.000008045,-0.000000520],[0.000007992,-0.000000508],[0.000007939,-0.000000496],[0.000007886,-0.000000484],[0.000007833,-0.000000471],[0.000007780,-0.000000459],[0.000007727,-0.000000447],[0.000007674,-0.000000435],[0.000007620,-0.000000422],[0.000007567,-0.000000410],[0.000017081,-0.000001435],[0.000017036,-0.000001414],[0.000016990,-0.000001392],[0.000016945,-0.000001371],[0.000016900,-0.000001349],[0.000016855,-0.000001328],[0.000016810,-0.000001307],[0.000016766,-0.000001287],[0.000016723,-0.000001266],[0.000016680,-0.000001245],[0.000016637,-0.000001224],[0.000016595,-0.000001201],[0.000016553,-0.000001178],[0.000016512,-0.000001154],[0.000016471,-0.000001130],[0.000016430,-0.000001105],[0.000016390,-0.000001081],[0.000016351,-0.000001057],[0.000016315,-0.000001035],[0.000016282,-0.000001015],[0.000016254,-0.000000999],[0.000016233,-0.000000992],[0.000016219,-0.000000995],[0.000016205,-0.000001007],[0.000016175,-0.000001024],[0.000016130,-0.000001043],[0.000016078,-0.000001060],[0.000016036,-0.000001078],[0.000016009,-0.000001099],[0.000015975,-0.000001119],[0.000015926,-0.000001138],[0.000015863,-0.000001155],[0.000015788,-0.000001171],[0.000015707,-0.000001184],[0.000015625,-0.000001197],[0.000015545,-0.000001209],[0.000015462,-0.000001219],[0.000015373,-0.000001224],[0.000015278,-0.000001222],[0.000015178,-0.000001216],[0.000015076,-0.000001207],[0.000014983,-0.000001203],[0.000014898,-0.000001206],[0.000014799,-0.000001208],[0.000014709,-0.000001205],[0.000014622,-0.000001204],[0.000014533,-0.000001212],[0.000014447,-0.000001216],[0.000014370,-0.000001216],[0.000014302,-0.000001215],[0.000014237,-0.000001218],[0.000014167,-0.000001218],[0.000014086,-0.000001216],[0.000013992,-0.000001214],[0.000013895,-0.000001213],[0.000013807,-0.000001213],[0.000013732,-0.000001212],[0.000013667,-0.000001208],[0.000013607,-0.000001201],[0.000013548,-0.000001193],[0.000013488,-0.000001183],[0.000013426,-0.000001173],[0.000013366,-0.000001163],[0.000013305,-0.000001156],[0.000013244,-0.000001152],[0.000013187,-0.000001145],[0.000013128,-0.000001136],[0.000013064,-0.000001127],[0.000012997,-0.000001121],[0.000012927,-0.000001117],[0.000012855,-0.000001114],[0.000012788,-0.000001107],[0.000012719,-0.000001103],[0.000012647,-0.000001101],[0.000012571,-0.000001099],[0.000012493,-0.000001093],[0.000012418,-0.000001086],[0.000012349,-0.000001078],[0.000012287,-0.000001070],[0.000012226,-0.000001062],[0.000012160,-0.000001056],[0.000012086,-0.000001053],[0.000012007,-0.000001056],[0.000011927,-0.000001066],[0.000011847,-0.000001075],[0.000011771,-0.000001078],[0.000011704,-0.000001076],[0.000011635,-0.000001077],[0.000011582,-0.000001075],[0.000011536,-0.000001068],[0.000011478,-0.000001065],[0.000011404,-0.000001063],[0.000011326,-0.000001052],[0.000011253,-0.000001045],[0.000011189,-0.000001049],[0.000011122,-0.000001050],[0.000011046,-0.000001045],[0.000010966,-0.000001038],[0.000010885,-0.000001032],[0.000010804,-0.000001026],[0.000010732,-0.000001020],[0.000010678,-0.000001012],[0.000010629,-0.000001003],[0.000010578,-0.000000994],[0.000010521,-0.000000987],[0.000010462,-0.000000980],[0.000010398,-0.000000972],[0.000010332,-0.000000963],[0.000010262,-0.000000954],[0.000010195,-0.000000946],[0.000010146,-0.000000941],[0.000010090,-0.000000927],[0.000010042,-0.000000919],[0.000009994,-0.000000914],[0.000009934,-0.000000907],[0.000009877,-0.000000904],[0.000009819,-0.000000896],[0.000009754,-0.000000888],[0.000009687,-0.000000875],[0.000009623,-0.000000860],[0.000009561,-0.000000847],[0.000009500,-0.000000837],[0.000009444,-0.000000828],[0.000009393,-0.000000816],[0.000009342,-0.000000802],[0.000009287,-0.000000789],[0.000009219,-0.000000774],[0.000009150,-0.000000759],[0.000009089,-0.000000743],[0.000009031,-0.000000728],[0.000008973,-0.000000717],[0.000008915,-0.000000707],[0.000008857,-0.000000698],[0.000008799,-0.000000688],[0.000008740,-0.000000679],[0.000008681,-0.000000669],[0.000008623,-0.000000659],[0.000008566,-0.000000649],[0.000008509,-0.000000639],[0.000008453,-0.000000629],[0.000008397,-0.000000619],[0.000008342,-0.000000608],[0.000008288,-0.000000597],[0.000008234,-0.000000586],[0.000008180,-0.000000575],[0.000008126,-0.000000563],[0.000008073,-0.000000551],[0.000008019,-0.000000539],[0.000007966,-0.000000527],[0.000007913,-0.000000515],[0.000007859,-0.000000503],[0.000007806,-0.000000491],[0.000007753,-0.000000479],[0.000007699,-0.000000467],[0.000007646,-0.000000455],[0.000007592,-0.000000443],[0.000017124,-0.000001466],[0.000017077,-0.000001444],[0.000017029,-0.000001422],[0.000016981,-0.000001400],[0.000016934,-0.000001379],[0.000016887,-0.000001357],[0.000016841,-0.000001337],[0.000016795,-0.000001316],[0.000016749,-0.000001296],[0.000016705,-0.000001276],[0.000016661,-0.000001256],[0.000016617,-0.000001234],[0.000016574,-0.000001212],[0.000016531,-0.000001189],[0.000016489,-0.000001165],[0.000016447,-0.000001142],[0.000016405,-0.000001119],[0.000016363,-0.000001098],[0.000016324,-0.000001079],[0.000016288,-0.000001064],[0.000016258,-0.000001053],[0.000016231,-0.000001050],[0.000016207,-0.000001053],[0.000016181,-0.000001060],[0.000016146,-0.000001073],[0.000016100,-0.000001089],[0.000016042,-0.000001104],[0.000015989,-0.000001118],[0.000015954,-0.000001127],[0.000015914,-0.000001140],[0.000015860,-0.000001155],[0.000015795,-0.000001169],[0.000015724,-0.000001182],[0.000015652,-0.000001193],[0.000015581,-0.000001204],[0.000015509,-0.000001213],[0.000015433,-0.000001220],[0.000015349,-0.000001223],[0.000015258,-0.000001222],[0.000015158,-0.000001219],[0.000015056,-0.000001216],[0.000014969,-0.000001214],[0.000014890,-0.000001214],[0.000014798,-0.000001215],[0.000014707,-0.000001215],[0.000014615,-0.000001215],[0.000014522,-0.000001219],[0.000014435,-0.000001222],[0.000014360,-0.000001219],[0.000014293,-0.000001216],[0.000014230,-0.000001217],[0.000014168,-0.000001217],[0.000014101,-0.000001215],[0.000014019,-0.000001213],[0.000013921,-0.000001213],[0.000013818,-0.000001213],[0.000013733,-0.000001213],[0.000013663,-0.000001209],[0.000013603,-0.000001203],[0.000013547,-0.000001195],[0.000013492,-0.000001184],[0.000013436,-0.000001172],[0.000013381,-0.000001159],[0.000013322,-0.000001150],[0.000013261,-0.000001143],[0.000013201,-0.000001137],[0.000013137,-0.000001132],[0.000013070,-0.000001130],[0.000013001,-0.000001129],[0.000012930,-0.000001126],[0.000012859,-0.000001119],[0.000012790,-0.000001111],[0.000012721,-0.000001107],[0.000012650,-0.000001105],[0.000012574,-0.000001104],[0.000012495,-0.000001099],[0.000012418,-0.000001095],[0.000012346,-0.000001090],[0.000012284,-0.000001083],[0.000012223,-0.000001077],[0.000012158,-0.000001073],[0.000012084,-0.000001075],[0.000012002,-0.000001081],[0.000011918,-0.000001088],[0.000011838,-0.000001092],[0.000011761,-0.000001090],[0.000011687,-0.000001090],[0.000011616,-0.000001092],[0.000011564,-0.000001093],[0.000011519,-0.000001094],[0.000011458,-0.000001088],[0.000011386,-0.000001082],[0.000011312,-0.000001076],[0.000011246,-0.000001072],[0.000011184,-0.000001072],[0.000011119,-0.000001071],[0.000011048,-0.000001067],[0.000010973,-0.000001062],[0.000010897,-0.000001057],[0.000010820,-0.000001053],[0.000010748,-0.000001047],[0.000010695,-0.000001039],[0.000010639,-0.000001030],[0.000010579,-0.000001022],[0.000010519,-0.000001015],[0.000010457,-0.000001009],[0.000010395,-0.000001001],[0.000010332,-0.000000993],[0.000010270,-0.000000984],[0.000010210,-0.000000976],[0.000010155,-0.000000968],[0.000010105,-0.000000960],[0.000010056,-0.000000953],[0.000010000,-0.000000948],[0.000009939,-0.000000944],[0.000009882,-0.000000938],[0.000009829,-0.000000929],[0.000009768,-0.000000918],[0.000009704,-0.000000906],[0.000009642,-0.000000893],[0.000009580,-0.000000880],[0.000009519,-0.000000868],[0.000009462,-0.000000856],[0.000009409,-0.000000844],[0.000009359,-0.000000831],[0.000009307,-0.000000818],[0.000009244,-0.000000804],[0.000009179,-0.000000790],[0.000009120,-0.000000775],[0.000009064,-0.000000762],[0.000009006,-0.000000750],[0.000008948,-0.000000740],[0.000008890,-0.000000730],[0.000008831,-0.000000719],[0.000008772,-0.000000709],[0.000008713,-0.000000699],[0.000008654,-0.000000690],[0.000008596,-0.000000680],[0.000008539,-0.000000670],[0.000008483,-0.000000660],[0.000008427,-0.000000649],[0.000008372,-0.000000638],[0.000008317,-0.000000627],[0.000008263,-0.000000616],[0.000008208,-0.000000605],[0.000008155,-0.000000593],[0.000008101,-0.000000582],[0.000008047,-0.000000570],[0.000007993,-0.000000558],[0.000007940,-0.000000547],[0.000007886,-0.000000535],[0.000007833,-0.000000523],[0.000007779,-0.000000511],[0.000007725,-0.000000500],[0.000007672,-0.000000488],[0.000007618,-0.000000476],[0.000017171,-0.000001496],[0.000017120,-0.000001474],[0.000017070,-0.000001452],[0.000017020,-0.000001430],[0.000016971,-0.000001407],[0.000016922,-0.000001386],[0.000016873,-0.000001365],[0.000016825,-0.000001345],[0.000016778,-0.000001325],[0.000016732,-0.000001306],[0.000016686,-0.000001287],[0.000016641,-0.000001267],[0.000016597,-0.000001246],[0.000016553,-0.000001224],[0.000016509,-0.000001201],[0.000016465,-0.000001179],[0.000016421,-0.000001158],[0.000016377,-0.000001140],[0.000016334,-0.000001126],[0.000016293,-0.000001116],[0.000016255,-0.000001111],[0.000016221,-0.000001110],[0.000016189,-0.000001109],[0.000016156,-0.000001111],[0.000016116,-0.000001119],[0.000016071,-0.000001132],[0.000016012,-0.000001145],[0.000015951,-0.000001153],[0.000015905,-0.000001158],[0.000015858,-0.000001167],[0.000015802,-0.000001178],[0.000015737,-0.000001191],[0.000015671,-0.000001201],[0.000015604,-0.000001211],[0.000015540,-0.000001217],[0.000015473,-0.000001221],[0.000015401,-0.000001225],[0.000015323,-0.000001227],[0.000015237,-0.000001228],[0.000015139,-0.000001229],[0.000015034,-0.000001230],[0.000014949,-0.000001228],[0.000014870,-0.000001227],[0.000014787,-0.000001226],[0.000014700,-0.000001227],[0.000014609,-0.000001226],[0.000014517,-0.000001228],[0.000014428,-0.000001231],[0.000014356,-0.000001228],[0.000014283,-0.000001226],[0.000014218,-0.000001223],[0.000014161,-0.000001220],[0.000014107,-0.000001217],[0.000014047,-0.000001213],[0.000013960,-0.000001211],[0.000013833,-0.000001214],[0.000013740,-0.000001214],[0.000013668,-0.000001211],[0.000013607,-0.000001206],[0.000013552,-0.000001198],[0.000013501,-0.000001187],[0.000013451,-0.000001171],[0.000013396,-0.000001156],[0.000013335,-0.000001146],[0.000013274,-0.000001137],[0.000013212,-0.000001129],[0.000013143,-0.000001128],[0.000013073,-0.000001129],[0.000013004,-0.000001132],[0.000012933,-0.000001130],[0.000012862,-0.000001119],[0.000012792,-0.000001109],[0.000012723,-0.000001106],[0.000012653,-0.000001106],[0.000012576,-0.000001104],[0.000012498,-0.000001102],[0.000012421,-0.000001100],[0.000012348,-0.000001098],[0.000012285,-0.000001095],[0.000012225,-0.000001091],[0.000012161,-0.000001091],[0.000012085,-0.000001096],[0.000011997,-0.000001108],[0.000011910,-0.000001115],[0.000011832,-0.000001109],[0.000011759,-0.000001099],[0.000011686,-0.000001094],[0.000011616,-0.000001096],[0.000011555,-0.000001101],[0.000011498,-0.000001105],[0.000011435,-0.000001105],[0.000011364,-0.000001102],[0.000011289,-0.000001099],[0.000011229,-0.000001096],[0.000011173,-0.000001092],[0.000011113,-0.000001089],[0.000011046,-0.000001085],[0.000010977,-0.000001082],[0.000010910,-0.000001078],[0.000010851,-0.000001075],[0.000010798,-0.000001071],[0.000010721,-0.000001063],[0.000010647,-0.000001055],[0.000010579,-0.000001049],[0.000010513,-0.000001045],[0.000010450,-0.000001039],[0.000010389,-0.000001032],[0.000010332,-0.000001024],[0.000010278,-0.000001016],[0.000010227,-0.000001009],[0.000010167,-0.000001003],[0.000010114,-0.000000997],[0.000010068,-0.000000991],[0.000010008,-0.000000984],[0.000009941,-0.000000976],[0.000009888,-0.000000968],[0.000009843,-0.000000958],[0.000009784,-0.000000948],[0.000009719,-0.000000936],[0.000009656,-0.000000924],[0.000009594,-0.000000913],[0.000009534,-0.000000900],[0.000009477,-0.000000887],[0.000009424,-0.000000873],[0.000009375,-0.000000860],[0.000009326,-0.000000847],[0.000009271,-0.000000834],[0.000009212,-0.000000824],[0.000009154,-0.000000812],[0.000009097,-0.000000798],[0.000009040,-0.000000786],[0.000008981,-0.000000774],[0.000008922,-0.000000762],[0.000008862,-0.000000751],[0.000008802,-0.000000741],[0.000008743,-0.000000730],[0.000008684,-0.000000720],[0.000008626,-0.000000710],[0.000008569,-0.000000700],[0.000008512,-0.000000690],[0.000008457,-0.000000679],[0.000008401,-0.000000669],[0.000008346,-0.000000657],[0.000008292,-0.000000646],[0.000008237,-0.000000635],[0.000008183,-0.000000624],[0.000008129,-0.000000612],[0.000008075,-0.000000601],[0.000008021,-0.000000589],[0.000007967,-0.000000578],[0.000007913,-0.000000566],[0.000007859,-0.000000555],[0.000007806,-0.000000544],[0.000007751,-0.000000532],[0.000007697,-0.000000521],[0.000007643,-0.000000510],[0.000017220,-0.000001526],[0.000017168,-0.000001503],[0.000017115,-0.000001481],[0.000017063,-0.000001458],[0.000017011,-0.000001436],[0.000016960,-0.000001414],[0.000016909,-0.000001392],[0.000016859,-0.000001372],[0.000016810,-0.000001353],[0.000016761,-0.000001335],[0.000016714,-0.000001317],[0.000016667,-0.000001299],[0.000016621,-0.000001279],[0.000016575,-0.000001258],[0.000016530,-0.000001236],[0.000016484,-0.000001215],[0.000016438,-0.000001196],[0.000016392,-0.000001181],[0.000016345,-0.000001170],[0.000016298,-0.000001166],[0.000016251,-0.000001168],[0.000016210,-0.000001165],[0.000016173,-0.000001159],[0.000016131,-0.000001156],[0.000016084,-0.000001157],[0.000016033,-0.000001163],[0.000015977,-0.000001171],[0.000015921,-0.000001180],[0.000015869,-0.000001187],[0.000015816,-0.000001195],[0.000015759,-0.000001204],[0.000015697,-0.000001214],[0.000015633,-0.000001224],[0.000015568,-0.000001231],[0.000015505,-0.000001233],[0.000015439,-0.000001233],[0.000015369,-0.000001233],[0.000015293,-0.000001236],[0.000015210,-0.000001239],[0.000015118,-0.000001242],[0.000015022,-0.000001243],[0.000014935,-0.000001242],[0.000014852,-0.000001239],[0.000014770,-0.000001237],[0.000014685,-0.000001236],[0.000014599,-0.000001234],[0.000014518,-0.000001232],[0.000014444,-0.000001233],[0.000014362,-0.000001233],[0.000014274,-0.000001236],[0.000014207,-0.000001232],[0.000014148,-0.000001228],[0.000014098,-0.000001224],[0.000014058,-0.000001218],[0.000014013,-0.000001211],[0.000013876,-0.000001214],[0.000013766,-0.000001214],[0.000013686,-0.000001212],[0.000013620,-0.000001208],[0.000013563,-0.000001203],[0.000013511,-0.000001195],[0.000013461,-0.000001179],[0.000013405,-0.000001158],[0.000013340,-0.000001147],[0.000013275,-0.000001139],[0.000013209,-0.000001132],[0.000013142,-0.000001128],[0.000013073,-0.000001126],[0.000013003,-0.000001128],[0.000012933,-0.000001129],[0.000012862,-0.000001120],[0.000012793,-0.000001106],[0.000012723,-0.000001105],[0.000012652,-0.000001107],[0.000012578,-0.000001106],[0.000012502,-0.000001103],[0.000012428,-0.000001103],[0.000012358,-0.000001103],[0.000012292,-0.000001103],[0.000012228,-0.000001104],[0.000012159,-0.000001109],[0.000012081,-0.000001118],[0.000011992,-0.000001131],[0.000011903,-0.000001139],[0.000011830,-0.000001121],[0.000011764,-0.000001101],[0.000011692,-0.000001095],[0.000011618,-0.000001098],[0.000011549,-0.000001104],[0.000011484,-0.000001111],[0.000011419,-0.000001116],[0.000011350,-0.000001118],[0.000011278,-0.000001118],[0.000011219,-0.000001114],[0.000011164,-0.000001109],[0.000011106,-0.000001104],[0.000011044,-0.000001100],[0.000010980,-0.000001098],[0.000010917,-0.000001096],[0.000010860,-0.000001093],[0.000010807,-0.000001090],[0.000010729,-0.000001084],[0.000010652,-0.000001078],[0.000010579,-0.000001074],[0.000010509,-0.000001073],[0.000010445,-0.000001071],[0.000010386,-0.000001066],[0.000010331,-0.000001056],[0.000010279,-0.000001047],[0.000010226,-0.000001042],[0.000010164,-0.000001039],[0.000010112,-0.000001036],[0.000010066,-0.000001030],[0.000010009,-0.000001022],[0.000009948,-0.000001013],[0.000009895,-0.000001002],[0.000009849,-0.000000989],[0.000009794,-0.000000978],[0.000009732,-0.000000967],[0.000009668,-0.000000956],[0.000009607,-0.000000947],[0.000009550,-0.000000935],[0.000009493,-0.000000921],[0.000009440,-0.000000906],[0.000009396,-0.000000895],[0.000009351,-0.000000884],[0.000009299,-0.000000872],[0.000009244,-0.000000863],[0.000009188,-0.000000851],[0.000009131,-0.000000837],[0.000009073,-0.000000822],[0.000009013,-0.000000808],[0.000008953,-0.000000795],[0.000008892,-0.000000783],[0.000008832,-0.000000772],[0.000008772,-0.000000762],[0.000008714,-0.000000752],[0.000008656,-0.000000742],[0.000008599,-0.000000731],[0.000008542,-0.000000721],[0.000008486,-0.000000710],[0.000008431,-0.000000699],[0.000008376,-0.000000688],[0.000008321,-0.000000676],[0.000008266,-0.000000665],[0.000008212,-0.000000654],[0.000008158,-0.000000643],[0.000008104,-0.000000632],[0.000008049,-0.000000620],[0.000007995,-0.000000609],[0.000007941,-0.000000598],[0.000007886,-0.000000587],[0.000007832,-0.000000576],[0.000007778,-0.000000565],[0.000007724,-0.000000554],[0.000007669,-0.000000543],[0.000017272,-0.000001554],[0.000017218,-0.000001532],[0.000017163,-0.000001509],[0.000017108,-0.000001486],[0.000017054,-0.000001464],[0.000017000,-0.000001441],[0.000016947,-0.000001419],[0.000016895,-0.000001398],[0.000016844,-0.000001379],[0.000016794,-0.000001362],[0.000016744,-0.000001345],[0.000016695,-0.000001328],[0.000016647,-0.000001309],[0.000016599,-0.000001290],[0.000016552,-0.000001269],[0.000016504,-0.000001250],[0.000016456,-0.000001233],[0.000016407,-0.000001219],[0.000016357,-0.000001211],[0.000016307,-0.000001207],[0.000016257,-0.000001206],[0.000016208,-0.000001204],[0.000016161,-0.000001200],[0.000016112,-0.000001196],[0.000016058,-0.000001192],[0.000015998,-0.000001189],[0.000015944,-0.000001194],[0.000015894,-0.000001205],[0.000015843,-0.000001214],[0.000015788,-0.000001222],[0.000015730,-0.000001230],[0.000015670,-0.000001237],[0.000015607,-0.000001244],[0.000015543,-0.000001249],[0.000015476,-0.000001250],[0.000015407,-0.000001248],[0.000015335,-0.000001246],[0.000015260,-0.000001248],[0.000015181,-0.000001252],[0.000015098,-0.000001255],[0.000015010,-0.000001255],[0.000014922,-0.000001253],[0.000014837,-0.000001251],[0.000014752,-0.000001248],[0.000014666,-0.000001243],[0.000014585,-0.000001239],[0.000014509,-0.000001235],[0.000014436,-0.000001233],[0.000014358,-0.000001235],[0.000014278,-0.000001238],[0.000014205,-0.000001237],[0.000014137,-0.000001237],[0.000014075,-0.000001237],[0.000014024,-0.000001233],[0.000013996,-0.000001223],[0.000013908,-0.000001219],[0.000013804,-0.000001217],[0.000013714,-0.000001214],[0.000013640,-0.000001212],[0.000013576,-0.000001209],[0.000013518,-0.000001205],[0.000013461,-0.000001198],[0.000013399,-0.000001172],[0.000013333,-0.000001157],[0.000013267,-0.000001149],[0.000013200,-0.000001141],[0.000013134,-0.000001134],[0.000013068,-0.000001129],[0.000013001,-0.000001128],[0.000012933,-0.000001131],[0.000012864,-0.000001129],[0.000012797,-0.000001115],[0.000012726,-0.000001112],[0.000012654,-0.000001112],[0.000012581,-0.000001111],[0.000012508,-0.000001108],[0.000012437,-0.000001107],[0.000012368,-0.000001107],[0.000012299,-0.000001110],[0.000012230,-0.000001115],[0.000012157,-0.000001123],[0.000012077,-0.000001133],[0.000011992,-0.000001141],[0.000011909,-0.000001139],[0.000011838,-0.000001116],[0.000011767,-0.000001106],[0.000011693,-0.000001106],[0.000011619,-0.000001107],[0.000011548,-0.000001109],[0.000011480,-0.000001118],[0.000011415,-0.000001126],[0.000011350,-0.000001130],[0.000011285,-0.000001130],[0.000011221,-0.000001128],[0.000011159,-0.000001123],[0.000011099,-0.000001117],[0.000011039,-0.000001114],[0.000010979,-0.000001113],[0.000010918,-0.000001111],[0.000010849,-0.000001109],[0.000010779,-0.000001106],[0.000010721,-0.000001103],[0.000010653,-0.000001099],[0.000010581,-0.000001096],[0.000010510,-0.000001096],[0.000010448,-0.000001101],[0.000010390,-0.000001103],[0.000010332,-0.000001092],[0.000010279,-0.000001080],[0.000010226,-0.000001075],[0.000010153,-0.000001075],[0.000010114,-0.000001073],[0.000010070,-0.000001067],[0.000010013,-0.000001059],[0.000009951,-0.000001051],[0.000009898,-0.000001037],[0.000009851,-0.000001020],[0.000009801,-0.000001008],[0.000009745,-0.000001000],[0.000009683,-0.000000991],[0.000009623,-0.000000983],[0.000009566,-0.000000972],[0.000009512,-0.000000960],[0.000009466,-0.000000949],[0.000009429,-0.000000942],[0.000009380,-0.000000934],[0.000009327,-0.000000922],[0.000009273,-0.000000908],[0.000009218,-0.000000892],[0.000009163,-0.000000875],[0.000009104,-0.000000858],[0.000009043,-0.000000842],[0.000008981,-0.000000829],[0.000008920,-0.000000816],[0.000008860,-0.000000805],[0.000008801,-0.000000794],[0.000008742,-0.000000784],[0.000008685,-0.000000773],[0.000008628,-0.000000762],[0.000008572,-0.000000751],[0.000008516,-0.000000740],[0.000008461,-0.000000729],[0.000008406,-0.000000718],[0.000008351,-0.000000707],[0.000008296,-0.000000695],[0.000008241,-0.000000684],[0.000008186,-0.000000673],[0.000008132,-0.000000662],[0.000008078,-0.000000651],[0.000008023,-0.000000641],[0.000007968,-0.000000630],[0.000007914,-0.000000619],[0.000007859,-0.000000608],[0.000007805,-0.000000598],[0.000007750,-0.000000587],[0.000007696,-0.000000576],[0.000017327,-0.000001581],[0.000017271,-0.000001559],[0.000017214,-0.000001536],[0.000017157,-0.000001514],[0.000017101,-0.000001491],[0.000017044,-0.000001469],[0.000016989,-0.000001446],[0.000016935,-0.000001424],[0.000016882,-0.000001404],[0.000016830,-0.000001387],[0.000016778,-0.000001371],[0.000016726,-0.000001352],[0.000016675,-0.000001334],[0.000016624,-0.000001318],[0.000016574,-0.000001300],[0.000016523,-0.000001282],[0.000016473,-0.000001266],[0.000016420,-0.000001254],[0.000016367,-0.000001246],[0.000016315,-0.000001240],[0.000016262,-0.000001237],[0.000016208,-0.000001236],[0.000016154,-0.000001234],[0.000016100,-0.000001230],[0.000016041,-0.000001225],[0.000015981,-0.000001223],[0.000015927,-0.000001226],[0.000015877,-0.000001234],[0.000015825,-0.000001242],[0.000015768,-0.000001249],[0.000015709,-0.000001254],[0.000015650,-0.000001259],[0.000015589,-0.000001264],[0.000015524,-0.000001267],[0.000015453,-0.000001268],[0.000015377,-0.000001266],[0.000015300,-0.000001263],[0.000015226,-0.000001263],[0.000015153,-0.000001267],[0.000015077,-0.000001268],[0.000014993,-0.000001265],[0.000014906,-0.000001262],[0.000014822,-0.000001260],[0.000014735,-0.000001257],[0.000014647,-0.000001250],[0.000014568,-0.000001244],[0.000014496,-0.000001240],[0.000014427,-0.000001238],[0.000014355,-0.000001242],[0.000014284,-0.000001244],[0.000014210,-0.000001244],[0.000014134,-0.000001248],[0.000014059,-0.000001250],[0.000013990,-0.000001249],[0.000013958,-0.000001240],[0.000013903,-0.000001233],[0.000013824,-0.000001227],[0.000013740,-0.000001221],[0.000013662,-0.000001218],[0.000013591,-0.000001216],[0.000013523,-0.000001210],[0.000013456,-0.000001198],[0.000013388,-0.000001183],[0.000013321,-0.000001173],[0.000013254,-0.000001164],[0.000013188,-0.000001155],[0.000013124,-0.000001145],[0.000013062,-0.000001138],[0.000012999,-0.000001134],[0.000012935,-0.000001133],[0.000012870,-0.000001132],[0.000012804,-0.000001127],[0.000012735,-0.000001124],[0.000012662,-0.000001123],[0.000012588,-0.000001120],[0.000012514,-0.000001116],[0.000012444,-0.000001112],[0.000012375,-0.000001110],[0.000012305,-0.000001113],[0.000012233,-0.000001122],[0.000012157,-0.000001133],[0.000012078,-0.000001142],[0.000011997,-0.000001144],[0.000011918,-0.000001136],[0.000011840,-0.000001126],[0.000011761,-0.000001125],[0.000011688,-0.000001127],[0.000011620,-0.000001126],[0.000011551,-0.000001127],[0.000011483,-0.000001132],[0.000011416,-0.000001137],[0.000011354,-0.000001140],[0.000011295,-0.000001140],[0.000011225,-0.000001138],[0.000011154,-0.000001136],[0.000011088,-0.000001133],[0.000011027,-0.000001131],[0.000010971,-0.000001130],[0.000010919,-0.000001127],[0.000010859,-0.000001124],[0.000010788,-0.000001126],[0.000010720,-0.000001125],[0.000010653,-0.000001120],[0.000010586,-0.000001115],[0.000010521,-0.000001113],[0.000010462,-0.000001121],[0.000010403,-0.000001139],[0.000010341,-0.000001133],[0.000010281,-0.000001118],[0.000010224,-0.000001108],[0.000010171,-0.000001105],[0.000010142,-0.000001102],[0.000010085,-0.000001095],[0.000010021,-0.000001089],[0.000009958,-0.000001084],[0.000009906,-0.000001071],[0.000009857,-0.000001051],[0.000009808,-0.000001040],[0.000009758,-0.000001037],[0.000009701,-0.000001030],[0.000009641,-0.000001020],[0.000009584,-0.000001010],[0.000009533,-0.000001001],[0.000009488,-0.000000994],[0.000009447,-0.000000989],[0.000009401,-0.000000985],[0.000009351,-0.000000970],[0.000009299,-0.000000952],[0.000009245,-0.000000932],[0.000009191,-0.000000911],[0.000009132,-0.000000892],[0.000009070,-0.000000876],[0.000009007,-0.000000862],[0.000008946,-0.000000849],[0.000008887,-0.000000838],[0.000008828,-0.000000827],[0.000008771,-0.000000816],[0.000008714,-0.000000805],[0.000008657,-0.000000794],[0.000008601,-0.000000782],[0.000008546,-0.000000771],[0.000008490,-0.000000759],[0.000008435,-0.000000748],[0.000008380,-0.000000737],[0.000008325,-0.000000725],[0.000008270,-0.000000715],[0.000008216,-0.000000704],[0.000008161,-0.000000693],[0.000008106,-0.000000683],[0.000008051,-0.000000672],[0.000007996,-0.000000662],[0.000007942,-0.000000651],[0.000007887,-0.000000641],[0.000007832,-0.000000630],[0.000007777,-0.000000620],[0.000007722,-0.000000610],[0.000017384,-0.000001607],[0.000017326,-0.000001585],[0.000017268,-0.000001562],[0.000017210,-0.000001540],[0.000017151,-0.000001518],[0.000017092,-0.000001495],[0.000017034,-0.000001473],[0.000016978,-0.000001450],[0.000016923,-0.000001429],[0.000016869,-0.000001410],[0.000016814,-0.000001390],[0.000016759,-0.000001369],[0.000016704,-0.000001351],[0.000016649,-0.000001340],[0.000016595,-0.000001325],[0.000016542,-0.000001308],[0.000016487,-0.000001295],[0.000016432,-0.000001284],[0.000016376,-0.000001276],[0.000016320,-0.000001270],[0.000016264,-0.000001266],[0.000016206,-0.000001264],[0.000016148,-0.000001262],[0.000016091,-0.000001259],[0.000016032,-0.000001258],[0.000015974,-0.000001259],[0.000015917,-0.000001261],[0.000015865,-0.000001265],[0.000015812,-0.000001269],[0.000015752,-0.000001273],[0.000015692,-0.000001277],[0.000015632,-0.000001280],[0.000015572,-0.000001283],[0.000015508,-0.000001285],[0.000015432,-0.000001287],[0.000015350,-0.000001289],[0.000015268,-0.000001289],[0.000015193,-0.000001287],[0.000015123,-0.000001284],[0.000015052,-0.000001281],[0.000014972,-0.000001275],[0.000014888,-0.000001269],[0.000014805,-0.000001267],[0.000014718,-0.000001263],[0.000014630,-0.000001257],[0.000014555,-0.000001252],[0.000014490,-0.000001250],[0.000014424,-0.000001252],[0.000014355,-0.000001259],[0.000014285,-0.000001262],[0.000014212,-0.000001262],[0.000014139,-0.000001261],[0.000014066,-0.000001261],[0.000013999,-0.000001259],[0.000013947,-0.000001255],[0.000013894,-0.000001250],[0.000013830,-0.000001244],[0.000013757,-0.000001237],[0.000013681,-0.000001230],[0.000013605,-0.000001224],[0.000013531,-0.000001217],[0.000013456,-0.000001209],[0.000013382,-0.000001202],[0.000013310,-0.000001194],[0.000013243,-0.000001183],[0.000013177,-0.000001171],[0.000013117,-0.000001160],[0.000013060,-0.000001151],[0.000013000,-0.000001144],[0.000012938,-0.000001140],[0.000012877,-0.000001139],[0.000012814,-0.000001138],[0.000012748,-0.000001136],[0.000012676,-0.000001133],[0.000012600,-0.000001129],[0.000012521,-0.000001124],[0.000012449,-0.000001117],[0.000012379,-0.000001112],[0.000012308,-0.000001114],[0.000012233,-0.000001124],[0.000012157,-0.000001137],[0.000012081,-0.000001147],[0.000012002,-0.000001146],[0.000011923,-0.000001137],[0.000011844,-0.000001131],[0.000011763,-0.000001138],[0.000011690,-0.000001145],[0.000011626,-0.000001147],[0.000011558,-0.000001148],[0.000011486,-0.000001148],[0.000011416,-0.000001150],[0.000011351,-0.000001150],[0.000011288,-0.000001149],[0.000011218,-0.000001147],[0.000011147,-0.000001146],[0.000011077,-0.000001147],[0.000011012,-0.000001149],[0.000010956,-0.000001150],[0.000010916,-0.000001145],[0.000010883,-0.000001136],[0.000010803,-0.000001146],[0.000010723,-0.000001147],[0.000010654,-0.000001142],[0.000010593,-0.000001134],[0.000010537,-0.000001127],[0.000010483,-0.000001127],[0.000010419,-0.000001148],[0.000010351,-0.000001153],[0.000010287,-0.000001144],[0.000010231,-0.000001136],[0.000010186,-0.000001129],[0.000010146,-0.000001123],[0.000010094,-0.000001116],[0.000010035,-0.000001112],[0.000009978,-0.000001107],[0.000009926,-0.000001098],[0.000009869,-0.000001085],[0.000009814,-0.000001076],[0.000009765,-0.000001070],[0.000009715,-0.000001062],[0.000009661,-0.000001053],[0.000009605,-0.000001046],[0.000009552,-0.000001040],[0.000009506,-0.000001035],[0.000009465,-0.000001030],[0.000009422,-0.000001023],[0.000009374,-0.000001008],[0.000009322,-0.000000989],[0.000009268,-0.000000969],[0.000009213,-0.000000945],[0.000009153,-0.000000924],[0.000009091,-0.000000908],[0.000009030,-0.000000895],[0.000008970,-0.000000883],[0.000008912,-0.000000872],[0.000008855,-0.000000861],[0.000008798,-0.000000849],[0.000008742,-0.000000837],[0.000008686,-0.000000825],[0.000008631,-0.000000813],[0.000008575,-0.000000801],[0.000008520,-0.000000789],[0.000008465,-0.000000778],[0.000008410,-0.000000767],[0.000008355,-0.000000756],[0.000008300,-0.000000745],[0.000008245,-0.000000734],[0.000008190,-0.000000724],[0.000008135,-0.000000714],[0.000008080,-0.000000704],[0.000008025,-0.000000694],[0.000007970,-0.000000683],[0.000007915,-0.000000673],[0.000007860,-0.000000663],[0.000007805,-0.000000653],[0.000007749,-0.000000643],[0.000017442,-0.000001632],[0.000017383,-0.000001609],[0.000017324,-0.000001587],[0.000017265,-0.000001565],[0.000017205,-0.000001543],[0.000017144,-0.000001521],[0.000017083,-0.000001499],[0.000017024,-0.000001477],[0.000016968,-0.000001454],[0.000016913,-0.000001431],[0.000016854,-0.000001409],[0.000016794,-0.000001386],[0.000016734,-0.000001362],[0.000016675,-0.000001350],[0.000016616,-0.000001343],[0.000016559,-0.000001331],[0.000016501,-0.000001320],[0.000016443,-0.000001311],[0.000016384,-0.000001303],[0.000016325,-0.000001297],[0.000016265,-0.000001292],[0.000016204,-0.000001289],[0.000016144,-0.000001286],[0.000016085,-0.000001285],[0.000016028,-0.000001286],[0.000015969,-0.000001290],[0.000015909,-0.000001294],[0.000015853,-0.000001294],[0.000015797,-0.000001294],[0.000015737,-0.000001295],[0.000015674,-0.000001297],[0.000015612,-0.000001300],[0.000015553,-0.000001302],[0.000015491,-0.000001303],[0.000015411,-0.000001305],[0.000015323,-0.000001310],[0.000015237,-0.000001316],[0.000015163,-0.000001310],[0.000015094,-0.000001302],[0.000015025,-0.000001294],[0.000014951,-0.000001286],[0.000014874,-0.000001279],[0.000014797,-0.000001276],[0.000014716,-0.000001273],[0.000014632,-0.000001268],[0.000014559,-0.000001264],[0.000014497,-0.000001263],[0.000014433,-0.000001267],[0.000014361,-0.000001275],[0.000014286,-0.000001279],[0.000014217,-0.000001277],[0.000014152,-0.000001274],[0.000014086,-0.000001271],[0.000014018,-0.000001270],[0.000013954,-0.000001268],[0.000013895,-0.000001266],[0.000013835,-0.000001263],[0.000013769,-0.000001256],[0.000013697,-0.000001245],[0.000013621,-0.000001235],[0.000013542,-0.000001228],[0.000013462,-0.000001224],[0.000013383,-0.000001220],[0.000013308,-0.000001214],[0.000013239,-0.000001202],[0.000013175,-0.000001189],[0.000013117,-0.000001177],[0.000013065,-0.000001168],[0.000013007,-0.000001160],[0.000012945,-0.000001154],[0.000012883,-0.000001151],[0.000012822,-0.000001149],[0.000012760,-0.000001146],[0.000012693,-0.000001142],[0.000012616,-0.000001137],[0.000012532,-0.000001130],[0.000012452,-0.000001122],[0.000012378,-0.000001115],[0.000012304,-0.000001115],[0.000012229,-0.000001125],[0.000012156,-0.000001137],[0.000012083,-0.000001148],[0.000012006,-0.000001148],[0.000011925,-0.000001140],[0.000011849,-0.000001134],[0.000011770,-0.000001143],[0.000011699,-0.000001153],[0.000011633,-0.000001161],[0.000011562,-0.000001164],[0.000011486,-0.000001164],[0.000011412,-0.000001163],[0.000011342,-0.000001161],[0.000011274,-0.000001158],[0.000011207,-0.000001156],[0.000011140,-0.000001155],[0.000011072,-0.000001158],[0.000011004,-0.000001165],[0.000010942,-0.000001171],[0.000010903,-0.000001168],[0.000010893,-0.000001150],[0.000010810,-0.000001160],[0.000010726,-0.000001165],[0.000010659,-0.000001162],[0.000010601,-0.000001155],[0.000010548,-0.000001148],[0.000010492,-0.000001145],[0.000010427,-0.000001153],[0.000010358,-0.000001158],[0.000010294,-0.000001157],[0.000010241,-0.000001155],[0.000010194,-0.000001151],[0.000010150,-0.000001144],[0.000010102,-0.000001137],[0.000010050,-0.000001131],[0.000009995,-0.000001125],[0.000009939,-0.000001120],[0.000009881,-0.000001115],[0.000009824,-0.000001109],[0.000009776,-0.000001101],[0.000009732,-0.000001091],[0.000009683,-0.000001083],[0.000009628,-0.000001077],[0.000009572,-0.000001074],[0.000009526,-0.000001069],[0.000009488,-0.000001060],[0.000009447,-0.000001049],[0.000009400,-0.000001033],[0.000009347,-0.000001015],[0.000009289,-0.000000996],[0.000009230,-0.000000973],[0.000009169,-0.000000954],[0.000009109,-0.000000940],[0.000009051,-0.000000929],[0.000008994,-0.000000918],[0.000008937,-0.000000907],[0.000008881,-0.000000894],[0.000008826,-0.000000881],[0.000008770,-0.000000868],[0.000008715,-0.000000856],[0.000008660,-0.000000843],[0.000008605,-0.000000831],[0.000008550,-0.000000819],[0.000008495,-0.000000808],[0.000008440,-0.000000797],[0.000008384,-0.000000786],[0.000008329,-0.000000776],[0.000008274,-0.000000765],[0.000008219,-0.000000755],[0.000008163,-0.000000745],[0.000008108,-0.000000735],[0.000008053,-0.000000726],[0.000007998,-0.000000716],[0.000007943,-0.000000706],[0.000007888,-0.000000696],[0.000007832,-0.000000687],[0.000007777,-0.000000677],[0.000017503,-0.000001654],[0.000017443,-0.000001632],[0.000017383,-0.000001610],[0.000017323,-0.000001588],[0.000017263,-0.000001566],[0.000017201,-0.000001544],[0.000017139,-0.000001522],[0.000017076,-0.000001500],[0.000017018,-0.000001476],[0.000016960,-0.000001452],[0.000016895,-0.000001429],[0.000016831,-0.000001405],[0.000016767,-0.000001387],[0.000016702,-0.000001378],[0.000016640,-0.000001362],[0.000016578,-0.000001350],[0.000016515,-0.000001341],[0.000016454,-0.000001334],[0.000016393,-0.000001328],[0.000016331,-0.000001322],[0.000016267,-0.000001317],[0.000016204,-0.000001312],[0.000016141,-0.000001308],[0.000016082,-0.000001306],[0.000016024,-0.000001307],[0.000015963,-0.000001313],[0.000015900,-0.000001319],[0.000015842,-0.000001316],[0.000015783,-0.000001315],[0.000015721,-0.000001315],[0.000015657,-0.000001316],[0.000015592,-0.000001319],[0.000015529,-0.000001320],[0.000015462,-0.000001320],[0.000015384,-0.000001322],[0.000015300,-0.000001325],[0.000015216,-0.000001329],[0.000015141,-0.000001325],[0.000015072,-0.000001318],[0.000015005,-0.000001310],[0.000014937,-0.000001301],[0.000014869,-0.000001295],[0.000014801,-0.000001292],[0.000014729,-0.000001289],[0.000014650,-0.000001283],[0.000014578,-0.000001278],[0.000014515,-0.000001277],[0.000014453,-0.000001280],[0.000014376,-0.000001285],[0.000014294,-0.000001290],[0.000014229,-0.000001291],[0.000014169,-0.000001288],[0.000014108,-0.000001284],[0.000014036,-0.000001282],[0.000013968,-0.000001281],[0.000013906,-0.000001280],[0.000013845,-0.000001277],[0.000013781,-0.000001270],[0.000013712,-0.000001258],[0.000013636,-0.000001247],[0.000013556,-0.000001242],[0.000013475,-0.000001239],[0.000013395,-0.000001235],[0.000013317,-0.000001228],[0.000013245,-0.000001218],[0.000013181,-0.000001206],[0.000013125,-0.000001195],[0.000013074,-0.000001187],[0.000013014,-0.000001178],[0.000012949,-0.000001170],[0.000012886,-0.000001165],[0.000012826,-0.000001161],[0.000012766,-0.000001157],[0.000012704,-0.000001152],[0.000012628,-0.000001145],[0.000012536,-0.000001137],[0.000012448,-0.000001129],[0.000012370,-0.000001122],[0.000012294,-0.000001120],[0.000012221,-0.000001125],[0.000012153,-0.000001135],[0.000012085,-0.000001144],[0.000012009,-0.000001147],[0.000011925,-0.000001144],[0.000011850,-0.000001142],[0.000011775,-0.000001147],[0.000011701,-0.000001156],[0.000011630,-0.000001168],[0.000011558,-0.000001175],[0.000011482,-0.000001177],[0.000011405,-0.000001176],[0.000011330,-0.000001172],[0.000011261,-0.000001169],[0.000011197,-0.000001166],[0.000011136,-0.000001165],[0.000011073,-0.000001168],[0.000011008,-0.000001177],[0.000010952,-0.000001183],[0.000010910,-0.000001180],[0.000010874,-0.000001173],[0.000010800,-0.000001179],[0.000010726,-0.000001183],[0.000010665,-0.000001181],[0.000010609,-0.000001176],[0.000010555,-0.000001171],[0.000010497,-0.000001167],[0.000010432,-0.000001165],[0.000010364,-0.000001165],[0.000010303,-0.000001166],[0.000010251,-0.000001170],[0.000010202,-0.000001171],[0.000010157,-0.000001168],[0.000010114,-0.000001161],[0.000010066,-0.000001151],[0.000010011,-0.000001143],[0.000009953,-0.000001141],[0.000009895,-0.000001141],[0.000009843,-0.000001137],[0.000009797,-0.000001129],[0.000009755,-0.000001118],[0.000009710,-0.000001109],[0.000009656,-0.000001103],[0.000009602,-0.000001100],[0.000009558,-0.000001094],[0.000009518,-0.000001083],[0.000009476,-0.000001069],[0.000009428,-0.000001052],[0.000009373,-0.000001033],[0.000009312,-0.000001014],[0.000009248,-0.000000995],[0.000009184,-0.000000980],[0.000009125,-0.000000971],[0.000009071,-0.000000963],[0.000009017,-0.000000953],[0.000008962,-0.000000941],[0.000008907,-0.000000927],[0.000008853,-0.000000913],[0.000008798,-0.000000899],[0.000008744,-0.000000886],[0.000008689,-0.000000873],[0.000008634,-0.000000861],[0.000008579,-0.000000849],[0.000008524,-0.000000838],[0.000008469,-0.000000827],[0.000008413,-0.000000817],[0.000008358,-0.000000806],[0.000008303,-0.000000796],[0.000008247,-0.000000787],[0.000008192,-0.000000777],[0.000008137,-0.000000767],[0.000008082,-0.000000758],[0.000008026,-0.000000748],[0.000007971,-0.000000739],[0.000007916,-0.000000730],[0.000007860,-0.000000720],[0.000007805,-0.000000711],[0.000017564,-0.000001675],[0.000017504,-0.000001653],[0.000017443,-0.000001631],[0.000017383,-0.000001609],[0.000017323,-0.000001587],[0.000017263,-0.000001564],[0.000017202,-0.000001540],[0.000017140,-0.000001517],[0.000017077,-0.000001493],[0.000017008,-0.000001471],[0.000016938,-0.000001449],[0.000016873,-0.000001424],[0.000016807,-0.000001403],[0.000016740,-0.000001388],[0.000016670,-0.000001375],[0.000016599,-0.000001366],[0.000016530,-0.000001359],[0.000016467,-0.000001354],[0.000016404,-0.000001349],[0.000016338,-0.000001344],[0.000016270,-0.000001339],[0.000016203,-0.000001334],[0.000016140,-0.000001328],[0.000016080,-0.000001324],[0.000016020,-0.000001321],[0.000015960,-0.000001322],[0.000015898,-0.000001327],[0.000015836,-0.000001330],[0.000015772,-0.000001331],[0.000015706,-0.000001333],[0.000015640,-0.000001335],[0.000015574,-0.000001336],[0.000015508,-0.000001337],[0.000015436,-0.000001338],[0.000015359,-0.000001340],[0.000015280,-0.000001341],[0.000015202,-0.000001341],[0.000015129,-0.000001338],[0.000015060,-0.000001334],[0.000014995,-0.000001327],[0.000014932,-0.000001319],[0.000014872,-0.000001312],[0.000014811,-0.000001308],[0.000014745,-0.000001303],[0.000014670,-0.000001297],[0.000014599,-0.000001293],[0.000014537,-0.000001293],[0.000014474,-0.000001295],[0.000014402,-0.000001299],[0.000014322,-0.000001304],[0.000014252,-0.000001306],[0.000014187,-0.000001304],[0.000014121,-0.000001300],[0.000014051,-0.000001297],[0.000013984,-0.000001294],[0.000013923,-0.000001293],[0.000013864,-0.000001289],[0.000013798,-0.000001282],[0.000013728,-0.000001273],[0.000013653,-0.000001264],[0.000013575,-0.000001259],[0.000013495,-0.000001255],[0.000013414,-0.000001249],[0.000013335,-0.000001241],[0.000013261,-0.000001231],[0.000013193,-0.000001221],[0.000013131,-0.000001212],[0.000013072,-0.000001205],[0.000013011,-0.000001196],[0.000012948,-0.000001187],[0.000012886,-0.000001179],[0.000012824,-0.000001173],[0.000012761,-0.000001167],[0.000012698,-0.000001160],[0.000012618,-0.000001153],[0.000012521,-0.000001145],[0.000012440,-0.000001138],[0.000012364,-0.000001131],[0.000012289,-0.000001127],[0.000012214,-0.000001127],[0.000012150,-0.000001135],[0.000012089,-0.000001145],[0.000012021,-0.000001148],[0.000011945,-0.000001148],[0.000011863,-0.000001147],[0.000011776,-0.000001150],[0.000011696,-0.000001158],[0.000011624,-0.000001171],[0.000011554,-0.000001181],[0.000011480,-0.000001186],[0.000011401,-0.000001186],[0.000011321,-0.000001183],[0.000011254,-0.000001180],[0.000011195,-0.000001178],[0.000011137,-0.000001178],[0.000011079,-0.000001183],[0.000011021,-0.000001190],[0.000010969,-0.000001195],[0.000010923,-0.000001192],[0.000010871,-0.000001190],[0.000010800,-0.000001195],[0.000010732,-0.000001199],[0.000010671,-0.000001200],[0.000010616,-0.000001199],[0.000010561,-0.000001195],[0.000010502,-0.000001189],[0.000010438,-0.000001184],[0.000010375,-0.000001181],[0.000010317,-0.000001182],[0.000010265,-0.000001186],[0.000010217,-0.000001189],[0.000010172,-0.000001189],[0.000010133,-0.000001184],[0.000010084,-0.000001176],[0.000010026,-0.000001163],[0.000009967,-0.000001161],[0.000009912,-0.000001166],[0.000009865,-0.000001163],[0.000009821,-0.000001156],[0.000009779,-0.000001146],[0.000009735,-0.000001134],[0.000009681,-0.000001126],[0.000009632,-0.000001120],[0.000009594,-0.000001115],[0.000009549,-0.000001104],[0.000009503,-0.000001087],[0.000009454,-0.000001068],[0.000009399,-0.000001049],[0.000009337,-0.000001033],[0.000009269,-0.000001018],[0.000009200,-0.000001004],[0.000009145,-0.000001002],[0.000009093,-0.000000999],[0.000009040,-0.000000987],[0.000008986,-0.000000973],[0.000008933,-0.000000958],[0.000008879,-0.000000943],[0.000008825,-0.000000929],[0.000008772,-0.000000916],[0.000008717,-0.000000903],[0.000008663,-0.000000891],[0.000008608,-0.000000879],[0.000008553,-0.000000868],[0.000008498,-0.000000857],[0.000008442,-0.000000847],[0.000008387,-0.000000837],[0.000008332,-0.000000828],[0.000008276,-0.000000818],[0.000008221,-0.000000809],[0.000008165,-0.000000799],[0.000008110,-0.000000790],[0.000008055,-0.000000781],[0.000008000,-0.000000772],[0.000007944,-0.000000763],[0.000007889,-0.000000754],[0.000007833,-0.000000745],[0.000017627,-0.000001694],[0.000017566,-0.000001672],[0.000017505,-0.000001650],[0.000017444,-0.000001627],[0.000017384,-0.000001605],[0.000017326,-0.000001580],[0.000017268,-0.000001555],[0.000017210,-0.000001529],[0.000017143,-0.000001506],[0.000017066,-0.000001485],[0.000016991,-0.000001462],[0.000016920,-0.000001438],[0.000016851,-0.000001416],[0.000016781,-0.000001396],[0.000016704,-0.000001387],[0.000016626,-0.000001380],[0.000016550,-0.000001376],[0.000016486,-0.000001372],[0.000016420,-0.000001368],[0.000016349,-0.000001365],[0.000016274,-0.000001361],[0.000016204,-0.000001355],[0.000016140,-0.000001347],[0.000016080,-0.000001340],[0.000016020,-0.000001333],[0.000015959,-0.000001328],[0.000015897,-0.000001334],[0.000015832,-0.000001340],[0.000015764,-0.000001346],[0.000015691,-0.000001351],[0.000015620,-0.000001355],[0.000015554,-0.000001355],[0.000015491,-0.000001354],[0.000015422,-0.000001356],[0.000015341,-0.000001363],[0.000015265,-0.000001366],[0.000015198,-0.000001364],[0.000015131,-0.000001358],[0.000015063,-0.000001353],[0.000014997,-0.000001347],[0.000014937,-0.000001340],[0.000014882,-0.000001331],[0.000014820,-0.000001322],[0.000014755,-0.000001315],[0.000014687,-0.000001310],[0.000014621,-0.000001309],[0.000014559,-0.000001310],[0.000014496,-0.000001314],[0.000014427,-0.000001318],[0.000014354,-0.000001322],[0.000014279,-0.000001323],[0.000014207,-0.000001322],[0.000014137,-0.000001319],[0.000014068,-0.000001315],[0.000014005,-0.000001311],[0.000013946,-0.000001307],[0.000013887,-0.000001301],[0.000013819,-0.000001294],[0.000013747,-0.000001286],[0.000013674,-0.000001280],[0.000013599,-0.000001275],[0.000013521,-0.000001271],[0.000013441,-0.000001263],[0.000013361,-0.000001253],[0.000013284,-0.000001242],[0.000013214,-0.000001234],[0.000013145,-0.000001228],[0.000013075,-0.000001221],[0.000013012,-0.000001213],[0.000012948,-0.000001203],[0.000012884,-0.000001192],[0.000012819,-0.000001182],[0.000012747,-0.000001175],[0.000012650,-0.000001169],[0.000012547,-0.000001162],[0.000012495,-0.000001155],[0.000012437,-0.000001148],[0.000012369,-0.000001142],[0.000012294,-0.000001136],[0.000012219,-0.000001135],[0.000012156,-0.000001143],[0.000012095,-0.000001150],[0.000012028,-0.000001150],[0.000011961,-0.000001148],[0.000011871,-0.000001150],[0.000011771,-0.000001154],[0.000011687,-0.000001162],[0.000011618,-0.000001173],[0.000011554,-0.000001185],[0.000011484,-0.000001193],[0.000011403,-0.000001194],[0.000011325,-0.000001192],[0.000011261,-0.000001192],[0.000011206,-0.000001193],[0.000011150,-0.000001192],[0.000011093,-0.000001197],[0.000011037,-0.000001205],[0.000010981,-0.000001212],[0.000010925,-0.000001213],[0.000010863,-0.000001211],[0.000010798,-0.000001213],[0.000010735,-0.000001219],[0.000010676,-0.000001222],[0.000010620,-0.000001221],[0.000010565,-0.000001217],[0.000010505,-0.000001211],[0.000010444,-0.000001206],[0.000010385,-0.000001203],[0.000010332,-0.000001203],[0.000010285,-0.000001204],[0.000010243,-0.000001204],[0.000010205,-0.000001202],[0.000010158,-0.000001206],[0.000010103,-0.000001210],[0.000010043,-0.000001199],[0.000009983,-0.000001185],[0.000009932,-0.000001186],[0.000009888,-0.000001187],[0.000009847,-0.000001183],[0.000009804,-0.000001174],[0.000009755,-0.000001161],[0.000009700,-0.000001149],[0.000009648,-0.000001138],[0.000009618,-0.000001135],[0.000009571,-0.000001124],[0.000009523,-0.000001107],[0.000009475,-0.000001086],[0.000009422,-0.000001068],[0.000009360,-0.000001057],[0.000009296,-0.000001048],[0.000009231,-0.000001039],[0.000009172,-0.000001034],[0.000009116,-0.000001028],[0.000009063,-0.000001016],[0.000009010,-0.000001002],[0.000008958,-0.000000987],[0.000008905,-0.000000972],[0.000008852,-0.000000958],[0.000008799,-0.000000945],[0.000008745,-0.000000932],[0.000008691,-0.000000920],[0.000008636,-0.000000909],[0.000008581,-0.000000898],[0.000008526,-0.000000888],[0.000008471,-0.000000878],[0.000008416,-0.000000868],[0.000008360,-0.000000859],[0.000008305,-0.000000850],[0.000008250,-0.000000841],[0.000008194,-0.000000832],[0.000008139,-0.000000823],[0.000008084,-0.000000814],[0.000008029,-0.000000805],[0.000007973,-0.000000797],[0.000007918,-0.000000788],[0.000007863,-0.000000779],[0.000017691,-0.000001712],[0.000017630,-0.000001689],[0.000017568,-0.000001666],[0.000017508,-0.000001643],[0.000017447,-0.000001619],[0.000017389,-0.000001594],[0.000017330,-0.000001568],[0.000017269,-0.000001543],[0.000017200,-0.000001519],[0.000017122,-0.000001497],[0.000017044,-0.000001475],[0.000016968,-0.000001452],[0.000016894,-0.000001430],[0.000016818,-0.000001412],[0.000016738,-0.000001402],[0.000016658,-0.000001396],[0.000016581,-0.000001392],[0.000016511,-0.000001389],[0.000016441,-0.000001387],[0.000016364,-0.000001384],[0.000016276,-0.000001382],[0.000016206,-0.000001374],[0.000016144,-0.000001364],[0.000016084,-0.000001355],[0.000016024,-0.000001348],[0.000015961,-0.000001345],[0.000015896,-0.000001348],[0.000015828,-0.000001354],[0.000015755,-0.000001362],[0.000015676,-0.000001371],[0.000015598,-0.000001377],[0.000015528,-0.000001379],[0.000015474,-0.000001375],[0.000015419,-0.000001375],[0.000015337,-0.000001388],[0.000015267,-0.000001396],[0.000015209,-0.000001392],[0.000015149,-0.000001382],[0.000015081,-0.000001374],[0.000015011,-0.000001367],[0.000014950,-0.000001360],[0.000014896,-0.000001350],[0.000014832,-0.000001336],[0.000014766,-0.000001326],[0.000014703,-0.000001323],[0.000014643,-0.000001326],[0.000014583,-0.000001330],[0.000014520,-0.000001335],[0.000014453,-0.000001339],[0.000014382,-0.000001341],[0.000014303,-0.000001340],[0.000014228,-0.000001339],[0.000014157,-0.000001337],[0.000014092,-0.000001335],[0.000014032,-0.000001331],[0.000013973,-0.000001323],[0.000013911,-0.000001315],[0.000013843,-0.000001307],[0.000013770,-0.000001299],[0.000013701,-0.000001293],[0.000013629,-0.000001289],[0.000013552,-0.000001285],[0.000013472,-0.000001276],[0.000013392,-0.000001265],[0.000013315,-0.000001255],[0.000013243,-0.000001247],[0.000013171,-0.000001241],[0.000013097,-0.000001235],[0.000013026,-0.000001228],[0.000012956,-0.000001219],[0.000012882,-0.000001205],[0.000012810,-0.000001187],[0.000012744,-0.000001180],[0.000012661,-0.000001177],[0.000012561,-0.000001172],[0.000012504,-0.000001165],[0.000012449,-0.000001158],[0.000012383,-0.000001152],[0.000012307,-0.000001147],[0.000012230,-0.000001146],[0.000012161,-0.000001151],[0.000012093,-0.000001154],[0.000012015,-0.000001149],[0.000011937,-0.000001146],[0.000011850,-0.000001150],[0.000011754,-0.000001158],[0.000011677,-0.000001163],[0.000011613,-0.000001171],[0.000011554,-0.000001183],[0.000011492,-0.000001195],[0.000011405,-0.000001194],[0.000011330,-0.000001193],[0.000011276,-0.000001199],[0.000011231,-0.000001208],[0.000011177,-0.000001210],[0.000011116,-0.000001211],[0.000011054,-0.000001219],[0.000010991,-0.000001231],[0.000010927,-0.000001238],[0.000010861,-0.000001237],[0.000010797,-0.000001237],[0.000010736,-0.000001242],[0.000010679,-0.000001246],[0.000010624,-0.000001245],[0.000010567,-0.000001240],[0.000010509,-0.000001234],[0.000010449,-0.000001230],[0.000010394,-0.000001228],[0.000010346,-0.000001227],[0.000010303,-0.000001227],[0.000010265,-0.000001225],[0.000010226,-0.000001223],[0.000010171,-0.000001230],[0.000010111,-0.000001236],[0.000010052,-0.000001231],[0.000009997,-0.000001215],[0.000009950,-0.000001211],[0.000009909,-0.000001211],[0.000009870,-0.000001210],[0.000009829,-0.000001201],[0.000009779,-0.000001187],[0.000009721,-0.000001174],[0.000009665,-0.000001164],[0.000009622,-0.000001158],[0.000009578,-0.000001148],[0.000009532,-0.000001133],[0.000009484,-0.000001115],[0.000009434,-0.000001098],[0.000009378,-0.000001088],[0.000009322,-0.000001082],[0.000009264,-0.000001077],[0.000009200,-0.000001066],[0.000009140,-0.000001055],[0.000009086,-0.000001042],[0.000009034,-0.000001029],[0.000008983,-0.000001014],[0.000008931,-0.000001000],[0.000008879,-0.000000986],[0.000008826,-0.000000974],[0.000008773,-0.000000961],[0.000008718,-0.000000950],[0.000008664,-0.000000939],[0.000008609,-0.000000929],[0.000008554,-0.000000919],[0.000008499,-0.000000909],[0.000008444,-0.000000900],[0.000008388,-0.000000891],[0.000008333,-0.000000882],[0.000008278,-0.000000873],[0.000008223,-0.000000864],[0.000008168,-0.000000856],[0.000008113,-0.000000847],[0.000008058,-0.000000839],[0.000008002,-0.000000830],[0.000007947,-0.000000822],[0.000007892,-0.000000814],[0.000017756,-0.000001727],[0.000017694,-0.000001703],[0.000017632,-0.000001680],[0.000017570,-0.000001657],[0.000017509,-0.000001632],[0.000017448,-0.000001607],[0.000017386,-0.000001582],[0.000017321,-0.000001557],[0.000017250,-0.000001533],[0.000017173,-0.000001510],[0.000017094,-0.000001488],[0.000017015,-0.000001467],[0.000016935,-0.000001448],[0.000016855,-0.000001432],[0.000016773,-0.000001421],[0.000016692,-0.000001414],[0.000016613,-0.000001410],[0.000016537,-0.000001407],[0.000016461,-0.000001404],[0.000016376,-0.000001403],[0.000016282,-0.000001401],[0.000016216,-0.000001391],[0.000016156,-0.000001380],[0.000016094,-0.000001372],[0.000016031,-0.000001366],[0.000015965,-0.000001365],[0.000015896,-0.000001367],[0.000015824,-0.000001373],[0.000015747,-0.000001382],[0.000015666,-0.000001391],[0.000015584,-0.000001400],[0.000015505,-0.000001407],[0.000015445,-0.000001408],[0.000015410,-0.000001405],[0.000015350,-0.000001416],[0.000015289,-0.000001426],[0.000015235,-0.000001421],[0.000015178,-0.000001407],[0.000015113,-0.000001396],[0.000015045,-0.000001386],[0.000014983,-0.000001379],[0.000014918,-0.000001372],[0.000014849,-0.000001357],[0.000014779,-0.000001341],[0.000014720,-0.000001341],[0.000014665,-0.000001347],[0.000014608,-0.000001352],[0.000014544,-0.000001356],[0.000014474,-0.000001358],[0.000014400,-0.000001358],[0.000014322,-0.000001356],[0.000014249,-0.000001355],[0.000014180,-0.000001354],[0.000014117,-0.000001355],[0.000014059,-0.000001353],[0.000014001,-0.000001343],[0.000013938,-0.000001332],[0.000013872,-0.000001322],[0.000013805,-0.000001312],[0.000013737,-0.000001304],[0.000013663,-0.000001298],[0.000013584,-0.000001293],[0.000013504,-0.000001286],[0.000013426,-0.000001277],[0.000013349,-0.000001268],[0.000013275,-0.000001259],[0.000013204,-0.000001252],[0.000013134,-0.000001246],[0.000013052,-0.000001239],[0.000012973,-0.000001232],[0.000012893,-0.000001220],[0.000012809,-0.000001189],[0.000012759,-0.000001184],[0.000012707,-0.000001184],[0.000012625,-0.000001180],[0.000012542,-0.000001173],[0.000012472,-0.000001166],[0.000012404,-0.000001161],[0.000012320,-0.000001154],[0.000012236,-0.000001151],[0.000012160,-0.000001154],[0.000012081,-0.000001152],[0.000011993,-0.000001145],[0.000011911,-0.000001142],[0.000011835,-0.000001146],[0.000011752,-0.000001152],[0.000011676,-0.000001156],[0.000011610,-0.000001162],[0.000011551,-0.000001173],[0.000011486,-0.000001183],[0.000011400,-0.000001184],[0.000011336,-0.000001188],[0.000011295,-0.000001198],[0.000011256,-0.000001212],[0.000011206,-0.000001218],[0.000011139,-0.000001218],[0.000011071,-0.000001227],[0.000011004,-0.000001244],[0.000010937,-0.000001260],[0.000010867,-0.000001265],[0.000010799,-0.000001265],[0.000010739,-0.000001268],[0.000010683,-0.000001271],[0.000010628,-0.000001270],[0.000010572,-0.000001263],[0.000010515,-0.000001257],[0.000010456,-0.000001255],[0.000010402,-0.000001255],[0.000010358,-0.000001255],[0.000010317,-0.000001254],[0.000010275,-0.000001253],[0.000010226,-0.000001254],[0.000010168,-0.000001258],[0.000010106,-0.000001260],[0.000010052,-0.000001255],[0.000010005,-0.000001246],[0.000009963,-0.000001240],[0.000009925,-0.000001236],[0.000009891,-0.000001231],[0.000009855,-0.000001222],[0.000009804,-0.000001209],[0.000009743,-0.000001199],[0.000009682,-0.000001191],[0.000009627,-0.000001186],[0.000009579,-0.000001177],[0.000009533,-0.000001164],[0.000009488,-0.000001148],[0.000009441,-0.000001132],[0.000009390,-0.000001122],[0.000009337,-0.000001115],[0.000009282,-0.000001107],[0.000009220,-0.000001094],[0.000009162,-0.000001080],[0.000009109,-0.000001067],[0.000009058,-0.000001054],[0.000009008,-0.000001040],[0.000008957,-0.000001027],[0.000008905,-0.000001014],[0.000008852,-0.000001002],[0.000008799,-0.000000990],[0.000008745,-0.000000980],[0.000008690,-0.000000969],[0.000008636,-0.000000959],[0.000008581,-0.000000950],[0.000008526,-0.000000940],[0.000008471,-0.000000931],[0.000008416,-0.000000923],[0.000008361,-0.000000914],[0.000008306,-0.000000906],[0.000008252,-0.000000897],[0.000008197,-0.000000889],[0.000008142,-0.000000881],[0.000008087,-0.000000873],[0.000008032,-0.000000864],[0.000007977,-0.000000856],[0.000007922,-0.000000848],[0.000017822,-0.000001740],[0.000017758,-0.000001716],[0.000017695,-0.000001692],[0.000017632,-0.000001669],[0.000017568,-0.000001644],[0.000017504,-0.000001619],[0.000017438,-0.000001595],[0.000017369,-0.000001571],[0.000017296,-0.000001547],[0.000017220,-0.000001525],[0.000017140,-0.000001504],[0.000017058,-0.000001484],[0.000016975,-0.000001467],[0.000016892,-0.000001453],[0.000016809,-0.000001442],[0.000016726,-0.000001434],[0.000016645,-0.000001429],[0.000016563,-0.000001425],[0.000016480,-0.000001422],[0.000016394,-0.000001420],[0.000016310,-0.000001415],[0.000016239,-0.000001406],[0.000016176,-0.000001396],[0.000016109,-0.000001390],[0.000016040,-0.000001387],[0.000015971,-0.000001387],[0.000015898,-0.000001390],[0.000015823,-0.000001395],[0.000015744,-0.000001404],[0.000015663,-0.000001413],[0.000015583,-0.000001423],[0.000015510,-0.000001431],[0.000015451,-0.000001435],[0.000015408,-0.000001437],[0.000015363,-0.000001442],[0.000015316,-0.000001445],[0.000015269,-0.000001440],[0.000015215,-0.000001429],[0.000015148,-0.000001416],[0.000015080,-0.000001406],[0.000015013,-0.000001399],[0.000014944,-0.000001397],[0.000014878,-0.000001395],[0.000014800,-0.000001367],[0.000014744,-0.000001369],[0.000014689,-0.000001374],[0.000014630,-0.000001377],[0.000014565,-0.000001377],[0.000014493,-0.000001376],[0.000014417,-0.000001374],[0.000014340,-0.000001371],[0.000014271,-0.000001369],[0.000014204,-0.000001368],[0.000014141,-0.000001370],[0.000014085,-0.000001374],[0.000014026,-0.000001365],[0.000013965,-0.000001353],[0.000013903,-0.000001340],[0.000013841,-0.000001327],[0.000013777,-0.000001314],[0.000013702,-0.000001305],[0.000013618,-0.000001301],[0.000013537,-0.000001296],[0.000013460,-0.000001288],[0.000013385,-0.000001278],[0.000013309,-0.000001268],[0.000013230,-0.000001258],[0.000013153,-0.000001252],[0.000013076,-0.000001246],[0.000012999,-0.000001238],[0.000012924,-0.000001224],[0.000012852,-0.000001205],[0.000012792,-0.000001195],[0.000012732,-0.000001190],[0.000012658,-0.000001185],[0.000012576,-0.000001178],[0.000012495,-0.000001170],[0.000012416,-0.000001162],[0.000012328,-0.000001156],[0.000012243,-0.000001157],[0.000012164,-0.000001157],[0.000012079,-0.000001152],[0.000011991,-0.000001146],[0.000011911,-0.000001144],[0.000011842,-0.000001144],[0.000011765,-0.000001144],[0.000011681,-0.000001144],[0.000011609,-0.000001149],[0.000011551,-0.000001162],[0.000011491,-0.000001171],[0.000011424,-0.000001174],[0.000011365,-0.000001182],[0.000011318,-0.000001192],[0.000011272,-0.000001198],[0.000011219,-0.000001205],[0.000011157,-0.000001214],[0.000011089,-0.000001228],[0.000011020,-0.000001245],[0.000010952,-0.000001266],[0.000010878,-0.000001278],[0.000010805,-0.000001282],[0.000010745,-0.000001287],[0.000010688,-0.000001293],[0.000010634,-0.000001293],[0.000010579,-0.000001287],[0.000010523,-0.000001283],[0.000010467,-0.000001284],[0.000010415,-0.000001285],[0.000010368,-0.000001285],[0.000010323,-0.000001284],[0.000010275,-0.000001284],[0.000010218,-0.000001287],[0.000010157,-0.000001290],[0.000010100,-0.000001289],[0.000010053,-0.000001284],[0.000010012,-0.000001277],[0.000009972,-0.000001268],[0.000009934,-0.000001261],[0.000009900,-0.000001252],[0.000009866,-0.000001241],[0.000009819,-0.000001230],[0.000009760,-0.000001220],[0.000009697,-0.000001216],[0.000009634,-0.000001213],[0.000009579,-0.000001207],[0.000009535,-0.000001195],[0.000009493,-0.000001179],[0.000009449,-0.000001165],[0.000009399,-0.000001154],[0.000009343,-0.000001143],[0.000009288,-0.000001132],[0.000009233,-0.000001118],[0.000009182,-0.000001105],[0.000009132,-0.000001092],[0.000009082,-0.000001079],[0.000009032,-0.000001066],[0.000008982,-0.000001053],[0.000008930,-0.000001042],[0.000008877,-0.000001030],[0.000008824,-0.000001020],[0.000008770,-0.000001009],[0.000008716,-0.000001000],[0.000008662,-0.000000990],[0.000008607,-0.000000981],[0.000008553,-0.000000972],[0.000008498,-0.000000963],[0.000008444,-0.000000955],[0.000008389,-0.000000946],[0.000008335,-0.000000938],[0.000008280,-0.000000930],[0.000008226,-0.000000922],[0.000008171,-0.000000914],[0.000008117,-0.000000907],[0.000008062,-0.000000899],[0.000008008,-0.000000891],[0.000007953,-0.000000883],[0.000017888,-0.000001751],[0.000017823,-0.000001727],[0.000017757,-0.000001703],[0.000017691,-0.000001679],[0.000017625,-0.000001656],[0.000017557,-0.000001632],[0.000017488,-0.000001608],[0.000017416,-0.000001584],[0.000017341,-0.000001562],[0.000017263,-0.000001541],[0.000017182,-0.000001520],[0.000017099,-0.000001502],[0.000017015,-0.000001487],[0.000016929,-0.000001473],[0.000016845,-0.000001462],[0.000016760,-0.000001454],[0.000016675,-0.000001448],[0.000016590,-0.000001443],[0.000016504,-0.000001440],[0.000016420,-0.000001435],[0.000016339,-0.000001430],[0.000016265,-0.000001423],[0.000016195,-0.000001416],[0.000016124,-0.000001411],[0.000016052,-0.000001409],[0.000015979,-0.000001410],[0.000015904,-0.000001414],[0.000015828,-0.000001420],[0.000015749,-0.000001427],[0.000015671,-0.000001436],[0.000015596,-0.000001445],[0.000015528,-0.000001453],[0.000015470,-0.000001459],[0.000015422,-0.000001463],[0.000015381,-0.000001465],[0.000015340,-0.000001464],[0.000015298,-0.000001458],[0.000015245,-0.000001449],[0.000015177,-0.000001438],[0.000015105,-0.000001427],[0.000015033,-0.000001417],[0.000014964,-0.000001416],[0.000014912,-0.000001435],[0.000014843,-0.000001421],[0.000014776,-0.000001407],[0.000014714,-0.000001404],[0.000014651,-0.000001401],[0.000014582,-0.000001397],[0.000014510,-0.000001392],[0.000014438,-0.000001389],[0.000014366,-0.000001386],[0.000014298,-0.000001383],[0.000014230,-0.000001380],[0.000014164,-0.000001378],[0.000014106,-0.000001380],[0.000014051,-0.000001379],[0.000013992,-0.000001372],[0.000013932,-0.000001360],[0.000013873,-0.000001345],[0.000013812,-0.000001327],[0.000013740,-0.000001313],[0.000013652,-0.000001311],[0.000013571,-0.000001306],[0.000013494,-0.000001296],[0.000013420,-0.000001285],[0.000013344,-0.000001275],[0.000013258,-0.000001264],[0.000013177,-0.000001257],[0.000013102,-0.000001252],[0.000013030,-0.000001244],[0.000012962,-0.000001232],[0.000012899,-0.000001218],[0.000012827,-0.000001206],[0.000012753,-0.000001197],[0.000012676,-0.000001189],[0.000012595,-0.000001180],[0.000012512,-0.000001172],[0.000012429,-0.000001164],[0.000012344,-0.000001162],[0.000012261,-0.000001163],[0.000012178,-0.000001158],[0.000012089,-0.000001150],[0.000012001,-0.000001147],[0.000011920,-0.000001148],[0.000011850,-0.000001146],[0.000011777,-0.000001141],[0.000011695,-0.000001137],[0.000011620,-0.000001143],[0.000011565,-0.000001159],[0.000011511,-0.000001171],[0.000011456,-0.000001177],[0.000011398,-0.000001185],[0.000011342,-0.000001192],[0.000011288,-0.000001195],[0.000011234,-0.000001201],[0.000011173,-0.000001214],[0.000011107,-0.000001228],[0.000011038,-0.000001243],[0.000010972,-0.000001260],[0.000010901,-0.000001276],[0.000010825,-0.000001287],[0.000010757,-0.000001295],[0.000010697,-0.000001302],[0.000010642,-0.000001304],[0.000010587,-0.000001303],[0.000010532,-0.000001305],[0.000010478,-0.000001311],[0.000010427,-0.000001315],[0.000010374,-0.000001314],[0.000010322,-0.000001312],[0.000010267,-0.000001313],[0.000010203,-0.000001318],[0.000010142,-0.000001323],[0.000010096,-0.000001323],[0.000010058,-0.000001315],[0.000010021,-0.000001306],[0.000009980,-0.000001296],[0.000009936,-0.000001287],[0.000009899,-0.000001279],[0.000009866,-0.000001266],[0.000009827,-0.000001251],[0.000009777,-0.000001239],[0.000009714,-0.000001235],[0.000009645,-0.000001236],[0.000009585,-0.000001233],[0.000009543,-0.000001219],[0.000009504,-0.000001205],[0.000009460,-0.000001194],[0.000009410,-0.000001184],[0.000009356,-0.000001173],[0.000009302,-0.000001159],[0.000009251,-0.000001145],[0.000009204,-0.000001131],[0.000009155,-0.000001118],[0.000009105,-0.000001105],[0.000009055,-0.000001092],[0.000009005,-0.000001080],[0.000008953,-0.000001069],[0.000008901,-0.000001059],[0.000008848,-0.000001049],[0.000008794,-0.000001039],[0.000008741,-0.000001030],[0.000008687,-0.000001021],[0.000008633,-0.000001012],[0.000008579,-0.000001004],[0.000008525,-0.000000995],[0.000008471,-0.000000987],[0.000008417,-0.000000979],[0.000008362,-0.000000971],[0.000008309,-0.000000964],[0.000008254,-0.000000956],[0.000008200,-0.000000948],[0.000008146,-0.000000941],[0.000008092,-0.000000933],[0.000008038,-0.000000926],[0.000007984,-0.000000919],[0.000017954,-0.000001760],[0.000017886,-0.000001737],[0.000017817,-0.000001713],[0.000017749,-0.000001690],[0.000017679,-0.000001667],[0.000017608,-0.000001643],[0.000017536,-0.000001621],[0.000017461,-0.000001599],[0.000017384,-0.000001577],[0.000017304,-0.000001557],[0.000017222,-0.000001538],[0.000017138,-0.000001521],[0.000017053,-0.000001507],[0.000016966,-0.000001494],[0.000016880,-0.000001483],[0.000016793,-0.000001475],[0.000016706,-0.000001468],[0.000016619,-0.000001462],[0.000016533,-0.000001457],[0.000016449,-0.000001452],[0.000016369,-0.000001446],[0.000016292,-0.000001441],[0.000016216,-0.000001437],[0.000016142,-0.000001434],[0.000016068,-0.000001433],[0.000015992,-0.000001435],[0.000015916,-0.000001439],[0.000015839,-0.000001444],[0.000015762,-0.000001452],[0.000015688,-0.000001460],[0.000015617,-0.000001468],[0.000015553,-0.000001476],[0.000015496,-0.000001482],[0.000015446,-0.000001486],[0.000015402,-0.000001486],[0.000015360,-0.000001484],[0.000015314,-0.000001479],[0.000015259,-0.000001471],[0.000015194,-0.000001462],[0.000015123,-0.000001451],[0.000015052,-0.000001441],[0.000014985,-0.000001436],[0.000014928,-0.000001445],[0.000014867,-0.000001444],[0.000014802,-0.000001436],[0.000014736,-0.000001429],[0.000014668,-0.000001422],[0.000014596,-0.000001412],[0.000014526,-0.000001406],[0.000014458,-0.000001403],[0.000014393,-0.000001401],[0.000014326,-0.000001399],[0.000014259,-0.000001395],[0.000014196,-0.000001392],[0.000014140,-0.000001392],[0.000014080,-0.000001394],[0.000014019,-0.000001390],[0.000013958,-0.000001380],[0.000013901,-0.000001365],[0.000013846,-0.000001344],[0.000013782,-0.000001324],[0.000013697,-0.000001318],[0.000013610,-0.000001314],[0.000013529,-0.000001304],[0.000013452,-0.000001291],[0.000013374,-0.000001280],[0.000013291,-0.000001271],[0.000013210,-0.000001264],[0.000013134,-0.000001258],[0.000013063,-0.000001251],[0.000012995,-0.000001240],[0.000012927,-0.000001229],[0.000012849,-0.000001216],[0.000012769,-0.000001203],[0.000012688,-0.000001192],[0.000012607,-0.000001182],[0.000012524,-0.000001175],[0.000012441,-0.000001169],[0.000012359,-0.000001166],[0.000012277,-0.000001162],[0.000012195,-0.000001155],[0.000012104,-0.000001145],[0.000012016,-0.000001146],[0.000011932,-0.000001150],[0.000011857,-0.000001150],[0.000011791,-0.000001142],[0.000011721,-0.000001138],[0.000011649,-0.000001149],[0.000011589,-0.000001168],[0.000011532,-0.000001181],[0.000011476,-0.000001186],[0.000011416,-0.000001195],[0.000011357,-0.000001205],[0.000011303,-0.000001212],[0.000011251,-0.000001211],[0.000011190,-0.000001221],[0.000011122,-0.000001233],[0.000011054,-0.000001244],[0.000010992,-0.000001256],[0.000010931,-0.000001269],[0.000010843,-0.000001283],[0.000010769,-0.000001294],[0.000010706,-0.000001301],[0.000010649,-0.000001305],[0.000010592,-0.000001312],[0.000010536,-0.000001321],[0.000010482,-0.000001330],[0.000010428,-0.000001337],[0.000010370,-0.000001336],[0.000010311,-0.000001336],[0.000010250,-0.000001338],[0.000010186,-0.000001344],[0.000010129,-0.000001351],[0.000010092,-0.000001352],[0.000010059,-0.000001341],[0.000010027,-0.000001331],[0.000009986,-0.000001324],[0.000009936,-0.000001319],[0.000009894,-0.000001315],[0.000009859,-0.000001297],[0.000009830,-0.000001276],[0.000009793,-0.000001259],[0.000009736,-0.000001251],[0.000009669,-0.000001248],[0.000009609,-0.000001241],[0.000009565,-0.000001229],[0.000009523,-0.000001223],[0.000009476,-0.000001221],[0.000009426,-0.000001215],[0.000009373,-0.000001203],[0.000009320,-0.000001189],[0.000009270,-0.000001173],[0.000009223,-0.000001159],[0.000009174,-0.000001145],[0.000009125,-0.000001132],[0.000009076,-0.000001120],[0.000009026,-0.000001108],[0.000008975,-0.000001098],[0.000008922,-0.000001088],[0.000008870,-0.000001079],[0.000008817,-0.000001070],[0.000008764,-0.000001061],[0.000008711,-0.000001052],[0.000008657,-0.000001044],[0.000008604,-0.000001036],[0.000008550,-0.000001028],[0.000008497,-0.000001020],[0.000008444,-0.000001012],[0.000008390,-0.000001005],[0.000008337,-0.000000997],[0.000008283,-0.000000990],[0.000008230,-0.000000983],[0.000008176,-0.000000976],[0.000008123,-0.000000968],[0.000008070,-0.000000961],[0.000008016,-0.000000954],[0.000018018,-0.000001768],[0.000017947,-0.000001745],[0.000017876,-0.000001722],[0.000017804,-0.000001700],[0.000017731,-0.000001677],[0.000017657,-0.000001655],[0.000017582,-0.000001634],[0.000017504,-0.000001613],[0.000017425,-0.000001593],[0.000017344,-0.000001574],[0.000017261,-0.000001556],[0.000017176,-0.000001541],[0.000017090,-0.000001527],[0.000017003,-0.000001515],[0.000016915,-0.000001504],[0.000016827,-0.000001495],[0.000016738,-0.000001488],[0.000016651,-0.000001481],[0.000016565,-0.000001475],[0.000016481,-0.000001470],[0.000016399,-0.000001465],[0.000016320,-0.000001461],[0.000016241,-0.000001458],[0.000016163,-0.000001457],[0.000016087,-0.000001457],[0.000016010,-0.000001460],[0.000015933,-0.000001464],[0.000015857,-0.000001469],[0.000015782,-0.000001476],[0.000015711,-0.000001483],[0.000015644,-0.000001491],[0.000015582,-0.000001498],[0.000015526,-0.000001504],[0.000015474,-0.000001507],[0.000015425,-0.000001507],[0.000015377,-0.000001504],[0.000015325,-0.000001500],[0.000015268,-0.000001494],[0.000015204,-0.000001487],[0.000015138,-0.000001478],[0.000015072,-0.000001467],[0.000015007,-0.000001459],[0.000014946,-0.000001457],[0.000014884,-0.000001455],[0.000014820,-0.000001451],[0.000014752,-0.000001444],[0.000014681,-0.000001434],[0.000014609,-0.000001423],[0.000014540,-0.000001418],[0.000014474,-0.000001416],[0.000014414,-0.000001415],[0.000014349,-0.000001414],[0.000014285,-0.000001412],[0.000014228,-0.000001411],[0.000014174,-0.000001413],[0.000014112,-0.000001413],[0.000014047,-0.000001409],[0.000013986,-0.000001397],[0.000013930,-0.000001380],[0.000013876,-0.000001362],[0.000013816,-0.000001347],[0.000013736,-0.000001334],[0.000013647,-0.000001323],[0.000013563,-0.000001311],[0.000013483,-0.000001299],[0.000013405,-0.000001286],[0.000013327,-0.000001279],[0.000013247,-0.000001272],[0.000013169,-0.000001265],[0.000013094,-0.000001257],[0.000013019,-0.000001248],[0.000012943,-0.000001237],[0.000012862,-0.000001223],[0.000012779,-0.000001207],[0.000012698,-0.000001193],[0.000012617,-0.000001184],[0.000012536,-0.000001178],[0.000012454,-0.000001174],[0.000012371,-0.000001169],[0.000012288,-0.000001163],[0.000012205,-0.000001154],[0.000012119,-0.000001146],[0.000012034,-0.000001146],[0.000011950,-0.000001149],[0.000011872,-0.000001151],[0.000011811,-0.000001143],[0.000011741,-0.000001144],[0.000011666,-0.000001158],[0.000011605,-0.000001177],[0.000011541,-0.000001190],[0.000011474,-0.000001197],[0.000011413,-0.000001207],[0.000011359,-0.000001220],[0.000011310,-0.000001230],[0.000011260,-0.000001228],[0.000011202,-0.000001236],[0.000011136,-0.000001245],[0.000011060,-0.000001248],[0.000010997,-0.000001255],[0.000010940,-0.000001265],[0.000010852,-0.000001278],[0.000010777,-0.000001291],[0.000010711,-0.000001301],[0.000010650,-0.000001310],[0.000010590,-0.000001320],[0.000010532,-0.000001331],[0.000010475,-0.000001341],[0.000010418,-0.000001347],[0.000010358,-0.000001350],[0.000010297,-0.000001352],[0.000010238,-0.000001355],[0.000010181,-0.000001360],[0.000010129,-0.000001364],[0.000010084,-0.000001364],[0.000010051,-0.000001359],[0.000010023,-0.000001354],[0.000009983,-0.000001351],[0.000009931,-0.000001349],[0.000009884,-0.000001345],[0.000009846,-0.000001333],[0.000009825,-0.000001312],[0.000009805,-0.000001288],[0.000009753,-0.000001276],[0.000009697,-0.000001258],[0.000009646,-0.000001236],[0.000009595,-0.000001230],[0.000009545,-0.000001236],[0.000009494,-0.000001244],[0.000009442,-0.000001243],[0.000009390,-0.000001232],[0.000009338,-0.000001217],[0.000009288,-0.000001202],[0.000009240,-0.000001188],[0.000009191,-0.000001174],[0.000009143,-0.000001161],[0.000009094,-0.000001149],[0.000009044,-0.000001138],[0.000008994,-0.000001127],[0.000008942,-0.000001118],[0.000008890,-0.000001109],[0.000008838,-0.000001100],[0.000008786,-0.000001092],[0.000008733,-0.000001084],[0.000008681,-0.000001075],[0.000008628,-0.000001068],[0.000008576,-0.000001060],[0.000008523,-0.000001053],[0.000008470,-0.000001045],[0.000008417,-0.000001038],[0.000008365,-0.000001031],[0.000008312,-0.000001024],[0.000008260,-0.000001017],[0.000008207,-0.000001010],[0.000008154,-0.000001004],[0.000008101,-0.000000997],[0.000008049,-0.000000990],[0.000018081,-0.000001774],[0.000018007,-0.000001752],[0.000017933,-0.000001731],[0.000017858,-0.000001709],[0.000017782,-0.000001688],[0.000017705,-0.000001667],[0.000017627,-0.000001647],[0.000017547,-0.000001627],[0.000017466,-0.000001608],[0.000017383,-0.000001591],[0.000017299,-0.000001575],[0.000017213,-0.000001560],[0.000017126,-0.000001547],[0.000017038,-0.000001535],[0.000016950,-0.000001525],[0.000016861,-0.000001516],[0.000016772,-0.000001508],[0.000016684,-0.000001501],[0.000016598,-0.000001495],[0.000016513,-0.000001490],[0.000016430,-0.000001485],[0.000016348,-0.000001482],[0.000016268,-0.000001481],[0.000016188,-0.000001480],[0.000016109,-0.000001482],[0.000016032,-0.000001484],[0.000015955,-0.000001488],[0.000015880,-0.000001494],[0.000015808,-0.000001500],[0.000015739,-0.000001507],[0.000015675,-0.000001513],[0.000015614,-0.000001519],[0.000015557,-0.000001524],[0.000015503,-0.000001527],[0.000015450,-0.000001527],[0.000015396,-0.000001525],[0.000015339,-0.000001521],[0.000015278,-0.000001516],[0.000015214,-0.000001511],[0.000015151,-0.000001503],[0.000015091,-0.000001492],[0.000015030,-0.000001482],[0.000014964,-0.000001471],[0.000014899,-0.000001466],[0.000014834,-0.000001461],[0.000014766,-0.000001454],[0.000014695,-0.000001444],[0.000014623,-0.000001435],[0.000014553,-0.000001430],[0.000014485,-0.000001427],[0.000014420,-0.000001426],[0.000014358,-0.000001425],[0.000014305,-0.000001427],[0.000014258,-0.000001431],[0.000014209,-0.000001435],[0.000014151,-0.000001435],[0.000014081,-0.000001428],[0.000014018,-0.000001412],[0.000013958,-0.000001393],[0.000013900,-0.000001377],[0.000013839,-0.000001365],[0.000013762,-0.000001349],[0.000013674,-0.000001333],[0.000013593,-0.000001321],[0.000013518,-0.000001311],[0.000013443,-0.000001300],[0.000013366,-0.000001290],[0.000013286,-0.000001280],[0.000013204,-0.000001270],[0.000013123,-0.000001260],[0.000013043,-0.000001252],[0.000012960,-0.000001242],[0.000012875,-0.000001227],[0.000012790,-0.000001206],[0.000012710,-0.000001192],[0.000012632,-0.000001184],[0.000012551,-0.000001181],[0.000012468,-0.000001177],[0.000012384,-0.000001172],[0.000012299,-0.000001165],[0.000012215,-0.000001157],[0.000012134,-0.000001150],[0.000012053,-0.000001147],[0.000011971,-0.000001147],[0.000011889,-0.000001149],[0.000011815,-0.000001151],[0.000011741,-0.000001157],[0.000011669,-0.000001166],[0.000011604,-0.000001177],[0.000011537,-0.000001190],[0.000011464,-0.000001200],[0.000011405,-0.000001213],[0.000011355,-0.000001228],[0.000011306,-0.000001237],[0.000011256,-0.000001241],[0.000011203,-0.000001249],[0.000011145,-0.000001259],[0.000011066,-0.000001258],[0.000010992,-0.000001258],[0.000010924,-0.000001265],[0.000010850,-0.000001276],[0.000010778,-0.000001289],[0.000010711,-0.000001302],[0.000010646,-0.000001314],[0.000010582,-0.000001327],[0.000010520,-0.000001338],[0.000010460,-0.000001346],[0.000010402,-0.000001351],[0.000010343,-0.000001356],[0.000010283,-0.000001360],[0.000010227,-0.000001365],[0.000010178,-0.000001370],[0.000010131,-0.000001371],[0.000010073,-0.000001370],[0.000010034,-0.000001374],[0.000010000,-0.000001375],[0.000009960,-0.000001376],[0.000009913,-0.000001376],[0.000009868,-0.000001376],[0.000009831,-0.000001374],[0.000009807,-0.000001366],[0.000009788,-0.000001346],[0.000009748,-0.000001322],[0.000009708,-0.000001286],[0.000009669,-0.000001249],[0.000009618,-0.000001242],[0.000009563,-0.000001252],[0.000009509,-0.000001261],[0.000009456,-0.000001262],[0.000009404,-0.000001256],[0.000009353,-0.000001244],[0.000009303,-0.000001230],[0.000009255,-0.000001216],[0.000009206,-0.000001203],[0.000009158,-0.000001190],[0.000009110,-0.000001178],[0.000009060,-0.000001168],[0.000009011,-0.000001157],[0.000008960,-0.000001148],[0.000008909,-0.000001139],[0.000008858,-0.000001131],[0.000008807,-0.000001123],[0.000008755,-0.000001115],[0.000008704,-0.000001107],[0.000008652,-0.000001100],[0.000008600,-0.000001093],[0.000008548,-0.000001086],[0.000008496,-0.000001079],[0.000008445,-0.000001072],[0.000008393,-0.000001065],[0.000008341,-0.000001059],[0.000008289,-0.000001052],[0.000008237,-0.000001046],[0.000008185,-0.000001039],[0.000008134,-0.000001033],[0.000008082,-0.000001026],[0.000018143,-0.000001780],[0.000018065,-0.000001759],[0.000017988,-0.000001739],[0.000017910,-0.000001718],[0.000017831,-0.000001698],[0.000017751,-0.000001679],[0.000017671,-0.000001660],[0.000017589,-0.000001642],[0.000017506,-0.000001624],[0.000017422,-0.000001608],[0.000017336,-0.000001593],[0.000017250,-0.000001579],[0.000017162,-0.000001566],[0.000017074,-0.000001555],[0.000016984,-0.000001545],[0.000016895,-0.000001536],[0.000016807,-0.000001528],[0.000016719,-0.000001521],[0.000016632,-0.000001515],[0.000016546,-0.000001510],[0.000016462,-0.000001507],[0.000016379,-0.000001505],[0.000016297,-0.000001504],[0.000016216,-0.000001504],[0.000016136,-0.000001506],[0.000016058,-0.000001509],[0.000015982,-0.000001513],[0.000015909,-0.000001518],[0.000015838,-0.000001523],[0.000015771,-0.000001529],[0.000015708,-0.000001535],[0.000015647,-0.000001540],[0.000015589,-0.000001545],[0.000015533,-0.000001547],[0.000015476,-0.000001548],[0.000015418,-0.000001546],[0.000015357,-0.000001543],[0.000015293,-0.000001537],[0.000015229,-0.000001530],[0.000015166,-0.000001521],[0.000015110,-0.000001514],[0.000015053,-0.000001505],[0.000014985,-0.000001492],[0.000014916,-0.000001481],[0.000014848,-0.000001473],[0.000014780,-0.000001465],[0.000014710,-0.000001455],[0.000014639,-0.000001447],[0.000014568,-0.000001442],[0.000014496,-0.000001438],[0.000014426,-0.000001436],[0.000014364,-0.000001437],[0.000014324,-0.000001442],[0.000014287,-0.000001449],[0.000014246,-0.000001454],[0.000014197,-0.000001455],[0.000014133,-0.000001445],[0.000014061,-0.000001425],[0.000013990,-0.000001402],[0.000013923,-0.000001386],[0.000013854,-0.000001375],[0.000013777,-0.000001361],[0.000013694,-0.000001343],[0.000013623,-0.000001334],[0.000013557,-0.000001327],[0.000013486,-0.000001317],[0.000013408,-0.000001301],[0.000013323,-0.000001284],[0.000013237,-0.000001270],[0.000013153,-0.000001258],[0.000013071,-0.000001249],[0.000012987,-0.000001239],[0.000012899,-0.000001223],[0.000012809,-0.000001201],[0.000012731,-0.000001191],[0.000012654,-0.000001186],[0.000012573,-0.000001182],[0.000012488,-0.000001179],[0.000012401,-0.000001174],[0.000012315,-0.000001167],[0.000012231,-0.000001160],[0.000012152,-0.000001154],[0.000012071,-0.000001149],[0.000011987,-0.000001148],[0.000011902,-0.000001150],[0.000011817,-0.000001156],[0.000011738,-0.000001164],[0.000011673,-0.000001172],[0.000011608,-0.000001179],[0.000011541,-0.000001186],[0.000011472,-0.000001196],[0.000011408,-0.000001208],[0.000011350,-0.000001221],[0.000011296,-0.000001232],[0.000011243,-0.000001241],[0.000011187,-0.000001250],[0.000011125,-0.000001258],[0.000011052,-0.000001260],[0.000010977,-0.000001260],[0.000010905,-0.000001265],[0.000010836,-0.000001275],[0.000010768,-0.000001288],[0.000010702,-0.000001303],[0.000010635,-0.000001317],[0.000010569,-0.000001330],[0.000010502,-0.000001340],[0.000010438,-0.000001347],[0.000010381,-0.000001352],[0.000010328,-0.000001357],[0.000010274,-0.000001363],[0.000010217,-0.000001372],[0.000010164,-0.000001379],[0.000010118,-0.000001383],[0.000010077,-0.000001385],[0.000010017,-0.000001391],[0.000009971,-0.000001396],[0.000009930,-0.000001399],[0.000009887,-0.000001400],[0.000009846,-0.000001402],[0.000009808,-0.000001409],[0.000009774,-0.000001423],[0.000009744,-0.000001424],[0.000009722,-0.000001385],[0.000009697,-0.000001337],[0.000009664,-0.000001297],[0.000009621,-0.000001279],[0.000009571,-0.000001277],[0.000009519,-0.000001280],[0.000009467,-0.000001281],[0.000009415,-0.000001277],[0.000009365,-0.000001268],[0.000009316,-0.000001257],[0.000009268,-0.000001244],[0.000009220,-0.000001232],[0.000009172,-0.000001220],[0.000009123,-0.000001208],[0.000009075,-0.000001198],[0.000009026,-0.000001188],[0.000008977,-0.000001179],[0.000008927,-0.000001170],[0.000008877,-0.000001162],[0.000008826,-0.000001154],[0.000008776,-0.000001147],[0.000008725,-0.000001140],[0.000008674,-0.000001133],[0.000008624,-0.000001126],[0.000008573,-0.000001119],[0.000008522,-0.000001112],[0.000008471,-0.000001106],[0.000008420,-0.000001100],[0.000008370,-0.000001093],[0.000008319,-0.000001087],[0.000008268,-0.000001081],[0.000008217,-0.000001075],[0.000008166,-0.000001069],[0.000008115,-0.000001063],[0.000018201,-0.000001785],[0.000018121,-0.000001766],[0.000018041,-0.000001746],[0.000017960,-0.000001727],[0.000017879,-0.000001709],[0.000017797,-0.000001691],[0.000017714,-0.000001673],[0.000017630,-0.000001656],[0.000017546,-0.000001640],[0.000017460,-0.000001625],[0.000017374,-0.000001611],[0.000017286,-0.000001598],[0.000017198,-0.000001586],[0.000017109,-0.000001575],[0.000017020,-0.000001565],[0.000016931,-0.000001556],[0.000016842,-0.000001549],[0.000016754,-0.000001542],[0.000016666,-0.000001536],[0.000016580,-0.000001532],[0.000016495,-0.000001529],[0.000016411,-0.000001527],[0.000016328,-0.000001527],[0.000016247,-0.000001528],[0.000016167,-0.000001529],[0.000016089,-0.000001532],[0.000016013,-0.000001536],[0.000015941,-0.000001541],[0.000015872,-0.000001546],[0.000015805,-0.000001551],[0.000015742,-0.000001556],[0.000015681,-0.000001561],[0.000015622,-0.000001565],[0.000015563,-0.000001567],[0.000015504,-0.000001568],[0.000015443,-0.000001567],[0.000015380,-0.000001564],[0.000015315,-0.000001558],[0.000015249,-0.000001549],[0.000015184,-0.000001538],[0.000015127,-0.000001533],[0.000015068,-0.000001526],[0.000015002,-0.000001513],[0.000014933,-0.000001500],[0.000014864,-0.000001489],[0.000014796,-0.000001479],[0.000014726,-0.000001469],[0.000014656,-0.000001461],[0.000014585,-0.000001456],[0.000014515,-0.000001452],[0.000014449,-0.000001451],[0.000014394,-0.000001452],[0.000014353,-0.000001457],[0.000014317,-0.000001463],[0.000014281,-0.000001468],[0.000014238,-0.000001467],[0.000014179,-0.000001456],[0.000014107,-0.000001436],[0.000014030,-0.000001413],[0.000013954,-0.000001397],[0.000013878,-0.000001387],[0.000013799,-0.000001375],[0.000013724,-0.000001361],[0.000013659,-0.000001351],[0.000013599,-0.000001343],[0.000013532,-0.000001332],[0.000013447,-0.000001308],[0.000013357,-0.000001283],[0.000013269,-0.000001264],[0.000013184,-0.000001251],[0.000013103,-0.000001241],[0.000013023,-0.000001231],[0.000012940,-0.000001218],[0.000012851,-0.000001203],[0.000012768,-0.000001195],[0.000012686,-0.000001189],[0.000012602,-0.000001182],[0.000012514,-0.000001176],[0.000012423,-0.000001171],[0.000012337,-0.000001166],[0.000012254,-0.000001160],[0.000012171,-0.000001155],[0.000012087,-0.000001151],[0.000012001,-0.000001149],[0.000011914,-0.000001150],[0.000011826,-0.000001156],[0.000011742,-0.000001164],[0.000011680,-0.000001171],[0.000011617,-0.000001175],[0.000011550,-0.000001180],[0.000011484,-0.000001186],[0.000011412,-0.000001197],[0.000011345,-0.000001207],[0.000011284,-0.000001218],[0.000011223,-0.000001230],[0.000011161,-0.000001241],[0.000011093,-0.000001249],[0.000011023,-0.000001253],[0.000010952,-0.000001256],[0.000010881,-0.000001262],[0.000010815,-0.000001273],[0.000010750,-0.000001288],[0.000010685,-0.000001304],[0.000010619,-0.000001318],[0.000010551,-0.000001329],[0.000010482,-0.000001339],[0.000010415,-0.000001346],[0.000010359,-0.000001351],[0.000010310,-0.000001356],[0.000010263,-0.000001364],[0.000010200,-0.000001378],[0.000010132,-0.000001391],[0.000010072,-0.000001398],[0.000010024,-0.000001403],[0.000009979,-0.000001409],[0.000009937,-0.000001416],[0.000009898,-0.000001421],[0.000009858,-0.000001423],[0.000009817,-0.000001424],[0.000009780,-0.000001431],[0.000009746,-0.000001451],[0.000009709,-0.000001472],[0.000009692,-0.000001436],[0.000009674,-0.000001389],[0.000009648,-0.000001350],[0.000009612,-0.000001324],[0.000009569,-0.000001311],[0.000009521,-0.000001306],[0.000009472,-0.000001302],[0.000009423,-0.000001298],[0.000009374,-0.000001291],[0.000009326,-0.000001282],[0.000009278,-0.000001271],[0.000009230,-0.000001260],[0.000009183,-0.000001249],[0.000009135,-0.000001238],[0.000009088,-0.000001228],[0.000009040,-0.000001218],[0.000008992,-0.000001209],[0.000008943,-0.000001201],[0.000008894,-0.000001193],[0.000008845,-0.000001186],[0.000008795,-0.000001179],[0.000008746,-0.000001172],[0.000008696,-0.000001165],[0.000008647,-0.000001159],[0.000008597,-0.000001152],[0.000008547,-0.000001146],[0.000008498,-0.000001140],[0.000008448,-0.000001134],[0.000008398,-0.000001128],[0.000008348,-0.000001122],[0.000008299,-0.000001117],[0.000008249,-0.000001111],[0.000008199,-0.000001105],[0.000008149,-0.000001099],[0.000018258,-0.000001790],[0.000018175,-0.000001772],[0.000018092,-0.000001754],[0.000018009,-0.000001736],[0.000017925,-0.000001719],[0.000017841,-0.000001702],[0.000017757,-0.000001686],[0.000017671,-0.000001670],[0.000017586,-0.000001655],[0.000017499,-0.000001641],[0.000017411,-0.000001628],[0.000017323,-0.000001616],[0.000017234,-0.000001605],[0.000017145,-0.000001595],[0.000017056,-0.000001585],[0.000016967,-0.000001577],[0.000016878,-0.000001569],[0.000016789,-0.000001563],[0.000016702,-0.000001558],[0.000016615,-0.000001554],[0.000016529,-0.000001551],[0.000016445,-0.000001550],[0.000016361,-0.000001550],[0.000016280,-0.000001551],[0.000016200,-0.000001553],[0.000016123,-0.000001556],[0.000016048,-0.000001559],[0.000015976,-0.000001564],[0.000015907,-0.000001568],[0.000015841,-0.000001573],[0.000015777,-0.000001577],[0.000015715,-0.000001581],[0.000015655,-0.000001584],[0.000015595,-0.000001587],[0.000015534,-0.000001588],[0.000015472,-0.000001588],[0.000015408,-0.000001586],[0.000015343,-0.000001581],[0.000015275,-0.000001573],[0.000015209,-0.000001563],[0.000015145,-0.000001555],[0.000015081,-0.000001545],[0.000015016,-0.000001534],[0.000014949,-0.000001520],[0.000014881,-0.000001507],[0.000014813,-0.000001496],[0.000014745,-0.000001486],[0.000014676,-0.000001478],[0.000014608,-0.000001472],[0.000014542,-0.000001468],[0.000014482,-0.000001467],[0.000014431,-0.000001468],[0.000014388,-0.000001471],[0.000014350,-0.000001474],[0.000014313,-0.000001475],[0.000014269,-0.000001472],[0.000014215,-0.000001461],[0.000014151,-0.000001445],[0.000014078,-0.000001427],[0.000013998,-0.000001409],[0.000013915,-0.000001396],[0.000013833,-0.000001388],[0.000013760,-0.000001375],[0.000013698,-0.000001360],[0.000013637,-0.000001347],[0.000013570,-0.000001333],[0.000013480,-0.000001304],[0.000013386,-0.000001275],[0.000013297,-0.000001255],[0.000013215,-0.000001243],[0.000013137,-0.000001233],[0.000013061,-0.000001224],[0.000012987,-0.000001216],[0.000012902,-0.000001209],[0.000012810,-0.000001204],[0.000012723,-0.000001193],[0.000012639,-0.000001177],[0.000012551,-0.000001164],[0.000012456,-0.000001159],[0.000012364,-0.000001157],[0.000012276,-0.000001156],[0.000012188,-0.000001154],[0.000012100,-0.000001150],[0.000012014,-0.000001146],[0.000011930,-0.000001146],[0.000011848,-0.000001149],[0.000011772,-0.000001156],[0.000011703,-0.000001161],[0.000011631,-0.000001164],[0.000011558,-0.000001170],[0.000011483,-0.000001178],[0.000011410,-0.000001183],[0.000011338,-0.000001189],[0.000011270,-0.000001198],[0.000011204,-0.000001212],[0.000011137,-0.000001225],[0.000011066,-0.000001235],[0.000010995,-0.000001241],[0.000010923,-0.000001246],[0.000010853,-0.000001255],[0.000010788,-0.000001269],[0.000010725,-0.000001285],[0.000010662,-0.000001303],[0.000010597,-0.000001316],[0.000010528,-0.000001322],[0.000010462,-0.000001332],[0.000010398,-0.000001343],[0.000010337,-0.000001352],[0.000010280,-0.000001359],[0.000010229,-0.000001367],[0.000010163,-0.000001385],[0.000010088,-0.000001406],[0.000010021,-0.000001416],[0.000009971,-0.000001420],[0.000009935,-0.000001427],[0.000009900,-0.000001434],[0.000009864,-0.000001440],[0.000009826,-0.000001443],[0.000009789,-0.000001445],[0.000009754,-0.000001449],[0.000009724,-0.000001461],[0.000009692,-0.000001475],[0.000009669,-0.000001461],[0.000009649,-0.000001430],[0.000009626,-0.000001396],[0.000009595,-0.000001368],[0.000009559,-0.000001349],[0.000009517,-0.000001336],[0.000009472,-0.000001328],[0.000009425,-0.000001322],[0.000009379,-0.000001315],[0.000009332,-0.000001307],[0.000009285,-0.000001297],[0.000009239,-0.000001288],[0.000009192,-0.000001277],[0.000009145,-0.000001267],[0.000009099,-0.000001258],[0.000009052,-0.000001249],[0.000009005,-0.000001240],[0.000008957,-0.000001232],[0.000008910,-0.000001225],[0.000008862,-0.000001218],[0.000008814,-0.000001211],[0.000008766,-0.000001204],[0.000008717,-0.000001198],[0.000008669,-0.000001192],[0.000008621,-0.000001186],[0.000008572,-0.000001180],[0.000008524,-0.000001175],[0.000008475,-0.000001169],[0.000008427,-0.000001163],[0.000008378,-0.000001158],[0.000008330,-0.000001153],[0.000008281,-0.000001147],[0.000008233,-0.000001142],[0.000008184,-0.000001136],[0.000018312,-0.000001794],[0.000018227,-0.000001778],[0.000018142,-0.000001761],[0.000018057,-0.000001745],[0.000017971,-0.000001729],[0.000017885,-0.000001714],[0.000017799,-0.000001699],[0.000017712,-0.000001684],[0.000017625,-0.000001671],[0.000017537,-0.000001658],[0.000017449,-0.000001645],[0.000017360,-0.000001634],[0.000017271,-0.000001624],[0.000017181,-0.000001614],[0.000017092,-0.000001605],[0.000017003,-0.000001597],[0.000016914,-0.000001590],[0.000016826,-0.000001584],[0.000016738,-0.000001579],[0.000016651,-0.000001576],[0.000016565,-0.000001574],[0.000016480,-0.000001572],[0.000016397,-0.000001572],[0.000016315,-0.000001574],[0.000016236,-0.000001576],[0.000016159,-0.000001578],[0.000016084,-0.000001582],[0.000016012,-0.000001586],[0.000015943,-0.000001590],[0.000015877,-0.000001593],[0.000015813,-0.000001597],[0.000015750,-0.000001601],[0.000015688,-0.000001604],[0.000015626,-0.000001606],[0.000015565,-0.000001607],[0.000015503,-0.000001607],[0.000015439,-0.000001606],[0.000015373,-0.000001603],[0.000015304,-0.000001597],[0.000015234,-0.000001587],[0.000015165,-0.000001577],[0.000015097,-0.000001566],[0.000015031,-0.000001553],[0.000014966,-0.000001540],[0.000014900,-0.000001527],[0.000014833,-0.000001514],[0.000014766,-0.000001504],[0.000014700,-0.000001496],[0.000014636,-0.000001489],[0.000014575,-0.000001485],[0.000014519,-0.000001483],[0.000014469,-0.000001483],[0.000014425,-0.000001483],[0.000014384,-0.000001483],[0.000014343,-0.000001480],[0.000014299,-0.000001474],[0.000014248,-0.000001464],[0.000014189,-0.000001450],[0.000014122,-0.000001434],[0.000014046,-0.000001414],[0.000013965,-0.000001398],[0.000013881,-0.000001386],[0.000013806,-0.000001373],[0.000013737,-0.000001356],[0.000013670,-0.000001338],[0.000013595,-0.000001319],[0.000013507,-0.000001292],[0.000013412,-0.000001264],[0.000013325,-0.000001247],[0.000013246,-0.000001237],[0.000013170,-0.000001228],[0.000013096,-0.000001219],[0.000013021,-0.000001213],[0.000012938,-0.000001211],[0.000012847,-0.000001209],[0.000012759,-0.000001194],[0.000012678,-0.000001168],[0.000012593,-0.000001146],[0.000012495,-0.000001138],[0.000012390,-0.000001142],[0.000012291,-0.000001146],[0.000012198,-0.000001147],[0.000012109,-0.000001144],[0.000012027,-0.000001140],[0.000011949,-0.000001137],[0.000011874,-0.000001137],[0.000011801,-0.000001139],[0.000011727,-0.000001141],[0.000011646,-0.000001144],[0.000011565,-0.000001150],[0.000011485,-0.000001157],[0.000011407,-0.000001164],[0.000011331,-0.000001170],[0.000011257,-0.000001177],[0.000011188,-0.000001192],[0.000011119,-0.000001206],[0.000011048,-0.000001218],[0.000010974,-0.000001226],[0.000010897,-0.000001234],[0.000010825,-0.000001245],[0.000010759,-0.000001262],[0.000010695,-0.000001279],[0.000010631,-0.000001295],[0.000010566,-0.000001305],[0.000010498,-0.000001309],[0.000010435,-0.000001322],[0.000010376,-0.000001340],[0.000010308,-0.000001355],[0.000010233,-0.000001365],[0.000010158,-0.000001378],[0.000010103,-0.000001395],[0.000010042,-0.000001414],[0.000009982,-0.000001427],[0.000009933,-0.000001435],[0.000009895,-0.000001442],[0.000009862,-0.000001449],[0.000009828,-0.000001455],[0.000009795,-0.000001459],[0.000009761,-0.000001463],[0.000009729,-0.000001468],[0.000009701,-0.000001474],[0.000009673,-0.000001479],[0.000009648,-0.000001473],[0.000009626,-0.000001456],[0.000009603,-0.000001432],[0.000009575,-0.000001407],[0.000009543,-0.000001386],[0.000009506,-0.000001369],[0.000009466,-0.000001357],[0.000009423,-0.000001348],[0.000009379,-0.000001340],[0.000009335,-0.000001332],[0.000009290,-0.000001323],[0.000009244,-0.000001315],[0.000009199,-0.000001306],[0.000009154,-0.000001296],[0.000009108,-0.000001288],[0.000009062,-0.000001279],[0.000009017,-0.000001271],[0.000008971,-0.000001263],[0.000008924,-0.000001256],[0.000008878,-0.000001250],[0.000008831,-0.000001243],[0.000008784,-0.000001237],[0.000008738,-0.000001231],[0.000008691,-0.000001225],[0.000008644,-0.000001220],[0.000008596,-0.000001214],[0.000008549,-0.000001209],[0.000008502,-0.000001204],[0.000008455,-0.000001199],[0.000008408,-0.000001194],[0.000008361,-0.000001189],[0.000008314,-0.000001184],[0.000008266,-0.000001179],[0.000008219,-0.000001174],[0.000018364,-0.000001799],[0.000018277,-0.000001784],[0.000018190,-0.000001769],[0.000018103,-0.000001754],[0.000018016,-0.000001739],[0.000017928,-0.000001725],[0.000017841,-0.000001712],[0.000017753,-0.000001698],[0.000017664,-0.000001686],[0.000017576,-0.000001674],[0.000017487,-0.000001662],[0.000017397,-0.000001652],[0.000017308,-0.000001642],[0.000017218,-0.000001633],[0.000017129,-0.000001625],[0.000017040,-0.000001617],[0.000016951,-0.000001611],[0.000016862,-0.000001605],[0.000016775,-0.000001601],[0.000016688,-0.000001598],[0.000016602,-0.000001596],[0.000016517,-0.000001595],[0.000016434,-0.000001595],[0.000016353,-0.000001596],[0.000016273,-0.000001598],[0.000016197,-0.000001601],[0.000016122,-0.000001604],[0.000016051,-0.000001607],[0.000015981,-0.000001610],[0.000015914,-0.000001614],[0.000015849,-0.000001617],[0.000015784,-0.000001620],[0.000015721,-0.000001622],[0.000015658,-0.000001624],[0.000015596,-0.000001625],[0.000015533,-0.000001625],[0.000015470,-0.000001624],[0.000015403,-0.000001622],[0.000015332,-0.000001617],[0.000015260,-0.000001608],[0.000015188,-0.000001597],[0.000015118,-0.000001585],[0.000015051,-0.000001572],[0.000014986,-0.000001559],[0.000014921,-0.000001546],[0.000014856,-0.000001533],[0.000014791,-0.000001523],[0.000014728,-0.000001514],[0.000014667,-0.000001507],[0.000014609,-0.000001502],[0.000014556,-0.000001499],[0.000014507,-0.000001496],[0.000014461,-0.000001494],[0.000014417,-0.000001490],[0.000014373,-0.000001484],[0.000014327,-0.000001476],[0.000014277,-0.000001465],[0.000014222,-0.000001451],[0.000014160,-0.000001433],[0.000014091,-0.000001412],[0.000014017,-0.000001391],[0.000013934,-0.000001377],[0.000013853,-0.000001362],[0.000013777,-0.000001343],[0.000013702,-0.000001323],[0.000013626,-0.000001306],[0.000013541,-0.000001287],[0.000013448,-0.000001264],[0.000013358,-0.000001248],[0.000013278,-0.000001237],[0.000013202,-0.000001226],[0.000013127,-0.000001216],[0.000013052,-0.000001209],[0.000012973,-0.000001203],[0.000012886,-0.000001196],[0.000012796,-0.000001181],[0.000012710,-0.000001157],[0.000012624,-0.000001130],[0.000012522,-0.000001119],[0.000012407,-0.000001124],[0.000012297,-0.000001132],[0.000012200,-0.000001136],[0.000012115,-0.000001135],[0.000012040,-0.000001130],[0.000011968,-0.000001125],[0.000011898,-0.000001121],[0.000011821,-0.000001119],[0.000011742,-0.000001116],[0.000011655,-0.000001118],[0.000011568,-0.000001124],[0.000011486,-0.000001133],[0.000011406,-0.000001143],[0.000011328,-0.000001153],[0.000011251,-0.000001163],[0.000011179,-0.000001174],[0.000011108,-0.000001186],[0.000011035,-0.000001199],[0.000010960,-0.000001212],[0.000010881,-0.000001224],[0.000010803,-0.000001237],[0.000010730,-0.000001253],[0.000010661,-0.000001269],[0.000010594,-0.000001283],[0.000010528,-0.000001292],[0.000010461,-0.000001297],[0.000010399,-0.000001313],[0.000010336,-0.000001334],[0.000010266,-0.000001353],[0.000010190,-0.000001370],[0.000010116,-0.000001386],[0.000010055,-0.000001403],[0.000009999,-0.000001419],[0.000009947,-0.000001434],[0.000009901,-0.000001445],[0.000009861,-0.000001454],[0.000009827,-0.000001461],[0.000009795,-0.000001468],[0.000009764,-0.000001474],[0.000009733,-0.000001479],[0.000009705,-0.000001483],[0.000009677,-0.000001486],[0.000009652,-0.000001487],[0.000009627,-0.000001483],[0.000009604,-0.000001474],[0.000009580,-0.000001458],[0.000009554,-0.000001438],[0.000009525,-0.000001418],[0.000009492,-0.000001401],[0.000009456,-0.000001387],[0.000009417,-0.000001375],[0.000009376,-0.000001366],[0.000009334,-0.000001358],[0.000009291,-0.000001349],[0.000009248,-0.000001341],[0.000009204,-0.000001333],[0.000009160,-0.000001325],[0.000009116,-0.000001317],[0.000009071,-0.000001309],[0.000009027,-0.000001302],[0.000008982,-0.000001294],[0.000008938,-0.000001288],[0.000008893,-0.000001281],[0.000008848,-0.000001275],[0.000008802,-0.000001270],[0.000008757,-0.000001264],[0.000008711,-0.000001259],[0.000008666,-0.000001254],[0.000008620,-0.000001249],[0.000008575,-0.000001244],[0.000008529,-0.000001239],[0.000008483,-0.000001234],[0.000008438,-0.000001230],[0.000008392,-0.000001225],[0.000008346,-0.000001221],[0.000008300,-0.000001216],[0.000008255,-0.000001211],[0.000018414,-0.000001803],[0.000018326,-0.000001790],[0.000018237,-0.000001776],[0.000018149,-0.000001763],[0.000018060,-0.000001749],[0.000017971,-0.000001737],[0.000017882,-0.000001724],[0.000017793,-0.000001712],[0.000017704,-0.000001700],[0.000017614,-0.000001690],[0.000017525,-0.000001679],[0.000017435,-0.000001669],[0.000017345,-0.000001660],[0.000017256,-0.000001652],[0.000017166,-0.000001644],[0.000017077,-0.000001637],[0.000016988,-0.000001632],[0.000016900,-0.000001627],[0.000016812,-0.000001623],[0.000016726,-0.000001620],[0.000016640,-0.000001618],[0.000016555,-0.000001617],[0.000016472,-0.000001617],[0.000016392,-0.000001618],[0.000016313,-0.000001620],[0.000016236,-0.000001622],[0.000016162,-0.000001624],[0.000016089,-0.000001627],[0.000016020,-0.000001630],[0.000015951,-0.000001633],[0.000015885,-0.000001636],[0.000015819,-0.000001638],[0.000015755,-0.000001640],[0.000015691,-0.000001642],[0.000015627,-0.000001642],[0.000015563,-0.000001642],[0.000015498,-0.000001641],[0.000015430,-0.000001638],[0.000015359,-0.000001633],[0.000015287,-0.000001625],[0.000015215,-0.000001615],[0.000015144,-0.000001603],[0.000015076,-0.000001590],[0.000015010,-0.000001577],[0.000014945,-0.000001565],[0.000014882,-0.000001553],[0.000014819,-0.000001542],[0.000014758,-0.000001533],[0.000014700,-0.000001525],[0.000014645,-0.000001518],[0.000014593,-0.000001513],[0.000014544,-0.000001508],[0.000014496,-0.000001503],[0.000014450,-0.000001496],[0.000014403,-0.000001488],[0.000014356,-0.000001478],[0.000014305,-0.000001465],[0.000014251,-0.000001449],[0.000014192,-0.000001430],[0.000014127,-0.000001409],[0.000014057,-0.000001387],[0.000013977,-0.000001370],[0.000013895,-0.000001352],[0.000013815,-0.000001333],[0.000013738,-0.000001314],[0.000013663,-0.000001301],[0.000013581,-0.000001288],[0.000013490,-0.000001274],[0.000013394,-0.000001255],[0.000013312,-0.000001241],[0.000013234,-0.000001228],[0.000013159,-0.000001217],[0.000013084,-0.000001206],[0.000013006,-0.000001192],[0.000012922,-0.000001173],[0.000012822,-0.000001164],[0.000012723,-0.000001151],[0.000012628,-0.000001131],[0.000012530,-0.000001110],[0.000012420,-0.000001104],[0.000012302,-0.000001116],[0.000012203,-0.000001126],[0.000012124,-0.000001124],[0.000012053,-0.000001116],[0.000011984,-0.000001110],[0.000011912,-0.000001105],[0.000011830,-0.000001102],[0.000011745,-0.000001097],[0.000011656,-0.000001094],[0.000011569,-0.000001098],[0.000011487,-0.000001109],[0.000011408,-0.000001122],[0.000011330,-0.000001135],[0.000011252,-0.000001148],[0.000011176,-0.000001157],[0.000011100,-0.000001166],[0.000011024,-0.000001178],[0.000010947,-0.000001197],[0.000010864,-0.000001212],[0.000010780,-0.000001226],[0.000010700,-0.000001242],[0.000010626,-0.000001258],[0.000010556,-0.000001273],[0.000010487,-0.000001284],[0.000010421,-0.000001295],[0.000010357,-0.000001311],[0.000010291,-0.000001331],[0.000010221,-0.000001352],[0.000010150,-0.000001371],[0.000010080,-0.000001390],[0.000010018,-0.000001407],[0.000009964,-0.000001423],[0.000009915,-0.000001438],[0.000009871,-0.000001451],[0.000009831,-0.000001462],[0.000009796,-0.000001471],[0.000009764,-0.000001478],[0.000009735,-0.000001485],[0.000009706,-0.000001490],[0.000009680,-0.000001494],[0.000009654,-0.000001496],[0.000009629,-0.000001496],[0.000009606,-0.000001494],[0.000009582,-0.000001487],[0.000009557,-0.000001477],[0.000009532,-0.000001463],[0.000009505,-0.000001446],[0.000009475,-0.000001430],[0.000009443,-0.000001416],[0.000009407,-0.000001403],[0.000009369,-0.000001393],[0.000009330,-0.000001384],[0.000009289,-0.000001376],[0.000009248,-0.000001368],[0.000009206,-0.000001361],[0.000009164,-0.000001353],[0.000009122,-0.000001346],[0.000009079,-0.000001339],[0.000009036,-0.000001332],[0.000008993,-0.000001325],[0.000008950,-0.000001319],[0.000008906,-0.000001313],[0.000008863,-0.000001308],[0.000008819,-0.000001302],[0.000008776,-0.000001297],[0.000008732,-0.000001292],[0.000008688,-0.000001288],[0.000008644,-0.000001283],[0.000008600,-0.000001279],[0.000008556,-0.000001274],[0.000008511,-0.000001270],[0.000008467,-0.000001266],[0.000008423,-0.000001262],[0.000008379,-0.000001258],[0.000008335,-0.000001254],[0.000008291,-0.000001249],[0.000018462,-0.000001808],[0.000018373,-0.000001796],[0.000018283,-0.000001784],[0.000018193,-0.000001771],[0.000018103,-0.000001759],[0.000018013,-0.000001748],[0.000017924,-0.000001736],[0.000017834,-0.000001725],[0.000017744,-0.000001715],[0.000017654,-0.000001705],[0.000017563,-0.000001695],[0.000017473,-0.000001686],[0.000017383,-0.000001678],[0.000017294,-0.000001670],[0.000017204,-0.000001663],[0.000017115,-0.000001657],[0.000017026,-0.000001652],[0.000016938,-0.000001647],[0.000016851,-0.000001644],[0.000016764,-0.000001641],[0.000016679,-0.000001640],[0.000016595,-0.000001639],[0.000016512,-0.000001639],[0.000016432,-0.000001640],[0.000016353,-0.000001641],[0.000016276,-0.000001643],[0.000016202,-0.000001645],[0.000016129,-0.000001647],[0.000016058,-0.000001649],[0.000015989,-0.000001652],[0.000015921,-0.000001654],[0.000015855,-0.000001656],[0.000015789,-0.000001658],[0.000015723,-0.000001659],[0.000015658,-0.000001659],[0.000015592,-0.000001658],[0.000015525,-0.000001656],[0.000015457,-0.000001653],[0.000015386,-0.000001648],[0.000015314,-0.000001640],[0.000015243,-0.000001631],[0.000015172,-0.000001619],[0.000015104,-0.000001607],[0.000015038,-0.000001595],[0.000014973,-0.000001583],[0.000014911,-0.000001571],[0.000014850,-0.000001560],[0.000014791,-0.000001550],[0.000014734,-0.000001541],[0.000014680,-0.000001533],[0.000014629,-0.000001526],[0.000014579,-0.000001519],[0.000014530,-0.000001511],[0.000014481,-0.000001502],[0.000014433,-0.000001491],[0.000014383,-0.000001479],[0.000014332,-0.000001464],[0.000014277,-0.000001448],[0.000014219,-0.000001428],[0.000014155,-0.000001407],[0.000014086,-0.000001386],[0.000014010,-0.000001366],[0.000013930,-0.000001347],[0.000013850,-0.000001329],[0.000013773,-0.000001314],[0.000013699,-0.000001302],[0.000013617,-0.000001292],[0.000013528,-0.000001282],[0.000013440,-0.000001269],[0.000013346,-0.000001244],[0.000013261,-0.000001225],[0.000013184,-0.000001212],[0.000013109,-0.000001200],[0.000013029,-0.000001183],[0.000012938,-0.000001160],[0.000012831,-0.000001153],[0.000012723,-0.000001149],[0.000012622,-0.000001138],[0.000012541,-0.000001096],[0.000012445,-0.000001074],[0.000012321,-0.000001097],[0.000012219,-0.000001117],[0.000012139,-0.000001113],[0.000012068,-0.000001100],[0.000011997,-0.000001094],[0.000011922,-0.000001092],[0.000011841,-0.000001089],[0.000011753,-0.000001083],[0.000011660,-0.000001076],[0.000011572,-0.000001077],[0.000011491,-0.000001088],[0.000011413,-0.000001102],[0.000011335,-0.000001116],[0.000011257,-0.000001129],[0.000011177,-0.000001138],[0.000011094,-0.000001145],[0.000011009,-0.000001154],[0.000010925,-0.000001177],[0.000010838,-0.000001195],[0.000010752,-0.000001211],[0.000010669,-0.000001230],[0.000010591,-0.000001248],[0.000010517,-0.000001265],[0.000010447,-0.000001280],[0.000010380,-0.000001296],[0.000010314,-0.000001312],[0.000010248,-0.000001330],[0.000010180,-0.000001350],[0.000010113,-0.000001371],[0.000010048,-0.000001390],[0.000009988,-0.000001408],[0.000009934,-0.000001425],[0.000009886,-0.000001440],[0.000009843,-0.000001454],[0.000009804,-0.000001466],[0.000009768,-0.000001477],[0.000009737,-0.000001486],[0.000009707,-0.000001493],[0.000009680,-0.000001499],[0.000009655,-0.000001503],[0.000009630,-0.000001505],[0.000009606,-0.000001505],[0.000009582,-0.000001503],[0.000009559,-0.000001499],[0.000009535,-0.000001492],[0.000009510,-0.000001482],[0.000009484,-0.000001470],[0.000009457,-0.000001456],[0.000009427,-0.000001443],[0.000009394,-0.000001431],[0.000009360,-0.000001420],[0.000009323,-0.000001411],[0.000009285,-0.000001402],[0.000009246,-0.000001395],[0.000009206,-0.000001388],[0.000009166,-0.000001381],[0.000009126,-0.000001375],[0.000009085,-0.000001368],[0.000009043,-0.000001362],[0.000009002,-0.000001356],[0.000008961,-0.000001350],[0.000008919,-0.000001345],[0.000008877,-0.000001340],[0.000008835,-0.000001335],[0.000008793,-0.000001330],[0.000008751,-0.000001326],[0.000008709,-0.000001322],[0.000008667,-0.000001318],[0.000008624,-0.000001314],[0.000008582,-0.000001310],[0.000008540,-0.000001306],[0.000008497,-0.000001302],[0.000008455,-0.000001299],[0.000008412,-0.000001295],[0.000008370,-0.000001291],[0.000008327,-0.000001288],[0.000018509,-0.000001813],[0.000018418,-0.000001802],[0.000018327,-0.000001791],[0.000018237,-0.000001780],[0.000018146,-0.000001769],[0.000018056,-0.000001759],[0.000017965,-0.000001749],[0.000017874,-0.000001739],[0.000017783,-0.000001729],[0.000017693,-0.000001720],[0.000017602,-0.000001711],[0.000017512,-0.000001703],[0.000017422,-0.000001695],[0.000017332,-0.000001689],[0.000017243,-0.000001682],[0.000017154,-0.000001676],[0.000017065,-0.000001672],[0.000016977,-0.000001668],[0.000016890,-0.000001665],[0.000016804,-0.000001662],[0.000016719,-0.000001661],[0.000016635,-0.000001660],[0.000016553,-0.000001660],[0.000016473,-0.000001660],[0.000016394,-0.000001661],[0.000016317,-0.000001663],[0.000016242,-0.000001664],[0.000016169,-0.000001666],[0.000016097,-0.000001668],[0.000016027,-0.000001670],[0.000015958,-0.000001672],[0.000015890,-0.000001673],[0.000015823,-0.000001674],[0.000015756,-0.000001674],[0.000015689,-0.000001674],[0.000015622,-0.000001673],[0.000015553,-0.000001671],[0.000015484,-0.000001667],[0.000015414,-0.000001661],[0.000015343,-0.000001654],[0.000015272,-0.000001645],[0.000015203,-0.000001635],[0.000015134,-0.000001623],[0.000015068,-0.000001611],[0.000015004,-0.000001599],[0.000014942,-0.000001588],[0.000014882,-0.000001577],[0.000014824,-0.000001566],[0.000014769,-0.000001557],[0.000014715,-0.000001547],[0.000014663,-0.000001538],[0.000014613,-0.000001528],[0.000014562,-0.000001518],[0.000014512,-0.000001507],[0.000014461,-0.000001494],[0.000014410,-0.000001480],[0.000014357,-0.000001464],[0.000014301,-0.000001447],[0.000014242,-0.000001428],[0.000014178,-0.000001407],[0.000014109,-0.000001387],[0.000014034,-0.000001366],[0.000013957,-0.000001347],[0.000013877,-0.000001330],[0.000013798,-0.000001316],[0.000013718,-0.000001304],[0.000013634,-0.000001292],[0.000013546,-0.000001279],[0.000013455,-0.000001260],[0.000013363,-0.000001235],[0.000013277,-0.000001212],[0.000013198,-0.000001195],[0.000013124,-0.000001183],[0.000013041,-0.000001172],[0.000012936,-0.000001149],[0.000012831,-0.000001142],[0.000012726,-0.000001142],[0.000012628,-0.000001132],[0.000012559,-0.000001081],[0.000012475,-0.000001051],[0.000012359,-0.000001078],[0.000012254,-0.000001105],[0.000012162,-0.000001103],[0.000012083,-0.000001090],[0.000012010,-0.000001081],[0.000011935,-0.000001078],[0.000011856,-0.000001078],[0.000011769,-0.000001074],[0.000011677,-0.000001067],[0.000011586,-0.000001066],[0.000011500,-0.000001072],[0.000011417,-0.000001082],[0.000011337,-0.000001095],[0.000011259,-0.000001108],[0.000011174,-0.000001118],[0.000011083,-0.000001126],[0.000010991,-0.000001140],[0.000010899,-0.000001161],[0.000010809,-0.000001179],[0.000010721,-0.000001197],[0.000010637,-0.000001217],[0.000010557,-0.000001237],[0.000010480,-0.000001258],[0.000010408,-0.000001277],[0.000010340,-0.000001294],[0.000010274,-0.000001311],[0.000010208,-0.000001329],[0.000010143,-0.000001348],[0.000010079,-0.000001368],[0.000010018,-0.000001388],[0.000009960,-0.000001407],[0.000009908,-0.000001424],[0.000009860,-0.000001440],[0.000009817,-0.000001455],[0.000009778,-0.000001468],[0.000009743,-0.000001480],[0.000009711,-0.000001490],[0.000009682,-0.000001498],[0.000009655,-0.000001505],[0.000009630,-0.000001509],[0.000009606,-0.000001512],[0.000009582,-0.000001513],[0.000009559,-0.000001512],[0.000009536,-0.000001510],[0.000009512,-0.000001505],[0.000009488,-0.000001498],[0.000009463,-0.000001489],[0.000009437,-0.000001478],[0.000009409,-0.000001467],[0.000009379,-0.000001456],[0.000009347,-0.000001446],[0.000009313,-0.000001437],[0.000009278,-0.000001429],[0.000009242,-0.000001422],[0.000009204,-0.000001415],[0.000009166,-0.000001409],[0.000009128,-0.000001403],[0.000009089,-0.000001397],[0.000009049,-0.000001392],[0.000009010,-0.000001386],[0.000008970,-0.000001381],[0.000008931,-0.000001377],[0.000008890,-0.000001372],[0.000008850,-0.000001368],[0.000008810,-0.000001364],[0.000008770,-0.000001360],[0.000008729,-0.000001356],[0.000008689,-0.000001352],[0.000008648,-0.000001349],[0.000008608,-0.000001345],[0.000008567,-0.000001342],[0.000008527,-0.000001339],[0.000008486,-0.000001336],[0.000008446,-0.000001332],[0.000008405,-0.000001329],[0.000008364,-0.000001326],[0.000018553,-0.000001819],[0.000018462,-0.000001808],[0.000018371,-0.000001798],[0.000018280,-0.000001789],[0.000018188,-0.000001779],[0.000018097,-0.000001770],[0.000018006,-0.000001760],[0.000017915,-0.000001752],[0.000017823,-0.000001743],[0.000017733,-0.000001735],[0.000017642,-0.000001727],[0.000017551,-0.000001719],[0.000017461,-0.000001713],[0.000017371,-0.000001706],[0.000017282,-0.000001701],[0.000017193,-0.000001696],[0.000017105,-0.000001691],[0.000017017,-0.000001688],[0.000016930,-0.000001685],[0.000016845,-0.000001682],[0.000016760,-0.000001681],[0.000016676,-0.000001680],[0.000016595,-0.000001680],[0.000016514,-0.000001680],[0.000016435,-0.000001681],[0.000016358,-0.000001682],[0.000016283,-0.000001683],[0.000016209,-0.000001685],[0.000016137,-0.000001686],[0.000016065,-0.000001687],[0.000015995,-0.000001688],[0.000015926,-0.000001689],[0.000015857,-0.000001690],[0.000015789,-0.000001689],[0.000015721,-0.000001689],[0.000015652,-0.000001687],[0.000015583,-0.000001684],[0.000015513,-0.000001680],[0.000015443,-0.000001674],[0.000015373,-0.000001667],[0.000015303,-0.000001658],[0.000015234,-0.000001648],[0.000015166,-0.000001638],[0.000015100,-0.000001627],[0.000015037,-0.000001615],[0.000014975,-0.000001604],[0.000014916,-0.000001592],[0.000014859,-0.000001581],[0.000014803,-0.000001570],[0.000014750,-0.000001560],[0.000014697,-0.000001549],[0.000014645,-0.000001537],[0.000014593,-0.000001525],[0.000014541,-0.000001512],[0.000014489,-0.000001498],[0.000014435,-0.000001482],[0.000014380,-0.000001466],[0.000014322,-0.000001447],[0.000014261,-0.000001428],[0.000014196,-0.000001408],[0.000014127,-0.000001388],[0.000014054,-0.000001369],[0.000013976,-0.000001350],[0.000013896,-0.000001334],[0.000013813,-0.000001319],[0.000013727,-0.000001304],[0.000013639,-0.000001289],[0.000013547,-0.000001271],[0.000013455,-0.000001247],[0.000013364,-0.000001217],[0.000013278,-0.000001186],[0.000013199,-0.000001158],[0.000013124,-0.000001144],[0.000013041,-0.000001136],[0.000012933,-0.000001130],[0.000012835,-0.000001130],[0.000012740,-0.000001128],[0.000012649,-0.000001114],[0.000012569,-0.000001085],[0.000012484,-0.000001068],[0.000012384,-0.000001075],[0.000012281,-0.000001087],[0.000012187,-0.000001087],[0.000012107,-0.000001078],[0.000012030,-0.000001068],[0.000011953,-0.000001062],[0.000011872,-0.000001062],[0.000011787,-0.000001062],[0.000011696,-0.000001058],[0.000011602,-0.000001056],[0.000011509,-0.000001057],[0.000011419,-0.000001062],[0.000011333,-0.000001070],[0.000011249,-0.000001081],[0.000011157,-0.000001093],[0.000011060,-0.000001105],[0.000010965,-0.000001121],[0.000010868,-0.000001141],[0.000010777,-0.000001161],[0.000010689,-0.000001182],[0.000010606,-0.000001203],[0.000010525,-0.000001225],[0.000010448,-0.000001248],[0.000010373,-0.000001270],[0.000010304,-0.000001289],[0.000010238,-0.000001307],[0.000010173,-0.000001326],[0.000010109,-0.000001345],[0.000010048,-0.000001365],[0.000009990,-0.000001384],[0.000009934,-0.000001404],[0.000009883,-0.000001422],[0.000009836,-0.000001439],[0.000009793,-0.000001454],[0.000009754,-0.000001468],[0.000009719,-0.000001481],[0.000009687,-0.000001492],[0.000009658,-0.000001501],[0.000009631,-0.000001508],[0.000009605,-0.000001514],[0.000009581,-0.000001518],[0.000009558,-0.000001520],[0.000009535,-0.000001520],[0.000009512,-0.000001519],[0.000009489,-0.000001516],[0.000009466,-0.000001512],[0.000009442,-0.000001506],[0.000009416,-0.000001498],[0.000009390,-0.000001489],[0.000009362,-0.000001480],[0.000009333,-0.000001471],[0.000009302,-0.000001462],[0.000009269,-0.000001455],[0.000009235,-0.000001448],[0.000009200,-0.000001442],[0.000009165,-0.000001436],[0.000009128,-0.000001431],[0.000009091,-0.000001426],[0.000009054,-0.000001421],[0.000009017,-0.000001417],[0.000008979,-0.000001412],[0.000008941,-0.000001408],[0.000008903,-0.000001404],[0.000008865,-0.000001400],[0.000008826,-0.000001397],[0.000008788,-0.000001393],[0.000008750,-0.000001390],[0.000008711,-0.000001387],[0.000008672,-0.000001384],[0.000008634,-0.000001381],[0.000008595,-0.000001378],[0.000008556,-0.000001375],[0.000008518,-0.000001373],[0.000008479,-0.000001370],[0.000008440,-0.000001367],[0.000008402,-0.000001365],[0.000018597,-0.000001824],[0.000018505,-0.000001815],[0.000018414,-0.000001806],[0.000018322,-0.000001797],[0.000018230,-0.000001789],[0.000018138,-0.000001780],[0.000018047,-0.000001772],[0.000017955,-0.000001764],[0.000017864,-0.000001756],[0.000017773,-0.000001749],[0.000017682,-0.000001742],[0.000017591,-0.000001735],[0.000017501,-0.000001729],[0.000017411,-0.000001724],[0.000017322,-0.000001719],[0.000017233,-0.000001714],[0.000017145,-0.000001710],[0.000017058,-0.000001707],[0.000016971,-0.000001704],[0.000016886,-0.000001702],[0.000016801,-0.000001701],[0.000016718,-0.000001700],[0.000016637,-0.000001700],[0.000016556,-0.000001700],[0.000016477,-0.000001700],[0.000016400,-0.000001701],[0.000016324,-0.000001701],[0.000016250,-0.000001702],[0.000016176,-0.000001703],[0.000016104,-0.000001704],[0.000016033,-0.000001704],[0.000015962,-0.000001705],[0.000015892,-0.000001704],[0.000015823,-0.000001704],[0.000015753,-0.000001702],[0.000015683,-0.000001700],[0.000015613,-0.000001696],[0.000015543,-0.000001691],[0.000015473,-0.000001686],[0.000015404,-0.000001679],[0.000015335,-0.000001670],[0.000015266,-0.000001661],[0.000015199,-0.000001651],[0.000015134,-0.000001640],[0.000015071,-0.000001629],[0.000015010,-0.000001618],[0.000014950,-0.000001606],[0.000014893,-0.000001595],[0.000014837,-0.000001583],[0.000014783,-0.000001571],[0.000014729,-0.000001558],[0.000014676,-0.000001545],[0.000014623,-0.000001532],[0.000014569,-0.000001517],[0.000014515,-0.000001502],[0.000014459,-0.000001485],[0.000014402,-0.000001468],[0.000014342,-0.000001449],[0.000014279,-0.000001430],[0.000014213,-0.000001411],[0.000014143,-0.000001391],[0.000014068,-0.000001373],[0.000013990,-0.000001354],[0.000013908,-0.000001338],[0.000013821,-0.000001321],[0.000013730,-0.000001305],[0.000013636,-0.000001286],[0.000013540,-0.000001263],[0.000013444,-0.000001235],[0.000013352,-0.000001201],[0.000013265,-0.000001162],[0.000013185,-0.000001123],[0.000013108,-0.000001115],[0.000013028,-0.000001117],[0.000012939,-0.000001120],[0.000012850,-0.000001121],[0.000012762,-0.000001117],[0.000012673,-0.000001106],[0.000012585,-0.000001094],[0.000012498,-0.000001086],[0.000012405,-0.000001084],[0.000012309,-0.000001082],[0.000012219,-0.000001076],[0.000012142,-0.000001067],[0.000012061,-0.000001056],[0.000011976,-0.000001046],[0.000011892,-0.000001045],[0.000011806,-0.000001046],[0.000011715,-0.000001045],[0.000011618,-0.000001043],[0.000011517,-0.000001041],[0.000011416,-0.000001040],[0.000011322,-0.000001043],[0.000011230,-0.000001050],[0.000011131,-0.000001062],[0.000011024,-0.000001079],[0.000010926,-0.000001099],[0.000010833,-0.000001120],[0.000010745,-0.000001142],[0.000010660,-0.000001164],[0.000010577,-0.000001188],[0.000010497,-0.000001212],[0.000010419,-0.000001236],[0.000010345,-0.000001259],[0.000010274,-0.000001280],[0.000010207,-0.000001300],[0.000010142,-0.000001320],[0.000010080,-0.000001339],[0.000010021,-0.000001359],[0.000009964,-0.000001379],[0.000009911,-0.000001399],[0.000009860,-0.000001417],[0.000009814,-0.000001435],[0.000009771,-0.000001451],[0.000009732,-0.000001466],[0.000009697,-0.000001480],[0.000009664,-0.000001491],[0.000009634,-0.000001502],[0.000009607,-0.000001510],[0.000009581,-0.000001516],[0.000009557,-0.000001521],[0.000009534,-0.000001525],[0.000009511,-0.000001527],[0.000009489,-0.000001527],[0.000009466,-0.000001526],[0.000009443,-0.000001524],[0.000009420,-0.000001520],[0.000009396,-0.000001515],[0.000009371,-0.000001508],[0.000009344,-0.000001501],[0.000009317,-0.000001494],[0.000009288,-0.000001487],[0.000009258,-0.000001480],[0.000009227,-0.000001474],[0.000009194,-0.000001468],[0.000009161,-0.000001463],[0.000009127,-0.000001459],[0.000009092,-0.000001454],[0.000009057,-0.000001450],[0.000009022,-0.000001446],[0.000008986,-0.000001443],[0.000008950,-0.000001439],[0.000008914,-0.000001436],[0.000008878,-0.000001433],[0.000008842,-0.000001430],[0.000008806,-0.000001427],[0.000008769,-0.000001424],[0.000008733,-0.000001422],[0.000008696,-0.000001419],[0.000008659,-0.000001417],[0.000008623,-0.000001415],[0.000008586,-0.000001412],[0.000008549,-0.000001410],[0.000008513,-0.000001408],[0.000008476,-0.000001405],[0.000008439,-0.000001403],[0.000018640,-0.000001829],[0.000018548,-0.000001821],[0.000018455,-0.000001814],[0.000018363,-0.000001806],[0.000018271,-0.000001798],[0.000018179,-0.000001791],[0.000018087,-0.000001783],[0.000017996,-0.000001776],[0.000017904,-0.000001770],[0.000017813,-0.000001763],[0.000017722,-0.000001757],[0.000017631,-0.000001751],[0.000017541,-0.000001746],[0.000017452,-0.000001741],[0.000017362,-0.000001736],[0.000017274,-0.000001732],[0.000017186,-0.000001729],[0.000017099,-0.000001726],[0.000017013,-0.000001723],[0.000016928,-0.000001721],[0.000016844,-0.000001720],[0.000016761,-0.000001719],[0.000016679,-0.000001718],[0.000016599,-0.000001718],[0.000016520,-0.000001718],[0.000016442,-0.000001719],[0.000016366,-0.000001719],[0.000016290,-0.000001719],[0.000016216,-0.000001720],[0.000016143,-0.000001720],[0.000016070,-0.000001720],[0.000015999,-0.000001719],[0.000015927,-0.000001718],[0.000015857,-0.000001717],[0.000015786,-0.000001715],[0.000015715,-0.000001712],[0.000015645,-0.000001708],[0.000015575,-0.000001703],[0.000015505,-0.000001697],[0.000015436,-0.000001690],[0.000015367,-0.000001682],[0.000015300,-0.000001673],[0.000015234,-0.000001663],[0.000015169,-0.000001653],[0.000015106,-0.000001642],[0.000015045,-0.000001631],[0.000014985,-0.000001619],[0.000014928,-0.000001607],[0.000014871,-0.000001594],[0.000014816,-0.000001581],[0.000014761,-0.000001567],[0.000014706,-0.000001553],[0.000014651,-0.000001538],[0.000014596,-0.000001522],[0.000014539,-0.000001506],[0.000014481,-0.000001489],[0.000014422,-0.000001471],[0.000014360,-0.000001452],[0.000014295,-0.000001433],[0.000014227,-0.000001414],[0.000014155,-0.000001396],[0.000014080,-0.000001377],[0.000013999,-0.000001359],[0.000013914,-0.000001341],[0.000013824,-0.000001323],[0.000013730,-0.000001304],[0.000013631,-0.000001283],[0.000013529,-0.000001258],[0.000013428,-0.000001228],[0.000013330,-0.000001195],[0.000013241,-0.000001159],[0.000013161,-0.000001130],[0.000013087,-0.000001117],[0.000013016,-0.000001116],[0.000012944,-0.000001118],[0.000012868,-0.000001118],[0.000012786,-0.000001114],[0.000012701,-0.000001108],[0.000012613,-0.000001103],[0.000012523,-0.000001098],[0.000012433,-0.000001093],[0.000012346,-0.000001086],[0.000012267,-0.000001071],[0.000012192,-0.000001061],[0.000012101,-0.000001051],[0.000012007,-0.000001039],[0.000011918,-0.000001033],[0.000011830,-0.000001029],[0.000011738,-0.000001026],[0.000011637,-0.000001025],[0.000011527,-0.000001022],[0.000011413,-0.000001017],[0.000011312,-0.000001016],[0.000011217,-0.000001020],[0.000011114,-0.000001030],[0.000010991,-0.000001051],[0.000010889,-0.000001076],[0.000010802,-0.000001098],[0.000010718,-0.000001121],[0.000010635,-0.000001146],[0.000010553,-0.000001171],[0.000010473,-0.000001196],[0.000010395,-0.000001221],[0.000010320,-0.000001245],[0.000010249,-0.000001268],[0.000010181,-0.000001290],[0.000010116,-0.000001311],[0.000010055,-0.000001332],[0.000009996,-0.000001352],[0.000009941,-0.000001372],[0.000009888,-0.000001392],[0.000009839,-0.000001411],[0.000009793,-0.000001429],[0.000009750,-0.000001446],[0.000009711,-0.000001462],[0.000009675,-0.000001476],[0.000009642,-0.000001489],[0.000009612,-0.000001500],[0.000009584,-0.000001510],[0.000009558,-0.000001518],[0.000009533,-0.000001524],[0.000009510,-0.000001529],[0.000009487,-0.000001532],[0.000009465,-0.000001534],[0.000009442,-0.000001535],[0.000009420,-0.000001535],[0.000009397,-0.000001533],[0.000009374,-0.000001530],[0.000009350,-0.000001525],[0.000009326,-0.000001521],[0.000009300,-0.000001515],[0.000009274,-0.000001509],[0.000009246,-0.000001504],[0.000009217,-0.000001499],[0.000009187,-0.000001494],[0.000009156,-0.000001490],[0.000009124,-0.000001486],[0.000009092,-0.000001482],[0.000009059,-0.000001479],[0.000009026,-0.000001476],[0.000008992,-0.000001473],[0.000008959,-0.000001470],[0.000008925,-0.000001467],[0.000008891,-0.000001465],[0.000008857,-0.000001463],[0.000008822,-0.000001460],[0.000008788,-0.000001458],[0.000008754,-0.000001456],[0.000008719,-0.000001454],[0.000008685,-0.000001453],[0.000008650,-0.000001451],[0.000008616,-0.000001449],[0.000008581,-0.000001447],[0.000008547,-0.000001446],[0.000008512,-0.000001444],[0.000008478,-0.000001442],[0.000018681,-0.000001835],[0.000018589,-0.000001828],[0.000018497,-0.000001821],[0.000018405,-0.000001814],[0.000018312,-0.000001808],[0.000018220,-0.000001801],[0.000018128,-0.000001795],[0.000018036,-0.000001788],[0.000017945,-0.000001782],[0.000017854,-0.000001777],[0.000017763,-0.000001771],[0.000017672,-0.000001766],[0.000017582,-0.000001761],[0.000017492,-0.000001757],[0.000017403,-0.000001753],[0.000017315,-0.000001750],[0.000017228,-0.000001746],[0.000017141,-0.000001744],[0.000017055,-0.000001742],[0.000016970,-0.000001740],[0.000016886,-0.000001738],[0.000016804,-0.000001737],[0.000016722,-0.000001737],[0.000016641,-0.000001736],[0.000016562,-0.000001736],[0.000016484,-0.000001736],[0.000016407,-0.000001736],[0.000016331,-0.000001736],[0.000016256,-0.000001735],[0.000016182,-0.000001735],[0.000016109,-0.000001734],[0.000016036,-0.000001733],[0.000015963,-0.000001732],[0.000015892,-0.000001730],[0.000015820,-0.000001727],[0.000015749,-0.000001723],[0.000015678,-0.000001719],[0.000015608,-0.000001714],[0.000015538,-0.000001707],[0.000015469,-0.000001700],[0.000015401,-0.000001693],[0.000015334,-0.000001684],[0.000015268,-0.000001674],[0.000015204,-0.000001664],[0.000015141,-0.000001653],[0.000015080,-0.000001642],[0.000015020,-0.000001630],[0.000014962,-0.000001617],[0.000014904,-0.000001604],[0.000014847,-0.000001590],[0.000014791,-0.000001575],[0.000014735,-0.000001560],[0.000014678,-0.000001544],[0.000014621,-0.000001528],[0.000014563,-0.000001511],[0.000014503,-0.000001493],[0.000014441,-0.000001475],[0.000014377,-0.000001456],[0.000014310,-0.000001437],[0.000014240,-0.000001419],[0.000014166,-0.000001400],[0.000014088,-0.000001382],[0.000014006,-0.000001363],[0.000013919,-0.000001345],[0.000013826,-0.000001325],[0.000013728,-0.000001304],[0.000013626,-0.000001281],[0.000013520,-0.000001256],[0.000013413,-0.000001228],[0.000013309,-0.000001199],[0.000013212,-0.000001172],[0.000013131,-0.000001151],[0.000013067,-0.000001137],[0.000013006,-0.000001129],[0.000012946,-0.000001125],[0.000012881,-0.000001122],[0.000012805,-0.000001118],[0.000012728,-0.000001114],[0.000012644,-0.000001109],[0.000012555,-0.000001103],[0.000012468,-0.000001096],[0.000012386,-0.000001084],[0.000012308,-0.000001066],[0.000012240,-0.000001058],[0.000012142,-0.000001051],[0.000012041,-0.000001041],[0.000011948,-0.000001024],[0.000011859,-0.000001007],[0.000011765,-0.000001000],[0.000011661,-0.000001003],[0.000011544,-0.000001000],[0.000011424,-0.000000994],[0.000011314,-0.000000992],[0.000011211,-0.000000994],[0.000011106,-0.000001003],[0.000010993,-0.000001022],[0.000010882,-0.000001048],[0.000010787,-0.000001074],[0.000010699,-0.000001100],[0.000010615,-0.000001126],[0.000010533,-0.000001152],[0.000010452,-0.000001178],[0.000010375,-0.000001204],[0.000010300,-0.000001229],[0.000010228,-0.000001254],[0.000010159,-0.000001277],[0.000010094,-0.000001300],[0.000010033,-0.000001321],[0.000009974,-0.000001343],[0.000009919,-0.000001363],[0.000009868,-0.000001383],[0.000009819,-0.000001403],[0.000009773,-0.000001422],[0.000009731,-0.000001439],[0.000009691,-0.000001456],[0.000009655,-0.000001471],[0.000009621,-0.000001485],[0.000009590,-0.000001497],[0.000009562,-0.000001508],[0.000009535,-0.000001517],[0.000009510,-0.000001525],[0.000009486,-0.000001531],[0.000009463,-0.000001536],[0.000009441,-0.000001540],[0.000009418,-0.000001543],[0.000009397,-0.000001544],[0.000009375,-0.000001544],[0.000009353,-0.000001543],[0.000009330,-0.000001541],[0.000009307,-0.000001538],[0.000009283,-0.000001535],[0.000009258,-0.000001531],[0.000009232,-0.000001527],[0.000009205,-0.000001523],[0.000009178,-0.000001519],[0.000009149,-0.000001516],[0.000009120,-0.000001513],[0.000009090,-0.000001510],[0.000009059,-0.000001507],[0.000009029,-0.000001505],[0.000008998,-0.000001503],[0.000008966,-0.000001501],[0.000008934,-0.000001499],[0.000008903,-0.000001497],[0.000008871,-0.000001495],[0.000008839,-0.000001494],[0.000008807,-0.000001492],[0.000008774,-0.000001491],[0.000008742,-0.000001490],[0.000008710,-0.000001488],[0.000008678,-0.000001487],[0.000008645,-0.000001486],[0.000008613,-0.000001485],[0.000008581,-0.000001484],[0.000008549,-0.000001483],[0.000008516,-0.000001481],[0.000018722,-0.000001841],[0.000018630,-0.000001835],[0.000018538,-0.000001829],[0.000018445,-0.000001823],[0.000018353,-0.000001817],[0.000018261,-0.000001811],[0.000018169,-0.000001806],[0.000018077,-0.000001800],[0.000017986,-0.000001795],[0.000017894,-0.000001790],[0.000017804,-0.000001785],[0.000017713,-0.000001781],[0.000017623,-0.000001777],[0.000017534,-0.000001773],[0.000017445,-0.000001769],[0.000017357,-0.000001766],[0.000017270,-0.000001764],[0.000017183,-0.000001761],[0.000017098,-0.000001759],[0.000017013,-0.000001758],[0.000016929,-0.000001756],[0.000016847,-0.000001755],[0.000016765,-0.000001754],[0.000016684,-0.000001753],[0.000016605,-0.000001753],[0.000016526,-0.000001752],[0.000016449,-0.000001752],[0.000016372,-0.000001751],[0.000016296,-0.000001750],[0.000016221,-0.000001749],[0.000016147,-0.000001748],[0.000016073,-0.000001746],[0.000016000,-0.000001744],[0.000015928,-0.000001742],[0.000015855,-0.000001738],[0.000015784,-0.000001734],[0.000015713,-0.000001729],[0.000015642,-0.000001724],[0.000015572,-0.000001718],[0.000015504,-0.000001710],[0.000015436,-0.000001702],[0.000015369,-0.000001694],[0.000015303,-0.000001684],[0.000015239,-0.000001674],[0.000015176,-0.000001663],[0.000015115,-0.000001652],[0.000015054,-0.000001639],[0.000014995,-0.000001626],[0.000014936,-0.000001612],[0.000014878,-0.000001598],[0.000014821,-0.000001583],[0.000014763,-0.000001567],[0.000014704,-0.000001550],[0.000014645,-0.000001533],[0.000014585,-0.000001515],[0.000014523,-0.000001497],[0.000014459,-0.000001479],[0.000014392,-0.000001461],[0.000014323,-0.000001442],[0.000014251,-0.000001423],[0.000014176,-0.000001405],[0.000014096,-0.000001386],[0.000014011,-0.000001367],[0.000013922,-0.000001348],[0.000013828,-0.000001328],[0.000013728,-0.000001306],[0.000013624,-0.000001283],[0.000013516,-0.000001259],[0.000013406,-0.000001234],[0.000013295,-0.000001211],[0.000013189,-0.000001192],[0.000013101,-0.000001177],[0.000013053,-0.000001164],[0.000012998,-0.000001149],[0.000012941,-0.000001137],[0.000012880,-0.000001130],[0.000012811,-0.000001124],[0.000012743,-0.000001118],[0.000012668,-0.000001111],[0.000012587,-0.000001102],[0.000012506,-0.000001092],[0.000012428,-0.000001080],[0.000012350,-0.000001068],[0.000012271,-0.000001060],[0.000012178,-0.000001050],[0.000012076,-0.000001038],[0.000011981,-0.000001012],[0.000011892,-0.000000981],[0.000011795,-0.000000967],[0.000011685,-0.000000971],[0.000011565,-0.000000973],[0.000011443,-0.000000971],[0.000011326,-0.000000970],[0.000011214,-0.000000974],[0.000011103,-0.000000984],[0.000010993,-0.000001001],[0.000010884,-0.000001025],[0.000010783,-0.000001051],[0.000010689,-0.000001078],[0.000010602,-0.000001105],[0.000010518,-0.000001132],[0.000010437,-0.000001159],[0.000010358,-0.000001186],[0.000010283,-0.000001212],[0.000010210,-0.000001237],[0.000010141,-0.000001262],[0.000010076,-0.000001286],[0.000010014,-0.000001309],[0.000009956,-0.000001331],[0.000009900,-0.000001352],[0.000009849,-0.000001373],[0.000009800,-0.000001393],[0.000009754,-0.000001413],[0.000009711,-0.000001431],[0.000009672,-0.000001448],[0.000009635,-0.000001464],[0.000009601,-0.000001479],[0.000009569,-0.000001493],[0.000009540,-0.000001505],[0.000009512,-0.000001515],[0.000009487,-0.000001525],[0.000009462,-0.000001533],[0.000009439,-0.000001539],[0.000009417,-0.000001545],[0.000009395,-0.000001549],[0.000009373,-0.000001552],[0.000009352,-0.000001554],[0.000009330,-0.000001555],[0.000009309,-0.000001555],[0.000009287,-0.000001554],[0.000009264,-0.000001553],[0.000009241,-0.000001551],[0.000009217,-0.000001548],[0.000009193,-0.000001546],[0.000009167,-0.000001543],[0.000009141,-0.000001541],[0.000009114,-0.000001539],[0.000009087,-0.000001537],[0.000009059,-0.000001535],[0.000009030,-0.000001534],[0.000009002,-0.000001532],[0.000008972,-0.000001531],[0.000008943,-0.000001530],[0.000008914,-0.000001529],[0.000008884,-0.000001528],[0.000008854,-0.000001527],[0.000008825,-0.000001526],[0.000008795,-0.000001525],[0.000008765,-0.000001525],[0.000008735,-0.000001524],[0.000008705,-0.000001523],[0.000008675,-0.000001523],[0.000008645,-0.000001522],[0.000008615,-0.000001522],[0.000008585,-0.000001521],[0.000008555,-0.000001521],[0.000018762,-0.000001847],[0.000018670,-0.000001841],[0.000018578,-0.000001836],[0.000018486,-0.000001831],[0.000018394,-0.000001826],[0.000018302,-0.000001821],[0.000018210,-0.000001816],[0.000018118,-0.000001812],[0.000018027,-0.000001807],[0.000017936,-0.000001803],[0.000017845,-0.000001799],[0.000017755,-0.000001795],[0.000017665,-0.000001792],[0.000017576,-0.000001788],[0.000017487,-0.000001785],[0.000017400,-0.000001782],[0.000017312,-0.000001780],[0.000017226,-0.000001778],[0.000017141,-0.000001776],[0.000017056,-0.000001775],[0.000016973,-0.000001773],[0.000016890,-0.000001772],[0.000016808,-0.000001771],[0.000016728,-0.000001770],[0.000016648,-0.000001769],[0.000016569,-0.000001768],[0.000016491,-0.000001767],[0.000016413,-0.000001766],[0.000016337,-0.000001765],[0.000016261,-0.000001763],[0.000016186,-0.000001761],[0.000016112,-0.000001759],[0.000016038,-0.000001756],[0.000015964,-0.000001753],[0.000015891,-0.000001749],[0.000015819,-0.000001745],[0.000015748,-0.000001739],[0.000015677,-0.000001734],[0.000015608,-0.000001727],[0.000015539,-0.000001720],[0.000015471,-0.000001712],[0.000015404,-0.000001703],[0.000015339,-0.000001693],[0.000015274,-0.000001683],[0.000015211,-0.000001672],[0.000015149,-0.000001660],[0.000015088,-0.000001648],[0.000015028,-0.000001634],[0.000014968,-0.000001620],[0.000014908,-0.000001605],[0.000014849,-0.000001589],[0.000014790,-0.000001573],[0.000014729,-0.000001556],[0.000014668,-0.000001539],[0.000014606,-0.000001521],[0.000014542,-0.000001502],[0.000014476,-0.000001484],[0.000014407,-0.000001466],[0.000014336,-0.000001447],[0.000014262,-0.000001428],[0.000014184,-0.000001410],[0.000014103,-0.000001391],[0.000014016,-0.000001372],[0.000013926,-0.000001352],[0.000013830,-0.000001331],[0.000013731,-0.000001310],[0.000013627,-0.000001287],[0.000013520,-0.000001266],[0.000013410,-0.000001245],[0.000013299,-0.000001227],[0.000013191,-0.000001212],[0.000013093,-0.000001199],[0.000013039,-0.000001185],[0.000012998,-0.000001168],[0.000012943,-0.000001153],[0.000012880,-0.000001141],[0.000012817,-0.000001132],[0.000012755,-0.000001122],[0.000012690,-0.000001111],[0.000012619,-0.000001098],[0.000012544,-0.000001086],[0.000012467,-0.000001075],[0.000012389,-0.000001066],[0.000012306,-0.000001055],[0.000012218,-0.000001034],[0.000012122,-0.000001010],[0.000012022,-0.000000987],[0.000011925,-0.000000957],[0.000011821,-0.000000941],[0.000011707,-0.000000941],[0.000011586,-0.000000945],[0.000011463,-0.000000947],[0.000011342,-0.000000950],[0.000011224,-0.000000956],[0.000011109,-0.000000967],[0.000010997,-0.000000983],[0.000010889,-0.000001005],[0.000010785,-0.000001030],[0.000010687,-0.000001057],[0.000010595,-0.000001084],[0.000010508,-0.000001112],[0.000010425,-0.000001140],[0.000010346,-0.000001167],[0.000010269,-0.000001194],[0.000010196,-0.000001220],[0.000010126,-0.000001245],[0.000010060,-0.000001270],[0.000009998,-0.000001294],[0.000009939,-0.000001317],[0.000009883,-0.000001340],[0.000009831,-0.000001361],[0.000009782,-0.000001382],[0.000009736,-0.000001402],[0.000009693,-0.000001421],[0.000009653,-0.000001440],[0.000009615,-0.000001457],[0.000009580,-0.000001472],[0.000009548,-0.000001487],[0.000009518,-0.000001500],[0.000009490,-0.000001512],[0.000009464,-0.000001523],[0.000009439,-0.000001533],[0.000009415,-0.000001541],[0.000009393,-0.000001548],[0.000009371,-0.000001554],[0.000009350,-0.000001559],[0.000009329,-0.000001563],[0.000009308,-0.000001566],[0.000009288,-0.000001568],[0.000009267,-0.000001569],[0.000009246,-0.000001569],[0.000009224,-0.000001569],[0.000009202,-0.000001569],[0.000009179,-0.000001568],[0.000009156,-0.000001567],[0.000009132,-0.000001565],[0.000009108,-0.000001564],[0.000009083,-0.000001563],[0.000009057,-0.000001563],[0.000009031,-0.000001562],[0.000009005,-0.000001561],[0.000008978,-0.000001561],[0.000008951,-0.000001560],[0.000008924,-0.000001560],[0.000008897,-0.000001560],[0.000008870,-0.000001560],[0.000008842,-0.000001560],[0.000008815,-0.000001560],[0.000008787,-0.000001560],[0.000008760,-0.000001560],[0.000008732,-0.000001560],[0.000008705,-0.000001560],[0.000008677,-0.000001560],[0.000008649,-0.000001560],[0.000008622,-0.000001560],[0.000008594,-0.000001560],[0.000018802,-0.000001853],[0.000018710,-0.000001848],[0.000018618,-0.000001844],[0.000018526,-0.000001839],[0.000018434,-0.000001835],[0.000018342,-0.000001831],[0.000018251,-0.000001827],[0.000018159,-0.000001823],[0.000018068,-0.000001819],[0.000017977,-0.000001816],[0.000017887,-0.000001812],[0.000017797,-0.000001809],[0.000017707,-0.000001806],[0.000017618,-0.000001803],[0.000017530,-0.000001800],[0.000017442,-0.000001798],[0.000017355,-0.000001796],[0.000017270,-0.000001794],[0.000017184,-0.000001792],[0.000017100,-0.000001791],[0.000017016,-0.000001789],[0.000016934,-0.000001788],[0.000016852,-0.000001787],[0.000016771,-0.000001785],[0.000016691,-0.000001784],[0.000016611,-0.000001783],[0.000016533,-0.000001782],[0.000016455,-0.000001780],[0.000016378,-0.000001778],[0.000016301,-0.000001776],[0.000016226,-0.000001774],[0.000016150,-0.000001771],[0.000016076,-0.000001768],[0.000016002,-0.000001764],[0.000015929,-0.000001760],[0.000015856,-0.000001755],[0.000015784,-0.000001749],[0.000015714,-0.000001743],[0.000015644,-0.000001736],[0.000015575,-0.000001728],[0.000015507,-0.000001720],[0.000015440,-0.000001711],[0.000015374,-0.000001702],[0.000015309,-0.000001691],[0.000015246,-0.000001680],[0.000015183,-0.000001668],[0.000015121,-0.000001655],[0.000015060,-0.000001641],[0.000014998,-0.000001627],[0.000014938,-0.000001612],[0.000014877,-0.000001596],[0.000014815,-0.000001579],[0.000014753,-0.000001562],[0.000014690,-0.000001544],[0.000014626,-0.000001526],[0.000014560,-0.000001508],[0.000014492,-0.000001489],[0.000014422,-0.000001471],[0.000014348,-0.000001452],[0.000014272,-0.000001433],[0.000014193,-0.000001415],[0.000014110,-0.000001396],[0.000014023,-0.000001376],[0.000013931,-0.000001356],[0.000013836,-0.000001336],[0.000013737,-0.000001315],[0.000013635,-0.000001295],[0.000013530,-0.000001275],[0.000013425,-0.000001258],[0.000013322,-0.000001242],[0.000013226,-0.000001229],[0.000013145,-0.000001215],[0.000013082,-0.000001201],[0.000013026,-0.000001186],[0.000012968,-0.000001170],[0.000012908,-0.000001155],[0.000012845,-0.000001142],[0.000012780,-0.000001127],[0.000012716,-0.000001112],[0.000012649,-0.000001097],[0.000012578,-0.000001083],[0.000012503,-0.000001070],[0.000012425,-0.000001057],[0.000012344,-0.000001038],[0.000012259,-0.000001010],[0.000012167,-0.000000979],[0.000012063,-0.000000959],[0.000011956,-0.000000940],[0.000011845,-0.000000926],[0.000011728,-0.000000921],[0.000011607,-0.000000922],[0.000011483,-0.000000926],[0.000011360,-0.000000932],[0.000011238,-0.000000940],[0.000011120,-0.000000952],[0.000011006,-0.000000968],[0.000010896,-0.000000987],[0.000010791,-0.000001011],[0.000010690,-0.000001037],[0.000010595,-0.000001064],[0.000010505,-0.000001091],[0.000010419,-0.000001119],[0.000010337,-0.000001147],[0.000010260,-0.000001174],[0.000010185,-0.000001201],[0.000010114,-0.000001227],[0.000010048,-0.000001253],[0.000009984,-0.000001278],[0.000009924,-0.000001302],[0.000009868,-0.000001325],[0.000009815,-0.000001348],[0.000009765,-0.000001369],[0.000009719,-0.000001390],[0.000009675,-0.000001410],[0.000009634,-0.000001429],[0.000009596,-0.000001447],[0.000009560,-0.000001464],[0.000009527,-0.000001480],[0.000009496,-0.000001495],[0.000009468,-0.000001508],[0.000009441,-0.000001520],[0.000009415,-0.000001532],[0.000009392,-0.000001541],[0.000009369,-0.000001550],[0.000009347,-0.000001558],[0.000009326,-0.000001565],[0.000009306,-0.000001571],[0.000009286,-0.000001576],[0.000009266,-0.000001580],[0.000009246,-0.000001583],[0.000009227,-0.000001585],[0.000009207,-0.000001587],[0.000009186,-0.000001588],[0.000009165,-0.000001588],[0.000009144,-0.000001589],[0.000009122,-0.000001589],[0.000009100,-0.000001589],[0.000009078,-0.000001589],[0.000009054,-0.000001589],[0.000009031,-0.000001590],[0.000009007,-0.000001590],[0.000008983,-0.000001591],[0.000008958,-0.000001591],[0.000008934,-0.000001591],[0.000008909,-0.000001592],[0.000008884,-0.000001593],[0.000008859,-0.000001593],[0.000008834,-0.000001594],[0.000008809,-0.000001594],[0.000008784,-0.000001595],[0.000008759,-0.000001596],[0.000008734,-0.000001596],[0.000008709,-0.000001597],[0.000008684,-0.000001598],[0.000008659,-0.000001598],[0.000008634,-0.000001599],[0.000018841,-0.000001859],[0.000018749,-0.000001855],[0.000018658,-0.000001851],[0.000018566,-0.000001847],[0.000018474,-0.000001844],[0.000018383,-0.000001840],[0.000018291,-0.000001837],[0.000018200,-0.000001834],[0.000018109,-0.000001831],[0.000018019,-0.000001828],[0.000017929,-0.000001825],[0.000017839,-0.000001822],[0.000017750,-0.000001820],[0.000017661,-0.000001817],[0.000017573,-0.000001815],[0.000017486,-0.000001813],[0.000017399,-0.000001811],[0.000017313,-0.000001809],[0.000017228,-0.000001808],[0.000017144,-0.000001806],[0.000017060,-0.000001805],[0.000016977,-0.000001803],[0.000016896,-0.000001802],[0.000016814,-0.000001801],[0.000016734,-0.000001799],[0.000016654,-0.000001797],[0.000016575,-0.000001796],[0.000016497,-0.000001794],[0.000016419,-0.000001791],[0.000016342,-0.000001789],[0.000016266,-0.000001786],[0.000016190,-0.000001782],[0.000016115,-0.000001779],[0.000016040,-0.000001774],[0.000015967,-0.000001769],[0.000015894,-0.000001764],[0.000015822,-0.000001758],[0.000015751,-0.000001751],[0.000015681,-0.000001744],[0.000015611,-0.000001737],[0.000015543,-0.000001728],[0.000015476,-0.000001719],[0.000015410,-0.000001709],[0.000015344,-0.000001698],[0.000015280,-0.000001687],[0.000015216,-0.000001675],[0.000015153,-0.000001662],[0.000015091,-0.000001648],[0.000015028,-0.000001633],[0.000014966,-0.000001617],[0.000014903,-0.000001601],[0.000014840,-0.000001584],[0.000014776,-0.000001567],[0.000014711,-0.000001549],[0.000014645,-0.000001531],[0.000014577,-0.000001513],[0.000014507,-0.000001494],[0.000014435,-0.000001476],[0.000014361,-0.000001457],[0.000014283,-0.000001439],[0.000014202,-0.000001420],[0.000014118,-0.000001401],[0.000014030,-0.000001381],[0.000013939,-0.000001362],[0.000013845,-0.000001342],[0.000013748,-0.000001323],[0.000013649,-0.000001304],[0.000013549,-0.000001287],[0.000013452,-0.000001271],[0.000013359,-0.000001257],[0.000013276,-0.000001244],[0.000013206,-0.000001231],[0.000013140,-0.000001217],[0.000013071,-0.000001201],[0.000013006,-0.000001185],[0.000012947,-0.000001170],[0.000012881,-0.000001153],[0.000012813,-0.000001134],[0.000012746,-0.000001115],[0.000012681,-0.000001098],[0.000012612,-0.000001082],[0.000012538,-0.000001065],[0.000012461,-0.000001047],[0.000012380,-0.000001024],[0.000012293,-0.000000995],[0.000012199,-0.000000966],[0.000012095,-0.000000944],[0.000011984,-0.000000927],[0.000011868,-0.000000914],[0.000011749,-0.000000907],[0.000011627,-0.000000906],[0.000011502,-0.000000909],[0.000011378,-0.000000916],[0.000011255,-0.000000925],[0.000011135,-0.000000937],[0.000011019,-0.000000953],[0.000010907,-0.000000972],[0.000010799,-0.000000993],[0.000010696,-0.000001018],[0.000010598,-0.000001044],[0.000010505,-0.000001071],[0.000010417,-0.000001099],[0.000010333,-0.000001126],[0.000010253,-0.000001154],[0.000010177,-0.000001181],[0.000010105,-0.000001208],[0.000010037,-0.000001234],[0.000009973,-0.000001260],[0.000009912,-0.000001285],[0.000009854,-0.000001309],[0.000009800,-0.000001332],[0.000009750,-0.000001355],[0.000009702,-0.000001377],[0.000009658,-0.000001398],[0.000009616,-0.000001418],[0.000009577,-0.000001437],[0.000009541,-0.000001455],[0.000009507,-0.000001472],[0.000009475,-0.000001488],[0.000009446,-0.000001503],[0.000009418,-0.000001517],[0.000009392,-0.000001530],[0.000009368,-0.000001541],[0.000009345,-0.000001552],[0.000009324,-0.000001561],[0.000009303,-0.000001570],[0.000009283,-0.000001578],[0.000009263,-0.000001584],[0.000009244,-0.000001590],[0.000009226,-0.000001595],[0.000009207,-0.000001599],[0.000009188,-0.000001603],[0.000009170,-0.000001606],[0.000009151,-0.000001608],[0.000009132,-0.000001610],[0.000009112,-0.000001612],[0.000009092,-0.000001613],[0.000009072,-0.000001615],[0.000009051,-0.000001616],[0.000009030,-0.000001617],[0.000009008,-0.000001618],[0.000008987,-0.000001620],[0.000008965,-0.000001621],[0.000008943,-0.000001622],[0.000008921,-0.000001624],[0.000008899,-0.000001625],[0.000008876,-0.000001626],[0.000008854,-0.000001628],[0.000008831,-0.000001629],[0.000008809,-0.000001630],[0.000008786,-0.000001632],[0.000008764,-0.000001633],[0.000008741,-0.000001634],[0.000008719,-0.000001636],[0.000008696,-0.000001637],[0.000008673,-0.000001638],[0.000018880,-0.000001865],[0.000018789,-0.000001861],[0.000018697,-0.000001858],[0.000018606,-0.000001855],[0.000018515,-0.000001852],[0.000018423,-0.000001850],[0.000018332,-0.000001847],[0.000018242,-0.000001844],[0.000018151,-0.000001842],[0.000018061,-0.000001839],[0.000017971,-0.000001837],[0.000017882,-0.000001835],[0.000017793,-0.000001833],[0.000017704,-0.000001831],[0.000017617,-0.000001829],[0.000017529,-0.000001827],[0.000017443,-0.000001826],[0.000017357,-0.000001824],[0.000017272,-0.000001823],[0.000017188,-0.000001821],[0.000017104,-0.000001820],[0.000017022,-0.000001818],[0.000016939,-0.000001816],[0.000016858,-0.000001815],[0.000016778,-0.000001813],[0.000016697,-0.000001811],[0.000016618,-0.000001809],[0.000016539,-0.000001806],[0.000016461,-0.000001804],[0.000016383,-0.000001800],[0.000016307,-0.000001797],[0.000016230,-0.000001793],[0.000016155,-0.000001789],[0.000016080,-0.000001784],[0.000016006,-0.000001779],[0.000015932,-0.000001773],[0.000015860,-0.000001767],[0.000015788,-0.000001760],[0.000015718,-0.000001752],[0.000015648,-0.000001744],[0.000015580,-0.000001735],[0.000015512,-0.000001726],[0.000015445,-0.000001716],[0.000015379,-0.000001705],[0.000015314,-0.000001693],[0.000015249,-0.000001680],[0.000015185,-0.000001667],[0.000015121,-0.000001653],[0.000015057,-0.000001638],[0.000014993,-0.000001623],[0.000014929,-0.000001606],[0.000014864,-0.000001589],[0.000014798,-0.000001572],[0.000014732,-0.000001554],[0.000014664,-0.000001536],[0.000014594,-0.000001518],[0.000014523,-0.000001500],[0.000014449,-0.000001481],[0.000014373,-0.000001463],[0.000014294,-0.000001444],[0.000014212,-0.000001425],[0.000014128,-0.000001406],[0.000014040,-0.000001387],[0.000013950,-0.000001368],[0.000013858,-0.000001350],[0.000013763,-0.000001331],[0.000013669,-0.000001314],[0.000013576,-0.000001298],[0.000013486,-0.000001284],[0.000013403,-0.000001270],[0.000013328,-0.000001258],[0.000013261,-0.000001245],[0.000013195,-0.000001231],[0.000013118,-0.000001215],[0.000013044,-0.000001198],[0.000012978,-0.000001182],[0.000012915,-0.000001166],[0.000012849,-0.000001142],[0.000012782,-0.000001120],[0.000012716,-0.000001103],[0.000012648,-0.000001087],[0.000012574,-0.000001065],[0.000012496,-0.000001044],[0.000012412,-0.000001017],[0.000012322,-0.000000988],[0.000012225,-0.000000960],[0.000012120,-0.000000937],[0.000012007,-0.000000919],[0.000011890,-0.000000906],[0.000011769,-0.000000898],[0.000011646,-0.000000895],[0.000011522,-0.000000897],[0.000011397,-0.000000903],[0.000011273,-0.000000912],[0.000011152,-0.000000924],[0.000011034,-0.000000939],[0.000010920,-0.000000957],[0.000010811,-0.000000977],[0.000010706,-0.000001000],[0.000010605,-0.000001025],[0.000010509,-0.000001051],[0.000010418,-0.000001078],[0.000010332,-0.000001106],[0.000010250,-0.000001133],[0.000010172,-0.000001161],[0.000010099,-0.000001188],[0.000010029,-0.000001215],[0.000009963,-0.000001241],[0.000009901,-0.000001267],[0.000009842,-0.000001292],[0.000009787,-0.000001316],[0.000009735,-0.000001339],[0.000009687,-0.000001362],[0.000009641,-0.000001384],[0.000009598,-0.000001405],[0.000009558,-0.000001425],[0.000009521,-0.000001444],[0.000009486,-0.000001463],[0.000009454,-0.000001480],[0.000009424,-0.000001497],[0.000009395,-0.000001512],[0.000009369,-0.000001526],[0.000009345,-0.000001540],[0.000009322,-0.000001552],[0.000009300,-0.000001564],[0.000009279,-0.000001574],[0.000009260,-0.000001584],[0.000009241,-0.000001592],[0.000009223,-0.000001600],[0.000009205,-0.000001607],[0.000009187,-0.000001613],[0.000009170,-0.000001618],[0.000009153,-0.000001623],[0.000009136,-0.000001627],[0.000009118,-0.000001630],[0.000009101,-0.000001633],[0.000009083,-0.000001636],[0.000009065,-0.000001639],[0.000009047,-0.000001641],[0.000009028,-0.000001644],[0.000009009,-0.000001646],[0.000008990,-0.000001648],[0.000008971,-0.000001651],[0.000008952,-0.000001653],[0.000008932,-0.000001655],[0.000008912,-0.000001657],[0.000008893,-0.000001659],[0.000008873,-0.000001661],[0.000008853,-0.000001663],[0.000008833,-0.000001666],[0.000008813,-0.000001668],[0.000008793,-0.000001670],[0.000008773,-0.000001672],[0.000008753,-0.000001674],[0.000008734,-0.000001675],[0.000008713,-0.000001677],[0.000018919,-0.000001870],[0.000018828,-0.000001868],[0.000018737,-0.000001865],[0.000018646,-0.000001863],[0.000018555,-0.000001861],[0.000018464,-0.000001858],[0.000018374,-0.000001856],[0.000018283,-0.000001854],[0.000018193,-0.000001852],[0.000018103,-0.000001851],[0.000018013,-0.000001849],[0.000017925,-0.000001847],[0.000017836,-0.000001846],[0.000017748,-0.000001844],[0.000017660,-0.000001842],[0.000017573,-0.000001841],[0.000017487,-0.000001840],[0.000017401,-0.000001838],[0.000017317,-0.000001837],[0.000017232,-0.000001835],[0.000017149,-0.000001834],[0.000017066,-0.000001832],[0.000016984,-0.000001830],[0.000016902,-0.000001828],[0.000016821,-0.000001826],[0.000016741,-0.000001824],[0.000016661,-0.000001821],[0.000016582,-0.000001819],[0.000016503,-0.000001815],[0.000016425,-0.000001812],[0.000016348,-0.000001808],[0.000016271,-0.000001804],[0.000016195,-0.000001799],[0.000016120,-0.000001793],[0.000016045,-0.000001788],[0.000015971,-0.000001781],[0.000015899,-0.000001774],[0.000015827,-0.000001767],[0.000015756,-0.000001759],[0.000015686,-0.000001751],[0.000015616,-0.000001742],[0.000015548,-0.000001732],[0.000015481,-0.000001721],[0.000015414,-0.000001710],[0.000015347,-0.000001698],[0.000015281,-0.000001685],[0.000015216,-0.000001672],[0.000015151,-0.000001658],[0.000015085,-0.000001643],[0.000015020,-0.000001627],[0.000014954,-0.000001611],[0.000014887,-0.000001594],[0.000014820,-0.000001577],[0.000014752,-0.000001559],[0.000014682,-0.000001541],[0.000014611,-0.000001523],[0.000014538,-0.000001505],[0.000014462,-0.000001487],[0.000014385,-0.000001468],[0.000014306,-0.000001450],[0.000014224,-0.000001431],[0.000014139,-0.000001412],[0.000014053,-0.000001394],[0.000013964,-0.000001376],[0.000013875,-0.000001358],[0.000013784,-0.000001341],[0.000013695,-0.000001325],[0.000013608,-0.000001310],[0.000013525,-0.000001296],[0.000013448,-0.000001282],[0.000013376,-0.000001269],[0.000013307,-0.000001256],[0.000013236,-0.000001242],[0.000013160,-0.000001225],[0.000013083,-0.000001208],[0.000013013,-0.000001193],[0.000012951,-0.000001177],[0.000012887,-0.000001150],[0.000012821,-0.000001126],[0.000012755,-0.000001111],[0.000012686,-0.000001096],[0.000012611,-0.000001075],[0.000012529,-0.000001046],[0.000012442,-0.000001016],[0.000012348,-0.000000986],[0.000012248,-0.000000958],[0.000012141,-0.000000934],[0.000012028,-0.000000915],[0.000011910,-0.000000901],[0.000011789,-0.000000892],[0.000011665,-0.000000887],[0.000011541,-0.000000887],[0.000011416,-0.000000892],[0.000011292,-0.000000900],[0.000011170,-0.000000911],[0.000011051,-0.000000925],[0.000010936,-0.000000942],[0.000010824,-0.000000961],[0.000010717,-0.000000983],[0.000010614,-0.000001006],[0.000010516,-0.000001031],[0.000010423,-0.000001058],[0.000010334,-0.000001085],[0.000010250,-0.000001112],[0.000010170,-0.000001140],[0.000010094,-0.000001167],[0.000010023,-0.000001194],[0.000009955,-0.000001221],[0.000009891,-0.000001247],[0.000009831,-0.000001273],[0.000009775,-0.000001298],[0.000009721,-0.000001322],[0.000009672,-0.000001346],[0.000009625,-0.000001369],[0.000009581,-0.000001391],[0.000009540,-0.000001412],[0.000009502,-0.000001433],[0.000009466,-0.000001453],[0.000009433,-0.000001472],[0.000009402,-0.000001490],[0.000009373,-0.000001507],[0.000009346,-0.000001523],[0.000009321,-0.000001538],[0.000009298,-0.000001552],[0.000009276,-0.000001565],[0.000009256,-0.000001577],[0.000009236,-0.000001589],[0.000009218,-0.000001599],[0.000009201,-0.000001609],[0.000009184,-0.000001617],[0.000009168,-0.000001625],[0.000009151,-0.000001632],[0.000009136,-0.000001639],[0.000009120,-0.000001644],[0.000009105,-0.000001650],[0.000009089,-0.000001654],[0.000009074,-0.000001659],[0.000009058,-0.000001663],[0.000009042,-0.000001666],[0.000009026,-0.000001670],[0.000009009,-0.000001673],[0.000008993,-0.000001677],[0.000008976,-0.000001680],[0.000008960,-0.000001683],[0.000008943,-0.000001686],[0.000008926,-0.000001689],[0.000008908,-0.000001692],[0.000008892,-0.000001695],[0.000008874,-0.000001698],[0.000008857,-0.000001700],[0.000008840,-0.000001703],[0.000008823,-0.000001706],[0.000008806,-0.000001709],[0.000008788,-0.000001711],[0.000008771,-0.000001714],[0.000008754,-0.000001717],[0.000018958,-0.000001876],[0.000018867,-0.000001874],[0.000018777,-0.000001872],[0.000018686,-0.000001870],[0.000018596,-0.000001869],[0.000018505,-0.000001867],[0.000018415,-0.000001865],[0.000018325,-0.000001864],[0.000018235,-0.000001863],[0.000018146,-0.000001861],[0.000018056,-0.000001860],[0.000017968,-0.000001859],[0.000017879,-0.000001858],[0.000017792,-0.000001856],[0.000017704,-0.000001855],[0.000017618,-0.000001854],[0.000017532,-0.000001853],[0.000017446,-0.000001852],[0.000017361,-0.000001850],[0.000017277,-0.000001849],[0.000017193,-0.000001847],[0.000017110,-0.000001845],[0.000017028,-0.000001843],[0.000016946,-0.000001841],[0.000016865,-0.000001839],[0.000016784,-0.000001836],[0.000016704,-0.000001833],[0.000016625,-0.000001830],[0.000016546,-0.000001826],[0.000016467,-0.000001822],[0.000016390,-0.000001818],[0.000016312,-0.000001813],[0.000016236,-0.000001808],[0.000016160,-0.000001802],[0.000016085,-0.000001796],[0.000016011,-0.000001789],[0.000015938,-0.000001782],[0.000015866,-0.000001774],[0.000015794,-0.000001766],[0.000015723,-0.000001757],[0.000015653,-0.000001747],[0.000015584,-0.000001737],[0.000015515,-0.000001726],[0.000015448,-0.000001715],[0.000015380,-0.000001703],[0.000015313,-0.000001690],[0.000015246,-0.000001676],[0.000015180,-0.000001662],[0.000015113,-0.000001647],[0.000015046,-0.000001631],[0.000014978,-0.000001615],[0.000014910,-0.000001598],[0.000014841,-0.000001581],[0.000014771,-0.000001564],[0.000014700,-0.000001546],[0.000014627,-0.000001528],[0.000014553,-0.000001510],[0.000014477,-0.000001492],[0.000014399,-0.000001474],[0.000014319,-0.000001455],[0.000014237,-0.000001437],[0.000014153,-0.000001419],[0.000014068,-0.000001401],[0.000013982,-0.000001384],[0.000013895,-0.000001367],[0.000013809,-0.000001350],[0.000013725,-0.000001335],[0.000013643,-0.000001321],[0.000013566,-0.000001307],[0.000013491,-0.000001293],[0.000013420,-0.000001280],[0.000013349,-0.000001265],[0.000013276,-0.000001250],[0.000013201,-0.000001234],[0.000013126,-0.000001217],[0.000013056,-0.000001200],[0.000012990,-0.000001180],[0.000012925,-0.000001156],[0.000012859,-0.000001134],[0.000012791,-0.000001118],[0.000012720,-0.000001102],[0.000012643,-0.000001079],[0.000012559,-0.000001049],[0.000012468,-0.000001017],[0.000012371,-0.000000986],[0.000012269,-0.000000958],[0.000012161,-0.000000934],[0.000012047,-0.000000914],[0.000011929,-0.000000898],[0.000011808,-0.000000888],[0.000011685,-0.000000882],[0.000011560,-0.000000880],[0.000011435,-0.000000883],[0.000011311,-0.000000889],[0.000011189,-0.000000899],[0.000011069,-0.000000912],[0.000010953,-0.000000928],[0.000010839,-0.000000946],[0.000010730,-0.000000966],[0.000010625,-0.000000988],[0.000010525,-0.000001012],[0.000010430,-0.000001037],[0.000010338,-0.000001064],[0.000010252,-0.000001090],[0.000010170,-0.000001118],[0.000010092,-0.000001145],[0.000010018,-0.000001172],[0.000009949,-0.000001200],[0.000009883,-0.000001226],[0.000009821,-0.000001253],[0.000009763,-0.000001279],[0.000009708,-0.000001304],[0.000009657,-0.000001329],[0.000009609,-0.000001353],[0.000009564,-0.000001376],[0.000009522,-0.000001399],[0.000009482,-0.000001421],[0.000009446,-0.000001442],[0.000009412,-0.000001462],[0.000009380,-0.000001482],[0.000009351,-0.000001500],[0.000009323,-0.000001518],[0.000009298,-0.000001535],[0.000009274,-0.000001551],[0.000009253,-0.000001566],[0.000009232,-0.000001580],[0.000009213,-0.000001593],[0.000009196,-0.000001605],[0.000009179,-0.000001617],[0.000009163,-0.000001627],[0.000009147,-0.000001637],[0.000009133,-0.000001646],[0.000009118,-0.000001654],[0.000009105,-0.000001661],[0.000009091,-0.000001668],[0.000009077,-0.000001675],[0.000009064,-0.000001680],[0.000009050,-0.000001686],[0.000009037,-0.000001691],[0.000009023,-0.000001696],[0.000009009,-0.000001700],[0.000008995,-0.000001705],[0.000008981,-0.000001709],[0.000008967,-0.000001713],[0.000008953,-0.000001717],[0.000008939,-0.000001721],[0.000008924,-0.000001724],[0.000008910,-0.000001728],[0.000008896,-0.000001732],[0.000008881,-0.000001735],[0.000008867,-0.000001739],[0.000008852,-0.000001742],[0.000008838,-0.000001746],[0.000008823,-0.000001749],[0.000008809,-0.000001752],[0.000008795,-0.000001756],[0.000018996,-0.000001882],[0.000018906,-0.000001880],[0.000018816,-0.000001879],[0.000018726,-0.000001877],[0.000018636,-0.000001876],[0.000018546,-0.000001875],[0.000018457,-0.000001874],[0.000018367,-0.000001873],[0.000018278,-0.000001873],[0.000018188,-0.000001872],[0.000018100,-0.000001871],[0.000018011,-0.000001870],[0.000017923,-0.000001869],[0.000017836,-0.000001868],[0.000017749,-0.000001868],[0.000017662,-0.000001867],[0.000017576,-0.000001866],[0.000017491,-0.000001864],[0.000017406,-0.000001863],[0.000017322,-0.000001862],[0.000017238,-0.000001860],[0.000017155,-0.000001858],[0.000017073,-0.000001856],[0.000016991,-0.000001854],[0.000016909,-0.000001851],[0.000016828,-0.000001848],[0.000016748,-0.000001845],[0.000016668,-0.000001841],[0.000016589,-0.000001837],[0.000016510,-0.000001833],[0.000016432,-0.000001828],[0.000016354,-0.000001822],[0.000016278,-0.000001817],[0.000016202,-0.000001810],[0.000016126,-0.000001804],[0.000016052,-0.000001796],[0.000015978,-0.000001789],[0.000015905,-0.000001781],[0.000015832,-0.000001772],[0.000015761,-0.000001763],[0.000015690,-0.000001753],[0.000015620,-0.000001742],[0.000015551,-0.000001731],[0.000015482,-0.000001719],[0.000015413,-0.000001707],[0.000015345,-0.000001693],[0.000015276,-0.000001680],[0.000015208,-0.000001665],[0.000015139,-0.000001650],[0.000015071,-0.000001635],[0.000015002,-0.000001619],[0.000014932,-0.000001602],[0.000014861,-0.000001585],[0.000014790,-0.000001568],[0.000014717,-0.000001551],[0.000014643,-0.000001533],[0.000014568,-0.000001515],[0.000014491,-0.000001497],[0.000014413,-0.000001479],[0.000014333,-0.000001461],[0.000014252,-0.000001444],[0.000014170,-0.000001426],[0.000014087,-0.000001409],[0.000014003,-0.000001392],[0.000013920,-0.000001376],[0.000013838,-0.000001360],[0.000013758,-0.000001345],[0.000013680,-0.000001331],[0.000013605,-0.000001316],[0.000013533,-0.000001302],[0.000013461,-0.000001288],[0.000013389,-0.000001273],[0.000013316,-0.000001258],[0.000013242,-0.000001241],[0.000013170,-0.000001224],[0.000013099,-0.000001205],[0.000013030,-0.000001184],[0.000012963,-0.000001162],[0.000012895,-0.000001142],[0.000012825,-0.000001122],[0.000012751,-0.000001102],[0.000012671,-0.000001078],[0.000012584,-0.000001049],[0.000012491,-0.000001018],[0.000012392,-0.000000987],[0.000012288,-0.000000959],[0.000012179,-0.000000935],[0.000012065,-0.000000914],[0.000011947,-0.000000897],[0.000011826,-0.000000885],[0.000011703,-0.000000878],[0.000011579,-0.000000875],[0.000011455,-0.000000876],[0.000011331,-0.000000880],[0.000011208,-0.000000889],[0.000011088,-0.000000900],[0.000010970,-0.000000914],[0.000010856,-0.000000931],[0.000010745,-0.000000949],[0.000010638,-0.000000970],[0.000010536,-0.000000993],[0.000010438,-0.000001017],[0.000010345,-0.000001042],[0.000010256,-0.000001069],[0.000010171,-0.000001095],[0.000010091,-0.000001123],[0.000010015,-0.000001150],[0.000009944,-0.000001178],[0.000009876,-0.000001205],[0.000009812,-0.000001232],[0.000009752,-0.000001259],[0.000009696,-0.000001285],[0.000009643,-0.000001311],[0.000009593,-0.000001336],[0.000009547,-0.000001360],[0.000009504,-0.000001384],[0.000009463,-0.000001407],[0.000009426,-0.000001430],[0.000009391,-0.000001452],[0.000009358,-0.000001473],[0.000009328,-0.000001493],[0.000009300,-0.000001512],[0.000009275,-0.000001531],[0.000009251,-0.000001549],[0.000009229,-0.000001566],[0.000009209,-0.000001581],[0.000009190,-0.000001596],[0.000009173,-0.000001611],[0.000009157,-0.000001624],[0.000009142,-0.000001636],[0.000009127,-0.000001648],[0.000009114,-0.000001658],[0.000009101,-0.000001668],[0.000009089,-0.000001678],[0.000009077,-0.000001686],[0.000009065,-0.000001694],[0.000009054,-0.000001701],[0.000009042,-0.000001708],[0.000009031,-0.000001715],[0.000009020,-0.000001721],[0.000009009,-0.000001726],[0.000008997,-0.000001732],[0.000008986,-0.000001737],[0.000008974,-0.000001742],[0.000008963,-0.000001747],[0.000008951,-0.000001752],[0.000008940,-0.000001756],[0.000008928,-0.000001761],[0.000008917,-0.000001765],[0.000008905,-0.000001769],[0.000008894,-0.000001774],[0.000008882,-0.000001778],[0.000008870,-0.000001782],[0.000008859,-0.000001786],[0.000008847,-0.000001790],[0.000008836,-0.000001794],[0.000019035,-0.000001886],[0.000018946,-0.000001886],[0.000018856,-0.000001885],[0.000018766,-0.000001884],[0.000018677,-0.000001884],[0.000018587,-0.000001883],[0.000018498,-0.000001883],[0.000018409,-0.000001882],[0.000018320,-0.000001882],[0.000018231,-0.000001881],[0.000018143,-0.000001881],[0.000018055,-0.000001881],[0.000017967,-0.000001880],[0.000017880,-0.000001880],[0.000017793,-0.000001879],[0.000017707,-0.000001878],[0.000017621,-0.000001877],[0.000017536,-0.000001877],[0.000017451,-0.000001875],[0.000017367,-0.000001874],[0.000017283,-0.000001872],[0.000017200,-0.000001870],[0.000017118,-0.000001868],[0.000017036,-0.000001865],[0.000016954,-0.000001862],[0.000016873,-0.000001859],[0.000016792,-0.000001856],[0.000016712,-0.000001851],[0.000016632,-0.000001847],[0.000016553,-0.000001842],[0.000016475,-0.000001837],[0.000016397,-0.000001831],[0.000016320,-0.000001825],[0.000016243,-0.000001818],[0.000016168,-0.000001811],[0.000016093,-0.000001803],[0.000016018,-0.000001795],[0.000015944,-0.000001786],[0.000015871,-0.000001777],[0.000015799,-0.000001767],[0.000015727,-0.000001757],[0.000015656,-0.000001746],[0.000015586,-0.000001735],[0.000015515,-0.000001723],[0.000015445,-0.000001710],[0.000015375,-0.000001697],[0.000015306,-0.000001683],[0.000015236,-0.000001668],[0.000015166,-0.000001653],[0.000015095,-0.000001638],[0.000015025,-0.000001622],[0.000014953,-0.000001605],[0.000014881,-0.000001589],[0.000014809,-0.000001572],[0.000014735,-0.000001555],[0.000014660,-0.000001537],[0.000014584,-0.000001520],[0.000014507,-0.000001502],[0.000014428,-0.000001485],[0.000014349,-0.000001467],[0.000014269,-0.000001450],[0.000014188,-0.000001433],[0.000014108,-0.000001416],[0.000014027,-0.000001400],[0.000013947,-0.000001384],[0.000013869,-0.000001369],[0.000013792,-0.000001354],[0.000013718,-0.000001340],[0.000013645,-0.000001325],[0.000013573,-0.000001311],[0.000013501,-0.000001296],[0.000013429,-0.000001280],[0.000013357,-0.000001264],[0.000013284,-0.000001246],[0.000013212,-0.000001228],[0.000013141,-0.000001208],[0.000013071,-0.000001188],[0.000013001,-0.000001167],[0.000012930,-0.000001145],[0.000012856,-0.000001124],[0.000012778,-0.000001100],[0.000012695,-0.000001075],[0.000012607,-0.000001047],[0.000012512,-0.000001017],[0.000012412,-0.000000988],[0.000012306,-0.000000961],[0.000012196,-0.000000936],[0.000012082,-0.000000915],[0.000011964,-0.000000897],[0.000011844,-0.000000884],[0.000011722,-0.000000875],[0.000011598,-0.000000870],[0.000011474,-0.000000869],[0.000011350,-0.000000872],[0.000011227,-0.000000879],[0.000011107,-0.000000888],[0.000010988,-0.000000901],[0.000010873,-0.000000916],[0.000010761,-0.000000933],[0.000010653,-0.000000952],[0.000010548,-0.000000974],[0.000010448,-0.000000997],[0.000010352,-0.000001021],[0.000010261,-0.000001047],[0.000010175,-0.000001073],[0.000010092,-0.000001100],[0.000010014,-0.000001127],[0.000009940,-0.000001155],[0.000009871,-0.000001183],[0.000009805,-0.000001210],[0.000009743,-0.000001238],[0.000009684,-0.000001265],[0.000009630,-0.000001291],[0.000009578,-0.000001318],[0.000009530,-0.000001344],[0.000009486,-0.000001369],[0.000009444,-0.000001393],[0.000009405,-0.000001417],[0.000009369,-0.000001441],[0.000009336,-0.000001463],[0.000009306,-0.000001485],[0.000009277,-0.000001506],[0.000009251,-0.000001527],[0.000009227,-0.000001546],[0.000009205,-0.000001565],[0.000009185,-0.000001582],[0.000009167,-0.000001599],[0.000009150,-0.000001615],[0.000009135,-0.000001630],[0.000009120,-0.000001644],[0.000009107,-0.000001658],[0.000009095,-0.000001670],[0.000009083,-0.000001682],[0.000009073,-0.000001693],[0.000009062,-0.000001703],[0.000009053,-0.000001713],[0.000009043,-0.000001721],[0.000009034,-0.000001730],[0.000009025,-0.000001738],[0.000009016,-0.000001745],[0.000009008,-0.000001752],[0.000008999,-0.000001758],[0.000008990,-0.000001765],[0.000008982,-0.000001771],[0.000008973,-0.000001777],[0.000008964,-0.000001782],[0.000008955,-0.000001788],[0.000008947,-0.000001793],[0.000008938,-0.000001798],[0.000008929,-0.000001803],[0.000008920,-0.000001808],[0.000008911,-0.000001813],[0.000008903,-0.000001818],[0.000008894,-0.000001823],[0.000008885,-0.000001828],[0.000008877,-0.000001833],[0.000019074,-0.000001891],[0.000018985,-0.000001891],[0.000018896,-0.000001891],[0.000018807,-0.000001891],[0.000018718,-0.000001891],[0.000018629,-0.000001891],[0.000018540,-0.000001891],[0.000018451,-0.000001891],[0.000018363,-0.000001891],[0.000018275,-0.000001891],[0.000018187,-0.000001891],[0.000018099,-0.000001891],[0.000018012,-0.000001891],[0.000017925,-0.000001891],[0.000017838,-0.000001890],[0.000017752,-0.000001890],[0.000017667,-0.000001889],[0.000017582,-0.000001888],[0.000017497,-0.000001887],[0.000017413,-0.000001885],[0.000017329,-0.000001884],[0.000017246,-0.000001882],[0.000017163,-0.000001879],[0.000017081,-0.000001876],[0.000016999,-0.000001873],[0.000016917,-0.000001870],[0.000016836,-0.000001866],[0.000016756,-0.000001861],[0.000016676,-0.000001856],[0.000016597,-0.000001851],[0.000016518,-0.000001845],[0.000016440,-0.000001839],[0.000016362,-0.000001833],[0.000016285,-0.000001825],[0.000016209,-0.000001818],[0.000016134,-0.000001810],[0.000016059,-0.000001801],[0.000015984,-0.000001792],[0.000015910,-0.000001782],[0.000015837,-0.000001772],[0.000015765,-0.000001761],[0.000015692,-0.000001750],[0.000015620,-0.000001738],[0.000015549,-0.000001726],[0.000015477,-0.000001713],[0.000015406,-0.000001699],[0.000015335,-0.000001685],[0.000015263,-0.000001671],[0.000015192,-0.000001656],[0.000015120,-0.000001640],[0.000015047,-0.000001624],[0.000014974,-0.000001608],[0.000014901,-0.000001592],[0.000014827,-0.000001575],[0.000014752,-0.000001558],[0.000014677,-0.000001542],[0.000014600,-0.000001524],[0.000014523,-0.000001507],[0.000014445,-0.000001490],[0.000014367,-0.000001473],[0.000014288,-0.000001457],[0.000014209,-0.000001440],[0.000014131,-0.000001424],[0.000014053,-0.000001408],[0.000013976,-0.000001393],[0.000013901,-0.000001378],[0.000013827,-0.000001363],[0.000013755,-0.000001348],[0.000013683,-0.000001333],[0.000013612,-0.000001318],[0.000013541,-0.000001302],[0.000013469,-0.000001286],[0.000013398,-0.000001269],[0.000013326,-0.000001250],[0.000013255,-0.000001231],[0.000013183,-0.000001211],[0.000013111,-0.000001190],[0.000013038,-0.000001169],[0.000012963,-0.000001147],[0.000012886,-0.000001123],[0.000012804,-0.000001098],[0.000012719,-0.000001072],[0.000012628,-0.000001044],[0.000012532,-0.000001016],[0.000012430,-0.000000988],[0.000012324,-0.000000961],[0.000012213,-0.000000937],[0.000012099,-0.000000916],[0.000011981,-0.000000898],[0.000011862,-0.000000883],[0.000011739,-0.000000873],[0.000011616,-0.000000867],[0.000011493,-0.000000864],[0.000011369,-0.000000865],[0.000011247,-0.000000869],[0.000011126,-0.000000877],[0.000011007,-0.000000888],[0.000010890,-0.000000901],[0.000010777,-0.000000917],[0.000010668,-0.000000935],[0.000010561,-0.000000955],[0.000010459,-0.000000976],[0.000010362,-0.000001000],[0.000010268,-0.000001024],[0.000010179,-0.000001050],[0.000010094,-0.000001077],[0.000010014,-0.000001104],[0.000009938,-0.000001132],[0.000009865,-0.000001160],[0.000009797,-0.000001188],[0.000009733,-0.000001216],[0.000009673,-0.000001244],[0.000009617,-0.000001272],[0.000009564,-0.000001299],[0.000009514,-0.000001326],[0.000009468,-0.000001353],[0.000009425,-0.000001379],[0.000009385,-0.000001404],[0.000009348,-0.000001429],[0.000009314,-0.000001453],[0.000009283,-0.000001477],[0.000009254,-0.000001500],[0.000009228,-0.000001522],[0.000009203,-0.000001543],[0.000009182,-0.000001563],[0.000009162,-0.000001583],[0.000009144,-0.000001601],[0.000009127,-0.000001619],[0.000009113,-0.000001636],[0.000009099,-0.000001652],[0.000009087,-0.000001667],[0.000009076,-0.000001681],[0.000009066,-0.000001695],[0.000009057,-0.000001708],[0.000009048,-0.000001719],[0.000009040,-0.000001731],[0.000009033,-0.000001741],[0.000009026,-0.000001751],[0.000009019,-0.000001760],[0.000009013,-0.000001769],[0.000009007,-0.000001777],[0.000009000,-0.000001785],[0.000008994,-0.000001792],[0.000008988,-0.000001799],[0.000008982,-0.000001806],[0.000008977,-0.000001813],[0.000008971,-0.000001819],[0.000008965,-0.000001825],[0.000008959,-0.000001831],[0.000008953,-0.000001837],[0.000008947,-0.000001843],[0.000008941,-0.000001849],[0.000008935,-0.000001854],[0.000008930,-0.000001860],[0.000008924,-0.000001865],[0.000008918,-0.000001871],[0.000019113,-0.000001896],[0.000019025,-0.000001896],[0.000018936,-0.000001896],[0.000018848,-0.000001897],[0.000018759,-0.000001897],[0.000018671,-0.000001898],[0.000018582,-0.000001898],[0.000018494,-0.000001899],[0.000018406,-0.000001899],[0.000018318,-0.000001900],[0.000018231,-0.000001900],[0.000018143,-0.000001901],[0.000018056,-0.000001901],[0.000017970,-0.000001901],[0.000017884,-0.000001901],[0.000017798,-0.000001901],[0.000017712,-0.000001900],[0.000017627,-0.000001899],[0.000017543,-0.000001898],[0.000017458,-0.000001896],[0.000017374,-0.000001895],[0.000017291,-0.000001893],[0.000017208,-0.000001890],[0.000017126,-0.000001887],[0.000017044,-0.000001883],[0.000016962,-0.000001880],[0.000016881,-0.000001875],[0.000016801,-0.000001871],[0.000016720,-0.000001865],[0.000016641,-0.000001860],[0.000016562,-0.000001854],[0.000016483,-0.000001847],[0.000016405,-0.000001840],[0.000016328,-0.000001832],[0.000016251,-0.000001824],[0.000016175,-0.000001815],[0.000016099,-0.000001806],[0.000016024,-0.000001797],[0.000015950,-0.000001786],[0.000015876,-0.000001776],[0.000015802,-0.000001765],[0.000015729,-0.000001753],[0.000015655,-0.000001741],[0.000015582,-0.000001728],[0.000015509,-0.000001715],[0.000015437,-0.000001701],[0.000015364,-0.000001687],[0.000015291,-0.000001673],[0.000015217,-0.000001658],[0.000015144,-0.000001642],[0.000015070,-0.000001627],[0.000014995,-0.000001611],[0.000014921,-0.000001595],[0.000014845,-0.000001578],[0.000014770,-0.000001562],[0.000014694,-0.000001545],[0.000014617,-0.000001529],[0.000014540,-0.000001512],[0.000014463,-0.000001496],[0.000014385,-0.000001479],[0.000014308,-0.000001463],[0.000014231,-0.000001447],[0.000014155,-0.000001431],[0.000014080,-0.000001416],[0.000014007,-0.000001401],[0.000013934,-0.000001386],[0.000013862,-0.000001371],[0.000013792,-0.000001355],[0.000013722,-0.000001340],[0.000013651,-0.000001324],[0.000013581,-0.000001308],[0.000013510,-0.000001290],[0.000013439,-0.000001273],[0.000013368,-0.000001254],[0.000013296,-0.000001234],[0.000013223,-0.000001213],[0.000013149,-0.000001192],[0.000013073,-0.000001169],[0.000012995,-0.000001146],[0.000012915,-0.000001121],[0.000012830,-0.000001096],[0.000012741,-0.000001069],[0.000012648,-0.000001041],[0.000012550,-0.000001014],[0.000012448,-0.000000987],[0.000012341,-0.000000962],[0.000012230,-0.000000938],[0.000012116,-0.000000916],[0.000011998,-0.000000898],[0.000011879,-0.000000883],[0.000011757,-0.000000871],[0.000011634,-0.000000863],[0.000011511,-0.000000859],[0.000011388,-0.000000858],[0.000011266,-0.000000860],[0.000011145,-0.000000866],[0.000011026,-0.000000875],[0.000010908,-0.000000886],[0.000010794,-0.000000900],[0.000010683,-0.000000917],[0.000010575,-0.000000935],[0.000010471,-0.000000956],[0.000010371,-0.000000978],[0.000010276,-0.000001002],[0.000010184,-0.000001027],[0.000010097,-0.000001053],[0.000010014,-0.000001080],[0.000009936,-0.000001108],[0.000009861,-0.000001136],[0.000009791,-0.000001165],[0.000009725,-0.000001193],[0.000009662,-0.000001222],[0.000009604,-0.000001251],[0.000009549,-0.000001279],[0.000009498,-0.000001308],[0.000009451,-0.000001336],[0.000009406,-0.000001363],[0.000009365,-0.000001390],[0.000009327,-0.000001416],[0.000009292,-0.000001442],[0.000009260,-0.000001468],[0.000009231,-0.000001492],[0.000009204,-0.000001516],[0.000009180,-0.000001539],[0.000009158,-0.000001561],[0.000009138,-0.000001583],[0.000009120,-0.000001603],[0.000009104,-0.000001623],[0.000009090,-0.000001641],[0.000009078,-0.000001659],[0.000009067,-0.000001676],[0.000009057,-0.000001692],[0.000009048,-0.000001707],[0.000009040,-0.000001722],[0.000009034,-0.000001735],[0.000009027,-0.000001748],[0.000009022,-0.000001760],[0.000009017,-0.000001771],[0.000009013,-0.000001782],[0.000009009,-0.000001792],[0.000009005,-0.000001801],[0.000009002,-0.000001810],[0.000008998,-0.000001819],[0.000008995,-0.000001827],[0.000008992,-0.000001835],[0.000008989,-0.000001842],[0.000008986,-0.000001850],[0.000008983,-0.000001857],[0.000008980,-0.000001864],[0.000008977,-0.000001870],[0.000008974,-0.000001877],[0.000008971,-0.000001883],[0.000008968,-0.000001890],[0.000008965,-0.000001896],[0.000008962,-0.000001902],[0.000008960,-0.000001908],[0.000019152,-0.000001900],[0.000019064,-0.000001900],[0.000018976,-0.000001901],[0.000018888,-0.000001902],[0.000018800,-0.000001903],[0.000018712,-0.000001904],[0.000018624,-0.000001905],[0.000018537,-0.000001906],[0.000018449,-0.000001907],[0.000018362,-0.000001908],[0.000018275,-0.000001909],[0.000018188,-0.000001910],[0.000018101,-0.000001910],[0.000018015,-0.000001911],[0.000017929,-0.000001911],[0.000017843,-0.000001911],[0.000017758,-0.000001910],[0.000017673,-0.000001910],[0.000017588,-0.000001908],[0.000017504,-0.000001907],[0.000017420,-0.000001905],[0.000017337,-0.000001903],[0.000017254,-0.000001900],[0.000017171,-0.000001897],[0.000017089,-0.000001893],[0.000017007,-0.000001889],[0.000016926,-0.000001885],[0.000016845,-0.000001879],[0.000016765,-0.000001874],[0.000016685,-0.000001868],[0.000016606,-0.000001861],[0.000016527,-0.000001854],[0.000016449,-0.000001846],[0.000016371,-0.000001838],[0.000016294,-0.000001830],[0.000016217,-0.000001821],[0.000016141,-0.000001811],[0.000016065,-0.000001801],[0.000015989,-0.000001790],[0.000015914,-0.000001779],[0.000015839,-0.000001768],[0.000015765,-0.000001756],[0.000015690,-0.000001743],[0.000015616,-0.000001730],[0.000015541,-0.000001717],[0.000015467,-0.000001703],[0.000015392,-0.000001689],[0.000015317,-0.000001674],[0.000015242,-0.000001659],[0.000015167,-0.000001644],[0.000015092,-0.000001628],[0.000015016,-0.000001613],[0.000014940,-0.000001597],[0.000014864,-0.000001581],[0.000014787,-0.000001565],[0.000014711,-0.000001549],[0.000014634,-0.000001533],[0.000014558,-0.000001517],[0.000014481,-0.000001501],[0.000014405,-0.000001485],[0.000014330,-0.000001469],[0.000014255,-0.000001454],[0.000014182,-0.000001438],[0.000014109,-0.000001423],[0.000014038,-0.000001408],[0.000013967,-0.000001393],[0.000013898,-0.000001378],[0.000013829,-0.000001362],[0.000013760,-0.000001346],[0.000013691,-0.000001330],[0.000013621,-0.000001313],[0.000013551,-0.000001295],[0.000013481,-0.000001276],[0.000013409,-0.000001256],[0.000013337,-0.000001235],[0.000013262,-0.000001214],[0.000013186,-0.000001192],[0.000013108,-0.000001169],[0.000013027,-0.000001144],[0.000012943,-0.000001119],[0.000012855,-0.000001092],[0.000012764,-0.000001066],[0.000012669,-0.000001039],[0.000012569,-0.000001012],[0.000012465,-0.000000986],[0.000012358,-0.000000961],[0.000012246,-0.000000937],[0.000012132,-0.000000916],[0.000012015,-0.000000897],[0.000011896,-0.000000882],[0.000011775,-0.000000869],[0.000011653,-0.000000860],[0.000011530,-0.000000854],[0.000011407,-0.000000851],[0.000011285,-0.000000852],[0.000011164,-0.000000855],[0.000011044,-0.000000862],[0.000010927,-0.000000872],[0.000010811,-0.000000884],[0.000010699,-0.000000899],[0.000010590,-0.000000916],[0.000010484,-0.000000935],[0.000010382,-0.000000956],[0.000010284,-0.000000979],[0.000010190,-0.000001003],[0.000010101,-0.000001029],[0.000010015,-0.000001056],[0.000009934,-0.000001083],[0.000009857,-0.000001112],[0.000009785,-0.000001141],[0.000009716,-0.000001170],[0.000009652,-0.000001200],[0.000009591,-0.000001230],[0.000009535,-0.000001259],[0.000009482,-0.000001289],[0.000009433,-0.000001318],[0.000009387,-0.000001347],[0.000009345,-0.000001375],[0.000009306,-0.000001403],[0.000009270,-0.000001431],[0.000009238,-0.000001458],[0.000009208,-0.000001484],[0.000009180,-0.000001510],[0.000009156,-0.000001534],[0.000009134,-0.000001558],[0.000009114,-0.000001582],[0.000009097,-0.000001604],[0.000009081,-0.000001625],[0.000009068,-0.000001646],[0.000009056,-0.000001666],[0.000009046,-0.000001684],[0.000009038,-0.000001702],[0.000009030,-0.000001719],[0.000009024,-0.000001735],[0.000009019,-0.000001750],[0.000009015,-0.000001765],[0.000009011,-0.000001778],[0.000009009,-0.000001791],[0.000009006,-0.000001803],[0.000009005,-0.000001814],[0.000009004,-0.000001825],[0.000009003,-0.000001835],[0.000009002,-0.000001845],[0.000009002,-0.000001854],[0.000009001,-0.000001863],[0.000009001,-0.000001872],[0.000009001,-0.000001880],[0.000009001,-0.000001888],[0.000009001,-0.000001896],[0.000009001,-0.000001903],[0.000009001,-0.000001911],[0.000009001,-0.000001918],[0.000009001,-0.000001925],[0.000009001,-0.000001932],[0.000009001,-0.000001939],[0.000009001,-0.000001946],[0.000019192,-0.000001904],[0.000019104,-0.000001905],[0.000019017,-0.000001906],[0.000018929,-0.000001907],[0.000018842,-0.000001909],[0.000018755,-0.000001910],[0.000018667,-0.000001912],[0.000018580,-0.000001913],[0.000018493,-0.000001915],[0.000018406,-0.000001916],[0.000018319,-0.000001917],[0.000018233,-0.000001918],[0.000018146,-0.000001919],[0.000018060,-0.000001920],[0.000017974,-0.000001920],[0.000017889,-0.000001920],[0.000017804,-0.000001920],[0.000017719,-0.000001919],[0.000017634,-0.000001918],[0.000017550,-0.000001917],[0.000017466,-0.000001915],[0.000017383,-0.000001913],[0.000017300,-0.000001910],[0.000017217,-0.000001906],[0.000017135,-0.000001902],[0.000017053,-0.000001898],[0.000016972,-0.000001893],[0.000016890,-0.000001888],[0.000016810,-0.000001882],[0.000016730,-0.000001875],[0.000016650,-0.000001868],[0.000016571,-0.000001861],[0.000016492,-0.000001853],[0.000016414,-0.000001844],[0.000016337,-0.000001835],[0.000016259,-0.000001825],[0.000016182,-0.000001815],[0.000016106,-0.000001805],[0.000016029,-0.000001794],[0.000015953,-0.000001782],[0.000015877,-0.000001770],[0.000015801,-0.000001758],[0.000015725,-0.000001745],[0.000015649,-0.000001732],[0.000015573,-0.000001718],[0.000015497,-0.000001704],[0.000015421,-0.000001690],[0.000015344,-0.000001675],[0.000015268,-0.000001660],[0.000015191,-0.000001645],[0.000015114,-0.000001630],[0.000015037,-0.000001614],[0.000014960,-0.000001599],[0.000014882,-0.000001583],[0.000014805,-0.000001568],[0.000014728,-0.000001552],[0.000014652,-0.000001536],[0.000014576,-0.000001521],[0.000014501,-0.000001505],[0.000014426,-0.000001490],[0.000014352,-0.000001475],[0.000014280,-0.000001460],[0.000014209,-0.000001445],[0.000014138,-0.000001430],[0.000014069,-0.000001415],[0.000014001,-0.000001400],[0.000013933,-0.000001384],[0.000013866,-0.000001368],[0.000013799,-0.000001352],[0.000013731,-0.000001335],[0.000013662,-0.000001317],[0.000013593,-0.000001298],[0.000013522,-0.000001278],[0.000013450,-0.000001258],[0.000013377,-0.000001236],[0.000013301,-0.000001214],[0.000013223,-0.000001191],[0.000013142,-0.000001167],[0.000013058,-0.000001142],[0.000012971,-0.000001116],[0.000012881,-0.000001089],[0.000012787,-0.000001062],[0.000012689,-0.000001036],[0.000012588,-0.000001010],[0.000012483,-0.000000984],[0.000012374,-0.000000960],[0.000012263,-0.000000937],[0.000012148,-0.000000916],[0.000012031,-0.000000897],[0.000011913,-0.000000880],[0.000011792,-0.000000867],[0.000011671,-0.000000856],[0.000011549,-0.000000848],[0.000011426,-0.000000844],[0.000011304,-0.000000843],[0.000011183,-0.000000844],[0.000011063,-0.000000849],[0.000010945,-0.000000857],[0.000010829,-0.000000867],[0.000010715,-0.000000880],[0.000010605,-0.000000896],[0.000010497,-0.000000914],[0.000010393,-0.000000934],[0.000010293,-0.000000956],[0.000010197,-0.000000979],[0.000010105,-0.000001004],[0.000010017,-0.000001031],[0.000009933,-0.000001059],[0.000009854,-0.000001087],[0.000009779,-0.000001117],[0.000009708,-0.000001147],[0.000009642,-0.000001177],[0.000009579,-0.000001208],[0.000009521,-0.000001238],[0.000009466,-0.000001269],[0.000009415,-0.000001300],[0.000009368,-0.000001330],[0.000009325,-0.000001360],[0.000009285,-0.000001390],[0.000009248,-0.000001419],[0.000009215,-0.000001448],[0.000009184,-0.000001476],[0.000009157,-0.000001503],[0.000009132,-0.000001529],[0.000009110,-0.000001555],[0.000009091,-0.000001580],[0.000009074,-0.000001604],[0.000009059,-0.000001628],[0.000009046,-0.000001650],[0.000009035,-0.000001671],[0.000009026,-0.000001692],[0.000009018,-0.000001712],[0.000009012,-0.000001730],[0.000009008,-0.000001748],[0.000009004,-0.000001765],[0.000009002,-0.000001781],[0.000009000,-0.000001796],[0.000009000,-0.000001810],[0.000009000,-0.000001824],[0.000009001,-0.000001836],[0.000009002,-0.000001848],[0.000009004,-0.000001860],[0.000009006,-0.000001871],[0.000009008,-0.000001881],[0.000009011,-0.000001891],[0.000009013,-0.000001901],[0.000009016,-0.000001910],[0.000009019,-0.000001919],[0.000009022,-0.000001927],[0.000009025,-0.000001936],[0.000009028,-0.000001944],[0.000009031,-0.000001952],[0.000009034,-0.000001960],[0.000009037,-0.000001968],[0.000009040,-0.000001975],[0.000009043,-0.000001983],[0.000019232,-0.000001907],[0.000019145,-0.000001908],[0.000019057,-0.000001910],[0.000018970,-0.000001912],[0.000018884,-0.000001914],[0.000018797,-0.000001916],[0.000018710,-0.000001918],[0.000018623,-0.000001920],[0.000018537,-0.000001922],[0.000018450,-0.000001924],[0.000018364,-0.000001925],[0.000018278,-0.000001926],[0.000018192,-0.000001928],[0.000018106,-0.000001929],[0.000018020,-0.000001929],[0.000017935,-0.000001930],[0.000017850,-0.000001929],[0.000017765,-0.000001929],[0.000017681,-0.000001928],[0.000017597,-0.000001926],[0.000017513,-0.000001924],[0.000017429,-0.000001922],[0.000017346,-0.000001919],[0.000017263,-0.000001915],[0.000017181,-0.000001911],[0.000017099,-0.000001906],[0.000017017,-0.000001901],[0.000016936,-0.000001895],[0.000016855,-0.000001889],[0.000016775,-0.000001882],[0.000016695,-0.000001875],[0.000016616,-0.000001867],[0.000016536,-0.000001858],[0.000016458,-0.000001849],[0.000016380,-0.000001840],[0.000016302,-0.000001829],[0.000016224,-0.000001819],[0.000016146,-0.000001808],[0.000016069,-0.000001796],[0.000015992,-0.000001784],[0.000015915,-0.000001772],[0.000015837,-0.000001759],[0.000015760,-0.000001746],[0.000015683,-0.000001733],[0.000015605,-0.000001719],[0.000015527,-0.000001704],[0.000015449,-0.000001690],[0.000015371,-0.000001675],[0.000015293,-0.000001660],[0.000015214,-0.000001646],[0.000015136,-0.000001631],[0.000015057,-0.000001615],[0.000014979,-0.000001600],[0.000014901,-0.000001585],[0.000014823,-0.000001570],[0.000014746,-0.000001555],[0.000014670,-0.000001540],[0.000014595,-0.000001525],[0.000014520,-0.000001510],[0.000014447,-0.000001495],[0.000014376,-0.000001481],[0.000014305,-0.000001466],[0.000014236,-0.000001451],[0.000014168,-0.000001437],[0.000014101,-0.000001421],[0.000014035,-0.000001406],[0.000013969,-0.000001390],[0.000013904,-0.000001374],[0.000013837,-0.000001357],[0.000013771,-0.000001339],[0.000013703,-0.000001320],[0.000013634,-0.000001301],[0.000013563,-0.000001280],[0.000013491,-0.000001259],[0.000013417,-0.000001236],[0.000013339,-0.000001213],[0.000013259,-0.000001189],[0.000013176,-0.000001164],[0.000013089,-0.000001138],[0.000013000,-0.000001112],[0.000012907,-0.000001085],[0.000012810,-0.000001059],[0.000012710,-0.000001032],[0.000012607,-0.000001007],[0.000012500,-0.000000982],[0.000012391,-0.000000958],[0.000012279,-0.000000935],[0.000012164,-0.000000914],[0.000012048,-0.000000895],[0.000011929,-0.000000878],[0.000011810,-0.000000864],[0.000011689,-0.000000852],[0.000011567,-0.000000843],[0.000011445,-0.000000837],[0.000011323,-0.000000833],[0.000011202,-0.000000833],[0.000011082,-0.000000836],[0.000010963,-0.000000842],[0.000010846,-0.000000850],[0.000010732,-0.000000862],[0.000010619,-0.000000876],[0.000010510,-0.000000892],[0.000010404,-0.000000911],[0.000010302,-0.000000932],[0.000010203,-0.000000955],[0.000010109,-0.000000980],[0.000010019,-0.000001006],[0.000009932,-0.000001033],[0.000009851,-0.000001062],[0.000009773,-0.000001092],[0.000009700,-0.000001122],[0.000009631,-0.000001154],[0.000009567,-0.000001185],[0.000009506,-0.000001217],[0.000009450,-0.000001249],[0.000009398,-0.000001281],[0.000009349,-0.000001313],[0.000009305,-0.000001344],[0.000009264,-0.000001375],[0.000009226,-0.000001406],[0.000009192,-0.000001437],[0.000009161,-0.000001466],[0.000009133,-0.000001495],[0.000009108,-0.000001524],[0.000009086,-0.000001552],[0.000009067,-0.000001578],[0.000009050,-0.000001604],[0.000009036,-0.000001630],[0.000009023,-0.000001654],[0.000009013,-0.000001677],[0.000009005,-0.000001699],[0.000008999,-0.000001721],[0.000008994,-0.000001741],[0.000008991,-0.000001760],[0.000008989,-0.000001779],[0.000008989,-0.000001796],[0.000008990,-0.000001813],[0.000008991,-0.000001829],[0.000008994,-0.000001844],[0.000008997,-0.000001858],[0.000009000,-0.000001871],[0.000009005,-0.000001884],[0.000009010,-0.000001896],[0.000009015,-0.000001908],[0.000009020,-0.000001919],[0.000009025,-0.000001929],[0.000009031,-0.000001939],[0.000009037,-0.000001949],[0.000009043,-0.000001958],[0.000009049,-0.000001968],[0.000009055,-0.000001977],[0.000009061,-0.000001985],[0.000009067,-0.000001994],[0.000009074,-0.000002003],[0.000009080,-0.000002011],[0.000009086,-0.000002019],[0.000019271,-0.000001910],[0.000019185,-0.000001912],[0.000019098,-0.000001914],[0.000019012,-0.000001916],[0.000018926,-0.000001919],[0.000018839,-0.000001921],[0.000018753,-0.000001924],[0.000018667,-0.000001926],[0.000018581,-0.000001928],[0.000018495,-0.000001931],[0.000018409,-0.000001932],[0.000018323,-0.000001934],[0.000018237,-0.000001936],[0.000018152,-0.000001937],[0.000018066,-0.000001938],[0.000017981,-0.000001938],[0.000017897,-0.000001938],[0.000017812,-0.000001938],[0.000017727,-0.000001937],[0.000017643,-0.000001935],[0.000017559,-0.000001933],[0.000017476,-0.000001931],[0.000017392,-0.000001928],[0.000017309,-0.000001924],[0.000017227,-0.000001919],[0.000017145,-0.000001914],[0.000017063,-0.000001909],[0.000016982,-0.000001903],[0.000016901,-0.000001896],[0.000016820,-0.000001889],[0.000016740,-0.000001881],[0.000016660,-0.000001872],[0.000016581,-0.000001863],[0.000016502,-0.000001854],[0.000016423,-0.000001844],[0.000016344,-0.000001833],[0.000016266,-0.000001822],[0.000016187,-0.000001811],[0.000016109,-0.000001799],[0.000016031,-0.000001786],[0.000015953,-0.000001773],[0.000015874,-0.000001760],[0.000015795,-0.000001747],[0.000015716,-0.000001733],[0.000015637,-0.000001719],[0.000015558,-0.000001705],[0.000015478,-0.000001690],[0.000015398,-0.000001675],[0.000015318,-0.000001661],[0.000015238,-0.000001646],[0.000015158,-0.000001631],[0.000015078,-0.000001616],[0.000014999,-0.000001601],[0.000014920,-0.000001586],[0.000014842,-0.000001572],[0.000014765,-0.000001557],[0.000014688,-0.000001543],[0.000014614,-0.000001528],[0.000014541,-0.000001514],[0.000014469,-0.000001500],[0.000014399,-0.000001486],[0.000014331,-0.000001472],[0.000014264,-0.000001457],[0.000014198,-0.000001443],[0.000014133,-0.000001427],[0.000014069,-0.000001412],[0.000014005,-0.000001396],[0.000013941,-0.000001379],[0.000013876,-0.000001361],[0.000013811,-0.000001343],[0.000013744,-0.000001323],[0.000013676,-0.000001303],[0.000013605,-0.000001282],[0.000013532,-0.000001259],[0.000013456,-0.000001236],[0.000013377,-0.000001212],[0.000013295,-0.000001187],[0.000013210,-0.000001161],[0.000013121,-0.000001135],[0.000013028,-0.000001108],[0.000012932,-0.000001081],[0.000012833,-0.000001055],[0.000012731,-0.000001029],[0.000012626,-0.000001003],[0.000012518,-0.000000979],[0.000012408,-0.000000956],[0.000012295,-0.000000933],[0.000012181,-0.000000912],[0.000012065,-0.000000893],[0.000011946,-0.000000876],[0.000011827,-0.000000860],[0.000011707,-0.000000847],[0.000011586,-0.000000837],[0.000011464,-0.000000829],[0.000011343,-0.000000824],[0.000011222,-0.000000822],[0.000011101,-0.000000823],[0.000010982,-0.000000826],[0.000010864,-0.000000833],[0.000010748,-0.000000843],[0.000010634,-0.000000855],[0.000010524,-0.000000870],[0.000010416,-0.000000888],[0.000010311,-0.000000908],[0.000010210,-0.000000930],[0.000010114,-0.000000954],[0.000010021,-0.000000980],[0.000009932,-0.000001008],[0.000009848,-0.000001036],[0.000009768,-0.000001067],[0.000009692,-0.000001098],[0.000009621,-0.000001130],[0.000009555,-0.000001162],[0.000009492,-0.000001195],[0.000009434,-0.000001228],[0.000009380,-0.000001261],[0.000009330,-0.000001295],[0.000009285,-0.000001328],[0.000009242,-0.000001361],[0.000009204,-0.000001393],[0.000009169,-0.000001425],[0.000009138,-0.000001457],[0.000009109,-0.000001488],[0.000009084,-0.000001518],[0.000009062,-0.000001547],[0.000009043,-0.000001576],[0.000009026,-0.000001604],[0.000009012,-0.000001631],[0.000009001,-0.000001657],[0.000008992,-0.000001682],[0.000008985,-0.000001706],[0.000008979,-0.000001729],[0.000008976,-0.000001751],[0.000008975,-0.000001772],[0.000008975,-0.000001792],[0.000008976,-0.000001812],[0.000008979,-0.000001830],[0.000008982,-0.000001847],[0.000008987,-0.000001863],[0.000008993,-0.000001879],[0.000008999,-0.000001894],[0.000009006,-0.000001908],[0.000009013,-0.000001921],[0.000009021,-0.000001933],[0.000009029,-0.000001945],[0.000009038,-0.000001957],[0.000009046,-0.000001968],[0.000009055,-0.000001979],[0.000009064,-0.000001989],[0.000009073,-0.000001999],[0.000009082,-0.000002009],[0.000009091,-0.000002018],[0.000009101,-0.000002028],[0.000009110,-0.000002037],[0.000009119,-0.000002046],[0.000009128,-0.000002055],[0.000019311,-0.000001912],[0.000019226,-0.000001914],[0.000019140,-0.000001917],[0.000019054,-0.000001920],[0.000018968,-0.000001923],[0.000018882,-0.000001926],[0.000018796,-0.000001929],[0.000018711,-0.000001932],[0.000018625,-0.000001934],[0.000018539,-0.000001937],[0.000018454,-0.000001939],[0.000018368,-0.000001941],[0.000018283,-0.000001943],[0.000018198,-0.000001945],[0.000018113,-0.000001946],[0.000018028,-0.000001946],[0.000017943,-0.000001946],[0.000017859,-0.000001946],[0.000017774,-0.000001945],[0.000017690,-0.000001944],[0.000017606,-0.000001942],[0.000017522,-0.000001939],[0.000017439,-0.000001935],[0.000017356,-0.000001932],[0.000017273,-0.000001927],[0.000017191,-0.000001922],[0.000017109,-0.000001916],[0.000017027,-0.000001909],[0.000016946,-0.000001902],[0.000016866,-0.000001895],[0.000016785,-0.000001886],[0.000016705,-0.000001877],[0.000016625,-0.000001868],[0.000016546,-0.000001858],[0.000016466,-0.000001847],[0.000016387,-0.000001836],[0.000016308,-0.000001825],[0.000016229,-0.000001813],[0.000016150,-0.000001800],[0.000016070,-0.000001788],[0.000015991,-0.000001774],[0.000015911,-0.000001761],[0.000015831,-0.000001747],[0.000015750,-0.000001733],[0.000015669,-0.000001719],[0.000015588,-0.000001704],[0.000015507,-0.000001689],[0.000015425,-0.000001675],[0.000015343,-0.000001660],[0.000015262,-0.000001645],[0.000015180,-0.000001631],[0.000015099,-0.000001616],[0.000015018,-0.000001601],[0.000014939,-0.000001587],[0.000014860,-0.000001573],[0.000014783,-0.000001559],[0.000014707,-0.000001545],[0.000014633,-0.000001531],[0.000014561,-0.000001517],[0.000014491,-0.000001504],[0.000014423,-0.000001490],[0.000014357,-0.000001476],[0.000014292,-0.000001462],[0.000014229,-0.000001448],[0.000014166,-0.000001433],[0.000014104,-0.000001417],[0.000014041,-0.000001401],[0.000013979,-0.000001383],[0.000013916,-0.000001365],[0.000013852,-0.000001346],[0.000013785,-0.000001326],[0.000013717,-0.000001305],[0.000013647,-0.000001282],[0.000013573,-0.000001259],[0.000013496,-0.000001235],[0.000013416,-0.000001210],[0.000013331,-0.000001184],[0.000013244,-0.000001157],[0.000013152,-0.000001130],[0.000013056,-0.000001103],[0.000012958,-0.000001077],[0.000012856,-0.000001050],[0.000012752,-0.000001025],[0.000012645,-0.000001000],[0.000012536,-0.000000976],[0.000012425,-0.000000953],[0.000012312,-0.000000931],[0.000012197,-0.000000910],[0.000012081,-0.000000891],[0.000011964,-0.000000873],[0.000011845,-0.000000857],[0.000011725,-0.000000842],[0.000011604,-0.000000830],[0.000011483,-0.000000821],[0.000011362,-0.000000814],[0.000011241,-0.000000810],[0.000011120,-0.000000809],[0.000011000,-0.000000811],[0.000010882,-0.000000815],[0.000010765,-0.000000823],[0.000010650,-0.000000834],[0.000010537,-0.000000848],[0.000010427,-0.000000864],[0.000010321,-0.000000883],[0.000010218,-0.000000905],[0.000010118,-0.000000928],[0.000010023,-0.000000954],[0.000009932,-0.000000981],[0.000009845,-0.000001010],[0.000009762,-0.000001041],[0.000009684,-0.000001072],[0.000009611,-0.000001105],[0.000009542,-0.000001139],[0.000009478,-0.000001173],[0.000009418,-0.000001207],[0.000009363,-0.000001242],[0.000009311,-0.000001276],[0.000009264,-0.000001311],[0.000009221,-0.000001345],[0.000009182,-0.000001380],[0.000009146,-0.000001413],[0.000009114,-0.000001447],[0.000009086,-0.000001479],[0.000009060,-0.000001511],[0.000009038,-0.000001542],[0.000009019,-0.000001573],[0.000009003,-0.000001603],[0.000008989,-0.000001631],[0.000008979,-0.000001659],[0.000008970,-0.000001686],[0.000008964,-0.000001712],[0.000008960,-0.000001737],[0.000008958,-0.000001761],[0.000008958,-0.000001784],[0.000008960,-0.000001805],[0.000008963,-0.000001826],[0.000008968,-0.000001846],[0.000008974,-0.000001865],[0.000008981,-0.000001882],[0.000008989,-0.000001899],[0.000008998,-0.000001915],[0.000009007,-0.000001931],[0.000009017,-0.000001945],[0.000009028,-0.000001959],[0.000009039,-0.000001972],[0.000009050,-0.000001984],[0.000009062,-0.000001996],[0.000009074,-0.000002008],[0.000009085,-0.000002019],[0.000009097,-0.000002030],[0.000009110,-0.000002041],[0.000009122,-0.000002051],[0.000009134,-0.000002061],[0.000009146,-0.000002071],[0.000009159,-0.000002081],[0.000009171,-0.000002091]]};
