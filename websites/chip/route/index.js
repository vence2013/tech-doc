const Router = require('koa-router');

var router = new Router();


/* 首页 */
router.get('/', async (ctx) => {
    await ctx.render('websites/chip/view/map.html'); 
})

/* 编辑页 */
router.get('/function/:docid', async (ctx)=>{
    var req2 = ctx.params;
    var docid= parseInt(req2.docid);

    await ctx.render('websites/chip/view/function.html', {'id':docid}); 
});


module.exports = router;