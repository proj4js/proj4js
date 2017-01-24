var adjust_lon = require('./adjust_lon');

module.exports = function(zone, lon) {
  if (zone === undefined) {
    zone = Math.floor((adjust_lon(lon) + Math.PI) * 30 / Math.PI);

    if (zone < 0) {
      return 0;
    } else if (zone >= 60) {
      return 59;
    }
    return zone;
  } else {
    if (zone > 0 && zone <= 60) {
      return zone - 1;
    }
  }
};
