

exports.edit = async (ctx, moduleid, registerid, name, fullname, address, desc)=>{
    const ChipModule   = ctx.models['ChipModule'];
    const ChipRegister = ctx.models['ChipRegister'];
    
    if (registerid) {
        var registerIns = await ChipRegister.findOne({logging:false, where:{'id':registerid}});
        if (!registerIns) return -1;

        await registerIns.update({'name':name, 'fullname':fullname, 'address':address, 'desc':desc}, {logging:false});
        return 0;
    } else {
        var moduleIns = await ChipModule.findOne({logging:false, where:{'id':moduleid}});
        if (!moduleIns) return -2;

        var [registerIns, created] = await ChipRegister.findOrCreate({logging:false, 
            where:{'name':name, 'ChipModuleId':moduleid}, 
            defaults:{'address':address, 'fullname':fullname, 'desc':desc}
        });

        return created ? 0 : -3;
    }
}


exports.delete = async (ctx, registerid)=>{
    const ChipRegister = ctx.models['ChipRegister'];

    await ChipRegister.destroy({logging: false, where: {'id': registerid}});
}


exports.detail = async (ctx, registerid)=>{
    const ChipRegister = ctx.models['ChipRegister'];

    var ret = await ChipRegister.findOne({logging: false, raw: true, where: {'id': registerid}});
    ret['desc'] = ret['desc'].toString();
    return ret;
}


exports.list = async (ctx, moduleid)=>{
    const ChipRegister = ctx.models['ChipRegister'];

    var ret = await ChipRegister.findAll({logging: false, raw: true, where: {'ChipModuleId': moduleid}});
    var registerlist = ret.map((x)=>{
        x['desc'] = x['desc'].toString();
        return x;
    });
    return registerlist;
}