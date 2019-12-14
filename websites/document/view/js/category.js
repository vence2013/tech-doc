var app = angular.module('categoryApp', ['treeControl'])

loadResource(app).controller('categoryCtrl', categoryCtrl);

function categoryCtrl($scope, $http, locals) 
{
    // 目录树相关
    $scope.treeRoot = [];
    $scope.listRoot = [];
    $scope.treeView = [];
    $scope.listView = [];
    $scope.listExpand = [];
    $scope.treeOptions = {dirSelectable: true};
    $scope.predicate = "";
    $scope.comparator = false;
    // 文档搜索
    $scope.opts = opts = {'page':1, 'pageSize':24, 'str':''};
    $scope.page = pageSet(0, opts.pageSize, 10, 0);


    // 更新在目录中的文档列表
    function docUpdate()
    {
        docUpdateTimer = null;

        var query = angular.copy($scope.opts);
        var createget = $scope.opts.createget;
        var createlet = $scope.opts.createlet;
        query['createget'] = (/^\d{4}(\-|\/|\.)\d{1,2}\1\d{1,2}$/.test(createget)) ? createget : '';
        query['createlet'] = (/^\d{4}(\-|\/|\.)\d{1,2}\1\d{1,2}$/.test(createlet)) ? createlet : '';
        query['tag'] = $scope.taglink;

        $http.get('/document/search', {params: query}).then((res)=>{
            if (errorCheck(res)) return ;

            var ret = res.data.message;
            $scope.doclist = ret.list;
            $scope.page = pageSet(ret.total, opts.pageSize, 10, ret.page);        
        })
    }
    docUpdate();

    function update() {
        $http.get('/category/tree/0', {}).then((res)=>{
            if (errorCheck(res)) return ;
            var ret = res.data.message;
            var root = [{'id':0, 'name':'根节点', 'children': ret}];
            var {dir, list} = treeTravel(root, 0, $scope.expand);

            $scope.treeRoot = $scope.treeView = root;       
            $scope.listRoot = $scope.listView = list;           
            // 恢复展开节点
            var expandids = locals.getObject('/document/category/expaned');
            if (expandids.length) {
                var expand = [];                
                $scope.listView.map((x)=>{ 
                    if (expandids.indexOf(x.id)!=-1) 
                        expand.push(x); 
                });
                $scope.listExpand = expand;
            }
        });
    }
    update();

    $scope.select = (node, sel) => { 
        $scope.nodeSel = node;
        
    }


    $scope.toggle = (node, expanded) => {
        var ids = $scope.listExpand.map(node => { return node.id; });
        locals.setObject('/document/category/expaned', ids);
    }
}