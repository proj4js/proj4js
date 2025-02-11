var projs = [
  'tmerc',
  'etmerc',
  'utm',
  'sterea',
  'stere',
  'somerc',
  'omerc',
  'lcc',
  'krovak',
  'cass',
  'laea',
  'aea',
  'gnom',
  'cea',
  'eqc',
  'poly',
  'nzmg',
  'mill',
  'sinu',
  'moll',
  'eqdc',
  'vandg',
  'aeqd',
  'ortho',
  'qsc',
  'robin',
  'geocent',
  'tpers',
  'geos',
  'eqearth',
  'bonne'
];
var urls = [ //my ide requries process.env.IP and PORT
"http://" + (process.env.IP || "127.0.0.1") + ":" + (process.env.PORT || "8080") + "/test/amd.html",
"http://" + (process.env.IP || "127.0.0.1") + ":" + (process.env.PORT || "8080") + "/test/opt.html"
];
module.exports = function (grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
  });

  grunt.registerTask('custom',function(){
    var projections = this.args;
    if(projections[0]==='default'){
      grunt.file.write('./projs.js','export default function(){}');
      return;
    }
    if(projections[0]==='all'){
      projections = projs;
    }
    grunt.file.write('./projs.js',[
      projections.map(function(proj) {
        return "import " + proj + " from './lib/projections/" + proj + "';";
      }).join("\n"),
      "export default function(proj4){",
      projections.map(function(proj) {
        return "  proj4.Proj.projections.add(" + proj + ");"
      }).join("\n"),
      "}"
    ].join("\n"));
  });
  grunt.registerTask('build',function(){
    var args = this.args.length?this.args[0].split(','):['default'];
    grunt.task.run('custom:'+args.join(':'));
  });
  grunt.registerTask('default', ['build:all']);
};
