var app = angular.module('indexApp', ['angularFileUpload'])

loadResource(app).controller('indexCtrl', indexCtrl);

function indexCtrl($scope, $http, FileUploader) 
{
    $scope.opts = opts = {'str':'', 'ext':'', 'createget':'', 'createlet':'', 
        'sizeget':'', 'sizelet':'', 'order':'4', 'page':1, 'pageSize':23};
    $scope.page = pageSet(0, opts.pageSize, 10, 0);
    $scope.filelist = [];

    var uploader = $scope.uploader = new FileUploader({
        url: '/file/upload', 'queueLimit': 30, removeAfterUpload: true
    })
    // 取消已存在(文件名/大小相同)的文件
    uploader.filters.push({ name: 'syncFilter',
        fn: function(item, options) { 
            if (this.queue.length >= 17) return false; // 限制上传的数量
            for (var i=0; i<this.queue.length; i++) {
                if ((this.queue[i]._file.name === item.name) && (this.queue[i]._file.size===item.size)) return false;
            }
            return true;
        }
    });
    // 上传成功后删除记录
    uploader.onSuccessItem = function(fileItem, response, status, headers) {
        if (/^[\-0-9]+$/.test(response.error)) {
            $scope.itemSel = null;
            if (response.error != 0) 
                toastr.info(response.message+'('+fileItem.file.name+')', '', {"positionClass": "toast-bottom-right", "timeOut": 5000}); 
            else
                update();
        } else {
            console.log(response);
            toastr.info('文件上传错误！');            
        }
    };


    var updateTimer = null;
    /* 以下条件更新视图：opts更新； page改变 */
    $scope.$watch('opts', ()=>{
        /* 避免在输入过程中频繁请求服务器 */
        if (updateTimer)
            window.clearTimeout(updateTimer);
        updateTimer = window.setTimeout(update, 500);            
    }, true);

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


    var delid = 0;
    $scope.selectDel = (id) => {
        delid = id;
    }

    $scope.delete = () => {
        $http.delete('/file/'+delid).then((res)=>{
            if (errorCheck(res)) return ;

            delid = 0;
            update();
        }); 
    }


    $scope.jump = () => {        
        $scope.opts.page = $scope.pagejump;
        $scope.pagejump = '';
    }
}