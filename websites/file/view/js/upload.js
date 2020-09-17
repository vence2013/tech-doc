var app = angular.module('uploadApp', ['angularFileUpload', 'angular-clipboard'])

loadResource(app).controller('uploadCtrl', uploadCtrl);

function uploadCtrl($scope, $http, FileUploader) 
{
    /* 标签 ---------------------------------------------------------------------
     * 实现参考document/edit，不同点：
     *     标签搜索框输入空格后，即将该标签关联到选中文件
     */
    var cfg_tag_list_max = 50;

    $scope.tag_input = '';
    $scope.tag_input_valid = [];
    $scope.tag_display = [];

    $scope.$watch('tag_input', tag_parse);

    function tag_parse()
    {
        var str = $scope.tag_input;
        var fmt = str.replace(/\s+/g, ' ');
        var trm = fmt.replace(/^\s*(.*?)\s*$/, "$1");
        /* 如果最后一个字符为空格，则将已输入的标签关联到选中文件 */
        if (trm && (str[str.length-1] == ' ')) 
        {
            tag_select(trm);
            $scope.tag_input = '';
        }
        else 
        {
            tag_search();
        }
    }

    function tag_search()
    {
        var str   = $scope.tag_input ? $scope.tag_input.split(' ').pop() : '';
        var size  = cfg_tag_list_max + $scope.tag_input_valid.length;
        var query = {'str':str, 'size':size};

        $http.get('/tag/search', {params:query }).then((res)=>{
            if (errorCheck(res)) return ;

            var ret = res.data.message;
            /* 将结果中已选择的标签滤除 */
            var list = [];
            for (i=0; (i<cfg_tag_list_max) && (i<ret.list.length); i++)
            {
                var t = ret.list[i].name;
                if ($scope.tag_input_valid.indexOf(t) == -1) list.push(t);
            }
            $scope.tag_display = list;
        })  
    }

    $scope.tag_select = tag_select;
    function tag_select(name) 
    {
        // 选中文件后，操作标签才有效
        if ($('.file_checkbox:checked').length == 0) return;

        // 关联标签到选中文件
        for (i=0; i<uploader.queue.length; i++)
        {
            if ($('.file_checkbox:eq('+i+')').prop('checked'))
            {
                if (uploader.queue[i]['tags'])  
                    uploader.queue[i]['tags'].push(name);
                else
                    uploader.queue[i]['tags'] = [ name ];
            }
                
        }

        $scope.tag_input_valid.push(name);
        tag_search(); /* 重新搜索，滤除已选择标签 */
    }

    $scope.tag_unselect = (name) => {
        // 选中文件后，操作标签才有效
        if ($('.file_checkbox:checked').length == 0) return;
    
        var tags = [];        
        for (i=0; i<uploader.queue.length; i++)
        {
            // 搜集所有文件的标签
            var tags_inner = uploader.queue[i]['tags'];
            tags = tags.concat(tags_inner);

            // 取消标签到选中文件的关联
            if ($('.file_checkbox:eq('+i+')').prop('checked'))
            {
                if (uploader.queue[i]['tags'])
                {
                    var idx = tags_inner.indexOf(name);
                    if (idx != -1) uploader.queue[i]['tags'].splice(idx, 1);
                }
            }
        }

        // 从新收集选中文件的关联标签，并更新到选中标签的数组
        $.unique(tags.sort())
        $scope.tag_input_valid = tags;

        tag_search(); /* 重新搜索，滤除已选择标签 */
    }


    /* 文件上传 -------------------------------------------------------------*/

    var cfg_file_list_max = 20;

    // 上传成功后删除记录
    var uploader = $scope.uploader = new FileUploader({
        url: '/file/upload', 'queueLimit': cfg_file_list_max, removeAfterUpload: true
    })    
    uploader.filters.push({ name: 'syncFilter',
        fn: function(item, options) { 
            // 限制上传的数量
            if (this.queue.length >= cfg_file_list_max) return false; 

            // 取消已存在(文件名/大小相同)的文件
            for (var i=0; i<this.queue.length; i++) {
                if ((this.queue[i]._file.name === item.name) && 
                    (this.queue[i]._file.size===item.size)) 
                    return false;
            }
            return true;
        }
    });
    uploader.onSuccessItem = function(fileItem, response, status, headers) {
        // 显示错误信息
        if (/^[\-0-9]+$/.test(response.error)) {
            $scope.itemSel = null;
            if (response.error != 0) {
                toastr.error(response.message+'('+fileItem.file.name+')', '', 
                    {"positionClass": "toast-bottom-right", "timeOut": 5000}); 
            }
        } else {
            console.log(response);
            toastr.error('文件上传错误！');            
        }
    };

    $scope.check_all = false;
    $scope.check_all_click = () =>
    {
        var current_check = !$scope.check_all;

        $(".file_checkbox").prop("checked", current_check);
    }

    $scope.file_remove = () =>
    {
        var objs = [];
        for (i=0; i<uploader.queue.length; i++)
        {
            if ($('.file_checkbox:eq('+i+')').prop('checked')) objs.push(uploader.queue[i]);
        }

        for (i=0; i<objs.length; i++) objs[i].remove();
    }
}