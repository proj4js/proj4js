define(function (require, exports, module) {var extend = require('./extend')
module.exports =function() {
  var Class = function() {
    this.initialize.apply(this, arguments);
  };
  var extended = {};
  var parent,i;
  for(i=0; i<arguments.length; ++i) {
    if(typeof arguments[i] === "function") {
      // get the prototype of the superclass
      parent = arguments[i].prototype;
    } else {
      // in this case we're extending with the prototype
      parent = arguments[i];
    }
    extend(extended, parent);
  }
  Class.prototype = extended;
  return Class;
};
});
