'use strict';

module.exports = function(grunt) {
    var browsers = [
        'Chrome',
        'PhantomJS',
        'Firefox'
    ];

    if (process.env.TRAVIS){
        browsers = ['PhantomJS'];
    }

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        coffee:{
            all:{
                options:{
                    bare: true,
                    sourceMap: true
                },
                files:{
                    'dist/ngStorage.js': 'src/ngStorage.coffee',
                    'test/spec.js': 'test/spec.coffee'
                }
            }
        },
        karma: {
            storages: {
                options: {
                    files: [
                        'components/angular/angular.js',
                        'components/angular-mocks/angular-mocks.js',
                        'components/chai/chai.js',
                        'dist/ngStorage.js',
                        'test/spec.js'
                    ]
                },
                preprocessors: {
                  'dist/*.js': ['sourcemap']
                },
                frameworks: ['mocha'],
                browsers: browsers,
                singleRun: true
            },
            gdpr: {
                options: {
                    files: [
                        'components/angular/angular.js',
                        'components/angular-mocks/angular-mocks.js',
                        'components/chai/chai.js',
                        'dist/ngStorage.js',
                        'test/gdprSpec.js'
                    ]
                },
                preprocessors: {
                  'dist/*.js': ['sourcemap']
                },
                frameworks: ['mocha'],
                browsers: browsers,
                singleRun: true
            }
        },

        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= pkg.version %> | Copyright (c) <%= grunt.template.today("yyyy") %> Gias Kay Lee | MIT License */\n'
            },

            build: {
                src: 'dist/ngStorage.js',
                dest: 'dist/ngStorage.min.js'
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-karma');
    grunt.loadNpmTasks('grunt-contrib-coffee');

    grunt.registerTask('test', ['coffee', 'karma']);

    grunt.registerTask('default', [
        'coffee',
        'test',
        'uglify'
    ]);
};
