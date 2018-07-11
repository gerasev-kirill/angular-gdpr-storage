(function() {

  angular.module('IndexApp', ['gettext', 'ngStorage', 'ui.bootstrap']).controller('BodyCtrl', function($scope) {});

  angular.element(document).ready(function() {
    return angular.bootstrap(document, ['IndexApp']);
  });

}).call(this);
