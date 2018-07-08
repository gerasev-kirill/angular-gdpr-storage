'use strict'

module.exports = (grunt) ->
    browsers = [
        'Chrome'
        'PhantomJS'
        'Firefox'
    ]
    if process.env.TRAVIS
        browsers = [ 'PhantomJS' ]

    jsTopWrapper = """
        (function(root, factory) {
          'use strict';
          if (typeof define === 'function' && define.amd) {
            define(['angular'], factory);
          } else if (typeof exports === 'object') {
            module.exports = factory(require('angular'));
          } else {
            factory(root.angular);
          }
        })(this, function(angular) {
        //-----------------------------------------

    """
    jsBottomWrapper = """

    //-----------------------------------------
    });
    """

    grunt.initConfig
        pkg: grunt.file.readJSON('package.json')
        coffee: all:
            options:
                bare: true
                sourceMap: true
            files:
                'dist/ngStorage.js': 'src/ngStorage.coffee'
                'test/spec.js': 'test/spec.coffee'
        karma:
            storages:
                options: files: [
                    'components/angular/angular.js'
                    'components/angular-mocks/angular-mocks.js'
                    'components/chai/chai.js'
                    'dist/ngStorage.js'
                    'test/spec.js'
                ]
                preprocessors: 'dist/*.js': [ 'sourcemap' ]
                frameworks: [ 'mocha' ]
                browsers: browsers
                singleRun: true
            gdpr:
                options: files: [
                    'components/angular/angular.js'
                    'components/angular-mocks/angular-mocks.js'
                    'components/chai/chai.js'
                    'dist/ngStorage.js'
                    'test/gdprSpec.js'
                ]
                preprocessors: 'dist/*.js': [ 'sourcemap' ]
                frameworks: [ 'mocha' ]
                browsers: browsers
                singleRun: true
        ngAnnotate: files:
            cwd: 'dist'
            expand: true
            src: [ './ngStorage.js' ]
            dest: 'dist'
        file_append: ngstorage: files: [ {
            prepend: jsTopWrapper
            append: jsBottomWrapper
            input: 'dist/ngStorage.js'
            output: 'dist/ngStorage.js'
        } ]
        uglify:
            options: banner: '/*! <%= pkg.name %> <%= pkg.version %> | Copyright (c) <%= grunt.template.today("yyyy") %> Gias Kay Lee | MIT License */\n'
            build:
                src: 'dist/ngStorage.js'
                dest: 'dist/ngStorage.min.js'


    grunt.loadNpmTasks 'grunt-karma'
    grunt.loadNpmTasks 'grunt-contrib-uglify'
    grunt.loadNpmTasks 'grunt-contrib-coffee'
    grunt.loadNpmTasks 'grunt-ng-annotate'
    grunt.loadNpmTasks 'grunt-file-append'

    grunt.registerTask 'test', [
        'coffee'
        'karma'
    ]
    grunt.registerTask 'build', [
        'coffee'
        'ngAnnotate'
        'file_append'
        'uglify'
    ]
    grunt.registerTask 'default', [
        'coffee'
        'test'
        'ngAnnotate'
        'uglify'
    ]
    return
