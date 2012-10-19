goog.require("Proj4js");

// ol.map
//goog.exportSymbol('Proj4js', Proj4js);
goog.exportSymbol('Proj4js.Proj', Proj4js.Proj);
goog.exportProperty( Proj4js, 'projCode', Proj4js.projCode);
goog.exportSymbol('Proj4js.defs', Proj4js.defs);
goog.exportProperty( Proj4js, 'transform', Proj4js.transform );
goog.exportProperty( Proj4js, 'reportError', Proj4js.reportError );

// ol.geom.point
goog.exportSymbol('Proj4js.Point', Proj4js.Point);

