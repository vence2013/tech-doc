const Sequelize = require('sequelize');
const Op = Sequelize.Op;

exports.create = async (ctx, name)=>{
    const Tag = ctx.models['Tag'];

    var [tagIns, created] = await Tag.findOrCreate({logging: false, 
        where: {'name': name}
    });
    return created;
}


/* 完成以下工作： 
 * 1. 查找名称为str的标签， 
 *    如果存在，还要查找该标签关联的文章总数，最近添加的20个关联文章 
 * 2. 搜索str关联的标签列表，包括：总数，当前页的标签列表
 * 
 * 返回值：
 *   {tag: {...}, docs:{'total':x, 'list':[[], ... ]} list:[{}, ... ], }
 */
exports.search = async (ctx, str, page, pageSize)=>{
    const Tag = ctx.models['Tag'];

    /* 查找名称为str的标签 */
    var tagObj = await Tag.findOne({'raw': true, 'logging': false, where: {
        'name': str
    }});

    /* 如果标签有效，查找关联的文章 */
    var docs = {};
    if (tagObj)
    {
        docs['total'] = 0;
        docs['list']  = []; // 暂时设置为空
    }

    /* 查找str关联的标签 */
    var queryCond = {'raw': true, 'logging': false, 'where': {}};
    if (str) { queryCond['where']['name'] = {[Op.like]: '%'+str+'%'}; }
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

    return {'total':total, 'page':page, 'tag':tagObj, 'docs':docs, 'list':list};
}


exports.delete = async (ctx, tagname)=>{
    const Tag = ctx.models['Tag'];

    await Tag.destroy({logging: false, 'where': {'name': tagname}});
}