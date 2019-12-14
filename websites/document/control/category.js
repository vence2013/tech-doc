exports.attach = async (ctx, categoryid, docid)=>{
    const Document = ctx.models['Document'];
    const Category = ctx.models['Category'];

    var categoryIns = await Category.findOne({logging:false, where:{'id':categoryid}});
    if (!categoryIns) reutrn -1; // 无效的目录

    // 获取有效的文档
    var docIns = await Document.findOne({logging:false, where:{'id':docid}});
    if (!docIns) return -2; // 无效的文件

    await categoryIns.addDocuments(docIns, {logging:false});
    return 0;
}

exports.dettach = async (ctx, categoryid, docid)=>{
    const Document = ctx.models['Document'];
    const Category = ctx.models['Category'];

    var categoryIns = await Category.findOne({logging:false, where:{'id':categoryid}});
    if (!categoryIns) reutrn -1; // 无效的目录

    // 获取有效的文档
    var docIns = await Document.findAll({logging:false, where:{'id':docid}});
    if (docIns) await categoryIns.removeDocuments(docIns, {logging:false});
    return 0;
}

/* 搜索在指定子目录的文档 */
exports.in = async (ctx, categoryid, query) => {
    const Category = ctx.models['Category'];
    var sql, sqlCond = '';

    /* 1. 搜索当前目录的关联的文档
     * 2. 搜索在关联文档中，但包含str的文档
     */
    var categroyIns = await Category.findOne({logging: false, 
        where: { 'id': categoryid}
    });

    var docids;
    if (categroyIns)
    {
        var docInss = await categroyIns.getDocuments({logging:false});         
        docids = docInss.map((x)=>{ return x.get({plain:true})['id']; });
    }

    // 已关联当前目录的文档
    if (docids && docids.length) {
        var idstr = '';
        docids.map((x)=>{ idstr += ', '+x; });
        sqlCond += " AND `id` IN ("+idstr.substr(1)+") "; 
    } else {
        return {'total':0, 'page':1, 'list':[]}; // 没有文档
    }
    if (query.str && query.str.length) {
        query.str.map((x)=>{ sqlCond += " AND `content` LIKE '%"+x+"%' " });
    }
    sqlCond = sqlCond ? " WHERE "+sqlCond.substr(4) : "";

    var page     = query.page;
    var pageSize = query.pageSize;
    // 计算分页数据
    sql = "SELECT COUNT(*) AS num FROM `Documents` "+sqlCond;
    var [res, meta] = await ctx.sequelize.query(sql, {logging: true});
    var total = res[0]['num'];
    var maxpage  = Math.ceil(total/pageSize);
    maxpage = (maxpage<1) ? 1 : maxpage;
    page = (page>maxpage) ? maxpage : (page<1 ? 1 : page);

    // 查询当前分页的列表数据
    var offset = (page - 1) * pageSize;
    sql = "SELECT * FROM `Documents` "+sqlCond+" ORDER BY `createdAt` DESC LIMIT "+offset+", "+pageSize+" ;";
    var [res, meta] = await ctx.sequelize.query(sql, {logging: true});
    var doclist = res.map((x)=>{
        // 将buffer转换为字符串
        x['content'] = x.content ? x.content.toString() : '';
        return x;
    });

    return {'total':total, 'page':page, 'list':doclist};
}

/* 搜索不在指定子目录的文档 */
exports.out = async (ctx, categoryid, query) => {
    const Category = ctx.models['Category'];
    var sql, sqlCond = '';

    /* 1. 搜索当前目录的关联的文档
     * 2. 搜索不在关联文档中，但包含str的文档
     */
    var categroyIns = await Category.findOne({logging: false, 
        where: { 'id': categoryid}
    });

    var docids;
    if (categroyIns)
    {
        var docInss = await categroyIns.getDocuments({logging:false});         
        docids = docInss.map((x)=>{ return x.get({plain:true})['id']; });
    }

    // 排除已关联当前目录的文档
    if (docids && docids.length) {
        var idstr = '';
        docids.map((x)=>{ idstr += ', '+x; });
        sqlCond += " AND `id` NOT IN ("+idstr.substr(1)+") "; 
    }
    if (query.str && query.str.length) {
        query.str.map((x)=>{ sqlCond += " AND `content` LIKE '%"+x+"%' " });
    }
    sqlCond = sqlCond ? " WHERE "+sqlCond.substr(4) : "";

    // 查询当前分页的列表数据
    sql = "SELECT * FROM `Documents` "+sqlCond+" ORDER BY `createdAt` DESC LIMIT 0, "+query.pageSize+" ;";
    var [res, meta] = await ctx.sequelize.query(sql, {logging: false});
    var doclist = res.map((x)=>{
        // 将buffer转换为字符串
        x['content'] = x.content ? x.content.toString() : '';
        return x;
    });

    return doclist;
}

