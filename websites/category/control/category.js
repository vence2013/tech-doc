
/* 获取某个目录节点的子树数据，并以数组形式给出 */
exports.get_sub_tree_nodes = get_sub_tree_nodes;

async function get_sub_tree_nodes(ctx, rootid) {
    const Category = ctx.models['Category'];

    var list = await Category.findAll({raw: true, logging: false, 
        where: { 'father': rootid}
    });
    for (var i=0; i<list.length; i++) 
    {
        var sub = await get_sub_tree_nodes(ctx, list[i]['id']);
        list = list.concat(sub);
    }

    return list;
}


exports.get_tree = get_tree;

/* 通过ID获取目录树对象数据 */
async function get_tree(ctx, rootid) {
    const Category = ctx.models['Category'];

    /* 查找当前节点的子节点，然后递归查找子节点的字节点 */
    var brothers = await Category.findAll({raw:true, logging:false, where: {
        'father': rootid
    }});
    for (var i=0; i<brothers.length; i++) 
        brothers[i]['children'] = await get_tree(ctx, brothers[i]['id']);

    return brothers;
}

