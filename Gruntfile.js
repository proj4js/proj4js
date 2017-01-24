var json = require('rollup-plugin-json');
var nodeResolve = require('rollup-plugin-node-resolve');

var projs = [
  'tmerc',
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
  'ortho'
];
module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    connect: {
      server: {
        options: {
          port: process.env.PORT || 8080,
          base: '.'
        }
      }
    },
    mocha_phantomjs: {
      all: {
        options: {
          reporter: "dot",
          urls: [ //my ide requries process.env.IP and PORT
            "http://" + (process.env.IP || "127.0.0.1") + ":" + (process.env.PORT || "8080") + "/test/amd.html",
            "http://" + (process.env.IP || "127.0.0.1") + ":" + (process.env.PORT || "8080") + "/test/opt.html"
          ]
        }
      }
    },
    jshint: {
      options: {
        jshintrc: "./.jshintrc"
      },
      all: ['./lib/*.js', './lib/*/*.js']
    },
    rollup: {
      options: {
        format: "umd",
        moduleName: "proj4",
        plugins: [
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
          except: ['proj4','Projection','Point']
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
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-mocha-phantomjs');
  grunt.registerTask('custom',function(){
    grunt.task.run('rollup', 'uglify');
    var projections = this.args;
    if(projections[0]==='default'){
      grunt.file.write('./projs.js','module.exports = function(){}');
      return;
    }
    if(projections[0]==='all'){
      projections = projs;
    }
    grunt.file.write('./projs.js',[
      "var projs = [",
      " require('./lib/projections/"+projections.join("'),\n\trequire('./lib/projections/")+"')",
      "];",
      "module.exports = function(proj4){",
      " projs.forEach(function(proj){",
      "   proj4.Proj.projections.add(proj);",
      " });",
      "}"
    ].join("\n"));
  });
  grunt.registerTask('build',function(){
    var args = this.args.length?this.args[0].split(','):['default'];
    grunt.task.run('jshint', 'custom:'+args.join(':'));
  });
  grunt.registerTask('default', ['build:all', 'connect','mocha_phantomjs']);
};
