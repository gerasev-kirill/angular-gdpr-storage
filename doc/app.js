(function() {

  angular.module('IndexApp', ['gettext', 'ngStorage', 'ui.bootstrap']).controller('BodyCtrl', function($scope, storageSettings) {
    storageSettings.thirdPartyServices = ['ga', 'jivosite'];
  });

  angular.element(document).ready(function() {
    return angular.bootstrap(document, ['IndexApp']);
  });

}).call(this);
