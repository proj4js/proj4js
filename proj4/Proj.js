define(function(require) {
  var extend = require('proj4/extend');
  var common = require('proj4/common');
  var defs = require('proj4/defs');
  var constants = require('proj4/constants');
  var datum = require('proj4/datum');
  var projections = require('proj4/projections');
  var wkt = require('proj4/wkt');
  var projStr = require('proj4/projString');
  function proj(srsCode) {
    if (!(this instanceof proj)) {
      return new proj(srsCode);
    }
    this.srsCodeInput = srsCode;
    this.x0 = 0;
    this.y0 = 0;
    var obj;
    if(typeof srsCode === 'string'){
    //check to see if this is a WKT string
      if(srsCode in defs){
        this.deriveConstants(defs[srsCode]);
        extend(this,defs[srsCode]);
      }else if ((srsCode.indexOf('GEOGCS') >= 0) || (srsCode.indexOf('GEOCCS') >= 0) || (srsCode.indexOf('PROJCS') >= 0) || (srsCode.indexOf('LOCAL_CS') >= 0)) {
        obj = wkt(srsCode);
        this.deriveConstants(obj);
        extend(this,obj);
        //this.loadProjCode(this.projName);
      }else if(srsCode[0]==='+'){
        obj = projStr(srsCode);
        this.deriveConstants(obj);
        extend(this,obj);
      }
    } else {
      this.deriveConstants(srsCode);
      extend(this,srsCode);
    }

    this.initTransforms(this.projName);
  }
  proj.projections = projections;
  proj.projections.start();
  proj.prototype = {
    /**
     * Function: initTransforms
     *    Finalize the initialization of the Proj object
     *
     */
    initTransforms: function(projName) {
      var ourProj = proj.projections.get(projName);
      if(ourProj){
        extend(this, ourProj);
        this.init();
      }else{
        throw ("unknown projection " + projName);
      }
    },
  
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
  return proj;

});
