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
        sass: {
            www: {
                files: [
                    { src: ['src/www/sites/mail/mail.scss'], dest: 'dist/www/sites/mail/mail.css' },
                    { src: ['src/www/sites/maps/maps.scss'], dest: 'dist/www/sites/maps/maps.css' },
                    { src: ['src/www/sites/overview/overview.scss'], dest: 'dist/www/sites/overview/overview.css' },
                    { src: ['src/www/sites/schedule/schedule.scss'], dest: 'dist/www/sites/schedule/schedule.css' },
                    { src: ['src/www/sites/service/service.scss'], dest: 'dist/www/sites/service/service.css' },
                    { src: ['src/www/sites/statistics/statistics.scss'], dest: 'dist/www/sites/statistics/statistics.css' }
                ]
            },
            viewer: {
                files: [
                    { src: ['src/www/css/main.scss'], dest: 'dist/www/css/main.css' },
                    { src: ['src/mapviewer/styles.scss'], dest: 'dist/mapviewer/styles.css' }
                ]
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
                    { src: ['src/www/sites/maps.js', 'src/www/sites/maps/*.js'], dest: 'dist/www/sites/maps.js' },
                    { src: ['src/www/sites/overview.js', 'src/www/sites/overview/*.js'], dest: 'dist/www/sites/overview.js' },
                    { src: ['src/www/sites/service.js', 'src/www/sites/service/*.js'], dest: 'dist/www/sites/service.js' },
                    { src: ['src/www/lib/ui.js', 'src/www/lib/text.js', 'src/www/lib/loader.js', 'src/www/lib/translator.js'], dest: 'dist/www/lib/ui.js' }
                ]
            },
            viewer: {
                files: [
                    { src: ['src/mapviewer/mapviewer.js', 'src/www/sites/maps/*.js'], dest: 'dist/mapviewer/mapviewer.js' }
                ]
            }
        },
        copy: {
            www: {
                files: [
                    {expand: true, cwd: 'src/www/', src: ['lib/require.js', 'lib/ui.js', 'lib/*.html', '*'], dest: 'dist/www/'},
                    {expand: true, cwd: 'src/www/sites/', src: ['mail/**', 'schedule/**', 'statistics/**', '*', '!**/lang/**', '!**/*.scss'], dest: 'dist/www/sites/'},
                    {expand: true, cwd: 'src/www/sites/maps/', src: ['*.html'], dest: 'dist/www/sites/maps/'},
                    {expand: true, cwd: 'src/www/sites/overview/', src: ['*.html'], dest: 'dist/www/sites/overview/'},
                    {expand: true, cwd: 'src/www/sites/service/', src: ['*.html'], dest: 'dist/www/sites/service/'}
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
                    "dist/www/lang/general.json": [ "src/www/lang/**/*.json", "src/www/sites/*/lang/name.json" ],
                    "dist/www/sites/mail/strings.json": [ "src/www/sites/mail/lang/**/strings.json" ],
                    "dist/www/sites/maps/strings.json": [ "src/www/sites/maps/lang/**/strings.json" ],
                    "dist/www/sites/overview/strings.json": [ "src/www/sites/overview/lang/**/strings.json" ],
                    "dist/www/sites/schedule/strings.json": [ "src/www/sites/schedule/lang/**/strings.json" ],
                    "dist/www/sites/service/strings.json": [ "src/www/sites/service/lang/**/strings.json" ],
                    "dist/www/sites/statistics/strings.json": [ "src/www/sites/statistics/lang/**/strings.json" ]
                }
            }
        },
        createMenu: {
            www: {
                options: {
                    order: [
                        'overview',
                        'maps',
                        'schedule',
                        'statistics',
                        'service',
                        'mail'
                    ]
                },
                files: {
                    "dist/www/app.js": [ "src/www/sites/*.js" ]
                }
            }
        },
        compress: {
            full: {
                options: {
                    archive: 'dist/hombot-interface_<%= pkg.version %>.zip'
                },
                files: [
                    {expand: true, cwd: 'dist/', src: ['**/*'], dest: '/'}
                ]
            }
        }
    });
    
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-sass');
    grunt.loadNpmTasks('grunt-merge-json');
    grunt.loadNpmTasks('grunt-contrib-compress');
    
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
                    fileName: fileName
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
    
    grunt.registerTask('build-dev', ['clean', 'sass', 'copy', 'concat', 'createMenu', 'merge-json']);
    grunt.registerTask('build-dist', ['clean', 'sass', 'copy', 'concat', 'createMenu', 'merge-json', 'uglify']);
    grunt.registerTask('build-release', ['build-dist', 'compress']);
};
