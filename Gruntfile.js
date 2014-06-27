module.exports = function (grunt) {
    require('load-grunt-tasks')(grunt);
 
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        connect: {
            server: {
                options: {
                    port: 8080,
                    base: './'
                }
            }
        },
        typescript: {
            base: {
                src: ['**/*.ts'],
                dest: 'apriori.js',
                options: {
                    module: 'amd',
                    target: 'es5',
                    sourceMap: true
                }
            }
        },
        jshint: {
            options: {
                jshintrc: true,
                reporter: require('jshint-stylish')
            },
            all: ['apriori.js', 'test/*.js']
        },
        watch: {
            files: '**/*.ts',
            tasks: ['typescript']
        },
        mochaTest: {
            test: {
                options: {
                    reporter: 'spec'
                },
                src: ['test/**/*.js']
            }
        },
        mocha_phantomjs: {
            all: ['index.html']
        },
        open: {
            dev: {
                path: 'http://localhost:8080/index.html'
            }
        },
        uglify: {
            my_target: {
                files: {
                    'apriori.min.js': ['apriori.js']
                }
            }
        },
        umd: {
            all: {
                src: 'apriori.js',
                objectToExport: 'Apriori',
                amdModuleId: 'apriori',
                globalAlias: 'Apriori'
            }
        }
    });

    grunt.registerTask('toJs',    ['typescript', 'umd', 'jshint']);
    grunt.registerTask('phantomJsTest', ['connect', 'mocha_phantomjs']);
    grunt.registerTask('test',    ['toJs', 'mochaTest', 'phantomJsTest']);
    grunt.registerTask('build',   ['toJs', 'mochaTest', 'uglify']);
    grunt.registerTask('default', ['toJs', 'connect', 'open', 'watch']);
 
}

