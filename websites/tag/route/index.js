const moment = require('moment');
const Router = require('koa-router');


var router = new Router();


/* 系统首页 */
router.get('/', async (ctx)=>{
    await ctx.render('websites/tag/view/index.html'); 
})


module.exports = router;