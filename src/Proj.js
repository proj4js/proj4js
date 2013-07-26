define(function(require, exports, module) {
  /**
   * Class: proj
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
  var extend = require('./extend');
  var common = require('./common');
  var defs = require('./defs');
  var constants = require('./constants');
  var datum = require('./datum');
  var projections = require('./projections');
  var wkt = require('./wkt');
  
  var proj = function proj(srsCode) {
    if (!(this instanceof proj)) {
      return new proj(srsCode);
    }
    this.srsCodeInput = srsCode;
    var obj;
    //check to see if this is a WKT string
    if ((srsCode.indexOf('GEOGCS') >= 0) || (srsCode.indexOf('GEOCCS') >= 0) || (srsCode.indexOf('PROJCS') >= 0) || (srsCode.indexOf('LOCAL_CS') >= 0)) {
      obj = wkt(srsCode);
      this.deriveConstants(obj);
      extend(this,obj);
      //this.loadProjCode(this.projName);
  
    }
    else {
      if (srsCode.indexOf(":") > -1) {
        this.srsAuth = srsCode.split(':')[0].toLowerCase();
        this.srsProjNumber = srsCode.split(':')[1];

      }
      else {
        this.srsAuth = '';
        this.srsProjNumber = this.srsCode;
      }
      this.parseDefs(srsCode);

    }
    this.initTransforms(this.projName);
  };
  proj.prototype = {
  
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
     * Constructor: initialize
     * Constructor for proj objects
     *
     * Parameters:
     * srsCode - a code for map projection definition parameters.  These are usually
     * (but not always) EPSG codes.
     */
  
    /**
     * Function: initTransforms
     *    Finalize the initialization of the Proj object
     *
     */
    initTransforms: function(projName) {
      if (!(projName in proj.projections)) {
        throw ("unknown projection " + projName);
      }
      extend(this, proj.projections[projName]);
      this.init();
    },
  
    /**
     * Function: parseWKT
     * Parses a WKT string to get initialization parameters
     *
     */
  
    /**
     * Function: parseDefs
     * Parses the PROJ.4 initialization string and sets the associated properties.
     *
     */
    parseDefs: function(srsCode) {
      this.defData = defs[srsCode];
      if (!this.defData) {
        return;
      }else{
        this.srsCode = srsCode;
      }
      var key;
      for (key in this.defData) {
        this[key] = this.defData[key];
      }
      extend(this,this.deriveConstants(this));
    },
  
    /**
     * Function: deriveConstants
     * Sets several derived constant values and initialization of datum and ellipse
     *     parameters.
     *
     */
    deriveConstants: function(self) {
      // DGR 2011-03-20 : nagrids -> nadgrids
      if (self.nadgrids && self.nadgrids.length === 0) {
        self.nadgrids = null;
      }
      if (self.nadgrids) {
        self.grids = self.nadgrids.split(",");
        var g = null,
          l = self.grids.length;
        if (l > 0) {
          for (var i = 0; i < l; i++) {
            g = self.grids[i];
            var fg = g.split("@");
            if (fg[fg.length - 1] === "") {
              //proj4.reportError("nadgrids syntax error '" + self.nadgrids + "' : empty grid found");
              continue;
            }
            self.grids[i] = {
              mandatory: fg.length === 1, //@=> optional grid (no error if not found)
              name: fg[fg.length - 1],
              grid: constants.grids[fg[fg.length - 1]] //FIXME: grids loading ...
            };
            if (self.grids[i].mandatory && !self.grids[i].grid) {
              //proj4.reportError("Missing '" + self.grids[i].name + "'");
            }
          }
        }
        // DGR, 2011-03-20: grids is an array of objects that hold
        // the loaded grids, its name and the mandatory informations of it.
      }
      if (self.datumCode && self.datumCode !== 'none') {
        var datumDef = constants.Datum[self.datumCode];
        if (datumDef) {
          self.datum_params = datumDef.towgs84 ? datumDef.towgs84.split(',') : null;
          self.ellps = datumDef.ellipse;
          self.datumName = datumDef.datumName ? datumDef.datumName : self.datumCode;
        }
      }
      if (!self.a) { // do we have an ellipsoid?
        var ellipse = constants.Ellipsoid[self.ellps] ? constants.Ellipsoid[self.ellps] : constants.Ellipsoid.WGS84;
        extend(self, ellipse);
      }
      if (self.rf && !self.b) {
        self.b = (1.0 - 1.0 / self.rf) * self.a;
      }
      if (self.rf === 0 || Math.abs(self.a - self.b) < common.EPSLN) {
        self.sphere = true;
        self.b = self.a;
      }
      self.a2 = self.a * self.a; // used in geocentric
      self.b2 = self.b * self.b; // used in geocentric
      self.es = (self.a2 - self.b2) / self.a2; // e ^ 2
      self.e = Math.sqrt(self.es); // eccentricity
      if (self.R_A) {
        self.a *= 1 - self.es * (common.SIXTH + self.es * (common.RA4 + self.es * common.RA6));
        self.a2 = self.a * self.a;
        self.b2 = self.b * self.b;
        self.es = 0;
      }
      self.ep2 = (self.a2 - self.b2) / self.b2; // used in geocentric
      if (!self.k0) {
        self.k0 = 1.0; //default value
      }
      //DGR 2010-11-12: axis
      if (!self.axis) {
        self.axis = "enu";
      }
  
      self.datum = datum(self);
    }
  };
  proj.projections = projections;
  module.exports = proj;

});
