define(function(require, exports) {
  var projs = [
    require('proj4/projCode/tmerc'),
    require('proj4/projCode/utm'),
    require('proj4/projCode/sterea'),
    require('proj4/projCode/stere'),
    require('proj4/projCode/somerc'),
    require('proj4/projCode/omerc'),
    require('proj4/projCode/lcc'),
    require('proj4/projCode/krovak'),
    require('proj4/projCode/cass'),
    require('proj4/projCode/laea'),
    require('proj4/projCode/merc'),
    require('proj4/projCode/aea'),
    require('proj4/projCode/gnom'),
    require('proj4/projCode/cea'),
    require('proj4/projCode/eqc'),
    require('proj4/projCode/poly'),
    require('proj4/projCode/nzmg'),
    require('proj4/projCode/mill'),
    require('proj4/projCode/sinu'),
    require('proj4/projCode/moll'),
    require('proj4/projCode/eqdc'),
    require('proj4/projCode/vandg'),
    require('proj4/projCode/aeqd'),
    require('proj4/projCode/longlat')
  ];
  var names = {};
  var projStore = [];
  function add(proj, i){
    var len = projStore.length;
    if(!proj.names){
      console.log(i);
      return true;
    }
    projStore[len]=proj;
    proj.names.forEach(function(n){
      names[n.toLowerCase()]=len;
    });
    return this;
  }
  
  exports.add = add;

  exports.get = function(name){
    if(!name){
      return false;
    }
    var n = name.toLowerCase();
    if(typeof names[n] !== 'undefined'&&projStore[names[n]]){
      return projStore[names[n]];
    }
  };
  exports.start = function(){
    projs.forEach(add);
  };
});
