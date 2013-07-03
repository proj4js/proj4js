module.exports = function(grunt) {
  grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		concat:{
			full:{
				src:[ './src/Proj4.js','./src/common.js','./src/Proj.js','./src/defs.js','src/defs/bigDefs.js','src/defs/smallDefs.js','./src/datum.js','./src/Point.js','./src/constants.js','./src/projCode/*.js','./src/util/MGRS.js'],
				dest:'./dist/proj4.js'
			},
			noDefs:{
				src:[ './src/Proj4.js','./src/common.js','./src/Proj.js','./src/defs.js','src/defs/smallDefs.js','./src/datum.js','./src/Point.js','./src/constants.js','./src/projCode/*.js','./src/defs/GOOGLE.js'],
				dest:'./dist/proj4-noDefs.js'
			}
		},
		uglify:{
			full:{
				src:[ './src/Proj4.js','./src/common.js','./src/Proj.js','./src/defs.js','src/defs/bigDefs.js','src/defs/smallDefs.js','./src/datum.js','./src/Point.js','./src/constants.js','./src/projCode/*.js','./src/util/MGRS.js'],
				dest:'./dist/proj4.min.js'
			},
			noDefs:{
				src:[ './src/Proj4.js','./src/common.js','./src/Proj.js','./src/defs.js','src/defs/smallDefs.js','./src/datum.js','./src/Point.js','./src/constants.js','./src/projCode/*.js','./src/defs/GOOGLE.js'],
				dest:'./dist/proj4-noDefs.min.js'
			}
		},
		connect: {
			server: {
				options: {
					port: process.env.PORT||8080,
					base: '.'
				}
			}
		},
		mocha_phantomjs: {
			all: {
				options: {
					urls: [//my ide requries process.env.IP and PORT
						"http://"+(process.env.IP||"127.0.0.1")+":"+(process.env.PORT||"8080")+"/test/index.html",
						"http://"+(process.env.IP||"127.0.0.1")+":"+(process.env.PORT||"8080")+"/test/min.html"
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
        globals: {
          proj4: true
        }
			},
			before: [ './src/Proj4.js','./src/Proj.js','./src/defs.js','./src/common.js','./src/datum.js','./src/Point.js','./src/constants.js','./src/projCode/*.js','./src/util/MGRS.js'],
      after: [ './dist/proj4.js']
		},
    requirejs: {
      compile: {
        options: {
          baseUrl: "./src",
          //name: "proj4",
          out: "./dist/proj4.amd.js",
          wrap: {
            startFile: 'almond/top.frag',
            endFile: 'almond/end.frag'
          },
          name: '../almond/almond',
          include: ['proj4'],
          insertRequire: ['proj4'],
          optimize:'none'
        }
    }
    }
	});
  grunt.loadNpmTasks('grunt-contrib-requirejs');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-connect');
	grunt.loadNpmTasks('grunt-mocha-phantomjs');
	grunt.registerTask('full', ['concat:full','uglify:full']);
	grunt.registerTask('noDefs', ['concat:noDefs','uglify:noDefs']);
	grunt.registerTask('test', ['connect', 'mocha_phantomjs']);
  grunt.registerTask('r', ['requirejs']);
	grunt.registerTask('default', ['jshint:before','full','noDefs','jshint:after','test']);
}
