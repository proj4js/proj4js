module.exports = function(grunt) {
    grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		concat:{
            full:{
				src:[ './src/Proj4js.js','./src/Proj.js','./src/defs.js','./src/common.js','./src/datum.js','./src/Point.js','./src/constants.js','./src/projCode/*.js','./src/defs/*.js'],
                dest:'./dist/proj4.js'
            },
            noDefs:{
                src:[ './src/Proj4js.js','./src/Proj.js','./src/defs.js','./src/common.js','./src/datum.js','./src/Point.js','./src/constants.js','./src/projCode/*.js','./src/defs/GOOGLE.js'],
                dest:'./dist/proj4-noDefs.js'
            }
		},
        uglify:{
            full:{
    		    src:[ './src/Proj4js.js','./src/Proj.js','./src/defs.js','./src/common.js','./src/datum.js','./src/Point.js','./src/constants.js','./src/projCode/*.js','./srcgrunt/defs/*.js'],
                dest:'./dist/proj4.min.js'
		    },
            noDefs:{
                src:[ './src/Proj4js.js','./src/Proj.js','./src/defs.js','./src/common.js','./src/datum.js','./src/Point.js','./src/constants.js','./src/projCode/*.js','./src/defs/GOOGLE.js'],
                dest:'./dist/proj4-noDefs.min.js'
            }
        }
	});
	grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.registerTask('full', ['concat:full','uglify:full']);
    grunt.registerTask('noDefs', ['concat:noDefs','uglify:noDefs']);
	grunt.registerTask('default', ['full','noDefs']);
}
