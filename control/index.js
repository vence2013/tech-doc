const fs = require("fs")
const mysqldump = require('mysqldump');
const child_process = require('child_process');

var system_backup_message = '';


exports.get_backup_status = () => {
    return system_backup_message;
}

exports.backup = async (filename)=>{
    // 重新创建临时备份目录
    var extradir  = 'backup-extra';

    // 删除上次的备份
    system_backup_message = '1. remove previous backup files!'; 
    child_process.execSync("rm -fr /data/backup*");

    // 搜集备份文件
    system_backup_message = '2. collect extra file need to backuped!';
    child_process.execSync('mkdir /data/'+extradir);
    child_process.execSync('cp -f /web/.env /data/'+extradir+'/env');
    child_process.execSync('cp -fr /web/cert /data/'+extradir);

    // 加载配置文件， 以根目录的路径为基础
    system_backup_message = 'extra backup finished';
    const cfg = require('dotenv').config({ path: '/web/.env' }).parsed;

    // 备份数据库
    await mysqldump({
        connection: {
            host: cfg.MYSQL_HOST,
            user: 'root',
            password: cfg.MYSQL_ROOT_PASSWORD,
            database: cfg.SYSNAME,
        },
        dumpToFile: '/data/'+extradir+'/'+cfg.SYSNAME+'.sql',
    })

    // 打包备份文件
    system_backup_message = 'database backup finished';
    child_process.execSync('tar zcvf /data/'+filename+'.tgz -C /data upload '+extradir);

    system_backup_message = 'success';
}

exports.backup_file_info = async () => {
    var ret = null;
    var path = '/data';

    // 查找备份文件    
	var pa = fs.readdirSync(path);
	pa.forEach(function(ele,index){
		var info = fs.statSync(path+"/"+ele)	
		if(!info.isDirectory() && (/^backup.*\.tgz/.test(ele))){
            //console.log("file: "+ele, info);
            ret = {'name':ele, 'path':path+"/"+ele, 'size':info.size, 'mtime':info.mtime};
		}	
    })
    
    return ret;
}

exports.dummy = async()=>{
    
}