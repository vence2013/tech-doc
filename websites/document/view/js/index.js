var app = angular.module('indexApp', [])

loadResource(app).controller('indexCtrl', indexCtrl);

function indexCtrl($scope, $http) 
{
    $scope.opts = opts = {'page':1, 'pageSize':24, 'str':'', 'tag':'', 'order':'1'};
    $scope.page = pageSet(0, opts.pageSize, 10, 0);
}