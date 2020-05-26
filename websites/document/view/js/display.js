var app = angular.module('displayApp', [])

loadResource(app).controller('displayCtrl', displayCtrl);

function displayCtrl($scope, $http) 
{
    $scope.docinfo = null;

    var docid = $('.doc-display').attr('docid');

    var editor = editormd("editormd", { 
        path : '/node_modules/editor.md/lib/',
        width : '100%',             
        tocContainer : ".TOC",
        tocDropdown  : false,        
        onload : function() { 
            this.previewing(); 
            $('#editormd').find('.editormd-preview-close-btn').remove();

            detail();
        }    
    }); 

    $('.doc-display>.row>div').height($(document).height() - 70);

    function detail() {
        $http.get('/document/detail/'+docid).then((res)=>{
            if (errorCheck(res)) return ;
            
            var ret = res.data.message;
            $scope.docinfo = ret;
            editor.setMarkdown($scope.docinfo.content); 
        })
    }
}