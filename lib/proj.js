goog.provide('Proj4js.Proj');

/**
 * Class: Proj4js.Proj
 *
 * Proj objects provide transformation methods for point coordinates
 * between geodetic latitude/longitude and a projected coordinate system. 
 * once they have been initialized with a projection code.
 *
 * Initialization of Proj objects is with a projection code, usually EPSG codes,
 * which is the key that will be used with the Proj4js.defs array.  The EPSG
 * code can also be parsed from urn and url strings. The resulting code is used
 * as a key to the Proj4js.defs object to retrieve initialization data.
 * 
 * The input string can also be a WKT string and all projection parameters are
 * contained within it and parsed out for use by Proj4js.
 * 
 * A projection object has exported properties for units and title strings.
 */
 /**
 * Constructor for Proj4js.Proj objects
 *
 * Parameters:
 * @param {!string} inputStr - a code for map projection definition parameters.  These are usually
 * 							(but not always) EPSG codes.
 * @constructor
 */
Proj4js.Proj = function(inputStr) {
  
  /**
   * Property: title
   * The title to describe the projection
   * @type {string}
   */
  this.title = '';
  
  /**
   * Property: projName
   * The projection class for this projection, (e.g. lcc for lambert conformal conic,
   * or merc for mercator).  These are exactly equivalent to their Proj4 
   * counterparts.
   * @type {string}
   */
  this.projName = '';

  /**
   * Property: units
   * The units of the projection.  Values include 'm' and 'degrees'
   * @type {string}
   */
  this.units = '';

  /**
   * Property: datum
   * The datum specified for the projection
   * @type {Proj4js.Datum}
   */
  this.datum = null;
  /**
   * Property: x0
   * The x coordinate origin
   * @type {number}
   */
  this.x0 = 0;

  /**
   * Property: y0
   * The y coordinate origin
   * @type {number}
   */
  this.y0 = 0;

  /**
   * Property: srsCode
   * The code used to look up projection init parameters from Proj4js.defs
   * @type {string}
   */
  this.srsCode = '';

  /**
   * Property: localCS
   * Flag to indicate if the projection is a local one in which no transforms
   * are required.
   * @type {boolean}
   */
   this.localCS = false;
	
      //check to see if this is a WKT string
      if ((inputStr.indexOf('GEOGCS') >= 0) ||
          (inputStr.indexOf('GEOCCS') >= 0) ||
          (inputStr.indexOf('PROJCS') >= 0) ||
          (inputStr.indexOf('LOCAL_CS') >= 0)) {
            this.parseWKT(inputStr);
		  	this.initTransforms();
      }
      
      // DGR 2008-08-03 : support urn and url
      if (inputStr.indexOf('urn:') == 0) {
          //urn:ORIGINATOR:def:crs:CODESPACE:VERSION:ID
          var urn = inputStr.split(':');
          if ((urn[1] == 'ogc' || urn[1] =='x-ogc') &&
              (urn[2] =='def') &&
              (urn[3] =='crs')) {
              this.srsCode = urn[4]+':'+urn[urn.length-1];
          }
      } else if (inputStr.indexOf('http://') == 0) {
          //url#ID
          var url = inputStr.split('#');
          if (url[0].match(/epsg.org/)) {
            // http://www.epsg.org/#
            this.srsCode = 'EPSG:'+url[1];
          } else if (url[0].match(/RIG.xml/)) {
            //http://librairies.ign.fr/geoportail/resources/RIG.xml#
            //http://interop.ign.fr/registers/ign/RIG.xml#
            this.srsCode = 'IGNF:'+url[1];
	      } else if (url[0].indexOf('/def/crs/')!=-1) { 
	         // http://www.opengis.net/def/crs/EPSG/0/code 
	         url= inputStr.split('/'); 
	         var code = url.pop();//code 
	         url.pop();//version FIXME 
	         this.srsCode = url.pop()+':'+code;//authority 
		  }
      } else {
		this.srsCode = inputStr;
	  }
      this.srsCode = this.srsCode.toUpperCase();
      if (this.srsCode.indexOf("EPSG") == 0) {
          this.srsAuth = 'epsg';
          this.srsProjNumber = this.srsCode.substring(5);
      // DGR 2007-11-20 : authority IGNF
      } else if (this.srsCode.indexOf("IGNF") == 0) {
          this.srsAuth = 'IGNF';
          this.srsProjNumber = this.srsCode.substring(5);
      // DGR 2008-06-19 : pseudo-authority CRS for WMS
      } else if (this.srsCode.indexOf("CRS") == 0) {
          this.srsAuth = 'CRS';
          this.srsProjNumber = this.srsCode.substring(4);
      } else {
          this.srsAuth = '';
          this.srsProjNumber = this.srsCode;
      }
      
      if (Proj4js.defs[this.srsCode]) {
		  //Proj4js.reportError('projection definitions for: '+this.srsCode+' found.');
	      this.parseDefs(Proj4js.defs[this.srsCode]);
		  this.initTransforms();
      } else {
		  Proj4js.reportError('projection definitions for: '+this.srsCode+' not found.');
	  }
};
  

/**
 * Function: initTransforms
 *    Finalize the initialization of the Proj object
 *
 */
