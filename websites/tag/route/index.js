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


/* 搜索标签，参数为：{str, page, pageSize } */
router.get('/search', async (ctx) => {
    const TagCtrl = ctx.controls['tag/tag'];

    /* 提取有效的参数 */
    var req = ctx.query;
    var str = req.str.replace(/^\s*(.*?)\s*$/, "$1"); // 去除首尾空格
    var page = /^\d+$/.test(req.page) ? req.page : 1;  // 当前的页面
    var pageSize = /^\d+$/.test(req.pageSize) ? req.pageSize : 100; // 每页的记录条数

    var ret = await TagCtrl.search(ctx, str, page, pageSize);
    ctx.body = {'error': 0, 'message': ret};
})


/* 搜索标签， 除了某些标签。参数为：{str, limit, except} */
router.get('/except', async (ctx) => {
    const TagCtrl = ctx.controls['tag/tag'];

    /* 提取有效的参数 */
    var req = ctx.query;
    var str = req.str.replace(/^\s*(.*?)\s*$/, "$1"); // 去除首尾空格
    var limit = /^\d+$/.test(req.limit) ? req.limit : 10;  // 当前的页面
    var except = req.except;

    var ret = await TagCtrl.searchWithExcept(ctx, str, limit, except);
    ctx.body = {'error': 0, 'message': ret};
})


router.delete('/:tagname', async (ctx) => {
    const TagCtrl = ctx.controls['tag/tag'];

    /* 提取有效的参数 */
    var req2 = ctx.params;
    var tagname = req2.tagname;

    await TagCtrl.delete(ctx, tagname);
    ctx.body = {'error':  0, 'message': 'success'}
})


module.exports = router;