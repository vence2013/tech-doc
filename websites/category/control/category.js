exports.create = async (ctx, father, name) => {    
    const Category = ctx.models['Category'];
    
    var [ins, created] = await Category.findOrCreate({logging:false, 
        where: {'name': name, 'father': father}
    });
    return created;
}


exports.update = async (ctx, id, name) => {
    const Category = ctx.models['Category'];
    
    var categoryIns = await Category.findOne({logging: false,
        where: {'id': id}
    });
    if (categoryIns) {
        await categoryIns.update({'name': name}, {logging: false}); 
    }
    return categoryIns ? true : false;
}


/* 获取某个目录节点的子树数据，并以数组形式给出 */
async function getListByRoot(ctx, rootid) {
    const Category = ctx.models['Category'];

    var list = await Category.findAll({raw: true, logging: false, 
        where: { 'father': rootid}
    });
    for (var i=0; i<list.length; i++) 
    {
        var sub = await getListByRoot(ctx, list[i]['id']);
        list = list.concat(sub);
    }

    return list;
}


/* 查找并删除子树所有节点 */
exports.delete = async (ctx, id)=>{
    var Category = ctx.models['Category'];
    var ids = [ id ];

    var list = await getListByRoot(ctx, id);
    for (var i in list) 
        ids.push(list[i]['id']);

    await Category.destroy({logging: false, 
        where: {'id': ids}
    });
}


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


/* 获取目录节点信息：基本信息，关联文章数量 
 * 返回值： {'id':x, ... , 'relcount': 0}
 */
exports.detail = async (ctx, id) => {
    const Category = ctx.models['Category'];

    // 基本信息
    var obj = await Category.findOne({logging:false, raw:true, 
        where:{'id':id}
    });
    // 关联文档数量
    if (obj)
        obj['relcount'] = 0;

    return obj;
}