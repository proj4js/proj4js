define(['proj4/core','proj4/Proj','proj4/Point','proj4/defs','proj4/transform','proj4/mgrs'],function(proj4, Proj, Point,defs,transform,mgrs) {
  
  proj4.defaultDatum = 'WGS84'; //default datum
  proj4.Proj = Proj;
  proj4.WGS84 = new proj4.Proj('WGS84');
  proj4.Point = Point;
  proj4.defs = defs;
  proj4.transform = transform;
  proj4.mgrs = mgrs;
  return proj4;

});
