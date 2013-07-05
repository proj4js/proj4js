(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(factory);
  } else {
    root.proj4 = factory();
  }
}(this, function () {

