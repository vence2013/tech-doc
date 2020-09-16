const Router = require('koa-router');

var router = new Router();


/* 系统首页 */
router.get('/', async (ctx) => {
    await ctx.render('websites/tag/view/index.html'); 
})


router.post('/', async (ctx) => {
    const TagCtrl = ctx.controls['tag/tag'];

    /* 提取有效的参数 */
    var req = ctx.request.body;
    var name = req.name;

    var ret = await TagCtrl.create(ctx, name);
    if (ret)
        ctx.body = {'error': 0, 'message': 'success'};
    else
        ctx.body = {'error': -1, 'message': '该标签已经存在！'};
});


router.delete('/:tagname', async (ctx) => {
    const TagCtrl = ctx.controls['tag/tag'];

    /* 提取有效的参数 */
    var req2 = ctx.params;
    var tagname = req2.tagname;

    await TagCtrl.delete(ctx, tagname);
    ctx.body = {'error':  0, 'message': 'success'}
})


/* 搜索标签，参数为：{str, page, size } */
router.get('/search', async (ctx) => {
    const TagCtrl = ctx.controls['tag/tag'];

    /* 提取有效的参数 */
    var req = ctx.query;
    var str = req.str.replace(/^\s*(.*?)\s*$/, "$1"); // 去除首尾空格
    var page = /^\d+$/.test(req.page) ? req.page : 1;  // 当前的页面
    var size = /^\d+$/.test(req.size) ? req.size : 100; // 每页的记录条数

    var ret = await TagCtrl.search(ctx, str, page, size);
    ctx.body = {'error': 0, 'message': ret};
})


router.get('/check/:str', async (ctx) => {
    const TagCtrl = ctx.controls['tag/tag'];

    /* 提取有效的参数 */
    var req  = ctx.params;
    var tags = req.str.split(',');
    var ret = await TagCtrl.check(ctx, tags);
    ctx.body = {'error': 0, 'message': ret};
});


module.exports = router;