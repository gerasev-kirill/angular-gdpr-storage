'use strict';

/* global describe, beforeEach, it, module, inject, expect, chai */

describe('ngStorage', function() {
    var expect = chai.expect,
        onlyOwnProps = function(obj){
            return JSON.parse(JSON.stringify(obj));
        };

    beforeEach(module('ngStorage'));


    var $window = {
        eventHandlers: {},
        addEventListener: function(event, handler) {
            this.eventHandlers[event] = this.eventHandlers[event] || [];
            this.eventHandlers[event].push(handler);
        }
    };
    $window.localStorage = window.localStorage;
    $window.sessionStorage = window.sessionStorage;




    beforeEach(function(){
        window.localStorage.clear();
        window.sessionStorage.clear();
        module(function($provide) {
            $provide.value('$window', $window);
        });
        module(function($gdprStorageProvider){
            $gdprStorageProvider.registerKey('string');
            $gdprStorageProvider.registerKey('number');
            $gdprStorageProvider.registerKey('bool');
            $gdprStorageProvider.registerKey('object');
            $gdprStorageProvider.registerKey('newKey');
        });
    });


    describe('$gdprStorage', function() {

        var $rootScope, storages = {}, $timeout, $gdprStorage;

        function initStorage(storageType, initialValues, storageType2, initialValues2) {
            for (var k in storages[storageType] || {}) {
                if (k[0] !== '$'){
                    delete storages[storageType][k];
                }
            }
            window[storageType].clear();
            for (var k in initialValues) {
                window[storageType].setItem(k, initialValues[k]);
            }
            for (var k in storages[storageType2] || {}) {
                if (k[0] !== '$'){
                    delete storages[storageType2][k];
                }
            }
            window[storageType2].clear();
            for (var k in initialValues2) {
                window[storageType2].setItem(k, initialValues2[k]);
            }

            inject(['$rootScope', '$' + storageType, '$' + storageType2, '$gdprStorage', '$timeout',
                function(_$rootScope_, _$storage1_, _$storage2_, _$gdprStorage_, _$timeout_) {
                    $rootScope = _$rootScope_;
                    storages[storageType] = _$storage1_;
                    storages[storageType2] = _$storage2_;
                    $gdprStorage = _$gdprStorage_;
                    $timeout = _$timeout_;
                }
            ]);
        }

        function expectStorageToContains(storageType, values, skipWrongStorage){
            var keys = Object.keys(values).sort();
            var storage = window[storageType];
            if (storageType === 'localStorage') {
                var wrongStorage = window.sessionStorage;
            } else {
                var wrongStorage = window.localStorage;
            }

            expect(Object.keys(storage).sort()).to.deep.equal(keys);
            if (!skipWrongStorage){
                expect(Object.keys(wrongStorage).sort()).not.to.deep.equal(keys);
            }
            for (var k in values) {
                expect(Object.keys(storage).indexOf(k) > -1).to.equal(true);
                expect(storage[k]).to.equal(values[k]);
                if (!skipWrongStorage){
                    expect(Object.keys(wrongStorage).indexOf(k) > -1).to.equal(false);
                }
            }
        }

        /*
        it('should, upon loading, contain a value for each ngStorage- key in window.localStorage', function() {

            initStorage('localStorage', {
                'ngStorage-gdprPermission': '{"app": true}',
                nonNgStorage: 'this should be ingored',
                'ngStorage-string': '"a string"',
                'ngStorage-number': '123',
                'ngStorage-bool': 'true',
                'ngStorage-object': '{"string":"a string", "number": 123, "bool": true}'
            }, 'sessionStorage', {});

            $gdprStorage.$sync();

            expect(onlyOwnProps($gdprStorage)).to.deep.equal({
                gdprPermission: {app: true},
                string: 'a string',
                number: 123,
                bool: true,
                object: { string:'a string', number: 123, bool: true }
            });
            expectStorageToContains('localStorage', {
                'ngStorage-gdprPermission': '{"app": true}',
                nonNgStorage: 'this should be ingored',
                'ngStorage-string': '"a string"',
                'ngStorage-number': '123',
                'ngStorage-bool': 'true',
                'ngStorage-object': '{"string":"a string", "number": 123, "bool": true}'
            });

            // now change storage type
            $gdprStorage.$setPermission({app: false});
            $rootScope.$digest();
            // it will trigger migration from localStorage to sessionStorage all data with prefix 'ngStorage-'
            expectStorageToContains('localStorage', {
                nonNgStorage: 'this should be ingored',
            });
            expectStorageToContains('sessionStorage', {
                'ngStorage-gdprPermission': '{"app": true}',
                'ngStorage-string': '"a string"',
                'ngStorage-number': '123',
                'ngStorage-bool': 'true',
                'ngStorage-object': '{"string":"a string", "number": 123, "bool": true}'
            });

        });
        */



        it('should, upon loading, contain a value for each ngStorage- key in window.localStorage AND window.sessionStorage', function() {

            initStorage('localStorage', {
                nonNgStorage: 'this should be ingored',
                'ngStorage-string': '"a string from localStorage"',
                'ngStorage-bool': 'true',
                'ngStorage-object': '{"string":"a string","number":123,"bool":true}'
            }, 'sessionStorage', {
                'ngStorage-gdprPermission': '{"app":false}',
                nonNgStorage: 'this should be ingored',
                'ngStorage-string': '"a string from sessionStorage"',
                'ngStorage-number': '-9999',
                'ngStorage-bool': 'true',
            });

            $gdprStorage.$sync();

            expect(onlyOwnProps($gdprStorage)).to.deep.equal({
                gdprPermission: {app: false},
                string: 'a string from localStorage', // from localStorage
                number: -9999, // from sessionStorage
                bool: true, // from any
                object: { string:'a string', number: 123, bool: true } // from any
            });
            expectStorageToContains('sessionStorage', {
                'ngStorage-gdprPermission': '{"app":false}',
                nonNgStorage: 'this should be ingored',
                'ngStorage-string': '"a string from localStorage"',
                'ngStorage-number': '-9999',
                'ngStorage-bool': 'true',
                'ngStorage-object': '{"string":"a string","number":123,"bool":true}'
            }, true);

            // now change storage type
            $gdprStorage.$setPermission({app: true});
            $rootScope.$digest();
            // it will trigger migration from localStorage to sessionStorage all data with prefix 'ngStorage-'
            expectStorageToContains('localStorage', {
                'ngStorage-gdprPermission': '{"app":true}',
                nonNgStorage: 'this should be ingored',
                'ngStorage-string': '"a string from localStorage"',
                'ngStorage-number': '-9999',
                'ngStorage-bool': 'true',
                'ngStorage-object': '{"string":"a string","number":123,"bool":true}'
            }, true);
            expectStorageToContains('sessionStorage', {
                nonNgStorage: 'this should be ingored',
            }, true);

        });



        it('should add a key to window.localStorage when a key is added to $gdprStorage', function(done) {

            $gdprStorage.$reset();
            initStorage('localStorage', {'ngStorage-gdprPermission': '{"app":true}'}, 'sessionStorage', {});
            $gdprStorage.newKey = 'some value';

            $rootScope.$digest();
            $timeout.flush();

            setTimeout(function() {
                expectStorageToContains('localStorage', {
                    'ngStorage-gdprPermission': '{"app":true}',
                    'ngStorage-newKey': '"some value"',
                }, true);
                expectStorageToContains('sessionStorage', {
                }, true);

                done();
            }, 125);

        });


        it('should update the associated key in window.localStorage when a key in $gdprStorage is updated', function(done) {

            $gdprStorage.$reset();
            initStorage('localStorage', {
                'ngStorage-gdprPermission': '{"app":true}',
                'ngStorage-string': '"update me"'
            }, 'sessionStorage', {});

            $gdprStorage.string = 'updated';

            $rootScope.$digest();
            $timeout.flush();

            setTimeout(function() {
                expect(onlyOwnProps($window.localStorage))
                    .to.deep.equal({'ngStorage-gdprPermission': '{"app":true}', 'ngStorage-string': '"updated"'});
                done();
            }, 125);

        });

        /*
        it('should delete the associated key from window.' + storageType + ' when a key in $' +
            storageType + ' is deleted', function(done) {

            initStorage({'ngStorage-existing': '"delete me"'});
            delete $storage.existing;
            $rootScope.$digest();

            $timeout.flush();

            setTimeout(function() {
                expect(onlyOwnProps($window[storageType])).to.deep.equal({});
                done();
            }, 125);

        });

        describe('when $reset is called with no arguments', function() {

            beforeEach(function(done) {

                initStorage({
                    nonNgStorage: 'this should not be changed',
                    'ngStorage-delete': '"this should be deleted"'
                });

                $storage.$reset();
                $rootScope.$digest();

                $timeout.flush();

                setTimeout(done, 125);
            });

            it('should delete all ngStorage- keys from window.' + storageType, function() {

                expect(onlyOwnProps($window[storageType])).to.deep.equal({
                    nonNgStorage: 'this should not be changed'
                });

            });

            it('should delete all keys from $' + storageType, function() {

                expect(onlyOwnProps($storage)).to.deep.equal({});

            });

        });

        describe('when $reset is called with an object', function() {

            beforeEach(function(done) {

                initStorage({
                    nonNgStorage: 'this should not be changed',
                    'ngStorage-delete': '"this should be deleted"'
                });

                $storage.$reset({some: 'value'});
                $rootScope.$digest();

                $timeout.flush();

                setTimeout(done, 125);
            });

            it('should reset the ngStorage- keys on window.' + storageType +
                ' to match the object', function() {

                expect(onlyOwnProps($window[storageType])).to.deep.equal({
                    nonNgStorage: 'this should not be changed',
                    'ngStorage-some': '"value"'
                });

            });

            it('should reset $' + storageType + ' to match the object', function() {

                expect(onlyOwnProps($storage)).to.deep.equal({some: 'value'});

            });

        });

        describe('when $default is called', function() {

            beforeEach(function(done) {

                initStorage({
                    nonNgStorage: 'this should not be changed',
                    'ngStorage-existing': '"this should not be replaced"'
                });

                $storage.$default({
                    existing: 'oops! replaced!',
                    'new': 'new value'
                });

                $rootScope.$digest();
                $timeout.flush();

                setTimeout(done, 125);
            });

            it('should should add any missing ngStorage- keys on window.' + storageType,
                function() {

                expect($window[storageType]['ngStorage-new'])
                    .to.equal('"new value"');

            });

            it('should should add any missing values to $' + storageType, function() {

                expect($storage['new']).to.equal('new value');

            });

            it('should should not modify any existing ngStorage- keys on window.' + storageType,
                function() {

                expect($window[storageType]['ngStorage-existing'])
                    .to.equal('"this should not be replaced"');

            });

            it('should should not modify any existing values on $' + storageType, function() {

                expect($storage['existing'])
                    .to.equal('this should not be replaced');

            });
        });



        describe('when an ngStorage- value in window.localStorage is updated', function() {

            beforeEach(function() {

                initStorage({'ngStorage-existing': '"update me"'});

                var updateEvent = {
                    key: 'ngStorage-existing',
                    newValue: '"updated"',
                    storageArea: window[storageType]
                };

                $window.eventHandlers.storage.forEach(function(cb){
                    cb(updateEvent);
                });
            });

            it('should reflect the update', function() {
                expect($storage.existing).to.equal('updated');
            });
        });

        describe('when an ngStorage- value in window.localStorage is added', function() {

            beforeEach(function() {

                initStorage({});

                var updateEvent = {
                    key: 'ngStorage-value',
                    newValue: '"new"',
                    storageArea: window[storageType]
                };
                $window.eventHandlers.storage.forEach(function(cb){
                    cb(updateEvent);
                });
            });

            it('should reflect the addition', function() {
                expect($storage.value).to.equal('new');
            });
        });

        describe('when an ngStorage- value in window.localStorage is deleted', function() {

            beforeEach(function() {

                initStorage({'ngStorage-existing': '"delete me"'});

                var updateEvent = {
                    key: 'ngStorage-existing',
                    storageArea: window[storageType]
                };
                $window.eventHandlers.storage.forEach(function(cb){
                    cb(updateEvent);
                });
            });

            it('should reflect the deletion', function() {
                expect($storage.existing).to.be.undefined;
            });
        });
        */

    });

});
