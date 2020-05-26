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
    $scope.treeOptions = {dirSelectable: false};
    $scope.predicate = "";
    $scope.comparator = false;

    tree_refresh();
    $('.category-view').height($(document).height() - 80);

    function tree_refresh() {
        var expanddirs = locals.getObject('/category/view/exp');

        $http.get('/category/display/0').then((res)=>{
            if (errorCheck(res)) return ;

            var ret = res.data.message;

            var {dir, list} = treeTravel(ret, 0, $scope.expand);
            $scope.treeRoot = $scope.treeView = ret;
            $scope.listRoot = $scope.listView = list;

            // 恢复展开节点
            if (expanddirs.length) {
                var expand = [];
                $scope.listView.map((x)=>{ 
                    if (expanddirs.indexOf(x.id)!=-1) 
                        expand.push(x); 
                });
                $scope.listExpand = expand;
            }
        });
    }

    $scope.toggle = (node, expanded) => {
        /* 更新展开的节点列表 */
        var ids = $scope.listExpand.map(node => { return node.id; });
        locals.setObject('/category/view/exp', ids);
    }
}