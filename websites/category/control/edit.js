const Sequelize = require('sequelize');
const Op = Sequelize.Op;

exports.create = async (ctx, fid, name) => {    
    const Category = ctx.models['Category'];

    /* 整理同级目录的排序 
     * 1. 搜索同级目录，按order排序
     * 2. 逐个更新节点order，值为小于当前order的节点数量
     */
    var catInstances = await Category.findAll({'logging':false, 
        'where': {'father': fid}, 'order':[['order', 'ASC']]});
    if (catInstances.length)
    {
        for (i=0; i<catInstances.length; i++)            
            await catInstances[i].update({'order':i+1});
    }

    // 将新目录添加到末尾
    var [ins, created] = await Category.findOrCreate({logging:false, 
        where: {'name': name, 'father': fid, 'order':catInstances.length+1}
    });

    return ins.get({plain: true});
}

exports.edit = async (ctx, id, fid, name, order) => {
    const Category = ctx.models['Category'];
    
    // 整理统计目录的排序（>=order的节点+1）
    var catInstances = await Category.findAll({'logging':false, 
        'where': {'father': fid, 'id':{[Op.ne]:id}}, 'order':[['order', 'ASC']]});
    if (catInstances.length)
    {
        for (i=0; i<catInstances.length; i++)
        {
            var catobj = catInstances[i].get({plain: true});
            await catInstances[i].update({'order':(catobj.order >= order) ? (i+2) : (i+1)});            
        }
    }

    var categoryIns = await Category.findOne({logging: false, where: {'id': id} });
    if (categoryIns) {
        await categoryIns.update({'father':fid, 'name':name, 'order':order}, {logging: false}); 
    }

    return await Category.findOne({logging:false, raw:true, where:{'id':id} });
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