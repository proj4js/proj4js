define(function() {
  var proj4 = {};
  //var Proj = require('./Proj');
  proj4.PrimeMeridian = {
    "greenwich": 0.0, //"0dE",
    "lisbon": -9.131906111111, //"9d07'54.862\"W",
    "paris": 2.337229166667, //"2d20'14.025\"E",
    "bogota": -74.080916666667, //"74d04'51.3\"W",
    "madrid": -3.687938888889, //"3d41'16.58\"W",
    "rome": 12.452333333333, //"12d27'8.4\"E",
    "bern": 7.439583333333, //"7d26'22.5\"E",
    "jakarta": 106.807719444444, //"106d48'27.79\"E",
    "ferro": -17.666666666667, //"17d40'W",
    "brussels": 4.367975, //"4d22'4.71\"E",
    "stockholm": 18.058277777778, //"18d3'29.8\"E",
    "athens": 23.7163375, //"23d42'58.815\"E",
    "oslo": 10.722916666667 //"10d43'22.5\"E"
  };

  proj4.Ellipsoid = {
    "MERIT": {
      a: 6378137.0,
      rf: 298.257,
      ellipseName: "MERIT 1983"
    },
    "SGS85": {
      a: 6378136.0,
      rf: 298.257,
      ellipseName: "Soviet Geodetic System 85"
    },
    "GRS80": {
      a: 6378137.0,
      rf: 298.257222101,
      ellipseName: "GRS 1980(IUGG, 1980)"
    },
    "IAU76": {
      a: 6378140.0,
      rf: 298.257,
      ellipseName: "IAU 1976"
    },
    "airy": {
      a: 6377563.396,
      b: 6356256.910,
      ellipseName: "Airy 1830"
    },
    "APL4.": {
      a: 6378137,
      rf: 298.25,
      ellipseName: "Appl. Physics. 1965"
    },
    "NWL9D": {
      a: 6378145.0,
      rf: 298.25,
      ellipseName: "Naval Weapons Lab., 1965"
    },
    "mod_airy": {
      a: 6377340.189,
      b: 6356034.446,
      ellipseName: "Modified Airy"
    },
    "andrae": {
      a: 6377104.43,
      rf: 300.0,
      ellipseName: "Andrae 1876 (Den., Iclnd.)"
    },
    "aust_SA": {
      a: 6378160.0,
      rf: 298.25,
      ellipseName: "Australian Natl & S. Amer. 1969"
    },
    "GRS67": {
      a: 6378160.0,
      rf: 298.2471674270,
      ellipseName: "GRS 67(IUGG 1967)"
    },
    "bessel": {
      a: 6377397.155,
      rf: 299.1528128,
      ellipseName: "Bessel 1841"
    },
    "bess_nam": {
      a: 6377483.865,
      rf: 299.1528128,
      ellipseName: "Bessel 1841 (Namibia)"
    },
    "clrk66": {
      a: 6378206.4,
      b: 6356583.8,
      ellipseName: "Clarke 1866"
    },
    "clrk80": {
      a: 6378249.145,
      rf: 293.4663,
      ellipseName: "Clarke 1880 mod."
    },
    "CPM": {
      a: 6375738.7,
      rf: 334.29,
      ellipseName: "Comm. des Poids et Mesures 1799"
    },
    "delmbr": {
      a: 6376428.0,
      rf: 311.5,
      ellipseName: "Delambre 1810 (Belgium)"
    },
    "engelis": {
      a: 6378136.05,
      rf: 298.2566,
      ellipseName: "Engelis 1985"
    },
    "evrst30": {
      a: 6377276.345,
      rf: 300.8017,
      ellipseName: "Everest 1830"
    },
    "evrst48": {
      a: 6377304.063,
      rf: 300.8017,
      ellipseName: "Everest 1948"
    },
    "evrst56": {
      a: 6377301.243,
      rf: 300.8017,
      ellipseName: "Everest 1956"
    },
    "evrst69": {
      a: 6377295.664,
      rf: 300.8017,
      ellipseName: "Everest 1969"
    },
    "evrstSS": {
      a: 6377298.556,
      rf: 300.8017,
      ellipseName: "Everest (Sabah & Sarawak)"
    },
    "fschr60": {
      a: 6378166.0,
      rf: 298.3,
      ellipseName: "Fischer (Mercury Datum) 1960"
    },
    "fschr60m": {
      a: 6378155.0,
      rf: 298.3,
      ellipseName: "Fischer 1960"
    },
    "fschr68": {
      a: 6378150.0,
      rf: 298.3,
      ellipseName: "Fischer 1968"
    },
    "helmert": {
      a: 6378200.0,
      rf: 298.3,
      ellipseName: "Helmert 1906"
    },
    "hough": {
      a: 6378270.0,
      rf: 297.0,
      ellipseName: "Hough"
    },
    "intl": {
      a: 6378388.0,
      rf: 297.0,
      ellipseName: "International 1909 (Hayford)"
    },
    "kaula": {
      a: 6378163.0,
      rf: 298.24,
      ellipseName: "Kaula 1961"
    },
    "lerch": {
      a: 6378139.0,
      rf: 298.257,
      ellipseName: "Lerch 1979"
    },
    "mprts": {
      a: 6397300.0,
      rf: 191.0,
      ellipseName: "Maupertius 1738"
    },
    "new_intl": {
      a: 6378157.5,
      b: 6356772.2,
      ellipseName: "New International 1967"
    },
    "plessis": {
      a: 6376523.0,
      rf: 6355863.0,
      ellipseName: "Plessis 1817 (France)"
    },
    "krass": {
      a: 6378245.0,
      rf: 298.3,
      ellipseName: "Krassovsky, 1942"
    },
    "SEasia": {
      a: 6378155.0,
      b: 6356773.3205,
      ellipseName: "Southeast Asia"
    },
    "walbeck": {
      a: 6376896.0,
      b: 6355834.8467,
      ellipseName: "Walbeck"
    },
    "WGS60": {
      a: 6378165.0,
      rf: 298.3,
      ellipseName: "WGS 60"
    },
    "WGS66": {
      a: 6378145.0,
      rf: 298.25,
      ellipseName: "WGS 66"
    },
    "WGS72": {
      a: 6378135.0,
      rf: 298.26,
      ellipseName: "WGS 72"
    },
    "WGS84": {
      a: 6378137.0,
      rf: 298.257223563,
      ellipseName: "WGS 84"
    },
    "sphere": {
      a: 6370997.0,
      b: 6370997.0,
      ellipseName: "Normal Sphere (r=6370997)"
    }
  };

  proj4.Datum = {
    "WGS84": {
      towgs84: "0,0,0",
      ellipse: "WGS84",
      datumName: "WGS84"
    },
    "GGRS87": {
      towgs84: "-199.87,74.79,246.62",
      ellipse: "GRS80",
      datumName: "Greek_Geodetic_Reference_System_1987"
    },
    "NAD83": {
      towgs84: "0,0,0",
      ellipse: "GRS80",
      datumName: "North_American_Datum_1983"
    },
    "NAD27": {
      nadgrids: "@conus,@alaska,@ntv2_0.gsb,@ntv1_can.dat",
      ellipse: "clrk66",
      datumName: "North_American_Datum_1927"
    },
    "potsdam": {
      towgs84: "606.0,23.0,413.0",
      ellipse: "bessel",
      datumName: "Potsdam Rauenberg 1950 DHDN"
    },
    "carthage": {
      towgs84: "-263.0,6.0,431.0",
      ellipse: "clark80",
      datumName: "Carthage 1934 Tunisia"
    },
    "hermannskogel": {
      towgs84: "653.0,-212.0,449.0",
      ellipse: "bessel",
      datumName: "Hermannskogel"
    },
    "ire65": {
      towgs84: "482.530,-130.596,564.557,-1.042,-0.214,-0.631,8.15",
      ellipse: "mod_airy",
      datumName: "Ireland 1965"
    },
    "nzgd49": {
      towgs84: "59.47,-5.04,187.44,0.47,-0.1,1.024,-4.5993",
      ellipse: "intl",
      datumName: "New Zealand Geodetic Datum 1949"
    },
    "OSGB36": {
      towgs84: "446.448,-125.157,542.060,0.1502,0.2470,0.8421,-20.4894",
      ellipse: "airy",
      datumName: "Airy 1830"
    }
  };

  //proj4.WGS84 = Proj('WGS84');
  proj4.Datum.OSB36 = proj4.Datum.OSGB36; //as returned from spatialreference.org

  //lookup table to go from the projection name in WKT to the proj4 projection name
  //build this out as required
  proj4.wktProjections = {
    "Lambert Tangential Conformal Conic Projection": "lcc",
    "Lambert_Conformal_Conic": "lcc",
    "Mercator": "merc",
    "Popular Visualisation Pseudo Mercator": "merc",
    "Mercator_1SP": "merc",
    "Transverse_Mercator": "tmerc",
    "Transverse Mercator": "tmerc",
    "Lambert Azimuthal Equal Area": "laea",
    "Universal Transverse Mercator System": "utm"
  };

  // Based on proj4 CTABLE  structure :
  // FIXME: better to have array instead of object holding longitudes, latitudes members
  //        In the former case, one has to document index 0 is longitude and
  //        1 is latitude ...
  //        In the later case, grid object gets bigger !!!!
  //        Solution 1 is chosen based on pj_gridinfo.c
  proj4.grids = {
    "null": { // name of grid's file
      "ll": [-3.14159265, - 1.57079633], // lower-left coordinates in radians (longitude, latitude):
      "del": [3.14159265, 1.57079633], // cell's size in radians (longitude, latitude):
      "lim": [3, 3], // number of nodes in longitude, latitude (including edges):
      "count": 9, // total number of nodes
      "cvs": [ // shifts : in ntv2 reverse order : lon, lat in radians ...
        [0.0, 0.0],
        [0.0, 0.0],
        [0.0, 0.0], // for (lon= 0; lon<lim[0]; lon++) {
        [0.0, 0.0],
        [0.0, 0.0],
        [0.0, 0.0], //   for (lat= 0; lat<lim[1]; lat++) { p= cvs[lat*lim[0]+lon]; }
        [0.0, 0.0],
        [0.0, 0.0],
        [0.0, 0.0] // }
      ]
    }
  };
  return proj4;
});
