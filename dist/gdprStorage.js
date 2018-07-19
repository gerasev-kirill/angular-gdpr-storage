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
    scope: {},
    controller: ["$scope", "$element", "$gdprStorage", "storageSettings", function($scope, $element, $gdprStorage, storageSettings) {
      $scope.storageSettings = storageSettings;
      if (!$gdprStorage.gdprPermission.app) {
        storageSettings.setBannerVisibility(true);
      }
      return $scope.$watch('storageSettings.isBannerVisible', function(isVisible) {
        if (isVisible) {
          $element.addClass('visible');
        } else {
          $element.removeClass('visible');
        }
      });
    }],
    template: ('/src/gdprRequestPermissionBanner.html', '\n<div class="container">\n  <gdpr-request-permission-area></gdpr-request-permission-area>\n</div>' + '')
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
        var i, len, literals, ref1, s;
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
      });
      $rootScope.$on('storage.gdpr.update', function() {
        $scope.options.permission = angular.copy($gdprStorage.gdprPermission);
      });
      $scope.onCancel = function() {
        $scope.options.permission.app = false;
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
        $timeout($scope.onAccept, 700);
      };
      $scope.toggleDetails = function() {
        return $scope.options.isDetailsVisible = !$scope.options.isDetailsVisible;
      };
    }],
    template: ('/src/gdprRequestPermissionArea.html', '\n<table class="gdpr-request-permission-area-content">\n  <tbody>\n    <tr>\n      <td>\n        <h5><b translate="">This website uses cookies and local storage</b></h5>\n        <p class="gdpr-text"><span translate="">We use cookies to personalise content and ads, to provide social media features and to analyse our traffic. You should consent to our cookies if you continue to use our website.</span><span> </span><a ng-click="toggleDetails()" ng-switch="options.isDetailsVisible"><span translate="" ng-switch-when="true">Hide details</span><span translate="" ng-switch-when="false">Show details about cookies and local storage</span></a></p>\n        <div class="gdpr-request-permission-area-content-checkboxes">\n          <div class="checkbox-inline" ng-repeat="service in SERVICES">\n            <label>\n              <input type="checkbox" ng-model="options.permission[service.type]"/><span> </span><span>{{service.name | translate}}</span>\n            </label>\n          </div>\n        </div>\n        <div class="gdpr-request-permission-area-content-details" ng-if="options.isDetailsVisible">\n          <uib-tabset class="uib-tabset-sm" active="options.activeTab">\n            <uib-tab ng-repeat="service in SERVICES" index="$index" heading="{{service.name | translate}}">\n              <p class="gdpr-text" ng-if="service.description">{{service.description | translate}}</p>\n              <table class="table table-striped table-bordered table-condensed">\n                <thead>\n                  <tr>\n                    <th class="gdpr-text" translate="">Name</th>\n                    <th class="gdpr-text" translate="">Provider</th>\n                    <th class="gdpr-text" translate="">Purpose</th>\n                    <th class="gdpr-text" translate="">Expiry</th>\n                    <th class="gdpr-text" translate="">Type</th>\n                  </tr>\n                </thead>\n                <tbody>\n                  <tr ng-repeat="cookie in service.cookies">\n                    <td class="gdpr-text">{{cookie.key}}</td>\n                    <td class="gdpr-text">{{cookie.provider | translate}}</td>\n                    <td class="gdpr-text">{{cookie.purpose | translate}}</td>\n                    <td class="gdpr-text">{{cookie.expiry | translate}}</td>\n                    <td class="gdpr-text">{{cookie.type | translate}}</td>\n                  </tr>\n                </tbody>\n              </table>\n            </uib-tab>\n          </uib-tabset>\n        </div>\n      </td>\n      <td class="gdpr-request-permission-area-content-btns hidden-xs hidden-sm">\n        <table>\n          <body>\n            <tr>\n              <td>\n                <button class="btn btn-default btn-xs btn-block" translate="" ng-click="onAccept()" translate-context="Accept cookies">Accept</button>\n              </td>\n              <td class="btn-separator"></td>\n              <td>\n                <button class="btn btn-default btn-xs btn-block" ng-click="onCancel()"><span class="fa fa-times"></span><span translate="" translate-context="Deny cookies">Deny</span></button>\n              </td>\n            </tr>\n            <tr>\n              <td colspan="3">\n                <button class="btn btn-success btn-xs btn-block" ng-click="onAcceptAll()"><span class="fa fa-check"></span><span translate="" translate-context="Accept all cookies">Accept all</span></button>\n              </td>\n            </tr>\n          </body>\n        </table>\n      </td>\n    </tr>\n    <tr class="gdpr-request-permission-area-content-btns visible-xs visible-sm">\n      <td class="text-center" colspan="2">\n        <div class="btn-group">\n          <button class="btn btn-default btn-xs" translate="" ng-click="onAccept()" translate-context="Accept cookies">Accept</button>\n          <button class="btn btn-success btn-xs" ng-click="onAcceptAll()"><span class="fa fa-check"></span><span translate="" translate-context="Accept all cookies">Accept all</span></button>\n          <button class="btn btn-default btn-xs" ng-click="onCancel()"><span class="fa fa-times"></span><span translate="" translate-context="Deny cookies">Deny</span></button>\n        </div>\n      </td>\n    </tr>\n  </tbody>\n</table>' + '')
  };
});

angular.module('storage.gdpr').config(["storageSettingsProvider", function(storageSettingsProvider) {
  var GA, jivosite;
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
}]);

//-----------------------------------------
});