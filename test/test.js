
var xyEPSLN = 1.0e-2;
  var llEPSLN = 1.0e-6;
describe('proj4', function () {
	describe('core',function(){
	testPoints.forEach(function(testPoint){
		it('should work with forwards ' + testPoint.code, function () {
			var proj = new proj4.Proj(testPoint.code);
			var xy = proj4.transform(proj4.WGS84, proj, new proj4.Point(testPoint.ll));
			assert.closeTo(xy.x, testPoint.xy[0],xyEPSLN, 'x is close');
			assert.closeTo(xy.y, testPoint.xy[1],xyEPSLN, 'y is close');
		});
		it('should work with backwards ' + testPoint.code, function () {
			var proj = new proj4.Proj(testPoint.code);
			var ll = proj4.transform(proj,proj4.WGS84, new proj4.Point(testPoint.xy));
			assert.closeTo(ll.x, testPoint.ll[0],llEPSLN, 'lng is close');
			assert.closeTo(ll.y, testPoint.ll[1],llEPSLN, 'lat is close');
		});
	});
	});
	describe('errors',function(){
		it('should throw an error for an unknown ref',function(){
			assert.throws(function(){
				new proj4.Proj('EPSG:23030');
			},'unknown projection','should work');
		});
	})
	describe('utility',function(){
		it('should have MGRS available in the proj4.util namespace',function(){
			assert.typeOf(proj4.util.MGRS, "object", "MGRS available in the proj4.util namespace");
		});
	 	it('should have fromMGRS method added to proj4.Point prototype',function(){
			assert.typeOf(proj4.Point.fromMGRS, "function", "fromMGRS method added to proj4.Point prototype");
		});
	 it('should have toMGRS method added to proj4.Point prototype',function(){
			assert.typeOf(proj4.Point.prototype.toMGRS, "function", "toMGRS method added to proj4.Point prototype");
		});
	 
  describe('First MGRS set',function(){
  	var mgrs = "33UXP04";
    var point = proj4.Point.fromMGRS(mgrs);
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
    var point = proj4.Point.fromMGRS(mgrs);
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
				var testProj = new proj4.Proj(wkt.wkt);
				assert.equal(testProj.srsCode,wkt.name,'correct name');
				assert.equal(testProj.units,wkt.units,'correct units');
				assert.equal(testProj.projName,wkt.proj,'correct type')
			});
		});
	});
});