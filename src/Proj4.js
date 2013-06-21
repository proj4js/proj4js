/*
Author:       Mike Adair madairATdmsolutions.ca
              Richard Greenwood rich@greenwoodmap.com
License:      MIT as per: ../LICENSE

$Id: Proj.js 2956 2007-07-09 12:17:52Z steven $
*/

/**
 * Namespace: proj4
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
 * All coordinates are handled as points which have a .x and a .y property
 * which will be modified in place.
 *
 * Override proj4.reportError for output of alerts and warnings.
 *
 * See http://trac.osgeo.org/proj4js/wiki/UserGuide for full details.
*/

/**
 * Global namespace object for proj4 library
 */
function proj4(fromProj,toProj,coord){
  var tc;
  fromProj = fromProj instanceof proj4.Proj ? fromProj : new proj4.Proj(fromProj);
  if(typeof toProj === 'undefined'){
    toProj = proj4.WGS84;
  } else if(('x' in toProj)||Array.isArray(toProj)){
    coord = toProj;
    toProj = proj4.WGS84;
  }else{
    toProj = toProj instanceof proj4.Proj ? toProj : new proj4.Proj(toProj);
  }
  if(coord){
    
    coord = coord instanceof proj4.Point ? coord : new proj4.Point(coord);
    
  } else {
    
  }
}
    /**
     * Property: defaultDatum
     * The datum to use when no others a specified
     */
proj4.defaultDatum = 'WGS84';                  //default datum

    /** 
    * Method: transform(source, dest, point)
    * Transform a point coordinate from one map projection to another.  This is
    * really the only public method you should need to use.
    *
    * Parameters:
    * source - {proj4.Proj} source map projection for the transformation
    * dest - {proj4.Proj} destination map projection for the transformation
    * point - {Object} point to transform, may be geodetic (long, lat) or
    *     projected Cartesian (x,y), but should always have x,y properties.
    */
