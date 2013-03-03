goog.require("Proj4js");

goog.exportSymbol('Proj4js.transform', Proj4js.transform );
goog.exportSymbol('Proj4js.reportError', Proj4js.reportError );
goog.exportSymbol('Proj4js.defs', Proj4js.defs);

goog.exportSymbol('Proj4js.Point', Proj4js.Point);
goog.exportProperty(Proj4js.Point.prototype, 'x', Proj4js.Point.x);
goog.exportProperty(Proj4js.Point.prototype, 'y', Proj4js.Point.y);
goog.exportProperty(Proj4js.Point.prototype, 'z', Proj4js.Point.z);

goog.exportSymbol('Proj4js.Proj', Proj4js.Proj);
goog.exportProperty(Proj4js.Proj.prototype, 'projName', Proj4js.Proj.prototype.projName);
goog.exportProperty(Proj4js.Proj.prototype, 'title', Proj4js.Proj.prototype.title);
goog.exportProperty(Proj4js.Proj.prototype, 'units', Proj4js.Proj.prototype.units);

goog.exportSymbol('Proj4js.Proj.longlat', Proj4js.Proj.longlat);
goog.exportSymbol('Proj4js.Proj.lcc', Proj4js.Proj.lcc);

