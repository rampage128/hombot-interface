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
        uglify: {
            options: {
                mangle: {
                    except: ['require']
                }
            },
            www: {
                files: [{
                    expand: true,
                    cwd: 'dist/www/',
                    src: '**/*.js',
                    dest: 'dist/www/'
                }]
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
                    "dist/www/sites/mail/strings.js": [ "src/www/sites/mail/lang/**/*.js" ],
                    "dist/www/sites/maps/strings.js": [ "src/www/sites/maps/lang/**/*.js" ],
                    "dist/www/sites/overview/strings.js": [ "src/www/sites/overview/lang/**/*.js" ],
                    "dist/www/sites/schedule/strings.js": [ "src/www/sites/schedule/lang/**/*.js" ],
                    "dist/www/sites/service/strings.js": [ "src/www/sites/service/lang/**/*.js" ],
                    "dist/www/sites/statistics/strings.js": [ "src/www/sites/statistics/lang/**/*.js" ]
                }
            }
        },
        createMenu: {
            www: {
                options: {
                    order: [
                        'overview',
                        'schedule',
                        'maps',
                        'statistics',
                        'service',
                        'mail'
                    ]
                },
                files: {
                    "dist/www/app.js": [ "src/www/sites/*.js" ]
                }
            }
        }
    });
    
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-merge-json');
    grunt.loadNpmTasks('grunt-include-source');
    
    grunt.registerMultiTask('createMenu', function() {
        var options = (this.options && this.options()) || {};
        var orderedModules = options.order.slice();
                
        this.files.forEach(function(file) {            
            var modules = file.src.map(function(source) {
                var parts = source.split("/");
                var fileName = parts[parts.length - 1];
                var id = fileName.replace(/\.[^\.]*$/, '');
                return {
                    id: id,
                    fileName: fileName,
                    name: id.charAt(0).toUpperCase() + id.slice(1)
                };
            });
            
            modules.forEach(function(module) {
                var found = false;
                orderedModules.forEach(function(moduleId, index) {
                    if (moduleId === module.id) {
                        orderedModules[index] = module;
                        found = true;
                    }
                });
                if (!found) {
                    orderedModules.push(module);
                }
            });           
            
            var contents = grunt.file.read(file.dest);
            grunt.file.write(file.dest, contents.replace(/\['moduleDefinition'\]/g, JSON.stringify(orderedModules)));
            grunt.log.writeln('Modified "' + file.dest + '".');
        });
    });
    
    grunt.registerTask('build', ['copy', 'concat', 'createMenu', 'uglify', 'merge-json']);
};
