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
			all: [ './src/*.js','./src/projCode/*.js','./src/defs/*.js']
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
          include: ['proj4']
        }
    }
    }
	});
  grunt.loadNpmTasks('grunt-contrib-requirejs');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-connect');
	grunt.loadNpmTasks('grunt-mocha-phantomjs');
	grunt.registerTask('test', ['connect', 'mocha_phantomjs:before']);
  grunt.registerTask('default', ['jshint','test','requirejs','mocha_phantomjs:after']);
}
