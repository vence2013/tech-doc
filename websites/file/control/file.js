const fs = require('fs');
const moment = require('moment');
const mkdirp = require('mkdirp');

exports.create = async (ctx, file) => {
    const File = ctx.models['File'];

    var size = file.size;
    var name = file.name.replace(/(^\s*)|(\s*$)/g, "");
    var ext  = (name.indexOf('.')!=-1) ? name.split('.').pop().toLowerCase() : '';
    // 生成（创建）上传后的存储路径
    var datestr =  moment().format("YYYYMMDD");
    var directory = '/data/upload/'+datestr+'/';
    if (!fs.existsSync(directory)) { mkdirp.sync(directory); } // 如果目录不存在，则创建该目录。
    var location = directory+name;
    
    // 添加数据库信息， 默认权限为任何人可读
    var [ins, created] = await File.findOrCreate({logging: false,
        where: {'name': name, 'size': size, 'ext': ext},
        defaults: {'location': location}
    });
    if (created) { // 移动上传的文件到指定路径
        const reader = fs.createReadStream(file.path);
        const upStream = fs.createWriteStream(location);
        reader.pipe(upStream);
    }
    
    return created;
}


exports.delete = async (ctx, id)=>{
    const File = ctx.models['File'];

    var fileIns = await File.findOne({logging: false, where: {'id': id}});
    if (!fileIns) return -1;

    var fileObj = fileIns.get({plain: true});
    // 删除文件本身
    fs.unlink(fileObj.location, (err) => {
        if (err) {
            console.log("ERROR["+__filename+"|delete()] - l1, error:%o.", err);
        } else {
            console.log("INFO["+__filename+"|delete()] - l1, file(%s/%s) was delete.", fileObj.name, fileObj.location);
        }
    });
    // 删除数据库记录
    await File.destroy({logging: false, 'where': {'id': id}});
    return 0;
}


exports.search = async (ctx, query, page, pageSize)=>{
    var sql, sqlCond = '';

    // 根据搜索条件构建SQL条件
    if (query.str && query.str.length) 
        query.str.map((x)=>{ sqlCond += " AND `name` LIKE '%"+x+"%' " });
    if (query.ext && query.ext.length) 
    {
        var extstr = '';
        query.ext.map((x)=>{ extstr += ", '"+x+"' "; });
        sqlCond += " AND `ext` IN ("+extstr.substr(1)+") ";
    }
    if (query.sizeget)
        sqlCond += " AND `size`>="+query.sizeget+" ";
    if (query.sizelet)
        sqlCond += " AND `size`<="+query.sizelet+" ";
    if (query.createget)
        sqlCond += " AND `createdAt`>='"+query.createget+"' "; 
    if (query.createlet)
        sqlCond += " AND `createdAt`<='"+query.createlet+"' ";
    sqlCond = sqlCond ? " WHERE "+sqlCond.substr(4) : '';

    // 计算分页数据
    sql = "SELECT COUNT(*) AS num FROM `Files` "+sqlCond;
    var [res, meta] = await ctx.sequelize.query(sql, {logging: false});
    var total = res[0]['num'];
    var maxpage  = Math.ceil(total/pageSize);
    maxpage = (maxpage<1) ? 1 : maxpage;
    page = (page>maxpage) ? maxpage : (page<1 ? 1 : page);


    // 查询当前分页的列表数据
    var offset = (page - 1) * pageSize;
    sql = "SELECT * FROM `Files` "+sqlCond+" ORDER BY "+query.order.join(' ')+" LIMIT "+offset+", "+pageSize+" ;";
    var [res, meta] = await ctx.sequelize.query(sql, {logging: false});

    return {'total':total, 'page':page, 'list':res};
}