const Router = require('koa-router');

var router = new Router();


/* 首页 */
router.get('/', async (ctx) => {
    await ctx.render('websites/document/view/index.html'); 
})

/* 编辑页 */
router.get('/edit/:docid', async (ctx)=>{
    var req2 = ctx.params;
    var docid= parseInt(req2.docid);

    await ctx.render('websites/document/view/edit.html', {'id':docid}); 
});

/* 显示页 */
router.get('/display/:docid', async (ctx)=>{
    var req2 = ctx.params;
    var docid= parseInt(req2.docid);

    await ctx.render('websites/document/view/display.html', {'id':docid}); 
});


router.post('/:docid', async (ctx)=>{
    const DocumentCtrl = ctx.controls['document/document'];

    /* 提取有效参数 */
    var req = ctx.request.body;
    var req2= ctx.params;
    var content = req.content;
    var taglist = req.taglist;
    var docid= parseInt(req2.docid);
    
    var ret = await DocumentCtrl.edit(ctx, docid, content, taglist);
    if (!ret)
        ctx.body = {'error':  0, 'message': 'SUCCESS'};
    else
        ctx.body = {'error': -1, 'message': '文档编辑失败，请联系管理员！'};
});


/* 删除文档， 只有登录用户可以执行 */
router.delete('/:docid', async (ctx)=>{
    const DocumentCtrl = ctx.controls['document/document'];

    var req2 = ctx.params;
    var docid = parseInt(req2.docid);
    
    await DocumentCtrl.delete(ctx, docid);

    ctx.body = {'error': 0, 'message': 'SUCCESS'};
});

/* 获取文档的详细信息：文档信息， 关联标签列表 */
router.get('/detail/:docid', async (ctx)=>{
    const DocumentCtrl = ctx.controls['document/document'];

    var req2= ctx.params;
    var docid= parseInt(req2.docid);

    var ret = await DocumentCtrl.detail(ctx, docid);
    if (ret)
        ctx.body = {'error':  0, 'message': ret};
    else
        ctx.body = {'error': -1, 'message': '无效的文档！'};
})


function reqCheck(req2) {
    var query = {};

    query['page']     = parseInt(req2.page);
    query['pageSize'] = parseInt(req2.pageSize);
    query['tag'] = req2.tag;
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
    // 日期格式
    var dateExp = new RegExp(/^\d{4}(-)\d{1,2}\1\d{1,2}$/);
    if (req2.createget && dateExp.test(req2.createget)) { query['createget'] = req2.createget; }
    if (req2.createlet && dateExp.test(req2.createlet)) { query['createlet'] = req2.createlet; }
    // 排序
    switch (req2.order) {
        case '2': query['order'] = ['createdAt', 'ASC']; break;
        default: query['order'] = ['createdAt', 'DESC'];
    }

    return query;
}

router.get('/search', async (ctx)=>{
    const DocumentCtrl = ctx.controls['document/document'];
    
    var req2  = ctx.query;
    var query = reqCheck(req2); // 提取有效参数

    var res = await DocumentCtrl.search(ctx, query);
    ctx.body = {'error': 0, 'message': res};
})


module.exports = router;