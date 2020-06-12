var app = angular.module('indexApp', [])

loadResource(app).controller('indexCtrl', indexCtrl);

function indexCtrl($scope, $http) 
{
    /* 标签 -----------------------------------------------------------------*/

    $scope.tagopts = tagopts = {'str':'', 'limit':50};    
    $scope.taglink = []; // 关联标签
    $scope.taglist = []; // 搜索结果列表

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

    function tagUpdate()
    {
        tagUpdateTimer = null;

        var query = angular.copy(tagopts);
        query['except'] = $scope.taglink;

        $http.get('/tag/except', { params: query }).then((res)=>{
            if (errorCheck(res)) return ;

            var ret = res.data.message; 
            $scope.taglist = ret.map((x)=>{ return x.name; });
        })        
    }

    $scope.tagSelect = (name) => {
        $scope.taglink.push(name);
    }

    $scope.tagUnselect = (name) => {
        var idx = $scope.taglink.indexOf(name);
        $scope.taglink.splice(idx, 1);
    }

    /* 文档 -----------------------------------------------------------------*/

    $scope.opts = opts = {'page':1, 'pageSize':24, 'str':'', 'tag':'', 'createget':'', 
        'createlet':'', 'order':'1'};
    $scope.page = pageSet(0, opts.pageSize, 10, 0);

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
            /* 提取文章标题 
             * 1. 去除开头的#和换行符(\n)
             * 2. 查找下一个换行符前的字符串
             */
            for (var i = 0; i < ret.list.length; i++) {
                var content = ret.list[i].content;
                var title   = content.replace(/^[\\n#\ \t]*/, '').match(/[^\n]+/)[0];
                ret.list[i]['title'] = title;
            }
            $scope.doclist = ret.list;
            $scope.page = pageSet(ret.total, opts.pageSize, 10, ret.page);        
        })
    }

    $scope.pageGoto = '';
    $scope.pageJump = () => {
        var num = parseInt($scope.pageGoto);
        if (!num || (num <= 0) || (num > $scope.page.max))
            return toastr.warning('请输入有效页码！');
        
        $scope.pageGoto = '';
        opts.page = num;
        docUpdate();
    }

    $scope.export = () => {
        var query = angular.copy($scope.opts);
        var createget = $scope.opts.createget;
        var createlet = $scope.opts.createlet;
        query['createget'] = (/^\d{4}(\-|\/|\.)\d{1,2}\1\d{1,2}$/.test(createget)) ? createget : '';
        query['createlet'] = (/^\d{4}(\-|\/|\.)\d{1,2}\1\d{1,2}$/.test(createlet)) ? createlet : '';
        query['tag'] = $scope.taglink;

        $http.get('/document/export', {params: query}).then((res)=>{
            if (errorCheck(res)) return ;
            
            var ret = res.data.message;
            window.open(ret+'?t='+Math.random());
        })
    }


    /* pre-set data ---------------------------------------------------------*/

    var str = $(".data_preset").text();
    if (str)
    {
        var arr = str.replace(/(^\s*)|(\s*$)/g, "").replace(/;*$/, "").split(';');
        var presets = {};
        for (var i=0; i<arr.length; i++)
        {
            var pair = arr[i].split(':');
            var val = pair[1].replace(/,*$/, "").split(',');
    
            //console.log('a', pair, val);
            switch (pair[0])
            {
                case 'tag':
                    $scope.taglink = val;
                    break;
            }        
        }
    }
}