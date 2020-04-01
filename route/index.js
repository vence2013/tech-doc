const Router = require('koa-router');

var router = new Router();

/* 系统首页 */
router.get('/', async (ctx)=>{
    await ctx.redirect('/document'); 
})


router.get('/backup', async (ctx)=>{
    const indexCtrl = ctx.controls['index'];

    var req2 = ctx.query;
    var filename = req2.filename;

    indexCtrl.backup(filename);
    ctx.body = {'error':0, 'message':indexCtrl.get_backup_status()};
})

router.get('/backup/status', async (ctx)=>{
    const indexCtrl = ctx.controls['index'];

    ctx.body = {'error':0, 'message':indexCtrl.get_backup_status()};
})

router.get('/backup/file', async (ctx)=>{
    const indexCtrl = ctx.controls['index'];

    var ret = await indexCtrl.backup_file_info();
    ctx.body = {'error':ret ? 0 : -1, 'message':ret};
})

module.exports = router;