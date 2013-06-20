
var xyEPSLN = 1.0e-2;
  var llEPSLN = 1.0e-6;
describe('Proj4js', function () {
	describe('core',function(){
	testPoints.forEach(function(testPoint){
		it('should work with forwards ' + testPoint.code, function () {
			var proj = new Proj4js.Proj(testPoint.code);
			var xy = Proj4js.transform(Proj4js.WGS84, proj, new Proj4js.Point(testPoint.ll));
			assert.closeTo(xy.x, testPoint.xy[0],xyEPSLN, 'x is close');
			assert.closeTo(xy.y, testPoint.xy[1],xyEPSLN, 'y is close');
		});
		it('should work with backwards ' + testPoint.code, function () {
			var proj = new Proj4js.Proj(testPoint.code);
			var ll = Proj4js.transform(proj,Proj4js.WGS84, new Proj4js.Point(testPoint.xy));
			assert.closeTo(ll.x, testPoint.ll[0],llEPSLN, 'lng is close');
			assert.closeTo(ll.y, testPoint.ll[1],llEPSLN, 'lat is close');
		});
	});
	});
	describe('errors',function(){
		it('should throw an error for an unknown ref',function(){
			assert.throws(function(){
				new Proj4js.Proj('EPSG:23030');
			},'unknown projection','should work');
		});
	})
	describe('utility',function(){
		it('should have MGRS available in the Proj4js.util namespace',function(){
			assert.typeOf(Proj4js.util.MGRS, "object", "MGRS available in the Proj4js.util namespace");
		});
	 	it('should have fromMGRS method added to Proj4js.Point prototype',function(){
			assert.typeOf(Proj4js.Point.fromMGRS, "function", "fromMGRS method added to Proj4js.Point prototype");
		});
	 it('should have toMGRS method added to Proj4js.Point prototype',function(){
			assert.typeOf(Proj4js.Point.prototype.toMGRS, "function", "toMGRS method added to Proj4js.Point prototype");
		});
	 
  describe('First MGRS set',function(){
  	var mgrs = "33UXP04";
    var point = Proj4js.Point.fromMGRS(mgrs);
    it('Longitude of point from MGRS correct.',function(){
    	assert.equal(point.x.toPrecision(7), "16.41450", "Longitude of point from MGRS correct.");
    });
    it('Latitude of point from MGRS correct.',function(){
    	assert.equal(point.y.toPrecision(7), "48.24949", "Latitude of point from MGRS correct.");
    });
    it('MGRS reference with highest accuracy correct.',function(){
    	assert.equal(point.toMGRS(), "33UXP0500444998", "MGRS reference with highest accuracy correct.");
    });
    it('MGRS reference with 1-digit accuracy correct.',function(){
    	assert.equal(point.toMGRS(1), mgrs, "MGRS reference with 1-digit accuracy correct.");
    });
  });
  describe('Second MGRS set',function(){
  	var mgrs = "24XWT783908"; // near UTM zone border, so there are two ways to reference this
    var point = Proj4js.Point.fromMGRS(mgrs);
    it("Longitude of point from MGRS correct.",function(){
    	assert.equal(point.x.toPrecision(7), "-32.66433", "Longitude of point from MGRS correct.");
    });
    it("Latitude of point from MGRS correct.",function(){
    	assert.equal(point.y.toPrecision(7), "83.62778", "Latitude of point from MGRS correct.");
    });
    it("MGRS reference with 3-digit accuracy correct.",function(){
    	assert.equal(point.toMGRS(3), "25XEN041865", "MGRS reference with 3-digit accuracy correct.");
    });
  })
	
	});
	describe('wkt',function(){
		aWKT.forEach(function(wkt){
			it('should work with '+wkt.name,function(){
				var testProj = new Proj4js.Proj(wkt.wkt);
				assert.equal(testProj.srsCode,wkt.name,'correct name');
				assert.equal(testProj.units,wkt.units,'correct units');
				assert.equal(testProj.projName,wkt.proj,'correct type')
			});
		});
	});
});