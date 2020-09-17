function navCtrl($scope) {
    $scope.navlist = [
        {'name':'Tech-doc', 'url':'/document', 'children':[
            {'name':'edit', 'url':'/document/edit/0'},
        ]},
        {'name':'File', 'url':'/file', 'children':[
            {'name':'Pictures', 'url':'/file/view/picture.html'},
            {'name':'Upload',   'url':'/file/view/upload.html'}
        ]},
        {'name':'Chip', 'url':'/chip', 'children':[            
            {'name':'edit',     'url':'/chip/view/edit.html'},
            {'name':'function', 'url':'/chip/document/edit/0'},
        ]},
        {'name':'Category', 'url':'/category', 'children':[
            {'name':'edit', 'url':'/category/edit'},
        ]},
        {'name':'Tag', 'url':'/tag'},
        {'name':'System', 'url':'/view/system.html'}
    ];
    $scope.sub = null; 

    // 菜单显示控制
    var subCloseTimer = null;
    $scope.subShow = (itm)=>{
        $scope.sub = itm.children;

        if (subCloseTimer) { subCloseTimer = window.clearTimeout(subCloseTimer); }
        // 获取一级菜单的位置
        var offset = $('#nav1').find("a[name='"+itm.name+"']").offset();
        $('#nav2').css({'display':'table', 'position':'absolute', 'top':40, 'left':offset.left});
    }
    $scope.subEnter = ()=>{
        if (subCloseTimer) { subCloseTimer = window.clearTimeout(subCloseTimer); }
    }
    $scope.subDelay = ()=>{
        subCloseTimer = window.setTimeout(()=>{ $('#nav2').css('display', 'none'); }, 1000);
    }
}

function loadResource(app)
{
    toastr.options = { closeButton: false, debug: false, progressBar: true, positionClass: "toast-bottom-right",  
        onclick: null, showDuration: "300", hideDuration: "1000", timeOut: "2000", extendedTimeOut: "1000",  
        showEasing: "swing", hideEasing: "linear", showMethod: "fadeIn", hideMethod: "fadeOut"  
    };

    app
    .factory('locals',['$window', ($window)=>{
        return{        
            set: (key,value)=>{ $window.localStorage[key]=value; }, //存储单个属性
            get: (key,defaultValue)=>{ return $window.localStorage[key] || defaultValue; },        
            setObject: (key,value)=>{ $window.localStorage[key]=JSON.stringify(value);  }, //存储对象，以JSON格式存储
            getObject: (key)=>{ return JSON.parse($window.localStorage[key] || '{}'); }
        }
    }])
    .controller('navCtrl', navCtrl);

    return app;
}


/* 设置分页的数据。
 * total, 记录的总条数， 用于计算总页数
 * size, 每页显示的记录条数
 * view, 最多显示的页码数量。 比如总页数有20条，显示页面数量为10，如果当前页为第10页，则显示5-14页。
 * cur, 当前页
 *   分页固定显示的有：第一页，上一页， [x-5]-[x+4], 下一页， 最后一页
 */
function pageSet(total, size, view, cur)
{
    let i, j, max, prev, next, list = [];
    
    max  = (Math.ceil(total/size) < 1) ? 1 : Math.ceil(total/size);
    cur  = (cur<1) ? 1 : cur;
    prev = (cur>1) ? (cur-1) : 1;
    next = (cur<max) ? (cur+1) : max;

    list.push({'disable':(cur==1),  'page':1, 'name':'第一页'});
    list.push({'disable':(cur==1),  'page':prev, 'name':'上一页'});

    for (i=((cur-5)<1) ? 1 : (cur-5), j=0; (j<view) && (i<=max); i++, j++)
        list.push({'disable':false,  'active':(cur==i), 'page':i, 'name':i});
    
    list.push({'disable':(cur==next),  'active':false, 'page':next, 'name':'下一页'});
    list.push({'disable':(cur==max),  'active':false, 'page':max, 'name':'最后一页'});

    return {'list':list, 'total':total, 'size':size, 'cur':cur, 'max':max};
}


/* 响应数据检查。 正确的响应数据格式为： {data: {'error':x, 'message':x}}
 * 1. 如果没有正确的响应格式，则是未知错误。
 * 2. 如果格式正确，则判断'error'是否为undefined或者false
 * 返回值： 是否有错误
 */
function errorCheck(response) {
    if (response && response.data && /^[\-0-9]+$/.test(response.data.error)) {
        if (response.data.error) 
            toastr.info('错误信息：'+response.data.message, '', {"positionClass": "toast-bottom-right"});
        else
            return false;
    } else {
        console.log('未知错误：%o', response);
        toastr.info('未知错误：'+JSON.stringify(response), '', {"positionClass": "toast-bottom-right"});        
    }
    return true;
}


/* 对树进行递归遍历。返回树形结构中的目录节点和所有节点列表。 
 * 参数列表： 
 *      data  - 树形的目录数据
 *      depth - 当前递归的深度
 *      limit - 层级小于该值的目录节点都将作为展开节点返回
 * 返回值： { dir:x, list:x }
 *      dir - 层级小于depth的目录节点， 用于展开列表
 *      list- 整个树节点的列表， 可以用于计算节点数量、根据ID查找节点数据(类似本地数据库)。 * 
 */
function treeTravel(data, depth, limit) {
    var dir2 = [], list2 = [];

    list2 = list2.concat(data); // 将当前节点加入列表
    for (var i=0; i<data.length; i++) {
        // 如果当前子节点没有子节点，则进入下一节点处理。
        if (!data[i]['children'] || !data[i]['children'].length) continue;
        // 如果目录层级符合要求，则将当前节点加入目录节点。
        if (depth<limit) { dir2.push(data[i]); }
        var {dir, list} = treeTravel(data[i]['children'], depth+1, limit);
        dir2 = dir2.concat(dir);
        list2 = list2.concat(list);
    }

    return {'dir':dir2, 'list':list2};
}

/**
 *对Date的扩展，将 Date 转化为指定格式的String
 *月(M)、日(d)、小时(h)、分(m)、秒(s)、季度(q) 可以用 1-2 个占位符，
 *年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字)
 *例子：
 *(new Date()).Format("yyyy-MM-dd hh:mm:ss.S") ==> 2006-07-02 08:09:04.423
 *(new Date()).Format("yyyy-M-d h:m:s.S")      ==> 2006-7-2 8:9:4.18
 */
Date.prototype.format = function (fmt) {
    var o = {
        "M+": this.getMonth() + 1, //月份
        "d+": this.getDate(), //日
        "h+": this.getHours(), //小时
        "m+": this.getMinutes(), //分
        "s+": this.getSeconds(), //秒
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度
        "S": this.getMilliseconds() //毫秒
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}