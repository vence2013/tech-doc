var app = angular.module('displayApp', [])

loadResource(app).controller('displayCtrl', displayCtrl);

function displayCtrl($scope, $http) 
{
    $scope.detail = null;

    var docid   = $('.wrapper').attr('docid');

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

    function detail() {
        $http
        .get('/document/detail/'+docid)
        .then((res)=>{
            if (errorCheck(res)) return ;
            
            $scope.detail = res.data.message;
            editor.setMarkdown($scope.detail.content); 
        })
    }
}