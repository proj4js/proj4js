/**
 * Class: proj4.Proj
 *
 * Proj objects provide transformation methods for point coordinates
 * between geodetic latitude/longitude and a projected coordinate system. 
 * once they have been initialized with a projection code.
 *
 * Initialization of Proj objects is with a projection code, usually EPSG codes,
 * which is the key that will be used with the proj4.defs array.
 * 
 * The code passed in will be stripped of colons and converted to uppercase
 * to locate projection definition files.
 *
 * A projection object has properties for units and title strings.
 */
proj4.Proj = proj4.Class({

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
   * Constructor for proj4.Proj objects
   *
   * Parameters:
   * srsCode - a code for map projection definition parameters.  These are usually
   * (but not always) EPSG codes.
   */
  initialize: function(srsCode, callback) {
    this.srsCodeInput = srsCode;

    //Register callbacks prior to attempting to process definition
    this.queue = [];
    if (callback) {
      this.queue.push(callback);
    }

    //check to see if this is a WKT string
    if ((srsCode.indexOf('GEOGCS') >= 0) || (srsCode.indexOf('GEOCCS') >= 0) || (srsCode.indexOf('PROJCS') >= 0) || (srsCode.indexOf('LOCAL_CS') >= 0)) {
      this.parseWKT(srsCode);
      this.deriveConstants();
      //this.loadProjCode(this.projName);

    }
    else {

      // DGR 2008-08-03 : support urn and url
      if (srsCode.indexOf('urn:') === 0) {
        //urn:ORIGINATOR:def:crs:CODESPACE:VERSION:ID
        var urn = srsCode.split(':');
        if ((urn[1] === 'ogc' || urn[1] === 'x-ogc') && (urn[2] === 'def') && (urn[3] === 'crs')) {
          srsCode = urn[4] + ':' + urn[urn.length - 1];
        }
      }
      else if (srsCode.indexOf('http://') === 0) {
        //url#ID
        var url = srsCode.split('#');
        if (url[0].match(/epsg.org/)) {
          // http://www.epsg.org/#
          srsCode = 'EPSG:' + url[1];
        }
        else if (url[0].match(/RIG.xml/)) {
          //http://librairies.ign.fr/geoportail/resources/RIG.xml#
          //http://interop.ign.fr/registers/ign/RIG.xml#
          srsCode = 'IGNF:' + url[1];
        }
        else if (url[0].indexOf('/def/crs/') !== -1) {
          // http://www.opengis.net/def/crs/EPSG/0/code
          url = srsCode.split('/');
          srsCode = url.pop(); //code
          url.pop(); //version FIXME
          srsCode = url.pop() + ':' + srsCode; //authority
        }
      }
      this.srsCode = srsCode.toUpperCase();
      if (this.srsCode.indexOf("EPSG") === 0) {
        this.srsCode = this.srsCode;
        this.srsAuth = 'epsg';
        this.srsProjNumber = this.srsCode.substring(5);
        // DGR 2007-11-20 : authority IGNF
      }
      else if (this.srsCode.indexOf("IGNF") === 0) {
        this.srsCode = this.srsCode;
        this.srsAuth = 'IGNF';
        this.srsProjNumber = this.srsCode.substring(5);
        // DGR 2008-06-19 : pseudo-authority CRS for WMS
      }
      else if (this.srsCode.indexOf("CRS") === 0) {
        this.srsCode = this.srsCode;
        this.srsAuth = 'CRS';
        this.srsProjNumber = this.srsCode.substring(4);
      }
      else {
        this.srsAuth = '';
        this.srsProjNumber = this.srsCode;
      }

      this.parseDefs();
    }
    this.initTransforms();
  },

  /**
   * Function: initTransforms
   *    Finalize the initialization of the Proj object
   *
   */
  initTransforms: function() {
    if (!(this.projName in proj4.Proj)) {
      throw ("unknown projection");
    }
    proj4.extend(this, proj4.Proj[this.projName]);
    this.init();
    if (this.queue) {
      var item;
      while ((item = this.queue.shift())) {
        item.call(this, this);
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
    if (!wktMatch){
      return;
    }
    var wktObject = wktMatch[1];
    var wktContent = wktMatch[2];
    var wktTemp = wktContent.split(",");
    var wktName;
    if (wktObject.toUpperCase() === "TOWGS84") {
      wktName = wktObject; //no name supplied for the TOWGS84 array
    }
    else {
      wktName = wktTemp.shift();
    }
    wktName = wktName.replace(/^\"/, "");
    wktName = wktName.replace(/\"$/, "");

    /*
    wktContent = wktTemp.join(",");
    var wktArray = wktContent.split("],");
    for (var i=0; i<wktArray.length-1; ++i) {
      wktArray[i] += "]";
    }
    */

    var wktArray = [];
    var bkCount = 0;
    var obj = "";
    for (var i = 0; i < wktTemp.length; ++i) {
      var token = wktTemp[i];
      for (var j2 = 0; j2 < token.length; ++j2) {
        if (token.charAt(j2) === "["){
          ++bkCount;
        }
        if (token.charAt(j2) === "]"){
          --bkCount;
        }
      }
      obj += token;
      if (bkCount === 0) {
        wktArray.push(obj);
        obj = "";
      }
      else {
        obj += ",";
      }
    }

    //this is grotesque -cwm
    var name, value;
    switch (wktObject) {
    case 'LOCAL_CS':
      this.projName = 'identity';
      this.localCS = true;
      this.srsCode = wktName;
      break;
    case 'GEOGCS':
      this.projName = 'longlat';
      this.geocsCode = wktName;
      if (!this.srsCode){
        this.srsCode = wktName;
      }
      break;
    case 'PROJCS':
      this.srsCode = wktName;
      break;
    case 'GEOCCS':
      break;
    case 'PROJECTION':
      this.projName = proj4.wktProjections[wktName];
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
      name = wktName.toLowerCase();
      value = parseFloat(wktArray.shift());
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
        this.long0 = value * proj4.common.D2R;
        break;
      case 'latitude_of_origin':
        this.lat0 = value * proj4.common.D2R;
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
      name = wktName.toLowerCase();
      value = wktArray.shift();
      switch (value) {
      case 'EAST':
        value = 'e';
        break;
      case 'WEST':
        value = 'w';
        break;
      case 'NORTH':
        value = 'n';
        break;
      case 'SOUTH':
        value = 's';
        break;
      case 'UP':
        value = 'u';
        break;
      case 'DOWN':
        value = 'd';
        break;
        //case 'OTHER': 
      default:
        value = ' ';
        break; //FIXME
      }
      if (!this.axis) {
        this.axis = "enu";
      }
      switch (name) {
      case 'x':
        this.axis = value + this.axis.substr(1, 2);
        break;
      case 'y':
        this.axis = this.axis.substr(0, 1) + value + this.axis.substr(2, 1);
        break;
      case 'z':
        this.axis = this.axis.substr(0, 2) + value;
        break;
      default:
        break;
      }
      break;
    case 'MORE_HERE':
      break;
    default:
      break;
    }
    for (var j = 0; j < wktArray.length; ++j) {
      this.parseWKT(wktArray[j]);
    }
  },

  /**
   * Function: parseDefs
   * Parses the PROJ.4 initialization string and sets the associated properties.
   *
   */
  parseDefs: function() {
    this.defData = proj4.defs[this.srsCode];
    if (!this.defData) {
      return;
    }
    var key;
    for(key in this.defData){
      this[key]=this.defData[key];
    }
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
    if (this.nadgrids && this.nadgrids.length === 0) {
      this.nadgrids = null;
    }
    if (this.nadgrids) {
      this.grids = this.nadgrids.split(",");
      var g = null,
        l = this.grids.length;
      if (l > 0) {
        for (var i = 0; i < l; i++) {
          g = this.grids[i];
          var fg = g.split("@");
          if (fg[fg.length - 1] === "") {
            proj4.reportError("nadgrids syntax error '" + this.nadgrids + "' : empty grid found");
            continue;
          }
          this.grids[i] = {
            mandatory: fg.length === 1, //@=> optional grid (no error if not found)
            name: fg[fg.length - 1],
            grid: proj4.grids[fg[fg.length - 1]] //FIXME: grids loading ...
          };
          if (this.grids[i].mandatory && !this.grids[i].grid) {
            proj4.reportError("Missing '" + this.grids[i].name + "'");
          }
        }
      }
      // DGR, 2011-03-20: grids is an array of objects that hold
      // the loaded grids, its name and the mandatory informations of it.
    }
    if (this.datumCode && this.datumCode !== 'none') {
      var datumDef = proj4.Datum[this.datumCode];
      if (datumDef) {
        this.datum_params = datumDef.towgs84 ? datumDef.towgs84.split(',') : null;
        this.ellps = datumDef.ellipse;
        this.datumName = datumDef.datumName ? datumDef.datumName : this.datumCode;
      }
    }
    if (!this.a) { // do we have an ellipsoid?
      var ellipse = proj4.Ellipsoid[this.ellps] ? proj4.Ellipsoid[this.ellps] : proj4.Ellipsoid.WGS84;
      proj4.extend(this, ellipse);
    }
    if (this.rf && !this.b){
      this.b = (1.0 - 1.0 / this.rf) * this.a;
    }
    if (this.rf === 0 || Math.abs(this.a - this.b) < proj4.common.EPSLN) {
      this.sphere = true;
      this.b = this.a;
    }
    this.a2 = this.a * this.a; // used in geocentric
    this.b2 = this.b * this.b; // used in geocentric
    this.es = (this.a2 - this.b2) / this.a2; // e ^ 2
    this.e = Math.sqrt(this.es); // eccentricity
    if (this.R_A) {
      this.a *= 1 - this.es * (proj4.common.SIXTH + this.es * (proj4.common.RA4 + this.es * proj4.common.RA6));
      this.a2 = this.a * this.a;
      this.b2 = this.b * this.b;
      this.es = 0;
    }
    this.ep2 = (this.a2 - this.b2) / this.b2; // used in geocentric
    if (!this.k0){
      this.k0 = 1.0; //default value
    }
    //DGR 2010-11-12: axis
    if (!this.axis) {
      this.axis = "enu";
    }

    this.datum = new proj4.datum(this);
  }
});

proj4.Proj.longlat = {
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
proj4.Proj.identity = proj4.Proj.longlat;

/**
  proj4.defs is a collection of coordinate system definition objects in the 
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
