const Router = require('koa-router');

var router = new Router();


/* 系统首页 */
router.get('/', async (ctx)=>{
    await ctx.render('websites/category/view/index.html'); 
})

/* 编辑页 */
router.get('/edit', async (ctx)=>{
    await ctx.render('websites/category/view/edit.html'); 
});

router.get('/tree/:rootid', async (ctx)=>{
    const CategoryCtrl = ctx.controls['category/category'];

    /* 提取有效的参数 */
    var req2 = ctx.params;
    var rootid = /^\d+$/.test(req2.rootid) ? req2.rootid : 0;

    var tree = await CategoryCtrl.getTreeByRoot(ctx, rootid);
    ctx.body = {'error': 0, 'message': tree};
})


module.exports = router;