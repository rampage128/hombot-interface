module.exports = function (grunt) {
    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        clean: {
            www: {
                src: ['dist/www/']
            },
            viewer: {
                src: ['dist/mapviewer/']   
            },
            installer: {
                src: ['dist/*.*']   
            }
        },
        concat: {
            www: {
                files: [
                    { src: ['src/www/sites/maps.js', 'src/www/sites/maps/*.js'], dest: 'dist/www/sites/maps.js' }
                ]
            },
            viewer: {
                files: [
                    { src: ['src/mapviewer/mapviewer.js', 'src/www/sites/maps/*.js'], dest: 'dist/mapviewer/mapviewer.js' },
                    { src: ['src/www/css/*.css', 'src/www/sites/maps/*.css'], dest: 'dist/mapviewer/styles.css' }
                ]
            }
        },
        copy: {
            www: {
                files: [
                    {expand: true, cwd: 'src/www/', src: ['css/**', 'lib/**', '*'], dest: 'dist/www/'},
                    {expand: true, cwd: 'src/www/sites/', src: ['mail/**', 'overview/**', 'schedule/**', 'service/**', 'statistics/**', '*', '!**/lang/**'], dest: 'dist/www/sites/'},
                    {expand: true, cwd: 'src/www/sites/maps/', src: ['*.html', '*.css'], dest: 'dist/www/sites/maps/'}
                ]
            },
            viewer: {
                files: [
                    {expand: true, cwd: 'src/mapviewer/', src: ['**', 'require.js'], dest: 'dist/mapviewer/'},
                    {expand: true, cwd: 'src/www/lib/', src: ['require.js'], dest: 'dist/mapviewer/'}
                ]
            },
            installer: {
                files: [
                    {expand: true, cwd: 'src/installer/', src: ['*'], dest: 'dist/'}
                ]
            }
        },
        "merge-json": {
            www: {
                files: {
                    "dist/www/lang/general.js": [ "src/www/lang/**/*.js" ],
                    "dist/www/sites/mail/lang/strings.js": [ "src/www/sites/mail/lang/**/*.js" ],
                    "dist/www/sites/maps/lang/strings.js": [ "src/www/sites/maps/lang/**/*.js" ],
                    "dist/www/sites/overview/lang/strings.js": [ "src/www/sites/overview/lang/**/*.js" ],
                    "dist/www/sites/schedule/lang/strings.js": [ "src/www/sites/schedule/lang/**/*.js" ],
                    "dist/www/sites/service/lang/strings.js": [ "src/www/sites/service/lang/**/*.js" ],
                    "dist/www/sites/statistics/lang/strings.js": [ "src/www/sites/statistics/lang/**/*.js" ]
                }
            }
        }
    });
    
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-merge-json');
    
    grunt.registerTask('build', ['copy', 'concat', 'merge-json']);
};
