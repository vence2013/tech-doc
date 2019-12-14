var app = angular.module('editApp', [])

loadResource(app).controller('editCtrl', editCtrl);

function editCtrl($scope, $http, locals) 
{
    var emptyChip = {'id':0, 'name':'', 'width':''},
        emptyModule = {'id':0, 'name':'', 'fullname':''},
        emptyRegister = {'id':0, 'name':'', 'fullname':'', 'address':'', 'desc':''},
        emptyBits = {'id':0, 'name':'', 'fullname':'', 'bitlist':'', 'valuelist':'', 'rw':'', 'desc':''};

    $scope.chip     = null;
    $scope.module   = null;
    $scope.register = null;
    $scope.bits     = null;
    $scope.chiplist     = [];
    $scope.modulelist   = [];
    $scope.registerlist = [];
    $scope.bitslist     = [];


    /* 位组 ******************************************************************/

    $scope.bitsReset = bitsReset;

    function bitsReset() 
    {
        $scope.bits = angular.copy(emptyBits);
        $(".bitsContainer>.badge-success").removeClass('badge-success').addClass('badge-warning');
    }

    $scope.bitsEdit = (create) => {
        var i, regid, id, name, rw;

        regid = $scope.register.id;
        if (!regid)
            return toastr.warning('请选择位组属于的寄存器！');

        var bitlist   = $scope.bits.bitlist;
        var valuelist = $scope.bits.valuelist; 
        if (create)
        {
            name = $scope.bits.name;
            rw   = $scope.bits.rw;
            if (!name || !rw || !/^(\d+,)*\d+$/.test(bitlist) || !/^(.,)*.$/.test(valuelist)) 
                return toastr.warning('请输入有效的位组参数！');
        } else {
            id = $scope.bits.id;
            if (!id) return toastr.warning('请选择要编辑的位组！');
        }       

        var arr1 = bitlist.split(',');
        var arr2 = valuelist.split(',');
        if (arr1.length!=arr2.length) return toastr.warning('位组的位序号和值数量不一样，请确认！');
        // 检查位组序号的有效性
        var chipWidth = parseInt($scope.chip.width);            
        for (i=0; (i<arr1.length) && (parseInt(arr1[i])<chipWidth); i++) ;
        if (i<arr1.length) return toastr.warning('位组的序号应小于芯片位宽度， 请输入有效位组序号！');
        // 复位之可以为0/1/x

        $http.post('/chip/bits/'+regid, $scope.bits).then((res)=>{
            if (errorCheck(res)) return ; 

            toastr.success(res.data.message);
            bitsGet(name);            
        });
    }

    $scope.bitsDelete = () => {
        if (!/^\d+$/.test($scope.bits.id)) return toastr.warning('请选择要删除的寄存器！');

        var spath = '/chip/edit/'+$scope.chip.id+'/'+$scope.module.id+'/'+$scope.register.id;
        $http.delete('/chip/bits/'+$scope.bits.id).then((res)=>{
            if (errorCheck(res)) return ; 

            toastr.success(res.data.message);
            locals.set(spath, '');
            $scope.bits = angular.copy(emptyBits);
            bitsGet();            
        });
    }

    $scope.bitsSelect = bitsSelect;

    function bitsSelect(bits)
    {        
        var spath = '/chip/edit/'+$scope.chip.id+'/'+$scope.module.id+'/'+$scope.register.id;

        $scope.bits = angular.copy(bits);
        locals.set(spath, bits.id);

        $(".bitsContainer>.badge-success").removeClass('badge-success').addClass('badge-warning');
        window.setTimeout(()=>{
            var idx = $scope.bitslist.indexOf(bits);
            $(".bitsContainer>span:eq("+idx+")").removeClass('badge-warning').addClass('badge-success');
        }, 0);
    }

    function bitsGet(namePreselect) 
    {
        var spath = '/chip/edit/'+$scope.chip.id+'/'+$scope.module.id+'/'+$scope.register.id;

        $http.get('/chip/bits/register/'+$scope.register.id).then((res)=>{
            if (errorCheck(res)) return ;

            var ret = res.data.message;
            $scope.bitslist = ret;            
            if (ret.length) {
                if (namePreselect) {                    
                    for (var i=0; (i<ret.length) && (ret[i].name!=namePreselect); i++) ;
                    if (i<ret.length) {
                        bitsSelect(ret[i]);
                    }
                } else {
                    var bitsidPrevious = locals.get(spath);
                    if (bitsidPrevious) {
                        for (var i = 0; (i < ret.length) && (ret[i].id != bitsidPrevious); i++) ;
                        if (i < ret.length) 
                            bitsSelect(ret[i]);
                    } else { // 默认选择第一个
                        bitsSelect(ret[0]);
                    }
                }
            } else {
                bitsReset();
            }            
        })
    }


    /* 寄存器 ****************************************************************/

    $scope.registerReset = registerReset;

    function registerReset() 
    {
        bitsReset();

        $scope.register = angular.copy(emptyRegister);
        $(".registerContainer>.badge-success").removeClass('badge-success').addClass('badge-secondary'); 
    }

    $scope.registerEdit = (create)=>{
        var moduleid, id, name, address;

        moduleid = $scope.module.id;
        if (!moduleid)
            return toastr.warning('请选择寄存器属于的模块！');

        if (create)
        {
            name = $scope.register.name;
            address = $scope.register.address;
            if (!name || !/0[xX]{1}[0-9a-fA-F]+/.test(address)) 
                return toastr.warning('请输入有效的寄存器名称以及地址！');
            $scope.register['id'] = 0;
        } else {
            id = $scope.register.id;
            if (!id) return toastr.warning('请选择要编辑的寄存器！');
        }        

        $http.post('/chip/register/'+moduleid, $scope.register).then((res)=>{
            if (errorCheck(res)) return ; 

            toastr.success(res.data.message);
            registersGet(name);            
        });
    }

    $scope.registerDelete = ()=>{
        if (!/^\d+$/.test($scope.register.id)) return toastr.warning('请选择要删除的寄存器！');

        var spath = '/chip/edit/'+$scope.chip.id+'/'+$scope.module.id;
        $http.delete('/chip/register/'+$scope.register.id).then((res)=>{
            if (errorCheck(res)) return ; 

            toastr.success(res.data.message);
            locals.set(spath, '');
            $scope.register = angular.copy(emptyRegister);  
            registersGet();            
        });
    }

    $scope.registerSelect = registerSelect;

    function registerSelect(register)
    {
        var spath = '/chip/edit/'+$scope.chip.id+'/'+$scope.module.id;

        $scope.register = angular.copy(register);
        locals.set(spath, register.id);
        
        $(".registerContainer>.badge-success").removeClass('badge-success').addClass('badge-secondary');
        window.setTimeout(()=>{
            var idx = $scope.registerlist.indexOf(register);
            $(".registerContainer>span:eq("+idx+")").removeClass('badge-secondary').addClass('badge-success');
        }, 0);

        bitsGet();
    }

    function registersGet(namePreselect) 
    {
        var spath = '/chip/edit/'+$scope.chip.id+'/'+$scope.module.id;

        $http.get('/chip/register/module/'+$scope.module.id).then((res)=>{
            if (errorCheck(res)) return ;

            var ret = res.data.message;
            $scope.registerlist = ret;            
            if (ret.length) {
                if (namePreselect) {
                    for (var i=0; (i<ret.length) && (ret[i].name!=namePreselect); i++) ;
                    if (i<ret.length) {
                        registerSelect(ret[i]);
                    }
                } else {                    
                    var registeridPrevious = locals.get(spath);
                    if (registeridPrevious) {
                        for (var i = 0; (i < ret.length) && (ret[i].id != registeridPrevious); i++) ;
                        if (i < ret.length) {
                            registerSelect(ret[i]);
                        }
                    } else { // 默认选择第一个
                        registerSelect(ret[0]);
                    }
                }                
            } else {          
                registerReset();
                $scope.bitslist = [];
            }            
        })
    }


    /* 模块 ******************************************************************/

    $scope.moduleReset = moduleReset;
    
    function moduleReset() 
    {
        registerReset();

        $scope.module = angular.copy(emptyModule);  
        $(".moduleContainer>.badge-success").removeClass('badge-success').addClass('badge-secondary');
    }

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

        var spath = '/chip/edit/'+$scope.chip.id;
        $http.delete('/chip/module/'+$scope.module.id).then((res)=>{
            if (errorCheck(res)) return ; 

            toastr.success(res.data.message);
            locals.set(spath, '');
            $scope.module = angular.copy(emptyModule);   
            modulesGet();            
        });
    }

    $scope.moduleSelect = moduleSelect;

    function moduleSelect(module)
    {
        var spath = '/chip/edit/'+$scope.chip.id;

        $scope.module = angular.copy(module);
        locals.set(spath, module.id);
        
        $(".moduleContainer>.badge-success").removeClass('badge-success').addClass('badge-secondary');
        window.setTimeout(()=>{
            var idx = $scope.modulelist.indexOf(module);
            $(".moduleContainer>span:eq("+idx+")").removeClass('badge-secondary').addClass('badge-success');
        }, 0);

        registersGet();
    }

    function modulesGet(namePreselect)
    {
        var spath = '/chip/edit/'+$scope.chip.id;

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
                    var moduleidPrevious = locals.get(spath);
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
                moduleReset();
                $scope.registerlist = [];
                $scope.bitslist     = [];
            }
        })
    }


    /* 芯片 ******************************************************************/

    $scope.chipReset = chipReset;
    
    function chipReset() 
    {
        moduleReset();

        $scope.chip = angular.copy(emptyChip);   
        $(".chipContainer>.badge-success").removeClass('badge-success').addClass('badge-dark');
    }

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
            locals.set('/chip/edit', '');
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
        locals.set('/chip/edit', chip.id);
        
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
                    var chipidPrevious = locals.get('/chip/edit');
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
                chipReset();
                $scope.modulelist   = [];
                $scope.registerlist = [];
                $scope.bitslist     = [];
            }
        })
    }
    chipsGet();
}