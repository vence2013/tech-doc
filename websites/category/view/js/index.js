var app = angular.module('indexApp', ['treeControl'])

loadResource(app).controller('indexCtrl', indexCtrl);

function indexCtrl($scope, $http, locals) 
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
    // 目录编辑
    $scope.name = '';
    $scope.categorysel = null;
    $scope.categoryinfo= null;

    function detail(selid)
    {
        if (selid)
        {
            $http.get('/category/detail/'+selid).then((res)=>{
                if (errorCheck(res)) return ;

                var ret = res.data.message;
                if (ret)
                {
                    $scope.categoryinfo = ret;
                    $scope.name = $scope.categoryinfo.name;
                } else {
                    // 存储的节点无效，则设置为根目录
                    locals.setObject('/category/select', 0)
                    detail(0);
                }
            });
        } 
        else
        {
            $scope.categoryinfo = {'id':0, 'name':'根节点', 'createdAt':'0000-00-00', 'relcount':0}; 
            $scope.name = $scope.categoryinfo.name;
        }
    }

    function update() {
        $http.get('/category/tree/0', {}).then((res)=>{
            if (errorCheck(res)) return ;
            var ret = res.data.message;
            var root = [{'id':0, 'name':'根节点', 'children': ret}];
            var {dir, list} = treeTravel(root, 0, $scope.expand);

            $scope.treeRoot = $scope.treeView = root;       
            $scope.listRoot = $scope.listView = list;           
            // 恢复展开节点
            var expandids = locals.getObject('/category/expaned');
            if (expandids.length) {
                var expand = [];                
                $scope.listView.map((x)=>{ 
                    if (expandids.indexOf(x.id)!=-1) 
                        expand.push(x); 
                });
                $scope.listExpand = expand;
            }
            // 恢复选中节点
            var selid = locals.getObject('/category/select');
            detail((JSON.stringify(selid) != "{}") ? selid : 0);
        });
    }
    update();


    $scope.add = ()=>{
        var name = $scope.name.replace(/^\s+|\s+$/g,'');
        if (!name) { return toastr.info('请输入有效的目录名称！'); }

        $http.post('/category', {
            'father': $scope.categoryinfo.id, 'name': name
        }).then((res)=>{
            if (errorCheck(res)) return ;

            $scope.name = '';
            toastr.info(res.data.message);

            update();            
        }); 
    }


    $scope.edit = ()=>{        
        var name = $scope.name.replace(/^\s+|\s+$/g,'');
        if (!name) { return toastr.info('请选择有效节点并输入名称！'); }
        
        $http.put('/category/'+$scope.categoryinfo.id, {
            'name': name
        }).then((res)=>{
            if (errorCheck(res)) return ;
            
            toastr.info(res.data.message);
            update();            
        });
    }


    $scope.delete = () => {
        $http.delete('/category/'+$scope.categoryinfo.id).then((res)=>{
            if (errorCheck(res)) return ;

            toastr.info(res.data.message);
            update();            
        });
    }


    $scope.select = (node, sel) => { 
        $scope.nodeSel = node;
        locals.setObject('/category/select', node.id)
        detail(node.id);
    }


    $scope.toggle = (node, expanded) => {
        var ids = $scope.listExpand.map(node => { return node.id; });
        locals.setObject('/category/expaned', ids);
    }
}