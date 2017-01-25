var hypot = require('./hypot');
var log1py = require('./log1py');

module.exports = function(x) {
  var y = Math.abs(x);
  y = log1py(y * (1 + y / (hypot(1, y) + 1)));

  return x < 0 ? -y : y;
};
