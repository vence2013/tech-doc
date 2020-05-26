const Sequelize = require('sequelize');
const Op = Sequelize.Op;

exports.create = async (ctx, name) => {
    const Tag = ctx.models['Tag'];

    var [ins, created] = await Tag.findOrCreate({logging: false, 
        where: {'name': name}
    });
    return created;
}

exports.search = async (ctx, search, page, pageSize) => {
    const Tag = ctx.models['Tag'];
    var queryCond = {'raw': true, 'logging': false, 'where': {}};

    if (search) { queryCond['where']['name'] = {[Op.like]: '%'+search+'%'}; }
    var total = await Tag.count(queryCond);
    var maxpage = Math.ceil(total/pageSize);
    maxpage = (maxpage<1) ? 1 : maxpage;
    page = (page>maxpage) ? maxpage : (page<1 ? 1 : page); // 更新为有效的页码

    // 查询当前分页的列表数据
    var offset = (page - 1) * pageSize;
    queryCond['offset'] = offset;
    queryCond['limit']  = parseInt(pageSize);
    queryCond['order']  = [['createdAt', 'DESC']];
    var list = await Tag.findAll(queryCond);

    return {'total':total, 'page':page, 'list':list};
}

exports.searchWithExcept = async (ctx, str, limit, except) => {
    const Tag = ctx.models['Tag'];

    /* 查找str关联的标签 */
    var queryCond = {'raw': true, 'logging': false, 'offset':0, 'limit':parseInt(limit), 
        'order':[['createdAt', 'DESC']], 'where': {}};
    if (str)
    {
        if (except instanceof Array) 
            queryCond['where']['name'] = {[Op.and]: [{[Op.like]: '%'+str+'%'}, {[Op.notIn]: except}]}; 
        else if (except) 
            queryCond['where']['name'] = {[Op.and]: [{[Op.like]: '%'+str+'%'}, {[Op.notIn]: [except]}]}; 
        else 
            queryCond['where']['name'] = {[Op.like]: '%'+str+'%'}; 
    } else {
        if (except instanceof Array) 
            queryCond['where']['name'] = {[Op.notIn]: except}; 
        else if (except) 
            queryCond['where']['name'] = {[Op.notIn]: [except]}; 
    }

    var list = await Tag.findAll(queryCond);
    return list;
}


exports.delete = async (ctx, tagname) => {
    const Tag = ctx.models['Tag'];

    await Tag.destroy({logging: false, 'where': {'name': tagname}});
}