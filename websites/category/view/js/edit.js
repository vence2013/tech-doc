var app = angular.module('editApp', ['treeControl', 'ngAnimate'])

loadResource(app).controller('editCtrl', editCtrl);

function editCtrl($scope, $http, $timeout, locals) 
{
    /* Angular Tree Control */
    $scope.treeRoot = [];
    $scope.listRoot = [];
    $scope.treeView = [];
    $scope.listView = [];
    $scope.listExpand = [];
    $scope.treeOptions = {dirSelectable: true};
    $scope.predicate = "";
    $scope.comparator = false;

    tree_refresh();

    /* event ----------------------------------------------------------------*/

    function search_node_by_id(id)
    {
        for (var i = 0; i < $scope.listView.length; i++)
        {
            if (id == $scope.listView[i].id)
            {
                return $scope.listView[i];
            }
        }
    }

    function tree_refresh() {
        
        $http.get('/category/tree/0', {}).then((res)=>{
            if (errorCheck(res)) return ;

            var ret = res.data.message;
            var {dir, list} = treeTravel(ret, 0, $scope.expand);
            $scope.treeRoot = $scope.treeView = ret;       
            $scope.listRoot = $scope.listView = list;

            // 恢复展开节点
            var expandids = locals.getObject('/category/edit/exp');
            if (expandids.length) {
                var expand = [];
                $scope.listView.map((x)=>{ 
                    if (expandids.indexOf(x.id)!=-1) 
                        expand.push(x); 
                });
                $scope.listExpand = expand;
            }

            // 恢复选中节点
            var id = locals.get('/category/edit/sel');
            var node = search_node_by_id(id);
            if (node)
            {
                $scope.nodeSelected = node;
                select(node, true);
            }
        });
    }


    $scope.category_father  = null;
    $scope.category_current = null;
    $scope.category_sub_name = '';

    $scope.wait_father_select = () =>
    {
        $timeout(()=>{            
            $scope.category_father = $scope.nodeSelected;
        }, 500);
    }

    function reset()
    {
        $scope.category_father  = null;
        $scope.category_current = null;
        $scope.category_sub_name = '';
    }

    $scope.select = select;
    function select(node, sel)
    {
        if (sel)
        {
            // 设置当前节点，查找父节点，清空子节点名称
            $scope.category_sub_name = '';
            $scope.category_current = node;
            $scope.category_father = search_node_by_id(node.father);
            locals.set('/category/edit/sel', node.id);
        }
        else
        {
            reset();
            locals.set('/category/edit/sel', undefined);
        }
    }

    /* 目录编辑 -----------------------------------------------------------------*/


    $scope.add = () =>
    {
        var name = $scope.category_sub_name.replace(/^\s+|\s+$/g,'');
        if (!name) { return toastr.warning('请输入有效的目录名称！'); }

        var father_id = $scope.category_current ? $scope.category_current.id : 0;
        $http.post('/category/edit', {'father': father_id, 'name': name})
        .then((res)=>{
            if (errorCheck(res)) return ;
            toastr.success('success');

            var ret = res.data.message;
            locals.set('/category/edit/sel', ret.id);
            var expandids = locals.getObject('/category/edit/exp');

            if (!expandids.length)
            {
                expandids = [ father_id ];
            }
            else if (expandids.indexOf(ret.id) == -1)
            {
                if (expandids.indexOf(father_id) == -1)
                    expandids.push(father_id);
            }

            locals.setObject('/category/edit/exp', expandids);
            tree_refresh();
        });
    }
}