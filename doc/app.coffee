angular.module('IndexApp', ['gettext', 'ngStorage', 'ui.bootstrap'])

.controller 'BodyCtrl', ($scope)->
    return



angular.element(document).ready \
    ()-> angular.bootstrap(document, ['IndexApp'])
