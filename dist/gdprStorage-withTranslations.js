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
  var $storage, _debounce, _last$storage, fromJson, getStorage, signalState, toJson;
  _debounce = null;
  _last$storage = null;
  allowedKeysForGdpr = allowedKeysForGdpr || {};
  toJson = angular.toJson;
  fromJson = function(data) {
    var error, error1;
    try {
      return angular.fromJson(data);
    } catch (error1) {
      error = error1;
      return void 0;
    }
  };
  getStorage = (function() {
    var err, error1, error2, error3, key, localStorageSupported, sessionStorageSupported;
    try {
      sessionStorageSupported = $window['sessionStorage'];
    } catch (error1) {
      err = error1;
      sessionStorageSupported = false;
    }
    try {
      localStorageSupported = $window['localStorage'];
    } catch (error2) {
      err = error2;
      localStorageSupported = false;
    }
    if (localStorageSupported) {
      key = '__' + Math.round(Math.random() * 1e7);
      try {
        localStorageSupported.setItem(key, key);
        localStorageSupported.removeItem(key);
      } catch (error3) {
        err = error3;
        localStorageSupported = false;
      }
    }
    return function(storageType) {
      var storage;
      if (storageType === 'gdprStorage') {
        storageType = preferredStorageType;
      }
      storage = null;
      if (storageType === 'localStorage' && localStorageSupported) {
        storage = localStorageSupported;
      } else if (storageType === 'sessionStorage' && sessionStorageSupported) {
        storage = sessionStorageSupported;
      }
      if (!storage) {
        $log.warn('This browser does not support Web Storage!');
        return {
          setItem: angular.noop,
          getItem: angular.noop,
          removeItem: angular.noop,
          key: angular.noop
        };
      }
      return storage;
    };
  })();
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
      var $storageKey, k, value, webStorage;
      webStorage = getStorage(storageType);
      for (k in webStorage) {
        if (!(k && k.indexOf(STORAGE_PREFIX) === 0)) {
          continue;
        }
        $storageKey = getStorageKey(k);
        if (storageType === 'gdprStorage' && !allowedKeysForGdpr[$storageKey]) {
          continue;
        }
        value = fromJson(webStorage.getItem(k));
        if (storageType === 'gdprStorage' && $storageKey === 'gdprPermission') {
          $storage.$setPermission(value);
        } else {
          if (angular.isDefined(value)) {
            $storage[$storageKey] = value;
          } else {
            delete $storage[$storageKey];
          }
        }
      }
    },
    $apply: function(force) {
      var k, temp$storage, v, webStorage;
      _debounce = null;
      temp$storage = void 0;
      webStorage = getStorage(storageType);
      if (!angular.equals($storage, _last$storage) || force) {
        temp$storage = angular.copy(_last$storage);
        for (k in $storage) {
          v = $storage[k];
          if (!(angular.isDefined(v) && k[0] !== '$')) {
            continue;
          }
          if (storageType === 'gdprStorage' && !allowedKeysForGdpr[k]) {
            throw new GdprException("You can't assign key '" + k + "' for $gdprStorage! Please register key '" + k + "' inside config block with this: $gdprStorageProvider.registerKey('" + k + "')");
          }
          webStorage.setItem(STORAGE_PREFIX + k, toJson(v));
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
    signalState = 'none';
    $storage.$setPermission = function(permission) {
      var $storageKey, k, newStorage, oldStorage, sType, v, value;
      permission = permission || {};
      permission.app = !!permission.app;
      if (permission.app) {
        sType = 'localStorage';
      } else {
        sType = 'sessionStorage';
      }
      $storage.gdprPermission = permission;
      if (signalState === 'none') {
        $rootScope.$emit("storage.gdpr.init");
        signalState = 'init';
      } else {
        signalState = 'update';
        $rootScope.$emit("storage.gdpr.permissionUpdate");
      }
      oldStorage = getStorage(preferredStorageType);
      newStorage = getStorage(sType);
      newStorage.setItem(STORAGE_PREFIX + 'gdprPermission', toJson(permission));
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
        value = fromJson(newStorage.getItem(k));
        if (angular.isDefined(value)) {
          $storage[$storageKey] = value;
        }
      }
      preferredStorageType = sType;
    };
  }
  $storage.$sync();
  _last$storage = angular.copy($storage);
  $window.addEventListener('storage', function(event) {
    var $storageKey, value;
    if (!event || !event.key) {
      return;
    }
    $storageKey = getStorageKey(event.key);
    if (event.key !== (STORAGE_PREFIX + $storageKey) || event.storageArea !== getStorage(storageType)) {
      return;
    }
    value = fromJson(event.newValue);
    if (angular.isDefined(value)) {
      $storage[$storageKey] = value;
    } else {
      delete $storage[$storageKey];
    }
    _last$storage = angular.copy($storage);
    if (!$rootScope.$$phase) {
      $rootScope.$apply();
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
 * @name gdpr.storage
 */

angular.module('storage.gdpr', []).provider('storageSettings', function() {
  var storageSettings, thirdPartyLiterals;
  storageSettings = null;
  thirdPartyLiterals = {};
  this.setPrefix = function(prefix) {
    STORAGE_PREFIX = prefix || '';
  };
  this.registerThirdPartyServiceLiteral = function(literalName, config) {
    thirdPartyLiterals[literalName] = config || [];
  };
  this.$get = function() {
    if (!storageSettings) {
      storageSettings = {
        defaultAllowAll: false,
        isBannerVisible: false,
        thirdPartyServices: [],
        getPrefix: function() {
          return STORAGE_PREFIX;
        },
        setBannerVisibility: function(visibility) {
          storageSettings.isBannerVisible = visibility === true || visibility === 'visible';
        },
        getThirdPartyLiterals: function() {
          return angular.copy(thirdPartyLiterals);
        }
      };
    }
    return storageSettings;
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

angular.module('storage.gdpr').directive('gdprRequestPermissionBanner', function() {
  return {
    restrict: 'E',
    scope: {
      defaultAllowAll: '@?'
    },
    controller: ["$scope", "$element", "$gdprStorage", "storageSettings", function($scope, $element, $gdprStorage, storageSettings) {
      $scope.storageSettings = storageSettings;
      if (!$gdprStorage.gdprPermission.app) {
        storageSettings.setBannerVisibility(true);
      }
      storageSettings.defaultAllowAll = $scope.defaultAllowAll === 'true';
      return $scope.$watch('storageSettings.isBannerVisible', function(isVisible) {
        if (isVisible) {
          $element.addClass('visible');
        } else {
          $element.removeClass('visible');
        }
      });
    }],
    template: ('/src/gdprRequestPermissionBanner.html', '\n<div class="container" ng-if="storageSettings.isBannerVisible">\n  <gdpr-request-permission-area></gdpr-request-permission-area>\n</div>' + '')
  };
}).directive('gdprRequestPermissionArea', function() {
  return {
    restrict: 'E',
    scope: {},
    controller: ["$scope", "$rootScope", "$timeout", "$gdprStorage", "storageSettings", function($scope, $rootScope, $timeout, $gdprStorage, storageSettings) {
      var appCookies, key, options, ref;
      $scope.storageSettings = storageSettings;
      $scope.options = {
        permission: angular.copy($gdprStorage.gdprPermission),
        isDetailsVisible: false,
        activeTab: 0
      };
      appCookies = [];
      ref = $gdprStorage.$getAllowedKeys();
      for (key in ref) {
        options = ref[key];
        appCookies.push({
          key: key,
          provider: options.provider || 'This site',
          purpose: options.purpose || 'Settings',
          expiry: options.expiry || 'Never',
          type: options.type || 'Value in localStorage'
        });
      }
      $scope.$watchCollection('storageSettings.thirdPartyServices', function(thirdPartyServices, oldValue) {
        var i, j, len, len1, literals, ref1, ref2, s;
        $scope.SERVICES = [
          {
            type: 'app',
            name: 'Site settings',
            cookies: appCookies
          }
        ];
        literals = storageSettings.getThirdPartyLiterals();
        ref1 = thirdPartyServices || [];
        for (i = 0, len = ref1.length; i < len; i++) {
          s = ref1[i];
          if (angular.isString(s) && literals[s]) {
            $scope.SERVICES.push(literals[s]);
          } else if (angular.isObject(s)) {
            $scope.SERVICES.push(s);
          }
        }
        if (storageSettings.defaultAllowAll) {
          ref2 = $scope.SERVICES;
          for (j = 0, len1 = ref2.length; j < len1; j++) {
            s = ref2[j];
            $scope.options.permission[s.type] = true;
          }
        }
      });
      $rootScope.$on('storage.gdpr.update', function() {
        $scope.options.permission = angular.copy($gdprStorage.gdprPermission);
      });
      $scope.onCancel = function() {
        var k;
        for (k in $scope.options.permission) {
          $scope.options.permission[k] = false;
        }
        $gdprStorage.$setPermission($scope.options.permission);
        storageSettings.setBannerVisibility(false);
      };
      $scope.onAccept = function() {
        $gdprStorage.$setPermission($scope.options.permission);
        storageSettings.setBannerVisibility(false);
        $rootScope.$emit('storage.gdpr.userPermissionAccept');
      };
      $scope.onAcceptAll = function() {
        var i, len, ref1, service;
        ref1 = $scope.SERVICES || [];
        for (i = 0, len = ref1.length; i < len; i++) {
          service = ref1[i];
          $scope.options.permission[service.type] = true;
        }
        $timeout($scope.onAccept, 900);
      };
      $scope.toggleDetails = function() {
        return $scope.options.isDetailsVisible = !$scope.options.isDetailsVisible;
      };
    }],
    template: ('/src/gdprRequestPermissionArea.html', '\n<table class="gdpr-request-permission-area-content">\n  <tbody>\n    <tr>\n      <td>\n        <h5><b translate="">This website uses cookies and local storage</b></h5>\n        <p class="gdpr-text"><span translate="">We use cookies to personalise content and ads, to provide social media features and to analyse our traffic. You should consent to our cookies if you continue to use our website.</span><span> </span><a ng-click="toggleDetails()" ng-switch="options.isDetailsVisible"><span translate="" ng-switch-when="true">Hide details</span><span translate="" ng-switch-when="false">Show details about cookies and local storage</span></a></p>\n        <div class="gdpr-request-permission-area-content-checkboxes">\n          <div class="checkbox-inline" ng-repeat="service in SERVICES">\n            <label>\n              <input type="checkbox" ng-model="options.permission[service.type]"/><span> </span><span>{{service.name | translate}}</span>\n            </label>\n          </div>\n        </div>\n        <div class="gdpr-request-permission-area-content-details" ng-if="options.isDetailsVisible">\n          <uib-tabset class="uib-tabset-sm" active="options.activeTab">\n            <uib-tab ng-repeat="service in SERVICES" index="$index" heading="{{service.name | translate}}">\n              <p class="gdpr-text" ng-if="service.description">{{service.description | translate}}</p>\n              <table class="table table-striped table-bordered table-condensed">\n                <thead>\n                  <tr>\n                    <th class="gdpr-text" translate="">Name</th>\n                    <th class="gdpr-text" translate="">Provider</th>\n                    <th class="gdpr-text" translate="">Purpose</th>\n                    <th class="gdpr-text" translate="">Expiry</th>\n                    <th class="gdpr-text" translate="">Type</th>\n                  </tr>\n                </thead>\n                <tbody>\n                  <tr ng-repeat="cookie in service.cookies">\n                    <td class="gdpr-text">{{cookie.key}}</td>\n                    <td class="gdpr-text">{{cookie.provider | translate}}</td>\n                    <td class="gdpr-text">{{cookie.purpose | translate}}</td>\n                    <td class="gdpr-text">{{cookie.expiry | translate}}</td>\n                    <td class="gdpr-text">{{cookie.type | translate}}</td>\n                  </tr>\n                </tbody>\n              </table>\n            </uib-tab>\n          </uib-tabset>\n        </div>\n      </td>\n      <td class="gdpr-request-permission-area-content-btns hidden-xs hidden-sm" ng-switch="!!storageSettings.defaultAllowAll">\n        <table ng-switch-when="false">\n          <body>\n            <tr>\n              <td>\n                <button class="btn btn-default btn-xs btn-block" translate="" ng-click="onAccept()" translate-context="Accept cookies">Accept</button>\n              </td>\n              <td class="btn-separator"></td>\n              <td>\n                <button class="btn btn-default btn-xs btn-block" ng-click="onCancel()"><span class="fa fa-times"></span><span translate="" translate-context="Deny cookies">Deny</span></button>\n              </td>\n            </tr>\n            <tr>\n              <td colspan="3">\n                <button class="btn btn-success btn-xs btn-block" ng-click="onAcceptAll()"><span class="fa fa-check"></span><span translate="" translate-context="Accept all cookies">Accept all</span>\n                  <body ng-switch-when="false"></body>\n                </button>\n              </td>\n            </tr>\n          </body>\n        </table>\n        <table ng-switch-when="true">\n          <body>\n            <tr>\n              <td>\n                <button class="btn btn-success btn-xs btn-block" ng-click="onAccept()"><span class="fa fa-check"></span><span translate="" translate-context="Accept cookies">Accept</span></button>\n              </td>\n            </tr>\n            <tr>\n              <td>\n                <button class="btn btn-default btn-xs btn-block" ng-click="onCancel()"><span class="fa fa-times"></span><span translate="" translate-context="Deny cookies">Deny</span></button>\n              </td>\n            </tr>\n          </body>\n        </table>\n      </td>\n    </tr>\n    <tr class="gdpr-request-permission-area-content-btns visible-xs visible-sm">\n      <td class="text-center" colspan="2">\n        <div class="btn-group">\n          <button class="btn btn-default btn-xs" ng-click="onAccept()" ng-class="{\'btn-success\': storageSettings.defaultAllowAll}"><span class="fa fa-check" ng-show="storageSettings.defaultAllowAll"></span><span translate="" translate-context="Accept cookies">Accept</span></button>\n          <button class="btn btn-success btn-xs" ng-click="onAcceptAll()" ng-hide="storageSettings.defaultAllowAll"><span class="fa fa-check"></span><span translate="" translate-context="Accept all cookies">Accept all</span></button>\n          <button class="btn btn-default btn-xs" ng-click="onCancel()"><span class="fa fa-times"></span><span translate="" translate-context="Deny cookies">Deny</span></button>\n        </div>\n      </td>\n    </tr>\n  </tbody>\n</table>' + '')
  };
});

angular.module('storage.gdpr').config(["storageSettingsProvider", function(storageSettingsProvider) {
  var GA, jivosite, yandexMetrica;
  GA = [
    {
      key: '_ga',
      provider: 'google.com',
      purpose: 'Used to distinguish users',
      expiry: '2 years',
      type: 'HTTP cookie'
    }, {
      key: '_gid',
      provider: 'google.com',
      purpose: '24 hours',
      expiry: 'Used to distinguish users',
      type: 'HTTP cookie'
    }, {
      key: '_gat',
      provider: 'google.com',
      purpose: 'Used to throttle request rate. If Google Analytics is deployed via Google Tag Manager, this cookie will be named _dc_gtm_<property-id>',
      expiry: '1 minute',
      type: 'HTTP cookie'
    }, {
      key: 'AMP_TOKEN',
      provider: 'google.com',
      purpose: 'Contains a token that can be used to retrieve a Client ID from AMP Client ID service. Other possible values indicate opt-out, inflight request or an error retrieving a Client ID from AMP Client ID service',
      expiry: '30 seconds to 1 year',
      type: 'HTTP cookie'
    }, {
      key: '_gac_<property-id>',
      provider: 'google.com',
      purpose: 'Contains campaign related information for the user',
      expiry: '90 days',
      type: 'HTTP cookie'
    }, {
      key: '__utma',
      provider: 'google.com',
      purpose: 'Used to distinguish users and sessions. The cookie is created when the javascript library executes and no existing __utma cookies exists. The cookie is updated every time data is sent to Google Analytics',
      expiry: '2 years from set/update',
      type: 'HTTP cookie'
    }, {
      key: '__utmt',
      provider: 'google.com',
      purpose: 'Used to throttle request rate',
      expiry: '10 minutes',
      type: 'HTTP cookie'
    }, {
      key: '__utmb',
      provider: 'google.com',
      purpose: 'Used to determine new sessions/visits. The cookie is created when the javascript library executes and no existing __utmb cookies exists. The cookie is updated every time data is sent to Google Analytics',
      expiry: '30 mins from set/update',
      type: 'HTTP cookie'
    }, {
      key: '__utmz',
      provider: 'google.com',
      purpose: 'Stores the traffic source or campaign that explains how the user reached your site. The cookie is created when the javascript library executes and is updated every time data is sent to Google Analytics',
      expiry: '6 months from set/update',
      type: 'HTTP cookie'
    }, {
      key: '__utmv',
      provider: 'google.com',
      purpose: 'Used to store visitor-level custom variable data',
      expiry: '2 years from set/update',
      type: 'HTTP cookie'
    }, {
      key: '__utmx',
      provider: 'google.com',
      purpose: "Used to determine a user's inclusion in an experiment",
      expiry: '18 months',
      type: 'HTTP cookie'
    }, {
      key: '__utmxx',
      provider: 'google.com',
      purpose: 'Used to determine the expiry of experiments a user has been included in',
      expiry: '18 months',
      type: 'HTTP cookie'
    }, {
      key: '_gaexp',
      provider: 'google.com',
      purpose: "Used to determine a user's inclusion in an experiment and the expiry of experiments a user has been included in",
      expiry: 'Depends on the length of the experiment but typically 90 days',
      type: 'HTTP cookie'
    }
  ];
  jivosite = [
    {
      key: 'jv_enter_ts_${jivo_visitor_id}',
      provider: 'jivochat.com',
      purpose: 'First visit to the website',
      expiry: '12 hours from set/update',
      type: 'HTTP cookie'
    }, {
      key: 'jv_visits_count_${jivo_visitor_id}',
      provider: 'jivochat.com',
      purpose: 'Number of visits to the website',
      expiry: '12 hours from set/update',
      type: 'HTTP cookie'
    }, {
      key: 'jv_pages_count_${jivo_visitor_id}',
      provider: 'jivochat.com',
      purpose: 'Number of pages viewed',
      expiry: '12 hours from set/update',
      type: 'HTTP cookie'
    }, {
      key: 'jv_refer_${jivo_visitor_id}',
      provider: 'jivochat.com',
      purpose: 'Source of entry to the website',
      expiry: '12 hours from set/update',
      type: 'HTTP cookie'
    }, {
      key: 'jv_utm_${jivo_visitor_id}',
      provider: 'jivochat.com',
      purpose: 'ID of the marketing campaign of the visit',
      expiry: '12 hours from set/update',
      type: 'HTTP cookie'
    }, {
      key: 'jv_invitation_time_${jivo_visitor_id}',
      provider: 'jivochat.com',
      purpose: 'Time of appearance of proactive invitation',
      expiry: '12 hours from set/update',
      type: 'HTTP cookie'
    }, {
      key: 'jv_country_${jivo_visitor_id}',
      provider: 'jivochat.com',
      purpose: 'Country of the visitor',
      expiry: '12 hours from set/update',
      type: 'HTTP cookie'
    }, {
      key: 'jv_city_${jivo_visitor_id}',
      provider: 'jivochat.com',
      purpose: 'City of the visitor',
      expiry: '12 hours from set/update',
      type: 'HTTP cookie'
    }, {
      key: 'jv_close_time_${jivo_visitor_id}',
      provider: 'jivochat.com',
      purpose: 'Time the widget was closed',
      expiry: '12 hours from set/update',
      type: 'HTTP cookie'
    }, {
      key: 'jv_cw_timer_${jivo_visitor_id}',
      provider: 'jivochat.com',
      purpose: 'Time the callback request was initiated',
      expiry: '12 hours from set/update',
      type: 'HTTP cookie'
    }, {
      key: 'jv_callback_ping_response_${jivo_visitor_id}',
      provider: 'jivochat.com',
      purpose: 'Cash of callback backend script response',
      expiry: '12 hours from set/update',
      type: 'HTTP cookie'
    }, {
      key: 'jv_use_lp_${jivo_visitor_id}',
      provider: 'jivochat.com',
      purpose: 'Flag that enables long_pooling',
      expiry: '12 hours from set/update',
      type: 'HTTP cookie'
    }, {
      key: 'jv_mframe_protected_${jivo_visitor_id}',
      provider: 'jivochat.com',
      purpose: 'Indication if iframe is forbidden',
      expiry: '12 hours from set/update',
      type: 'HTTP cookie'
    }, {
      key: 'jv_ab_test_group_${jivo_visitor_id}',
      provider: 'jivochat.com',
      purpose: 'a/b testing group flag',
      expiry: '12 hours from set/update',
      type: 'HTTP cookie'
    }
  ];
  yandexMetrica = [
    {
      key: '_ym_isad',
      provider: 'yandex.com',
      purpose: 'Used to determine if a visitor has ad blockers',
      expiry: '2 days',
      type: 'HTTP cookie'
    }, {
      key: '_ym_uid',
      provider: 'yandex.com',
      purpose: 'Used for identifying site users',
      expiry: '1 year',
      type: 'HTTP cookie'
    }, {
      key: '_ym_d',
      provider: 'yandex.com',
      purpose: "Date of the user's first site session",
      expiry: '1 year',
      type: 'HTTP cookie'
    }, {
      key: 'yabs-sid',
      provider: 'yandex.com',
      purpose: 'Session ID',
      expiry: 'Until the session ends',
      type: 'HTTP cookie'
    }, {
      key: '_ym_debug',
      provider: 'yandex.com',
      purpose: 'Indicates that debug mode is active',
      expiry: 'Until the session ends',
      type: 'HTTP cookie'
    }, {
      key: '_ym_mp2_substs',
      provider: 'yandex.com',
      purpose: 'Used for Target Call',
      expiry: 'Until the session ends',
      type: 'HTTP cookie'
    }, {
      key: 'i',
      provider: 'yandex.com',
      purpose: 'Used for identifying site users',
      expiry: '1 year',
      type: 'HTTP cookie'
    }, {
      key: 'yandexuid',
      provider: 'yandex.com',
      purpose: 'Used for identifying site users',
      expiry: '1 year',
      type: 'HTTP cookie'
    }, {
      key: 'usst',
      provider: 'yandex.com',
      purpose: 'Stores auxiliary information for syncing site user IDs between different Yandex domains',
      expiry: '1 year',
      type: 'HTTP cookie'
    }, {
      key: '_ym_visorc_*',
      provider: 'yandex.com',
      purpose: 'Allows Session Replay to function correctly',
      expiry: '30 minutes',
      type: 'HTTP cookie'
    }, {
      key: '_ym_hostIndex',
      provider: 'yandex.com',
      purpose: 'Limits the number of requests',
      expiry: '1 day',
      type: 'HTTP cookie'
    }, {
      key: '_ym_mp2_track',
      provider: 'yandex.com',
      purpose: 'Used for Target Call',
      expiry: '30 days',
      type: 'HTTP cookie'
    }, {
      key: 'zz',
      provider: 'yandex.com',
      purpose: 'Used for identifying site users',
      expiry: '90 days',
      type: 'HTTP cookie'
    }
  ];
  storageSettingsProvider.registerThirdPartyServiceLiteral('googleAnalytics', {
    type: 'googleAnalytics',
    name: 'Google Analytics',
    cookies: GA
  });
  storageSettingsProvider.registerThirdPartyServiceLiteral('googleTagManager', {
    type: 'googleTagManager',
    name: 'Google Tag Manager',
    cookies: GA
  });
  storageSettingsProvider.registerThirdPartyServiceLiteral('jivosite', {
    type: 'jivosite',
    name: 'Jivochat',
    cookies: jivosite
  });
  storageSettingsProvider.registerThirdPartyServiceLiteral('yandexMetrica', {
    type: 'yandexMetrica',
    name: 'Yandex Metrica',
    cookies: yandexMetrica
  });
}]);

angular.module('storage.gdpr').run(['gettextCatalog', function (gettextCatalog) {
/* jshint -W100 */
    gettextCatalog.setStrings('cz', {"Accept":{"Accept cookies":"Akceptovat"},"Accept all":{"Accept all cookies":"Přijmout vše"},"Deny":{"Deny cookies":"Zrušit cookies"},"Expiry":"Uplynutí","GDPR permission data for site":"Údaje o oprávnění GDPR pro web","Hide details":"Skrýt detaily","Local storage":"Místní (local) úložiště","Name":"Jméno","Never":"Nikdy","Provider":"Poskytovatel","Purpose":"Účel","Settings":"Nastavení","Show details about cookies and local storage":"Zobrazit podrobnosti o souborech cookie a místním úložišti","Site settings":"Nastavení webu","This site":"Tento web","This website uses cookies and local storage":"Tento web používá soubory cookie a místní úložiště","Type":"Typ","Value in localStorage":"Hodnota v localStorage","We use cookies to personalise content and ads, to provide social media features and to analyse our traffic. You should consent to our cookies if you continue to use our website":"Cookies používáme k přizpůsobení obsahu a reklam, k poskytování funkcí sociálních médií a k analýze provozu. Pokud budete pokračovat v používání našich webových stránek, měli byste souhlasit s našimi soubory cookie"});
    gettextCatalog.setStrings('ru', {"Accept":{"Accept cookies":"Принять"},"Accept all":{"Accept all cookies":"Принять все"},"Deny":{"Deny cookies":"Отказаться"},"Expiry":"Истечение срока","GDPR permission data for site":"GDPR разрешение для сайта","Hide details":"Скрыть детали","Local storage":"Местное хранилище (localStorage)","Name":"Название","Never":"Никогда","Provider":"Провайдер","Purpose":"Назначение","Settings":"Настройки","Show details about cookies and local storage":"Показать детали о cookies и localStorage","Site settings":"Настройки сайта","This site":"Этот сайт","This website uses cookies and local storage":"Этот веб-сайт использует cookies и localStorage","Type":"Тип","Value in localStorage":"Значение в localStorage","We use cookies to personalise content and ads, to provide social media features and to analyse our traffic. You should consent to our cookies if you continue to use our website":"Мы используем файлы cookie для персонализации контента и рекламы, предоставления функций социальных сетей и анализа трафика. Вы должны согласиться на использование cookie, если вы желаете использовать наш веб-сайт"});
    gettextCatalog.setStrings('cz', {"1 minute":"1 minuta","10 minutes":"10 minut","12 hours from set/update":"12 hodin od nastavení / aktualizace","18 months":"8 měsíců","2 years":"2 roky","2 years from set/update":"2 roky od nastavení / aktualizace","24 hours":"24 hodiny","30 mins from set/update":"30 minut from set/update","30 seconds to 1 year":"30 sekund až 1 rok","6 months from set/update":"6 měsíců od nastavení / aktualizace","90 days":"90 dní","Cash of callback backend script response":"Cash callback odpovědi backend skriptu","City of the visitor":"Město návštěvníka","Contains a token that can be used to retrieve a Client ID from AMP Client ID service. Other possible values indicate opt-out, inflight request or an error retrieving a Client ID from AMP Client ID service":"Obsahuje token, který lze použít k načtení ID klienta z služby AMP Client ID. Jiné možné hodnoty označují opt-out, inflight request nebo chybu načítání ID klienta z služby AMP Client ID","Contains campaign related information for the user":"Obsahuje informace o kampani pro uživatele","Country of the visitor":"Země návštěvníka","Depends on the length of the experiment but typically 90 days":"Závisí na délce experimentu, ale obvykle 90 dnů","First visit to the website":"První návštěva webové stránky","Flag that enables long_pooling":"Flag, který umožňuje long_pooling","ID of the marketing campaign of the visit":"ID marketingové kampaně","Indication if iframe is forbidden":"Údaj, zda iframe je zakázán","Number of pages viewed":"Počet navštívených stránek","Number of visits to the website":"Počet návštěv na webu","Source of entry to the website":"Zdroj vstupu na web","Stores the traffic source or campaign that explains how the user reached your site. The cookie is created when the javascript library executes and is updated every time data is sent to Google Analytics":"Uchovává zdroj nebo kampaň, která vysvětluje, jak se uživatel dostal na váš web. Soubor cookie je vytvořen při spuštění knihovny javascript a je aktualizován při každém odeslání dat do služby Google Analytics","Time of appearance of proactive invitation":"Čas vzniku proaktivní pozvánky","Time the callback request was initiated":"Čas, kdy byl spuštěn callback request","Time the widget was closed":"Čas, kdy byl widget uzavřen","Used to determine a user's inclusion in an experiment":"Používá se k určení zařazení uživatele do experimentu","Used to determine a user's inclusion in an experiment and the expiry of experiments a user has been included in":"Používá se k určení zařazení uživatele do experimentu a ukončení experimentů, do kterých byl uživatel zařazen","Used to determine new sessions/visits. The cookie is created when the javascript library executes and no existing __utmb cookies exists. The cookie is updated every time data is sent to Google Analytics":"Používá se k určení nových sessions / návštěv. Soubor cookie je vytvořen při spuštění knihovny javascript a neexistují žádné existující cookies __utmb. Soubor cookie je aktualizován při každém odeslání dat do služby Google Analytics","Used to determine the expiry of experiments a user has been included in":"Používá se k určení ukončení experimentů, do kterých byl uživatel zařazen","Used to distinguish users":"Slouží k rozlišení uživatelů","Used to distinguish users and sessions. The cookie is created when the javascript library executes and no existing __utma cookies exists. The cookie is updated every time data is sent to Google Analytics":"Slouží k rozlišení uživatelů a relací. Soubor cookie je vytvořen při spuštění knihovny javascript a neexistují žádné existující cookies __utma. Soubor cookie je aktualizován při každém odeslání dat do služby Google Analytics","Used to store visitor-level custom variable data":"Slouží k ukládání vlastních proměnných na úrovni návštěvníka","Used to throttle request rate":"Omezuje frekvenci požadavků","Used to throttle request rate. If Google Analytics is deployed via Google Tag Manager, this cookie will be named _dc_gtm_%property-id%":"Omezuje frekvenci požadavků, pokud je služba Google Analytics nasazena prostřednictvím Google Tag Manager, tento soubor cookie bude pojmenován _dc_gtm_%property-id%","a/b testing group flag":"flag a/b testovací skupiny"});
    gettextCatalog.setStrings('ru', {"1 day":"1 день","1 minute":"1 минута","1 year":"1 год","10 minutes":"10 минут","12 hours from set/update":"12 часов с момента установки или обновления","18 months":"18 месяцев","2 days":"2 дня","2 years":"2 года","2 years from set/update":"2 года с момента установки или обновления","24 hours":"24 часа","30 days":"30 дней","30 mins from set/update":"30 минут с момента установки или обновления","30 minutes":"30 минут","30 seconds to 1 year":"от 30 сек до 1 года","6 months from set/update":"6 месяцев с момента установки или обновления","90 days":"90 дней","Cash of callback backend script response":"Кеш ответа callback-скрипта","City of the visitor":"Город посетителя","Contains a token that can be used to retrieve a Client ID from AMP Client ID service. Other possible values indicate opt-out, inflight request or an error retrieving a Client ID from AMP Client ID service":"Содержит токен, с помощью которого можно получить Client ID от сервиса AMP. Другие возможные значения: отключение функции, активный запрос или ошибка получения Client ID от сервиса AMP","Contains campaign related information for the user":"Содержит информацию о кампании для пользователя","Country of the visitor":"Страна посетителя","Depends on the length of the experiment but typically 90 days":"Зависит от длительности эксперимента (обычно составляет 90 дней)","First visit to the website":"Первый визит на сайт","Flag that enables long_pooling":"Флажок, который включает long_pooling","ID of the marketing campaign of the visit":"ID маркетинговой кампании посещения","Indication if iframe is forbidden":"Индикатор запрета iframe","Number of pages viewed":"Количество просмотренных страниц","Number of visits to the website":"Количество посещений сайта","Source of entry to the website":"Источник входа на сайт","Stores the traffic source or campaign that explains how the user reached your site. The cookie is created when the javascript library executes and is updated every time data is sent to Google Analytics":"Сохраняет информацию об источнике трафика или кампании, позволяющую понять, откуда пользователь пришел на ваш сайт. Создается при выполнении библиотеки и обновляется при каждой отправке данных в Google Analytics","Time of appearance of proactive invitation":"Время появления активного приглашения","Time the callback request was initiated":"Время инициирования callback запроса","Time the widget was closed":"Время закрытия виджета","Used to determine a user's inclusion in an experiment":"Определяет, принимал ли пользователь участие в эксперименте","Used to determine a user's inclusion in an experiment and the expiry of experiments a user has been included in":"Определяет, когда истекает срок эксперимента и принимал ли пользователь в нем участие","Used to determine new sessions/visits. The cookie is created when the javascript library executes and no existing __utmb cookies exists. The cookie is updated every time data is sent to Google Analytics":"Используется для определения новых сеансов или посещений. Создается при выполнении библиотеки JavaScript, если нет существующих файлов cookie __utmb. Обновляется при каждой отправке данных в Google Analytics","Used to determine the expiry of experiments a user has been included in":"Определяет, когда истекает срок действия эксперимента, в котором участвовал пользователь","Used to distinguish users":"Позволяет различать пользователей","Used to distinguish users and sessions. The cookie is created when the javascript library executes and no existing __utma cookies exists. The cookie is updated every time data is sent to Google Analytics":"Позволяет различать пользователей и сеансы. Создается при выполнении библиотеки JavaScript, если нет существующих файлов cookie __utma. Обновляется при каждой отправке данных в Google Analytics","Used to store visitor-level custom variable data":"Сохраняет данные о пользовательской переменной уровня посетителя","Used to throttle request rate":"Ограничивает частоту запросов","Used to throttle request rate. If Google Analytics is deployed via Google Tag Manager, this cookie will be named _dc_gtm_%property-id%":"Ограничивает частоту запросов. Если поддержка Google Analytics реализована с помощью Диспетчера тегов Google, файлу будет присвоено название _dc_gtm_%property-id%","a/b testing group flag":"флаг группы тестирования a/b"});
/* jshint +W100 */
}]);
//-----------------------------------------
});