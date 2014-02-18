window['Proj4js'] = {};

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
goog.exportSymbol('Proj4js.Proj.lcc', Proj4js.Proj.lcc);
goog.exportSymbol('Proj4js.Proj.merc', Proj4js.Proj.merc);
goog.exportSymbol('Proj4js.Proj.somerc', Proj4js.Proj.somerc);

