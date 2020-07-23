var app = angular.module('editApp', [])

loadResource(app).controller('editCtrl', editCtrl);

function editCtrl($scope, $http, $interval) 
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
    $scope.$watch('taglink', tagUpdate, true);

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
        var idx = $scope.taglink.indexOf(name);
        $scope.taglink.splice(idx, 1);
    }

    /* 文档  ----------------------------------------------------------------*/

    $scope.docid  = docid = $('.layout2').attr('docid');
    $scope.docinfo= null;
    $scope.isEdit = (docid == '0') ? false : true;
    
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

    $scope.submit = ()=>{
        $http.post('/document/'+docid, {
            'content':content, 'taglist':$scope.taglink
        }).then((res)=>{
            if (errorCheck(res)) return ;

            // 显示更新成功后，刷新该页面
            toastr.success("操作成功！");
            window.setTimeout(()=>{ window.location.href = '/document/display/'+docid; }, 1000);
        });
    }

    // 详细信息，包括文件属性， 关联标签
    function detail() {
        $http.get('/document/detail/'+docid).then((res)=>{
            if (errorCheck(res)) return ;
            
            var ret = res.data.message;            
            $scope.docinfo = ret;
            $scope.taglink = ret.tagnames;
            editor.setMarkdown(ret.content); 
        });
    }

    $scope.delete = ()=>{
        $http.delete('/document/'+docid).then((res)=>{
            if (errorCheck(res)) return ;

            toastr.success("删除成功，即将返回首页！");
            window.setTimeout(()=>{ window.location.href = '/document'; }, 1000);
        });
    }

}