Proj4js.Proj.prototype.initTransforms = function() {
      this.deriveConstants();

	  var transform = Proj4js.Proj[this.projName];
	  if (transform) {
		  //Proj4js.reportError('projection '+this.projName+' found');
	      this.transform = new transform(this);
	  } else {
		  Proj4js.reportError('projection '+this.projName+' not supported in this build of Proj4js');
	  }
};

/**
 * Function: parseWKT
 * Parses a WKT string to get initialization parameters
 *
 * @param {!string} wkt - the string to be parsed
 *
 */
Proj4js.Proj.prototype.parseWKT = function(wkt) {
 	var wktRE = /^(\w+)\[(.*)\]$/;
    var wktMatch = wkt.match(wktRE);
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
        this.projName = 'identity'
        this.localCS = true;
        this.srsCode = wktName;
        break;
      case 'GEOGCS':
        this.projName = 'longlat'
        this.geocsCode = wktName;
        if (!this.srsCode) this.srsCode = wktName;
        break;
      case 'PROJCS':
        this.srsCode = wktName;
        break;
      case 'GEOCCS':
        break;
      case 'PROJECTION':
        this.projName = Proj4js.wktProjections[wktName]
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
};

/**
 * Function: parseDefs
 * Parses the PROJ.4 initialization string from a PROJ.4 initialization string
 * and sets the associated properties.
 *
 * @param {!string} proj4Str - the string to be parsed
 */
Proj4js.Proj.prototype.parseDefs = function(proj4Str) {
      var paramName, paramVal;
      var paramArray = proj4Str.split("+");

      for (var prop=0; prop<paramArray.length; prop++) {
          var property = paramArray[prop].split("=");
          paramName = property[0].toLowerCase();
          paramVal = property[1];

          switch (paramName.replace(/\s/gi,"")) {  // trim out spaces
              case "": break;   // throw away nameless parameter
              case "title":  this['title'] = paramVal.replace(/\s/gi,""); break;
              case "proj":   this.projName = paramVal.replace(/\s/gi,""); break;
              case "units":  this['units'] = paramVal.replace(/\s/gi,""); break;
              case "datum":  this.datumCode = paramVal.replace(/\s/gi,""); break;
              case "nadgrids": this.nagrids = paramVal.replace(/\s/gi,""); break;
              case "ellps":  this['ellps'] = paramVal.replace(/\s/gi,""); break;
              case "a":      this.a =  parseFloat(paramVal); break;  // semi-major radius
              case "b":      this.b =  parseFloat(paramVal); break;  // semi-minor radius
              // DGR 2007-11-20
              case "rf":     this.rf = parseFloat(paramVal); break; // inverse flattening rf= a/(a-b)
              case "lat_0":  this.lat0 = paramVal*Proj4js.common.D2R; break;        // phi0, central latitude
              case "lat_1":  this.lat1 = paramVal*Proj4js.common.D2R; break;        //standard parallel 1
              case "lat_2":  this.lat2 = paramVal*Proj4js.common.D2R; break;        //standard parallel 2
              case "lat_ts": this.lat_ts = paramVal*Proj4js.common.D2R; break;      // used in merc and eqc
              case "lon_0":  this.long0 = paramVal*Proj4js.common.D2R; break;       // lam0, central longitude
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
                             break
              case "no_defs": break; 
              default: //alert("Unrecognized parameter: " + paramName);
          } // switch()
      } // for paramArray
};

/**
 * Function: deriveConstants
 * Sets several derived constant values and initialization of datum and ellipse
 *     parameters.
 *
 */
Proj4js.Proj.prototype.deriveConstants = function() {
      if (this.nagrids == '@null') this.datumCode = 'none';
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
          goog.mixin(this, ellipse);
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

      this.datum = new Proj4js.Datum(this);
};


/**
 * @param {Proj4js.Proj} proj
 * @implements {Proj4js.Proj.transform}
 * @constructor
 */
Proj4js.Proj.identity = function (proj) {
    //no-op for longlat
};
/**
* @param {!Proj4js.Point|{x: !number,y: !number,z: ?number}} pt the lat long input value
* @return {Proj4js.Point|{x: !number,y: !number,z: ?number}} the point x,y transformed.
 */
Proj4js.Proj.identity.prototype.forward = function(pt) {
    //identity transform
    return pt;
};
/**
* @param {!Proj4js.Point|{x: !number,y: !number,z: ?number}} pt the x,y input value
* @return {Proj4js.Point|{x: !number,y: !number,z: ?number}} the lat long point transformed.
*/
Proj4js.Proj.identity.prototype.inverse = function(pt) {
    //identity transform
    return pt;
};


/**
 * @param {Proj4js.Proj} proj
 * @implements {Proj4js.Proj.transform}
 * @constructor
 */
Proj4js.Proj.longlat = function (proj) {
    //no-op for longlat
};
/**
* @param {!Proj4js.Point|{x: !number,y: !number,z: ?number}} pt the lat long input value
* @return {Proj4js.Point|{x: !number,y: !number,z: ?number}} the point x,y transformed.
*/
Proj4js.Proj.longlat.prototype.forward = function(pt) {
    //identity transform
    return pt;
};
/**
* @param {!Proj4js.Point|{x: !number,y: !number,z: ?number}} pt the x,y input value
* @return {Proj4js.Point|{x: !number,y: !number,z: ?number}} the lat long point transformed.
*/
Proj4js.Proj.longlat.prototype.inverse = function(pt) {
    //identity transform
    return pt;
};

