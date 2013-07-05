
   

 
// You can do this in the grunt config for each mocha task, see the `options` config

requirejs.config({
    //By default load any module IDs from js/lib
    baseUrl: '../src',
    //except, if the module ID starts with "app",
    //load it from the js/app directory. paths
    //config is relative to the baseUrl, and
    //never includes a ".js" extension since
    //the paths config could be for a directory.
   waitSeconds:15,
    use: {
        mocha: {
            attach: 'mocha'
        },
        mochaPhantomJS: {
            attach: 'mochaPhantomJS'
        }
    }
});
mocha.setup({
      ui: "bdd",
      globals: ["console"],
      timeout: 300000,
       ignoreLeaks: true
    });
// Start the main app logic.
requirejs(['../test/lib/chai.js', 'proj4'],
function   (        chai,   proj4) {

    
    var assert = chai.assert;
    proj4.defs([
   ["EPSG:102018", "+proj=gnom +lat_0=90 +lon_0=0 +x_0=6300000 +y_0=6300000 +ellps=WGS84 +datum=WGS84 +units=m +no_defs"]//,
]);

var testPoints = [
  {code: 'EPSG:21781',
    xy: [660389.4751110513, 185731.68482649108],
    ll: [8.23, 46.82]
  },
  {code: 'EPSG:26986',
    xy: [ 231394.84,902621.11],
    ll: [-71.11881762742996,42.37346263960867]
  },
  {code: 'ESRI:102026',
    xy: [3257939.781874, 5459865.918947],
    ll: [45.17578125, 41.923828125]
  },
  {code: 'ESRI:54008',
    xy: [738509.49,5874620.38],
    ll: [11.0, 53.0]
  },
  {code: 'EPSG:3035',
    xy: [4388138.60, 3321736.46],
    ll: [11.0, 53.0]
  },
  {code: 'EPSG:102018',
    xy: [350577.5930806119, 4705857.070634324],
    ll: [-75,46]
  },
  {code: 'EPSG:2958',
    xy: [411461.807497, 4700123.744402],
    ll: [-82.07666015625, 42.448388671875]
  },
  {code: 'ESRI:54009',
    xy: [3891383.58309223, 6876758.9933288],
    ll: [60,60]
  },
  {
    code:'EPSG:3005',
    ll:[-126.54, 54.15],
    xy:[964813.103719, 1016486.305862]
  },
  {
    code:'ESRI:102016',
    ll:[50.977303830208, 30.915260093747],
    xy:[5112279.911077, -4143196.76625]
  },
  {
    code:'EPSG:2066',
    ll:[-60.64, 11.23399779],
    xy:[212475.897033, 170556.426787]
  },
    {
    code:'EPSG:3975',
    ll:[-9.764450683, 25.751953],
    xy:[-942135.525095996, 3178441.8667094777]
  },
   {
    code:'EPSG:3786',
    ll:[-1.7539371169976, 12.632997701986],
    xy:[-195029.12334755991, 1395621.9368162225],
    acc:{
      ll:2
    }
  },
  {
    code:'EPSG:2934',
    ll:[116.65547897884308 , -0.6595605286983485],
    xy:[-7214213.515517, 827245.259088]
  },
  {
    code:'EPSG:2931',
    ll:[5, 25],
    xy:[-308919.1462828873, 2788738.252386554],
    acc:{
      ll:5
    }
  }
  ,{
    code:'EPSG:2065',
    ll:[17.323583231075897, 49.39440725405376],
    xy:[-544115.474379, -1144058.330762]
  },{
    code:'ESRI:53003',
    ll:[-1.3973289073953, 12.649176474268513  ],
    xy:[-155375.88535614178, 1404635.2633403721],
    acc:{
      ll:3
    }
  },{
    code:'EPSG:27200',
    ll:[172.465, -40.7],
    xy:[2464770.343667, 6056137.861919]
  },{
    code:'EPSG:2057',
    ll:[52.6, 27.5],
    xy:[658017.25458, 3043003.058818]
  },{
    code:'EPSG:29101',
    ll:[-49.221772553812, -0.34551739237581],
    xy:[5531902.134932, 9961660.779347],
    acc:{
      ll:3,
      xy:-2
    }
  },{
    code:'EPSG:32661',
    ll:[0, 75],
    xy:[2000000, 325449.806286]
  },{
    code:'EPSG:2036',
    ll:[-66.415, 46.34],
    xy:[2506543.370459, 7482219.546176]
  },{
    code:'ESRI:53029',
    ll:[-1.41160801956, 67.40891366748],
    xy:[-125108.675828, 9016899.042114],
    acc:{
      ll:0,
      xy:-5
    }
];
var aWKT = [
{
  name:'WGS84 Lat/Long Degrees -180 ==> +180',
  units:'Degree',
  proj:'longlat',
	wkt:'GEOGCS["WGS84 Lat/Long Degrees -180 ==> +180",DATUM["D_WGS_1984",SPHEROID["World_Geodetic_System_of_1984",6378137,298.257222932867]],PRIMEM["Greenwich",0],UNIT["Degree",0.017453292519943295]]'
},
{
	name:'ALG-S-AN',
	units:'Meter',
	proj:'lcc',
	wkt:'PROJCS["ALG-S-AN",GEOGCS["VOIR1875",DATUM["VOIR1875",SPHEROID["CLRK-IGN",6378249.200,293.46602129],TOWGS84[-73.0000,-247.0000,227.0000,0.000000,0.000000,0.000000,0.00000000]],PRIMEM["Greenwich",0],UNIT["Degree",0.017453292519943295]],PROJECTION["Lambert Tangential Conformal Conic Projection"],PARAMETER["false_easting",500000.000],PARAMETER["false_northing",300000.000],PARAMETER["scale_factor",0.999625800000],PARAMETER["central_meridian",2.70000000000000],PARAMETER["latitude_of_origin",33.30000000000000],UNIT["Meter",1.00000000000000]]'
},
{
	name:'CANQ27-M15M',
	units:'Meter',
	proj:'tmerc',
	wkt:'PROJCS["CANQ27-M15M",GEOGCS["LL27",DATUM["NAD27",SPHEROID["CLRK66",6378206.400,294.97869821]],PRIMEM["Greenwich",0],UNIT["Degree",0.017453292519943295]],PROJECTION["Transverse_Mercator"],PARAMETER["false_easting",304800.000],PARAMETER["false_northing",0.000],PARAMETER["scale_factor",0.999900000000],PARAMETER["central_meridian",-90.00000000000000],PARAMETER["latitude_of_origin",0.00000000000000],UNIT["Meter",1.00000000000000]]'
},
{
	name:'Non-Earth (Meter)',
	units:'Meter',
	proj:'identity',
	wkt:'LOCAL_CS["Non-Earth (Meter)",LOCAL_DATUM["Local Datum",0],UNIT["Meter", 1],AXIS["X",EAST],AXIS["Y",NORTH]]'
},
{
	name:'SVY21',
	units:'Meter',
	proj:'tmerc',
	wkt:'PROJCS["SVY21",GEOGCS["SVY21[WGS84]",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137.0,298.257223563]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],PROJECTION["Transverse_Mercator"],PARAMETER["False_Easting",28001.642],PARAMETER["False_Northing",38744.572],PARAMETER["Central_Meridian",103.8333333333333],PARAMETER["Scale_Factor",1.0],PARAMETER["Latitude_Of_Origin",1.366666666666667],UNIT["Meter",1.0]]'
},
{
	name:'NAD_1983_StatePlane_Massachusetts_Mainland_FIPS_2001_Feet',
	units:"Foot_US",
	proj:'lcc',
	wkt:'PROJCS["NAD_1983_StatePlane_Massachusetts_Mainland_FIPS_2001_Feet",GEOGCS["GCS_North_American_1983",DATUM["D_North_American_1983",SPHEROID["GRS_1980",6378137.0,298.257222101]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],PROJECTION["Lambert_Conformal_Conic"],PARAMETER["False_Easting",656166.6666666665],PARAMETER["False_Northing",2460625.0],PARAMETER["Central_Meridian",-71.5],PARAMETER["Standard_Parallel_1",41.71666666666667],PARAMETER["Standard_Parallel_2",42.68333333333333],PARAMETER["Latitude_Of_Origin",41.0],UNIT["Foot_US",0.3048006096012192]]'
}
];
describe('proj4', function () {
    describe('core',function(){
	testPoints.forEach(function(testPoint){
        describe(testPoint.code,function(){
          var xyAcc=2,llAcc=6;
          if('acc' in testPoint){
            if('xy' in testPoint.acc){
              xyAcc = testPoint.acc.xy;
            }
            if('ll' in testPoint.acc){
              llAcc = testPoint.acc.ll;
            }
          }
          var xyEPSLN = Math.pow(10,-1*xyAcc);
           var llEPSLN = Math.pow(10,-1*llAcc);
            describe('traditional',function(){
		        it('should work with forwards', function () {
			        var proj = new proj4.Proj(testPoint.code);
			        var xy = proj4.transform(proj4.WGS84, proj, new proj4.Point(testPoint.ll));
			        assert.closeTo(xy.x, testPoint.xy[0],xyEPSLN, 'x is close');
			        assert.closeTo(xy.y, testPoint.xy[1],xyEPSLN, 'y is close');
		        });
		        it('should work with backwards', function () {
			        var proj = new proj4.Proj(testPoint.code);
			        var ll = proj4.transform(proj,proj4.WGS84, new proj4.Point(testPoint.xy));
			        assert.closeTo(ll.x, testPoint.ll[0],llEPSLN, 'lng is close');
			        assert.closeTo(ll.y, testPoint.ll[1],llEPSLN, 'lat is close');
		        });
            });
            describe('new method 2 param',function(){
                it('shortcut method should work with an array', function(){
                    var xy = proj4(testPoint.code,testPoint.ll);
                    assert.closeTo(xy[0], testPoint.xy[0],xyEPSLN, 'x is close');
  		            assert.closeTo(xy[1], testPoint.xy[1],xyEPSLN, 'y is close');
                });
                it('shortcut method should work with an object', function(){
                    var pt = {x:testPoint.ll[0],y:testPoint.ll[1]};
                    var xy = proj4(testPoint.code,pt);
                    assert.closeTo(xy.x, testPoint.xy[0],xyEPSLN, 'x is close');
    	            assert.closeTo(xy.y, testPoint.xy[1],xyEPSLN, 'y is close');
                });
                it('shortcut method should work with a point object', function(){
                    var pt = new proj4.Point(testPoint.ll);
                    var xy = proj4(testPoint.code,pt);
                    assert.closeTo(xy.x, testPoint.xy[0],xyEPSLN, 'x is close');
                    assert.closeTo(xy.y, testPoint.xy[1],xyEPSLN, 'y is close');
                });
            });
            describe('new method 3 param',function(){
                it('shortcut method should work with an array', function(){
                    var xy = proj4(proj4.WGS84,testPoint.code,testPoint.ll);
                    assert.closeTo(xy[0], testPoint.xy[0],xyEPSLN, 'x is close');
      	            assert.closeTo(xy[1], testPoint.xy[1],xyEPSLN, 'y is close');
                });
                it('shortcut method should work with an object', function(){
                    var pt = {x:testPoint.ll[0],y:testPoint.ll[1]};
                    var xy = proj4(proj4.WGS84,testPoint.code,pt);
                    assert.closeTo(xy.x, testPoint.xy[0],xyEPSLN, 'x is close');
    	            assert.closeTo(xy.y, testPoint.xy[1],xyEPSLN, 'y is close');
                });
                it('shortcut method should work with a point object', function(){
                    var pt = new proj4.Point(testPoint.ll);
                    var xy = proj4(proj4.WGS84,testPoint.code,pt);
                    assert.closeTo(xy.x, testPoint.xy[0],xyEPSLN, 'x is close');
                    assert.closeTo(xy.y, testPoint.xy[1],xyEPSLN, 'y is close');
                });
            });
            describe('new method 3 param other way',function(){
                it('shortcut method should work with an array', function(){
                    var ll = proj4(testPoint.code,proj4.WGS84,testPoint.xy);
                    assert.closeTo(ll[0], testPoint.ll[0],llEPSLN, 'x is close');
                    assert.closeTo(ll[1], testPoint.ll[1],llEPSLN, 'y is close');
                });
                it('shortcut method should work with an object', function(){
                    var pt = {x:testPoint.xy[0],y:testPoint.xy[1]};
                    var ll = proj4(testPoint.code,proj4.WGS84,pt);
                    assert.closeTo(ll.x, testPoint.ll[0],llEPSLN, 'x is close');
                    assert.closeTo(ll.y, testPoint.ll[1],llEPSLN, 'y is close');
                });
                it('shortcut method should work with a point object', function(){
                    var pt = new proj4.Point(testPoint.xy);
                    var ll = proj4(testPoint.code,proj4.WGS84,pt);
                    assert.closeTo(ll.x, testPoint.ll[0],llEPSLN, 'x is close');
                    assert.closeTo(ll.y, testPoint.ll[1],llEPSLN, 'y is close');
                });
            });
            describe('1 param',function(){
              it('forwards',function(){
                var xy = proj4(testPoint.code).forward(testPoint.ll);
                assert.closeTo(xy[0], testPoint.xy[0],xyEPSLN, 'x is close');
                assert.closeTo(xy[1], testPoint.xy[1],xyEPSLN, 'y is close');
              });
              it('inverse',function(){
                var ll = proj4(testPoint.code).inverse(testPoint.xy);
                assert.closeTo(ll[0], testPoint.ll[0],llEPSLN, 'x is close');
                assert.closeTo(ll[1], testPoint.ll[1],llEPSLN, 'y is close');
              });
            });
            describe('proj object',function(){
            	it('should work with a 2 element array', function(){
                    var xy = proj4(new proj4.Proj(testPoint.code),testPoint.ll);
                    assert.closeTo(xy[0], testPoint.xy[0],xyEPSLN, 'x is close');
  		            assert.closeTo(xy[1], testPoint.xy[1],xyEPSLN, 'y is close');
                });
                it('should work on element',function(){
                var xy = proj4(new proj4.Proj(testPoint.code)).forward(testPoint.ll);
                assert.closeTo(xy[0], testPoint.xy[0],xyEPSLN, 'x is close');
                assert.closeTo(xy[1], testPoint.xy[1],xyEPSLN, 'y is close');
              });
               it('should work 3 element ponit object', function(){
                    var pt = new proj4.Point(testPoint.xy);
                    var ll = proj4(new proj4.Proj(testPoint.code),proj4.WGS84,pt);
                    assert.closeTo(ll.x, testPoint.ll[0],llEPSLN, 'x is close');
                    assert.closeTo(ll.y, testPoint.ll[1],llEPSLN, 'y is close');
                });
            });
	    });
	});
	});
	describe('errors',function(){
		it('should throw an error for an unknown ref',function(){
			assert.throws(function(){
				new proj4.Proj('fake one');
			},'unknown projection','should work');
		});
	})
	describe('utility',function(){
      it('should have MGRS available in the proj4.util namespace',function(){
			assert.typeOf(proj4.mgrs, "object", "MGRS available in the proj4.util namespace");
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
    if (window.mochaPhantomJS) { mochaPhantomJS.run(); }
      else { mocha.run(); }
});
