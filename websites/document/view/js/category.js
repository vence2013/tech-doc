var app = angular.module('categoryApp', ['treeControl'])

loadResource(app).controller('categoryCtrl', categoryCtrl);

function categoryCtrl($scope, $http, locals) 
{
    /* 目录 -----------------------------------------------------------------*/

    const categoryRoot = {'id':0, 'name':'根节点', 'createdAt':'0000-00-00'};
    // 目录树相关
    $scope.treeRoot = [];
    $scope.listRoot = [];
    $scope.treeView = [];
    $scope.listView = [];
    $scope.listExpand = [];
    $scope.treeOptions = {dirSelectable: true};
    $scope.predicate = "";
    $scope.comparator = false;
    $scope.nodeSel = angular.copy(categoryRoot);

    function update() {
        $http.get('/category/tree/0', {}).then((res)=>{
            if (errorCheck(res)) return ;
            var ret = res.data.message;
            
            var tmp = angular.copy(categoryRoot);
            tmp['children'] = ret;
            var root = [ tmp ];
            $scope.categoryinfo = root;
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
        docUpdate(node.id);
    }

    $scope.toggle = (node, expanded) => {
        var ids = $scope.listExpand.map(node => { return node.id; });
        locals.setObject('/document/category/expaned', ids);
    }

    /* 文档 -----------------------------------------------------------------*/

    $scope.docOpts = docOpts = {'page':1, 'pageSize':24, 'str':''};
    $scope.page = pageSet(0, docOpts.pageSize, 10, 0);
    
    var docUpdateTimer = null;
    $scope.$watch('docOpts', ()=>{
        /* 避免在输入过程中频繁请求服务器 */
        if (docUpdateTimer)
            window.clearTimeout(docUpdateTimer);
        docUpdateTimer = window.setTimeout(docUpdate, 500);  
    }, true);

    // 更新在目录中的文档列表
    function docUpdate(categoryid)
    {
        docUpdateTimer = null;
        categoryid = categoryid ? categoryid : $scope.nodeSel.id;

        $http.get('/document/category/in/'+categoryid, {
            'params': $scope.docOpts
        }).then((res)=>{
            if (errorCheck(res)) return ;

            var ret = res.data.message;
            $scope.doclist = ret.list;
            $scope.page = pageSet(ret.total, docOpts.pageSize, 10, ret.page);  
        })
    }

    $scope.pageGoto = '';
    $scope.pageJump = () => {
        var num = parseInt($scope.pageGoto);
        if (!num || (num <= 0) || (num > $scope.page.max))
            return toastr.warning('请输入有效页码！');
        
        $scope.pageGoto = '';
        docOpts.page = num;
    }

    $scope.export = () => {
        var categoryid = $scope.nodeSel.id;
        if (!categoryid) 
            return toastr.warning('请选择需要导出文档的目录！');

        $http.get('/document/export', {params: {
            'categoryid':categoryid, 'str':$scope.docOpts.str
        }}).then((res)=>{
            if (errorCheck(res)) return ;
            
            var ret = res.data.message;
            window.open(ret+'?t='+Math.random());
        })
    }
}