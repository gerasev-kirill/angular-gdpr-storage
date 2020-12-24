(function() {

  var app = angular.module('IndexApp', ['gettext', 'storage.gdpr', 'ui.bootstrap']).controller('BodyCtrl', function($scope, storageSettings) {
      storageSettings.thirdPartyServices = ['ga', 'jivosite'];
  });
  app.controller('Ctrl1', function($scope, $localStorage, $sessionStorage){
      $scope.$localStorage = $localStorage;
      $scope.$sessionStorage = $sessionStorage;
  });
  app.controller('Ctrl2', function($scope, $localStorage, $sessionStorage){
      $scope.$localStorage = $localStorage;
      $scope.$sessionStorage = $sessionStorage;
  });

  angular.element(document).ready(function() {
      return angular.bootstrap(document, ['IndexApp']);
  });

}).call(this);
