var buildDefs = require('./buildDefs');

module.exports = function(grunt) {
  grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		connect: {
			server: {
				options: {
					port: process.env.PORT||8080,
					base: '.'
				}
			}
		},
		mocha_phantomjs: {
			before: {
				options: {
					urls: [//my ide requries process.env.IP and PORT
						"http://"+(process.env.IP||"127.0.0.1")+":"+(process.env.PORT||"8080")+"/test/index.html"
					]
				}
			},
      after:{
        options: {
					urls: [//my ide requries process.env.IP and PORT
						"http://"+(process.env.IP||"127.0.0.1")+":"+(process.env.PORT||"8080")+"/test/opt.html"
					]
				}
			},
      amd:{
        options: {
  				urls: [//my ide requries process.env.IP and PORT
						"http://"+(process.env.IP||"127.0.0.1")+":"+(process.env.PORT||"8080")+"/test/amd.html"
					]
				}
			}
		},
		jshint: {
			options:{
				curly: true,
				eqeqeq: true,
				latedef: true,
				undef: true,
				unused: true,
				trailing:true,
				indent:2,
        //camelcase:true,
        globals: {
          define: true
        }
			},
			all: [ './src/*.js','./src/projCode/*.js']
		},
    requirejs: {
      custom:{
        options:{
          out: "./dist/proj4.custom.js",
          baseUrl: "./src",
          //name: "proj4",
          wrap: {
            startFile: 'almond/top.frag',
            endFile: 'almond/end.frag'
          },
          name: '../node_modules/almond/almond',
          include: ['proj4'],
          optimize:'uglify2',
          uglify2:{
            mangle: true
          },
          preserveLicenseComments: false
        }
      },
      reg:{
        options:{
          out: "./dist/proj4.js",
          baseUrl: "./src",
          //name: "proj4",
          wrap: {
            startFile: 'almond/top.frag',
            endFile: 'almond/end.frag'
          },
          name: '../node_modules/almond/almond',
          include: ['proj4'],
          optimize:'uglify2',
          uglify2:{
            mangle: true
          },
          preserveLicenseComments: false
        }
      },
      amd:{
        options:{
          out: "./dist/amd/proj4.js",
          baseUrl: "./src",
          name: "proj4",
          //include: ['proj4'],
          optimize:'none',
          uglify2:{
            mangle: true
          },
          preserveLicenseComments: false
        }
      }
    }
	});
  grunt.loadNpmTasks('grunt-contrib-requirejs');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-connect');
	grunt.loadNpmTasks('grunt-mocha-phantomjs');
	grunt.registerTask('test', ['connect', 'mocha_phantomjs:before']);
	grunt.registerTask('defs',function(){
		var defs = grunt.option('defs');
		if(defs && defs.indexOf(',')>-1){
			defs = defs.split(',');
		}
		buildDefs.defs(defs);
	});
  grunt.registerTask('amd',['defs','jshint','requirejs:amd','connect','mocha_phantomjs:amd']);
	grunt.registerTask('build',['defs','jshint','requirejs:custom']);
  grunt.registerTask('default', ['defs','jshint','test','requirejs:reg','mocha_phantomjs:after']);
}
