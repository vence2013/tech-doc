var app = angular.module('bitsApp', [])

loadResource(app).controller('bitsCtrl', bitsCtrl);

function bitsCtrl($scope, $http, locals) 
{
    var emptyChip = {'id':0, 'name':'', 'width':''},
        emptyModule = {'id':0, 'name':'', 'fullname':''},
        emptyRegister = {'id':0, 'name':'', 'fullname':'', 'address':'', 'desc':''},
        emptyBit = {'id':0, 'name':'', 'fullname':'', 'bitlist':'', 'valuelist':'', 'rw':'', 'desc':''};

    $scope.chip     = null;
    $scope.module   = null;
    $scope.register = null;
    $scope.bits     = null;
    $scope.chiplist     = [];
    $scope.modulelist   = [];
    $scope.registerlist = [];
    $scope.bitslist     = [];


    /* 模块 ******************************************************************/

    $scope.moduleEdit = (create) => {
        var chipid, id, name;

        chipid = $scope.chip.id;
        if (!chipid)
            return toastr.warning('请选择模块属于的芯片！');

        if (create)
        {
            var name = $scope.module.name;
            if (!name) return toastr.warning('请输入有效的模块名称！');

            $scope.module['id'] = 0;  // 清除ID信息，服务端才能进行添加
        } else {
            var id = $scope.module.id;
            if (!id) return toastr.warning('请选择需要编辑的模块！');
        }
        
        $http.post('/chip/module/'+chipid, $scope.module).then((res)=>{
            if (errorCheck(res)) return ; 

            toastr.success(res.data.message);
            modulesGet(name);
        });
    }

    $scope.moduleDelete = () => {
        if (!/^\d+$/.test($scope.module.id)) return toastr.warning('请选择要删除的模块！');

        $http.delete('/chip/module/'+$scope.module.id).then((res)=>{
            if (errorCheck(res)) return ; 

            toastr.success(res.data.message);
            $scope.module = angular.copy(emptyModule);   
            modulesGet();            
        });
    }

    $scope.moduleSelect = moduleSelect;

    function moduleSelect(module)
    {
        $scope.module = angular.copy(module);
        locals.set('/chip/bits/modulesel', module.id);
        
        $(".moduleContainer>.badge-success").removeClass('badge-success').addClass('badge-dark');
        window.setTimeout(()=>{
            var idx = $scope.modulelist.indexOf(module);
            $(".moduleContainer>span:eq("+idx+")").removeClass('badge-dark').addClass('badge-success');
        }, 0);

        //getRegisterList();
    }

    function modulesGet(namePreselect)
    {
        $http.get('/chip/module/chip/'+$scope.chip.id).then((res)=>{
            if (errorCheck(res)) return ;

            var ret = res.data.message;
            $scope.modulelist = ret;            
            if (ret.length) {
                if (namePreselect) {
                    for (var i=0; (i<ret.length) && (ret[i].name!=namePreselect); i++) ;
                    if (i<ret.length) {
                        moduleSelect(ret[i]);
                    }
                } else {
                    var moduleidPrevious = locals.get('/chip/bits/modulesel');
                    if (moduleidPrevious) {
                        for (var i = 0; (i < ret.length) && (ret[i].id != moduleidPrevious); i++) ;
                        if (i < ret.length) {
                            moduleSelect(ret[i]);
                        }
                    } else { // 默认选择第一个
                        moduleSelect(ret[0]);
                    }
                }
            } else {
                // 没有任何模块时，需要清除所有后续元素：模块编辑， 寄存器列表，编辑， 位组列表， 编辑
                $scope.module   = angular.copy(emptyModule);                
                $scope.register = angular.copy(emptyRegister);                
                $scope.bit      = angular.copy(emptyBit);
                $scope.registerlist = [];
                $scope.bitslist     = [];
            }
        })
    }


    /* 芯片 ******************************************************************/

    $scope.chipEdit = (create)=>{
        var id, name;

        if (create)
        {
            name  = $scope.chip.name;
            if (!name || !/^\d+$/.test($scope.chip.width)) 
                return toastr.warning('请输入有效的芯片参数！');
        } else {
            id = $scope.chip.id;
            if (!id) return toastr.warning('请选择需要编辑的芯片！');
        }

        $http.post('/chip/chip/'+id, $scope.chip).then((res)=>{
            if (errorCheck(res)) return ; 

            toastr.success(res.data.message);
            chipsGet(name);            
        });
    }

    $scope.chipDelete = () => {
        if (!/^\d+$/.test($scope.chip.id)) return toastr.warning('请选择要删除的芯片！');

        $http.delete('/chip/chip/'+$scope.chip.id).then((res)=>{
            if (errorCheck(res)) return ; 

            toastr.success(res.data.message);
            $scope.chip = angular.copy(emptyChip); 
            chipsGet();            
        });
    }

    $scope.chipSelect = chipSelect;
    /* 选择某个芯片。
     * 需要进行的工作有：
     * 1. 更新数据：选中的芯片
     * 2. 更新显示：选中的芯片
     * 3. 更新模块列表
     */
    function chipSelect(chip)
    {
        $scope.chip = angular.copy(chip);
        locals.set('/chip/bits/chipsel', chip.id);
        
        $(".chipContainer>.badge-success").removeClass('badge-success').addClass('badge-dark');
        window.setTimeout(()=>{
            var idx = $scope.chiplist.indexOf(chip);
            $(".chipContainer>span:eq("+idx+")").removeClass('badge-dark').addClass('badge-success');
        }, 0);
        
        modulesGet();
    }

    /* 获取芯片列表
     * 1. 获取并更新芯片列表数据
     * 2. 默认选择第1个芯片
     * 
     * 说明： 允许预先选择某个芯片，应用于：新增芯片后选中
     */
    function chipsGet(namePreselect) {
        $http.get('/chip/chip').then((res)=>{
            if (errorCheck(res)) return ;

            var ret = res.data.message;
            $scope.chiplist = ret;  

            if (ret.length) {
                if (namePreselect) {
                    for (var i=0; (i<ret.length) && (ret[i].name!==namePreselect); i++) ;
                    if (i<ret.length) {
                        chipSelect(ret[i]);
                    }
                } else { 
                    var chipidPrevious = locals.get('/chip/bits/chipsel');
                    if (chipidPrevious) {  // 恢复上次的选择
                        for (var i = 0; (i < ret.length) && (ret[i].id != chipidPrevious); i++) ;
                        if (i < ret.length) {
                            chipSelect(ret[i]);
                        }
                    } else { // 默认选择第一个
                        chipSelect(ret[0]);
                    }
                }
            } else {
                $scope.chip     = angular.copy(emptyChip);                
                $scope.module   = angular.copy(emptyModule);                
                $scope.register = angular.copy(emptyRegister);                
                $scope.bit      = angular.copy(emptyBit);
                $scope.modulelist   = [];
                $scope.registerlist = [];
                $scope.bitslist     = [];
            }
        })
    }
    chipsGet();
}