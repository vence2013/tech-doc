var app = angular.module('indexApp', ['treeControl'])

loadResource(app).controller('indexCtrl', indexCtrl);

function indexCtrl($scope, $http, locals) 
{
    // 目录树显示
    $scope.treeRoot = [];
    $scope.listRoot = [];
    $scope.treeView = [];
    $scope.listView = [];
    $scope.listExpand = [];
    $scope.treeOptions = {dirSelectable: true};
    $scope.predicate = "";
    $scope.comparator = false;
}