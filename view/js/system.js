var app = angular.module('systemApp', ['angularFileUpload'])

loadResource(app).controller('systemCtrl', systemCtrl);

function systemCtrl($scope, $http, $interval, FileUploader) {
    var datestr = (new Date()).format("yyyyMMddhhmmss");

    $scope.backup_filename = "backup_techdoc-data_"+datestr;
    $scope.backup_file = null;

    var timer_query = null;
    var previous_message = '';

    $('.data-content').height($(document).height() - 250);
    var uploader = $scope.uploader = new FileUploader({
        url: '/restore/upload', 'queueLimit': 1, removeAfterUpload: true
    })
    uploader.onAfterAddingFile = function(fileItem) {
        var file = fileItem.file;
        var fmtsize = '';

        if (file.size < 1024)
        {
            fmtsize = file.size + 'Byte'
        }
        else if ((file.size/1024) < 1024)
        {
            fmtsize = Math.ceil(file.size/1024) + 'KB'
        }
        else if ((file.size/1024/1024) < 1024)
        {
            fmtsize = Math.ceil(file.size/1024/1024) + 'MB'
        }

        $('#restore_file_name').text(file.name);
        $('#restore_file_size').text(fmtsize);
        $('#restore_file_last_modify').text((new Date(file.lastModifiedDate)).format("yyyy-MM-dd hh:mm:ss"));
    }
    uploader.onBeforeUploadItem = function(fileItem) {
        $('#restore_wait').removeClass('d-none');
    }
    // 上传成功后删除记录
    uploader.onSuccessItem = function(fileItem, response, status, headers) {
        if (/^[\-0-9]+$/.test(response.error)) {
            $scope.itemSel = null;
            if (response.error != 0) {
                toastr.info(response.message+'('+fileItem.file.name+')', '', 
                    {"positionClass": "toast-bottom-right", "timeOut": 5000}); 
            } else {
                /* 请求数据恢复过程 */
                timer_query = $interval(restore_request, 3000);
            }            
        } else {
            console.log(response);
            toastr.info('文件上传错误！');            
        }
    };

    function restore_request()
    {
        $http.get('/restore').then((res)=>{
            if (errorCheck(res)) 
                return ;
            
            var msgs = res.data.message;
            if (msgs.length == 3) 
            {
                $interval.cancel(timer_query);
                $('#restore_wait').addClass('d-none');
            }
            console.log(msgs);
            $('.data-log').html('');
            msgs.forEach(msg => {
                $('.data-log').append("<div>"+msg+"</div>");
            });
        });
    }

    $http.get('/backup/file').then((res)=>{
        if (!res.data.error)
        {
            // console.log(ret);
            $scope.backup_file = res.data.message;            
        }
    });

    function backup_message()
    {
        $http.get('/backup/status').then((res)=>{
            if (errorCheck(res)) 
                return ;
            
            var ret = res.data.message;
            if (ret != previous_message)
            {
                previous_message = ret;
                $('.backup_message').append("<div class='info_log'>"+ret+"</div>");
            }
            
            if ('success' == ret)
            {
                $interval.cancel(timer_query);
            }
        });
    }

    $scope.backup = () =>{
        $http.get('/backup?filename='+$scope.backup_filename).then((res)=>{
            if (errorCheck(res)) 
                return ;
            
            $('.backup_message').html("<div class='info_log'>"+res.data.message+"</div>");
        });

        /* timer query backup status */
        timer_query = $interval(backup_message, 1000);
    }
}