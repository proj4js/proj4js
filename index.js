const proj4 = require('./dist/proj4-src.js');

const coords = proj4("+proj=stere +lat_0=90 +lat_ts=60 +lon_0=10 +x_0=0 +y_0=0 +a=6370040 +b=6370040 +to_meter=1000 +no_defs", "WGS84", [-217.962000,-4331.145000]);
console.log(coords);
