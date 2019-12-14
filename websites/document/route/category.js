const Router = require('koa-router');

var router = new Router();


router.post('/:categoryid', async (ctx)=>{
    const CategoryCtrl = ctx.controls['document/category'];

    /* 提取有效参数 */
    var req  = ctx.request.body;
    var req2 = ctx.params;
    var categoryid = parseInt(req2.categoryid);
    var docid = req.docid;

    var ret = await CategoryCtrl.attach(ctx, categoryid, docid);
    switch (ret) {
        case -1: ctx.body = {'error':-1, 'message':'无效的目录！'}; break;
        case -2: ctx.body = {'error':-2, 'message':'无效的文档！'}; break;
        default: ctx.body = {'error':0 , 'message':'SUCCESS'};
    }
})

router.delete('/:categoryid', async (ctx)=>{
    const CategoryCtrl2 = ctx.controls['document/category'];

    /* 提取有效参数 */
    var req2 = ctx.params;
    var req3 = ctx.query;
    var categoryid = parseInt(req2.categoryid);
    var docid = req3.docid;

    var ret = await CategoryCtrl2.dettach(ctx, categoryid, docid);
    switch (ret) {
        case -1: ctx.body = {'error':-1, 'message':'无效的目录！'}; break;
        default: ctx.body = {'error':0 , 'message':'SUCCESS'};
    }
})

function reqCheck(req2) {
    var query = {};

    query['page']     = parseInt(req2.page);
    query['pageSize'] = parseInt(req2.pageSize);
    // 以空格分开的字符串
    var fields = ['str'];
    for (var i=0; i<fields.length; i++) {
        var key   = fields[i];
        var value = req2[key];
        // 检查是否含有效字符
        if (!value || !/^[\s]*.+[\s]*$/.test(value)) continue;
        query[key] = value.replace(/[\s]+/, ' ') // 将多个空格替换为一个
                          .replace(/(^\s*)|(\s*$)/g, "") // 删除字符串首尾的空格
                          .split(' ');
    }

    return query;
}

router.get('/in/:categoryid', async (ctx)=>{
    const CategoryCtrl = ctx.controls['document/category'];
    
    /* 提取有效参数 */
    var req2 = ctx.query;
    var req3 = ctx.params;    
    var categoryid = parseInt(req3.categoryid);
    var query = reqCheck(req2); 

    var res = await CategoryCtrl.in(ctx, categoryid, query);
    ctx.body = {'error': 0, 'message': res};
})

router.get('/out/:categoryid', async (ctx)=>{
    const CategoryCtrl = ctx.controls['document/category'];
    
    /* 提取有效参数 */
    var req2 = ctx.query;
    var req3 = ctx.params;      
    var categoryid = parseInt(req3.categoryid);
    var query = reqCheck(req2); 
    console.log('a', query);
    var res = await CategoryCtrl.out(ctx, categoryid, query);
    ctx.body = {'error': 0, 'message': res};
})


module.exports = router;