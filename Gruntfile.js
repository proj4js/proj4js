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
    browserify: {
      all: {
        files: {
          'dist/proj4-src.js': ['lib/index.js'],
        },
        options: {
          standalone: 'proj4'
        }
      }
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
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-mocha-phantomjs');
  grunt.registerTask('version', function() {
    grunt.file.write('./lib/version.js', "module.exports = '" + grunt.file.readJSON('package.json').version + "';");
  });
  grunt.registerTask('default', ['version', 'jshint', 'browserify', 'uglify', 'connect','mocha_phantomjs']);
};
