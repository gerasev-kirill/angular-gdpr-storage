angular.module('storage.gdpr')




.directive 'gdprRequestPermissionBanner', () ->
    restrict: 'E'
    scope:{
        defaultAllowAll: '@?'
    }
    controller: ($scope, $element, $gdprStorage, storageSettings) ->
        $scope.storageSettings = storageSettings
        if !$gdprStorage.gdprPermission.app
            storageSettings.setBannerVisibility(true)
        storageSettings.defaultAllowAll = $scope.defaultAllowAll == 'true'

        $scope.$watch 'storageSettings.isBannerVisible', (isVisible)->
            if isVisible
                $element.addClass('visible')
            else
                $element.removeClass('visible')
            return


    templateUrl: '/@@__SOURCE_PATH__/gdprRequestPermissionBanner.html'







.directive 'gdprRequestPermissionArea', () ->
    restrict: 'E'
    scope:{}
    controller: ($scope, $rootScope, $timeout, $gdprStorage, storageSettings) ->
        $scope.storageSettings = storageSettings
        $scope.options = {
            permission: angular.copy($gdprStorage.gdprPermission)
            isDetailsVisible: false
            activeTab: 0
        }

        appCookies = []
        for key, options of $gdprStorage.$getAllowedKeys()
            appCookies.push({
                key,
                provider: options.provider or 'This site'
                purpose: options.purpose or 'Settings'
                expiry: options.expiry or 'Never'
                type: options.type or 'Value in localStorage'
            })


        $scope.$watchCollection 'storageSettings.thirdPartyServices', (thirdPartyServices, oldValue)->
            $scope.SERVICES = [{
                type: 'app'
                name: 'Site settings'
                cookies: appCookies
            }]
            literals = storageSettings.getThirdPartyLiterals()
            for s in thirdPartyServices or []
                if angular.isString(s) and literals[s]
                    $scope.SERVICES.push(literals[s])
                else if angular.isObject(s)
                    $scope.SERVICES.push(s)
            if storageSettings.defaultAllowAll
                for s in $scope.SERVICES
                    $scope.options.permission[s.type] = true
            return

        $rootScope.$on 'storage.gdpr.update', ()->
            $scope.options.permission = angular.copy($gdprStorage.gdprPermission)
            return

        $scope.onCancel = () ->
            for k of $scope.options.permission
                $scope.options.permission[k] = false
            $gdprStorage.$setPermission($scope.options.permission)
            storageSettings.setBannerVisibility(false)
            return

        $scope.onAccept = () ->
            $gdprStorage.$setPermission($scope.options.permission)
            storageSettings.setBannerVisibility(false)
            $rootScope.$emit('storage.gdpr.userPermissionAccept')
            return

        $scope.onAcceptAll = () ->
            for service in $scope.SERVICES or []
                $scope.options.permission[service.type] = true
            $timeout($scope.onAccept, 900)
            return

        $scope.toggleDetails = () ->
            $scope.options.isDetailsVisible = !$scope.options.isDetailsVisible
        return

    templateUrl: '/@@__SOURCE_PATH__/gdprRequestPermissionArea.html'
