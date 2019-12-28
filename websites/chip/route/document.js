const Router = require('koa-router');

var router = new Router();


/* 编辑页 */
router.get('/edit/:docid', async (ctx)=>{
    var req2 = ctx.params;
    var docid= parseInt(req2.docid);

    await ctx.render('websites/chip/view/document.html', {'id':docid}); 
});


router.post('/:docid', async (ctx)=>{
    const DocumentCtrl = ctx.controls['chip/document'];

    /* 提取有效参数 */
    var req = ctx.request.body;
    var req2= ctx.params;
    var content = req.content;
    var taglist = req.taglist;
    var bitslist= req.bitslist;
    var docid= parseInt(req2.docid);
    
    var ret = await DocumentCtrl.edit(ctx, docid, content, taglist, bitslist);
    if (!ret)
        ctx.body = {'error':  0, 'message': 'SUCCESS'};
    else
        ctx.body = {'error': -1, 'message': '文档编辑失败，请联系管理员！'};
});


/* 获取文档的详细信息：文档信息， 关联标签列表， 关联位组列表 */
router.get('/detail/:docid', async (ctx)=>{
    const DocumentCtrl = ctx.controls['chip/document'];

    var req2= ctx.params;
    var docid= parseInt(req2.docid);

    var ret = await DocumentCtrl.detail(ctx, docid);
    if (ret)
        ctx.body = {'error':  0, 'message': ret};
    else
        ctx.body = {'error': -1, 'message': '无效的文档！'};
})


module.exports = router;