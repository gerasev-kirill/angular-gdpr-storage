((root, factory) ->
    'use strict'
    if typeof define == 'function' and define.amd
        define(['angular'], factory)
    else if typeof exports == 'object'
        module.exports = factory(require('angular'))
    else
        # Browser globals (root is window), we don't register it.
        factory(root.angular)
    return
) this, (angular) ->
    'use strict'
    STORAGE_PREFIX = 'ngStorage-'
    ngLocalStorage = null
    ngSessionStorage = null
    getStorageKey = (key) ->
        key.slice(STORAGE_PREFIX.length)



    generateStorageFactory = ($rootScope, $window, $log, $timeout, storageType) ->
        _debounce = null
        _last$storage = null

        isStorageSupported = (storageType) ->
            # Some installations of IE, for an unknown reason, throw "SCRIPT5: Error: Access is denied"
            # when accessing window.localStorage. This happens before you try to do anything with it. Catch
            # that error and allow execution to continue.
            # fix 'SecurityError: DOM Exception 18' exception in Desktop Safari, Mobile Safari
            # when "Block cookies": "Always block" is turned on
            supported = undefined
            try
                supported = $window[storageType]
            catch err
                supported = false
            # When Safari (OS X or iOS) is in private browsing mode, it appears as though localStorage
            # is available, but trying to call .setItem throws an exception below:
            # "QUOTA_EXCEEDED_ERR: DOM Exception 22: An attempt was made to add something to storage that exceeded the quota."
            if supported and storageType == 'localStorage'
                key = '__' + Math.round(Math.random() * 1e7)
                try
                    supported.setItem key, key
                    supported.removeItem key
                catch err
                    supported = false
            supported


        # #9: Assign a placeholder object if Web Storage is unavailable to prevent breaking the entire AngularJS app
        webStorage = isStorageSupported(storageType)
        if !webStorage
            $log.warn('This browser does not support Web Storage!')
            webStorage = {
                setItem: angular.noop
                getItem: angular.noop
                removeItem: angular.noop
                key: angular.noop
            }
        $storage = {
            $default: (items) ->
                for k,v of items when !angular.isDefined($storage[k])
                    $storage[k] = v
                $storage.$sync()
                $storage
            $reset: (items) ->
                for k of $storage
                    if k[0] != '$'
                        delete $storage[k]
                        webStorage.removeItem(STORAGE_PREFIX + k)
                $storage.$default(items)
            $sync: ()->
                i = webStorage.length
                $storageKey = undefined
                k = undefined
                while i--
                    k = webStorage.key(i)
                    $storageKey = getStorageKey(k)
                    # #8, #10: `webStorage.key(i)` may be an empty string (or throw an exception in IE9 if `webStorage` is empty)
                    k and STORAGE_PREFIX + $storageKey == k and ($storage[$storageKey] = angular.fromJson(webStorage.getItem(k)))
                return
            $apply: ()->
                temp$storage = undefined
                _debounce = null
                if !angular.equals($storage, _last$storage)
                    temp$storage = angular.copy  (_last$storage)
                    for k,v of $storage when angular.isDefined(v) and k[0] != '$'
                        webStorage.setItem(STORAGE_PREFIX + k, angular.toJson(v))
                        delete temp$storage[k]
                    for k of temp$storage
                        webStorage.removeItem STORAGE_PREFIX + k
                    _last$storage = angular.copy  ($storage)
                return
        }


        $storage.$sync()
        _last$storage = angular.copy  ($storage)

        $rootScope.$watch ->
            _debounce or (_debounce = $timeout($storage.$apply, 100, false))
            return
        # #6: Use `$window.addEventListener` instead of `angular.element` to avoid the jQuery-specific `event.originalEvent`
        $window.addEventListener 'storage', (event) ->
            key = event.key
            newValue = event.newValue
            $storageKey = undefined
            if !key
                return
            $storageKey = getStorageKey(key)
            if key == STORAGE_PREFIX + $storageKey
                if newValue
                    $storage[$storageKey] = angular.fromJson(newValue)
                else
                    delete $storage[$storageKey]
                _last$storage = angular.copy  ($storage)
                if !$rootScope.$$phase
                    $rootScope.$apply()
            return

        $window.addEventListener 'beforeunload',
            (event) ->
                $storage.$apply()
                return
            ,
            false
        $storage




    ###*
    # @ngdoc overview
    # @name ngStorage
    ###
    angular.module('ngStorage', [])
    .provider 'ngStorage', ()->
        @setPrefix = (prefix)->
            STORAGE_PREFIX = prefix or ''
            return
        @$get = ()-> {
            getPrefix: ()->
                STORAGE_PREFIX
        }
        @
    .service '$localStorage', ($rootScope, $window, $log, $timeout)->
        ngLocalStorage = generateStorageFactory($rootScope, $window, $log, $timeout, 'localStorage')
        ngLocalStorage
    .service '$sessionStorage', ($rootScope, $window, $log, $timeout)->
        ngSessionStorage = generateStorageFactory($rootScope, $window, $log, $timeout, 'sessionStorage')
        ngSessionStorage
