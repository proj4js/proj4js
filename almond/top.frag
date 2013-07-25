(function (root, factory) {
  /* global module: false */
  if (typeof define === 'function' && define.amd) {
    define(factory);
  } else if(typeof module !== 'undefined'){
    module.exports = factory();
  }else {
    root.proj4 = factory();
  }
}(this, function () {

