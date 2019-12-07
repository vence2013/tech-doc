const Router = require('koa-router');


var router = new Router();


/* 系统首页 */
router.get('/', async (ctx)=>{
    await ctx.redirect('/document'); 
})


module.exports = router;