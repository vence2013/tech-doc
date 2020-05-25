
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
    const Category = ctx.models['Category'];
    const CategoryCtrl = ctx.controls['category/category'];
    var ids = [ id ];

    var list = await CategoryCtrl.get_sub_tree_nodes(ctx, id);
    for (var i in list) 
    {
        ids.push(list[i]['id']);
    }        

    await Category.destroy({logging: false, 
        where: {'id': ids}
    });
}

exports.info = async (ctx, id) => {
    const Category = ctx.models['Category'];

    var obj = await Category.findOne({logging:false, raw:true, 
        where:{'id':id}
    });

    return obj;
}