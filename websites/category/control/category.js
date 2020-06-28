
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
async function get_tree(ctx, categoryid) {
    const Category = ctx.models['Category'];

    /* 查找当前节点的子节点，然后递归查找子节点的字节点 */
    var brothers = await Category.findAll({raw:true, logging:false, where: {
        'father': categoryid
    }});
    for (var i=0; i<brothers.length; i++) 
        brothers[i]['children'] = await get_tree(ctx, brothers[i]['id']);

    return brothers;
}

exports.get_tree_with_resource = get_tree_with_resource;

async function get_tree_with_resource(ctx, categoryid) 
{
    const Category = ctx.models['Category'];
    const File = ctx.models['File'];
    const Document = ctx.models['Document'];

    /* 查找当前节点的子节点，然后递归查找子节点的字节点 */
    var brothers = await Category.findAll({raw:true, logging:false, where: {
        'father': categoryid
    }});

    for (var i=0; i<brothers.length; i++) 
    {
        var reslist = [];
        var id = brothers[i]['id'];

        brothers[i]['type'] = 'node';
        brothers[i]['children'] = [];
        /* 查找当前节点的资源 */
        var docres = await Document.findAll({raw:true, logging:false, 
            include: [{
                model: Category,
                attributes: [],
                where: {id: id}
            }]
        });
        docres.forEach(e => {
            var title = e.content.toString().replace(/^[\\n#\ \t]*/, '').match(/[^\n]+/)[0];
            reslist.push({'id': e.id, 'father':id, 'name':title, 'type':'doc'});
        });
        var fileres = await File.findAll({raw:true, logging:false, 
            include: [{
                model: Category,
                attributes: [],
                where: {id: id}
            }]
        });
        fileres.forEach(e => {
            reslist.push({'id': e.id, 'father':id, 'name':e.name, 'location':e.location, 'type':'file'});
        });

        reslist = reslist.sort((a, b)=>{
            let len = (a.name.length <= b.name.length) ? a.name.length : b.name.length;

            for (var j = 0; j < len; j++)
            {
                var cha, chb;

                cha = a.name.charCodeAt(j);
                chb = b.name.charCodeAt(j);
                if (cha == chb) 
                {
                    continue;
                }
                return (cha > chb);             
            }
        });

        var sub = await get_tree_with_resource(ctx, id);
        brothers[i]['children'] = reslist.concat(sub);
    }

    return brothers;
}