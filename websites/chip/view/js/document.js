var app = angular.module('documentApp', [])

loadResource(app).controller('documentCtrl', documentCtrl);

function documentCtrl($scope, $http, $interval) 
{
    // 标签数据    
    $scope.tagopts = tagopts = {'str':'', 'limit':50};    
    $scope.taglink = ['芯片技术', '功能控制']; // 关联标签
    $scope.taglist = []; // 搜索结果列表
    // 位组数据
    $scope.bitslink = '';
    // 文档数据
    $scope.docid = docid = $('.wrapper').attr('docid');
    $scope.doc   = null;

    var content = '';
    var editor = editormd("editormd", {
        path : '/node_modules/editor.md/lib/',
        width: '100%',
        height: 800,
        toolbarIcons : function() {
            return editormd.toolbarModes['simple']; // full, simple, mini
        },
        onload : function() {
            // 获取编辑标签的内容
            if (docid!='0') { detail(); }
        }  
    });  
    $interval(()=>{ content = editor.getMarkdown(); }, 1000);

    var tagUpdateTimer = null;
    $scope.$watch('tagopts', ()=>{
        /* 避免在输入过程中频繁请求服务器 */
        if (tagUpdateTimer)
            window.clearTimeout(tagUpdateTimer);
        tagUpdateTimer = window.setTimeout(tagUpdate, 500);            
    }, true);
    $scope.$watch('taglink', tagUpdate, true);


    $scope.submit = ()=>{
        $http.post('/chip/document/'+docid, {
            'content':content, 'taglist':$scope.taglink, 'bitslist':$scope.bitslink
        }).then((res)=>{
            if (errorCheck(res)) return ;

            // 显示更新成功后，刷新该页面
            toastr.info("提交成功，即将跳转到首页！", '', {"positionClass": "toast-bottom-right"});
            window.setTimeout(()=>{ window.location.href = '/chip'; }, 1000);
        });
    }

    // 详细信息，包括文件属性， 关联标签
    function detail() {
        $http.get('/chip/document/detail/'+docid).then((res)=>{
            if (errorCheck(res)) return ;
            
            var ret = res.data.message;
            editor.setMarkdown(ret.content); 
            $scope.doc  = ret;
            $scope.taglink = ret.tagnames;
            $scope.bitslink = ret.bitsids.join(',');
        });
    }

    $scope.delete = ()=>{
        $http.delete('/document/'+docid).then((res)=>{
            if (errorCheck(res)) return ;

            toastr.info("删除成功，即将跳转到首页！", '', {"positionClass": "toast-bottom-right"});
            window.setTimeout(()=>{ window.location.href = '/chip'; }, 1000);
        });
    }

    function tagUpdate()
    {
        tagUpdateTimer = null;

        var query = angular.copy(tagopts);
        query['except'] = $scope.taglink;

        $http.get('/tag/except', { params: query }).then((res)=>{
            if (errorCheck(res)) 
                return ;

            var ret = res.data.message;
            $scope.taglist = ret.map((x)=>{ return x.name; });
        })        
    }

    $scope.tagSelect = (name) => {
        $scope.taglink.push(name);
    }

    $scope.tagUnselect = (name) => {
        if ((name == '芯片技术') || (name == '功能控制')) {
            alert("该页面只添加'芯片技术'/'功能控制'类别的文档！");
        } else {
            var idx = $scope.taglink.indexOf(name);
            $scope.taglink.splice(idx, 1);
        }
    }
}