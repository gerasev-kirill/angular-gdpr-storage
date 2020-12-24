'use strict'
STORAGE_PREFIX = 'ngStorage-'

class BaseFallbackStorage
    constructor: ()->
        @length = undefined
        if Object.defineProperty
            Object.defineProperty(@, 'length', {
                configurable: false
                get: ()->
                    @__length()
            })
        return
    getItem: (name)->
        if arguments.length < 1
            throw "Failed to execute 'getItem' on sessionStorage fallback: 1 argument required, but only #{arguments.length} present"
        @__getItem(name)
    setItem: (name, value)->
        if arguments.length < 2
            throw "Failed to execute 'setItem' on sessionStorage fallback: 2 arguments required, but only #{arguments.length} present"
        @__setItem(name+'', value+'')
        return
    removeItem: (name)->
        throw "Failed to execute 'removeItem' on sessionStorage fallback: 1 argument required, but only #{arguments.length} present"
        @__removeItem(name+'')
        return
    clear: ()->
        @__clear()
        return
    key: (i)->
        if arguments.length < 1
            throw "Failed to execute 'key' on sessionStorage fallback: 1 argument required, but only #{arguments.length} present"
        @__key(i)



GdprException = (message)->
    @name = 'GdprException'
    @message = message or ''
    @
GdprException.prototype = new Error()
GdprException.prototype.constructor = GdprException


getStorageKey = (key) ->
    key.slice(STORAGE_PREFIX.length)



# TODO: CookieStorage


