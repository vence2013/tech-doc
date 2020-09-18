const Router = require('koa-router');

var router = new Router();

/* 编辑页 */
router.get('/', async (ctx)=>{
    await ctx.render('websites/category/view/edit.html'); 
});

router.post('/', async (ctx)=>{
    const editCtrl = ctx.controls['category/edit'];

    /* 提取有效的参数 */
    var req = ctx.request.body;
    var name = req.name;
    var father  = req.father;

    var ret = await editCtrl.create(ctx, father, name);
    if (ret) ctx.body = {'error':  0, 'message': ret};
    else     ctx.body = {'error': -1, 'message': '添加失败！'};
})

router.put('/:id', async (ctx)=>{
    const editCtrl = ctx.controls['category/edit'];

    /* 提取有效的参数 */    
    var req2 = ctx.params;
    var id = parseInt(req2.id);

    var req = ctx.request.body;
    var father = req.father;
    var name   = req.name;
    var order  = req.order;
    
    var ret = await editCtrl.edit(ctx, id, father, name, order);
    ctx.body = {'error':0, 'message':ret ? '修改失败！' : 'SUCCESS'};
})

router.delete('/:id', async (ctx)=>{
    const editCtrl = ctx.controls['category/edit'];

    /* 提取有效的参数 */
    var req2 = ctx.params;    
    var id = /^\d+$/.test(req2.id) ? req2.id : 0;

    await editCtrl.delete(ctx, id);
    ctx.body = {'error': 0, 'message': "SUCCESS"};
})

/* 获取节点的详细信息：节点信息 */
router.get('/info/:id', async (ctx)=>{
    const editCtrl = ctx.controls['category/edit'];

    /* 提取有效的参数 */
    var req2 = ctx.params;
    var id = parseInt(req2.id);

    var info = await editCtrl.info(ctx, id);
    ctx.body = {'error': 0, 'message': info};
})


module.exports = router;