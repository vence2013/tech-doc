const Router = require('koa-router');

var router = new Router();
var cfg = require('../../../cfg');

/* 系统首页 */
router.get('/', async (ctx)=>{
    var indexTitle = cfg.webTitle+'@'+cfg.updateAt;
    await ctx.render('websites/category/view/index.html', {'title': indexTitle}); 
})

router.get('/tree/:categoryid', async (ctx)=>{
    const CategoryCtrl = ctx.controls['category/category'];

    /* 提取有效的参数 */
    var req2 = ctx.params;
    var categoryid = /^\d+$/.test(req2.categoryid) ? req2.categoryid : 0;

    var tree = await CategoryCtrl.get_tree(ctx, categoryid);
    ctx.body = {'error': 0, 'message': tree};
})

/* 目录树及节点资源（包括所有展开的目录节点和叶子节点） */
router.get('/display/:categoryid', async (ctx)=>{
    const CategoryCtrl = ctx.controls['category/category'];

    /* 提取有效的参数 */
    var req2 = ctx.params;
    var categoryid = /^\d+$/.test(req2.categoryid) ? req2.categoryid : 0;

    var tree = await CategoryCtrl.get_tree_with_resource(ctx, categoryid);
    ctx.body = {'error': 0, 'message': tree};
})

module.exports = router;