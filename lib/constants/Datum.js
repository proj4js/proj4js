var datums = {
  wgs84: {
    towgs84: '0,0,0',
    ellipse: 'WGS84',
    datumName: 'WGS84'
  },
  ch1903: {
    towgs84: '674.374,15.056,405.346',
    ellipse: 'bessel',
    datumName: 'swiss'
  },
  ggrs87: {
    towgs84: '-199.87,74.79,246.62',
    ellipse: 'GRS80',
    datumName: 'Greek_Geodetic_Reference_System_1987'
  },
  nad83: {
    towgs84: '0,0,0',
    ellipse: 'GRS80',
    datumName: 'North_American_Datum_1983'
  },
  nad27: {
    nadgrids: '@conus,@alaska,@ntv2_0.gsb,@ntv1_can.dat',
    ellipse: 'clrk66',
    datumName: 'North_American_Datum_1927'
  },
  potsdam: {
    towgs84: '598.1,73.7,418.2,0.202,0.045,-2.455,6.7',
    ellipse: 'bessel',
    datumName: 'Potsdam Rauenberg 1950 DHDN'
  },
  carthage: {
    towgs84: '-263.0,6.0,431.0',
    ellipse: 'clark80',
    datumName: 'Carthage 1934 Tunisia'
  },
  hermannskogel: {
    towgs84: '577.326,90.129,463.919,5.137,1.474,5.297,2.4232',
    ellipse: 'bessel',
    datumName: 'Hermannskogel'
  },
  mgi: {
    towgs84: '577.326,90.129,463.919,5.137,1.474,5.297,2.4232',
    ellipse: 'bessel',
    datumName: 'Militar-Geographische Institut'
  },
  osni52: {
    towgs84: '482.530,-130.596,564.557,-1.042,-0.214,-0.631,8.15',
    ellipse: 'airy',
    datumName: 'Irish National'
  },
  ire65: {
    towgs84: '482.530,-130.596,564.557,-1.042,-0.214,-0.631,8.15',
    ellipse: 'mod_airy',
    datumName: 'Ireland 1965'
  },
  rassadiran: {
    towgs84: '-133.63,-157.5,-158.62',
    ellipse: 'intl',
    datumName: 'Rassadiran'
  },
  nzgd49: {
    towgs84: '59.47,-5.04,187.44,0.47,-0.1,1.024,-4.5993',
    ellipse: 'intl',
    datumName: 'New Zealand Geodetic Datum 1949'
  },
  osgb36: {
    towgs84: '446.448,-125.157,542.060,0.1502,0.2470,0.8421,-20.4894',
    ellipse: 'airy',
    datumName: 'Ordnance Survey of Great Britain 1936'
  },
  s_jtsk: {
    towgs84: '589,76,480',
    ellipse: 'bessel',
    datumName: 'S-JTSK (Ferro)'
  },
  beduaram: {
    towgs84: '-106,-87,188',
    ellipse: 'clrk80',
    datumName: 'Beduaram'
  },
  gunung_segara: {
    towgs84: '-403,684,41',
    ellipse: 'bessel',
    datumName: 'Gunung Segara Jakarta'
  },
  rnb72: {
    towgs84: '106.869,-52.2978,103.724,-0.33657,0.456955,-1.84218,1',
    ellipse: 'intl',
    datumName: 'Reseau National Belge 1972'
  },
  EPSG_1070: {
    towgs84: '6.41,-49.05,-11.28,1.5657,0.5242,6.9718,-5.7649',
    ellipse: 'Clarke 1866',
    datumName: 'Ocotepeque 1935'
  },
  EPSG_6181: {
    towgs84: '-193,13.7,-39.3,-0.41,-2.933,2.688,0.43',
    ellipse: 'International 1924',
    datumName: 'Luxembourg 1930'
  },
  EPSG_6614: {
    towgs84: '-119.4248,-303.65872,-11.00061,1.164298,0.174458,1.096259,3.657065',
    ellipse: 'International 1924',
    datumName: 'QND95'
  },
  EPSG_6615: {
    towgs84: '-303.956,224.556,214.306,9.405,-6.626,-12.583,1.327',
    ellipse: 'International 1924',
    datumName: 'Porto Santo'
  },
  ESRI_106241: {
    towgs84: '-364.422,243.651,274.822,5.477,12.092,1.538,2.243',
    ellipse: 'International 1924',
    datumName: 'GCS_Graciosa_Base_SW_1948'
  },
  ESRI_106249: {
    towgs84: '-249.507,179.302,119.92,1.406,2.423,-0.479,0.952',
    ellipse: 'International 1924',
    datumName: 'GCS_Sao_Braz'
  },
  ESRI_106245: {
    towgs84: '-1333.976,-487.235,945.031,6.674,35.963,20.438,-11.187',
    ellipse: 'International 1924',
    datumName: 'GCS_Observatorio_Meteorologico_1939'
  },
  EPSG_6178: {
    towgs84: '24.9,-126.4,-93.2,-0.063,-0.247,-0.041,1.01',
    ellipse: 'Krassowsky 1940',
    datumName: 'Pulkovo 1942(83)'
  },
  EPSG_6622: {
    towgs84: '-472.29,-5.63,-304.12,0.4362,-0.8374,0.2563,1.8984',
    ellipse: 'International 1924',
    datumName: 'Guadeloupe 1948'
  },
  EPSG_6625: {
    towgs84: '126.93,547.94,130.41,-2.7867,5.1612,-0.8584,13.8227',
    ellipse: 'International 1924',
    datumName: 'Martinique 1938'
  },
  EPSG_1057: {
    towgs84: '0.023,0.036,-0.068,0.00176,0.00912,-0.01136,0.00439',
    ellipse: 'GRS 1980',
    datumName: 'TUREF'
  },
  EPSG_6314: {
    towgs84: '598.1,73.7,418.2,0.202,0.045,-2.455,6.7',
    ellipse: 'Bessel 1841',
    datumName: 'DHDN'
  },
  EPSG_6282: {
    towgs84: '-178.3,-316.7,-131.5,5.278,6.077,10.979,19.166',
    ellipse: 'Clarke 1880 (IGN)',
    datumName: 'Pointe Noire'
  },
  EPSG_6231: {
    towgs84: '-83.11,-97.38,-117.22,0.0276,-0.2167,0.2147,0.1218',
    ellipse: 'International 1924',
    datumName: 'ED87'
  },
  EPSG_6274: {
    towgs84: '-230.994,102.591,25.199,0.633,-0.239,0.9,1.95',
    ellipse: 'International 1924',
    datumName: 'Datum 73'
  },
  EPSG_6134: {
    towgs84: '-191.808,-250.512,167.861,-0.792,-1.653,8.558,20.703',
    ellipse: 'Clarke 1880 (RGS)',
    datumName: 'PSD93'
  },
  EPSG_6254: {
    towgs84: '18.38,192.45,96.82,0.056,-0.142,-0.2,-0.0013',
    ellipse: 'International 1924',
    datumName: 'Hito XVIII 1963'
  },
  EPSG_6159: {
    towgs84: '-194.513,-63.978,-25.759,-3.4027,3.756,-3.352,-0.9175',
    ellipse: 'International 1924',
    datumName: 'ELD79'
  },
  EPSG_6687: {
    towgs84: '0.072,-0.507,-0.245,0.0183,-0.0003,0.007,-0.0093',
    ellipse: 'GRS 1980',
    datumName: 'RGPF'
  },
  EPSG_6227: {
    towgs84: '-175.09,1.218,238.831,-0.047,0.019,0.808,0.1698',
    ellipse: 'Clarke 1880 (IGN)',
    datumName: 'Deir ez Zor'
  },
  EPSG_6746: {
    towgs84: '599.4,72.4,419.2,-0.062,-0.022,-2.723,6.46',
    ellipse: 'Bessel 1841',
    datumName: 'PD/83'
  },
  EPSG_6745: {
    towgs84: '612.4,77,440.2,-0.054,0.057,-2.797,2.55',
    ellipse: 'Bessel 1841',
    datumName: 'RD/83'
  },
  EPSG_1112: {
    towgs84: '8.846,-4.394,-1.122,-0.00237,-0.146528,0.130428,0.783926',
    ellipse: 'WGS 84',
    datumName: 'CGRS93'
  },
  EPSG_6289: {
    towgs84: '593.16,26.15,478.54,-6.3239,-0.5008,-5.5487,4.0775',
    ellipse: 'Bessel 1841',
    datumName: 'Amersfoort'
  },
  EPSG_6230: {
    towgs84: '-84,-103,-122.5,0,0,0.554,0.2263',
    ellipse: 'International 1924',
    datumName: 'ED50'
  },
  EPSG_6154: {
    towgs84: '-110.33,-97.73,-119.85,0.3423,1.1634,0.2715,0.063',
    ellipse: 'International 1924',
    datumName: 'ED50(ED77)'
  },
  EPSG_6156: {
    towgs84: '485,169.5,483.8,7.786,4.398,4.103,0',
    ellipse: 'Bessel 1841',
    datumName: 'S-JTSK'
  },
  EPSG_6299: {
    towgs84: '482.5,-130.6,564.6,-1.042,-0.214,-0.631,8.15',
    ellipse: 'Airy Modified 1849',
    datumName: 'TM65'
  },
  EPSG_6179: {
    towgs84: '33.4,-146.6,-76.3,-0.359,-0.053,0.844,-0.84',
    ellipse: 'Krassowsky 1940',
    datumName: 'Pulkovo 1942(58)'
  },
  EPSG_6313: {
    towgs84: '-99.1,53.3,-112.5,0.419,-0.83,1.885,-1',
    ellipse: 'International 1924',
    datumName: 'BD72'
  },
  EPSG_6194: {
    towgs84: '163.511,127.533,-159.789,0,0,0.814,-0.6',
    ellipse: 'International 1924',
    datumName: 'Qornoq 1927'
  },
  EPSG_6195: {
    towgs84: '105,326,-102.5,0,0,0.814,-0.6',
    ellipse: 'International 1924',
    datumName: 'Scoresbysund 1952'
  },
  EPSG_6196: {
    towgs84: '-45,417,-3.5,0,0,0.814,-0.6',
    ellipse: 'International 1924',
    datumName: 'Ammassalik 1958'
  },
  EPSG_6611: {
    towgs84: '-162.619,-276.959,-161.764,0.067753,-2.243649,-1.158827,-1.094246',
    ellipse: 'International 1924',
    datumName: 'Hong Kong 1980'
  },
  EPSG_6633: {
    towgs84: '137.092,131.66,91.475,-1.9436,-11.5993,-4.3321,-7.4824',
    ellipse: 'International 1924',
    datumName: 'IGN56 Lifou'
  },
  EPSG_6641: {
    towgs84: '-408.809,366.856,-412.987,1.8842,-0.5308,2.1655,-121.0993',
    ellipse: 'International 1924',
    datumName: 'IGN53 Mare'
  },
  EPSG_6643: {
    towgs84: '-480.26,-438.32,-643.429,16.3119,20.1721,-4.0349,-111.7002',
    ellipse: 'International 1924',
    datumName: 'ST71 Belep'
  },
  EPSG_6300: {
    towgs84: '482.5,-130.6,564.6,-1.042,-0.214,-0.631,8.15',
    ellipse: 'Airy Modified 1849',
    datumName: 'TM75'
  },
  EPSG_6188: {
    towgs84: '482.5,-130.6,564.6,-1.042,-0.214,-0.631,8.15',
    ellipse: 'Airy 1830',
    datumName: 'OSNI 1952'
  },
  EPSG_6660: {
    towgs84: '982.6087,552.753,-540.873,32.39344,-153.25684,-96.2266,16.805',
    ellipse: 'International 1924',
    datumName: 'Helle 1954'
  },
  EPSG_6634: {
    towgs84: '97.295,-263.247,310.882,-1.5999,0.8386,3.1409,13.3259',
    ellipse: 'International 1924',
    datumName: 'IGN72 Grande Terre'
  },
  EPSG_1031: {
    towgs84: '628.54052,192.2538,498.43507,-13.79189,-0.81467,41.21533,-17.40368',
    ellipse: 'Bessel 1841',
    datumName: 'MGI 1901'
  },
  EPSG_6307: {
    towgs84: '-156.5,-87.2,287.8,0,0,0.814,-0.38',
    ellipse: 'Clarke 1880 (RGS)',
    datumName: 'Nord Sahara 1959'
  },
  EPSG_1138: {
    towgs84: '-76.269,-16.683,68.562,-6.275,10.536,-4.286,-13.686',
    ellipse: 'Clarke 1880 (RGS)',
    datumName: 'South East Island 1943'
  },
  EPSG_6690: {
    towgs84: '221.597,152.441,176.523,2.403,1.3893,0.884,11.4648',
    ellipse: 'International 1924',
    datumName: 'Tahiti 79'
  },
  EPSG_6691: {
    towgs84: '218.769,150.75,176.75,3.5231,2.0037,1.288,10.9817',
    ellipse: 'International 1924',
    datumName: 'Moorea 87'
  },
  EPSG_6629: {
    towgs84: '72.51,345.411,79.241,-1.5862,-0.8826,-0.5495,1.3653',
    ellipse: 'International 1924',
    datumName: 'Tahaa 54'
  },
  EPSG_6630: {
    towgs84: '1363.857,1362.18,398.566,-4.5139,-6.7582,-1.0504,268.3517',
    ellipse: 'International 1924',
    datumName: 'IGN72 Nuku Hiva'
  },
  EPSG_6692: {
    towgs84: '217.109,86.452,23.711,0.0183,-0.0003,0.007,-0.0093',
    ellipse: 'International 1924',
    datumName: 'Maupiti 83'
  },
  EPSG_1268: {
    towgs84: '0,0,0,-8.393,0.749,-10.276,0',
    ellipse: 'GRS 1980',
    datumName: 'KSA-GRF17'
  },
  EPSG_1178: {
    towgs84: '0,0,0,0,0,0,0',
    ellipse: 'GRS 1980',
    datumName: 'ETRF89'
  },
  EPSG_6312: {
    towgs84: '577.326,90.129,463.919,5.1365988,1.4742,5.2970436,2.4232',
    ellipse: 'Bessel 1841',
    datumName: 'MGI'
  },
  EPSG_6123: {
    towgs84: '-90.7,-106.1,-119.2,4.09,0.218,-1.05,1.37',
    ellipse: 'International 1924',
    datumName: 'KKJ'
  },
  EPSG_6309: {
    towgs84: '-124.45,183.74,44.64,-0.4384,0.5446,-0.9706,-2.1365',
    ellipse: 'International 1924',
    datumName: 'Yacare'
  },
  ESRI_106263: {
    towgs84: '-283.088,-70.693,117.445,-1.157,0.059,-0.652,-4.058',
    ellipse: 'International 1924',
    datumName: 'GCS_Datum_Lisboa_Hayford'
  },
  EPSG_6281: {
    towgs84: '-275.7224,94.7824,340.8944,-8.001,-4.42,-11.821,1',
    ellipse: 'Clarke 1880 (Benoit)',
    datumName: 'Palestine 1923'
  },
  EPSG_6322: {
    towgs84: '0,0,4.5,0,0,0.554,0.219',
    ellipse: 'WGS 72',
    datumName: 'WGS 72'
  },
  EPSG_6324: {
    towgs84: '0,0,1.9,0,0,0.814,-0.38',
    ellipse: 'WGS 72',
    datumName: 'WGS 72BE'
  },
  EPSG_6284: {
    towgs84: '27,-135,-84.5,0,0,0.554,0.2263',
    ellipse: 'Krassowsky 1940',
    datumName: 'Pulkovo 1942'
  },
  EPSG_6277: {
    towgs84: '446.448,-125.157,542.06,0.15,0.247,0.842,-20.489',
    ellipse: 'Airy 1830',
    datumName: 'OSGB36'
  },
  EPSG_6207: {
    towgs84: '-280.9,-89.8,130.2,-1.721,0.355,-0.371,-5.92',
    ellipse: 'International 1924',
    datumName: 'Lisbon'
  },
  EPSG_6688: {
    towgs84: '347.175,1077.618,2623.677,33.9058,-70.6776,9.4013,186.0647',
    ellipse: 'International 1924',
    datumName: 'Fatu Iva 72'
  },
  EPSG_6689: {
    towgs84: '374.787,-58.914,-1.202,-16.1928,-11.4629,-5.5287,-0.5502',
    ellipse: 'International 1924',
    datumName: 'IGN63 Hiva Oa'
  },
  EPSG_6720: {
    towgs84: '0,0,4.5,0,0,0.554,0.2263',
    ellipse: 'WGS 72',
    datumName: 'Fiji 1986'
  },
  EPSG_6273: {
    towgs84: '278.3,93,474.5,7.889,0.05,-6.61,6.21',
    ellipse: 'Bessel Modified',
    datumName: 'NGO 1948'
  },
  EPSG_6240: {
    towgs84: '293,836,318,0.5,1.6,-2.8,2.1',
    ellipse: 'Everest 1830 (1937 Adjustment)',
    datumName: 'Indian 1975'
  },
  EPSG_6817: {
    towgs84: '278.3,93,474.5,7.889,0.05,-6.61,6.21',
    ellipse: 'Bessel Modified',
    datumName: 'NGO 1948 (Oslo)'
  },
  ESRI_106278: {
    towgs84: '426.62,142.62,460.09,4.98,4.49,-12.42,-17.1',
    ellipse: 'Bessel 1841',
    datumName: 'GCS_D48'
  },
  EPSG_6265: {
    towgs84: '-50.2,-50.4,84.8,-0.69,-2.012,0.459,-28.08',
    ellipse: 'International 1924',
    datumName: 'Monte Mario'
  },
  EPSG_6263: {
    towgs84: '-89,-112,125.9,0,0,0.814,-0.38',
    ellipse: 'Clarke 1880 (RGS)',
    datumName: 'Minna'
  },
  EPSG_6298: {
    towgs84: '-533.4,669.2,-52.5,0,0,4.28,9.4',
    ellipse: 'Everest 1830 (1967 Definition)',
    datumName: 'Timbalai 1948'
  },
  EPSG_6270: {
    towgs84: '-225.4,-158.7,380.8,0,0,0.814,-0.38',
    ellipse: 'Clarke 1880 (RGS)',
    datumName: 'Nahrwan 1967'
  },
  EPSG_6229: {
    towgs84: '-121.8,98.1,-10.7,0,0,0.554,0.2263',
    ellipse: 'Helmert 1906',
    datumName: 'Egypt 1907'
  },
  EPSG_6220: {
    towgs84: '-41.057,-374.564,-226.287,0,0,0.554,0.219',
    ellipse: 'Clarke 1880 (RGS)',
    datumName: 'Camacupa 1948'
  },
  EPSG_6214: {
    towgs84: '31.4,-144.3,-74.8,0,0,0.814,-0.38',
    ellipse: 'Krassowsky 1940',
    datumName: 'Beijing 1954'
  },
  EPSG_6232: {
    towgs84: '-333.102,-11.02,230.69,0,0,0.554,0.219',
    ellipse: 'Clarke 1880 (RGS)',
    datumName: 'Fahud'
  },
  EPSG_6238: {
    towgs84: '2.691,-14.757,4.724,0,0,0.774,-0.6',
    ellipse: 'Indonesian National Spheroid',
    datumName: 'ID74'
  },
  EPSG_6168: {
    towgs84: '-171.16,17.29,325.21,0,0,0.814,-0.38',
    ellipse: 'War Office',
    datumName: 'Accra'
  },
  EPSG_6131: {
    towgs84: '199,931,318.9,0,0,0.814,-0.38',
    ellipse: 'Everest 1830 (1937 Adjustment)',
    datumName: 'Indian 1960'
  },
  'NOUVELLE TRIANGULATION DU DUCHE DU LUXEMBOURG GEOGRAPHIQUES (DMS)': {
    towgs84: '-192.986,13.673,-39.309,-0.4099,-2.9332,2.6881,0.43',
    ellipse: 'International 1924',
    datumName: 'NOUVELLE TRIANGULATION DU DUCHE DU LUXEMBOURG GEOGRAPHIQUES (DMS)'
  }
};

for (var key in datums) {
  var datum = datums[key];
  datums[datum.datumName] = datum;
}

export default datums;
