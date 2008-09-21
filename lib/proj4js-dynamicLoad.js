/*
Author:       Mike Adair madairATdmsolutions.ca
License:      LGPL as per: http://www.gnu.org/copyleft/lesser.html
              Note: This program is an almost direct port of the C library Proj4.
$Id: Proj.js 2956 2007-07-09 12:17:52Z steven $
*/

/**
 * Provides support for run-time lookup of Coordinate system initilization
 * parameters for the use-case where the Coordinate systems that will be used
 * in your application is unknown beforehand.
 * If this file isn't being used in an OpenLayers application, you must also
 * include the file proj4js-openlayers.js which includes the reuired OpenLayers
 * dependancies. 
 */

/**
 * Extend the Proj4js object
 */
Proj4js = Proj4js.extend(Proj4js, {

    /**
     * Property: _scriptName
     * {String} Relative path of this script.
     */
    _scriptName: "proj4js-dynamicLoad.js",

    /**
     * Property: proxyScript
     * A proxy script to execute AJAX requests in other domains. 
     */
    proxyScript: null,  //TBD: customize this for spatialreference.org output

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
     * Function: _getScriptLocation
     * Return the path to this script.
     *
     * Returns:
     * Path to this script
     */
    _getScriptLocation: function () {
        if(Proj4js.libPath) return Proj4js.libPath;
        var scriptName = Proj4js._scriptName;
        var scriptNameLen=scriptName.length;

        var scripts = document.getElementsByTagName('script');
        for (var i = 0; i < scripts.length; i++) {
            var src = scripts[i].getAttribute('src');
            if (src) {
                var index = src.lastIndexOf(scriptName);
                // is it found, at the end of the URL?
                if ((index > -1) && (index + scriptNameLen == src.length)) {
                    Proj4js.libPath = src.slice(0, -scriptNameLen);
                    break;
                }
            }
        }
        return Proj4js.libPath||"";
    },

/**
 * Function: loadProjDefinition
 * Override the default method to allow for dynamic loading of CS initialization
 *     from disk or through a web service such as spatialreference.org
 *
 * Parameters:
 * proj - {Object} A Proj4js.Proj object with srsCode defined
 *
 * Returns:
 * {String} The CS initialization string
 */
    loadProjDefinition: function(proj) {

      //check in memory
      if (this.defs[proj.srsCode]) return this.defs[proj.srsCode];

      //else check for def on the server
      var url = this._getScriptLocation() + 'defs/' + proj.srsAuth.toUpperCase() + proj.srsProjNumber + '.js';
      var config = {
        url: url,
        async: false,          //need to wait until defs are loaded before proceeding
        success: this.defsLoadedFromDisk.bind(this,proj.srsCode)
      }
      OpenLayers.Request.GET(config);
      if ( this.defs[proj.srsCode] ) return this.defs[proj.srsCode];

      //else load from web service via AJAX request
      if (this.proxyScript) {
        var url = this.defsLookupService +'/' + proj.srsAuth +'/'+ proj.srsProjNumber + '/proj4';
        var config = {
          url: url,
          proxy: this.proxyScript,
          success: this.defsLoadedFromService.bind(this,proj.srsCode),
          failure: this.defsFailed.bind(this,proj.srsCode)
        };
        OpenLayers.Request.GET(config);
      }

      //may return null here if the defs are not found
      return this.defs[proj.srsCode];
    },

    defsLoadedFromDisk: function(srsCode, transport) {
      eval(transport.responseText);
    },

    defsLoadedFromService: function(srsCode, transport) {
      this.defs[srsCode] = transport.responseText;
      // save this also in the prototype, so we don't need to fetch it again
      Proj4js.defs[srsCode] = transport.responseText;
    },

    defsFailed: function(srsCode) {
      this.reportError('failed to load projection definition for: '+srsCode);
      Proj4js.extend(this.defs[srsCode], this.defs['WGS84']);  //set it to something so it can at least continue
    },

/**
 * Function: loadProjCode
 * Override the default method to load projection class code dynamically.
 *     projection code is already included either through a script tag or in
 *     a custom build.  This method overrides the default method.
 *
 * Parameters:
 * projName - {String} The projection clas name e.g. 'lcc'
 *
 * Returns:
 * {Object} The projection class transform object.
 */
    loadProjCode: function(projName) {
      if (this.Proj[projName]) return;

      //set AJAX options
      var options = {
        method: 'get',
        asynchronous: false,          //need to wait until defs are loaded before proceeding
        onSuccess: this.loadProjCodeSuccess.bind(this, projName),
        onFailure: this.loadProjCodeFailure.bind(this, projName)
      };
      
      //load the projection class 
      var url = this._getScriptLocation() + 'projCode/' + projName + '.js';
      new OpenLayers.Ajax.Request(url, options);
    },

    loadProjCodeSuccess: function(projName, transport) {
      eval(transport.responseText);
      if (this.Proj[projName].dependsOn){
        this.loadProjCode(this.Proj[projName].dependsOn);
      }
    },

    loadProjCodeFailure: function(projName) {
      Proj4js.reportError("failed to find projection file for: " + projName);
      //TBD initialize with identity transforms so proj will still work
    }

});


