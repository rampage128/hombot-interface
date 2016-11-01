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
                    {expand: true, cwd: 'src/www/', src: ['css/**', 'lang/**', 'lib/**', '*'], dest: 'dist/www/'},
                    {expand: true, cwd: 'src/www/sites/', src: ['mail/**', 'overview/**', 'schedule/**', 'service/**', 'statistics/**', '*'], dest: 'dist/www/sites/'},
                    {expand: true, cwd: 'src/www/sites/maps/', src: ['*.html', '*.css', 'lang/**'], dest: 'dist/www/sites/maps/'}
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
        }
    });
    
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    
    grunt.registerTask('build', ['copy', 'concat']);
};
