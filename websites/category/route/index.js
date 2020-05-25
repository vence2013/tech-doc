const Router = require('koa-router');

var router = new Router();

/* 系统首页 */
router.get('/', async (ctx)=>{
    await ctx.render('websites/category/view/index.html'); 
})

router.get('/tree/:categoryid', async (ctx)=>{
    const CategoryCtrl = ctx.controls['category/category'];

    /* 提取有效的参数 */
    var req2 = ctx.params;
    var categoryid = /^\d+$/.test(req2.categoryid) ? req2.categoryid : 0;

    var tree = await CategoryCtrl.get_tree(ctx, categoryid);
    ctx.body = {'error': 0, 'message': tree};
})

/* 目录树及节点资源（包括所有展开的目录节点和叶子节点） */
router.get('/display/:categoryid', async (ctx)=>{
    const CategoryCtrl = ctx.controls['category/category'];

    /* 提取有效的参数 */
    var req2 = ctx.params;
    var categoryid = /^\d+$/.test(req2.categoryid) ? req2.categoryid : 0;

    var tree = await CategoryCtrl.get_tree_with_resource(ctx, categoryid);
    ctx.body = {'error': 0, 'message': tree};
})

router.post('/resource', async (ctx)=>{
    const DocumentCtrl = ctx.controls['category/document'];
    const FileCtrl = ctx.controls['category/file'];

    var req = ctx.request.body;
    var resources = req.resources;
    var belong = req.belong;
    var categoryid = /^\d+$/.test(req.categoryid) ? parseInt(req.categoryid) : 0;

    /* 分离文档和文件的ID */
    var docids = [], fileids=[];
    resources.forEach(e => {
        if (e.substr(0, 3) == 'doc')
        {
            docids.push(parseInt(e.substr(3)));
        }
        else if (e.substr(0, 4) == 'file')
        {
            fileids.push(parseInt(e.substr(4)));
        }
    });
    if (docids.length)
    {
        await DocumentCtrl.relate(ctx, categoryid, belong, docids);
    }
    if (fileids.length)
    {
        await FileCtrl.relate(ctx, categoryid, belong, fileids);
    }

    ctx.body = {'error': 0, 'message': 'SUCCESS'};
})

/* 获取最新的资源（文档和文件） */
router.get('/resource', async (ctx)=>{
    const DocumentCtrl = ctx.controls['category/document'];
    const FileCtrl = ctx.controls['category/file'];

    var req2 = ctx.query;
    var size = /^\d+$/.test(req2.size) ? parseInt(req2.size) : 0;
    var search = req2.search.replace(/(^\s+)|(\s+$)/g,"");
    search = search ? search.replace(/[\s]+/, ' ').split(' ') : [];
    var categoryid = /^\d+$/.test(req2.categoryid) ? parseInt(req2.categoryid) : 0;
    var belong = (req2.belong === 'true') ? true : false;

    /* 获取最新的文档和文件，然后按时间排序输出 */
    var docres = await DocumentCtrl.resource(ctx, size, search, categoryid, belong);
    var fileres = await FileCtrl.resource(ctx, size, search, categoryid, belong);

    /* id, type(doc | file), name, location, updatedAt */
    var reslist = [];
    docres.forEach(e => {
        var title = e.content.replace(/^[\\n#\ \t]*/, '').match(/[^\n]+/)[0];
        reslist.push({'id': e.id, 'type':'doc', 'name':title, 'updatedAt':e.updatedAt});
    });
    fileres.forEach(e => {
        reslist.push({'id': e.id, 'type':'file', 'name':e.name, 'location':e.location, 'updatedAt':e.updatedAt});
    });
    reslist2 = reslist.sort((a, b)=>{
        return (new Date(b.updatedAt)).getTime() - (new Date(a.updatedAt)).getTime();
    });

    ctx.body = {'error': 0, 'message': reslist2.slice(0, size)};
})

module.exports = router;