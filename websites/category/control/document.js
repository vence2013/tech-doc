
/* 获取满足以下任一条件的文档，长度为size条记录
 * 1. 不属于任何目录节点的文档；（categoryid = 0）
 * 2. 不属于某节点的文档（不是子树，允许一个文档属于同一子树的多个节点）；
 */
exports.resource = async (ctx, size, search, categoryid, belong) => {
    var ret, sql, sqlCond = '';

    if (search && search.length) {
        search.map((x)=>{ sqlCond += " AND `content` LIKE '%"+x+"%' " });
    }
    if (belong && categoryid) /* belong a category */
    {
        sqlCond += " AND `id` IN (SELECT `DocumentId` FROM `CategoryDocument` WHERE `CategoryId`='"+categoryid+"') ";
    }
    else if (categoryid) /* not belong a category */
    {
        sqlCond += " AND `id` NOT IN (SELECT `DocumentId` FROM `CategoryDocument` WHERE `CategoryId`='"+categoryid+"') ";
    }
    sqlCond = sqlCond ? " WHERE "+sqlCond.substr(4) : "";

    sql = "SELECT * FROM `Documents` "+sqlCond+" ORDER BY `createdAt` DESC LIMIT 0, "+size+" ;";
    var [res, meta] = await ctx.sequelize.query(sql, {logging: false});
    ret = res.map((x)=>{
        // 将buffer转换为字符串
        x['content'] = x.content ? x.content.toString() : '';
        return x;
    });

    return ret;
}


exports.relate = async(ctx, categoryid, belong, docids) => {
    const Category = ctx.models['Category'];

    var categoryIns = await Category.findOne({logging:false, where:{'id':categoryid}});
    if (!categoryIns) reutrn -1; // 无效的目录

    if (belong)
    {
        await categoryIns.removeDocuments(docids, {logging:false});
    }
    else
    {
        await categoryIns.addDocuments(docids, {logging:false});
    } 
}