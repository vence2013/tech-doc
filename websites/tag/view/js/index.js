var app = angular.module('indexApp', [])

loadResource(app).controller('indexCtrl', indexCtrl);

function indexCtrl($scope, $http) 
{
    $scope.opts = opts = {'search':'', 'page':1, 'pageSize':100};
    $scope.page = pageSet(0, opts.pageSize, 10, 0);
    $scope.taglist = [];
    $scope.tagname = '';
    $scope.tagsel  = false;

    $('.tag-view').height($(document).height() - 100);
    $('.tag-edit').bind({
        'mouseenter': ()=>{ $('.tag-edit').css({'opacity':1.0}); },
        'mouseleave': ()=>{ $('.tag-edit').css({'opacity':0.5}); }
    });

    $scope.$watch('opts', tag_refresh, true);

    function tag_refresh()
    {
        $http.get('/tag/search', {params: $scope.opts})
        .then((res)=>{
            if (errorCheck(res)) 
                return ;

            var ret = res.data.message;
            $scope.taglist = ret.list;
            $scope.page = pageSet(ret.total, opts.pageSize, 10, ret.page);
        })        
    }

    $scope.add = () => {
        var name = $scope.tagname.replace(/^\s+|\s+$/g,'');
        if (!name) { return toastr.warning('请输入有效标签！'); }

        $http.post('/tag', {'name': name})
        .then((res)=>{
            if (errorCheck(res)) return ;  

            tag_refresh();
            $scope.tagname = '';
            toastr.success('创建成功！');            
        })      
    }

    $scope.delete = () => {
        var tagsel = $('.tag-view>div>.badge-success').attr('title');

        $http.delete('/tag/'+tagsel).then((res)=>{
            tag_refresh();
            toastr.success('删除成功！');   
        })
    }

    /* 再次点击已选中的标签，则取消选中 */
    $scope.select = (name) => {
        var tagsel = $('.tag-view>div>.badge-success').attr('title');

        $scope.tagsel = false;
        $('.badge-success').removeClass('badge-success').addClass('badge-secondary');
        if (!tagsel || (name != tagsel))
        {
            $scope.tagsel = true;
            $("span[title='"+name+"']").removeClass('badge-secondary').addClass('badge-success');
        }
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