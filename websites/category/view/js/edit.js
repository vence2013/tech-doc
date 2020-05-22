var app = angular.module('editApp', ['treeControl', 'ngAnimate'])

loadResource(app).controller('editCtrl', editCtrl);

function editCtrl($scope, $http, locals) 
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

    /* edit info */
    $scope.name = '';
    $scope.subname = '';

    $('.category-edit').height($(document).height() - 80);
    $('.category-edit-result').height($(document).height() - 300);
    $('.category-edit').bind({
        'mouseenter': ()=>{ $('.category-edit').css({'opacity':1.0}); },
        'mouseleave': ()=>{ $('.category-edit').css({'opacity':0.0}); }
    });

    treeRefresh();

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

    function treeRefresh() {
        
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
                detail(id);
            }
        });
    }

    function reset()
    {
        $scope.name = '';
        $scope.subname = '';
    }

    function detail(node_id)
    {
        $scope.subname = '';

        if (/^[0-9]*$/.test(node_id))
        {
            $http.get('/category/edit/info/'+node_id).then((res)=>{
                if (errorCheck(res)) return ;

                var ret = res.data.message;
                if (ret)
                {
                    $scope.name = ret.name;
                }
            });
        }
        else
        {
            reset();
        }
    }

    $scope.select = (node, sel) => {
        if (sel)
        {
            detail(node.id);
            locals.set('/category/edit/sel', node.id);
        }
        else
        {
            reset();
            locals.set('/category/edit/sel', undefined);
        }
    }

    $scope.toggle = (node, expanded) => {
        /* 更新展开的节点列表 */
        var ids = $scope.listExpand.map(node => { return node.id; });
        locals.setObject('/category/edit/exp', ids);
    }

    /* edit -----------------------------------------------------------------*/

    $scope.add = ()=>{
        var name = $scope.subname.replace(/^\s+|\s+$/g,'');
        if (!name) { return toastr.warning('请输入有效的目录名称！'); }

        var father_id = $scope.nodeSelected ? $scope.nodeSelected.id : 0;
        $http.post('/category/edit', {
            'father': father_id, 'name': name
        }).then((res)=>{
            if (errorCheck(res)) return ;

            var ret = res.data;
            if (ret.error)
            {
                toastr.error(ret.message);
            }
            else
            {
                toastr.success('success');
                locals.set('/category/edit/sel', ret.message.id);
                var expandids = locals.getObject('/category/edit/exp');
                if (expandids.indexOf(ret.message.id) == -1)
                {
                    expandids.push(father_id);
                    locals.setObject('/category/edit/exp', expandids);
                }
                treeRefresh();
            }
        });
    }


    $scope.edit = ()=>{        
        var name = $scope.name.replace(/^\s+|\s+$/g,'');
        if (!name) { return toastr.warning('请先选择要编辑的节点！'); }
        
        $http.put('/category/edit/'+$scope.nodeSelected.id, {
            'name': name
        }).then((res)=>{
            if (errorCheck(res)) return ;

            var ret = res.data;
            if (ret.error)
            {
                toastr.error(ret.message);
            }
            else
            {
                toastr.success('success');
            }
            treeRefresh();
        });
    }

    $scope.delete = () => {
        $http.delete('/category/edit/'+$scope.nodeSelected.id).then((res)=>{
            if (errorCheck(res)) return ;

            var ret = res.data;
            if (ret.error)
            {
                toastr.error(ret.message);
            }
            else
            {
                toastr.success('success');
            }
            treeRefresh();            
        });
    }
}