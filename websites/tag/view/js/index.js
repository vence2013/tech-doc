var app = angular.module('indexApp', [])

loadResource(app).controller('indexCtrl', indexCtrl);

function indexCtrl($scope, $http) 
{
    $scope.opts = opts = {'str':'', 'page':1, 'pageSize':100};
    $scope.page = pageSet(0, opts.pageSize, 10, 0);    
    $scope.taginfo = null;
    $scope.tagdocs = [];
    $scope.taglist = [];

    var updateTimer = null;
    /* 视图更新包括：当前标签的信息（记录，关联文章）， 相关标签的列表。
     * 以下条件更新视图：str更新； page改变
     */
    $scope.$watch('opts', ()=>{
        /* 避免在输入过程中频繁请求服务器 */
        if (updateTimer)
            window.clearTimeout(updateTimer);
        updateTimer = window.setTimeout(update, 500);            
    }, true);

    function update()
    {
        updateTimer = null;

        $http.get('/tag/search', {
            params: $scope.opts
        }).then((res)=>{
            if (errorCheck(res)) 
                return ;

            var ret = res.data.message; 
            $scope.taginfo = ret.tag;
            $scope.tagdocs = ret.docs;
            $scope.taglist = ret.list;
            $scope.page = pageSet(ret.total, opts.pageSize, 10, ret.page);
        })        
    }

    $scope.add = () => {
        var name = $scope.opts.str.replace(/^\s+|\s+$/g,'');
        if (!name) { return toastr.info('请输入有效标签！'); }

        $http.post('/tag', {
            'name': name
        }).then((res)=>{
            if (errorCheck(res)) return ;  

            $scope.opts['str'] = ''; 
            toastr.success('创建成功！');

            update();
        })      
    }

    $scope.delete = () => {
        $http.delete('/tag/'+$scope.opts.str).then((res)=>{ 
            opts.str = '';
            $scope.taginfo = null;
            toastr.success('删除成功！');

            update();             
        })
    }

    /* 再次点击已选中的标签，则取消选中 */
    $scope.select = (name) => {
        if (name == opts.str)
            opts.str = '';
        else
            opts.str = name;
        
        update();
    }

    $scope.pageGoto = '';
    $scope.pageJump = () => {
        var num = parseInt($scope.pageGoto);
        if (!num || (num <= 0) || (num > $scope.page.max))
            return toastr.warning('请输入有效页码！');
        
        $scope.pageGoto = '';
        opts.page = num;
    }
}