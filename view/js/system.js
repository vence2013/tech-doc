var app = angular.module('systemApp', [])

loadResource(app).controller('systemCtrl', systemCtrl);

function systemCtrl($scope, $http, $interval) {
    var datestr = (new Date()).format("yyyyMMddhhmmss");

    $scope.backup_filename = "backup_techdoc-data_"+datestr;
    $scope.backup_file = null;

    var timer_query = null;
    var previous_message = '';

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