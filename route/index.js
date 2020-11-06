const Router = require('koa-router');

var router = new Router();

/* 系统首页 */
router.get('/', async (ctx)=>{
    await ctx.redirect('/category'); 
})

router.post('/restore/upload', async (ctx, next) => {
    const indexCtrl = ctx.controls['index'];

    /* 新版本的koa-body通过ctx.request.files获取上传的文件，旧版本的koa-body通过ctx.request.body.files获取上传的文件 
     * https://blog.csdn.net/simple__dream/article/details/80890696
     */
    var file = ctx.request.files.file;

    await indexCtrl.restore_upload(ctx, file);
    ctx.body = {'error':  0, 'message': 'SUCCESS'};
})

router.get('/restore', async(ctx, next) => {
    const indexCtrl = ctx.controls['index'];
    var status = indexCtrl.restore_status();

    await indexCtrl.restore(ctx);
    
    ctx.body = {'error':  0, 'message': indexCtrl.restore_status()};
})


router.get('/backup', async (ctx)=>{
    const indexCtrl = ctx.controls['index'];

    var req2 = ctx.query;
    var filename = req2.filename;

    indexCtrl.backup(filename);
    ctx.body = {'error':0, 'message': 'SUCCESS'};
})

router.get('/backup/status', async (ctx)=>{
    const indexCtrl = ctx.controls['index'];

    ctx.body = {'error':0, 'message':indexCtrl.backup_status()};
})

router.get('/backup/file', async (ctx)=>{
    const indexCtrl = ctx.controls['index'];

    var ret = await indexCtrl.backup_file();
    ctx.body = {'error':ret ? 0 : -1, 'message':ret};
})

module.exports = router;