define(function(require, exports) {
  exports.init = function() {
    //no-op for longlat
  };
  function identity(pt){
    return pt;
  }
  exports.forward = identity;
  exports.inverse = identity;
});