generateStorageFactory = ($rootScope, $window, $log, $timeout, storageType, preferredStorageType, allowedKeysForGdpr) ->
    _debounce = null
    _last$storage = null
    allowedKeysForGdpr = allowedKeysForGdpr or {}
    toJson = angular.toJson
    fromJson = (data)->
        try
            return angular.fromJson(data)
        catch error
            return undefined

    memoryStorage = do()->
        BANNED_PROPS = ['length']
        class MemoryStorage extends BaseFallbackStorage
            __getItem: (name)->
                @[name+''] or undefined
            __setItem: (name, value)->
                if angular.isFunction(@[name])
                    throw "Failed to execute 'setItem' on sessionStorage fallback: #{name} is not allowed"
                if @[name] == value then return
                @[name] = value
                return
            __removeItem: (name)->
                delete @[name]
                return
            __clear: ()->
                for own k of @ when k not in BANNED_PROPS and !angular.isFunction(@[k])
                    delete @[k]
                return
            __key: (i)->
                keys = []
                for own k of @ when k not in BANNED_PROPS and !angular.isFunction(@[k])
                    keys.push(k)
                keys.sort()
                keys[i]
            __length: ()->
                length = 0
                for own k of @ when k not in BANNED_PROPS and !angular.isFunction(@[k])
                    length += 1
                length

        storage = new MemoryStorage()
        if !angular.isDefined($window.Proxy)
            return storage
        ##
        new Proxy(storage, {
            set: (obj, prop, value)->
                if obj[prop] == value then return value
                event = new CustomEvent('storage', {})
                event.key = prop
                event.oldValue = obj[prop]
                event.isMemoryStorage = true

                obj.setItem(prop, value)
                event.newValue = obj[prop]
                $window.dispatchEvent(event)
                return value
            get: (obj, prop)->
                return obj[prop]
        })



    getStorage = do()->
        # Some installations of IE, for an unknown reason, throw "SCRIPT5: Error: Access is denied"
        # when accessing window.localStorage. This happens before you try to do anything with it. Catch
        # that error and allow execution to continue.
        # fix 'SecurityError: DOM Exception 18' exception in Desktop Safari, Mobile Safari
        # when "Block cookies": "Always block" is turned on
        try
            sessionStorageSupported = $window['sessionStorage']
        catch err
            sessionStorageSupported = false
        try
            localStorageSupported = $window['localStorage']
        catch err
            localStorageSupported = false
        # When Safari (OS X or iOS) is in private browsing mode, it appears as though localStorage
        # is available, but trying to call .setItem throws an exception below:
        # "QUOTA_EXCEEDED_ERR: DOM Exception 22: An attempt was made to add something to storage that exceeded the quota."
        if localStorageSupported
            key = '__' + Math.round(Math.random() * 1e7)
            try
                localStorageSupported.setItem(key, key)
                localStorageSupported.removeItem(key)
            catch err
                localStorageSupported = false

        if !localStorageSupported and !sessionStorageSupported
            $log.warn('This browser does not support Web Storage!')

        (storageType) ->
            if storageType == 'gdprStorage'
                storageType = preferredStorageType
            storage = null
            if storageType == 'localStorage' and localStorageSupported
                storage = localStorageSupported
            else if storageType == 'sessionStorage' and sessionStorageSupported
                storage = sessionStorageSupported
            storage or memoryStorage


    $storage = {
        $default: (items) ->
            for k,v of items when !angular.isDefined($storage[k])
                $storage[k] = v
            $storage.$sync()
            $storage
        $reset: (items) ->
            webStorage = getStorage(storageType)
            for k of $storage when k[0] != '$'
                delete $storage[k]
                webStorage.removeItem(STORAGE_PREFIX + k)
            $storage.$default(items)
        $sync: ()->
            webStorage = getStorage(storageType)
            for k of webStorage when k and k.indexOf(STORAGE_PREFIX) == 0
                # #8, #10: `webStorage.key(i)` or `k` may be an empty string (or throw an exception in IE9 if `webStorage` is empty)
                $storageKey = getStorageKey(k)
                if storageType == 'gdprStorage' and !allowedKeysForGdpr[$storageKey]
                    continue
                value = fromJson(webStorage.getItem(k))
                if storageType == 'gdprStorage' and $storageKey == 'gdprPermission'
                    $storage.$setPermission(value)
                else
                    if angular.isDefined(value)
                        $storage[$storageKey] = value
                    else
                        delete $storage[$storageKey]
            return
        $apply: (force)->
            _debounce = null
            temp$storage = undefined
            webStorage = getStorage(storageType)
            if !angular.equals($storage, _last$storage) or force
                temp$storage = angular.copy  (_last$storage)
                for k,v of $storage when angular.isDefined(v) and k[0] != '$'
                    if storageType == 'gdprStorage' and !allowedKeysForGdpr[k]
                        throw new GdprException("""You can't assign key '#{k}' for $gdprStorage! Please register key '#{k}' inside config block with this: $gdprStorageProvider.registerKey('#{k}')""")
                    webStorage.setItem(STORAGE_PREFIX + k, toJson(v))
                    delete temp$storage[k]
                for k of temp$storage
                    webStorage.removeItem(STORAGE_PREFIX + k)
                _last$storage = angular.copy  ($storage)
            return
    }

    if storageType == 'gdprStorage'
        $storage.gdprPermission = {app: false}
        $storage.$getAllowedKeys = ()->
            angular.copy(allowedKeysForGdpr)

        signalState = 'none'
        $storage.$setPermission = (permission)->
            permission = permission or {}
            permission.app = !!permission.app
            if permission.app
                sType = 'localStorage'
            else
                sType = 'sessionStorage'
            $storage.gdprPermission = permission
            if signalState == 'none'
                $rootScope.$emit("storage.gdpr.init")
                signalState = 'init'
            else
                signalState = 'update'
                $rootScope.$emit("storage.gdpr.permissionUpdate")
            # migrate from one storage to other
            oldStorage = getStorage(preferredStorageType)
            newStorage = getStorage(sType)
            newStorage.setItem(STORAGE_PREFIX + 'gdprPermission', toJson(permission))
            if sType == preferredStorageType
                return
            if oldStorage
                for k,v of oldStorage when k and k.indexOf(STORAGE_PREFIX) == 0
                    if k != STORAGE_PREFIX + 'gdprPermission'
                        newStorage.setItem(k,v)
                    oldStorage.removeItem(k)
            # update all values from new storage
            for k of newStorage when k and k.indexOf(STORAGE_PREFIX) == 0
                $storageKey = getStorageKey(k)
                value = fromJson(newStorage.getItem(k))
                if angular.isDefined(value)
                    $storage[$storageKey] = value
            # save storage type
            preferredStorageType = sType
            return



    $storage.$sync()
    _last$storage = angular.copy  ($storage)

    # #6: Use `$window.addEventListener` instead of `angular.element` to avoid the jQuery-specific `event.originalEvent`
    onStorageChangeEvent = (event) ->
        if !event or !event.key
            return
        $storageKey = getStorageKey(event.key)
        if event.key != (STORAGE_PREFIX + $storageKey) or (!event.isMemoryStorage and event.storageArea != getStorage(storageType))
            return
        #
        value = fromJson(event.newValue)
        if angular.isDefined(value)
            $storage[$storageKey] = value
        else
            delete $storage[$storageKey]
        _last$storage = angular.copy  ($storage)
        if !$rootScope.$$phase
            $rootScope.$apply()
        return

    $window.addEventListener('storage', onStorageChangeEvent)
    $window.addEventListener 'beforeunload',
        (event) ->
            $window.removeEventListener('storage', onStorageChangeEvent)
            $storage.$apply()
            return
        ,
        false

    $storage