proj4.transform = function(source, dest, point) {
  var wgs84;

  function checkNotWGS(source,dest){
    return ((source.datum.datum_type === proj4.common.PJD_3PARAM || source.datum.datum_type === proj4.common.PJD_7PARAM) && dest.datumCode !== "WGS84");
  }
  
  // Workaround for datum shifts towgs84, if either source or destination projection is not wgs84
  if (source.datum && dest.datum && (checkNotWGS(source, dest) ||checkNotWGS(dest,source))) {
    wgs84 = proj4.WGS84;
    this.transform(source, wgs84, point);
    source = wgs84;
  }
  // DGR, 2010/11/12
  if (source.axis!=="enu") {
    this.adjust_axis(source,false,point);
  }
  // Transform source points to long/lat, if they aren't already.
  if (source.projName==="longlat") {
    point.x *= proj4.common.D2R;  // convert degrees to radians
    point.y *= proj4.common.D2R;
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

  if (dest.projName==="longlat") {
    // convert radians to decimal degrees
    point.x *= proj4.common.R2D;
    point.y *= proj4.common.R2D;
  } else {               // else project
    dest.forward(point);
    if (dest.to_meter) {
      point.x /= dest.to_meter;
      point.y /= dest.to_meter;
    }
  }

  // DGR, 2010/11/12
  if (dest.axis!=="enu") {
    this.adjust_axis(dest,true,point);
  }

  return point;
}; // transform()

    /** datum_transform()
      source coordinate system definition,
      destination coordinate system definition,
      point to transform in geodetic coordinates (long, lat, height)
    */
proj4.datum_transform = function( source, dest, point ) {
  var wp,i,l;
  function checkParams(fallback){
    return (fallback === proj4.common.PJD_3PARAM || fallback === proj4.common.PJD_7PARAM);
  }
  // Short cut if the datums are identical.
  if( source.compare_datums( dest ) ) {
    return point; // in this case, zero is sucess,
    // whereas cs_compare_datums returns 1 to indicate TRUE
    // confusing, should fix this
  }

  // Explicitly skip datum transform by setting 'datum=none' as parameter for either source or dest
  if( source.datum_type === proj4.common.PJD_NODATUM || dest.datum_type === proj4.common.PJD_NODATUM) {
    return point;
  }

  //DGR: 2012-07-29 : add nadgrids support (begin)
  var src_a = source.a;
  var src_es = source.es;

  var dst_a = dest.a;
  var dst_es = dest.es;

  var fallback= source.datum_type;
  // If this datum requires grid shifts, then apply it to geodetic coordinates.
  if( fallback === proj4.common.PJD_GRIDSHIFT ) {
    if (this.apply_gridshift( source, 0, point )===0) {
      source.a = proj4.common.SRS_WGS84_SEMIMAJOR;
      source.es = proj4.common.SRS_WGS84_ESQUARED;
    } else {
      // try 3 or 7 params transformation or nothing ?
      if (!source.datum_params) {
        source.a = src_a;
        source.es = source.es;
        return point;
      }
      wp= 1;
      for (i= 0, l= source.datum_params.length; i<l; i++) {
        wp*= source.datum_params[i];
      }
      if (wp===0) {
        source.a = src_a;
        source.es = source.es;
        return point;
      }
      if(source.datum_params.length>3){
        fallback = proj4.common.PJD_7PARAM;
      } else {
        fallback = proj4.common.PJD_3PARAM;
      }
    }
  }
  if( dest.datum_type === proj4.common.PJD_GRIDSHIFT ){
    dest.a = proj4.common.SRS_WGS84_SEMIMAJOR;
    dest.es = proj4.common.SRS_WGS84_ESQUARED;
  }
   // Do we need to go through geocentric coordinates?
  if (source.es !== dest.es || source.a !== dest.a || checkParams(fallback) || checkParams(dest.datum_type)) {
    //DGR: 2012-07-29 : add nadgrids support (end)
    // Convert to geocentric coordinates.
    source.geodetic_to_geocentric( point );
    // CHECK_RETURN;
    // Convert between datums
    if(checkParams(source.datum_type)) {
      source.geocentric_to_wgs84(point);
      // CHECK_RETURN;
    }
    if(checkParams(dest.datum_type)) {
      dest.geocentric_from_wgs84(point);
      // CHECK_RETURN;
    }
    // Convert back to geodetic coordinates
    dest.geocentric_to_geodetic( point );
    // CHECK_RETURN;
  }
  // Apply grid shift to destination if required
  if( dest.datum_type === proj4.common.PJD_GRIDSHIFT ) {
    this.apply_gridshift( dest, 1, point);
    // CHECK_RETURN;
  }

  source.a = src_a;
  source.es = src_es;
  dest.a = dst_a;
  dest.es = dst_es;

  return point;
}; // cs_datum_transform

    /**
     * This is the real workhorse, given a gridlist
     * DGR: 2012-07-29 addition based on proj4 trunk
     */
proj4.apply_gridshift = function(srs,inverse,point) {
  var i,l,gi,ct,epsilon;
  if (srs.grids===null || srs.grids.length===0) {
    return -38;//are these error codes?
  }
  var input= {"x":point.x, "y":point.y};
  var output= {"x":Number.NaN, "y":Number.NaN};
  /* keep trying till we find a table that works */
  var onlyMandatoryGrids= false;
  for (i = 0, l = srs.grids.length; i<l; i++) {
    gi= srs.grids[i];
    onlyMandatoryGrids= gi.mandatory;
    ct= gi.grid;
    if (ct===null) {
      if (gi.mandatory) {
        this.reportError("unable to find '"+gi.name+"' grid.");
        return -48;//are these error codes?
      }
      continue;//optional grid
    }
    /* skip tables that don't match our point at all.  */
    epsilon= (Math.abs(ct.del[1])+Math.abs(ct.del[0]))/10000;
    if( ct.ll[1]-epsilon>input.y || ct.ll[0]-epsilon>input.x || ct.ll[1]+(ct.lim[1]-1)*ct.del[1]+epsilon<input.y || ct.ll[0]+(ct.lim[0]-1)*ct.del[0]+epsilon<input.x ) {
      continue;
    }
    /* If we have child nodes, check to see if any of them apply. */
    /* TODO : only plain grid has been implemented ... */
    /* we found a more refined child node to use */
    /* load the grid shift info if we don't have it. */
    /* TODO : proj4.grids pre-loaded (as they can be huge ...) */
    /* skip numerical computing error when "null" grid (identity grid): */
    if (gi.name==="null") {
      output.x= input.x;
      output.y= input.y;
    } else {
      output= proj4.common.nad_cvt(input, inverse, ct);
    }
    if (!isNaN(output.x)) {
      break;
    }
  }
  if (isNaN(output.x)) {
    if (!onlyMandatoryGrids) {
      this.reportError("failed to find a grid shift table for location '"+
        input.x*proj4.common.R2D+" "+input.y*proj4.common.R2D+
        " tried: '"+srs.nadgrids+"'");
      return -48;
    }
    return -1;//FIXME: no shift applied ...
  }
  point.x= output.x;
  point.y= output.y;
  return 0;
};

    /**
     * Function: adjust_axis
     * Normalize or de-normalized the x/y/z axes.  The normal form is "enu"
     * (easting, northing, up).
     * Parameters:
     * crs {proj4.Proj} the coordinate reference system
     * denorm {Boolean} when false, normalize
     * point {Object} the coordinates to adjust
     */
proj4.adjust_axis = function(crs, denorm, point) {
  var xin= point.x, yin= point.y, zin= point.z || 0.0;
  var v, t, i;
  for (i= 0; i<3; i++) {
    if (denorm && i===2 && point.z===undefined) {
      continue;
    }
    if (i===0) {
      v= xin;
      t= 'x';
    } else if (i===1) {
      v= yin;
      t= 'y';
    } else {
      v= zin;
      t= 'z';
    }
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
      if (point[t]!==undefined) {
        point.z= v;
      }
      break;
    case 'd':
      if (point[t]!==undefined) {
        point.z= -v;
      }
      break;
    default :
      //console.log("ERROR: unknow axis ("+crs.axis[i]+") - check definition of "+crs.projName);
      return null;
    }
  }
  return point;
};

    /**
     * Function: reportError
     * An internal method to report errors back to user. 
     * Override this in applications to report error messages or throw exceptions.
     */
proj4.reportError = function(/*msg*/) {
  //console.log(msg);
};

/**
 *
 * Title: Private Methods
 * The following properties and methods are intended for internal use only.
 *
 * This is a minimal implementation of JavaScript inheritance methods so that 
 * proj4 can be used as a stand-alone library.
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
proj4.extend = function(destination, source) {
  destination = destination || {};
  var value,property;
  if(!source) {
    return destination;
  }
  for(property in source) {
    value = source[property];
    if(value !== undefined) {
      destination[property] = value;
    }
  }
  return destination;
};

/**
 * Constructor: Class
 * Base class used to construct all other classes. Includes support for 
 *     multiple inheritance. 
 *  
 */
proj4.Class = function() {
  var Class = function() {
    this.initialize.apply(this, arguments);
  };
  var extended = {};
  var parent,i;
  for(i=0; i<arguments.length; ++i) {
    if(typeof arguments[i] === "function") {
      // get the prototype of the superclass
      parent = arguments[i].prototype;
    } else {
      // in this case we're extending with the prototype
      parent = arguments[i];
    }
    proj4.extend(extended, parent);
  }
  Class.prototype = extended;
  return Class;
};
