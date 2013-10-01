define(function(require, exports) {
  var projs = [
    require('./projCode/tmerc'),
    require('./projCode/utm'),
    require('./projCode/sterea'),
    require('./projCode/stere'),
    require('./projCode/somerc'),
    require('./projCode/omerc'),
    require('./projCode/lcc'),
    require('./projCode/krovak'),
    require('./projCode/cass'),
    require('./projCode/laea'),
    require('./projCode/merc'),
    require('./projCode/aea'),
    require('./projCode/gnom'),
    require('./projCode/cea'),
    require('./projCode/eqc'),
    require('./projCode/poly'),
    require('./projCode/nzmg'),
    require('./projCode/mill'),
    require('./projCode/sinu'),
    require('./projCode/moll'),
    require('./projCode/eqdc'),
    require('./projCode/vandg'),
    require('./projCode/aeqd'),
    require('./projCode/longlat')
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
