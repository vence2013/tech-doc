var app = angular.module('editApp', [])

loadResource(app).controller('editCtrl', editCtrl);

function editCtrl($scope, $http) 
{
    var editor = editormd("editormd", {
        path : '/node_modules/editor.md/lib/',
        width: '100%',
        height: 800,
        toolbarIcons : function() {
            return editormd.toolbarModes['simple']; // full, simple, mini
        },
    });  
}