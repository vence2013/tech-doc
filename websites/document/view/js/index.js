var app = angular.module('indexApp', [])

loadResource(app).controller('indexCtrl', indexCtrl);

function indexCtrl($scope, $http) 
{
    // 标签数据    
    $scope.tagopts = tagopts = {'str':'', 'limit':50};    
    $scope.taglink = []; // 关联标签
    $scope.taglist = []; // 搜索结果列表
    // 文档搜索
    $scope.opts = opts = {'page':1, 'pageSize':24, 'str':'', 'tag':'', 'createget':'', 
        'createlet':'', 'order':'1'};
    $scope.page = pageSet(0, opts.pageSize, 10, 0);

    var tagUpdateTimer = null;
    $scope.$watch('tagopts', ()=>{
        /* 避免在输入过程中频繁请求服务器 */
        if (tagUpdateTimer)
            window.clearTimeout(tagUpdateTimer);
        tagUpdateTimer = window.setTimeout(tagUpdate, 500);            
    }, true);
    $scope.$watch('taglink', ()=>{
        tagUpdate();
        docUpdate();
    }, true);

    var docUpdateTimer = null;
    $scope.$watch('opts', ()=>{
        /* 避免在输入过程中频繁请求服务器 */
        if (docUpdateTimer)
            window.clearTimeout(docUpdateTimer);
        docUpdateTimer = window.setTimeout(docUpdate, 500);  
    }, true);


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


    function tagUpdate()
    {
        tagUpdateTimer = null;

        var query = angular.copy(tagopts);
        query['except'] = $scope.taglink;

        $http.get('/tag/except', { params: query }).then((res)=>{
            if (errorCheck(res)) 
                return ;

            $scope.taglist = res.data.message; 
        })        
    }

    $scope.tagSelect = (name) => {
        $scope.taglink.push(name);
    }

    $scope.tagUnselect = (name) => {
        var idx = $scope.taglink.indexOf(name);
        $scope.taglink.splice(idx, 1);
    }
}