var app = angular.module('indexApp', ['angularFileUpload', 'angular-clipboard'])

loadResource(app).controller('indexCtrl', indexCtrl);

function indexCtrl($scope, $http, FileUploader) 
{
    /* 文件上传 -------------------------------------------------------------*/
    var queue_max_length = 17;

    var uploader = $scope.uploader = new FileUploader({
        url: '/file/upload', 'queueLimit': queue_max_length, removeAfterUpload: true
    })    
    uploader.filters.push({ name: 'syncFilter',
        fn: function(item, options) { 
            // 限制上传的数量
            if (this.queue.length >= queue_max_length) return false; 
            // 取消已存在(文件名/大小相同)的文件
            for (var i=0; i<this.queue.length; i++) {
                if ((this.queue[i]._file.name === item.name) && 
                    (this.queue[i]._file.size===item.size)) 
                    return false;
            }
            return true;
        }
    });
    // 上传成功后删除记录
    uploader.onSuccessItem = function(fileItem, response, status, headers) {
        if (/^[\-0-9]+$/.test(response.error)) {
            $scope.itemSel = null;
            if (response.error != 0) {
                toastr.info(response.message+'('+fileItem.file.name+')', '', 
                    {"positionClass": "toast-bottom-right", "timeOut": 5000}); 
            } else
                update();
        } else {
            console.log(response);
            toastr.info('文件上传错误！');            
        }
    };

    /* 文件搜索，删除 -------------------------------------------------------*/

    $scope.opts = opts = {'str':'', 'ext':'', 'createget':'', 'createlet':'', 
        'sizeget':'', 'sizelet':'', 'order':'4', 'page':1, 'pageSize':23};
    $scope.page = pageSet(0, opts.pageSize, 10, 0);
    $scope.filelist = [];

    var updateTimer = null;
    /* 以下条件更新视图：opts更新； page改变 */
    $scope.$watch('opts', ()=>{
        /* 避免在输入过程中频繁请求服务器 */
        if (updateTimer)
            window.clearTimeout(updateTimer);
        updateTimer = window.setTimeout(update, 500);            
    }, true);

    /* 文件搜索，参数有：文件名称，扩展名，上传时间范围，文件大小范围，排序方式 */
    function update() {
        var query = angular.copy($scope.opts);

        var createget = $scope.opts.createget;
        var createlet = $scope.opts.createlet;
        query['createget'] = (/^\d{4}(\-|\/|\.)\d{1,2}\1\d{1,2}$/.test(createget)) ? createget : '';
        query['createlet'] = (/^\d{4}(\-|\/|\.)\d{1,2}\1\d{1,2}$/.test(createlet)) ? createlet : '';

        $http.get('/file/search', {params: query}).then((res)=>{
            if (errorCheck(res)) 
                return ;

            var ret = res.data.message;
            $scope.filelist = ret.list;
            $scope.page = pageSet(ret.total, opts.pageSize, 10, ret.page);         
        })
    }

    /* 文件删除分为2步：
     * 1. 在点击删除后，记住文件ID，弹出确认窗口
     * 2. 确认删除后，请求服务器执行删除
     */
    $scope.delid = 0;
    $scope.selectDel = (id) => {
        $scope.delid = id;
    }

    $scope.delete = () => {
        $http.delete('/file/'+$scope.delid).then((res)=>{
            if (errorCheck(res)) return ;

            $scope.delid = 0;
            toastr.success('文件删除成功！');
            update();
        }); 
    }

    $scope.pageGoto = '';
    $scope.pageJump = () => {
        var num = parseInt($scope.pageGoto);
        if (!num || (num <= 0) || (num > $scope.page.max))
            return toastr.warning('请输入有效页码！');
        
        $scope.pageGoto = '';
        opts.page = num;
        update();
    }

    $scope.copySuccess = ()=>{
        toastr.success('已复制文件路径！');
    }
}