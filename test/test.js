
var xyEPSLN = 1.0e-2;
  var llEPSLN = 1.0e-6;
describe('Proj4js', function () {

	testPoints.forEach(function(testPoint){
		it('should work with forwards ' + testPoint.code, function () {
			var proj = new Proj4js.Proj(testPoint.code);
			var xy = Proj4js.transform(Proj4js.WGS84, proj, new Proj4js.Point(testPoint.ll));
			console.log(xy.x, testPoint.xy[0]);
			console.log(xy.y, testPoint.xy[1]);
			assert.closeTo(xy.x, testPoint.xy[0],xyEPSLN, 'x is close');
			assert.closeTo(xy.y, testPoint.xy[1],xyEPSLN, 'y is close');
		});
		it('should work with backwards ' + testPoint.code, function () {
			var proj = new Proj4js.Proj(testPoint.code);
			var ll = Proj4js.transform(proj,Proj4js.WGS84, new Proj4js.Point(testPoint.xy));
			console.log(ll.x, testPoint.ll[0]);
			console.log(ll.y, testPoint.ll[1]);
			assert.closeTo(ll.x, testPoint.ll[0],llEPSLN, 'lng is close');
			assert.closeTo(ll.y, testPoint.ll[1],llEPSLN, 'lat is close');
		});
	})
});