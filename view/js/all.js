function navCtrl($scope) {
    $scope.navlist = [
        {'name':'Tech-doc', 'url':'/'},
        {'name':'Tag', 'url':'/tag'},
        {'name':'Category', 'url':'/category'},
        {'name':'File', 'url':'/file', 'children':[
            {'name':'upload', 'url':'/file/view/upload.html'},
        ]},
        {'name':'Document', 'url':'/document', 'children':[
            {'name':'edit', 'url':'/document/edit/0'},
            {'name':'category', 'url':'/document/view/category.html'},
        ]},
        {'name':'Chip', 'url':'/chip', 'children':[
            {'name':'edit', 'url':''},
            {'name':'document', 'url':''},
        ]},
    ];
    $scope.sub = null; 

    // 菜单显示控制
    var subCloseTimer = null;
    $scope.subShow = (itm)=>{
        $scope.sub = itm.children;

        if (subCloseTimer) { subCloseTimer = window.clearTimeout(subCloseTimer); }
        // 获取一级菜单的位置
        var offset = $('#nav1').find("a[name='"+itm.name+"']").offset();
        $('#nav2').css({'display':'table', 'position':'absolute', 'top':40, 'left':offset.left});
    }
    $scope.subEnter = ()=>{
        if (subCloseTimer) { subCloseTimer = window.clearTimeout(subCloseTimer); }
    }
    $scope.subDelay = ()=>{
        subCloseTimer = window.setTimeout(()=>{ $('#nav2').css('display', 'none'); }, 1000);
    }
}

function loadResource(app)
{
    app.controller('navCtrl', navCtrl);

    return app;
}