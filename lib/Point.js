var mgrs = require('mgrs');

function Point(x, y, z) {
  if (!(this instanceof Point)) {
    return new Point(x, y, z);
  }
  if (Array.isArray(x)) {
    this.x = x[0];
    this.y = x[1];
    this.z = x[2] || 0.0;
  }else if(typeof x === 'object'){
    this.x = x.x;
    this.y = x.y;
    this.z = x.z || 0.0;
  } else if (typeof x === 'string' && typeof y === 'undefined') {
    var coords = x.split(',');
    this.x = parseFloat(coords[0], 10);
    this.y = parseFloat(coords[1], 10);
    this.z = parseFloat(coords[2], 10) || 0.0;
  }
  else {
    this.x = x;
    this.y = y;
    this.z = z || 0.0;
  }
  this.clone = function() {
    return new Point(this.x, this.y, this.z);
  };
  this.toArray = function(){
    if(this.z){
      return [this.x,this.y, this.z];
    }else{
      return [this.x,this.y];
    }
  };
  this.toString = function() {
    if(this.z){
      return "x=" + this.x + ",y=" + this.y + ",z="+this.z;
    }else{
      return "x=" + this.x + ",y=" + this.y;
    }
  };
  this.toShortString = function() {
    if(this.z){
      return this.x + "," + this.y+ "," + this.z;
    }else{
      return this.x + "," + this.y;
    }
  };
}

Point.fromMGRS = function(mgrsStr) {
  return new Point(mgrs.toPoint(mgrsStr));
};
Point.prototype.toMGRS = function(accuracy) {
  return mgrs.forward([this.x, this.y], accuracy);
};
module.exports = Point;