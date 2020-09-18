var app = angular.module('resourceApp', ['treeControl', 'ngAnimate'])

loadResource(app).controller('resourceCtrl', resourceCtrl);

function resourceCtrl($scope, $http, $timeout, locals) 
{

}