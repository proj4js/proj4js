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
          define: true,
          console:true
        }
			},
			all: [ './proj4/*.js','./proj4/projCode/*.js']
		},
    requirejs: {
      reg:{
        options:{
          out: "./dist/proj4.js",
          baseUrl: ".",
          //name: "proj4",
          wrap: {
            startFile: 'almond/top.frag',
            endFile: 'almond/end.frag'
          },
          name: 'node_modules/almond/almond',
          include: ['proj4'],
          optimize:'uglify2',
          //optimize:'none',
          uglify2:{
            mangle: true
          },
          preserveLicenseComments: false
        }
      },
      amd:{
        options:{
          out: "./dist/amd/proj4.js",
          baseUrl: ".",
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
	grunt.registerTask('version',function(){
	  grunt.file.write('./proj4/version.js',"define(function(){return '"+grunt.file.readJSON('package.json').version+"';});");
	});
	grunt.registerTask('test', ['connect', 'mocha_phantomjs:before']);
  grunt.registerTask('amd',['jshint','requirejs:amd','connect','mocha_phantomjs:amd']);
	grunt.registerTask('build',['jshint','requirejs:custom']);
  grunt.registerTask('default', ['version','jshint','test','requirejs:reg','requirejs:amd','mocha_phantomjs:after','mocha_phantomjs:amd']);
}