ngLocalStorage = null
ngSessionStorage = null
ngGdprStorage = null
rmNgLocalStorageWatch = null
rmNgSessionStorageWatch = null
rmNgGdprStorageWatch = null

###*
# @ngdoc overview
# @name gdpr.storage
###
angular.module('storage.gdpr', [])

.provider 'storageSettings', ()->
    storageSettings = null
    thirdPartyLiterals = {}
    @setPrefix = (prefix)->
        STORAGE_PREFIX = prefix or ''
        return

    @registerThirdPartyServiceLiteral = (literalName, config)->
        thirdPartyLiterals[literalName] = config or []
        return


    @$get = ()->
        if !storageSettings
            storageSettings = {
                defaultAllowAll: false
                isBannerVisible: false
                thirdPartyServices: []
                getPrefix: ()->
                    STORAGE_PREFIX
                setBannerVisibility: (visibility)->
                    storageSettings.isBannerVisible = visibility in [true, 'visible']
                    return
                getThirdPartyLiterals: ()->
                    angular.copy(thirdPartyLiterals)
            }
        storageSettings
    @




.service '$localStorage', ($rootScope, $window, $log, $timeout)->
    _debounce = null
    if !ngLocalStorage
        ngLocalStorage = generateStorageFactory($rootScope, $window, $log, $timeout, 'localStorage')
    else
        ngLocalStorage.$sync()

    if rmNgLocalStorageWatch
        rmNgLocalStorageWatch()
    rmNgLocalStorageWatch = $rootScope.$watch ->
        if !_debounce
            _debounce = $timeout \
                ()-> ngLocalStorage.$apply()
                ,
                100,
                false
        _debounce
    ngLocalStorage

.service '$sessionStorage', ($rootScope, $window, $log, $timeout)->
    _debounce = null
    if !ngSessionStorage
        ngSessionStorage = generateStorageFactory($rootScope, $window, $log, $timeout, 'sessionStorage')
    else
        ngSessionStorage.$sync()

    if rmNgSessionStorageWatch
        rmNgSessionStorageWatch()
    rmNgSessionStorageWatch = $rootScope.$watch ->
        if !_debounce
            _debounce = $timeout \
                ()-> ngSessionStorage.$apply()
                ,
                100,
                false
        _debounce
    ngSessionStorage



.provider '$gdprStorage', ()->
    ALLOWED_KEYS = {}

    @registerKey = (key, options)->
        options = options or {}
        ALLOWED_KEYS[key] = options
        return

    @$get = ($rootScope, $window, $log, $timeout)->
        _debounce = null
        if !ngGdprStorage
            # session storage
            if !ngSessionStorage
                ngSessionStorage = generateStorageFactory($rootScope, $window, $log, $timeout, 'sessionStorage')
            else
                ngSessionStorage.$sync()
            # local storage
            if !ngLocalStorage
                ngLocalStorage = generateStorageFactory($rootScope, $window, $log, $timeout, 'localStorage')
            else
                ngLocalStorage.$sync()
            # gdpr init
            permission = {app: false}

            if angular.isObject(ngLocalStorage.gdprPermission)
                permission = ngLocalStorage.gdprPermission
            else if angular.isObject(ngSessionStorage.gdprPermission)
                permission = ngSessionStorage.gdprPermission

            for k of ALLOWED_KEYS
                # collect all key\values from storages
                value = ''
                if ngSessionStorage[k]
                    value = ngSessionStorage[k]
                if ngLocalStorage and ngLocalStorage[k]
                    value = ngLocalStorage[k]
                if value == ''
                    continue
                # save them
                if permission.app
                    ngLocalStorage[k] = value
                else
                    ngSessionStorage[k] = value
            if permission.app
                ngLocalStorage.$apply()
                preferredStorageType = 'localStorage'
            else
                ngSessionStorage.$apply()
                preferredStorageType = 'sessionStorage'
            ngGdprStorage = generateStorageFactory(
                $rootScope,
                $window,
                $log,
                $timeout,
                'gdprStorage',
                preferredStorageType,
                ALLOWED_KEYS
            )
            ngGdprStorage.$setPermission(permission)
        else
            ngGdprStorage.$sync()

        if rmNgGdprStorageWatch
            rmNgGdprStorageWatch()
        rmNgGdprStorageWatch = $rootScope.$watch ->
            if !_debounce
                _debounce = $timeout \
                    ()-> ngGdprStorage.$apply()
                    ,
                    100,
                    false
            _debounce
        ngGdprStorage

    @



.config ($gdprStorageProvider)->
    $gdprStorageProvider.registerKey('gdprPermission', {
        description: 'GDPR permission data for site'
    })
