(function() {

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
    'use strict';

    var STORAGE_PREFIX, generateStorageFactory, getStorageKey, ngLocalStorage, ngSessionStorage;
    STORAGE_PREFIX = 'ngStorage-';
    ngLocalStorage = null;
    ngSessionStorage = null;
    getStorageKey = function(key) {
      return key.slice(STORAGE_PREFIX.length);
    };
    generateStorageFactory = function($rootScope, $window, $log, $timeout, storageType) {
      var $storage, isStorageSupported, webStorage, _debounce, _last$storage;
      _debounce = null;
      _last$storage = null;
      isStorageSupported = function(storageType) {
        var key, supported;
        supported = void 0;
        try {
          supported = $window[storageType];
        } catch (err) {
          supported = false;
        }
        if (supported && storageType === 'localStorage') {
          key = '__' + Math.round(Math.random() * 1e7);
          try {
            supported.setItem(key, key);
            supported.removeItem(key);
          } catch (err) {
            supported = false;
          }
        }
        return supported;
      };
      webStorage = isStorageSupported(storageType);
      if (!webStorage) {
        $log.warn('This browser does not support Web Storage!');
        webStorage = {
          setItem: angular.noop,
          getItem: angular.noop,
          removeItem: angular.noop,
          key: angular.noop
        };
      }
      $storage = {
        $default: function(items) {
          var k, v;
          for (k in items) {
            v = items[k];
            if (!angular.isDefined($storage[k])) {
              $storage[k] = v;
            }
          }
          $storage.$sync();
          return $storage;
        },
        $reset: function(items) {
          var k;
          for (k in $storage) {
            if (k[0] !== '$') {
              delete $storage[k];
              webStorage.removeItem(STORAGE_PREFIX + k);
            }
          }
          return $storage.$default(items);
        },
        $sync: function() {
          var $storageKey, i, k;
          i = webStorage.length;
          $storageKey = void 0;
          k = void 0;
          while (i--) {
            k = webStorage.key(i);
            $storageKey = getStorageKey(k);
            k && STORAGE_PREFIX + $storageKey === k && ($storage[$storageKey] = angular.fromJson(webStorage.getItem(k)));
          }
        },
        $apply: function() {
          var k, temp$storage, v;
          temp$storage = void 0;
          _debounce = null;
          if (!angular.equals($storage, _last$storage)) {
            temp$storage = angular.copy(_last$storage);
            for (k in $storage) {
              v = $storage[k];
              if (!(angular.isDefined(v) && k[0] !== '$')) {
                continue;
              }
              webStorage.setItem(STORAGE_PREFIX + k, angular.toJson(v));
              delete temp$storage[k];
            }
            for (k in temp$storage) {
              webStorage.removeItem(STORAGE_PREFIX + k);
            }
            _last$storage = angular.copy($storage);
          }
        }
      };
      $storage.$sync();
      _last$storage = angular.copy($storage);
      $rootScope.$watch(function() {
        _debounce || (_debounce = $timeout($storage.$apply, 100, false));
      });
      $window.addEventListener('storage', function(event) {
        var $storageKey, key, newValue;
        key = event.key;
        newValue = event.newValue;
        $storageKey = void 0;
        if (!key) {
          return;
        }
        $storageKey = getStorageKey(key);
        if (key === STORAGE_PREFIX + $storageKey) {
          if (newValue) {
            $storage[$storageKey] = angular.fromJson(newValue);
          } else {
            delete $storage[$storageKey];
          }
          _last$storage = angular.copy($storage);
          if (!$rootScope.$$phase) {
            $rootScope.$apply();
          }
        }
      });
      $window.addEventListener('beforeunload', function(event) {
        $storage.$apply();
      }, false);
      return $storage;
    };
    /**
    # @ngdoc overview
    # @name ngStorage
    */

    return angular.module('ngStorage', []).provider('ngStorage', function() {
      this.setPrefix = function(prefix) {
        STORAGE_PREFIX = prefix || '';
      };
      this.$get = function() {
        return {
          getPrefix: function() {
            return STORAGE_PREFIX;
          }
        };
      };
      return this;
    }).service('$localStorage', function($rootScope, $window, $log, $timeout) {
      ngLocalStorage = generateStorageFactory($rootScope, $window, $log, $timeout, 'localStorage');
      return ngLocalStorage;
    }).service('$sessionStorage', function($rootScope, $window, $log, $timeout) {
      ngSessionStorage = generateStorageFactory($rootScope, $window, $log, $timeout, 'sessionStorage');
      return ngSessionStorage;
    });
  });

}).call(this);
