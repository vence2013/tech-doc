

/* 获取满足以下任一条件的文件，长度为size条记录
 * 1. 不属于任何目录节点的文件；（categoryid = 0）
 * 2. 不属于某一子树的文件；
 */
exports.resource = async (ctx, size, search, categoryid, belong) => {
    var ret, sql, sqlCond = '';

    if (search && search.length) {
        search.map((x)=>{ sqlCond += " AND `name` LIKE '%"+x+"%' " });
    }
    if (belong && categoryid) /* belong a category */
    {
        sqlCond += " AND `id` IN (SELECT `FileId` FROM `CategoryFile` WHERE `CategoryId`='"+categoryid+"') ";
    }
    else if (categoryid) /* not belong a category */
    {
        sqlCond += " AND `id` NOT IN (SELECT `FileId` FROM `CategoryFile` WHERE `CategoryId`='"+categoryid+"') ";
    }
    sqlCond = sqlCond ? " WHERE "+sqlCond.substr(4) : "";

    sql = "SELECT * FROM `Files` "+sqlCond+" ORDER BY `createdAt` DESC LIMIT 0, "+size+" ;";
    var [res, meta] = await ctx.sequelize.query(sql, {logging: false});

    return res;
}

exports.relate = async(ctx, categoryid, belong, fileids) => {
    const File = ctx.models['File'];
    const Category = ctx.models['Category'];

    var categoryIns = await Category.findOne({logging:false, where:{'id':categoryid}});
    if (!categoryIns) reutrn -1; // 无效的目录

    if (belong)
    {
        await categoryIns.removeFiles(fileids, {logging:false});
    }
    else
    {
        await categoryIns.addFiles(fileids, {logging:false});
    }
}