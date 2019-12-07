const Router = require('koa-router');

var router = new Router();


/* 系统首页 */
router.get('/', async (ctx)=>{
    await ctx.render('websites/category/view/index.html'); 
})


router.post('/', async (ctx)=>{
    const CategoryCtrl = ctx.controls['category/category'];

    /* 提取有效的参数 */
    var req = ctx.request.body;
    var name = req.name;
    var father  = req.father;

    if (await CategoryCtrl.create(ctx, father, name))
        ctx.body = {'error':  0, 'message': 'SUCCESS'};
    else
        ctx.body = {'error': -1, 'message': '当前目录下已存在该子目录！'};
})


router.put('/:id', async (ctx)=>{
    const CategoryCtrl = ctx.controls['category/category'];

    /* 提取有效的参数 */
    var req = ctx.request.body;
    var name = req.name;
    var req2 = ctx.params;
    var id = parseInt(req2.id);
    
    if (await CategoryCtrl.update(ctx, id, name))
        ctx.body = {'error':  0, 'message': 'SUCCESS'};
    else
        ctx.body = {'error': -1, 'message': '修改失败！'};
})


router.delete('/:id', async (ctx)=>{
    const CategoryCtrl = ctx.controls['category/category'];

    /* 提取有效的参数 */
    var req2 = ctx.params;    
    var id = /^\d+$/.test(req2.id) ? req2.id : 0;

    if (id)
    {
        await CategoryCtrl.delete(ctx, id);
        ctx.body = {'error': 0, 'message': "SUCCESS"};
    }
    else 
        ctx.body = {'error':-1, 'message': "禁止删除根目录"};
})


router.get('/tree/:rootid', async (ctx)=>{
    const CategoryCtrl = ctx.controls['category/category'];

    /* 提取有效的参数 */
    var req2 = ctx.params;
    var rootid = /^\d+$/.test(req2.rootid) ? req2.rootid : 0;

    var tree = await CategoryCtrl.getTreeByRoot(ctx, rootid);
    ctx.body = {'error': 0, 'message': tree};
})


/* 获取节点的详细信息：基本信息， 关联文章数 */
router.get('/detail/:id', async (ctx)=>{
    const CategoryCtrl = ctx.controls['category/category'];

    /* 提取有效的参数 */
    var req2 = ctx.params;
    var id = parseInt(req2.id);

    var info = await CategoryCtrl.detail(ctx, id);
    ctx.body = {'error': 0, 'message': info};
})


module.exports = router;