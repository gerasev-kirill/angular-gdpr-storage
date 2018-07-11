angular.module('ngStorage')




.directive 'gdprRequestPermissionBanner', () ->
    restrict: 'E'
    scope:{}
    controller: ($scope, $element, $gdprStorage, storageSettings) ->
        $scope.storageSettings = storageSettings
        if !$gdprStorage.gdprPermission.app
            storageSettings.setBannerVisibility(true)

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
                type: options.type or 'Local storage'
            })


        $scope.$watch 'storageSettings.thirdPartyServices', (thirdPartyServices, oldValue)->
            $scope.SERVICES = thirdPartyServices or []
            $scope.SERVICES.unshift({
                type: 'app'
                name: 'Site settings'
                cookies: appCookies
            })
            return

        $rootScope.$on 'storage.gdpr.update', ()->
            $scope.options.permission = angular.copy($gdprStorage.gdprPermission)
            return

        $scope.onCancel = () ->
            $scope.options.permission.app = false
            $gdprStorage.$setPermission($scope.options.permission)
            storageSettings.setBannerVisibility(false)
            return

        $scope.onAccept = () ->
            $gdprStorage.$setPermission($scope.options.permission)
            storageSettings.setBannerVisibility(false)
            $rootScope.$emit('storage.gdpr.userPermissionAccept')
            return

        $scope.onAcceptAll = () ->
            $scope.SERVICES.forEach (service)->
                $scope.options.permission[service.type] = true
                return
            $timeout($scope.onAccept, 700)
            return

        $scope.toggleDetails = () ->
            $scope.options.isDetailsVisible = !$scope.options.isDetailsVisible
        return

    templateUrl: '/@@__SOURCE_PATH__/gdprRequestPermissionArea.html'
