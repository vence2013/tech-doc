const Router = require('koa-router');

var router = new Router();


/* 首页 */
router.get('/', async (ctx) => {
    await ctx.render('websites/chip/view/map.html'); 
})


module.exports = router;