const Router = require('koa-router');

var router = new Router();


/* 首页 */
router.get('/', async (ctx) => {
    await ctx.render('websites/document/view/index.html'); 
})


router.get('/edit/:docid', async (ctx)=>{
    var req2 = ctx.params;
    var docid= parseInt(req2.docid);

    await ctx.render('websites/document/view/edit.html', {'id':docid}); 
});


/* 编辑页 */
router.get('/', async (ctx) => {
    await ctx.render('websites/document/view/index.html'); 
})


module.exports = router;