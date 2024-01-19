var json = require('rollup-plugin-json');
var nodeResolve = require('rollup-plugin-node-resolve');
var replace = require('rollup-plugin-replace');
var pkg = require('./package.json');

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
  'geos'
];
module.exports = function (grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      options: {
        jshintrc: "./.jshintrc"
      },
      all: ['./lib/*.js', './lib/*/*.js']
    },
    shell: {
      npm_test_jest: {
        command: 'npm run run-tests',
      }
    },
    rollup: {
      options: {
        format: "umd",
        moduleName: "proj4",
        plugins: [
          replace({
            __VERSION__: pkg.version
          }),
          json(),
          nodeResolve()
        ]
      },
      files: {
        dest: './dist/proj4-src.js',
        src: './lib/index.js',
      },
    },
    uglify: {
      options: {
        report: 'gzip',
        mangle:{
          reserved: ['proj4','Projection','Point']
        },
      },
      all: {
        src: 'dist/proj4-src.js',
        dest: 'dist/proj4.js'
      }
    }
  });
  grunt.loadNpmTasks('grunt-rollup');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-shell');
  grunt.registerTask('custom',function(){
    grunt.task.run('rollup', 'uglify');
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
    grunt.task.run('jshint', 'custom:'+args.join(':'));
  });
  grunt.registerTask('default', ['build:all', "shell:npm_test_jest"]);
};
