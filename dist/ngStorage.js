'use strict';
var GdprException, STORAGE_PREFIX, generateStorageFactory, getStorageKey, ngGdprStorage, ngLocalStorage, ngSessionStorage, rmNgGdprStorageWatch, rmNgLocalStorageWatch, rmNgSessionStorageWatch;

STORAGE_PREFIX = 'ngStorage-';

GdprException = function(message) {
  this.name = 'GdprException';
  this.message = message || '';
  return this;
};

GdprException.prototype = new Error();

GdprException.prototype.constructor = GdprException;

getStorageKey = function(key) {
  return key.slice(STORAGE_PREFIX.length);
};

generateStorageFactory = function($rootScope, $window, $log, $timeout, storageType, preferredStorageType, allowedKeysForGdpr) {
  var $storage, _debounce, _last$storage, getStorage;
  _debounce = null;
  _last$storage = null;
  allowedKeysForGdpr = allowedKeysForGdpr || {};
  getStorage = function(storageType) {
    var err, error, error1, key, supported;
    if (storageType === 'gdprStorage') {
      storageType = preferredStorageType;
    }
    supported = void 0;
    try {
      supported = $window[storageType];
    } catch (error) {
      err = error;
      supported = false;
    }
    if (supported && storageType === 'localStorage') {
      key = '__' + Math.round(Math.random() * 1e7);
      try {
        supported.setItem(key, key);
        supported.removeItem(key);
      } catch (error1) {
        err = error1;
        supported = false;
      }
    }
    if (!supported) {
      $log.warn('This browser does not support Web Storage!');
      return {
        setItem: angular.noop,
        getItem: angular.noop,
        removeItem: angular.noop,
        key: angular.noop
      };
    }
    return supported;
  };
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
      var k, webStorage;
      webStorage = getStorage(storageType);
      for (k in $storage) {
        if (!(k[0] !== '$')) {
          continue;
        }
        delete $storage[k];
        webStorage.removeItem(STORAGE_PREFIX + k);
      }
      return $storage.$default(items);
    },
    $sync: function() {
      var $storageKey, k, webStorage;
      webStorage = getStorage(storageType);
      for (k in webStorage) {
        if (!(k && k.indexOf(STORAGE_PREFIX) === 0)) {
          continue;
        }
        $storageKey = getStorageKey(k);
        if (storageType === 'gdprStorage' && !allowedKeysForGdpr[$storageKey]) {
          continue;
        }
        if (storageType === 'gdprStorage' && $storageKey === 'gdprPermission') {
          $storage.$setPermission(angular.fromJson(webStorage.getItem(k)));
        } else {
          $storage[$storageKey] = angular.fromJson(webStorage.getItem(k));
        }
      }
    },
    $apply: function() {
      var k, temp$storage, v, webStorage;
      _debounce = null;
      temp$storage = void 0;
      webStorage = getStorage(storageType);
      if (!angular.equals($storage, _last$storage)) {
        temp$storage = angular.copy(_last$storage);
        for (k in $storage) {
          v = $storage[k];
          if (!(angular.isDefined(v) && k[0] !== '$')) {
            continue;
          }
          if (storageType === 'gdprStorage' && !allowedKeysForGdpr[k]) {
            throw new GdprException("You can't assign key '" + k + "' for $gdprStorage! Please register key '" + k + "' inside config block with this: $gdprStorageProvider.registerKey('" + k + "')");
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
  if (storageType === 'gdprStorage') {
    $storage.gdprPermission = {
      app: false
    };
    $storage.$getAllowedKeys = function() {
      return angular.copy(allowedKeysForGdpr);
    };
    $storage.$setPermission = function(permission) {
      var $storageKey, k, newStorage, oldStorage, sType, v;
      permission = permission || {};
      permission.app = !!permission.app;
      if (permission.app) {
        sType = 'localStorage';
      } else {
        sType = 'sessionStorage';
      }
      $storage.gdprPermission = permission;
      oldStorage = getStorage(preferredStorageType);
      newStorage = getStorage(sType);
      newStorage.setItem(STORAGE_PREFIX + 'gdprPermission', angular.toJson(permission));
      if (sType === preferredStorageType) {
        return;
      }
      if (oldStorage) {
        for (k in oldStorage) {
          v = oldStorage[k];
          if (!(k && k.indexOf(STORAGE_PREFIX) === 0)) {
            continue;
          }
          if (k !== STORAGE_PREFIX + 'gdprPermission') {
            newStorage.setItem(k, v);
          }
          oldStorage.removeItem(k);
        }
      }
      for (k in newStorage) {
        if (!(k && k.indexOf(STORAGE_PREFIX) === 0)) {
          continue;
        }
        $storageKey = getStorageKey(k);
        $storage[$storageKey] = angular.fromJson(newStorage.getItem(k));
      }
      preferredStorageType = sType;
    };
  }
  $storage.$sync();
  _last$storage = angular.copy($storage);
  $window.addEventListener('storage', function(event) {
    var $storageKey;
    if (!event || !event.key || event.storageArea !== getStorage(storageType)) {
      return;
    }
    $storageKey = getStorageKey(event.key);
    if (event.key === STORAGE_PREFIX + $storageKey) {
      if (event.newValue) {
        $storage[$storageKey] = angular.fromJson(event.newValue);
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

ngLocalStorage = null;

ngSessionStorage = null;

ngGdprStorage = null;

rmNgLocalStorageWatch = null;

rmNgSessionStorageWatch = null;

rmNgGdprStorageWatch = null;


/**
 * @ngdoc overview
 * @name ngStorage
 */

angular.module('ngStorage', []).provider('ngStorage', function() {
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
}).service('$localStorage', ["$rootScope", "$window", "$log", "$timeout", function($rootScope, $window, $log, $timeout) {
  var _debounce;
  _debounce = null;
  if (!ngLocalStorage) {
    ngLocalStorage = generateStorageFactory($rootScope, $window, $log, $timeout, 'localStorage');
  } else {
    ngLocalStorage.$sync();
  }
  if (rmNgLocalStorageWatch) {
    rmNgLocalStorageWatch();
  }
  rmNgLocalStorageWatch = $rootScope.$watch(function() {
    if (!_debounce) {
      _debounce = $timeout(function() {
        return ngLocalStorage.$apply();
      }, 100, false);
    }
    return _debounce;
  });
  return ngLocalStorage;
}]).service('$sessionStorage', ["$rootScope", "$window", "$log", "$timeout", function($rootScope, $window, $log, $timeout) {
  var _debounce;
  _debounce = null;
  if (!ngSessionStorage) {
    ngSessionStorage = generateStorageFactory($rootScope, $window, $log, $timeout, 'sessionStorage');
  } else {
    ngSessionStorage.$sync();
  }
  if (rmNgSessionStorageWatch) {
    rmNgSessionStorageWatch();
  }
  rmNgSessionStorageWatch = $rootScope.$watch(function() {
    if (!_debounce) {
      _debounce = $timeout(function() {
        return ngSessionStorage.$apply();
      }, 100, false);
    }
    return _debounce;
  });
  return ngSessionStorage;
}]).provider('$gdprStorage', function() {
  var ALLOWED_KEYS;
  ALLOWED_KEYS = {};
  this.registerKey = function(key, options) {
    options = options || {};
    ALLOWED_KEYS[key] = options;
  };
  this.$get = ["$rootScope", "$window", "$log", "$timeout", function($rootScope, $window, $log, $timeout) {
    var _debounce, k, permission, preferredStorageType, value;
    _debounce = null;
    if (!ngGdprStorage) {
      if (!ngSessionStorage) {
        ngSessionStorage = generateStorageFactory($rootScope, $window, $log, $timeout, 'sessionStorage');
      } else {
        ngSessionStorage.$sync();
      }
      if (!ngLocalStorage) {
        ngLocalStorage = generateStorageFactory($rootScope, $window, $log, $timeout, 'localStorage');
      } else {
        ngLocalStorage.$sync();
      }
      permission = {
        app: false
      };
      if (angular.isObject(ngLocalStorage.gdprPermission)) {
        permission = ngLocalStorage.gdprPermission;
      } else if (angular.isObject(ngSessionStorage.gdprPermission)) {
        permission = ngSessionStorage.gdprPermission;
      }
      for (k in ALLOWED_KEYS) {
        value = '';
        if (ngSessionStorage[k]) {
          value = ngSessionStorage[k];
        }
        if (ngLocalStorage && ngLocalStorage[k]) {
          value = ngLocalStorage[k];
        }
        if (value === '') {
          continue;
        }
        if (permission.app) {
          ngLocalStorage[k] = value;
        } else {
          ngSessionStorage[k] = value;
        }
      }
      if (permission.app) {
        ngLocalStorage.$apply();
        preferredStorageType = 'localStorage';
      } else {
        ngSessionStorage.$apply();
        preferredStorageType = 'sessionStorage';
      }
      ngGdprStorage = generateStorageFactory($rootScope, $window, $log, $timeout, 'gdprStorage', preferredStorageType, ALLOWED_KEYS);
      ngGdprStorage.$setPermission(permission);
    } else {
      ngGdprStorage.$sync();
    }
    if (rmNgGdprStorageWatch) {
      rmNgGdprStorageWatch();
    }
    rmNgGdprStorageWatch = $rootScope.$watch(function() {
      if (!_debounce) {
        _debounce = $timeout(function() {
          return ngGdprStorage.$apply();
        }, 100, false);
      }
      return _debounce;
    });
    return ngGdprStorage;
  }];
  return this;
}).config(["$gdprStorageProvider", function($gdprStorageProvider) {
  return $gdprStorageProvider.registerKey('gdprPermission', {
    description: 'GDPR permission data for site'
  });
}]);

//# sourceMappingURL=ngStorage.js.map
