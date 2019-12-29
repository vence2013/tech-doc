 
exports.edit = async (ctx, docid, content, taglist, bitslist)=>{
    const Document = ctx.models['Document'];
    const ChipBitgroup = ctx.models['ChipBitgroup'];    
    const Tag = ctx.models['Tag'];

    if (docid) {
        var docIns = await Document.findOne({logging: false, 
            where: {'id':docid}
        });
        if (!docIns) 
            return -1; // 无效文档
        
        await docIns.update({'content':content});
    } else {
        var [docIns, created] = await Document.findOrCreate({logging: false,
            where: {'content':content}
        });
    }

    // 关联标签
    var tagInss = await Tag.findAll({logging:false, where:{'name':taglist}});
    await docIns.setTags(tagInss, {logging:false});

    // 关联位组
    var bitsArray = bitslist.split(',');
    var chipBitgroupInss = await ChipBitgroup.findAll({logging:false, where:{'id':bitsArray}});
    await docIns.setChipBitgroups(chipBitgroupInss, {logging:false});

    return 0;
}


/* 返回文档的详细信息：content, ... , tagnames */
exports.detail = async (ctx, docid)=>{
    const Document = ctx.models['Document'];

    var docIns = await Document.findOne({logging:false, where:{'id':docid}});
    if (!docIns) return null;

    var docObj = docIns.get({plain:true});
    docObj['content'] = docObj['content'].toString();
    // 关联标签名称列表
    var tagObjs = await docIns.getTags({raw:true, logging:false});
    docObj['tagnames'] = tagObjs.map((x)=>{ return x.name; });
    // 关联位组ID列表
    var bitsObjs = await docIns.getChipBitgroups({raw:true, logging:false});    
    docObj['bitsids'] = bitsObjs.map((x)=>{ return x.id; });

    return docObj;
}