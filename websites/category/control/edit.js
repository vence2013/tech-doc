
/* 获取某个目录节点的子树数据，并以数组形式给出 */
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

exports.create = async (ctx, father, name) => {    
    const Category = ctx.models['Category'];

    var [ins, created] = await Category.findOrCreate({logging:false, 
        where: {'name': name, 'father': father}
    });

    return ins.get({plain: true});
}

exports.edit = async (ctx, id, name) => {
    const Category = ctx.models['Category'];
    
    var categoryIns = await Category.findOne({logging: false,
        where: {'id': id}
    });
    if (categoryIns) {
        await categoryIns.update({'name': name}, {logging: false}); 
    }

    return await Category.findOne({logging:false, raw:true, 
        where:{'id':id}
    });
}

/* 查找并删除子树所有节点 */
exports.delete = async (ctx, id)=>{
    var Category = ctx.models['Category'];
    var ids = [ id ];

    var list = await get_sub_tree_nodes(ctx, id);
    for (var i in list) 
        ids.push(list[i]['id']);

    await Category.destroy({logging: false, 
        where: {'id': ids}
    });
}

exports.info = async (ctx, id) => {
    const Category = ctx.models['Category'];

    // 基本信息
    var obj = await Category.findOne({logging:false, raw:true, 
        where:{'id':id}
    });

    return obj;
}