var TWO_PI = Math.PI * 2;
var sign = require('./sign');

module.exports = function(x) {
  return (Math.abs(x) < Math.PI) ? x : (x - (sign(x) * TWO_PI));
};