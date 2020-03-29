/****************************************************************************** 
 * 文件名称 ： dataTransfer.js
 * 功能说明 ： 数据表的数据转移。
 * 
 * 创建日期 ： 2019/10/05
 * 创建者   ： wuxb
 * 修改历史 ： 
 *  2019/10/05    - 创建文件。
 *  2020/03/29    - 实现websys到teck-doc网站的chip数据表转移。
 *****************************************************************************/ 

const Sequelize = require('sequelize'); 

/* Database Configurations */
const host = 'mysql';
const user = 'root';
const password = '12345678';
const dbnameSrc = 'websys5';
const dbnameDst = 'techdoc';


// 创建ORM对象
var sequelizeSrc = new Sequelize(dbnameSrc, user, password, { 
    host: host, dialect: 'mysql', pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
});
var sequelizeDst = new Sequelize(dbnameDst, user, password, { 
    host: host, dialect: 'mysql', pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
});

sequelizeSrc
.authenticate({logging: false})
.then(async () => {
    console.log('^_^ SRC Connection has been established successfully.');  

    sequelizeDst
    .authenticate({logging: false})
    .then(async () => {
        console.log('^_^ DST Connection has been established successfully.');  

        await chip_transfer(sequelizeSrc, sequelizeDst);

        process.exit();
    }).catch(err => { 
        console.error('^~^ DST Unable to connect to the database:', err); 
    }); 
}).catch(err => { 
    console.error('^~^ SRC Unable to connect to the database:', err); 
}); 


/********************************************************************
 * chip tables transfer
 * 
 * 操作步骤：
 * 1. 遍历源数据库中的芯片
 *   1.1 遍历模块
 *      1.1.1 遍历寄存器
 *         1.1.1.1 遍历位组，如果DST数据库中不存在，则添加
 * 
 * 注意：要保持层级关系的关联，在数据转移的过程中丢弃原有的ID
 *******************************************************************/
async function chip_transfer(db_src, db_dst)
{
    var bitgroupCount = 0;

    /* load tables */
    var src_models = new Array(), dst_models = new Array();

    src_models['Chip'] = await db_src.import('src_tables/Chip');
    src_models['ChipModule'] = await db_src.import('src_tables/ChipModule');
    src_models['ChipRegister'] = await db_src.import('src_tables/ChipRegister');
    src_models['ChipBit'] = await db_src.import('src_tables/ChipBit');
    await require('./src_tables/Relations').link(src_models);

    dst_models['Chip'] = await db_dst.import('dst_tables/Chip');
    dst_models['ChipModule'] = await db_dst.import('dst_tables/ChipModule');
    dst_models['ChipRegister'] = await db_dst.import('dst_tables/ChipRegister');
    dst_models['ChipBitgroup'] = await db_dst.import('dst_tables/ChipBitgroup');
    await require('./dst_tables/Relations').link(dst_models);

    var src_chip_list = await src_models['Chip'].findAll({logging: false});
    for (var i=0; i<src_chip_list.length; i++)
    {
        var chip_obj = src_chip_list[i].get({plain: true});
        //console.log('chip', chip_obj);  break;

        /* 查询目标数据库是否已经存在该芯片，如果不存在，则添加 */
        var [res, created] = await dst_models['Chip'].findOrCreate({logging: false, 
            where:{name: chip_obj.name}, defaults:{width: chip_obj.width}
        });
        var chip_obj_dst = res.get({plain: true});
        //console.log('chip dst', chip_obj_dst); break;

        var src_module_list = await src_models['ChipModule'].findAll({where:{ChipId: chip_obj.id}, logging: false});
        for (var j=0; j<src_module_list.length; j++)
        {
            var module_obj = src_module_list[j].get({plain: true});
            //console.log('module', module_obj);  break;

            /* 查询目标数据库是否已经存在对应芯片下的该模块，如果不存在，则添加 */
            var [res, created] = await dst_models['ChipModule'].findOrCreate({logging: false, 
                where:{name: module_obj.name, ChipId: chip_obj_dst.id}, defaults: {fullname: module_obj.fullname}
            });
            var module_obj_dst = res.get({plain: true});
            //console.log('module dst', module_obj_dst); break;

            var src_register_list = await src_models['ChipRegister'].findAll({where:{ChipModuleId: module_obj.id}, logging: false});
            for (var k=0; k<src_register_list.length; k++)
            {
                var register_obj = src_register_list[k].get({plain: true});
                //console.log('register', register_obj);  break;

                /* 查询目标数据库是否已经存在对应模块下的该寄存器，如果不存在，则添加 */
                var [res, created] = await dst_models['ChipRegister'].findOrCreate({logging:false,
                    where:{name: register_obj.name, ChipModuleId: module_obj_dst.id},
                    defaults:{fullname: register_obj.fullname, address: register_obj.address, desc: register_obj.desc}
                });
                var register_obj_dst = res.get({plain: true});
                //console.log('register dst', register_obj_dst);  break;

                var src_bitgroup_list = await src_models['ChipBit'].findAll({where:{ChipRegisterId: register_obj.id}, logging: false});
                for (var l=0; l<src_bitgroup_list.length; l++)
                {
                    var bitgroup_obj = src_bitgroup_list[l].get({plain: true});
                    //console.log('bitgroup', bitgroup_obj);  break;

                    /* 查询目标数据库是否已经存在对应寄存器下的该位组，如果不存在，则添加 */
                    await dst_models['ChipBitgroup'].findOrCreate({logging:false,
                        where:{name: bitgroup_obj.name, ChipRegisterId: register_obj_dst.id},
                        defaults:{
                            fullname: bitgroup_obj.fullname, 
                            bitlist: bitgroup_obj.bitlist, 
                            valuelist: bitgroup_obj.valuelist,
                            rw: bitgroup_obj.rw,
                            desc: bitgroup_obj.desc
                        }
                    });

                    bitgroupCount++;
                    process.stdout.write(bitgroupCount+', ');
                }
            }
        }
    }
}