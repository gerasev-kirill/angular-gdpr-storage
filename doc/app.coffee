angular.module('IndexApp', ['gettext', 'ngStorage', 'ui.bootstrap'])

.controller 'BodyCtrl', ($scope, storageSettings)->
    storageSettings.thirdPartyServices = ['ga', 'jivosite']
    return



angular.element(document).ready \
    ()-> angular.bootstrap(document, ['IndexApp'])
