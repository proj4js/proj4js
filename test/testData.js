var testPoints = [
  { code: 'testmerc',
    xy: [-45007.0787624, 4151725.59875],
    ll: [5.364315, 46.623154]
  },
  { code: 'testmerc2',
    xy: [4156404, 7480076.5],
    ll: [37.33761240175515, 55.60447049026976]
  },
  { code: 'PROJCS["CH1903 / LV03",GEOGCS["CH1903",DATUM["D_CH1903",SPHEROID["Bessel_1841",6377397.155,299.1528128]],PRIMEM["Greenwich",0],UNIT["Degree",0.017453292519943295]],PROJECTION["Hotine_Oblique_Mercator_Azimuth_Center"],PARAMETER["latitude_of_center",46.95240555555556],PARAMETER["longitude_of_center",7.439583333333333],PARAMETER["azimuth",90],PARAMETER["scale_factor",1],PARAMETER["false_easting",600000],PARAMETER["false_northing",200000],UNIT["Meter",1]]',
    xy: [660013.4882918689, 185172.17110117766],
    ll: [8.225, 46.815],
    acc: {
      xy: 0.1,
      ll: 5
    }
  },
  { code: 'PROJCS["CH1903 / LV03",GEOGCS["CH1903",DATUM["CH1903",SPHEROID["Bessel 1841",6377397.155,299.1528128,AUTHORITY["EPSG","7004"]],TOWGS84[674.4,15.1,405.3,0,0,0,0],AUTHORITY["EPSG","6149"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.0174532925199433,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4149"]],PROJECTION["Hotine_Oblique_Mercator_Azimuth_Center"],PARAMETER["latitude_of_center",46.95240555555556],PARAMETER["longitude_of_center",7.439583333333333],PARAMETER["azimuth",90],PARAMETER["rectified_grid_angle",90],PARAMETER["scale_factor",1],PARAMETER["false_easting",600000],PARAMETER["false_northing",200000],UNIT["metre",1,AUTHORITY["EPSG","9001"]],AXIS["Y",EAST],AXIS["X",NORTH],AUTHORITY["EPSG","21781"]]',
    xy: [660013.4882918689, 185172.17110117766],
    ll: [8.225, 46.815],
    acc: {
      xy: 0.1,
      ll: 5
    }
  },
  {
    code: `PROJCRS["CH1903 / LV03",
    BASEGEOGCRS["CH1903",
        DATUM["CH1903",
            ELLIPSOID["Bessel 1841",6377397.155,299.1528128,
                LENGTHUNIT["metre",1]]],
        PRIMEM["Greenwich",0,
            ANGLEUNIT["degree",0.0174532925199433]],
        ID["EPSG",4149]],
    CONVERSION["Swiss Oblique Mercator 1903M",
        METHOD["Hotine Oblique Mercator (variant B)",
            ID["EPSG",9815]],
        PARAMETER["Latitude of projection centre",46.9524055555556,
            ANGLEUNIT["degree",0.0174532925199433],
            ID["EPSG",8811]],
        PARAMETER["Longitude of projection centre",7.43958333333333,
            ANGLEUNIT["degree",0.0174532925199433],
            ID["EPSG",8812]],
        PARAMETER["Azimuth at projection centre",90,
            ANGLEUNIT["degree",0.0174532925199433],
            ID["EPSG",8813]],
        PARAMETER["Angle from Rectified to Skew Grid",90,
            ANGLEUNIT["degree",0.0174532925199433],
            ID["EPSG",8814]],
        PARAMETER["Scale factor at projection centre",1,
            SCALEUNIT["unity",1],
            ID["EPSG",8815]],
        PARAMETER["Easting at projection centre",600000,
            LENGTHUNIT["metre",1],
            ID["EPSG",8816]],
        PARAMETER["Northing at projection centre",200000,
            LENGTHUNIT["metre",1],
            ID["EPSG",8817]]],
    CS[Cartesian,2],
        AXIS["easting (Y)",east,
            ORDER[1],
            LENGTHUNIT["metre",1]],
        AXIS["northing (X)",north,
            ORDER[2],
            LENGTHUNIT["metre",1]],
    USAGE[
        SCOPE["Cadastre, engineering survey, topographic mapping (large and medium scale)."],
        AREA["Liechtenstein; Switzerland."],
        BBOX[45.82,5.96,47.81,10.49]],
    ID["EPSG",21781]]`,
    xy: [660013.4882918689, 185172.17110117766],
    ll: [8.225, 46.815],
    acc: {
      xy: 0.1,
      ll: 5
    }
  },
  {
    code: { $schema: 'https://proj.org/schemas/v0.7/projjson.schema.json', type: 'ProjectedCRS', name: 'CH1903 / LV03', base_crs: { type: 'GeographicCRS', name: 'CH1903', datum: { type: 'GeodeticReferenceFrame', name: 'CH1903', ellipsoid: { name: 'Bessel 1841', semi_major_axis: 6377397.155, inverse_flattening: 299.1528128 } }, coordinate_system: { subtype: 'ellipsoidal', axis: [{ name: 'Geodetic latitude', abbreviation: 'Lat', direction: 'north', unit: 'degree' }, { name: 'Geodetic longitude', abbreviation: 'Lon', direction: 'east', unit: 'degree' }] }, id: { authority: 'EPSG', code: 4149 } }, conversion: { name: 'Swiss Oblique Mercator 1903M', method: { name: 'Hotine Oblique Mercator (variant B)', id: { authority: 'EPSG', code: 9815 } }, parameters: [{ name: 'Latitude of projection centre', value: 46.9524055555556, unit: 'degree', id: { authority: 'EPSG', code: 8811 } }, { name: 'Longitude of projection centre', value: 7.43958333333333, unit: 'degree', id: { authority: 'EPSG', code: 8812 } }, { name: 'Azimuth at projection centre', value: 90, unit: 'degree', id: { authority: 'EPSG', code: 8813 } }, { name: 'Angle from Rectified to Skew Grid', value: 90, unit: 'degree', id: { authority: 'EPSG', code: 8814 } }, { name: 'Scale factor at projection centre', value: 1, unit: 'unity', id: { authority: 'EPSG', code: 8815 } }, { name: 'Easting at projection centre', value: 600000, unit: 'metre', id: { authority: 'EPSG', code: 8816 } }, { name: 'Northing at projection centre', value: 200000, unit: 'metre', id: { authority: 'EPSG', code: 8817 } }] }, coordinate_system: { subtype: 'Cartesian', axis: [{ name: 'Easting', abbreviation: 'Y', direction: 'east', unit: 'metre' }, { name: 'Northing', abbreviation: 'X', direction: 'north', unit: 'metre' }] }, scope: 'Cadastre, engineering survey, topographic mapping (large and medium scale).', area: 'Liechtenstein; Switzerland.', bbox: { south_latitude: 45.82, west_longitude: 5.96, north_latitude: 47.81, east_longitude: 10.49 }, id: { authority: 'EPSG', code: 21781 } },
    xy: [660013.4882918689, 185172.17110117766],
    ll: [8.225, 46.815],
    acc: {
      xy: 0.1,
      ll: 5
    }
  },
  { code: 'PROJCS["NAD83 / Massachusetts Mainland",GEOGCS["NAD83",DATUM["North_American_Datum_1983",SPHEROID["GRS 1980",6378137,298.257222101,AUTHORITY["EPSG","7019"]],AUTHORITY["EPSG","6269"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.01745329251994328,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4269"]],UNIT["metre",1,AUTHORITY["EPSG","9001"]],PROJECTION["Lambert_Conformal_Conic_2SP"],PARAMETER["standard_parallel_1",42.68333333333333],PARAMETER["standard_parallel_2",41.71666666666667],PARAMETER["latitude_of_origin",41],PARAMETER["central_meridian",-71.5],PARAMETER["false_easting",200000],PARAMETER["false_northing",750000],AUTHORITY["EPSG","26986"],AXIS["X",EAST],AXIS["Y",NORTH]]',
    xy: [231394.84, 902621.11],
    ll: [-71.11881762742996, 42.37346263960867]
  },
  {
    code: `PROJCRS["NAD83 / Massachusetts Mainland",
    BASEGEOGCRS["NAD83",
        DATUM["North American Datum 1983",
            ELLIPSOID["GRS 1980",6378137,298.257222101,
                LENGTHUNIT["metre",1]]],
        PRIMEM["Greenwich",0,
            ANGLEUNIT["degree",0.0174532925199433]],
        ID["EPSG",4269]],
    CONVERSION["SPCS83 Massachusetts Mainland zone (meter)",
        METHOD["Lambert Conic Conformal (2SP)",
            ID["EPSG",9802]],
        PARAMETER["Latitude of false origin",41,
            ANGLEUNIT["degree",0.0174532925199433],
            ID["EPSG",8821]],
        PARAMETER["Longitude of false origin",-71.5,
            ANGLEUNIT["degree",0.0174532925199433],
            ID["EPSG",8822]],
        PARAMETER["Latitude of 1st standard parallel",42.6833333333333,
            ANGLEUNIT["degree",0.0174532925199433],
            ID["EPSG",8823]],
        PARAMETER["Latitude of 2nd standard parallel",41.7166666666667,
            ANGLEUNIT["degree",0.0174532925199433],
            ID["EPSG",8824]],
        PARAMETER["Easting at false origin",200000,
            LENGTHUNIT["metre",1],
            ID["EPSG",8826]],
        PARAMETER["Northing at false origin",750000,
            LENGTHUNIT["metre",1],
            ID["EPSG",8827]]],
    CS[Cartesian,2],
        AXIS["easting (X)",east,
            ORDER[1],
            LENGTHUNIT["metre",1]],
        AXIS["northing (Y)",north,
            ORDER[2],
            LENGTHUNIT["metre",1]],
    USAGE[
        SCOPE["Engineering survey, topographic mapping."],
        AREA["United States (USA) - Massachusetts onshore - counties of Barnstable; Berkshire; Bristol; Essex; Franklin; Hampden; Hampshire; Middlesex; Norfolk; Plymouth; Suffolk; Worcester."],
        BBOX[41.46,-73.5,42.89,-69.86]],
    ID["EPSG",26986]]`,
    xy: [231394.84, 902621.11],
    ll: [-71.11881762742996, 42.37346263960867]
  },
  { code: 'PROJCS["NAD83 / Massachusetts Mainland",GEOGCS["GCS_North_American_1983",DATUM["D_North_American_1983",SPHEROID["GRS_1980",6378137,298.257222101]],PRIMEM["Greenwich",0],UNIT["Degree",0.017453292519943295]],PROJECTION["Lambert_Conformal_Conic"],PARAMETER["standard_parallel_1",42.68333333333333],PARAMETER["standard_parallel_2",41.71666666666667],PARAMETER["latitude_of_origin",41],PARAMETER["central_meridian",-71.5],PARAMETER["false_easting",200000],PARAMETER["false_northing",750000],UNIT["Meter",1]]',
    xy: [231394.84, 902621.11],
    ll: [-71.11881762742996, 42.37346263960867]
  },
  { code: 'PROJCS["NAD83 / Massachusetts Mainland", GEOGCS["NAD83", DATUM["North American Datum 1983", SPHEROID["GRS 1980", 6378137.0, 298.257222101, AUTHORITY["EPSG","7019"]], TOWGS84[0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], AUTHORITY["EPSG","6269"]], PRIMEM["Greenwich", 0.0, AUTHORITY["EPSG","8901"]], UNIT["degree", 0.017453292519943295], AXIS["Geodetic longitude", EAST], AXIS["Geodetic latitude", NORTH], AUTHORITY["EPSG","4269"]], PROJECTION["Lambert_Conformal_Conic_2SP", AUTHORITY["EPSG","9802"]], PARAMETER["central_meridian", -71.5], PARAMETER["latitude_of_origin", 41.0], PARAMETER["standard_parallel_1", 42.68333333333334], PARAMETER["false_easting", 200000.0], PARAMETER["false_northing", 750000.0], PARAMETER["scale_factor", 1.0], PARAMETER["standard_parallel_2", 41.71666666666667], UNIT["m", 1.0], AXIS["Easting", EAST], AXIS["Northing", NORTH], AUTHORITY["EPSG","26986"]]',
    xy: [231394.84, 902621.11],
    ll: [-71.11881762742996, 42.37346263960867]
  },
  { code: 'PROJCS["Asia_North_Equidistant_Conic",GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137,298.257223563]],PRIMEM["Greenwich",0],UNIT["Degree",0.017453292519943295]],PROJECTION["Equidistant_Conic"],PARAMETER["False_Easting",0],PARAMETER["False_Northing",0],PARAMETER["Central_Meridian",95],PARAMETER["Standard_Parallel_1",15],PARAMETER["Standard_Parallel_2",65],PARAMETER["Latitude_Of_Origin",30],UNIT["Meter",1]]',
    xy: [88280.59904432714, 111340.90165417176],
    ll: [96, 31]
  },
  {
    code: `PROJCRS["Asia_North_Equidistant_Conic",
    BASEGEOGCRS["WGS 84",
        DATUM["World Geodetic System 1984",
            ELLIPSOID["WGS 84",6378137,298.257223563,
                LENGTHUNIT["metre",1]]],
        PRIMEM["Greenwich",0,
            ANGLEUNIT["Degree",0.0174532925199433]]],
    CONVERSION["Asia_North_Equidistant_Conic",
        METHOD["Equidistant Conic",
            ID["EPSG",1119]],
        PARAMETER["Latitude of false origin",30,
            ANGLEUNIT["Degree",0.0174532925199433],
            ID["EPSG",8821]],
        PARAMETER["Longitude of false origin",95,
            ANGLEUNIT["Degree",0.0174532925199433],
            ID["EPSG",8822]],
        PARAMETER["Latitude of 1st standard parallel",15,
            ANGLEUNIT["Degree",0.0174532925199433],
            ID["EPSG",8823]],
        PARAMETER["Latitude of 2nd standard parallel",65,
            ANGLEUNIT["Degree",0.0174532925199433],
            ID["EPSG",8824]],
        PARAMETER["Easting at false origin",0,
            LENGTHUNIT["metre",1],
            ID["EPSG",8826]],
        PARAMETER["Northing at false origin",0,
            LENGTHUNIT["metre",1],
            ID["EPSG",8827]]],
    CS[Cartesian,2],
        AXIS["(E)",east,
            ORDER[1],
            LENGTHUNIT["metre",1]],
        AXIS["(N)",north,
            ORDER[2],
            LENGTHUNIT["metre",1]],
    USAGE[
        SCOPE["Not known."],
        AREA["Asia - North"],
        BBOX[10,25,85,-175]],
    ID["ESRI",102026]]`,
    xy: [88280.59904432714, 111340.90165417176],
    ll: [96, 31]
  },
  { code: 'PROJCS["World_Sinusoidal",GEOGCS["GCS_WGS_1984",DATUM["WGS_1984",SPHEROID["WGS_1984",6378137,298.257223563]],PRIMEM["Greenwich",0],UNIT["Degree",0.017453292519943295]],PROJECTION["Sinusoidal"],PARAMETER["False_Easting",0],PARAMETER["False_Northing",0],PARAMETER["Central_Meridian",0],UNIT["Meter",1],AUTHORITY["EPSG","54008"]]',
    xy: [738509.49, 5874620.38],
    ll: [11.0, 53.0]
  },
  { code: 'PROJCS["World_Sinusoidal",GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137,298.257223563]],PRIMEM["Greenwich",0],UNIT["Degree",0.017453292519943295]],PROJECTION["Sinusoidal"],PARAMETER["False_Easting",0],PARAMETER["False_Northing",0],PARAMETER["Central_Meridian",0],UNIT["Meter",1]]',
    xy: [738509.49, 5874620.38],
    ll: [11.0, 53.0]
  },
  {
    code: `PROJCRS["World_Sinusoidal",
    BASEGEOGCRS["WGS 84",
        DATUM["World Geodetic System 1984",
            ELLIPSOID["WGS 84",6378137,298.257223563,
                LENGTHUNIT["metre",1]]],
        PRIMEM["Greenwich",0,
            ANGLEUNIT["Degree",0.0174532925199433]]],
    CONVERSION["World_Sinusoidal",
        METHOD["Sinusoidal"],
        PARAMETER["Longitude of natural origin",0,
            ANGLEUNIT["Degree",0.0174532925199433],
            ID["EPSG",8802]],
        PARAMETER["False easting",0,
            LENGTHUNIT["metre",1],
            ID["EPSG",8806]],
        PARAMETER["False northing",0,
            LENGTHUNIT["metre",1],
            ID["EPSG",8807]]],
    CS[Cartesian,2],
        AXIS["(E)",east,
            ORDER[1],
            LENGTHUNIT["metre",1]],
        AXIS["(N)",north,
            ORDER[2],
            LENGTHUNIT["metre",1]],
    USAGE[
        SCOPE["Not known."],
        AREA["World."],
        BBOX[-90,-180,90,180]],
    ID["ESRI",54008]]`,
    xy: [738509.49, 5874620.38],
    ll: [11.0, 53.0]
  },
  { code: 'PROJCS["ETRS89 / ETRS-LAEA",GEOGCS["ETRS89",DATUM["D_ETRS_1989",SPHEROID["GRS_1980",6378137,298.257222101]],PRIMEM["Greenwich",0],UNIT["Degree",0.017453292519943295]],PROJECTION["Lambert_Azimuthal_Equal_Area"],PARAMETER["latitude_of_origin",52],PARAMETER["central_meridian",10],PARAMETER["false_easting",4321000],PARAMETER["false_northing",3210000],UNIT["Meter",1]]',
    xy: [4388138.60, 3321736.46],
    ll: [11.0, 53.0]
  },
  { code: 'PROJCS["ETRS89 / ETRS-LAEA",GEOGCS["ETRS89",DATUM["European_Terrestrial_Reference_System_1989",SPHEROID["GRS 1980",6378137,298.257222101,AUTHORITY["EPSG","7019"]],AUTHORITY["EPSG","6258"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.01745329251994328,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4258"]],UNIT["metre",1,AUTHORITY["EPSG","9001"]],PROJECTION["Lambert_Azimuthal_Equal_Area"],PARAMETER["latitude_of_center",52],PARAMETER["longitude_of_center",10],PARAMETER["false_easting",4321000],PARAMETER["false_northing",3210000],AUTHORITY["EPSG","3035"],AXIS["X",EAST],AXIS["Y",NORTH]]',
    xy: [4388138.60, 3321736.46],
    ll: [11.0, 53.0]
  },
  {
    code: `PROJCRS["ETRS89-extended / LAEA Europe",
    BASEGEOGCRS["ETRS89",
        ENSEMBLE["European Terrestrial Reference System 1989 ensemble",
            MEMBER["European Terrestrial Reference Frame 1989"],
            MEMBER["European Terrestrial Reference Frame 1990"],
            MEMBER["European Terrestrial Reference Frame 1991"],
            MEMBER["European Terrestrial Reference Frame 1992"],
            MEMBER["European Terrestrial Reference Frame 1993"],
            MEMBER["European Terrestrial Reference Frame 1994"],
            MEMBER["European Terrestrial Reference Frame 1996"],
            MEMBER["European Terrestrial Reference Frame 1997"],
            MEMBER["European Terrestrial Reference Frame 2000"],
            MEMBER["European Terrestrial Reference Frame 2005"],
            MEMBER["European Terrestrial Reference Frame 2014"],
            MEMBER["European Terrestrial Reference Frame 2020"],
            ELLIPSOID["GRS 1980",6378137,298.257222101,
                LENGTHUNIT["metre",1]],
            ENSEMBLEACCURACY[0.1]],
        PRIMEM["Greenwich",0,
            ANGLEUNIT["degree",0.0174532925199433]],
        ID["EPSG",4258]],
    CONVERSION["Europe Equal Area 2001",
        METHOD["Lambert Azimuthal Equal Area",
            ID["EPSG",9820]],
        PARAMETER["Latitude of natural origin",52,
            ANGLEUNIT["degree",0.0174532925199433],
            ID["EPSG",8801]],
        PARAMETER["Longitude of natural origin",10,
            ANGLEUNIT["degree",0.0174532925199433],
            ID["EPSG",8802]],
        PARAMETER["False easting",4321000,
            LENGTHUNIT["metre",1],
            ID["EPSG",8806]],
        PARAMETER["False northing",3210000,
            LENGTHUNIT["metre",1],
            ID["EPSG",8807]]],
    CS[Cartesian,2],
        AXIS["northing (Y)",north,
            ORDER[1],
            LENGTHUNIT["metre",1]],
        AXIS["easting (X)",east,
            ORDER[2],
            LENGTHUNIT["metre",1]],
    USAGE[
        SCOPE["Statistical analysis."],
        AREA["Europe - European Union (EU) countries and candidates. Europe - onshore and offshore: Albania; Andorra; Austria; Belgium; Bosnia and Herzegovina; Bulgaria; Croatia; Cyprus; Czechia; Denmark; Estonia; Faroe Islands; Finland; France; Germany; Gibraltar; Greece; Hungary; Iceland; Ireland; Italy; Kosovo; Latvia; Liechtenstein; Lithuania; Luxembourg; Malta; Monaco; Montenegro; Netherlands; North Macedonia; Norway including Svalbard and Jan Mayen; Poland; Portugal including Madeira and Azores; Romania; San Marino; Serbia; Slovakia; Slovenia; Spain including Canary Islands; Sweden; Switzerland; Türkiye (Turkey); United Kingdom (UK) including Channel Islands and Isle of Man; Vatican City State."],
        BBOX[24.6,-35.58,84.73,44.83]],
    ID["EPSG",3035]]`,
    xy: [4388138.60, 3321736.46],
    ll: [11.0, 53.0]
  },
  { code: 'EPSG:102018',
    xy: [350577.5930806119, 4705857.070634324],
    ll: [-75, 46]
  }, { code: '+proj=gnom +lat_0=90 +lon_0=0 +x_0=6300000 +y_0=6300000 +ellps=WGS84 +datum=WGS84 +units=m +no_defs',
    xy: [350577.5930806119, 4705857.070634324],
    ll: [-75, 46]
  },
  { code: 'PROJCS["NAD83(CSRS) / UTM zone 17N",GEOGCS["NAD83(CSRS)",DATUM["D_North_American_1983_CSRS98",SPHEROID["GRS_1980",6378137,298.257222101]],PRIMEM["Greenwich",0],UNIT["Degree",0.017453292519943295]],PROJECTION["Transverse_Mercator"],PARAMETER["latitude_of_origin",0],PARAMETER["central_meridian",-81],PARAMETER["scale_factor",0.9996],PARAMETER["false_easting",500000],PARAMETER["false_northing",0],UNIT["Meter",1]]',
    xy: [411461.807497, 4700123.744402],
    ll: [-82.07666015625, 42.448388671875]
  },
  { code: 'PROJCS["NAD83(CSRS) / UTM zone 17N",GEOGCS["NAD83(CSRS)",DATUM["NAD83_Canadian_Spatial_Reference_System",SPHEROID["GRS 1980",6378137,298.257222101,AUTHORITY["EPSG","7019"]],AUTHORITY["EPSG","6140"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.01745329251994328,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4617"]],UNIT["metre",1,AUTHORITY["EPSG","9001"]],PROJECTION["Transverse_Mercator"],PARAMETER["latitude_of_origin",0],PARAMETER["central_meridian",-81],PARAMETER["scale_factor",0.9996],PARAMETER["false_easting",500000],PARAMETER["false_northing",0],AUTHORITY["EPSG","2958"],AXIS["Easting",EAST],AXIS["Northing",NORTH]]',
    xy: [411461.807497, 4700123.744402],
    ll: [-82.07666015625, 42.448388671875]
  },
  {
    code: `PROJCRS["NAD83(CSRS) / UTM zone 17N",
    BASEGEOGCRS["NAD83(CSRS)",
        DATUM["NAD83 Canadian Spatial Reference System",
            ELLIPSOID["GRS 1980",6378137,298.257222101,
                LENGTHUNIT["metre",1]]],
        PRIMEM["Greenwich",0,
            ANGLEUNIT["degree",0.0174532925199433]],
        ID["EPSG",4617]],
    CONVERSION["UTM zone 17N",
        METHOD["Transverse Mercator",
            ID["EPSG",9807]],
        PARAMETER["Latitude of natural origin",0,
            ANGLEUNIT["degree",0.0174532925199433],
            ID["EPSG",8801]],
        PARAMETER["Longitude of natural origin",-81,
            ANGLEUNIT["degree",0.0174532925199433],
            ID["EPSG",8802]],
        PARAMETER["Scale factor at natural origin",0.9996,
            SCALEUNIT["unity",1],
            ID["EPSG",8805]],
        PARAMETER["False easting",500000,
            LENGTHUNIT["metre",1],
            ID["EPSG",8806]],
        PARAMETER["False northing",0,
            LENGTHUNIT["metre",1],
            ID["EPSG",8807]]],
    CS[Cartesian,2],
        AXIS["(E)",east,
            ORDER[1],
            LENGTHUNIT["metre",1]],
        AXIS["(N)",north,
            ORDER[2],
            LENGTHUNIT["metre",1]],
    USAGE[
        SCOPE["Engineering survey, topographic mapping."],
        AREA["Canada between 84°W and 78°W, onshore and offshore south of 84°N - Nunavut, Ontario and Quebec."],
        BBOX[41.67,-84,84,-78]],
    ID["EPSG",2958]]`,
    xy: [411462.11, 4700122.83],
    ll: [-82.07666, 42.44839],
    acc: {
      xy: 0.1,
      ll: 5
    }
  },
  { code: 'PROJCS["ETRS89 / UTM zone 32N",GEOGCS["ETRS89",DATUM["European_Terrestrial_Reference_System_1989",SPHEROID["GRS 1980",6378137,298.257222101,AUTHORITY["EPSG","7019"]],TOWGS84[0,0,0,0,0,0,0],AUTHORITY["EPSG","6258"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.0174532925199433,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4258"]],PROJECTION["Transverse_Mercator"],PARAMETER["latitude_of_origin",0],PARAMETER["central_meridian",9],PARAMETER["scale_factor",0.9996],PARAMETER["false_easting",500000],PARAMETER["false_northing",0],UNIT["metre",1,AUTHORITY["EPSG","9001"]],AXIS["Easting",EAST],AXIS["Northing",NORTH],AUTHORITY["EPSG","25832"]]',
    xy: [-1877994.66, 3932281.56],
    ll: [-16.10000000237, 32.879999998812]
  },
  {
    code: `PROJCRS["ETRS89 / UTM zone 32N",
    BASEGEOGCRS["ETRS89",
        ENSEMBLE["European Terrestrial Reference System 1989 ensemble",
            MEMBER["European Terrestrial Reference Frame 1989"],
            MEMBER["European Terrestrial Reference Frame 1990"],
            MEMBER["European Terrestrial Reference Frame 1991"],
            MEMBER["European Terrestrial Reference Frame 1992"],
            MEMBER["European Terrestrial Reference Frame 1993"],
            MEMBER["European Terrestrial Reference Frame 1994"],
            MEMBER["European Terrestrial Reference Frame 1996"],
            MEMBER["European Terrestrial Reference Frame 1997"],
            MEMBER["European Terrestrial Reference Frame 2000"],
            MEMBER["European Terrestrial Reference Frame 2005"],
            MEMBER["European Terrestrial Reference Frame 2014"],
            MEMBER["European Terrestrial Reference Frame 2020"],
            ELLIPSOID["GRS 1980",6378137,298.257222101,
                LENGTHUNIT["metre",1]],
            ENSEMBLEACCURACY[0.1]],
        PRIMEM["Greenwich",0,
            ANGLEUNIT["degree",0.0174532925199433]],
        ID["EPSG",4258]],
    CONVERSION["UTM zone 32N",
        METHOD["Transverse Mercator",
            ID["EPSG",9807]],
        PARAMETER["Latitude of natural origin",0,
            ANGLEUNIT["degree",0.0174532925199433],
            ID["EPSG",8801]],
        PARAMETER["Longitude of natural origin",9,
            ANGLEUNIT["degree",0.0174532925199433],
            ID["EPSG",8802]],
        PARAMETER["Scale factor at natural origin",0.9996,
            SCALEUNIT["unity",1],
            ID["EPSG",8805]],
        PARAMETER["False easting",500000,
            LENGTHUNIT["metre",1],
            ID["EPSG",8806]],
        PARAMETER["False northing",0,
            LENGTHUNIT["metre",1],
            ID["EPSG",8807]]],
    CS[Cartesian,2],
        AXIS["(E)",east,
            ORDER[1],
            LENGTHUNIT["metre",1]],
        AXIS["(N)",north,
            ORDER[2],
            LENGTHUNIT["metre",1]],
    USAGE[
        SCOPE["Engineering survey, topographic mapping."],
        AREA["Europe between 6°E and 12°E: Austria; Denmark - onshore and offshore; Germany - onshore and offshore; Italy - onshore and offshore; Norway including Svalbard - onshore and offshore; Spain - offshore."],
        BBOX[36.53,6,84.01,12.01]],
    USAGE[
        SCOPE["Pan-European conformal mapping at scales larger than 1:500,000."],
        AREA["Europe between 6°E and 12°E and approximately 36°30'N to 84°N."],
        BBOX[36.53,6,84.01,12.01]],
    ID["EPSG",25832]]`,
    xy: [-1877994.66, 3932281.56],
    ll: [-16.10000000237, 32.879999998812]
  },
  { code: 'PROJCS["NAD27 / UTM zone 14N",GEOGCS["NAD27 Coordinate System",DATUM["D_North American Datum 1927 (NAD27)",SPHEROID["Clarke_1866",6378206.4,294.97869821391]],PRIMEM["Greenwich",0],UNIT["Degree",0.017453292519943295]],PROJECTION["Transverse_Mercator"],PARAMETER["false_easting",500000],PARAMETER["false_northing",0],PARAMETER["latitude_of_origin",0],PARAMETER["central_meridian",-99],PARAMETER["scale_factor",0.9996],UNIT["Meter (m)",1]]',
    xy: [2026074.9192811155, 12812891.606450122],
    ll: [51.517955776474096, 61.56941794249017]
  },
  {
    code: `PROJCRS["NAD27 / UTM zone 14N",
    BASEGEOGCRS["NAD27",
        DATUM["North American Datum 1927",
            ELLIPSOID["Clarke 1866",6378206.4,294.978698213898,
                LENGTHUNIT["metre",1]]],
        PRIMEM["Greenwich",0,
            ANGLEUNIT["degree",0.0174532925199433]],
        ID["EPSG",4267]],
    CONVERSION["UTM zone 14N",
        METHOD["Transverse Mercator",
            ID["EPSG",9807]],
        PARAMETER["Latitude of natural origin",0,
            ANGLEUNIT["degree",0.0174532925199433],
            ID["EPSG",8801]],
        PARAMETER["Longitude of natural origin",-99,
            ANGLEUNIT["degree",0.0174532925199433],
            ID["EPSG",8802]],
        PARAMETER["Scale factor at natural origin",0.9996,
            SCALEUNIT["unity",1],
            ID["EPSG",8805]],
        PARAMETER["False easting",500000,
            LENGTHUNIT["metre",1],
            ID["EPSG",8806]],
        PARAMETER["False northing",0,
            LENGTHUNIT["metre",1],
            ID["EPSG",8807]]],
    CS[Cartesian,2],
        AXIS["(E)",east,
            ORDER[1],
            LENGTHUNIT["metre",1]],
        AXIS["(N)",north,
            ORDER[2],
            LENGTHUNIT["metre",1]],
    USAGE[
        SCOPE["Engineering survey, topographic mapping."],
        AREA["North America - between 102°W and 96°W. Canada - Manitoba; Nunavut; Saskatchewan. Mexico. United States (USA) - Iowa; Kansas; Minnesota; Nebraska; North Dakota; Oklahoma; South Dakota; Texas. Onshore for Mexican Pacific coast and Canadian Arctic but onshore and offshore for US & Mexico Gulf of Mexico and Caribbean coasts."],
        BBOX[15.59,-102,80.74,-96]],
    ID["EPSG",26714]]`,
    xy: [500028.183822102, 5538410.26425292],
    ll: [-99, 50],
    acc: {
      ll: 4,
      xy: -1 // 10  m
    }
  },
  { code: 'PROJCS["World_Mollweide",GEOGCS["GCS_WGS_1984",DATUM["WGS_1984",SPHEROID["WGS_1984",6378137,298.257223563]],PRIMEM["Greenwich",0],UNIT["Degree",0.017453292519943295]],PROJECTION["Mollweide"],PARAMETER["False_Easting",0],PARAMETER["False_Northing",0],PARAMETER["Central_Meridian",0],UNIT["Meter",1],AUTHORITY["EPSG","54009"]]',
    xy: [3891383.58309223, 6876758.9933288],
    ll: [60, 60]
  },
  { code: 'PROJCS["World_Mollweide",GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137,298.257223563]],PRIMEM["Greenwich",0],UNIT["Degree",0.017453292519943295]],PROJECTION["Mollweide"],PARAMETER["False_Easting",0],PARAMETER["False_Northing",0],PARAMETER["Central_Meridian",0],UNIT["Meter",1]]',
    xy: [3891383.58309223, 6876758.9933288],
    ll: [60, 60]
  },
  {
    code: `PROJCRS["World_Mollweide",
    BASEGEOGCRS["WGS 84",
        DATUM["World Geodetic System 1984",
            ELLIPSOID["WGS 84",6378137,298.257223563,
                LENGTHUNIT["metre",1]]],
        PRIMEM["Greenwich",0,
            ANGLEUNIT["Degree",0.0174532925199433]]],
    CONVERSION["World_Mollweide",
        METHOD["Mollweide"],
        PARAMETER["Longitude of natural origin",0,
            ANGLEUNIT["Degree",0.0174532925199433],
            ID["EPSG",8802]],
        PARAMETER["False easting",0,
            LENGTHUNIT["metre",1],
            ID["EPSG",8806]],
        PARAMETER["False northing",0,
            LENGTHUNIT["metre",1],
            ID["EPSG",8807]]],
    CS[Cartesian,2],
        AXIS["(E)",east,
            ORDER[1],
            LENGTHUNIT["metre",1]],
        AXIS["(N)",north,
            ORDER[2],
            LENGTHUNIT["metre",1]],
    USAGE[
        SCOPE["Not known."],
        AREA["World."],
        BBOX[-90,-180,90,180]],
    ID["ESRI",54009]]`,
    xy: [3891383.58309223, 6876758.9933288],
    ll: [60, 60]
  },
  {
    code: 'PROJCS["NAD83 / BC Albers",GEOGCS["NAD83",DATUM["North_American_Datum_1983",SPHEROID["GRS 1980",6378137,298.257222101,AUTHORITY["EPSG","7019"]],AUTHORITY["EPSG","6269"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.01745329251994328,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4269"]],UNIT["metre",1,AUTHORITY["EPSG","9001"]],PROJECTION["Albers_Conic_Equal_Area"],PARAMETER["standard_parallel_1",50],PARAMETER["standard_parallel_2",58.5],PARAMETER["latitude_of_center",45],PARAMETER["longitude_of_center",-126],PARAMETER["false_easting",1000000],PARAMETER["false_northing",0],AUTHORITY["EPSG","3005"],AXIS["Easting",EAST],AXIS["Northing",NORTH]]',
    ll: [-126.54, 54.15],
    xy: [964813.103719, 1016486.305862]
  }, {
    code: 'PROJCS["NAD83 / BC Albers",GEOGCS["GCS_North_American_1983",DATUM["D_North_American_1983",SPHEROID["GRS_1980",6378137,298.257222101]],PRIMEM["Greenwich",0],UNIT["Degree",0.017453292519943295]],PROJECTION["Albers"],PARAMETER["standard_parallel_1",50],PARAMETER["standard_parallel_2",58.5],PARAMETER["latitude_of_origin",45],PARAMETER["central_meridian",-126],PARAMETER["false_easting",1000000],PARAMETER["false_northing",0],UNIT["Meter",1]]',
    ll: [-126.54, 54.15],
    xy: [964813.103719, 1016486.305862]
  },
  {
    code: `PROJCRS["NAD83 / BC Albers",
    BASEGEOGCRS["NAD83",
        DATUM["North American Datum 1983",
            ELLIPSOID["GRS 1980",6378137,298.257222101,
                LENGTHUNIT["metre",1]]],
        PRIMEM["Greenwich",0,
            ANGLEUNIT["degree",0.0174532925199433]],
        ID["EPSG",4269]],
    CONVERSION["British Columbia Albers",
        METHOD["Albers Equal Area",
            ID["EPSG",9822]],
        PARAMETER["Latitude of false origin",45,
            ANGLEUNIT["degree",0.0174532925199433],
            ID["EPSG",8821]],
        PARAMETER["Longitude of false origin",-126,
            ANGLEUNIT["degree",0.0174532925199433],
            ID["EPSG",8822]],
        PARAMETER["Latitude of 1st standard parallel",50,
            ANGLEUNIT["degree",0.0174532925199433],
            ID["EPSG",8823]],
        PARAMETER["Latitude of 2nd standard parallel",58.5,
            ANGLEUNIT["degree",0.0174532925199433],
            ID["EPSG",8824]],
        PARAMETER["Easting at false origin",1000000,
            LENGTHUNIT["metre",1],
            ID["EPSG",8826]],
        PARAMETER["Northing at false origin",0,
            LENGTHUNIT["metre",1],
            ID["EPSG",8827]]],
    CS[Cartesian,2],
        AXIS["(E)",east,
            ORDER[1],
            LENGTHUNIT["metre",1]],
        AXIS["(N)",north,
            ORDER[2],
            LENGTHUNIT["metre",1]],
    USAGE[
        SCOPE["Province-wide spatial data management."],
        AREA["Canada - British Columbia."],
        BBOX[48.25,-139.04,60.01,-114.08]],
    ID["EPSG",3005]]`,
    ll: [-126.54, 54.15],
    xy: [964813.103719, 1016486.305862],
    acc: {
      ll: 5,
      xy: 0.25
    }
  },
  {
    code: 'PROJCS["Azimuthal_Equidistant",GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137,298.257223563]],PRIMEM["Greenwich",0],UNIT["Degree",0.017453292519943295]],PROJECTION["Azimuthal_Equidistant"],PARAMETER["False_Easting",0],PARAMETER["False_Northing",0],PARAMETER["Central_Meridian",0],PARAMETER["Latitude_Of_Origin",0],UNIT["Meter",1]]',
    ll: [0, 0],
    xy: [0, 0]
  },
  {
    code: `PROJCRS["World_Azimuthal_Equidistant",
    BASEGEOGCRS["WGS 84",
        DATUM["World Geodetic System 1984",
            ELLIPSOID["WGS 84",6378137,298.257223563,
                LENGTHUNIT["metre",1]]],
        PRIMEM["Greenwich",0,
            ANGLEUNIT["Degree",0.0174532925199433]]],
    CONVERSION["World_Azimuthal_Equidistant",
        METHOD["Azimuthal Equidistant",
            ID["EPSG",1125]],
        PARAMETER["Latitude of natural origin",0,
            ANGLEUNIT["Degree",0.0174532925199433],
            ID["EPSG",8801]],
        PARAMETER["Longitude of natural origin",0,
            ANGLEUNIT["Degree",0.0174532925199433],
            ID["EPSG",8802]],
        PARAMETER["False easting",0,
            LENGTHUNIT["metre",1],
            ID["EPSG",8806]],
        PARAMETER["False northing",0,
            LENGTHUNIT["metre",1],
            ID["EPSG",8807]]],
    CS[Cartesian,2],
        AXIS["(E)",east,
            ORDER[1],
            LENGTHUNIT["metre",1]],
        AXIS["(N)",north,
            ORDER[2],
            LENGTHUNIT["metre",1]],
    USAGE[
        SCOPE["Not known."],
        AREA["World."],
        BBOX[-90,-180,90,180]],
    ID["ESRI",54032]]`,
    ll: [0, 0],
    xy: [0, 0]
  },
  {
    code: 'PROJCS["Sphere_Azimuthal_Equidistant",GEOGCS["GCS_Sphere",DATUM["Not_specified_based_on_Authalic_Sphere",SPHEROID["Sphere",6371000,0]],PRIMEM["Greenwich",0],UNIT["Degree",0.017453292519943295]],PROJECTION["Azimuthal_Equidistant"],PARAMETER["False_Easting",0],PARAMETER["False_Northing",0],PARAMETER["Central_Meridian",0],PARAMETER["Latitude_Of_Origin",0],UNIT["Meter",1]]',
    ll: [0, 0],
    xy: [0, 0]
  },
  {
    code: `PROJCRS["Sphere_Azimuthal_Equidistant",
    BASEGEOGCRS["Unknown datum based upon the Authalic Sphere",
        DATUM["Not specified (based on Authalic Sphere)",
            ELLIPSOID["Sphere",6371000,0,
                LENGTHUNIT["metre",1]]],
        PRIMEM["Greenwich",0,
            ANGLEUNIT["Degree",0.0174532925199433]]],
    CONVERSION["Sphere_Azimuthal_Equidistant",
        METHOD["Azimuthal Equidistant",
            ID["EPSG",1125]],
        PARAMETER["Latitude of natural origin",0,
            ANGLEUNIT["Degree",0.0174532925199433],
            ID["EPSG",8801]],
        PARAMETER["Longitude of natural origin",0,
            ANGLEUNIT["Degree",0.0174532925199433],
            ID["EPSG",8802]],
        PARAMETER["False easting",0,
            LENGTHUNIT["metre",1],
            ID["EPSG",8806]],
        PARAMETER["False northing",0,
            LENGTHUNIT["metre",1],
            ID["EPSG",8807]]],
    CS[Cartesian,2],
        AXIS["(E)",east,
            ORDER[1],
            LENGTHUNIT["metre",1]],
        AXIS["(N)",north,
            ORDER[2],
            LENGTHUNIT["metre",1]],
    USAGE[
        SCOPE["Not known."],
        AREA["World."],
        BBOX[-90,-180,90,180]],
    ID["ESRI",53032]]`,
    ll: [0, 0],
    xy: [0, 0]
  },
  {
    code: 'PROJCS["North_Pole_Azimuthal_Equidistant",GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137,298.257223563]],PRIMEM["Greenwich",0],UNIT["Degree",0.017453292519943295]],PROJECTION["Azimuthal_Equidistant"],PARAMETER["False_Easting",0],PARAMETER["False_Northing",0],PARAMETER["Central_Meridian",0],PARAMETER["Latitude_Of_Origin",90],UNIT["Meter",1]]',
    ll: [50.977303830208, 30.915260093747],
    xy: [5112279.911077, -4143196.76625]
  },
  {
    code: 'PROJCS["North_Pole_Azimuthal_Equidistant",GEOGCS["GCS_WGS_1984",DATUM["WGS_1984",SPHEROID["WGS_1984",6378137,298.257223563]],PRIMEM["Greenwich",0],UNIT["Degree",0.017453292519943295]],PROJECTION["Azimuthal_Equidistant"],PARAMETER["False_Easting",0],PARAMETER["False_Northing",0],PARAMETER["Central_Meridian",0],PARAMETER["Latitude_Of_Origin",90],UNIT["Meter",1],AUTHORITY["EPSG","102016"]]',
    ll: [50.977303830208, 30.915260093747],
    xy: [5112279.911077, -4143196.76625]
  },
  {
    code: `PROJCRS["North_Pole_Azimuthal_Equidistant",
    BASEGEOGCRS["WGS 84",
        DATUM["World Geodetic System 1984",
            ELLIPSOID["WGS 84",6378137,298.257223563,
                LENGTHUNIT["metre",1]]],
        PRIMEM["Greenwich",0,
            ANGLEUNIT["Degree",0.0174532925199433]]],
    CONVERSION["North_Pole_Azimuthal_Equidistant",
        METHOD["Azimuthal Equidistant",
            ID["EPSG",1125]],
        PARAMETER["Latitude of natural origin",90,
            ANGLEUNIT["Degree",0.0174532925199433],
            ID["EPSG",8801]],
        PARAMETER["Longitude of natural origin",0,
            ANGLEUNIT["Degree",0.0174532925199433],
            ID["EPSG",8802]],
        PARAMETER["False easting",0,
            LENGTHUNIT["metre",1],
            ID["EPSG",8806]],
        PARAMETER["False northing",0,
            LENGTHUNIT["metre",1],
            ID["EPSG",8807]]],
    CS[Cartesian,2],
        AXIS["(E)",east,
            ORDER[1],
            LENGTHUNIT["metre",1]],
        AXIS["(N)",north,
            ORDER[2],
            LENGTHUNIT["metre",1]],
    USAGE[
        SCOPE["Not known."],
        AREA["Northern hemisphere."],
        BBOX[0,-180,90,180]],
    ID["ESRI",102016]]`,
    ll: [50.977303830208, 30.915260093747],
    xy: [5112279.911077, -4143196.76625]
  },
  {
    code: '+proj=moll +lon_0=10 +R=6400000',
    ll: [-90, 85],
    xy: [-2080158.10954, 8855229.1452],
    acc: {
      ll: 3,
      xy: 3
    }
  },
  {
    code: '+proj=ob_tran +o_proj=moll +o_lat_p=45 +o_lon_p=-90',
    ll: [-2, -1],
    xy: [-7421459.0847, -5444548.62239],
    acc: {
      ll: 5,
      xy: 0
    }
  },
  {
    code: '+proj=ob_tran +o_proj=eqearth +o_lat_p=85 +o_lon_p=10',
    ll: [20, 11],
    xy: [2841069.7339, 808313.2811],
    acc: {
      ll: 1,
      xy: -4
    }
  },
  {
    code: '+proj=ob_tran +o_proj=eqearth +o_lat_p=85 +o_lon_p=10',
    ll: [20, 11],
    xy: [2841069.7339, 808313.2811],
    acc: {
      ll: 1,
      xy: -4
    }
  },
  {
    code: '+proj=ob_tran +o_proj=longlat +o_lon_p=0 +o_lat_p=35',
    ll: [-105, 40],
    xy: [-60.8425, 32.0797],
    acc: {
      ll: 1,
      xy: -4
    }
  },
  {
    code: '+proj=ob_tran +o_proj=longlat +o_lon_p=0 +o_lat_p=35 +lon_0=-113 +R=6371229 +no_defs +type=crs',
    ll: [-105, 40],
    xy: [6.3262, -14.6381],
    acc: {
      ll: 1,
      xy: -4
    }
  },
  {
    code: '+proj=ob_tran +o_proj=longlat +o_lon_p=0 +o_lat_p=31.758312 +lon_0=-92.402969 +R=6371229 +no_defs +type=crs',
    ll: [-105, 40],
    xy: [-10.0777, -17.2983],
    acc: {
      ll: 1,
      xy: -4
    }
  },
  {
    code: '+proj=ob_tran +o_proj=moll +o_alpha=5 +o_lon_c=40 +o_lat_c=-10',
    ll: [10, 5],
    xy: [-154995.9625, -8241537.7451],
    acc: {
      ll: 3,
      xy: 3
    }
  },
  {
    code: '+proj=ob_tran +o_proj=moll +o_lon_1=-180 +o_lon_2=180 +o_lat_1=-3 +o_lat_2=3',
    ll: [10, 5],
    xy: [-938419.6738, -8448989.1020],
    acc: {
      ll: 3,
      xy: 3
    }
  },
  {
    code: '+proj=ob_tran +o_proj=moll +o_lon_1=-11 +o_lon_2=6 +o_lat_1=-3 +o_lat_2=3 +x_0=10000 +y_0=50000',
    ll: [-90, 85],
    xy: [3725830.5914, -7713738.5789],
    acc: {
      ll: 3,
      xy: 3
    }
  },
  {
    code: '+proj=ob_tran +o_proj=moll +o_lon_1=-11 +o_lon_2=6 +o_lat_1=-3 +o_lat_2=3 +x_0=10000 +y_0=50000 +R=6400000',
    ll: [-90, 85],
    xy: [3738567.7284, -7740351.1488],
    acc: {
      ll: 3,
      xy: 3
    }
  },
  {
    code: '+proj=ob_tran +o_proj=moll +R=6378137.0  +o_lon_p=0  +o_lat_p=0  +lon_0=180',
    ll: [10, 20],
    xy: [-1384841.18787, 7581707.88240],
    acc: {
      ll: 3,
      xy: 3
    }
  },
  {
    code: '+proj=ob_tran +o_proj=moll +o_lon_p=0  +o_lat_p=0  +lon_0=180 +R=6400000 +ellps=clrk80ign +pm=paris',
    ll: [10, 20],
    xy: [-1068593.9375, 7685891.0261],
    acc: {
      ll: 3,
      xy: 3
    }
  },
  {
    code: 'PROJCS["Mount Dillon / Tobago Grid",GEOGCS["Mount Dillon",DATUM["Mount_Dillon",SPHEROID["Clarke 1858",6378293.645208759,294.2606763692654,AUTHORITY["EPSG","7007"]],AUTHORITY["EPSG","6157"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.01745329251994328,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4157"]],UNIT["Clarke\'s link",0.201166195164,AUTHORITY["EPSG","9039"]],PROJECTION["Cassini_Soldner"],PARAMETER["latitude_of_origin",11.25217861111111],PARAMETER["central_meridian",-60.68600888888889],PARAMETER["false_easting",187500],PARAMETER["false_northing",180000],AUTHORITY["EPSG","2066"],AXIS["Easting",EAST],AXIS["Northing",NORTH]]',
    ll: [-60.676753018, 11.2487234308],
    xy: [192524.3061766178, 178100.2740019509],
    acc: {
      ll: 1,
      xy: -4
    }
  }, {
    code: 'PROJCS["Mount Dillon / Tobago Grid",GEOGCS["Mount Dillon",DATUM["D_Mount_Dillon",SPHEROID["Clarke_1858",6378293.645208759,294.2606763692654]],PRIMEM["Greenwich",0],UNIT["Degree",0.017453292519943295]],PROJECTION["Cassini"],PARAMETER["latitude_of_origin",11.25217861111111],PARAMETER["central_meridian",-60.68600888888889],PARAMETER["false_easting",187500],PARAMETER["false_northing",180000],UNIT["Clarke\'s link",0.201166195164]]',
    ll: [-60.676753018, 11.2487234308],
    xy: [192524.3061766178, 178100.2740019509],
    acc: {
      ll: 1,
      xy: -4
    }
  }, {
    code: `PROJCRS["Mount Dillon / Tobago Grid",
    BASEGEOGCRS["Mount Dillon",
        DATUM["Mount Dillon",
            ELLIPSOID["Clarke 1858",20926348,294.260676369261,
                LENGTHUNIT["Clarke's foot",0.3047972654]]],
        PRIMEM["Greenwich",0,
            ANGLEUNIT["degree",0.0174532925199433]],
        ID["EPSG",4157]],
    CONVERSION["Tobago Grid",
        METHOD["Cassini-Soldner",
            ID["EPSG",9806]],
        PARAMETER["Latitude of natural origin",11.2521786111111,
            ANGLEUNIT["degree",0.0174532925199433],
            ID["EPSG",8801]],
        PARAMETER["Longitude of natural origin",-60.6860088888889,
            ANGLEUNIT["degree",0.0174532925199433],
            ID["EPSG",8802]],
        PARAMETER["False easting",187500,
            LENGTHUNIT["Clarke's link",0.201166195164],
            ID["EPSG",8806]],
        PARAMETER["False northing",180000,
            LENGTHUNIT["Clarke's link",0.201166195164],
            ID["EPSG",8807]]],
    CS[Cartesian,2],
        AXIS["(E)",east,
            ORDER[1],
            LENGTHUNIT["Clarke's link",0.201166195164]],
        AXIS["(N)",north,
            ORDER[2],
            LENGTHUNIT["Clarke's link",0.201166195164]],
    USAGE[
        SCOPE["Engineering survey, topographic mapping."],
        AREA["Trinidad and Tobago - Tobago - onshore."],
        BBOX[11.08,-60.9,11.41,-60.44]],
    ID["EPSG",2066]]`,
    ll: [-60.66999, 11.24499],
    xy: [196190.12, 176053.13],
    acc: {
      ll: 1,
      xy: -4
    }
  },
  // {
  //   code: 'EPSG:3975',
  //   ll: [-9.764450683, 25.751953],
  //   xy: [-942135.525095996, 3178441.8667094777]
  // },
  {
    code: 'PROJCS["World Equidistant Cylindrical (Sphere)",GEOGCS["Unspecified datum based upon the GRS 1980 Authalic Sphere",DATUM["Not_specified_based_on_GRS_1980_Authalic_Sphere",SPHEROID["GRS 1980 Authalic Sphere",6371007,0,AUTHORITY["EPSG","7048"]],AUTHORITY["EPSG","6047"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.01745329251994328,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4047"]],UNIT["metre",1,AUTHORITY["EPSG","9001"]],PROJECTION["Equirectangular"],PARAMETER["latitude_of_origin",0],PARAMETER["central_meridian",0],PARAMETER["false_easting",0],PARAMETER["false_northing",0],AUTHORITY["EPSG","3786"],AXIS["X",EAST],AXIS["Y",NORTH]]',
    ll: [-1.7539371169976, 12.632997701986],
    xy: [-195029.12334755991, 1395621.9368162225],
    acc: {
      ll: 2
    }
  }, {
    code: 'PROJCS["World Equidistant Cylindrical (Sphere)",GEOGCS["Unspecified datum based upon the GRS 1980 Authalic Sphere",DATUM["D_",SPHEROID["GRS_1980_Authalic_Sphere",6371007,0]],PRIMEM["Greenwich",0],UNIT["Degree",0.017453292519943295]],PROJECTION["Equidistant_Cylindrical"],PARAMETER["central_meridian",0],PARAMETER["false_easting",0],PARAMETER["false_northing",0],UNIT["Meter",1]]',
    ll: [-1.7539371169976, 12.632997701986],
    xy: [-195029.12334755991, 1395621.9368162225],
    acc: {
      ll: 2
    }
  },
  {
    code: { $schema: 'https://proj.org/schemas/v0.7/projjson.schema.json', type: 'ProjectedCRS', name: 'World Equidistant Cylindrical (Sphere)', base_crs: { type: 'GeographicCRS', name: 'Unspecified datum based upon the GRS 1980 Authalic Sphere', datum: { type: 'GeodeticReferenceFrame', name: 'Not specified (based on GRS 1980 Authalic Sphere)', ellipsoid: { name: 'GRS 1980 Authalic Sphere', radius: 6371007 } }, coordinate_system: { subtype: 'ellipsoidal', axis: [{ name: 'Geodetic latitude', abbreviation: 'Lat', direction: 'north', unit: 'degree' }, { name: 'Geodetic longitude', abbreviation: 'Lon', direction: 'east', unit: 'degree' }] }, id: { authority: 'EPSG', code: 4047 } }, conversion: { name: 'World Equidistant Cylindrical (Sphere)', method: { name: 'Equidistant Cylindrical (Spherical)', id: { authority: 'EPSG', code: 1029 } }, parameters: [{ name: 'Latitude of 1st standard parallel', value: 0, unit: 'degree', id: { authority: 'EPSG', code: 8823 } }, { name: 'Longitude of natural origin', value: 0, unit: 'degree', id: { authority: 'EPSG', code: 8802 } }, { name: 'False easting', value: 0, unit: 'metre', id: { authority: 'EPSG', code: 8806 } }, { name: 'False northing', value: 0, unit: 'metre', id: { authority: 'EPSG', code: 8807 } }] }, coordinate_system: { subtype: 'Cartesian', axis: [{ name: 'Easting', abbreviation: 'X', direction: 'east', unit: 'metre' }, { name: 'Northing', abbreviation: 'Y', direction: 'north', unit: 'metre' }] }, scope: 'Web mapping and visualisation.', area: 'World.', bbox: { south_latitude: -90, west_longitude: -180, north_latitude: 90, east_longitude: 180 }, id: { authority: 'EPSG', code: 4088 } },
    ll: [-1.7539371169976, 12.632997701986],
    xy: [-195029.12334755991, 1395621.9368162225],
    acc: {
      ll: 2
    }
  },
  {
    code: 'PROJCS["Segara / NEIEZ",GEOGCS["Segara",DATUM["Gunung_Segara",SPHEROID["Bessel 1841",6377397.155,299.1528128,AUTHORITY["EPSG","7004"]],AUTHORITY["EPSG","6613"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.01745329251994328,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4613"]],UNIT["metre",1,AUTHORITY["EPSG","9001"]],PROJECTION["Mercator_1SP"],PARAMETER["central_meridian",110],PARAMETER["scale_factor",0.997],PARAMETER["false_easting",3900000],PARAMETER["false_northing",900000],AUTHORITY["EPSG","3000"],AXIS["X",EAST],AXIS["Y",NORTH]]',
    ll: [116.65547897884308, -0.6595605286983485],
    xy: [4638523.040740433, 827245.2586932715]
  }, {
    code: 'PROJCS["Segara / NEIEZ",GEOGCS["Segara",DATUM["D_Gunung_Segara",SPHEROID["Bessel_1841",6377397.155,299.1528128]],PRIMEM["Greenwich",0],UNIT["Degree",0.017453292519943295]],PROJECTION["Mercator"],PARAMETER["central_meridian",110],PARAMETER["scale_factor",0.997],PARAMETER["false_easting",3900000],PARAMETER["false_northing",900000],UNIT["Meter",1]]',
    ll: [116.65547897884308, -0.6595605286983485],
    xy: [4638523.040740433, 827245.2586932715]
  },
  {
    code: { $schema: 'https://proj.org/schemas/v0.7/projjson.schema.json', type: 'ProjectedCRS', name: 'Segara / NEIEZ', base_crs: { type: 'GeographicCRS', name: 'Segara', datum: { type: 'GeodeticReferenceFrame', name: 'Gunung Segara', ellipsoid: { name: 'Bessel 1841', semi_major_axis: 6377397.155, inverse_flattening: 299.1528128 } }, coordinate_system: { subtype: 'ellipsoidal', axis: [{ name: 'Geodetic latitude', abbreviation: 'Lat', direction: 'north', unit: 'degree' }, { name: 'Geodetic longitude', abbreviation: 'Lon', direction: 'east', unit: 'degree' }] }, id: { authority: 'EPSG', code: 4613 } }, conversion: { name: 'Netherlands East Indies Equatorial Zone', method: { name: 'Mercator (variant A)', id: { authority: 'EPSG', code: 9804 } }, parameters: [{ name: 'Latitude of natural origin', value: 0, unit: 'degree', id: { authority: 'EPSG', code: 8801 } }, { name: 'Longitude of natural origin', value: 110, unit: 'degree', id: { authority: 'EPSG', code: 8802 } }, { name: 'Scale factor at natural origin', value: 0.997, unit: 'unity', id: { authority: 'EPSG', code: 8805 } }, { name: 'False easting', value: 3900000, unit: 'metre', id: { authority: 'EPSG', code: 8806 } }, { name: 'False northing', value: 900000, unit: 'metre', id: { authority: 'EPSG', code: 8807 } }] }, coordinate_system: { subtype: 'Cartesian', axis: [{ name: 'Easting', abbreviation: 'X', direction: 'east', unit: 'metre' }, { name: 'Northing', abbreviation: 'Y', direction: 'north', unit: 'metre' }] }, scope: 'Engineering survey, topographic mapping.', area: 'Indonesia - Kalimantan - onshore east coastal area including Mahakam delta coastal and offshore shelf areas.', bbox: { south_latitude: -4.24, west_longitude: 114.55, north_latitude: 4.29, east_longitude: 119.06 }, id: { authority: 'EPSG', code: 3000 } },
    ll: [116.6554863, -0.65952],
    xy: [4638523.040740433, 827245.2586932715],
    acc: {
      xy: 1
    }
  },
  {
    code: 'PROJCS["Beduaram / TM 13 NE",GEOGCS["Beduaram",DATUM["Beduaram",SPHEROID["Clarke 1880 (IGN)",6378249.2,293.4660212936269,AUTHORITY["EPSG","7011"]],TOWGS84[-106,-87,188,0,0,0,0],AUTHORITY["EPSG","6213"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.01745329251994328,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4213"]],UNIT["metre",1,AUTHORITY["EPSG","9001"]],PROJECTION["Transverse_Mercator"],PARAMETER["latitude_of_origin",0],PARAMETER["central_meridian",13],PARAMETER["scale_factor",0.9996],PARAMETER["false_easting",500000],PARAMETER["false_northing",0],AUTHORITY["EPSG","2931"],AXIS["X",EAST],AXIS["Y",NORTH]]',
    ll: [5, 25],
    xy: [-308919.1234711099, 2788738.255936392]
  },
  {
    code: 'PROJCS["Beduaram / TM 13 NE",GEOGCS["Beduaram",DATUM["D_Beduaram",SPHEROID["Clarke_1880_IGN",6378249.2,293.4660212936269]],PRIMEM["Greenwich",0],UNIT["Degree",0.017453292519943295]],PROJECTION["Transverse_Mercator"],PARAMETER["latitude_of_origin",0],PARAMETER["central_meridian",13],PARAMETER["scale_factor",0.9996],PARAMETER["false_easting",500000],PARAMETER["false_northing",0],UNIT["Meter",1]]',
    ll: [5, 25],
    xy: [-308919.1234711099, 2788738.255936392]
  },
  {
    code: `PROJCRS["Beduaram / TM 13 NE",
    BASEGEOGCRS["Beduaram",
        DATUM["Beduaram",
            ELLIPSOID["Clarke 1880 (IGN)",6378249.2,293.466021293627,
                LENGTHUNIT["metre",1]]],
        PRIMEM["Greenwich",0,
            ANGLEUNIT["degree",0.0174532925199433]],
        ID["EPSG",4213]],
    CONVERSION["TM 13 NE",
        METHOD["Transverse Mercator",
            ID["EPSG",9807]],
        PARAMETER["Latitude of natural origin",0,
            ANGLEUNIT["degree",0.0174532925199433],
            ID["EPSG",8801]],
        PARAMETER["Longitude of natural origin",13,
            ANGLEUNIT["degree",0.0174532925199433],
            ID["EPSG",8802]],
        PARAMETER["Scale factor at natural origin",0.9996,
            SCALEUNIT["unity",1],
            ID["EPSG",8805]],
        PARAMETER["False easting",500000,
            LENGTHUNIT["metre",1],
            ID["EPSG",8806]],
        PARAMETER["False northing",0,
            LENGTHUNIT["metre",1],
            ID["EPSG",8807]]],
    CS[Cartesian,2],
        AXIS["easting (X)",east,
            ORDER[1],
            LENGTHUNIT["metre",1]],
        AXIS["northing (Y)",north,
            ORDER[2],
            LENGTHUNIT["metre",1]],
    USAGE[
        SCOPE["Oil and gas exploration and production."],
        AREA["Niger - southeast"],
        BBOX[12.8,7.81,16.7,14.9]],
    ID["EPSG",2931]]`,
    ll: [5, 25],
    xy: [-308919.1234711099, 2788738.255936392]
  },
  {
    code: '+proj=lcc +lat_1=49.5 +lat_0=49.5 +lon_0=0 +k_0=0.999877341 +x_0=600000 +y_0=1200000 +ellps=clrk80ign +pm=paris +towgs84=-168,-60,320,0,0,0,0 +units=m +no_defs +type=crs',
    ll: [2.294482, 48.859045],
    xy: [596916.561147926957, 1128733.073948238511]
  },
  {
    code: 'PROJCS["S-JTSK (Ferro) / Krovak",GEOGCS["S-JTSK (Ferro)",DATUM["S_JTSK_Ferro",SPHEROID["Bessel 1841",6377397.155,299.1528128,AUTHORITY["EPSG","7004"]],AUTHORITY["EPSG","6818"]],PRIMEM["Ferro",-17.66666666666667,AUTHORITY["EPSG","8909"]],UNIT["degree",0.01745329251994328,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4818"]],UNIT["metre",1,AUTHORITY["EPSG","9001"]],PROJECTION["Krovak"],PARAMETER["latitude_of_center",49.5],PARAMETER["longitude_of_center",42.5],PARAMETER["azimuth",30.28813972222222],PARAMETER["pseudo_standard_parallel_1",78.5],PARAMETER["scale_factor",0.9999],PARAMETER["false_easting",0],PARAMETER["false_northing",0],AUTHORITY["EPSG","2065"],AXIS["Y",WEST],AXIS["X",SOUTH]]',
    ll: [17.323583231075897, 49.39440725405376],
    xy: [-544115.474379, -1144058.330762]
  }, {
    code: 'PROJCS["S-JTSK (Ferro) / Krovak",GEOGCS["S-JTSK (Ferro)",DATUM["D_S_JTSK",SPHEROID["Bessel_1841",6377397.155,299.1528128]],PRIMEM["Ferro",-17.66666666666667],UNIT["Degree",0.017453292519943295]],PROJECTION["Krovak"],PARAMETER["latitude_of_center",49.5],PARAMETER["longitude_of_center",42.5],PARAMETER["azimuth",30.28813972222222],PARAMETER["pseudo_standard_parallel_1",78.5],PARAMETER["scale_factor",0.9999],PARAMETER["false_easting",0],PARAMETER["false_northing",0],UNIT["Meter",1]]',
    ll: [17.323583231075897, 49.39440725405376],
    xy: [-544115.474379, -1144058.330762]
  },
  {
    code: `PROJCRS["S-JTSK (Ferro) / Krovak",
    BASEGEOGCRS["S-JTSK (Ferro)",
        DATUM["System of the Unified Trigonometrical Cadastral Network (Ferro)",
            ELLIPSOID["Bessel 1841",6377397.155,299.1528128,
                LENGTHUNIT["metre",1]]],
        PRIMEM["Ferro",-17.6666666666667,
            ANGLEUNIT["degree",0.0174532925199433]],
        ID["EPSG",4818]],
    CONVERSION["Krovak",
        METHOD["Krovak",
            ID["EPSG",9819]],
        PARAMETER["Latitude of projection centre",49.5,
            ANGLEUNIT["degree",0.0174532925199433],
            ID["EPSG",8811]],
        PARAMETER["Longitude of origin",42.5,
            ANGLEUNIT["degree",0.0174532925199433],
            ID["EPSG",8833]],
        PARAMETER["Co-latitude of cone axis",30.2881397527778,
            ANGLEUNIT["degree",0.0174532925199433],
            ID["EPSG",1036]],
        PARAMETER["Latitude of pseudo standard parallel",78.5,
            ANGLEUNIT["degree",0.0174532925199433],
            ID["EPSG",8818]],
        PARAMETER["Scale factor on pseudo standard parallel",0.9999,
            SCALEUNIT["unity",1],
            ID["EPSG",8819]],
        PARAMETER["False easting",0,
            LENGTHUNIT["metre",1],
            ID["EPSG",8806]],
        PARAMETER["False northing",0,
            LENGTHUNIT["metre",1],
            ID["EPSG",8807]]],
    CS[Cartesian,2],
        AXIS["southing (X)",south,
            ORDER[1],
            LENGTHUNIT["metre",1]],
        AXIS["westing (Y)",west,
            ORDER[2],
            LENGTHUNIT["metre",1]],
    USAGE[
        SCOPE["Cadastre in Czechia."],
        AREA["Czechia; Slovakia."],
        BBOX[47.73,12.09,51.06,22.56]],
    ID["EPSG",2065]]`,
    ll: [17.323583231075897, 49.39440725405376],
    xy: [-544115.474379, -1144058.330762]
  }, {
    code: 'PROJCS["Sphere_Miller_Cylindrical",GEOGCS["GCS_Sphere",DATUM["D_Sphere",SPHEROID["Sphere",6371000,0]],PRIMEM["Greenwich",0],UNIT["Degree",0.017453292519943295]],PROJECTION["Miller_Cylindrical"],PARAMETER["False_Easting",0],PARAMETER["False_Northing",0],PARAMETER["Central_Meridian",0],UNIT["Meter",1]]',
    ll: [-1.3973289073953, 12.649176474268513],
    xy: [-155375.88535614178, 1404635.2633403721],
    acc: {
      ll: 3
    }
  }, {
    code: 'PROJCS["Sphere_Miller_Cylindrical",GEOGCS["GCS_Sphere",DATUM["Not_specified_based_on_Authalic_Sphere",SPHEROID["Sphere",6371000,0]],PRIMEM["Greenwich",0],UNIT["Degree",0.017453292519943295]],PROJECTION["Miller_Cylindrical"],PARAMETER["False_Easting",0],PARAMETER["False_Northing",0],PARAMETER["Central_Meridian",0],UNIT["Meter",1],AUTHORITY["EPSG","53003"]]',
    ll: [-1.3973289073953, 12.649176474268513],
    xy: [-155375.88535614178, 1404635.2633403721],
    acc: {
      ll: 3
    }
  }, {
    code: { $schema: 'https://proj.org/schemas/v0.7/projjson.schema.json', type: 'ProjectedCRS', name: 'Sphere_Miller_Cylindrical', base_crs: { type: 'GeographicCRS', name: 'Unknown datum based upon the Authalic Sphere', datum: { type: 'GeodeticReferenceFrame', name: 'Not specified (based on Authalic Sphere)', ellipsoid: { name: 'Sphere', radius: 6371000 } }, coordinate_system: { subtype: 'ellipsoidal', axis: [{ name: 'Longitude', abbreviation: 'lon', direction: 'east', unit: { type: 'AngularUnit', name: 'Degree', conversion_factor: 0.0174532925199433 } }, { name: 'Latitude', abbreviation: 'lat', direction: 'north', unit: { type: 'AngularUnit', name: 'Degree', conversion_factor: 0.0174532925199433 } }] } }, conversion: { name: 'Sphere_Miller_Cylindrical', method: { name: 'Miller Cylindrical' }, parameters: [{ name: 'Longitude of natural origin', value: 0, unit: { type: 'AngularUnit', name: 'Degree', conversion_factor: 0.0174532925199433 }, id: { authority: 'EPSG', code: 8802 } }, { name: 'False easting', value: 0, unit: 'metre', id: { authority: 'EPSG', code: 8806 } }, { name: 'False northing', value: 0, unit: 'metre', id: { authority: 'EPSG', code: 8807 } }] }, coordinate_system: { subtype: 'Cartesian', axis: [{ name: 'Easting', abbreviation: 'E', direction: 'east', unit: 'metre' }, { name: 'Northing', abbreviation: 'N', direction: 'north', unit: 'metre' }] }, scope: 'Not known.', area: 'World.', bbox: { south_latitude: -90, west_longitude: -180, north_latitude: 90, east_longitude: 180 }, id: { authority: 'ESRI', code: 53003 } },
    ll: [-1.3973289073953, 12.649176474268513],
    xy: [-155375.88535614178, 1404635.2633403721],
    acc: {
      ll: 3
    }
  }, {
    code: `PROJCRS["Sphere_Miller_Cylindrical",
    BASEGEOGCRS["Unknown datum based upon the Authalic Sphere",
        DATUM["Not specified (based on Authalic Sphere)",
            ELLIPSOID["Sphere",6371000,0,
                LENGTHUNIT["metre",1]]],
        PRIMEM["Greenwich",0,
            ANGLEUNIT["Degree",0.0174532925199433]]],
    CONVERSION["Sphere_Miller_Cylindrical",
        METHOD["Miller Cylindrical"],
        PARAMETER["Longitude of natural origin",0,
            ANGLEUNIT["Degree",0.0174532925199433],
            ID["EPSG",8802]],
        PARAMETER["False easting",0,
            LENGTHUNIT["metre",1],
            ID["EPSG",8806]],
        PARAMETER["False northing",0,
            LENGTHUNIT["metre",1],
            ID["EPSG",8807]]],
    CS[Cartesian,2],
        AXIS["(E)",east,
            ORDER[1],
            LENGTHUNIT["metre",1]],
        AXIS["(N)",north,
            ORDER[2],
            LENGTHUNIT["metre",1]],
    USAGE[
        SCOPE["Not known."],
        AREA["World."],
        BBOX[-90,-180,90,180]],
    ID["ESRI",53003]]`,
    ll: [-1.3973289073953, 12.649176474268513],
    xy: [-155375.88535614178, 1404635.2633403721],
    acc: {
      ll: 3
    }
  }, {
    code: 'PROJCS["NZGD49 / New Zealand Map Grid",GEOGCS["NZGD49",DATUM["D_New_Zealand_1949",SPHEROID["International_1924",6378388,297]],PRIMEM["Greenwich",0],UNIT["Degree",0.017453292519943295]],PROJECTION["New_Zealand_Map_Grid"],PARAMETER["latitude_of_origin",-41],PARAMETER["central_meridian",173],PARAMETER["false_easting",2510000],PARAMETER["false_northing",6023150],UNIT["Meter",1]]',
    ll: [172.465, -40.7],
    xy: [2464770.343667, 6056137.861919]
  }, {
    code: 'PROJCS["NZGD49 / New Zealand Map Grid",GEOGCS["NZGD49",DATUM["New_Zealand_Geodetic_Datum_1949",SPHEROID["International 1924",6378388,297,AUTHORITY["EPSG","7022"]],TOWGS84[59.47,-5.04,187.44,0.47,-0.1,1.024,-4.5993],AUTHORITY["EPSG","6272"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.01745329251994328,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4272"]],UNIT["metre",1,AUTHORITY["EPSG","9001"]],PROJECTION["New_Zealand_Map_Grid"],PARAMETER["latitude_of_origin",-41],PARAMETER["central_meridian",173],PARAMETER["false_easting",2510000],PARAMETER["false_northing",6023150],AUTHORITY["EPSG","27200"],AXIS["Easting",EAST],AXIS["Northing",NORTH]]',
    ll: [172.465, -40.7],
    xy: [2464770.343667, 6056137.861919]
  }, {
    code: `PROJCRS["NZGD49 / New Zealand Map Grid",
    BASEGEOGCRS["NZGD49",
        DATUM["New Zealand Geodetic Datum 1949",
            ELLIPSOID["International 1924",6378388,297,
                LENGTHUNIT["metre",1]]],
        PRIMEM["Greenwich",0,
            ANGLEUNIT["degree",0.0174532925199433]],
        ID["EPSG",4272]],
    CONVERSION["New Zealand Map Grid",
        METHOD["New Zealand Map Grid",
            ID["EPSG",9811]],
        PARAMETER["Latitude of natural origin",-41,
            ANGLEUNIT["degree",0.0174532925199433],
            ID["EPSG",8801]],
        PARAMETER["Longitude of natural origin",173,
            ANGLEUNIT["degree",0.0174532925199433],
            ID["EPSG",8802]],
        PARAMETER["False easting",2510000,
            LENGTHUNIT["metre",1],
            ID["EPSG",8806]],
        PARAMETER["False northing",6023150,
            LENGTHUNIT["metre",1],
            ID["EPSG",8807]]],
    CS[Cartesian,2],
        AXIS["(E)",east,
            ORDER[1],
            LENGTHUNIT["metre",1]],
        AXIS["(N)",north,
            ORDER[2],
            LENGTHUNIT["metre",1]],
    USAGE[
        SCOPE["Engineering survey, topographic mapping."],
        AREA["New Zealand - North Island, South Island, Stewart Island - onshore."],
        BBOX[-47.33,166.37,-34.1,178.63]],
    ID["EPSG",27200]]`,
    ll: [172.465, -40.7],
    xy: [2464770.343667, 6056137.861919]
  }, {
    code: 'PROJCS["Rassadiran / Nakhl e Taqi", GEOGCS["Rassadiran", DATUM["Rassadiran", SPHEROID["International 1924",6378388,297, AUTHORITY["EPSG","7022"]], TOWGS84[-133.63,-157.5,-158.62,0,0,0,0], AUTHORITY["EPSG","6153"]], PRIMEM["Greenwich",0, AUTHORITY["EPSG","8901"]], UNIT["degree",0.0174532925199433, AUTHORITY["EPSG","9122"]], AUTHORITY["EPSG","4153"]], PROJECTION["Hotine_Oblique_Mercator_Azimuth_Center"], PARAMETER["latitude_of_center",27.51882880555555], PARAMETER["longitude_of_center",52.60353916666667], PARAMETER["azimuth",0.5716611944444444], PARAMETER["rectified_grid_angle",0.5716611944444444], PARAMETER["scale_factor",0.999895934], PARAMETER["false_easting",658377.437], PARAMETER["false_northing",3044969.194], UNIT["metre",1, AUTHORITY["EPSG","9001"]], AXIS["Easting",EAST], AXIS["Northing",NORTH], AUTHORITY["EPSG","2057"]]',
    ll: [52.605, 27.5],
    xy: [658511.261946, 3043003.05468],
    acc: {
      ll: 8,
      xy: 6
    }
  }, {
    code: `PROJCRS["Rassadiran / Nakhl e Taqi",
    BASEGEOGCRS["Rassadiran",
        DATUM["Rassadiran",
            ELLIPSOID["International 1924",6378388,297,
                LENGTHUNIT["metre",1]]],
        PRIMEM["Greenwich",0,
            ANGLEUNIT["degree",0.0174532925199433]],
        ID["EPSG",4153]],
    CONVERSION["Nakhl e Taqi Oblique Mercator",
        METHOD["Hotine Oblique Mercator (variant B)",
            ID["EPSG",9815]],
        PARAMETER["Latitude of projection centre",27.5188288055556,
            ANGLEUNIT["degree",0.0174532925199433],
            ID["EPSG",8811]],
        PARAMETER["Longitude of projection centre",52.6035391666667,
            ANGLEUNIT["degree",0.0174532925199433],
            ID["EPSG",8812]],
        PARAMETER["Azimuth at projection centre",0.571661194444444,
            ANGLEUNIT["degree",0.0174532925199433],
            ID["EPSG",8813]],
        PARAMETER["Angle from Rectified to Skew Grid",0.571661194444444,
            ANGLEUNIT["degree",0.0174532925199433],
            ID["EPSG",8814]],
        PARAMETER["Scale factor at projection centre",0.999895934,
            SCALEUNIT["unity",1],
            ID["EPSG",8815]],
        PARAMETER["Easting at projection centre",658377.437,
            LENGTHUNIT["metre",1],
            ID["EPSG",8816]],
        PARAMETER["Northing at projection centre",3044969.194,
            LENGTHUNIT["metre",1],
            ID["EPSG",8817]]],
    CS[Cartesian,2],
        AXIS["(E)",east,
            ORDER[1],
            LENGTHUNIT["metre",1]],
        AXIS["(N)",north,
            ORDER[2],
            LENGTHUNIT["metre",1]],
    USAGE[
        SCOPE["Engineering survey."],
        AREA["Iran - Taheri refinery site."],
        BBOX[27.39,52.5,27.61,52.71]],
    ID["EPSG",2057]]`,
    ll: [52.605, 27.5],
    xy: [658511.261946, 3043003.05468],
    acc: {
      ll: 8,
      xy: 6
    }
  }, {
    code: 'PROJCS["SAD69 / Brazil Polyconic",GEOGCS["SAD69",DATUM["D_South_American_1969",SPHEROID["GRS_1967_SAD69",6378160,298.25]],PRIMEM["Greenwich",0],UNIT["Degree",0.017453292519943295]],PROJECTION["Polyconic"],PARAMETER["latitude_of_origin",0],PARAMETER["central_meridian",-54],PARAMETER["false_easting",5000000],PARAMETER["false_northing",10000000],UNIT["Meter",1]]',
    ll: [-49.221772553812, -0.34551739237581],
    xy: [5531902.134932, 9961660.779347],
    acc: {
      ll: 3,
      xy: -2
    }
  }, {
    code: 'PROJCS["SAD69 / Brazil Polyconic",GEOGCS["SAD69",DATUM["South_American_Datum_1969",SPHEROID["GRS 1967 (SAD69)",6378160,298.25,AUTHORITY["EPSG","7050"]],AUTHORITY["EPSG","6618"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.01745329251994328,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4618"]],UNIT["metre",1,AUTHORITY["EPSG","9001"]],PROJECTION["Polyconic"],PARAMETER["latitude_of_origin",0],PARAMETER["central_meridian",-54],PARAMETER["false_easting",5000000],PARAMETER["false_northing",10000000],AUTHORITY["EPSG","29101"],AXIS["X",EAST],AXIS["Y",NORTH]]',
    ll: [-49.221772553812, -0.34551739237581],
    xy: [5531902.134932, 9961660.779347],
    acc: {
      ll: 3,
      xy: -2
    }
  }, {
    code: `PROJCRS["SAD69 / Brazil Polyconic",
    BASEGEOGCRS["SAD69",
        DATUM["South American Datum 1969",
            ELLIPSOID["GRS 1967 Modified",6378160,298.25,
                LENGTHUNIT["metre",1]]],
        PRIMEM["Greenwich",0,
            ANGLEUNIT["degree",0.0174532925199433]],
        ID["EPSG",4618]],
    CONVERSION["Brazil Polyconic",
        METHOD["American Polyconic",
            ID["EPSG",9818]],
        PARAMETER["Latitude of natural origin",0,
            ANGLEUNIT["degree",0.0174532925199433],
            ID["EPSG",8801]],
        PARAMETER["Longitude of natural origin",-54,
            ANGLEUNIT["degree",0.0174532925199433],
            ID["EPSG",8802]],
        PARAMETER["False easting",5000000,
            LENGTHUNIT["metre",1],
            ID["EPSG",8806]],
        PARAMETER["False northing",10000000,
            LENGTHUNIT["metre",1],
            ID["EPSG",8807]]],
    CS[Cartesian,2],
        AXIS["easting (X)",east,
            ORDER[1],
            LENGTHUNIT["metre",1]],
        AXIS["northing (Y)",north,
            ORDER[2],
            LENGTHUNIT["metre",1]],
    USAGE[
        SCOPE["Topographic mapping (small scale)."],
        AREA["Brazil - onshore and offshore. Includes Rocas, Fernando de Noronha archipelago, Trindade, Ihlas Martim Vaz and Sao Pedro e Sao Paulo."],
        BBOX[-35.71,-74.01,7.04,-25.28]],
    ID["EPSG",29101]]`,
    ll: [-49.221772553812, -0.34551739237581],
    xy: [5531902.134932, 9961660.779347],
    acc: {
      ll: 3,
      xy: -2
    }
  }, {
    code: 'PROJCS["WGS 84 / UPS North",GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563,AUTHORITY["EPSG","7030"]],AUTHORITY["EPSG","6326"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.01745329251994328,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4326"]],UNIT["metre",1,AUTHORITY["EPSG","9001"]],PROJECTION["Polar_Stereographic"],PARAMETER["latitude_of_origin",90],PARAMETER["central_meridian",0],PARAMETER["scale_factor",0.994],PARAMETER["false_easting",2000000],PARAMETER["false_northing",2000000],AUTHORITY["EPSG","32661"],AXIS["Easting",UNKNOWN],AXIS["Northing",UNKNOWN]]',
    ll: [0, 75],
    xy: [2000000, 325449.806286]
  }, {
    code: 'PROJCS["WGS 84 / UPS North",GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137,298.257223563]],PRIMEM["Greenwich",0],UNIT["Degree",0.017453292519943295]],PROJECTION["Stereographic_North_Pole"],PARAMETER["standard_parallel_1",90],PARAMETER["central_meridian",0],PARAMETER["scale_factor",0.994],PARAMETER["false_easting",2000000],PARAMETER["false_northing",2000000],UNIT["Meter",1]]',
    ll: [0, 75],
    xy: [2000000, 325449.806286]
  }, {
    code: `PROJCRS["WGS 84 / UPS North (N,E)",
    BASEGEOGCRS["WGS 84",
        ENSEMBLE["World Geodetic System 1984 ensemble",
            MEMBER["World Geodetic System 1984 (Transit)"],
            MEMBER["World Geodetic System 1984 (G730)"],
            MEMBER["World Geodetic System 1984 (G873)"],
            MEMBER["World Geodetic System 1984 (G1150)"],
            MEMBER["World Geodetic System 1984 (G1674)"],
            MEMBER["World Geodetic System 1984 (G1762)"],
            MEMBER["World Geodetic System 1984 (G2139)"],
            MEMBER["World Geodetic System 1984 (G2296)"],
            ELLIPSOID["WGS 84",6378137,298.257223563,
                LENGTHUNIT["metre",1]],
            ENSEMBLEACCURACY[2.0]],
        PRIMEM["Greenwich",0,
            ANGLEUNIT["degree",0.0174532925199433]],
        ID["EPSG",4326]],
    CONVERSION["Universal Polar Stereographic North",
        METHOD["Polar Stereographic (variant A)",
            ID["EPSG",9810]],
        PARAMETER["Latitude of natural origin",90,
            ANGLEUNIT["degree",0.0174532925199433],
            ID["EPSG",8801]],
        PARAMETER["Longitude of natural origin",0,
            ANGLEUNIT["degree",0.0174532925199433],
            ID["EPSG",8802]],
        PARAMETER["Scale factor at natural origin",0.994,
            SCALEUNIT["unity",1],
            ID["EPSG",8805]],
        PARAMETER["False easting",2000000,
            LENGTHUNIT["metre",1],
            ID["EPSG",8806]],
        PARAMETER["False northing",2000000,
            LENGTHUNIT["metre",1],
            ID["EPSG",8807]]],
    CS[Cartesian,2],
        AXIS["northing (N)",south,
            MERIDIAN[180,
                ANGLEUNIT["degree",0.0174532925199433]],
            ORDER[1],
            LENGTHUNIT["metre",1]],
        AXIS["easting (E)",south,
            MERIDIAN[90,
                ANGLEUNIT["degree",0.0174532925199433]],
            ORDER[2],
            LENGTHUNIT["metre",1]],
    USAGE[
        SCOPE["Military survey."],
        AREA["Northern hemisphere - north of 60°N onshore and offshore, including Arctic."],
        BBOX[60,-180,90,180]],
    ID["EPSG",32661]]`,
    ll: [0, 75],
    xy: [2000000, 325449.806286]
  }, {
    code: '+proj=aeqd +lat_0=0 +lon_0=0 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs',
    ll: [0, 0],
    xy: [0, 0]
  }, {
    code: '+proj=aeqd +lat_0=0 +lon_0=0 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs',
    ll: [2, 0],
    xy: [222638.98158654713, 0]
  }, {
    code: '+proj=aeqd +lat_0=0 +lon_0=0 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs',
    ll: [89, 0],
    xy: [9907434.680601347, 0]
  }, {
    code: '+proj=aeqd +lat_0=0 +lon_0=0 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs',
    ll: [0, -52],
    xy: [0, -5763343.550010418]
  }, {
    code: '+proj=aeqd +lat_0=0 +lon_0=0 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs',
    ll: [145, 0],
    xy: [16141326.16502467, 0]
  }, {
    code: '+proj=aeqd +lat_0=0 +lon_0=0 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs',
    ll: [-145, 0],
    xy: [-16141326.16502467, 0]
  }, {
    code: '+proj=aeqd +lat_0=0 +lon_0=0 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs',
    ll: [91, 0],
    xy: [10130073.6622, 0]
  }, {
    code: '+proj=aeqd +lat_0=83.6625 +lon_0=-29.8333 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs',
    ll: [150.1667, 87.38418697931058],
    xy: [0, 1000000]
  }, {
    code: '+proj=aeqd +lat_0=0 +lon_0=0 +x_0=0 +y_0=0 +a=6371000 +b=6371000 +units=m +no_defs',
    ll: [91, 0],
    xy: [10118738.32, 0.00]
  }, {
    code: '+proj=laea +lat_0=2 +lon_0=1 +x_0=0 +y_0=0 +a=6371000 +b=6371000  +units=m +no_defs',
    ll: [1, 2],
    xy: [0, 0]
  }, {
    code: '+proj=laea +lat_0=1 +lon_0=1 +x_0=0 +y_0=0 +a=6371000 +b=6371000  +units=m +no_defs',
    ll: [1, 1],
    xy: [0, 0]
  }, {
    code: '+proj=laea +lat_0=1 +lon_0=1 +x_0=0 +y_0=0 +a=6371000 +b=6371000  +units=m +no_defs',
    ll: [2, 1],
    xy: [111176.58, 16.93]
  }, {
    code: '+proj=laea +lat_0=1 +lon_0=1 +x_0=0 +y_0=0 +a=6371000 +b=6371000  +units=m +no_defs',
    ll: [1, 2],
    xy: [0.00, 111193.52]
  }, {
    code: '+proj=laea +lat_0=0 +lon_0=0 +x_0=0 +y_0=0 +a=6371000 +b=6371000 +units=m +no_defs',
    ll: [19, 0],
    xy: [2103036.59, 0.00]
  }, {
    code: '+proj=stere +lat_0=-90 +lat_ts=-70 +lon_0=0 +k=1 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs"',
    ll: [0, -72.5],
    xy: [0, 1910008.78441421]
  }, {
    code: '+proj=stere +lat_0=-90 +lon_0=0 +x_0=0 +y_0=0 +a=3396000 +b=3396000 +units=m +no_defs',
    ll: [0, -72.5],
    xy: [0, 1045388.79]
  }, {
    code: '+proj=stere',
    ll: [0, -72.5],
    xy: [0, -9334375.897187851]
  }, {
    // Test that lat_ts at a pole is handled correctly in stere projection
    code: '+no_defs +units=m +ellps=GRS80 +lon_0=0 +proj=stere +lat_ts=90.0 +lat_0=90 +x_0=0 +y_0=0',
    ll: [69.648700, 18.955781],
    xy: [8527917.706, -3163255.729]
  }, {
    code: 'PROJCS["WGS 84 / NSIDC Sea Ice Polar Stereographic South", GEOGCS["WGS 84", DATUM["World Geodetic System 1984", SPHEROID["WGS 84", 6378137.0, 298.257223563, AUTHORITY["EPSG","7030"]], AUTHORITY["EPSG","6326"]], PRIMEM["Greenwich", 0.0, AUTHORITY["EPSG","8901"]], UNIT["degree", 0.017453292519943295], AXIS["Geodetic longitude", EAST], AXIS["Geodetic latitude", NORTH], AUTHORITY["EPSG","4326"]], PROJECTION["Polar Stereographic (variant B)", AUTHORITY["EPSG","9829"]], PARAMETER["central_meridian", 0.0], PARAMETER["Standard_Parallel_1", -70.0], PARAMETER["false_easting", 0.0], PARAMETER["false_northing", 0.0], UNIT["m", 1.0], AXIS["Easting", "North along 90 deg East"], AXIS["Northing", "North along 0 deg"], AUTHORITY["EPSG","3976"]]',
    ll: [0, -72.5],
    xy: [0, 1910008.78441421]
  }, {
    code: `PROJCRS["WGS 84 / NSIDC Sea Ice Polar Stereographic South",
    BASEGEOGCRS["WGS 84",
        ENSEMBLE["World Geodetic System 1984 ensemble",
            MEMBER["World Geodetic System 1984 (Transit)"],
            MEMBER["World Geodetic System 1984 (G730)"],
            MEMBER["World Geodetic System 1984 (G873)"],
            MEMBER["World Geodetic System 1984 (G1150)"],
            MEMBER["World Geodetic System 1984 (G1674)"],
            MEMBER["World Geodetic System 1984 (G1762)"],
            MEMBER["World Geodetic System 1984 (G2139)"],
            MEMBER["World Geodetic System 1984 (G2296)"],
            ELLIPSOID["WGS 84",6378137,298.257223563,
                LENGTHUNIT["metre",1]],
            ENSEMBLEACCURACY[2.0]],
        PRIMEM["Greenwich",0,
            ANGLEUNIT["degree",0.0174532925199433]],
        ID["EPSG",4326]],
    CONVERSION["US NSIDC Sea Ice polar stereographic south",
        METHOD["Polar Stereographic (variant B)",
            ID["EPSG",9829]],
        PARAMETER["Latitude of standard parallel",-70,
            ANGLEUNIT["degree",0.0174532925199433],
            ID["EPSG",8832]],
        PARAMETER["Longitude of origin",0,
            ANGLEUNIT["degree",0.0174532925199433],
            ID["EPSG",8833]],
        PARAMETER["False easting",0,
            LENGTHUNIT["metre",1],
            ID["EPSG",8806]],
        PARAMETER["False northing",0,
            LENGTHUNIT["metre",1],
            ID["EPSG",8807]]],
    CS[Cartesian,2],
        AXIS["easting (X)",north,
            MERIDIAN[90,
                ANGLEUNIT["degree",0.0174532925199433]],
            ORDER[1],
            LENGTHUNIT["metre",1]],
        AXIS["northing (Y)",north,
            MERIDIAN[0,
                ANGLEUNIT["degree",0.0174532925199433]],
            ORDER[2],
            LENGTHUNIT["metre",1]],
    USAGE[
        SCOPE["Polar research."],
        AREA["Southern hemisphere - south of 60°S onshore and offshore - Antarctica."],
        BBOX[-90,-180,-60,180]],
    ID["EPSG",3976]]`,
    ll: [0, -72.5],
    xy: [0, 1910008.78441421]
  }, {
    code: 'PROJCS["NAD83(CSRS98) / New Brunswick Stereo (deprecated)",GEOGCS["NAD83(CSRS98)",DATUM["D_North_American_1983_CSRS98",SPHEROID["GRS_1980",6378137,298.257222101]],PRIMEM["Greenwich",0],UNIT["Degree",0.017453292519943295]],PROJECTION["Stereographic_North_Pole"],PARAMETER["standard_parallel_1",46.5],PARAMETER["central_meridian",-66.5],PARAMETER["scale_factor",0.999912],PARAMETER["false_easting",2500000],PARAMETER["false_northing",7500000],UNIT["Meter",1]]',
    ll: [-66.415, 46.34],
    xy: [2506543.370459, 7482219.546176]
  }, {
    code: 'PROJCS["NAD83(CSRS98) / New Brunswick Stereo (deprecated)",GEOGCS["NAD83(CSRS98)",DATUM["NAD83_Canadian_Spatial_Reference_System",SPHEROID["GRS 1980",6378137,298.257222101,AUTHORITY["EPSG","7019"]],TOWGS84[0,0,0,0,0,0,0],AUTHORITY["EPSG","6140"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.0174532925199433,AUTHORITY["EPSG","9108"]],AUTHORITY["EPSG","4140"]],UNIT["metre",1,AUTHORITY["EPSG","9001"]],PROJECTION["Oblique_Stereographic"],PARAMETER["latitude_of_origin",46.5],PARAMETER["central_meridian",-66.5],PARAMETER["scale_factor",0.999912],PARAMETER["false_easting",2500000],PARAMETER["false_northing",7500000],AUTHORITY["EPSG","2036"],AXIS["Easting",EAST],AXIS["Northing",NORTH]]',
    ll: [-66.415, 46.34],
    xy: [2506543.370459, 7482219.546176]
  }, {
    code: `PROJCRS["NAD83(CSRS98) / New Brunswick Stereo",
    BASEGEOGCRS["NAD83(CSRS98)",
        DATUM["NAD83 Canadian Spatial Reference System",
            ELLIPSOID["GRS 1980",6378137,298.257222101,
                LENGTHUNIT["metre",1]]],
        PRIMEM["Greenwich",0,
            ANGLEUNIT["degree",0.0174532925199433]],
        ID["EPSG",4140]],
    CONVERSION["New Brunswick Stereographic (NAD83)",
        METHOD["Oblique Stereographic",
            ID["EPSG",9809]],
        PARAMETER["Latitude of natural origin",46.5,
            ANGLEUNIT["degree",0.0174532925199433],
            ID["EPSG",8801]],
        PARAMETER["Longitude of natural origin",-66.5,
            ANGLEUNIT["degree",0.0174532925199433],
            ID["EPSG",8802]],
        PARAMETER["Scale factor at natural origin",0.999912,
            SCALEUNIT["unity",1],
            ID["EPSG",8805]],
        PARAMETER["False easting",2500000,
            LENGTHUNIT["metre",1],
            ID["EPSG",8806]],
        PARAMETER["False northing",7500000,
            LENGTHUNIT["metre",1],
            ID["EPSG",8807]]],
    CS[Cartesian,2],
        AXIS["northing (N)",north,
            ORDER[1],
            LENGTHUNIT["metre",1]],
        AXIS["easting (E)",east,
            ORDER[2],
            LENGTHUNIT["metre",1]],
    USAGE[
        SCOPE["Engineering survey, topographic mapping."],
        AREA["Canada - New Brunswick."],
        BBOX[44.56,-69.05,48.07,-63.7]],
    ID["EPSG",2036]]`,
    ll: [-66.415, 46.34],
    xy: [2506543.370459, 7482219.546176]
  }, {
    code: 'PROJCS["Sphere_Van_der_Grinten_I",GEOGCS["GCS_Sphere",DATUM["D_Sphere",SPHEROID["Sphere",6371000,0]],PRIMEM["Greenwich",0],UNIT["Degree",0.017453292519943295]],PROJECTION["Van_der_Grinten_I"],PARAMETER["False_Easting",0],PARAMETER["False_Northing",0],PARAMETER["Central_Meridian",0],UNIT["Meter",1]]',
    ll: [-1.41160801956, 67.40891366748],
    xy: [-125108.675828, 9016899.042114],
    acc: {
      ll: 0,
      xy: -5
    }
  }, {
    code: 'PROJCS["Sphere_Van_der_Grinten_I",GEOGCS["GCS_Sphere",DATUM["Not_specified_based_on_Authalic_Sphere",SPHEROID["Sphere",6371000,0]],PRIMEM["Greenwich",0],UNIT["Degree",0.017453292519943295]],PROJECTION["VanDerGrinten"],PARAMETER["False_Easting",0],PARAMETER["False_Northing",0],PARAMETER["Central_Meridian",0],UNIT["Meter",1],AUTHORITY["EPSG","53029"]]',
    ll: [-1.41160801956, 67.40891366748],
    xy: [-125108.675828, 9016899.042114],
    acc: {
      ll: 0,
      xy: -5
    }
  }, {
    code: `PROJCRS["Sphere_Van_der_Grinten_I",
    BASEGEOGCRS["Unknown datum based upon the Authalic Sphere",
        DATUM["Not specified (based on Authalic Sphere)",
            ELLIPSOID["Sphere",6371000,0,
                LENGTHUNIT["metre",1]]],
        PRIMEM["Greenwich",0,
            ANGLEUNIT["Degree",0.0174532925199433]]],
    CONVERSION["Sphere_Van_der_Grinten_I",
        METHOD["Van Der Grinten"],
        PARAMETER["Longitude of natural origin",0,
            ANGLEUNIT["Degree",0.0174532925199433],
            ID["EPSG",8802]],
        PARAMETER["False easting",0,
            LENGTHUNIT["metre",1],
            ID["EPSG",8806]],
        PARAMETER["False northing",0,
            LENGTHUNIT["metre",1],
            ID["EPSG",8807]]],
    CS[Cartesian,2],
        AXIS["(E)",east,
            ORDER[1],
            LENGTHUNIT["metre",1]],
        AXIS["(N)",north,
            ORDER[2],
            LENGTHUNIT["metre",1]],
    USAGE[
        SCOPE["Not known."],
        AREA["World."],
        BBOX[-90,-180,90,180]],
    ID["ESRI",53029]]`,
    ll: [-1.41160801956, 67.40891366748],
    xy: [-125108.675828, 9016899.042114],
    acc: {
      ll: 0,
      xy: -5
    }
  }, {
    code: 'PROJCS["NAD_1983_StatePlane_New_Jersey_FIPS_2900_Feet",GEOGCS["GCS_North_American_1983",DATUM["D_North_American_1983",SPHEROID["GRS_1980",6378137.0,298.257222101]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],PROJECTION["Transverse_Mercator"],PARAMETER["False_Easting",492125.0],PARAMETER["False_Northing",0.0],PARAMETER["Central_Meridian",-74.5],PARAMETER["Scale_Factor",0.9999],PARAMETER["Latitude_Of_Origin",38.83333333333334],UNIT["Foot_US",0.3048006096012192]]',
    ll: [-74, 41],
    xy: [630128.205, 789591.522]
  },
  {
    code: `PROJCRS["NAD_1983_StatePlane_New_Jersey_FIPS_2900_Feet",
    BASEGEOGCRS["NAD83",
        DATUM["North American Datum 1983",
            ELLIPSOID["GRS 1980",6378137,298.257222101,
                LENGTHUNIT["metre",1]]],
        PRIMEM["Greenwich",0,
            ANGLEUNIT["degree",0.0174532925199433]],
        ID["EPSG",4269]],
    CONVERSION["NAD_1983_StatePlane_New_Jersey_FIPS_2900_Feet",
        METHOD["Transverse Mercator",
            ID["EPSG",9807]],
        PARAMETER["Latitude of natural origin",38.8333333333333,
            ANGLEUNIT["degree",0.0174532925199433],
            ID["EPSG",8801]],
        PARAMETER["Longitude of natural origin",-74.5,
            ANGLEUNIT["degree",0.0174532925199433],
            ID["EPSG",8802]],
        PARAMETER["Scale factor at natural origin",0.9999,
            SCALEUNIT["unity",1],
            ID["EPSG",8805]],
        PARAMETER["False easting",492125,
            LENGTHUNIT["US survey foot",0.304800609601219],
            ID["EPSG",8806]],
        PARAMETER["False northing",0,
            LENGTHUNIT["US survey foot",0.304800609601219],
            ID["EPSG",8807]]],
    CS[Cartesian,2],
        AXIS["easting (X)",east,
            ORDER[1],
            LENGTHUNIT["US survey foot",0.304800609601219]],
        AXIS["northing (Y)",north,
            ORDER[2],
            LENGTHUNIT["US survey foot",0.304800609601219]],
    USAGE[
        SCOPE["Not known."],
        AREA["United States (USA) - New Jersey - counties of Atlantic; Bergen; Burlington; Camden; Cape May; Cumberland; Essex; Gloucester; Hudson; Hunterdon; Mercer; Middlesex; Monmouth; Morris; Ocean; Passaic; Salem; Somerset; Sussex; Union; Warren."],
        BBOX[38.87,-75.6,41.36,-73.88]],
    ID["ESRI",102711]]`,
    ll: [-74, 41],
    xy: [630128.205, 789591.522]
  },
  {
    code: 'esriOnline',
    ll: [-74, 41],
    xy: [-8237642.318702244, 5012341.663847514]
  },
  {
    code: '+proj=sinu +lon_0=0 +x_0=0 +y_0=0 +a=6371000 +b=6371000 +units=m +no_defs',
    xy: [736106.55, 5893331.11],
    ll: [11.0, 53.0]
  },
  {
    code: 'PROJCS["Belge 1972 / Belgian Lambert 72",GEOGCS["Belge 1972",DATUM["Reseau_National_Belge_1972",SPHEROID["International 1924",6378388,297,AUTHORITY["EPSG","7022"]],TOWGS84[106.869,-52.2978,103.724,-0.33657,0.456955,-1.84218,1],AUTHORITY["EPSG","6313"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.01745329251994328,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4313"]],UNIT["metre",1,AUTHORITY["EPSG","9001"]],PROJECTION["Lambert_Conformal_Conic_2SP"],PARAMETER["standard_parallel_1",51.16666723333333],PARAMETER["standard_parallel_2",49.8333339],PARAMETER["latitude_of_origin",90],PARAMETER["central_meridian",4.367486666666666],PARAMETER["false_easting",150000.013],PARAMETER["false_northing",5400088.438],AUTHORITY["EPSG","31370"],AXIS["X",EAST],AXIS["Y",NORTH]]',
    xy: [104588.196404, 193175.582367],
    ll: [3.7186701465384533, 51.04642936832842]
  },
  {
    code: 'PROJCS["Belge 1972 / Belgian Lambert 72",GEOGCS["Belge 1972",DATUM["D_Belge_1972",SPHEROID["International_1924",6378388,297]],PRIMEM["Greenwich",0],UNIT["Degree",0.017453292519943295]],PROJECTION["Lambert_Conformal_Conic"],PARAMETER["standard_parallel_1",51.16666723333333],PARAMETER["standard_parallel_2",49.8333339],PARAMETER["latitude_of_origin",90],PARAMETER["central_meridian",4.367486666666666],PARAMETER["false_easting",150000.013],PARAMETER["false_northing",5400088.438],UNIT["Meter",1]]',
    xy: [104588.196404, 193175.582367],
    ll: [3.7186701465384533, 51.04642936832842]
  },
  {
    code: 'PROJCS["Belge 1972 / Belgian Lambert 72",GEOGCS["Belge 1972",DATUM["Reseau_National_Belge_1972",SPHEROID["International 1924",6378388,297,AUTHORITY["EPSG","7022"]],TOWGS84[-106.8686,52.2978,-103.7239,-0.3366,0.457,-1.8422,-1.2747],AUTHORITY["EPSG","6313"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.0174532925199433,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4313"]],PROJECTION["Lambert_Conformal_Conic_2SP"],PARAMETER["standard_parallel_1",51.16666723333333],PARAMETER["standard_parallel_2",49.8333339],PARAMETER["latitude_of_origin",90],PARAMETER["central_meridian",4.367486666666666],PARAMETER["false_easting",150000.013],PARAMETER["false_northing",5400088.438],UNIT["metre",1,AUTHORITY["EPSG","9001"]],AXIS["X",EAST],AXIS["Y",NORTH],AUTHORITY["EPSG","31370"]]',
    xy: [104469.69796438649, 193146.39675426576],
    ll: [3.7186701465384533, 51.04642936832842]
  },
  {
    code: 'PROJCS["Belge 1972 / Belgian Lambert 72",GEOGCS["Belge 1972",DATUM["Reseau_National_Belge_1972",SPHEROID["International 1924",6378388,297,AUTHORITY["EPSG","7022"]],TOWGS84[-99.059,53.322,-112.486,-0.419,0.83,-1.885,-1],AUTHORITY["EPSG","6313"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.0174532925199433,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4313"]],PROJECTION["Lambert_Conformal_Conic_2SP"],PARAMETER["standard_parallel_1",51.16666723333333],PARAMETER["standard_parallel_2",49.8333339],PARAMETER["latitude_of_origin",90],PARAMETER["central_meridian",4.367486666666666],PARAMETER["false_easting",150000.013],PARAMETER["false_northing",5400088.438],UNIT["metre",1,AUTHORITY["EPSG","9001"]],AXIS["X",EAST],AXIS["Y",NORTH],AUTHORITY["EPSG","31370"]]',
    xy: [104468.8305227503, 193169.6828284394],
    ll: [3.7186701465384533, 51.04642936832842]
  },
  {
    code: 'PROJCS["Belge 1972 / Belgian Lambert 72",GEOGCS["Belge 1972",DATUM["Reseau_National_Belge_1972",SPHEROID["International 1924",6378388,297,AUTHORITY["EPSG","7022"]],TOWGS84[-125.8,79.9,-100.5,0,0,0,0],AUTHORITY["EPSG","6313"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.0174532925199433,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4313"]],PROJECTION["Lambert_Conformal_Conic_2SP"],PARAMETER["standard_parallel_1",51.16666723333333],PARAMETER["standard_parallel_2",49.8333339],PARAMETER["latitude_of_origin",90],PARAMETER["central_meridian",4.367486666666666],PARAMETER["false_easting",150000.013],PARAMETER["false_northing",5400088.438],UNIT["metre",1,AUTHORITY["EPSG","9001"]],AXIS["X",EAST],AXIS["Y",NORTH],AUTHORITY["EPSG","31370"]]',
    xy: [104412.1099068548, 193116.8535417635],
    ll: [3.7186701465384533, 51.04642936832842]
  },
  {
    code: '+proj=lcc +lat_1=51.16666723333333 +lat_2=49.8333339 +lat_0=90 +lon_0=4.367486666666666 +x_0=150000.013 +y_0=5400088.438 +ellps=intl +towgs84=106.869,-52.2978,103.724,-0.33657,0.456955,-1.84218,1 +units=m +no_defs ',
    xy: [104588.196404, 193175.582367],
    ll: [3.7186701465384533, 51.04642936832842]
  },
  {
    code: `PROJCRS["BD72 / Belgian Lambert 72",
    BASEGEOGCRS["BD72",
        DATUM["Reseau National Belge 1972",
            ELLIPSOID["International 1924",6378388,297,
                LENGTHUNIT["metre",1]]],
        PRIMEM["Greenwich",0,
            ANGLEUNIT["degree",0.0174532925199433]],
        ID["EPSG",4313]],
    CONVERSION["Belgian Lambert 72",
        METHOD["Lambert Conic Conformal (2SP)",
            ID["EPSG",9802]],
        PARAMETER["Latitude of false origin",90,
            ANGLEUNIT["degree",0.0174532925199433],
            ID["EPSG",8821]],
        PARAMETER["Longitude of false origin",4.36748666666667,
            ANGLEUNIT["degree",0.0174532925199433],
            ID["EPSG",8822]],
        PARAMETER["Latitude of 1st standard parallel",51.1666672333333,
            ANGLEUNIT["degree",0.0174532925199433],
            ID["EPSG",8823]],
        PARAMETER["Latitude of 2nd standard parallel",49.8333339,
            ANGLEUNIT["degree",0.0174532925199433],
            ID["EPSG",8824]],
        PARAMETER["Easting at false origin",150000.013,
            LENGTHUNIT["metre",1],
            ID["EPSG",8826]],
        PARAMETER["Northing at false origin",5400088.438,
            LENGTHUNIT["metre",1],
            ID["EPSG",8827]]],
    CS[Cartesian,2],
        AXIS["easting (X)",east,
            ORDER[1],
            LENGTHUNIT["metre",1]],
        AXIS["northing (Y)",north,
            ORDER[2],
            LENGTHUNIT["metre",1]],
    USAGE[
        SCOPE["Engineering survey, topographic mapping."],
        AREA["Belgium - onshore."],
        BBOX[49.5,2.5,51.51,6.4]],
    ID["EPSG",31370]]`,
    xy: [104412.32981733, 193117.404086632],
    ll: [3.7186701465384533, 51.04642936832842]
  },
  {
    code: { $schema: 'https://proj.org/schemas/v0.7/projjson.schema.json', type: 'ProjectedCRS', name: 'BD72 / Belgian Lambert 72', base_crs: { type: 'GeographicCRS', name: 'BD72', datum: { type: 'GeodeticReferenceFrame', name: 'Reseau National Belge 1972', ellipsoid: { name: 'International 1924', semi_major_axis: 6378388, inverse_flattening: 297 } }, coordinate_system: { subtype: 'ellipsoidal', axis: [{ name: 'Geodetic latitude', abbreviation: 'Lat', direction: 'north', unit: 'degree' }, { name: 'Geodetic longitude', abbreviation: 'Lon', direction: 'east', unit: 'degree' }] }, id: { authority: 'EPSG', code: 4313 } }, conversion: { name: 'Belgian Lambert 72', method: { name: 'Lambert Conic Conformal (2SP)', id: { authority: 'EPSG', code: 9802 } }, parameters: [{ name: 'Latitude of false origin', value: 90, unit: 'degree', id: { authority: 'EPSG', code: 8821 } }, { name: 'Longitude of false origin', value: 4.36748666666667, unit: 'degree', id: { authority: 'EPSG', code: 8822 } }, { name: 'Latitude of 1st standard parallel', value: 51.1666672333333, unit: 'degree', id: { authority: 'EPSG', code: 8823 } }, { name: 'Latitude of 2nd standard parallel', value: 49.8333339, unit: 'degree', id: { authority: 'EPSG', code: 8824 } }, { name: 'Easting at false origin', value: 150000.013, unit: 'metre', id: { authority: 'EPSG', code: 8826 } }, { name: 'Northing at false origin', value: 5400088.438, unit: 'metre', id: { authority: 'EPSG', code: 8827 } }] }, coordinate_system: { subtype: 'Cartesian', axis: [{ name: 'Easting', abbreviation: 'X', direction: 'east', unit: 'metre' }, { name: 'Northing', abbreviation: 'Y', direction: 'north', unit: 'metre' }] }, scope: 'Engineering survey, topographic mapping.', area: 'Belgium - onshore.', bbox: { south_latitude: 49.5, west_longitude: 2.5, north_latitude: 51.51, east_longitude: 6.4 }, id: { authority: 'EPSG', code: 31370 } },
    xy: [104412.32981733, 193117.404086632],
    ll: [3.7186701465384533, 51.04642936832842]
  },
  {
    code: 'PROJCS["JAD2001 / Jamaica Metric Grid",GEOGCS["JAD2001",DATUM["Jamaica_2001",SPHEROID["WGS 84",6378137,298.257223563,AUTHORITY["EPSG","7030"]],TOWGS84[0,0,0,0,0,0,0],AUTHORITY["EPSG","6758"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.0174532925199433,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4758"]],PROJECTION["Lambert_Conformal_Conic_1SP"],PARAMETER["latitude_of_origin",18],PARAMETER["central_meridian",-77],PARAMETER["scale_factor",1],PARAMETER["false_easting",750000],PARAMETER["false_northing",650000],UNIT["metre",1,AUTHORITY["EPSG","9001"]],AXIS["Easting",EAST],AXIS["Northing",NORTH],AUTHORITY["EPSG","3448"]]',
    xy: [7578825.28673236, 11374595.814939449],
    ll: [44.2312, 76.4860]
  },
  {
    code: `PROJCRS["JAD2001 / Jamaica Metric Grid",
    BASEGEOGCRS["JAD2001",
        DATUM["Jamaica 2001",
            ELLIPSOID["WGS 84",6378137,298.257223563,
                LENGTHUNIT["metre",1]]],
        PRIMEM["Greenwich",0,
            ANGLEUNIT["degree",0.0174532925199433]],
        ID["EPSG",4758]],
    CONVERSION["Jamaica Metric Grid 2001",
        METHOD["Lambert Conic Conformal (1SP)",
            ID["EPSG",9801]],
        PARAMETER["Latitude of natural origin",18,
            ANGLEUNIT["degree",0.0174532925199433],
            ID["EPSG",8801]],
        PARAMETER["Longitude of natural origin",-77,
            ANGLEUNIT["degree",0.0174532925199433],
            ID["EPSG",8802]],
        PARAMETER["Scale factor at natural origin",1,
            SCALEUNIT["unity",1],
            ID["EPSG",8805]],
        PARAMETER["False easting",750000,
            LENGTHUNIT["metre",1],
            ID["EPSG",8806]],
        PARAMETER["False northing",650000,
            LENGTHUNIT["metre",1],
            ID["EPSG",8807]]],
    CS[Cartesian,2],
        AXIS["(E)",east,
            ORDER[1],
            LENGTHUNIT["metre",1]],
        AXIS["(N)",north,
            ORDER[2],
            LENGTHUNIT["metre",1]],
    USAGE[
        SCOPE["Cadastre, engineering survey, topographic mapping (large and medium scale)."],
        AREA["Jamaica - onshore."],
        BBOX[17.64,-78.43,18.58,-76.17]],
    ID["EPSG",3448]]`,
    xy: [7578825.28673236, 11374595.814939449],
    ll: [44.2312, 76.4860]
  },
  {
    code: '+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +datum=OSGB36 +units=m +no_defs',
    ll: [-3.20078, 55.96056],
    xy: [325132.0089586496, 674822.638235305]
  },
  {
    code: 'PROJCS["OSGB36 / British National Grid",GEOGCS["OSGB36",DATUM["Ordnance_Survey_of_Great_Britain_1936",SPHEROID["Airy 1830",6377563.396,299.3249646,AUTHORITY["EPSG","7001"]],AUTHORITY["EPSG","6277"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.0174532925199433,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4277"]],PROJECTION["Transverse_Mercator"],PARAMETER["latitude_of_origin",49],PARAMETER["central_meridian",-2],PARAMETER["scale_factor",0.9996012717],PARAMETER["false_easting",400000],PARAMETER["false_northing",-100000],UNIT["metre",1,AUTHORITY["EPSG","9001"]],AXIS["Easting",EAST],AXIS["Northing",NORTH],AUTHORITY["EPSG","27700"]]',
    ll: [-3.20078, 55.96056],
    xy: [325132.0089586496, 674822.638235305]
  },
  {
    code: `PROJCRS["OSGB36 / British National Grid",
    BASEGEOGCRS["OSGB36",
        DATUM["Ordnance Survey of Great Britain 1936",
            ELLIPSOID["Airy 1830",6377563.396,299.3249646,
                LENGTHUNIT["metre",1]]],
        PRIMEM["Greenwich",0,
            ANGLEUNIT["degree",0.0174532925199433]],
        ID["EPSG",4277]],
    CONVERSION["British National Grid",
        METHOD["Transverse Mercator",
            ID["EPSG",9807]],
        PARAMETER["Latitude of natural origin",49,
            ANGLEUNIT["degree",0.0174532925199433],
            ID["EPSG",8801]],
        PARAMETER["Longitude of natural origin",-2,
            ANGLEUNIT["degree",0.0174532925199433],
            ID["EPSG",8802]],
        PARAMETER["Scale factor at natural origin",0.9996012717,
            SCALEUNIT["unity",1],
            ID["EPSG",8805]],
        PARAMETER["False easting",400000,
            LENGTHUNIT["metre",1],
            ID["EPSG",8806]],
        PARAMETER["False northing",-100000,
            LENGTHUNIT["metre",1],
            ID["EPSG",8807]]],
    CS[Cartesian,2],
        AXIS["(E)",east,
            ORDER[1],
            LENGTHUNIT["metre",1]],
        AXIS["(N)",north,
            ORDER[2],
            LENGTHUNIT["metre",1]],
    USAGE[
        SCOPE["Engineering survey, topographic mapping."],
        AREA["United Kingdom (UK) - offshore to boundary of UKCS within 49°45'N to 61°N and 9°W to 2°E; onshore Great Britain (England, Wales and Scotland). Isle of Man onshore."],
        BBOX[49.75,-9.01,61.01,2.01]],
    ID["EPSG",27700]]`,
    ll: [-3.20078, 55.96056],
    xy: [325132.0089586496, 674822.638235305]
  },
  {
    code: '+proj=krovak +lat_0=49.5 +lon_0=24.83333333333333 +alpha=30.28813972222222 +k=0.9999 +x_0=0 +y_0=0 +ellps=bessel +pm=greenwich +units=m +no_defs +towgs84=570.8,85.7,462.8,4.998,1.587,5.261,3.56',
    ll: [12.806988, 49.452262],
    xy: [-868208.61, -1095793.64]
  },
  {
    code: '+proj=tmerc +lat_0=40.5 +lon_0=-110.0833333333333 +k=0.9999375 +x_0=800000.0000101599 +y_0=99999.99998983997 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=us-ft +no_defs',
    ll: [-110.8, 43.5],
    xy: [2434515.870, 1422072.711]
  },
  {
    code: `PROJCRS["MGI / Austria GK M34",
    BASEGEOGCRS["MGI",
        DATUM["Militar-Geographische Institut",
            ELLIPSOID["Bessel 1841",6377397.155,299.1528128,
                LENGTHUNIT["metre",1]]],
        PRIMEM["Greenwich",0,
            ANGLEUNIT["degree",0.0174532925199433]],
        ID["EPSG",4312]],
    CONVERSION["Austria Gauss-Kruger M34",
        METHOD["Transverse Mercator",
            ID["EPSG",9807]],
        PARAMETER["Latitude of natural origin",0,
            ANGLEUNIT["degree",0.0174532925199433],
            ID["EPSG",8801]],
        PARAMETER["Longitude of natural origin",16.3333333333333,
            ANGLEUNIT["degree",0.0174532925199433],
            ID["EPSG",8802]],
        PARAMETER["Scale factor at natural origin",1,
            SCALEUNIT["unity",1],
            ID["EPSG",8805]],
        PARAMETER["False easting",750000,
            LENGTHUNIT["metre",1],
            ID["EPSG",8806]],
        PARAMETER["False northing",-5000000,
            LENGTHUNIT["metre",1],
            ID["EPSG",8807]]],
    CS[Cartesian,2],
        AXIS["northing (X)",north,
            ORDER[1],
            LENGTHUNIT["metre",1]],
        AXIS["easting (Y)",east,
            ORDER[2],
            LENGTHUNIT["metre",1]],
    USAGE[
        SCOPE["Engineering survey, topographic mapping."],
        AREA["Austria east of 14°50'E of Greenwich (32°30'E of Ferro)."],
        BBOX[46.56,14.83,49.02,17.17]],
    ID["EPSG",31259]]`,
    ll: [15.43811, 47.07103],
    xy: [682088.031204426, 215045.227444926]
  },
  {
    code: `BOUNDCRS[
    SOURCECRS[
        PROJCRS["unknown",
            BASEGEOGCRS["unknown",
                DATUM["Unknown based on Bessel 1841 ellipsoid",
                    ELLIPSOID["Bessel 1841",6377397.155,299.1528128,
                        LENGTHUNIT["metre",1,
                            ID["EPSG",9001]]]],
                PRIMEM["Greenwich",0,
                    ANGLEUNIT["degree",0.0174532925199433],
                    ID["EPSG",8901]]],
            CONVERSION["unknown",
                METHOD["Transverse Mercator",
                    ID["EPSG",9807]],
                PARAMETER["Latitude of natural origin",0,
                    ANGLEUNIT["degree",0.0174532925199433],
                    ID["EPSG",8801]],
                PARAMETER["Longitude of natural origin",16.3333333333333,
                    ANGLEUNIT["degree",0.0174532925199433],
                    ID["EPSG",8802]],
                PARAMETER["Scale factor at natural origin",1,
                    SCALEUNIT["unity",1],
                    ID["EPSG",8805]],
                PARAMETER["False easting",750000,
                    LENGTHUNIT["metre",1],
                    ID["EPSG",8806]],
                PARAMETER["False northing",-5000000,
                    LENGTHUNIT["metre",1],
                    ID["EPSG",8807]]],
            CS[Cartesian,2],
                AXIS["(E)",east,
                    ORDER[1],
                    LENGTHUNIT["metre",1,
                        ID["EPSG",9001]]],
                AXIS["(N)",north,
                    ORDER[2],
                    LENGTHUNIT["metre",1,
                        ID["EPSG",9001]]]]],
    TARGETCRS[
        GEOGCRS["WGS 84",
            DATUM["World Geodetic System 1984",
                ELLIPSOID["WGS 84",6378137,298.257223563,
                    LENGTHUNIT["metre",1]]],
            PRIMEM["Greenwich",0,
                ANGLEUNIT["degree",0.0174532925199433]],
            CS[ellipsoidal,2],
                AXIS["latitude",north,
                    ORDER[1],
                    ANGLEUNIT["degree",0.0174532925199433]],
                AXIS["longitude",east,
                    ORDER[2],
                    ANGLEUNIT["degree",0.0174532925199433]],
            ID["EPSG",4326]]],
    ABRIDGEDTRANSFORMATION["Transformation from unknown to WGS84",
        METHOD["Position Vector transformation (geog2D domain)",
            ID["EPSG",9606]],
        PARAMETER["X-axis translation",601.705,
            ID["EPSG",8605]],
        PARAMETER["Y-axis translation",84.263,
            ID["EPSG",8606]],
        PARAMETER["Z-axis translation",485.227,
            ID["EPSG",8607]],
        PARAMETER["X-axis rotation",-4.7354,
            ID["EPSG",8608]],
        PARAMETER["Y-axis rotation",-1.3145,
            ID["EPSG",8609]],
        PARAMETER["Z-axis rotation",-5.393,
            ID["EPSG",8610]],
        PARAMETER["Scale difference",0.9999976113,
            ID["EPSG",8611]]]]`,
    ll: [15.43811, 47.07103],
    xy: [682094.142914852, 215044.760591501]
  },
  // QSC WGS84
  {
    code: '+proj=qsc +lat_0=0 +lon_0=0 +units=m +datum=WGS84',
    ll: [2, 1],
    xy: [304638.4508447283296846, 164123.8709293559950311]
  },
  {
    code: '+proj=qsc +lat_0=0 +lon_0=90 +units=m +datum=WGS84',
    ll: [2, 1],
    xy: [-11576764.4717786349356174, 224687.8649776891397778]
  },
  {
    code: '+proj=qsc +lat_0=0 +lon_0=180 +units=m +datum=WGS84',
    ll: [2, 1],
    xy: [-15631296.4526007361710072, 8421356.1168374437838793]
  },
  {
    code: '+proj=qsc +lat_0=0 +lon_0=-90 +units=m +datum=WGS84',
    ll: [2, 1],
    xy: [11988027.5987015366554260, 232669.8736086514254566
    ]
  },
  {
    code: '+proj=qsc +lat_0=90 +lon_0=0 +units=m +datum=WGS84',
    ll: [2, 1],
    xy: [456180.4073964518611319, -11678366.5914389267563820
    ]
  },
  {
    code: '+proj=qsc +lat_0=-90 +lon_0=0 +units=m +datum=WGS84',
    ll: [2, 1],
    xy: [464158.3228444084525108, 11882603.8180405404418707]
  },
  // QSC WGS84 WKT
  {
    code: 'PROJCS["unnamed",GEOGCS["WGS 84",DATUM["unknown",SPHEROID["WGS84",6378137,298.257223563]],PRIMEM["Greenwich",0],UNIT["degree",0.0174532925199433]],PROJECTION["Quadrilateralized_Spherical_Cube"],PARAMETER["latitude_of_origin",0],PARAMETER["central_meridian",0],UNIT["Meter",1]]',
    ll: [2, 1],
    xy: [304638.4508447283296846, 164123.8709293559950311]
  },
  {
    code: 'PROJCS["unnamed",GEOGCS["WGS 84",DATUM["unknown",SPHEROID["WGS84",6378137,298.257223563]],PRIMEM["Greenwich",0],UNIT["degree",0.0174532925199433]],PROJECTION["Quadrilateralized_Spherical_Cube"],PARAMETER["latitude_of_origin",0],PARAMETER["central_meridian",90],UNIT["Meter",1]]',
    ll: [2, 1],
    xy: [-11576764.4717786349356174, 224687.8649776891397778]
  },
  {
    code: 'PROJCS["unnamed",GEOGCS["WGS 84",DATUM["unknown",SPHEROID["WGS84",6378137,298.257223563]],PRIMEM["Greenwich",0],UNIT["degree",0.0174532925199433]],PROJECTION["Quadrilateralized_Spherical_Cube"],PARAMETER["latitude_of_origin",0],PARAMETER["central_meridian",180],UNIT["Meter",1]]',
    ll: [2, 1],
    xy: [-15631296.4526007361710072, 8421356.1168374437838793]
  },
  {
    code: 'PROJCS["unnamed",GEOGCS["WGS 84",DATUM["unknown",SPHEROID["WGS84",6378137,298.257223563]],PRIMEM["Greenwich",0],UNIT["degree",0.0174532925199433]],PROJECTION["Quadrilateralized_Spherical_Cube"],PARAMETER["latitude_of_origin",0],PARAMETER["central_meridian",-90],UNIT["Meter",1]]',
    ll: [2, 1],
    xy: [11988027.5987015366554260, 232669.8736086514254566
    ]
  },
  {
    code: 'PROJCS["unnamed",GEOGCS["WGS 84",DATUM["unknown",SPHEROID["WGS84",6378137,298.257223563]],PRIMEM["Greenwich",0],UNIT["degree",0.0174532925199433]],PROJECTION["Quadrilateralized_Spherical_Cube"],PARAMETER["latitude_of_origin",90],PARAMETER["central_meridian",0],UNIT["Meter",1]]',
    ll: [2, 1],
    xy: [456180.4073964518611319, -11678366.5914389267563820
    ]
  },
  {
    code: 'PROJCS["unnamed",GEOGCS["WGS 84",DATUM["unknown",SPHEROID["WGS84",6378137,298.257223563]],PRIMEM["Greenwich",0],UNIT["degree",0.0174532925199433]],PROJECTION["Quadrilateralized_Spherical_Cube"],PARAMETER["latitude_of_origin",-90],PARAMETER["central_meridian",0],UNIT["Meter",1]]',
    ll: [2, 1],
    xy: [464158.3228444084525108, 11882603.8180405404418707]
  },
  // QSC Mars
  {
    code: '+proj=qsc +units=m +a=3396190 +b=3376200 +lat_0=0 +lon_0=0',
    ll: [2, 1],
    xy: [162139.9347801624389831, 86935.6184961361577734]
  },
  {
    code: '+proj=qsc +units=m +a=3396190 +b=3376200 +lat_0=0 +lon_0=90',
    ll: [2, 1],
    xy: [-6164327.7345527401193976, 119033.1141843862715177]
  },
  {
    code: '+proj=qsc +units=m +a=3396190 +b=3376200 +lat_0=0 +lon_0=180',
    ll: [2, 1],
    xy: [-8327904.7183852149173617, 4465226.5862284321337938]
  },
  {
    code: '+proj=qsc +units=m +a=3396190 +b=3376200 +lat_0=0 +lon_0=-90',
    ll: [2, 1],
    xy: [6383315.0547841880470514, 123261.7574065744993277]
  },
  {
    code: '+proj=qsc +units=m +a=3396190 +b=3376200 +lat_0=90 +lon_0=0',
    ll: [2, 1],
    xy: [242914.9289354820502922, -6218701.0766915259882808]
  },
  {
    code: '+proj=qsc +units=m +a=3396190 +b=3376200 +lat_0=-90 +lon_0=0',
    ll: [2, 1],
    xy: [247141.3965058987669181, 6326900.0192015860229731]
  },
  // Robinson
  {
    code: '+proj=robin +lon_0=0 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs',
    ll: [-15, -35],
    xy: [-1335949.91, -3743319.07],
    acc: { ll: 4, xy: 0 }
  },
  {
    code: '+proj=robin +lon_0=0 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs',
    ll: [-10, 50],
    xy: [-819964.60, 5326895.52],
    acc: { ll: 4, xy: 0 }
  },
  {
    code: '+proj=robin +a=6400000',
    ll: [80, -20],
    xy: [7449059.80, -2146370.56],
    acc: { ll: 4, xy: 0 }
  },
  {
    code: '+proj=robin +lon_0=15 +x_0=100000 +y_0=100000 +datum=WGS84',
    ll: [-35, 40],
    xy: [-4253493.26, 4376351.58],
    acc: { ll: 4, xy: 0 }
  },
  {
    code: 'PROJCS["World_Robinson",GEOGCS["GCS_WGS_1984",DATUM["WGS_1984",SPHEROID["WGS_1984",6378137,298.257223563]],PRIMEM["Greenwich",0],UNIT["Degree",0.017453292519943295]],PROJECTION["Robinson"],PARAMETER["False_Easting",0],PARAMETER["False_Northing",0],PARAMETER["Central_Meridian",0],UNIT["Meter",1]]',
    ll: [20, 40],
    xy: [1741397.30, 4276351.58],
    acc: { ll: 4, xy: 0 }
  },
  {
    code: 'PROJCS["World_Robinson",GEOGCS["GCS_WGS_1984",DATUM["WGS_1984",SPHEROID["WGS_1984",6378137,298.257223563]],PRIMEM["Greenwich",0],UNIT["Degree",0.017453292519943295]],PROJECTION["Robinson"],PARAMETER["False_Easting",100000],PARAMETER["False_Northing",100000],PARAMETER["Central_Meridian",15],UNIT["Meter",1]]',
    ll: [-35, 40],
    xy: [-4253493.26, 4376351.58],
    acc: { ll: 4, xy: 0 }
  },
  {
    code: '+proj=robin +lon_0=162 +x_0=0 +y_0=0 +ellps=WGS84 +datum=WGS84 +units=m +no_defs',
    ll: [-90, 22],
    xy: [9987057.08, 2352946.55],
    acc: { ll: 4, xy: 0 }
  },
  // check that coordinates at 180 and -180 deg. longitude don't wrap around
  {
    code: 'EPSG:3857',
    ll: [-180, 0],
    xy: [-20037508.342789, 0]
  },
  {
    code: 'EPSG:3857',
    ll: [180, 0],
    xy: [20037508.342789, 0]
  },
  // these test cases are taken from mapshaper-proj and the test results match
  {
    code: '+proj=tmerc +ellps=GRS80 +lat_1=0.5 +lat_2=2 +n=0.5',
    ll: [2, 1],
    xy: [222650.79679577847, 110642.2294119271]
  },
  {
    code: '+proj=tmerc +approx +a=6400000 +lat_1=0.5 +lat_2=2 +n=0.5',
    ll: [2, 1],
    xy: [223413.46640632232, 111769.14504059685]
  },
  {
    code: '+proj=etmerc +zone=30 +ellps=GRS80 +lat_1=0.5 +lat_2=2 +n=0.5',
    ll: [2, 1],
    xy: [222650.7967975856, 110642.2294119332]
  },
  {
    code: '+proj=etmerc +k=0.998 +lon_0=-20 +datum=WGS84 +x_0=10000 +y_0=20000',
    ll: [2, 1],
    xy: [2516532.477709202, 139083.35793371277]
  },
  {
    code: '+proj=utm +zone=30 +ellps=GRS80 +lat_1=0.5 +lat_2=2 +n=0.5',
    ll: [2, 1],
    xy: [1057002.405491298, 110955.14117594929]
  },
  {
    code: '+proj=utm +lon_0=-3 +ellps=GRS80 +lat_1=0.5 +lat_2=2 +n=0.5',
    ll: [2, 1],
    xy: [1057002.4052152266, 110955.14117382761]
  },
  // these test cases are related to the original issue on GitHub
  {
    code: '+proj=utm +zone=33 +datum=WGS84 +units=m +no_defs',
    ll: [2, 1],
    xy: [-959006.4926646841, 113457.31956265299]
  },
  {
    code: '+proj=utm +zone=33 +datum=WGS84 +units=m +no_defs',
    ll: [31, 70],
    xy: [1104629.4356366363, 7845845.077685604]
  },
  // these test cases are for Norway snow flake zones
  {
    code: '+proj=utm +zone=31 +datum=WGS84 +units=m +no_defs',
    ll: [59.121778, 1.508527],
    xy: [8089746.634775677, 301230.8618526573]
  },
  {
    code: '+proj=utm +zone=32 +datum=WGS84 +units=m +no_defs',
    ll: [59.121778, 1.508527],
    xy: [6969865.865375574, 261237.08330733588]
  },
  {
    code: '+proj=utm +zone=33 +datum=WGS84 +units=m +no_defs',
    ll: [59.121778, 1.508527],
    xy: [5984417.050333044, 232959.75386279594]
  },
  {
    code: '+proj=utm +zone=34 +datum=WGS84 +units=m +no_defs',
    ll: [79.070672, 20.520579],
    xy: [7421462.108989433, 3922366.25143021]
  },
  {
    code: '+proj=utm +zone=35 +datum=WGS84 +units=m +no_defs',
    ll: [79.070672, 20.520579],
    xy: [6548241.281523044, 3478520.1422119136]
  },
  // these test cases are for the margin zones 1 and 60
  {
    code: '+proj=utm +zone=1 +datum=WGS84 +units=m +no_defs',
    ll: [-177, 60],
    xy: [500000, 6651411.190362714]
  },
  {
    code: '+proj=utm +zone=60 +datum=WGS84 +units=m +no_defs',
    ll: [177, 60],
    xy: [500000.0000000014, 6651411.190362714]
  },
  {
    code: '+proj=lcc +lat_1=46.8 +lat_0=46.8 +lon_0=0 +k_0=0.99987742 +x_0=600000 +y_0=2200000 +a=6378249.2 +b=6356515 +towgs84=-168,-60,320,0,0,0,0 +pm=paris +units=m +no_defs',
    ll: [1.4477496, 46.8692953],
    xy: [532247.285, 2208091.8723]
  },
  {
    code: '+proj=utm +zone=33 +units=m +no_defs',
    ll: [2, 1],
    xy: [-959006.4926646841, 113457.31956265299]
  },
  {
    code: '+proj=utm +zone=33 +units=m',
    ll: [2, 1],
    xy: [-959006.4926646841, 113457.31956265299]
  },
  {
    code: '+proj=utm +zone=33',
    ll: [2, 1],
    xy: [-959006.4926646841, 113457.31956265299]
  },
  {
    code: 'PROJCS["CUSTOM_OBLIQUE_MERCATOR", GEOGCS["WGS 84", DATUM["World Geodetic System 1984", SPHEROID["WGS 84", 6378137.0, 298.257223563]], PRIMEM["Greenwich", 0.0], UNIT["degree", 0.017453292519943295], AXIS["Geodetic latitude", NORTH], AXIS["Geodetic longitude", EAST]], PROJECTION["Hotine_Oblique_Mercator_Azimuth_Center", AUTHORITY["EPSG", "9815"]], PARAMETER["latitude_of_center", 37.50832038], PARAMETER["longitude_of_center", -122.25064809], PARAMETER["azimuth", 45.0], PARAMETER["rectified_grid_angle", -3.99], PARAMETER["scale_factor", 1.0], PARAMETER["false_easting", -361.25], PARAMETER["false_northing", 254.915], UNIT["foot", 0.3048], AXIS["Easting", EAST], AXIS["Northing", NORTH]]',
    xy: [-361.2499999983702, 254.91500000283122],
    ll: [-122.25064809, 37.50832038],
    acc: {
      ll: 3,
      xy: 8
    }
  },
  // Omerc Type A - #273
  {
    code: '+proj=omerc +lat_0=4 +lonc=102.25 +alpha=323.0257964666666 +k=0.99984 +x_0=804671 +y_0=0 +no_uoff +gamma=323.1301023611111 +ellps=GRS80 +units=m +no_defs',
    xy: [412597.532715, 338944.957259],
    ll: [101.70979078430528, 3.06268465621428],
    acc: {
      ll: 2,
      xy: -3
    }
  },
  {
    code: 'PROJCS["GDM2000 / Peninsula RSO", GEOGCS["GDM2000", DATUM["Geodetic_Datum_of_Malaysia_2000", SPHEROID["GRS 1980",6378137,298.257222101, AUTHORITY["EPSG","7019"]], AUTHORITY["EPSG","6742"]], PRIMEM["Greenwich",0, AUTHORITY["EPSG","8901"]], UNIT["degree",0.0174532925199433, AUTHORITY["EPSG","9122"]], AUTHORITY["EPSG","4742"]], PROJECTION["Hotine_Oblique_Mercator"], PARAMETER["latitude_of_center",4], PARAMETER["longitude_of_center",102.25], PARAMETER["azimuth",323.0257964666666], PARAMETER["rectified_grid_angle",323.1301023611111], PARAMETER["scale_factor",0.99984], PARAMETER["false_easting",804671], PARAMETER["false_northing",0], UNIT["metre",1, AUTHORITY["EPSG","9001"]], AXIS["Easting",EAST], AXIS["Northing",NORTH], AUTHORITY["EPSG","3375"]]',
    xy: [412597.532715, 338944.957259],
    ll: [101.70979078430528, 3.06268465621428],
    acc: {
      ll: 7,
      xy: 6
    }
  },
  {
    code: { $schema: 'https://proj.org/schemas/v0.7/projjson.schema.json', type: 'ProjectedCRS', name: '_GDM2000 / Peninsula RSO', base_crs: { type: 'GeographicCRS', name: 'GDM2000', datum: { type: 'GeodeticReferenceFrame', name: 'Geodetic Datum of Malaysia 2000', ellipsoid: { name: 'GRS 1980', semi_major_axis: 6378137, inverse_flattening: 298.257222101 } }, coordinate_system: { subtype: 'ellipsoidal', axis: [{ name: 'Geodetic latitude', abbreviation: 'Lat', direction: 'north', unit: 'degree' }, { name: 'Geodetic longitude', abbreviation: 'Lon', direction: 'east', unit: 'degree' }] }, id: { authority: 'EPSG', code: 4742 } }, conversion: { name: 'Peninsular RSO', method: { name: 'Hotine Oblique Mercator (variant A)', id: { authority: 'EPSG', code: 9812 } }, parameters: [{ name: 'Latitude of projection centre', value: 4, unit: 'degree', id: { authority: 'EPSG', code: 8811 } }, { name: 'Longitude of projection centre', value: 102.25, unit: 'degree', id: { authority: 'EPSG', code: 8812 } }, { name: 'Azimuth at projection centre', value: 323.025796466667, unit: 'degree', id: { authority: 'EPSG', code: 8813 } }, { name: 'Angle from Rectified to Skew Grid', value: 323.130102361111, unit: 'degree', id: { authority: 'EPSG', code: 8814 } }, { name: 'Scale factor at projection centre', value: 0.99984, unit: 'unity', id: { authority: 'EPSG', code: 8815 } }, { name: 'False easting', value: 804671, unit: 'metre', id: { authority: 'EPSG', code: 8806 } }, { name: 'False northing', value: 0, unit: 'metre', id: { authority: 'EPSG', code: 8807 } }] }, coordinate_system: { subtype: 'Cartesian', axis: [{ name: 'Easting', abbreviation: 'E', direction: 'east', unit: 'metre' }, { name: 'Northing', abbreviation: 'N', direction: 'north', unit: 'metre' }] }, scope: 'Engineering survey, topographic mapping.', area: 'Malaysia - West Malaysia onshore and offshore.', bbox: { south_latitude: 1.13, west_longitude: 98.02, north_latitude: 7.81, east_longitude: 105.82 }, id: { authority: 'EPSG', code: 3375 } },
    xy: [412597.532715, 338944.957259],
    ll: [101.70979078430528, 3.06268465621428],
    xacc: {
      ll: 7,
      xy: 6
    }
  },
  // EPSG:3468
  {
    code: '+proj=omerc +lat_0=57 +lonc=-133.6666666666667 +alpha=323.1301023611111 +k=0.9999 +x_0=5000000 +y_0=-5000000 +no_uoff +gamma=323.1301023611111 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
    xy: [1264314.74, -763162.04],
    ll: [-128.115000029, 44.8150000066],
    acc: {
      ll: 9,
      xy: 4
    }
  },
  {
    code: 'PROJCS["NAD83(NSRS2007) / Alaska zone 1", GEOGCS["NAD83(NSRS2007)", DATUM["NAD83_National_Spatial_Reference_System_2007", SPHEROID["GRS 1980",6378137,298.257222101, AUTHORITY["EPSG","7019"]], TOWGS84[0,0,0,0,0,0,0], AUTHORITY["EPSG","6759"]], PRIMEM["Greenwich",0, AUTHORITY["EPSG","8901"]], UNIT["degree",0.0174532925199433, AUTHORITY["EPSG","9122"]], AUTHORITY["EPSG","4759"]], PROJECTION["Hotine_Oblique_Mercator"], PARAMETER["latitude_of_center",57], PARAMETER["longitude_of_center",-133.6666666666667], PARAMETER["azimuth",323.1301023611111], PARAMETER["rectified_grid_angle",323.1301023611111], PARAMETER["scale_factor",0.9999], PARAMETER["false_easting",5000000], PARAMETER["false_northing",-5000000], UNIT["metre",1, AUTHORITY["EPSG","9001"]], AXIS["X",EAST], AXIS["Y",NORTH], AUTHORITY["EPSG","3468"]]',
    xy: [1264314.74, -763162.04],
    ll: [-128.115000029, 44.8150000066],
    acc: {
      ll: 9,
      xy: 4
    }
  },
  {
    code: `PROJCS["NAD83(NSRS2007) / Alaska zone 1",
    GEOGCS["NAD83(NSRS2007)",
        DATUM["NAD83_National_Spatial_Reference_System_2007",
            SPHEROID["GRS 1980",6378137,298.257222101,
                AUTHORITY["EPSG","7019"]],
            AUTHORITY["EPSG","6759"]],
        PRIMEM["Greenwich",0,
            AUTHORITY["EPSG","8901"]],
        UNIT["degree",0.0174532925199433,
            AUTHORITY["EPSG","9122"]],
        AUTHORITY["EPSG","4759"]],
    PROJECTION["Hotine_Oblique_Mercator"],
    PARAMETER["latitude_of_center",57],
    PARAMETER["longitude_of_center",-133.666666666667],
    PARAMETER["azimuth",323.130102361111],
    PARAMETER["rectified_grid_angle",323.130102361111],
    PARAMETER["scale_factor",0.9999],
    PARAMETER["false_easting",5000000],
    PARAMETER["false_northing",-5000000],
    UNIT["metre",1,
        AUTHORITY["EPSG","9001"]],
    AXIS["Easting",EAST],
    AXIS["Northing",NORTH],
    AUTHORITY["EPSG","3468"]]`,
    xy: [1264314.74, -763162.04],
    ll: [-128.115000029, 44.8150000066],
    acc: {
      ll: 9,
      xy: 4
    }
  },
  // Omerc Type B - #308
  {
    code: '+proj=omerc +lat_0=37.4769061 +lonc=141.0039618 +alpha=202.22 +k=1 +x_0=138 +y_0=77.65 +ellps=WGS84 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
    xy: [168.2438, 64.1736],
    ll: [141.003611, 37.476802],
    acc: {
      ll: 9,
      xy: 4
    }
  },
  {
    code: 'PROJCS["UNK / Oblique_Mercator",GEOGCS["UNK",DATUM["Unknown datum",SPHEROID["WGS 84", 6378137.0, 298.257223563]],PRIMEM["Greenwich",0],UNIT["degree",0.017453292519943295]],PROJECTION["Oblique_Mercator"],PARAMETER["latitude_of_center",37.4769061],PARAMETER["longitude_of_center",141.0039618],PARAMETER["central_meridian",141.0039618],PARAMETER["azimuth",202.22],PARAMETER["scale_factor",1],PARAMETER["false_easting",138],PARAMETER["false_northing",77.65],UNIT["Meter",1]]',
    xy: [168.2438, 64.1736],
    ll: [141.003611, 37.476802],
    acc: {
      ll: 9,
      xy: 4
    }
  },
  // Test with Feet
  {
    code: 'PROJCS["UNK / Oblique_Mercator",GEOGCS["UNK",DATUM["Unknown datum",SPHEROID["WGS 84", 6378137.0, 298.257223563]],PRIMEM["Greenwich",0],UNIT["degree",0.017453292519943295]],PROJECTION["Oblique_Mercator"],PARAMETER["latitude_of_center",37.4769061],PARAMETER["longitude_of_center",141.0039618],PARAMETER["central_meridian",141.0039618],PARAMETER["azimuth",202.22],PARAMETER["scale_factor",1],PARAMETER["false_easting",138],PARAMETER["false_northing",77.65],UNIT["Foot_US",0.3048006096012192]]',
    xy: [237.22488871325027, 33.43626458451221],
    ll: [141.003611, 37.476802]
  },
  {
    code: 'PROJCS["WGS 84 / Pseudo-Mercator", GEOGCS["WGS 84", DATUM["World Geodetic System 1984", SPHEROID["WGS 84", 6378137.0, 0, AUTHORITY["EPSG","7030"]], AUTHORITY["EPSG","6326"]], PRIMEM["Greenwich", 0.0, AUTHORITY["EPSG","8901"]], UNIT["degree", 0.017453292519943295], AXIS["Geodetic latitude", NORTH], AXIS["Geodetic longitude", EAST], AUTHORITY["EPSG","4326"]], PROJECTION["Popular Visualisation Pseudo Mercator", AUTHORITY["EPSG","1024"]], PARAMETER["semi_minor", 6378137.0], PARAMETER["latitude_of_origin", 0.0], PARAMETER["central_meridian", 0.0], PARAMETER["scale_factor", 1.0], PARAMETER["false_easting", 0.0], PARAMETER["false_northing", 0.0], UNIT["m", 1.0], AXIS["Easting", EAST], AXIS["Northing", NORTH], AUTHORITY["EPSG","3857"]]',
    xy: [-12523490.49256873, 5166512.50707369],
    ll: [-112.50042920000004, 42.036926809999976]
  },
  {
    code: 'PROJCS["WGS 84 / Pseudo-Mercator",GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563,AUTHORITY["EPSG","7030"]],AUTHORITY["EPSG","6326"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.0174532925199433,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4326"]],PROJECTION["Mercator_1SP"],PARAMETER["central_meridian",0],PARAMETER["scale_factor",1],PARAMETER["false_easting",0],PARAMETER["false_northing",0],UNIT["metre",1,AUTHORITY["EPSG","9001"]],AXIS["X",EAST],AXIS["Y",NORTH],EXTENSION["PROJ4","+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext  +no_defs"],AUTHORITY["EPSG","9999"]]',
    xy: [-12523490.49256873, 5166512.50707369],
    ll: [-112.50042920000004, 42.036926809999976]
  },
  {
    code: '+proj=geocent +datum=WGS84 +units=m +no_defs',
    ll: [-7.56234, 38.96618, 0],
    xy: [4922499, -653508, 3989398],
    acc: {
      ll: 0,
      xy: 0
    }
  },
  {
    code: '+proj=geocent +ellps=GRS80 +units=m +no_defs',
    ll: [-7.56234, 38.96618, 1],
    xy: [4922499, -653508, 3989399],
    acc: {
      ll: 0,
      xy: 0
    }
  },
  {
    code: '+proj=tpers +a=6400000 +h=1000000 +azi=20',
    ll: [2, 1],
    xy: [170820.288955531, 180460.865555805],
    acc: {
      ll: 5,
      xy: 0
    }
  },
  {
    code: '+proj=tpers +a=6400000 +h=1000000 +azi=20',
    ll: [2, -1],
    xy: [246853.941538942, -28439.878035775],
    acc: {
      ll: 5,
      xy: 0
    }
  },
  {
    code: '+proj=tpers +a=6400000 +h=1000000 +azi=20',
    ll: [-2, 1],
    xy: [-246853.941538942, 28439.878035775],
    acc: {
      ll: 5,
      xy: 0
    }
  },
  {
    code: '+proj=tpers +a=6400000 +h=1000000 +azi=20',
    ll: [-2, -1],
    xy: [-170820.288955531, -180460.865555805],
    acc: {
      ll: 5,
      xy: 0
    }
  },
  {
    code: '+proj=tpers +a=6400000 +h=1000000 +tilt=20',
    ll: [2, 1],
    xy: [213598.340357101, 113687.930830744],
    acc: {
      ll: 5,
      xy: 0
    }
  },
  {
    code: '+proj=tpers +a=6400000 +h=1000000 +tilt=20',
    ll: [2, -1],
    xy: [231609.982792523, -123274.645577324],
    acc: {
      ll: 5,
      xy: 0
    }
  },
  {
    code: '+proj=tpers +a=6400000 +h=1000000 +tilt=20',
    ll: [-2, 1],
    xy: [-213598.340357101, 113687.930830744],
    acc: {
      ll: 5,
      xy: 0
    }
  },
  {
    code: '+proj=tpers +a=6400000 +h=1000000 +tilt=20',
    ll: [-2, -1],
    xy: [-231609.982792523, -123274.645577324],
    acc: {
      ll: 5,
      xy: 0
    }
  },
  // Geostationary - Ellipsoid - X Sweep
  {
    code: '+proj=geos +sweep=x +lon_0=-75 +h=35786023 +a=6378137.0 +b=6356752.314',
    ll: [-95, 25],
    xy: [-1920508.77, 2605680.03]
  },
  // Geostationary - Ellipsoid - Y Sweep
  {
    code: '+proj=geos +sweep=y +lon_0=-75 +h=35786023 +a=6378137.0 +b=6356752.314',
    ll: [-95, 25],
    xy: [-1925601.20, 2601922.01]
  },
  // Geostationary - Sphere - X Sweep
  {
    code: '+proj=geos +sweep=x +lon_0=-75 +h=35786023 +a=6378137.0 +b=6378137.0',
    ll: [-95, 25],
    xy: [-1919131.48, 2621384.15]
  },
  // Geostationary - Sphere - Y Sweep
  {
    code: '+proj=geos +sweep=y +lon_0=-75 +h=35786023 +a=6378137.0 +b=6378137.0',
    ll: [-95, 25],
    xy: [-1924281.93, 2617608.82]
  },
  // WKT - Arctic Polar Stereographic
  {
    code: 'PROJCS["WGS 84 / Arctic Polar Stereographic",GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563,AUTHORITY["EPSG","7030"]],AUTHORITY["EPSG","6326"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.0174532925199433,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4326"]],PROJECTION["Polar_Stereographic"],PARAMETER["latitude_of_origin",71],PARAMETER["central_meridian",0],PARAMETER["false_easting",0],PARAMETER["false_northing",0],UNIT["metre",1,AUTHORITY["EPSG","9001"]],AUTHORITY["EPSG","3995"]]',
    ll: [0, 90],
    xy: [0, 0]
  },
  {
    code: `PROJCRS["WGS 84 / Arctic Polar Stereographic",
    BASEGEOGCRS["WGS 84",
        ENSEMBLE["World Geodetic System 1984 ensemble",
            MEMBER["World Geodetic System 1984 (Transit)"],
            MEMBER["World Geodetic System 1984 (G730)"],
            MEMBER["World Geodetic System 1984 (G873)"],
            MEMBER["World Geodetic System 1984 (G1150)"],
            MEMBER["World Geodetic System 1984 (G1674)"],
            MEMBER["World Geodetic System 1984 (G1762)"],
            MEMBER["World Geodetic System 1984 (G2139)"],
            MEMBER["World Geodetic System 1984 (G2296)"],
            ELLIPSOID["WGS 84",6378137,298.257223563,
                LENGTHUNIT["metre",1]],
            ENSEMBLEACCURACY[2.0]],
        PRIMEM["Greenwich",0,
            ANGLEUNIT["degree",0.0174532925199433]],
        ID["EPSG",4326]],
    CONVERSION["Arctic Polar Stereographic",
        METHOD["Polar Stereographic (variant B)",
            ID["EPSG",9829]],
        PARAMETER["Latitude of standard parallel",71,
            ANGLEUNIT["degree",0.0174532925199433],
            ID["EPSG",8832]],
        PARAMETER["Longitude of origin",0,
            ANGLEUNIT["degree",0.0174532925199433],
            ID["EPSG",8833]],
        PARAMETER["False easting",0,
            LENGTHUNIT["metre",1],
            ID["EPSG",8806]],
        PARAMETER["False northing",0,
            LENGTHUNIT["metre",1],
            ID["EPSG",8807]]],
    CS[Cartesian,2],
        AXIS["easting (X)",south,
            MERIDIAN[90,
                ANGLEUNIT["degree",0.0174532925199433]],
            ORDER[1],
            LENGTHUNIT["metre",1]],
        AXIS["northing (Y)",south,
            MERIDIAN[180,
                ANGLEUNIT["degree",0.0174532925199433]],
            ORDER[2],
            LENGTHUNIT["metre",1]],
    USAGE[
        SCOPE["Polar research."],
        AREA["Northern hemisphere - north of 60°N onshore and offshore, including Arctic."],
        BBOX[60,-180,90,180]],
    ID["EPSG",3995]]`,
    ll: [0, 0],
    xy: [0, -12367396.218459858]
  },
  {
    code: 'PROJCS["WGS 84 / Arctic Polar Stereographic",GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563,AUTHORITY["EPSG","7030"]],AUTHORITY["EPSG","6326"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.0174532925199433,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4326"]],PROJECTION["Polar_Stereographic"],PARAMETER["latitude_of_origin",71],PARAMETER["central_meridian",0],PARAMETER["false_easting",0],PARAMETER["false_northing",0],UNIT["metre",1,AUTHORITY["EPSG","9001"]],AUTHORITY["EPSG","3995"]]',
    ll: [0, 0],
    xy: [0, -12367396.218459858]
  },
  // WKT - Antarctic Polar Stereographic
  {
    code: 'PROJCS["WGS 84 / Antarctic Polar Stereographic",GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563,AUTHORITY["EPSG","7030"]],AUTHORITY["EPSG","6326"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.01745329251994328,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4326"]],UNIT["metre",1,AUTHORITY["EPSG","9001"]],PROJECTION["Polar_Stereographic"],PARAMETER["latitude_of_origin",-71],PARAMETER["central_meridian",0],PARAMETER["scale_factor",1],PARAMETER["false_easting",0],PARAMETER["false_northing",0],AUTHORITY["EPSG","3031"]]',
    ll: [0, -90],
    xy: [0, 0]
  },
  {
    code: 'PROJCS["WGS 84 / Antarctic Polar Stereographic",GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563,AUTHORITY["EPSG","7030"]],AUTHORITY["EPSG","6326"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.01745329251994328,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4326"]],UNIT["metre",1,AUTHORITY["EPSG","9001"]],PROJECTION["Polar_Stereographic"],PARAMETER["latitude_of_origin",-71],PARAMETER["central_meridian",0],PARAMETER["scale_factor",1],PARAMETER["false_easting",0],PARAMETER["false_northing",0],AUTHORITY["EPSG","3031"]]',
    ll: [0, 0],
    xy: [0, 12367396.218459858]
  },
  {
    code: '+proj=eqearth +lon_0=0 +x_0=0 +y_0=0 +R=6371008.7714 +units=m +no_defs +type=crs',
    ll: [16, 48],
    xy: [1284600.7230114893, 5794915.366010354]
  },
  {
    code: '+proj=eqearth +lon_0=150 +x_0=0 +y_0=0 +R=6371008.7714 +units=m +no_defs +type=crs',
    ll: [16, 48],
    xy: [-10758531.055221224, 5794915.366010354]
  },
  {
    code: '+proj=bonne +lat_1=10 +lon_0=10',
    ll: [4.9, 52.366667],
    xy: [-347381.937958562, 4700204.94589969]
  },
  {
    code: '+proj=bonne +a=6400000 +lat_1=0.5 +lat_2=2',
    ll: [2, 1],
    xy: [223368.11557252839, 55884.555246393575]
  },
  {
    code: '+proj=bonne +ellps=GRS80 +lat_1=0.5 +lat_2=2',
    ll: [2, 1],
    xy: [222605.29609715697, 55321.139565494814]
  }
];
if (typeof module !== 'undefined') {
  module.exports = testPoints;
} else if (typeof define === 'function') {
  define(function () {
    return testPoints;
  });
}
