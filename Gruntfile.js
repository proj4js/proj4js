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
      before: {
        options: {
          urls: [ //my ide requries process.env.IP and PORT
          "http://" + (process.env.IP || "127.0.0.1") + ":" + (process.env.PORT || "8080") + "/test/index.html"]
        }
      },
      after: {
        options: {
          urls: [ //my ide requries process.env.IP and PORT
          "http://" + (process.env.IP || "127.0.0.1") + ":" + (process.env.PORT || "8080") + "/test/opt.html"]
        }
      },
      amd: {
        options: {
          urls: [ //my ide requries process.env.IP and PORT
          "http://" + (process.env.IP || "127.0.0.1") + ":" + (process.env.PORT || "8080") + "/test/amd.html"]
        }
      }
    },
    jshint: {
      options: {
        curly: true,
        eqeqeq: true,
        latedef: true,
        undef: true,
        unused: true,
        trailing: true,
        indent: 2,
        //camelcase:true,
        globals: {
          define: true,
          console: true
        }
      },
      all: ['./proj4/*.js', './proj4/projCode/*.js']
    },
    browserify: {
      all: {
        files: {
          'dist/proj4.js': ['lib/index.js'],
        },
        options: {
          transform: ['deamdify'],
          standalone: 'proj4'
        }
      }
    },
    uglify: {
      options: {
        report: 'gzip',
        mangle: true
      },
      all: {
        src: 'dist/proj4.js',
        dest: 'dist/proj4.min.js'
      }
    }
  });
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-mocha-phantomjs');
  grunt.registerTask('version', function() {
    grunt.file.write('./lib/version.js', "define(function(){return '" + grunt.file.readJSON('package.json').version + "';});");
  });
  grunt.registerTask('test', ['connect', 'mocha_phantomjs:before']);
  grunt.registerTask('amd', ['jshint', 'requirejs:amd', 'connect', 'mocha_phantomjs:amd']);
  grunt.registerTask('build', ['jshint', 'requirejs:custom']);
  grunt.registerTask('default', ['version', 'jshint', 'test', 'browserify', 'uglify', 'mocha_phantomjs:after', 'mocha_phantomjs:amd']);
};
