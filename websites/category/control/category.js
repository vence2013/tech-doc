
exports.getTreeByRoot = getTreeByRoot;
/* 通过ID获取目录树对象数据 */
async function getTreeByRoot(ctx, rootid) {
    const Category = ctx.models['Category'];

    /* 查找当前节点的子节点，然后递归查找子节点的字节点 */
    var brothers = await Category.findAll({raw:true, logging:false, where: {
        'father': rootid
    }});
    for (var i=0; i<brothers.length; i++) 
        brothers[i]['children'] = await getTreeByRoot(ctx, brothers[i]['id']);

    return brothers;
}

