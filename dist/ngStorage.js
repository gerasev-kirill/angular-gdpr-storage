(function(root, factory) {
  'use strict';
  if (typeof define === 'function' && define.amd) {
    define(['angular'], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory(require('angular'));
  } else {
    // Browser globals (root is window), we don't register it.
    factory(root.angular);
  }
})(this, function(angular) {
  'use strict';
  var STORAGE_PREFIX, _storageFactory, decode, encode, getStorageKey, prefixLength;
  _storageFactory = function(storageType) {
    return [
      '$rootScope',
      '$window',
      '$log',
      '$timeout',
      function($rootScope,
      $window,
      $log,
      $timeout) {
        var $storage,
      _debounce,
      _last$storage,
      isStorageSupported,
      webStorage;
        _debounce = null;
        _last$storage = null;
        isStorageSupported = function(storageType) {
          var err,
      key,
      supported;
          // Some installations of IE, for an unknown reason, throw "SCRIPT5: Error: Access is denied"
          // when accessing window.localStorage. This happens before you try to do anything with it. Catch
          // that error and allow execution to continue.
          // fix 'SecurityError: DOM Exception 18' exception in Desktop Safari, Mobile Safari
          // when "Block cookies": "Always block" is turned on
          supported = void 0;
          try {
            supported = $window[storageType];
          } catch (error) {
            err = error;
            supported = false;
          }
          // When Safari (OS X or iOS) is in private browsing mode, it appears as though localStorage
          // is available, but trying to call .setItem throws an exception below:
          // "QUOTA_EXCEEDED_ERR: DOM Exception 22: An attempt was made to add something to storage that exceeded the quota."
          if (supported && storageType === 'localStorage') {
            key = '__' + Math.round(Math.random() * 1e7);
            try {
              supported.setItem(key,
      key);
              supported.removeItem(key);
            } catch (error) {
              err = error;
              supported = false;
            }
          }
          return supported;
        };
        // #9: Assign a placeholder object if Web Storage is unavailable to prevent breaking the entire AngularJS app
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
            var k,
      v;
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
            var $storageKey,
      i,
      k;
            i = webStorage.length;
            $storageKey = void 0;
            k = void 0;
            while (i--) {
              k = webStorage.key(i);
              $storageKey = getStorageKey(k);
              // #8, #10: `webStorage.key(i)` may be an empty string (or throw an exception in IE9 if `webStorage` is empty)
              k && STORAGE_PREFIX + $storageKey === k && ($storage[$storageKey] = decode(webStorage.getItem(k)));
            }
          },
          $apply: function() {
            var k,
      temp$storage,
      v;
            temp$storage = void 0;
            _debounce = null;
            if (!angular.equals($storage,
      _last$storage)) {
              temp$storage = angular.copy(_last$storage);
              for (k in $storage) {
                v = $storage[k];
                if (!(angular.isDefined(v) && k[0] !== '$')) {
                  continue;
                }
                webStorage.setItem(STORAGE_PREFIX + k,
      encode(v));
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
          _debounce || (_debounce = $timeout($storage.$apply,
      100,
      false));
        });
        // #6: Use `$window.addEventListener` instead of `angular.element` to avoid the jQuery-specific `event.originalEvent`
        $window.addEventListener('storage',
      function(event) {
          var $storageKey,
      key,
      newValue;
          key = event.key;
          newValue = event.newValue;
          $storageKey = void 0;
          if (!key) {
            return;
          }
          $storageKey = getStorageKey(key);
          if (key === STORAGE_PREFIX + $storageKey) {
            if (newValue) {
              ($storage[$storageKey] = decode(newValue));
            } else {
              delete $storage[$storageKey];
            }
            _last$storage = angular.copy($storage);
            if (!$rootScope.$$phase) {
              $rootScope.$apply();
            }
          }
        });
        $window.addEventListener('beforeunload',
      function(event) {
          $storage.$apply();
        },
      false);
        return $storage;
      }
    ];
  };
  STORAGE_PREFIX = 'ngStorage-';
  prefixLength = STORAGE_PREFIX.length;
  decode = angular.fromJson;
  encode = angular.toJson;
  getStorageKey = function(key) {
    return key.slice(prefixLength);
  };
  /**
   * @ngdoc overview
   * @name ngStorage
   */
  return angular.module('ngStorage', []).factory('$localStorage', _storageFactory('localStorage')).factory('$sessionStorage', _storageFactory('sessionStorage'));
});
