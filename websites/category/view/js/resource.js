var app = angular.module('resourceApp', ['treeControl', 'ngAnimate'])

loadResource(app).controller('resourceCtrl', resourceCtrl);

function resourceCtrl($scope, $http, $timeout, locals) 
{
    /* 目录 -------------------------------------------------------------------*/

    $scope.treeRoot = [];
    $scope.listRoot = [];
    $scope.treeView = [];
    $scope.listView = [];
    $scope.listExpand = [];
    $scope.treeOptions = {dirSelectable: true};
    $scope.predicate = "";
    $scope.comparator = false;

    tree_refresh();

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
            var expandids = locals.getObject('/category/link/exp');
            if (expandids.length) {
                var expand = [];
                $scope.listView.map((x)=>{ 
                    if (expandids.indexOf(x.id)!=-1) 
                        expand.push(x); 
                });
                $scope.listExpand = expand;
            }

            // 恢复选中节点
            var id = locals.get('/category/link/sel');
            var node = search_node_by_id(id);
            if (node)
            {
                $scope.nodeSelected = node;
                resource_get();
            }
        });
    }

    $scope.select = (node, sel) => 
    {    
        if (sel)
        {
            locals.set('/category/link/sel', node.id);
        }
        else
        {
            locals.set('/category/link/sel', undefined);
        }

        $timeout(resource_get, 200);
    }

    /* 资源 -------------------------------------------------------------------*/

    var cfg_resource_max = 22;

    $scope.list_document = null;
    $scope.list_file = null;

    // 恢复tab选中
    var tab_display = locals.get('/category/link/tab');
    $('#resourceTab li:'+(('file' == tab_display) ? 'last-child' : 'first-child')+' a').tab('show');   

    $scope.resource = resource = {'page':1, 'size':cfg_resource_max, 'str':'', 'link':true};
    $scope.$watch('resource', resource_get, true);

    function get_documents()
    {
        var str = $scope.resource.str;
        var categoryid = $scope.nodeSelected ? $scope.nodeSelected.id : 0;
        var params = {'str':str, 'link':$scope.resource.link, 'page':$scope.resource.page, 'size':cfg_resource_max};

        $http.get('/category/document/'+categoryid, {'params': params}).then((res)=>{
            if (errorCheck(res)) return ;

            var ret = res.data.message;
            /* 提取文章标题 
             * 1. 去除开头的#和换行符(\n)
             * 2. 查找下一个换行符前的字符串
             */
            for (var i = 0; i < ret.list.length; i++) {
                var title = '';

                var content = ret.list[i].content;
                var str = content.replace(/^[\\n#\ \t]*/, '');
                if (/[^\n]+/.test(str))
                {
                    title = str.match(/[^\n]+/)[0];
                }
                else
                {
                    title = str.substr(0, 100);
                }                
                ret.list[i]['title'] = title;
            }
        
            $scope.list_document = ret.list;
            $scope.resource.page = ret.page;
        })
    }

    function get_files()
    {
        var str = $scope.resource_search;
        var categoryid = $scope.nodeSelected ? $scope.nodeSelected.id : 0;        
        var params = {'str':str, 'link':$scope.resource.link, 'page':$scope.resource.page, 'size':cfg_resource_max};

        $http.get('/category/file/'+categoryid, {'params': params}).then((res)=>{
            if (errorCheck(res)) return ;

            var ret = res.data.message;        
            $scope.list_file = ret.list;
            $scope.resource.page = ret.page;
        })
    }

    // 根据选项卡显示资源
    $scope.resource_get = resource_get;

    function resource_get()
    {    
        if ('file' == tab_display) get_files();
        else get_documents();
    }


    $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {        
        $scope.resource.page = 1;

        tab_display = $(e.target).attr('href').substr(1);
        locals.set('/category/link/tab', tab_display);
        resource_get( tab_display );
    })

    $scope.resource_focus = resource_focus;
    function resource_focus(index)
    {
        var img_type = resource.link ? 'folder_remove' : 'folder_add';

        $(".resource_list>div>img").prop('src', 'images/folder.png');
        if ($scope.nodeSelected)
            $(".resource_list>div:eq("+index+")>img").prop('src', 'images/'+img_type+'.png');
    }

    $scope.resource_link_document = (rid) =>
    {
        var categoryid = $scope.nodeSelected ? $scope.nodeSelected.id : 0;
        var link = $scope.resource.link;
        var params = {'id': rid, 'link':link};
        $http.post('/category/document/'+categoryid, params).then((res)=>{
            if (errorCheck(res)) return ;
 
            resource_get();
        });
    }

    $scope.resource_link_file = (rid) =>
    {
        var categoryid = $scope.nodeSelected ? $scope.nodeSelected.id : 0;
        var link = $scope.resource.link;
        var params = {'id': rid, 'link':link};
        $http.post('/category/file/'+categoryid, params).then((res)=>{
            if (errorCheck(res)) return ;
 
            resource_get();
        });
    }
}