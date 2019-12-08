var app = angular.module('editApp', [])

loadResource(app).controller('editCtrl', editCtrl);

function editCtrl($scope, $http) 
{
    // 标签数据    
    $scope.tagopts = tagopts = {'str':'', 'limit':50};    
    $scope.taglink = []; // 关联标签
    $scope.taglist = []; // 搜索结果列表

    var editor = editormd("editormd", {
        path : '/node_modules/editor.md/lib/',
        width: '100%',
        height: 800,
        toolbarIcons : function() {
            return editormd.toolbarModes['simple']; // full, simple, mini
        },
    });  

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