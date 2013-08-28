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
  }/*,
  {code: 'EPSG:102018',
    xy: [350577.5930806119, 4705857.070634324],
    ll: [-75,46]
  }*/,
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
	name:'NAD_1983_HARN_StatePlane_New_Jersey_FIPS_2900',
	units:'Meter',
	proj:'tmerc',
	code:'ESRI:102311',
	testPoint:[[-75,40],[107307.24586574888, 129634.14970674049]],
	wkt:'PROJCS["NAD_1983_HARN_StatePlane_New_Jersey_FIPS_2900",GEOGCS["GCS_North_American_1983_HARN",DATUM["D_North_American_1983_HARN",SPHEROID["GRS_1980",6378137,298.257222101]],PRIMEM["Greenwich",0],UNIT["Degree",0.017453292519943295]],PROJECTION["Transverse_Mercator"],PARAMETER["False_Easting",150000],PARAMETER["False_Northing",0],PARAMETER["Central_Meridian",-74.5],PARAMETER["Scale_Factor",0.9999],PARAMETER["Latitude_Of_Origin",38.83333333333334],UNIT["Meter",1]]'
},
{
	name:"NAD_1983_HARN_StatePlane_Massachusetts_Mainland_FIPS_2001",
	units:"Meter",
	proj:'lcc',
	code:'ESRI:102286',
	testPoint:[[-70, 41],[326219.2329381689, 751109.8626785288]],
	wkt:'PROJCS["NAD_1983_HARN_StatePlane_Massachusetts_Mainland_FIPS_2001",GEOGCS["GCS_North_American_1983_HARN",DATUM["D_North_American_1983_HARN",SPHEROID["GRS_1980",6378137,298.257222101]],PRIMEM["Greenwich",0],UNIT["Degree",0.017453292519943295]],PROJECTION["Lambert_Conformal_Conic"],PARAMETER["False_Easting",200000],PARAMETER["False_Northing",750000],PARAMETER["Central_Meridian",-71.5],PARAMETER["Standard_Parallel_1",41.71666666666667],PARAMETER["Standard_Parallel_2",42.68333333333333],PARAMETER["Latitude_Of_Origin",41],UNIT["Meter",1]]'
	},
{
	name:"NAD83 / Alaska zone 1",
	units:"Meter",
	proj:'omerc',
	code:'EPSG:26931',
	testPoint:[[-135,56],[4916815.274147286, -5110540.771739297]],
	wkt:'PROJCS["NAD83 / Alaska zone 1",GEOGCS["GCS_North_American_1983",DATUM["D_North_American_1983",SPHEROID["GRS_1980",6378137,298.257222101]],PRIMEM["Greenwich",0],UNIT["Degree",0.017453292519943295]],PROJECTION["Hotine_Oblique_Mercator_Azimuth_Natural_Origin"],PARAMETER["latitude_of_center",57],PARAMETER["longitude_of_center",-133.6666666666667],PARAMETER["azimuth",323.1301023611111],PARAMETER["rectified_grid_angle",323.1301023611111],PARAMETER["scale_factor",0.9999],PARAMETER["false_easting",5000000],PARAMETER["false_northing",-5000000],UNIT["Meter",1]]'
	}
];
