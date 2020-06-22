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
        'mouseleave': ()=>{ $('.category-edit').css({'opacity':0.5}); }
    });

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
                detail(id);
            }
        });
    }

    $scope.resource = {'size':100, 'search':'', 'categoryid':0, 'belong':false};
    $scope.$watch('resource', resource_refresh, true);

    function resource_refresh()
    {
        $http.get('/category/resource', { 'params': $scope.resource })
        .then((res)=>{
            if (errorCheck(res)) return ;

            var ret = res.data.message;
            /* 如果是目录所属的资源，则按名称和类型排序 */
            if ($scope.resource.belong)
            {
                ret = ret.sort((a,b)=> { 
                    if (a.type != b.type)
                    {
                        return (b.type > a.type) ? -1 : 0;
                    }
                    return  (b.name > a.name) ? -1 : 0; 
                })
            }
            $scope.reslist = ret;
        })
    }

    function reset()
    {
        $scope.name = '';
        $scope.subname = '';
        $scope.resource.belong = false;
        $scope.resource.categoryid = 0;
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
                    $scope.resource.search = '';
                    $scope.resource.belong = true;
                    $scope.resource.categoryid = ret.id;
                }
                else
                {
                    reset();
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

    /* relation -------------------------------------------------------------*/

    $scope.relation_update = ()=>{
        var resource = [];
        $('.category-edit-result>div>div>input:checkbox:checked').each((i, e)=>{
            resource.push($(e).attr('id'));
        });

        $http.post('/category/resource', {
            'categoryid':$scope.resource.categoryid, 'belong':$scope.resource.belong, 'resources':resource
        }).then((res)=>{
            if (errorCheck(res)) return ;

            resource_refresh();
        })
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
                tree_refresh();
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
            tree_refresh();
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
            tree_refresh();            
        });
    }
}