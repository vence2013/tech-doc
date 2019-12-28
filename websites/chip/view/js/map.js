var app = angular.module('mapApp', ['angular-clipboard'])

loadResource(app).controller('mapCtrl', mapCtrl);

function mapCtrl($scope, $http, locals) 
{
    $scope.chip   = null;
    $scope.module = null;
    $scope.chiplist   = [];
    $scope.modulelist = [];
    /* 存储整合后用于映射的寄存器数据
     * 数据格式： {registerinfo, 'bitslist':[{bitsinfo}]} 
     */
    $scope.reglist  = [];
    $scope.menu_show = true;
    var reglist_all = [];

    $scope.bitslist_str = '';

    $scope.copySuccess = ()=>{
        toastr.info('Success! Copyed bits list.');
    }

    /* 选择位组 **************************************************************/

    var bitslist_sel = []; // 选中位组的ID数组

    function bitsShow(bitslist)
    {
        $(".map_bits_select").removeClass("map_bits_select").addClass("map_bits_valid");
        for (var i = 0; i < bitslist.length; i++) {
            $("div[idx='b"+bitslist[i]+"']").removeClass("map_bits_valid").addClass("map_bits_select");
        }

        $scope.bitslist_str = $scope.copyText = bitslist.join(',');
    }

    $scope.bitsUpdate = () => {
        var bitslist = $scope.bitslist_str.split(',');
        
        var idlist = [];
        for (var i = 0; i < bitslist.length; i++) {
            id = parseInt(bitslist[i]);
            idlist.push(id);
        }
        
        bitslist_sel = idlist;
        bitsShow(idlist);
    }

    /* 1. 更新选中位组：
     *    当前点击位组时：如果当前已选择，则取消选择。否则，反之
     *    当前点击寄存器时：如果该寄存器的位组已全选中，则全部取消选择。否则，全部选择
     * 2. 显示选中位组
     */
    $scope.bitsSelect = (idstr, reg) => {
        var id = parseInt(idstr.substr(1));
        if (!id) return ;

        if (idstr[0] == 'b') {
            var idx= bitslist_sel.indexOf(id);
            if (idx == -1) {
                bitslist_sel.push(id);
            } else {
                bitslist_sel.splice(idx, 1);
            }
        } else if (idstr[0] == 'r') {
            if (!reg.bitslist) return ;
            var selcnt = 0;
            var bitslist = [];
            for (var i = 0; i < reg.bitslist.length; i++) {
                var id = reg.bitslist[i].id;
                bitslist.push(id);
                if (bitslist_sel.indexOf(id) != -1) selcnt++;
            }

            if (selcnt == reg.bitslist.length) {
                // 取消该寄存器所有位组的选择
                for (var i = 0; i < bitslist.length; i++) {
                    var idx = bitslist_sel.indexOf(bitslist[i]);
                    bitslist_sel.splice(idx, 1);
                }
            } else {
                // 选择该寄存器的所有位组
                for (var i = 0; i < bitslist.length; i++) {
                    if (bitslist_sel.indexOf(bitslist[i]) == -1) 
                        bitslist_sel.push(bitslist[i]);
                }
            }
        } else 
            return ;
        
        bitsShow(bitslist_sel);
    }

    /* 寄存器&位组搜索 *******************************************************/

    $scope.str = ''; // 寄存器&位组搜索，搜索名称和全称
    $scope.$watch('str', mapSearch, true);

    function mapSearch()
    {
        if (!$scope.module) return;

        var str = $scope.str;
        if (!str) mapShow(reglist_all);
        else {
            // 搜索寄存器的：name, fullname, 位组的：name, fullname
            var list = [];

            for (var i=0; i<reglist_all.length; i++) {
                var reg = reglist_all[i];

                if (!reg.id) continue; // 无效的寄存器，比如开头
                
                if ((reg.name.indexOf(str)!=-1) || (reg.fullname.indexOf(str)!=-1)) {
                    
                    list.push(reg);
                } else {
                    for (var j=0; reg.bitslist && (j<reg.bitslist.length); j++) {
                        var bits = reg.bitslist[j];
                        if ((bits.name.indexOf(str)!=-1) || (bits.fullname && (bits.fullname.indexOf(str)!=-1))) 
                        {
                            list.push(reg);
                            break;
                        }
                    }
                }
            }
            
            mapShow(list);
        }
    }

    /* 信息显示 **************************************************************/

    var mouse_pos_x = 0;
    $(document).mousemove(function(e){ mouse_pos_x = e.pageX; }); 

    var info_close_timer = null;
    $scope.reg_info_display = (reg) => {
        if (info_close_timer) {
            window.clearTimeout(info_close_timer);
            info_close_timer = null;
        }

        $(".map_info")
        .html('')
        .append("<div><span>寄存器：<b>"+reg.name+"</b></span><span>全称：<b>"+reg.fullname+"</b></span></div>")
        .append("<div><span>地址：<b>"+reg.address+"</b></span></div>")
        .append("<div><span>ID<b>"+reg.id+"</b></span><span>创建时间：<b>"+reg.createdAt.substring(0, 10)+
            "</b></span><span>更新时间：<b>"+reg.updatedAt.substring(0, 10)+"</b></span></div>")
        .append("<div>"+reg.desc.replace(/\n/g, '<br />')+"</div>");
        
        var win_width  = $(window).width();
        if (mouse_pos_x < win_width/2) {
            $(".map_info")
            .removeAttr('style')
            .css({'display':'block', 'width':win_width/2.03+'px', 'position':'absolute', 'top':'0px', 'right':'0px'});
        } else {
            $(".map_info")
            .removeAttr('style')
            .css({'display':'block', 'width':win_width/2.03+'px', 'position':'absolute', 'top':'0px', 'left':'0px'});
        }
    }

    $scope.bits_info_display = (bits) => {
        if (info_close_timer) {
            window.clearTimeout(info_close_timer);
            info_close_timer = null;
        }

        /* 将连续的位组组合 
         * 1. 位组解析为位序数字数组， 排序
         * 2. 按是否连续组成字符串
         */
        var list = bits.bitlist.split(',').map((x)=>{ return parseInt(x); });
        var list2= list.sort((a, b)=> { return a-b; });
        var bitstr = '';
        for (last=-100, continues=0, i=0; i<list2.length; i++) {            
            if ((last+1) == list2[i]) {                
                continues = 1;
                if ((i+1) == list2.length) bitstr += ':'+list2[i];
            } else {                
                if (continues) bitstr += ':'+list2[i];
                else           bitstr += ','+list2[i];
                continues = 0;
            }            
            last = list2[i];
        }
        /* 复位值无法显示为十六进制，因为有些为x */

        $(".map_info")
        .html('')
        .append("<div><span>位组：<b>"+bits.name+"</b></span><span>全称：<b>"+bits.fullname+"</b></span></div>")
        .append("<div><span>位序：<b>"+bitstr.substr(1)+"</b></span><span>复位值：<b>"+bits.valuelist+"</b></span><span>访问权限：<b>"+bits.rw+"</b></span></div>")
        .append("<div><span>ID：<b>"+bits.id+"</b></span><span>创建时间：<b>"+bits.createdAt.substring(0, 10)+
            "</b></span><span>更新时间：<b>"+bits.updatedAt.substring(0, 10)+"</b></span></div>")
        .append("<div>"+bits.desc.replace(/\n/g, '<br />')+"</div>");
        
        var win_width  = $(window).width();
        if (mouse_pos_x < win_width/2) {
            $(".map_info")
            .removeAttr('style')
            .css({'display':'block', 'width':win_width/2.03+'px', 'position':'absolute', 'top':'0px', 'right':'0px'});
        } else {
            $(".map_info")
            .removeAttr('style')
            .css({'display':'block', 'width':win_width/2.03+'px', 'position':'absolute', 'top':'0px', 'left':'0px'});
        }
    }

    $scope.info_close = (bits) => {
        info_close_timer = window.setTimeout(()=>{
            $('.map_info').css('display', 'none');
        }, 3000);        
    }

    /* 1. 获取芯片列表，选择一个芯片（/chip/map/chipid或第1个芯片）
     * 2. 获取对应的模块， 选择一个模块（/chip/map/chipid/moduleid或第1个模块）
     * 3. 获取对应的寄存器，显示映射
     */

    /* 映射 ******************************************************************/


    function mapShow(reglist) 
    {
        $('.map').css('width', 102+101*reglist.length);
            
        var width = $scope.chip.width;
        /* 重新构建位组序列，需求是：
         * 1. 同一位组的连续位，合并后重新计算行高
         * 
         * 操作步骤
         * 1. 生成数组： [0-width]:{'id':bits.id, 'cnt':1}
         * 2. 倒序遍历， 如果当前元素和下一个元素的id相同，则将下一个元素的cnt设置为当前元素的cnt+下一个元素的cnt， 并且将当前元素的cnt清零
         * 3. 顺序变量数组，取出cnt不为0的元素
         * 4. 按序取出bits对象，并关联cnt数据
         */
        for (var i=0; i<reglist.length; i++) {
            var j;

            var reg = reglist[i];
            
            var bits = [];
            for (j=0; j<width; j++) bits[j] = {'id':0, 'cnt':1};
            // 构建寄存器位与所属位组的关系
            for (j=0; reg.bitslist && (j<reg.bitslist.length); j++) {
                var bits2 = reg.bitslist[j];
                bits2.bitlist.split(',').map((x)=>{
                    var idx = parseInt(x);
                    bits[idx]['id'] = bits2.id; //{'id':bits2.id, 'cnt':1};
                });
            }
            
            // 合并连续的位组
            for (j=width-2; j>=0; j--) {
                if (!bits[j] || !bits[j+1] || (bits[j].id!=bits[j+1].id)) continue;
                bits[j]['cnt']  += bits[j+1]['cnt'];
                bits[j+1]['cnt'] = 0;
            }
            // 取出有效的位组，并关联位组数据
            var skip = 0;
            var bitslist = [];
            for (j=0; j<width; j++) {
                if (skip && --skip) continue;
                
                if (!bits[j] || !bits[j].id) {
                    if (bits[j].cnt) bitslist.push({'id':0, 'name':'Reserved', 'cnt':bits[j].cnt});
                } else {
                    var k = 0;
                    for (; (k<reg.bitslist.length) && (bits[j].id!=reg.bitslist[k].id); k++) ;
                    var tmp = angular.copy(reg.bitslist[k]);
                    tmp['cnt'] = skip = bits[j].cnt;
                    bitslist.push(tmp);
                }
            }
            reglist[i]['bitslist2'] = bitslist;
        }

        var bitslist = [];
        for (var i = 0; i < width; i++)
            bitslist.push({'name':'Bit:'+i, 'cnt':1});
        reglist.splice(0,0,{'name':'Bits', 'bitslist2':bitslist});
        
        $scope.reglist = reglist;
    }

    function regMap() 
    {
        $http.get('/chip/register/map/'+$scope.module.id).then((res)=>{
            if (errorCheck(res)) return ;

            var ret = res.data.message;
            
            /* 将寄存器根据地址排序
             * 1. 将地址字符串转换为整数
             * 2. 使用sort对address域排序
             */
            // 将寄存器根据地址排序
            var list = ret.map((x)=>{
                x['address'] = parseInt(x['address'].substr(2),16);
                return x;
            });
            reglist_all = list.sort(function(a,b){ return a.address-b.address; });
            
            mapShow(reglist_all);     
        })
    }

    /* 模块 ******************************************************************/

    $scope.moduleSelect = moduleSelect;

    function moduleSelect(module)
    {
        var spath = '/chip/map/'+$scope.chip.id;

        $scope.module = angular.copy(module);
        locals.set(spath, module.id);
        
        $(".moduleContainer>.badge-success").removeClass('badge-success').addClass('badge-secondary');
        window.setTimeout(()=>{
            var idx = $scope.modulelist.indexOf(module);
            $(".moduleContainer>span:eq("+idx+")").removeClass('badge-secondary').addClass('badge-success');
        }, 0);

        regMap();
    }

    function modulesGet(namePreselect)
    {
        var spath = '/chip/map/'+$scope.chip.id;

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

    $scope.chipSelect = chipSelect;

    function chipSelect(chip)
    {
        $scope.chip = angular.copy(chip);
        locals.set('/chip/map', chip.id);
        
        $(".chipContainer>.badge-success").removeClass('badge-success').addClass('badge-dark');
        window.setTimeout(()=>{
            var idx = $scope.chiplist.indexOf(chip);
            $(".chipContainer>span:eq("+idx+")").removeClass('badge-dark').addClass('badge-success');
        }, 0);

        modulesGet();
    }

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
                    var chipidPrevious = locals.get('/chip/map');
                    if (chipidPrevious) {  // 恢复上次的选择
                        for (var i = 0; (i < ret.length) && (ret[i].id != chipidPrevious); i++) ;
                        if (i < ret.length) 
                            chipSelect(ret[i]);
                    } 
                    else
                        chipSelect(ret[0]); // 默认选择第一个
                }
            } else {
                // 清除映射
            }
        })
    }
    chipsGet();
}