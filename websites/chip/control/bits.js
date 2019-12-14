exports.edit = async (ctx, registerid, bitsid, name, fullname, rw, desc, bitlist, valuelist)=>{
    const ChipRegister = ctx.models['ChipRegister'];
    const ChipBit = ctx.models['ChipBit'];
    
    if (bitsid) {
        var bitsIns = await ChipBit.findOne({logging:false, where:{'id':bitsid}});
        if (!bitsIns) return -1;

        await bitsIns.update({'name':name, 'fullname':fullname, 'rw':rw, 'desc':desc, 
            'bitlist':bitlist, 'valuelist':valuelist}, {logging:false});
        return 0;
    } else {
        var registerIns = await ChipRegister.findOne({logging:false, where:{'id':registerid}});
        if (!registerIns) return -2;

        var [bitIns, created] = await ChipBit.findOrCreate({logging:false, 
            where:{'name':name, 'ChipRegisterId':registerid}, 
            defaults:{'rw':rw, 'bitlist':bitlist, 'valuelist':valuelist, 'fullname':fullname, 'desc':desc}
        });
        return created ? 0 : -3;
    }
}


exports.delete = async (ctx, bitsid)=>{
    const ChipBit = ctx.models['ChipBit'];

    await ChipBit.destroy({logging: false, where: {'id': bitsid}});
}


exports.list = async (ctx, registerid)=>{
    const ChipBit = ctx.models['ChipBit'];

    var ret = await ChipBit.findAll({logging: false, raw: true, where: {'ChipRegisterId': registerid}});
    var bitslist = ret.map((x)=>{
        if (x['desc'])
            x['desc'] = x['desc'].toString();
        return x;
    });
    return bitslist;
}


exports.detail = async (ctx, bitsid)=>{
    const ChipBit = ctx.models['ChipBit'];

    var ret = await ChipBit.findOne({logging: false, raw: true, where: {'id': bitsid}});
    ret['desc'] = ret['desc'].toString();
    return ret;
}